import type { Assumption, ContextFile } from './types';
import { plural, shortDate } from './time';

/** Reads short facts from the context files in project/. Counts and dates only; nothing is interpreted. */

const DEFAULT_OFF = new Set(['glossary.md']);

export function describeContextFile(path: string, text: string, url?: string): ContextFile {
  const name = path.split('/').pop() ?? path;
  return { path, name, meta: metaFor(name, text), url, includedByDefault: !DEFAULT_OFF.has(name) };
}

function metaFor(name: string, text: string): string {
  if (name === 'decisions.md') return plural(count(text, /^## D\d+/gm), 'decision');
  if (name === 'assumptions.md') return `${parseAssumptions(text).filter((a) => a.open).length} open`;
  if (name === 'glossary.md') return plural(Math.max(0, count(text, /^\|/gm) - 2), 'term');
  const status = /^Status:\s*([a-z-]+)(?:.*?Date:\s*(\d{4}-\d{2}-\d{2}))?/im.exec(text);
  if (status) return status[2] ? `${status[1]} ${shortDate(status[2])}` : status[1]!;
  return plural(text.split('\n').filter((l) => l.trim()).length, 'line');
}

function count(text: string, re: RegExp): number {
  return text.match(re)?.length ?? 0;
}

/** "## A2 · Copilot has Figma access" followed by a line containing "Status: open". */
export function parseAssumptions(text: string, url?: string): Assumption[] {
  const out: Assumption[] = [];
  const re = /^## (A\d+)\s*·\s*(.+)\n([^\n]*)/gm;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    out.push({ id: m[1]!, title: m[2]!.trim(), open: /Status:\s*open/i.test(m[3] ?? ''), url });
  }
  return out;
}
