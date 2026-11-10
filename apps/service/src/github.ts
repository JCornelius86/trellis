import { isCopilotLogin } from '@trellis/core';
import { getJson, getText, SourceError, type Fetch } from './http';

/** The few GitHub REST calls Trellis needs. Each returns only the fields that are used. */

export interface GitHubContext {
  fetch: Fetch;
  token: string;
  owner: string;
  repo: string;
}

export interface GhUser {
  login: string;
}
export interface GhRepo {
  name: string;
  full_name: string;
  html_url: string;
}
export interface GhIssue {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: 'open' | 'closed';
  created_at: string;
  user: GhUser | null;
  assignees: GhUser[];
  pull_request?: unknown;
}
export interface GhPull {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: 'open' | 'closed';
  created_at: string;
  merged_at: string | null;
  user: GhUser | null;
  requested_reviewers: GhUser[];
}
interface GhContent {
  type: string;
  name: string;
  path: string;
  html_url: string;
}
interface GhReview {
  user: GhUser | null;
}

/** The login GitHub uses for Copilot's coding agent when assigning issues through the API. */
export const COPILOT_ASSIGNEE = 'copilot-swe-agent[bot]';

const API = 'https://api.github.com';

function headers(ctx: GitHubContext, accept = 'application/vnd.github+json'): Record<string, string> {
  return {
    Accept: accept,
    Authorization: `Bearer ${ctx.token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'trellis-local-service',
  };
}

const repoPath = (ctx: GitHubContext) => `${API}/repos/${ctx.owner}/${ctx.repo}`;

export function viewer(ctx: GitHubContext) {
  return getJson<GhUser>(ctx.fetch, 'GitHub', `${API}/user`, { headers: headers(ctx) });
}

export function repoInfo(ctx: GitHubContext) {
  return getJson<GhRepo>(ctx.fetch, 'GitHub', repoPath(ctx), { headers: headers(ctx) });
}

/** The markdown files in project/, with their text. A repository without the folder simply has none. */
export async function contextFiles(ctx: GitHubContext): Promise<{ path: string; text: string; url: string }[]> {
  let listing: GhContent[];
  try {
    listing = await getJson<GhContent[]>(ctx.fetch, 'GitHub', `${repoPath(ctx)}/contents/project`, { headers: headers(ctx) });
  } catch (error) {
    if (error instanceof SourceError && error.status === 404) return [];
    throw error;
  }
  const files = listing.filter((entry) => entry.type === 'file' && entry.name.endsWith('.md'));
  return Promise.all(
    files.map(async (file) => ({
      path: file.path,
      url: file.html_url,
      text: await getText(ctx.fetch, 'GitHub', `${repoPath(ctx)}/contents/${file.path}`, { headers: headers(ctx, 'application/vnd.github.raw+json') }),
    })),
  );
}

/** Recent issues, newest first. GitHub lists pull requests here too, so those are dropped. */
export async function issues(ctx: GitHubContext): Promise<GhIssue[]> {
  const all = await getJson<GhIssue[]>(ctx.fetch, 'GitHub', `${repoPath(ctx)}/issues?state=all&per_page=50&sort=created&direction=desc`, { headers: headers(ctx) });
  return all.filter((issue) => !issue.pull_request);
}

export function pulls(ctx: GitHubContext) {
  return getJson<GhPull[]>(ctx.fetch, 'GitHub', `${repoPath(ctx)}/pulls?state=all&per_page=30&sort=created&direction=desc`, { headers: headers(ctx) });
}

/** True when someone other than the author has reviewed the pull request. */
export async function isReviewed(ctx: GitHubContext, pull: GhPull): Promise<boolean> {
  const reviews = await getJson<GhReview[]>(ctx.fetch, 'GitHub', `${repoPath(ctx)}/pulls/${pull.number}/reviews?per_page=30`, { headers: headers(ctx) });
  return reviews.some((review) => review.user && review.user.login !== pull.user?.login);
}

export function createIssue(ctx: GitHubContext, title: string, body: string) {
  return getJson<GhIssue>(ctx.fetch, 'GitHub', `${repoPath(ctx)}/issues`, {
    method: 'POST',
    headers: { ...headers(ctx), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, labels: ['trellis'] }),
  });
}

/**
 * Asks GitHub to assign Copilot's coding agent. GitHub quietly ignores
 * assignees it can't use, so the answer is checked: Copilot only counts as
 * assigned if it is in the list that comes back.
 */
export async function assignCopilot(ctx: GitHubContext, issueNumber: number): Promise<boolean> {
  const issue = await getJson<GhIssue>(ctx.fetch, 'GitHub', `${repoPath(ctx)}/issues/${issueNumber}/assignees`, {
    method: 'POST',
    headers: { ...headers(ctx), 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignees: [COPILOT_ASSIGNEE] }),
  });
  return issue.assignees.some((assignee) => isCopilotLogin(assignee.login));
}
