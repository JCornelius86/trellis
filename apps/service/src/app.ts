import { Hono } from 'hono';
import { assembleTask, flowNameFromGoal, type HandoffResult, type ServiceStatus, type SourceState, type TaskDraft } from '@trellis/core';
import type { Config } from './config';
import * as figmaApi from './figma';
import * as githubApi from './github';
import { reasonOf, type Fetch } from './http';
import { buildSnapshot, issueToTask, type FigmaData } from './snapshot';

/**
 * The local service. It is the only place tokens live: the browser asks this
 * service, and this service asks GitHub and Figma.
 *
 *   GET  /api/status   what is connected
 *   GET  /api/project  everything the hub shows, read fresh each time
 *   POST /api/handoff  create the issue and assign Copilot (decision D3)
 */

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function createApp(config: Config, fetchImpl: Fetch = fetch, clock: () => Date = () => new Date()) {
  const app = new Hono();
  const github = config.github ? { fetch: fetchImpl, ...config.github } : null;
  const figma = config.figma ? { fetch: fetchImpl, ...config.figma } : null;

  // Only answer requests addressed to this computer, and only accept writes
  // that carry a header other websites can't add. Together these stop another
  // site from quietly using your tokens through your browser.
  app.use('/api/*', async (c, next) => {
    if (!LOCAL_HOST.test(c.req.header('host') ?? '')) return c.json({ error: 'Trellis only answers on localhost.' }, 403);
    if (c.req.method !== 'GET' && c.req.header('x-trellis') !== '1') return c.json({ error: 'Missing X-Trellis header.' }, 403);
    await next();
  });

  async function figmaStatus(): Promise<SourceState> {
    if (!figma) return { state: 'not-connected', reason: config.problems.figma };
    try {
      await figmaApi.filePages(figma);
      return { state: 'ok' };
    } catch (error) {
      return { state: 'unavailable', reason: reasonOf(error, "Figma couldn't be reached.") };
    }
  }

  app.get('/api/status', async (c) => {
    const status: ServiceStatus = {
      github: { state: 'not-connected', reason: config.problems.github },
      figma: { ...(await figmaStatus()), fileKey: figma?.fileKey },
    };
    if (github) {
      try {
        const [user, repo] = await Promise.all([githubApi.viewer(github), githubApi.repoInfo(github)]);
        status.github = { state: 'ok', login: user.login, repo: repo.full_name };
      } catch (error) {
        status.github = { state: 'unavailable', reason: reasonOf(error, "GitHub couldn't be reached.") };
      }
    }
    return c.json(status);
  });

  async function readFigma(): Promise<FigmaData | SourceState> {
    if (!figma) return { state: 'not-connected' };
    try {
      const [file, versions] = await Promise.all([figmaApi.filePages(figma), figmaApi.versions(figma).catch(() => [])]);
      // Comments are read separately, so a failure there withholds questions without hiding the flows.
      let comments: figmaApi.FigmaComment[] | null = null;
      let commentsReason: string | undefined;
      try {
        comments = await figmaApi.comments(figma);
      } catch (error) {
        commentsReason = reasonOf(error, "Figma comments couldn't be reached.").replace(/^Figma/, 'Figma comments:');
      }
      return { fileKey: figma.fileKey, name: file.name, pages: file.pages, versions, comments, commentsReason };
    } catch (error) {
      return { state: 'unavailable', reason: reasonOf(error, "Figma couldn't be reached.") };
    }
  }

  app.get('/api/project', async (c) => {
    if (!github) return c.json({ error: config.problems.github ?? 'GitHub is not connected.' }, 409);
    try {
      const [user, repo, files, issues, pulls, figmaData] = await Promise.all([
        githubApi.viewer(github),
        githubApi.repoInfo(github),
        githubApi.contextFiles(github),
        githubApi.issues(github),
        githubApi.pulls(github),
        readFigma(),
      ]);
      const open = pulls.filter((p) => p.state === 'open').slice(0, 10);
      const reviewedFlags = await Promise.all(open.map((p) => githubApi.isReviewed(github, p).catch(() => false)));
      const reviewed = open.filter((_, i) => reviewedFlags[i]).map((p) => p.number);
      return c.json(buildSnapshot({ github: { viewer: user.login, repo, files, issues, pulls, reviewed }, figma: figmaData, now: clock() }));
    } catch (error) {
      return c.json({ error: reasonOf(error, "GitHub couldn't be reached.") }, 502);
    }
  });

  app.post('/api/handoff', async (c) => {
    if (!github) return c.json({ error: config.problems.github ?? 'GitHub is not connected.' }, 409);
    const draft = parseDraft(await c.req.json().catch(() => null));
    if (!draft) return c.json({ error: 'The task was missing a goal, or had a field in the wrong shape.' }, 400);

    const prepared = assembleTask({ ...draft, flowName: draft.flowName ?? flowNameFromGoal(draft.goal) });
    const fullName = `${github.owner}/${github.repo}`;

    let issue: githubApi.GhIssue;
    try {
      issue = await githubApi.createIssue(github, prepared.title, prepared.body);
    } catch (error) {
      const result: HandoffResult = { outcome: 'failed', reason: `${reasonOf(error, "GitHub couldn't be reached.")} No issue was created.` };
      return c.json(result);
    }

    let assigned = false;
    let why = `Copilot's coding agent may not be enabled for ${fullName}, or this token can't assign it.`;
    try {
      assigned = await githubApi.assignCopilot(github, issue.number);
    } catch (error) {
      why = reasonOf(error, why);
    }

    const task = issueToTask({ ...issue, assignees: assigned ? [{ login: githubApi.COPILOT_ASSIGNEE }] : [] });
    if (!task) return c.json({ outcome: 'failed', reason: 'The issue was created, but Trellis could not read it back.' } satisfies HandoffResult);

    const result: HandoffResult = assigned
      ? { outcome: 'assigned', task }
      : { outcome: 'created-not-assigned', task, reason: `${why} Your task is saved in the issue, so nothing is lost.` };
    return c.json(result);
  });

  return app;
}

const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max;

/** Checks what the browser sent before any of it goes to GitHub. */
export function parseDraft(input: unknown): TaskDraft | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  if (!text(raw.goal, 5000) || raw.goal.trim() === '') return null;
  if (raw.flowName !== undefined && raw.flowName !== null && !text(raw.flowName, 120)) return null;
  const paths = raw.contextPaths;
  if (!Array.isArray(paths) || paths.length > 20 || !paths.every((p) => text(p, 200) && /^project\/[\w.-]+\.md$/.test(p))) return null;

  let frame: TaskDraft['frame'] = null;
  if (raw.frame) {
    const f = raw.frame as Record<string, unknown>;
    if (!text(f.name, 200) || !text(f.page, 80) || !text(f.url, 500) || !/^https:\/\/(www\.)?figma\.com\//.test(f.url)) return null;
    frame = { id: text(f.id, 40) ? f.id : '', name: f.name, page: f.page, url: f.url };
  }
  return { goal: raw.goal, flowName: (raw.flowName as string | undefined) ?? undefined, frame, contextPaths: paths as string[] };
}
