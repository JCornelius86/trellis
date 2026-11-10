import { describe, expect, it } from 'vitest';
import { assembleTask, type HandoffResult, type ProjectSnapshot, type ServiceStatus } from '@trellis/core';
import { createApp, parseDraft } from './app';
import { readConfig } from './config';
import { config, fakeFetch, FIGMA_TOKEN, frame, goal, issue14, now, pull15, TOKEN } from './fixtures';
import { buildSnapshot } from './snapshot';

const local = { host: 'localhost:8787' };
const write = { ...local, 'x-trellis': '1', 'content-type': 'application/json' };

describe('configuration', () => {
  it('explains what is missing instead of failing', () => {
    const empty = readConfig({});
    expect(empty.github).toBeNull();
    expect(empty.problems.github).toMatch(/GITHUB_TOKEN/);
    expect(readConfig({ GITHUB_TOKEN: 'x', GITHUB_REPO: 'not a repo' }).problems.github).toMatch(/owner\/name/);
  });

  it('accepts a whole Figma URL for the file key', () => {
    const c = readConfig({ GITHUB_TOKEN: 'x', GITHUB_REPO: 'acme/shop', FIGMA_TOKEN: 'y', FIGMA_FILE_KEY: 'https://www.figma.com/design/cLDDk36CONL4/Trellis?node-id=0-1' });
    expect(c.github).toEqual({ token: 'x', owner: 'acme', repo: 'shop' });
    expect(c.figma).toEqual({ token: 'y', fileKey: 'cLDDk36CONL4' });
  });
});

describe('GET /api/project', () => {
  it('builds the project from GitHub and Figma', async () => {
    const { impl } = fakeFetch();
    const response = await createApp(config, impl, () => now).request('/api/project', { headers: local });
    expect(response.status).toBe(200);
    const snapshot = (await response.json()) as ProjectSnapshot;

    expect(snapshot.name).toBe('Shop redesign');
    expect(snapshot.sample).toBe(false);
    expect(snapshot.flows.map((f) => [f.name, f.fidelity, f.round, f.taskNumbers])).toEqual([
      ['Payment', 'wireframes', 2, [14]],
      ['Cart', 'current', 1, []],
      ['Shift swap', 'new', 0, [20]],
    ]);
    // Only issues Trellis created become tasks.
    expect(snapshot.tasks.map((t) => [t.number, t.goal, t.assignedToCopilot])).toEqual([
      [20, 'A way for volunteers to swap shifts', false],
      [14, goal, true],
    ]);
    expect(snapshot.context.map((c) => [c.name, c.meta])).toEqual([
      ['brief.md', 'approved Nov 9'],
      ['assumptions.md', '1 open'],
    ]);
    expect(snapshot.assumptions[0]).toMatchObject({ id: 'A2', open: true });
    // An unresolved top-level comment on a frame is an open question on that flow. Replies and resolved comments are not.
    expect(snapshot.flows[0]!.openQuestions.map((q) => [q.id, q.askedBy.name])).toEqual([['c1', 'Maria Rivera']]);
    expect(snapshot.flows[1]!.openQuestions).toEqual([]);
    expect(snapshot.sources).toEqual({ github: { state: 'ok' }, figma: { state: 'ok' }, figmaComments: { state: 'ok' } });
  });

  it("labels Copilot's description as an AI summary, and a person's description as nothing at all", async () => {
    const { impl } = fakeFetch();
    const snapshot = (await (await createApp(config, impl, () => now).request('/api/project', { headers: local })).json()) as ProjectSnapshot;
    const summaries = snapshot.activity.filter((a) => a.trust === 'ai-summary');
    expect(summaries.map((a) => [a.text, a.sourceLabel, a.flowId])).toEqual([['Option B groups saved cards by expiry date.', 'PR #15', 'payment']]);
    expect(snapshot.activity.filter((a) => a.trust !== 'ai-summary').every((a) => a.trust === 'verified')).toBe(true);
    expect(snapshot.pullRequests.find((p) => p.number === 15)).toMatchObject({ author: { kind: 'copilot' }, mentions: [14], reviewed: false });
  });

  it('withholds questions when comments fail, and keeps the flows', async () => {
    const { impl } = fakeFetch({ 'GET api.figma.com/v1/files/FILEKEY/comments': () => ({ status: 500 }) });
    const snapshot = (await (await createApp(config, impl, () => now).request('/api/project', { headers: local })).json()) as ProjectSnapshot;
    expect(snapshot.sources.figmaComments.state).toBe('unavailable');
    expect(snapshot.flows.length).toBe(3);
    expect(snapshot.flows.every((f) => f.openQuestions.length === 0)).toBe(true);
    expect(snapshot.activity.some((a) => a.kind === 'comment')).toBe(false);
  });

  it('works without Figma and does not call it a failure', async () => {
    const { impl, calls } = fakeFetch();
    const snapshot = (await (await createApp({ ...config, figma: null }, impl, () => now).request('/api/project', { headers: local })).json()) as ProjectSnapshot;
    expect(snapshot.sources.figma.state).toBe('not-connected');
    expect(snapshot.name).toBe('shop');
    // With no Figma file, every open task still shows up as an idea, so nothing goes missing.
    expect(snapshot.flows.map((f) => [f.name, f.fidelity])).toEqual([
      ['Shift swap', 'new'],
      ['Payment', 'new'],
    ]);
    expect(calls.some((c) => c.key.includes('figma'))).toBe(false);
  });

  it('says so plainly when GitHub is down, without leaking the token', async () => {
    const { impl } = fakeFetch({ 'GET api.github.com/user': () => ({ status: 401 }) });
    const response = await createApp(config, impl).request('/api/project', { headers: local });
    expect(response.status).toBe(502);
    const body = await response.text();
    expect(body).toContain("GitHub didn't accept the token");
    expect(body).not.toContain(TOKEN);
  });
});

describe('POST /api/handoff', () => {
  const draft = { goal, flowName: 'Payment', frame, contextPaths: ['project/brief.md'] };

  it('creates the issue, assigns Copilot, and sends exactly the prepared task', async () => {
    const { impl, calls } = fakeFetch();
    const response = await createApp(config, impl, () => now).request('/api/handoff', { method: 'POST', headers: write, body: JSON.stringify(draft) });
    const result = (await response.json()) as HandoffResult;
    expect(result.outcome).toBe('assigned');
    if (result.outcome !== 'assigned') return;
    expect(result.task).toMatchObject({ number: 21, goal, flowId: 'payment', assignedToCopilot: true, frame: { name: frame.name } });

    const created = JSON.parse(String(calls.find((c) => c.key === 'POST api.github.com/repos/acme/shop/issues')!.init!.body));
    expect(created.body).toBe(assembleTask(draft).body);
    expect(created.labels).toEqual(['trellis']);
    const assign = JSON.parse(String(calls.find((c) => c.key.endsWith('/issues/21/assignees'))!.init!.body));
    expect(assign).toEqual({ assignees: ['copilot-swe-agent[bot]'] });
  });

  it('reports a partial success when GitHub ignores the assignee', async () => {
    const { impl } = fakeFetch({ 'POST api.github.com/repos/acme/shop/issues/21/assignees': () => ({ json: { ...issue14, number: 21, assignees: [] } }) });
    const result = (await (await createApp(config, impl).request('/api/handoff', { method: 'POST', headers: write, body: JSON.stringify(draft) })).json()) as HandoffResult;
    expect(result.outcome).toBe('created-not-assigned');
    if (result.outcome !== 'created-not-assigned') return;
    expect(result.task.assignedToCopilot).toBe(false);
    expect(result.reason).toMatch(/saved in the issue/);
  });

  it('reports a failure when no issue could be created', async () => {
    const { impl, calls } = fakeFetch({ 'POST api.github.com/repos/acme/shop/issues': () => ({ status: 403 }) });
    const result = (await (await createApp(config, impl).request('/api/handoff', { method: 'POST', headers: write, body: JSON.stringify(draft) })).json()) as HandoffResult;
    expect(result).toMatchObject({ outcome: 'failed' });
    expect(JSON.stringify(result)).toMatch(/No issue was created/);
    expect(calls.some((c) => c.key.includes('assignees'))).toBe(false);
  });

  it('names a new flow from the goal, so every teammate sees the same name', async () => {
    const { impl, calls } = fakeFetch();
    await createApp(config, impl).request('/api/handoff', { method: 'POST', headers: write, body: JSON.stringify({ goal: 'A way for volunteers to swap shifts', contextPaths: [] }) });
    const created = JSON.parse(String(calls.find((c) => c.key === 'POST api.github.com/repos/acme/shop/issues')!.init!.body));
    expect(created.body).toContain('"flow":"A way for volunteers"');
  });

  it('refuses drafts in the wrong shape', async () => {
    expect(parseDraft({ goal: '  ', contextPaths: [] })).toBeNull();
    expect(parseDraft({ goal: 'x', contextPaths: ['../../.env'] })).toBeNull();
    expect(parseDraft({ goal: 'x', contextPaths: [], frame: { name: 'a', page: 'b', url: 'https://evil.example/x' } })).toBeNull();
    expect(parseDraft({ goal: 'x', contextPaths: ['project/brief.md'] })).toMatchObject({ goal: 'x', frame: null });
    const { impl } = fakeFetch();
    const response = await createApp(config, impl).request('/api/handoff', { method: 'POST', headers: write, body: '{"goal":""}' });
    expect(response.status).toBe(400);
  });
});

describe('keeping tokens safe', () => {
  it('only answers on localhost, and only accepts writes with the Trellis header', async () => {
    const { impl, calls } = fakeFetch();
    const app = createApp(config, impl);
    expect((await app.request('/api/status', { headers: { host: 'evil.example' } })).status).toBe(403);
    expect((await app.request('/api/handoff', { method: 'POST', headers: { ...local, 'content-type': 'application/json' }, body: '{}' })).status).toBe(403);
    expect(calls.length).toBe(0);
  });

  it('never returns a token in any response', async () => {
    const { impl } = fakeFetch();
    const app = createApp(config, impl, () => now);
    const status = await app.request('/api/status', { headers: local });
    const parsed = (await status.clone().json()) as ServiceStatus;
    expect(parsed.github).toMatchObject({ state: 'ok', login: 'jc', repo: 'acme/shop' });
    for (const response of [status, await app.request('/api/project', { headers: local })]) {
      const body = await response.text();
      expect(body).not.toContain(TOKEN);
      expect(body).not.toContain(FIGMA_TOKEN);
    }
  });

  it('reports what is not connected without calling anything', async () => {
    const { impl, calls } = fakeFetch();
    const status = (await (await createApp(readConfig({}), impl).request('/api/status', { headers: local })).json()) as ServiceStatus;
    expect(status.github.state).toBe('not-connected');
    expect(status.figma.state).toBe('not-connected');
    expect(calls.length).toBe(0);
  });
});

describe('prototype rule', () => {
  it('marks a Current flow as prototyped when a task scoped to a Current frame has a pull request', () => {
    const body = assembleTask({ goal: 'Prototype the agreed cart flow.', flowName: 'Cart', frame: { id: '2:2', name: 'Cart / Items / Default', page: 'Current', url: 'https://www.figma.com/design/FILEKEY?node-id=2-2' }, contextPaths: [] }).body;
    const snapshot = buildSnapshot({
      now,
      github: {
        viewer: 'jc',
        repo: { name: 'shop', full_name: 'acme/shop', html_url: 'https://github.com/acme/shop' },
        files: [],
        issues: [{ ...issue14, number: 30, body, assignees: [{ login: 'Copilot' }] } as never],
        pulls: [{ ...pull15, number: 31, title: 'Cart prototype', body: 'Closes #30' } as never],
        reviewed: [],
      },
      figma: { fileKey: 'FILEKEY', name: 'Shop', pages: [{ name: '✅ Current', sections: [{ id: '2:1', name: 'Cart · 2026-11-03', frames: [{ id: '2:2', name: 'Cart / Items / Default' }] }] }], versions: [], comments: [] },
    });
    expect(snapshot.flows[0]).toMatchObject({ name: 'Cart', fidelity: 'current', prototypePr: 31, taskNumbers: [30] });
  });
});
