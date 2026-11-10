import { assembleTask } from '@trellis/core';
import type { Config } from './config';

/**
 * A stand-in for GitHub and Figma, used by the tests. Nothing here is real:
 * the tokens are made-up strings, and no request leaves the machine.
 */

export const TOKEN = 'not-a-real-github-token';
export const FIGMA_TOKEN = 'not-a-real-figma-token';
export const config: Config = { port: 8787, github: { token: TOKEN, owner: 'acme', repo: 'shop' }, figma: { token: FIGMA_TOKEN, fileKey: 'FILEKEY' }, problems: {} };
export const now = new Date('2026-11-11T14:42:00Z');

export const goal = 'Explore two ways to show saved cards on the payment step. Keep the total visible on small screens.';
export const frame = { id: '1:4', name: 'Payment / Card list / Option B', page: 'Wireframes', url: 'https://www.figma.com/design/FILEKEY?node-id=1-4' };
const taskBody = assembleTask({ goal, flowName: 'Payment', frame, contextPaths: ['project/brief.md'] }).body;

export const issue14 = { number: 14, title: 'Explore two ways', body: taskBody, html_url: 'https://github.com/acme/shop/issues/14', state: 'open', created_at: '2026-11-09T21:12:00Z', user: { login: 'jc' }, assignees: [{ login: 'Copilot' }] };
const ideaBody = assembleTask({ goal: 'A way for volunteers to swap shifts', flowName: 'Shift swap', contextPaths: [] }).body;
const issue20 = { number: 20, title: 'A way for volunteers to swap shifts', body: ideaBody, html_url: 'https://github.com/acme/shop/issues/20', state: 'open', created_at: '2026-11-10T10:00:00Z', user: { login: 'jc' }, assignees: [] };
const plainIssue = { number: 5, title: 'Typo in footer', body: 'not from Trellis', html_url: 'https://github.com/acme/shop/issues/5', state: 'open', created_at: '2026-11-01T10:00:00Z', user: { login: 'sam' }, assignees: [] };

export const pull15 = { number: 15, title: 'Payment wireframes', body: 'Option B groups saved cards by expiry date.\n\nCloses #14', html_url: 'https://github.com/acme/shop/pull/15', state: 'open', created_at: '2026-11-10T15:05:00Z', merged_at: null, user: { login: 'copilot-swe-agent[bot]' }, requested_reviewers: [] };
const pull16 = { number: 16, title: 'Fix footer typo', body: 'Fixes #5', html_url: 'https://github.com/acme/shop/pull/16', state: 'closed', created_at: '2026-11-02T15:05:00Z', merged_at: '2026-11-03T10:00:00Z', user: { login: 'sam' }, requested_reviewers: [] };

const figmaFile = {
  name: 'Shop redesign',
  document: {
    id: '0:0',
    name: 'Document',
    type: 'DOCUMENT',
    children: [
      { id: '0:1', name: '📖 Read me', type: 'CANVAS', children: [] },
      { id: '0:2', name: '---', type: 'CANVAS', children: [] },
      {
        id: '0:3',
        name: '✏️ Wireframes (lo-fi)',
        type: 'CANVAS',
        children: [
          { id: '1:1', name: 'Payment · 2026-11-09', type: 'SECTION', children: [{ id: '1:2', name: 'Payment / Card list / Default', type: 'FRAME' }] },
          { id: '1:3', name: 'Payment · 2026-11-10', type: 'SECTION', children: [{ id: '1:4', name: 'Payment / Card list / Option B', type: 'FRAME' }, { id: '1:5', name: 'note', type: 'TEXT' }] },
          { id: '1:9', name: 'Scratch', type: 'FRAME' },
        ],
      },
      { id: '0:4', name: '✅ Current', type: 'CANVAS', children: [{ id: '2:1', name: 'Cart · 2026-11-03', type: 'SECTION', children: [{ id: '2:2', name: 'Cart / Items / Default', type: 'FRAME' }] }] },
    ],
  },
};
const figmaComments = {
  comments: [
    { id: 'c1', message: 'Do we need the total twice?', created_at: '2026-11-10T16:00:00Z', resolved_at: null, user: { handle: 'Maria Rivera' }, client_meta: { node_id: '1:4' } },
    { id: 'c2', message: 'Done', created_at: '2026-11-10T16:10:00Z', resolved_at: null, parent_id: 'c1', user: { handle: 'JC' }, client_meta: { node_id: '1:4' } },
    { id: 'c3', message: 'Old one', created_at: '2026-11-04T16:00:00Z', resolved_at: '2026-11-05T09:00:00Z', user: { handle: 'JC' }, client_meta: { node_id: '2:2' } },
  ],
};
const figmaVersions = { versions: [{ id: 'v1', created_at: '2026-11-11T14:37:00Z', label: null, description: null, user: { handle: 'Maria Rivera' } }] };

export type Handler = (init: RequestInit | undefined) => { status?: number; json?: unknown; text?: string };

/** A stand-in for GitHub and Figma. It records every call, so tests can check what was sent. */
export function fakeFetch(overrides: Record<string, Handler> = {}) {
  const calls: { key: string; init?: RequestInit }[] = [];
  const routes: Record<string, Handler> = {
    'GET api.github.com/user': () => ({ json: { login: 'jc' } }),
    'GET api.github.com/repos/acme/shop': () => ({ json: { name: 'shop', full_name: 'acme/shop', html_url: 'https://github.com/acme/shop' } }),
    'GET api.github.com/repos/acme/shop/contents/project': () => ({ json: [{ type: 'file', name: 'brief.md', path: 'project/brief.md', html_url: 'https://github.com/acme/shop/blob/main/project/brief.md' }, { type: 'file', name: 'assumptions.md', path: 'project/assumptions.md', html_url: 'https://github.com/acme/shop/blob/main/project/assumptions.md' }, { type: 'dir', name: 'old', path: 'project/old', html_url: '' }] }),
    'GET api.github.com/repos/acme/shop/contents/project/brief.md': () => ({ text: '# Brief\n\nStatus: approved · Date: 2026-11-09' }),
    'GET api.github.com/repos/acme/shop/contents/project/assumptions.md': () => ({ text: '# Assumptions\n\n## A2 · Copilot has Figma access\nDate: 2026-11-09 · Status: open\n' }),
    'GET api.github.com/repos/acme/shop/issues': () => ({ json: [issue20, issue14, plainIssue, { ...plainIssue, number: 15, pull_request: {} }] }),
    'GET api.github.com/repos/acme/shop/pulls': () => ({ json: [pull15, pull16] }),
    'GET api.github.com/repos/acme/shop/pulls/15/reviews': () => ({ json: [] }),
    'POST api.github.com/repos/acme/shop/issues': (init) => ({ json: { number: 21, title: JSON.parse(String(init?.body)).title, body: JSON.parse(String(init?.body)).body, html_url: 'https://github.com/acme/shop/issues/21', state: 'open', created_at: now.toISOString(), user: { login: 'jc' }, assignees: [] } }),
    'POST api.github.com/repos/acme/shop/issues/21/assignees': () => ({ json: { ...issue14, number: 21, assignees: [{ login: 'Copilot' }] } }),
    'GET api.figma.com/v1/files/FILEKEY': () => ({ json: figmaFile }),
    'GET api.figma.com/v1/files/FILEKEY/versions': () => ({ json: figmaVersions }),
    'GET api.figma.com/v1/files/FILEKEY/comments': () => ({ json: figmaComments }),
    ...overrides,
  };
  const impl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const key = `${init?.method ?? 'GET'} ${url.host}${url.pathname}`;
    calls.push({ key, init });
    const handler = routes[key];
    if (!handler) return new Response('{}', { status: 404 });
    const { status = 200, json, text } = handler(init);
    return new Response(text ?? JSON.stringify(json ?? {}), { status });
  }) as typeof fetch;
  return { impl, calls };
}

