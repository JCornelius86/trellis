import type { TaskDraft } from './types';
import { slug } from './figma-names';

/**
 * Assembles the prepared task (D8). Nothing here is generated: the goal is
 * used as written, and the frame and context lines come from Figma and the
 * repo. The preview in the composer and the issue body are built from the
 * same sections, so what you see is what gets sent.
 */

export interface PreparedSection {
  key: 'goal' | 'frame' | 'context';
  label: string;
  /** Where the lines came from, shown beside the label. */
  origin: string;
  lines: string[];
}

export interface TaskMarker {
  v: 1;
  flow?: string;
  frame?: { name: string; page: string; url: string };
  context: string[];
}

export interface PreparedTask {
  title: string;
  sections: PreparedSection[];
  /** Markdown for the GitHub issue. */
  body: string;
  /** Plain text for the copy-and-paste fallback. */
  text: string;
  marker: TaskMarker;
}

const TITLE_MAX = 72;

/** First sentence of the goal, trimmed to a readable issue title. */
export function titleFromGoal(goal: string): string {
  const clean = goal.trim().replace(/\s+/g, ' ');
  const first = /^(.+?[.!?])(\s|$)/.exec(clean)?.[1] ?? clean;
  const base = first.replace(/[.!?]+$/, '');
  if (base.length <= TITLE_MAX) return base;
  const cut = base.slice(0, TITLE_MAX - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 40)).trimEnd()}…`;
}

const TRAILING = new Set(['a', 'an', 'the', 'to', 'for', 'of', 'on', 'in', 'with', 'and', 'or', 'at', 'by', 'from', 'that', 'so', 'is', 'as']);

/**
 * A working name for a flow that has no Figma section yet: the first few words
 * of the goal, without a dangling "for" or "to" at the end. The team gives the
 * flow its real name when they name the section in Figma.
 */
export function flowNameFromGoal(goal: string): string {
  const words = titleFromGoal(goal)
    .split(' ')
    .slice(0, 5)
    .map((word) => word.replace(/[,;:….]+$/, ''));
  while (words.length > 1 && TRAILING.has(words[words.length - 1]!.toLowerCase())) words.pop();
  return words.join(' ');
}

export function assembleTask(draft: TaskDraft): PreparedTask {
  const goal = draft.goal.trim();
  const frame = draft.frame ?? undefined;

  const frameLines = frame
    ? [`${frame.name} · ${frame.page}`, frame.url]
    : ['No frame attached. New frames go on the Wireframes page of the project file.'];
  const contextLines =
    draft.contextPaths.length > 0
      ? draft.contextPaths
      : ['None yet. Draft project/brief.md as a pull request before designing.'];

  const sections: PreparedSection[] = [
    { key: 'goal', label: 'Goal', origin: 'as written', lines: [goal] },
    { key: 'frame', label: 'Frame', origin: frame ? 'from Figma' : 'none', lines: frameLines },
    { key: 'context', label: 'Context', origin: draft.contextPaths.length ? 'from repo' : 'none', lines: contextLines },
  ];

  const marker: TaskMarker = {
    v: 1,
    flow: draft.flowName,
    frame: frame ? { name: frame.name, page: frame.page, url: frame.url } : undefined,
    context: draft.contextPaths,
  };

  const body = [
    '## Goal',
    goal,
    '',
    '## Frame',
    ...(frame ? [`${frame.name} · ${frame.page}`, frame.url] : frameLines),
    '',
    '## Context',
    ...(draft.contextPaths.length ? draft.contextPaths.map((p) => `- \`${p}\``) : contextLines),
    '',
    encodeMarker(marker),
  ].join('\n');

  const text = [
    'GOAL',
    goal,
    '',
    'FRAME',
    frame ? `${frame.name} · ${frame.page} · ${frame.url}` : frameLines[0],
    '',
    'CONTEXT',
    draft.contextPaths.length ? draft.contextPaths.join(' · ') : contextLines[0],
  ].join('\n');

  return { title: titleFromGoal(goal), sections, body, text, marker };
}

const MARKER = /<!--\s*trellis:task\s+(\{.*?\})\s*-->/s;

/**
 * A hidden comment at the end of the issue. It lets anyone's Trellis rebuild
 * the task from GitHub alone, so the repo is the shared state and no shared
 * server is needed (A4).
 */
export function encodeMarker(marker: TaskMarker): string {
  // ">" is escaped so the JSON can never close the HTML comment early.
  const json = JSON.stringify(marker).replace(/>/g, '\\u003e');
  return `<!-- trellis:task ${json} -->`;
}

export function parseMarker(body: string | null | undefined): TaskMarker | null {
  const match = MARKER.exec(body ?? '');
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]!) as TaskMarker;
    if (parsed.v !== 1 || !Array.isArray(parsed.context)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** The text under "## Goal" in an issue Trellis created. */
export function goalFromBody(body: string | null | undefined): string | null {
  const match = /^## Goal\s*\n([\s\S]*?)(?=\n## |\n<!--|$)/m.exec(body ?? '');
  const goal = match?.[1]?.trim();
  return goal ? goal : null;
}

export function flowIdFor(flowName: string | undefined): string | undefined {
  return flowName ? slug(flowName) : undefined;
}

/** A link that opens GitHub's new-issue form with the task filled in: the manual path when the API call fails. */
export function newIssueUrl(repoFullName: string, task: PreparedTask): string {
  const params = new URLSearchParams({ title: task.title, body: task.body });
  return `https://github.com/${repoFullName}/issues/new?${params.toString()}`;
}
