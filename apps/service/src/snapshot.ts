import {
  cleanPageName,
  describeContextFile,
  fidelityOfPage,
  figmaNodeUrl,
  flowIdFor,
  flowsFromFigma,
  goalFromBody,
  isCopilotLogin,
  parseAssumptions,
  parseMarker,
  parseSectionName,
  person,
  plural,
  slug,
  type ActivityItem,
  type FigmaPageLite,
  type Flow,
  type Person,
  type ProjectSnapshot,
  type PullRequest,
  type SourceState,
  type Task,
} from '@trellis/core';
import type { FigmaComment, FigmaVersion } from './figma';
import type { GhIssue, GhPull, GhRepo } from './github';

/**
 * Turns what GitHub and Figma returned into the one shape the hub shows.
 * Nothing here calls the network, so it can be tested with plain objects.
 */

export interface GitHubData {
  viewer: string;
  repo: GhRepo;
  files: { path: string; text: string; url: string }[];
  issues: GhIssue[];
  pulls: GhPull[];
  /** Numbers of pull requests that someone other than the author has reviewed. */
  reviewed: number[];
}

export interface FigmaData {
  fileKey: string;
  name: string;
  pages: FigmaPageLite[];
  versions: FigmaVersion[];
  /** Null when comments couldn't be read. Then no questions are shown at all. */
  comments: FigmaComment[] | null;
  commentsReason?: string;
}

export interface SnapshotInput {
  github: GitHubData;
  /** Figma data, or the reason there is none. */
  figma: FigmaData | SourceState;
  now: Date;
}

export function issueToTask(issue: GhIssue): Task | null {
  const marker = parseMarker(issue.body);
  if (!marker) return null;
  return {
    number: issue.number,
    title: issue.title,
    goal: goalFromBody(issue.body) ?? issue.title,
    url: issue.html_url,
    flowId: flowIdFor(marker.flow),
    flowName: marker.flow,
    frame: marker.frame,
    contextPaths: marker.context,
    createdAt: issue.created_at,
    createdBy: person(issue.user?.login ?? 'unknown'),
    assignedToCopilot: issue.assignees.some((a) => isCopilotLogin(a.login)),
    state: issue.state,
  };
}

function mentions(text: string): number[] {
  return [...new Set([...text.matchAll(/#(\d+)\b/g)].map((m) => Number(m[1])))];
}

/** The first paragraph of a description, without markdown headings, kept short. */
function firstParagraph(body: string | null): string | undefined {
  const paragraph = (body ?? '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#') && !p.startsWith('- ['));
  if (!paragraph) return undefined;
  const flat = paragraph.replace(/\s+/g, ' ');
  return flat.length > 220 ? `${flat.slice(0, 219).trimEnd()}…` : flat;
}

function pullToPullRequest(pull: GhPull, reviewed: Set<number>): PullRequest {
  return {
    number: pull.number,
    title: pull.title,
    url: pull.html_url,
    author: person(pull.user?.login ?? 'unknown'),
    state: pull.merged_at ? 'merged' : pull.state,
    createdAt: pull.created_at,
    mergedAt: pull.merged_at ?? undefined,
    reviewers: pull.requested_reviewers.map((r) => person(r.login)),
    reviewed: reviewed.has(pull.number),
    mentions: mentions(`${pull.title}\n${pull.body ?? ''}`),
    summary: firstParagraph(pull.body),
  };
}

/** Figma has display names, not @logins. */
function figmaPerson(handle: string | undefined): Person {
  const name = handle?.trim() || 'Someone';
  return { login: slug(name) || 'someone', name, kind: 'person' };
}

function isFigmaData(figma: FigmaData | SourceState): figma is FigmaData {
  return 'pages' in figma;
}

export function buildSnapshot({ github, figma, now }: SnapshotInput): ProjectSnapshot {
  const tasks = github.issues.map(issueToTask).filter((t): t is Task => t !== null);
  const reviewed = new Set(github.reviewed);
  const pullRequests = github.pulls.map((p) => pullToPullRequest(p, reviewed));
  const context = github.files.map((f) => describeContextFile(f.path, f.text, f.url));
  const assumptionsFile = github.files.find((f) => f.path.endsWith('assumptions.md'));
  const assumptions = assumptionsFile ? parseAssumptions(assumptionsFile.text, assumptionsFile.url) : [];

  const activity: ActivityItem[] = [];
  let flows: Flow[] = [];
  let figmaState: SourceState;
  let commentsState: SourceState;

  if (isFigmaData(figma)) {
    figmaState = { state: 'ok' };
    flows = flowsFromFigma(figma.pages, figma.fileKey);

    // Which flow each section and frame belongs to, so comments can be placed.
    const flowOfNode = new Map<string, string>();
    for (const page of figma.pages) {
      const pageName = cleanPageName(page.name);
      const onFlowPage = fidelityOfPage(page.name) !== null;
      for (const section of page.sections) {
        const parsed = parseSectionName(section.name);
        if (!parsed || !onFlowPage || !pageName) continue;
        const flowId = slug(parsed.flow);
        flowOfNode.set(section.id, flowId);
        for (const frame of section.frames) flowOfNode.set(frame.id, flowId);
        activity.push({
          id: `figma-section-${section.id}`,
          at: parsed.date,
          dateOnly: true,
          text: `${plural(section.frames.length, 'frame')} saved in ${pageName.replace(/\s*\(.*\)$/, '')} · ${section.name}`,
          source: 'figma',
          trust: 'verified',
          sourceLabel: 'Figma',
          flowId,
          url: figmaNodeUrl(figma.fileKey, section.id),
        });
      }
    }

    if (figma.comments) {
      commentsState = { state: 'ok' };
      for (const comment of figma.comments) {
        if (comment.parent_id) continue;
        const nodeId = comment.client_meta?.node_id;
        const flowId = nodeId ? flowOfNode.get(nodeId) : undefined;
        const flow = flows.find((f) => f.id === flowId);
        if (!flow || !nodeId) continue;
        const by = figmaPerson(comment.user?.handle);
        const url = `${figmaNodeUrl(figma.fileKey, nodeId)}#${comment.id}`;
        if (!comment.resolved_at) flow.openQuestions.push({ id: comment.id, askedBy: by, askedAt: comment.created_at, text: comment.message, url });
        activity.push({ id: `figma-comment-${comment.id}`, at: comment.created_at, text: `asked on ${flow.name}`, kind: 'comment', actor: by, source: 'figma', trust: 'verified', sourceLabel: 'Figma', flowId, url });
      }
    } else {
      commentsState = { state: 'unavailable', reason: figma.commentsReason ?? "Figma comments couldn't be reached." };
    }

    for (const version of figma.versions.slice(0, 10)) {
      if (!version.user) continue;
      const text = version.label ? `saved a version: “${version.label}”` : 'edited the Figma file';
      const named = flows.find((f) => version.label?.toLowerCase().includes(f.name.toLowerCase()));
      activity.push({ id: `figma-version-${version.id}`, at: version.created_at, text, actor: figmaPerson(version.user.handle), source: 'figma', trust: 'verified', sourceLabel: 'Figma', flowId: named?.id });
    }
  } else {
    figmaState = figma;
    commentsState = figma;
  }

  // Tasks belong to flows by name. A task whose flow has no Figma section yet becomes a "new" flow.
  for (const task of tasks) {
    if (!task.flowId) continue;
    let flow = flows.find((f) => f.id === task.flowId);
    if (!flow && task.state === 'open') {
      flow = { id: task.flowId, name: task.flowName ?? task.title, fidelity: 'new', round: 0, frames: [], openQuestions: [], taskNumbers: [] };
      flows.push(flow);
    }
    flow?.taskNumbers.push(task.number);
  }

  const flowOfTask = new Map(tasks.map((t) => [t.number, t.flowId]));
  for (const task of tasks) {
    activity.push({
      id: `task-${task.number}`,
      at: task.createdAt,
      text: task.assignedToCopilot ? `Handed off · issue #${task.number} assigned to Copilot` : `Issue #${task.number} created, not assigned`,
      source: 'github',
      trust: 'verified',
      sourceLabel: 'GitHub',
      flowId: task.flowId,
      taskNumber: task.number,
      url: task.url,
    });
  }

  for (const pr of pullRequests) {
    const taskNumber = pr.mentions.find((n) => flowOfTask.has(n));
    const flowId = taskNumber !== undefined ? flowOfTask.get(taskNumber) : undefined;
    const who = pr.author.kind === 'copilot' ? 'Copilot' : `@${pr.author.login}`;
    activity.push({ id: `pr-${pr.number}-opened`, at: pr.createdAt, text: `PR #${pr.number} opened by ${who}`, source: 'github', trust: 'verified', sourceLabel: 'GitHub', flowId, taskNumber, url: pr.url });
    if (pr.author.kind === 'copilot' && pr.summary) {
      // Copilot wrote this description, so it is shown as an AI summary, never as a verified fact.
      activity.push({ id: `pr-${pr.number}-summary`, at: new Date(new Date(pr.createdAt).getTime() + 1000).toISOString(), text: pr.summary, source: 'github', trust: 'ai-summary', sourceLabel: `PR #${pr.number}`, flowId, taskNumber, url: pr.url });
    }
    if (pr.mergedAt) {
      activity.push({ id: `pr-${pr.number}-merged`, at: pr.mergedAt, text: `PR #${pr.number} merged`, source: 'github', trust: 'verified', sourceLabel: 'GitHub', flowId, taskNumber, url: pr.url });
    }
  }

  // A flow on Current counts as prototyped when a task scoped to a Current frame has a pull request.
  for (const flow of flows) {
    if (flow.fidelity !== 'current') continue;
    const built = tasks.filter((t) => t.flowId === flow.id && t.frame?.page === 'Current').map((t) => t.number);
    flow.prototypePr = pullRequests.find((pr) => pr.state !== 'closed' && pr.mentions.some((n) => built.includes(n)))?.number;
  }

  const brief = github.files.find((f) => f.path.endsWith('brief.md'));
  const figmaInfo = isFigmaData(figma) ? { name: figma.name, url: `https://www.figma.com/design/${figma.fileKey}` } : undefined;

  return {
    id: 'local',
    name: figmaInfo?.name ?? github.repo.name,
    sample: false,
    repo: { fullName: github.repo.full_name, url: github.repo.html_url },
    figma: figmaInfo,
    links: [...(brief ? [{ label: 'Brief', url: brief.url }] : []), ...(figmaInfo ? [{ label: 'Figma file', url: figmaInfo.url }] : []), { label: 'Repository', url: github.repo.html_url }],
    syncedAt: now.toISOString(),
    viewer: person(github.viewer),
    flows,
    tasks,
    pullRequests,
    context,
    assumptions,
    activity,
    sources: { github: { state: 'ok' }, figma: figmaState, figmaComments: commentsState },
  };
}
