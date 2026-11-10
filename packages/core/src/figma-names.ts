import type { Fidelity, Flow, FrameRef } from './types';

/**
 * Trellis learns where a flow is from page and section names in Figma
 * (docs/figma-template.md). Those names are the contract, so the parsing
 * lives here and is tested.
 */

/** "✏️ Wireframes (lo-fi)" → "Wireframes (lo-fi)". Divider pages ("---") → null. */
export function cleanPageName(raw: string): string | null {
  const name = raw.replace(/^[^\p{L}\p{N}]+/u, '').trim();
  return name === '' ? null : name;
}

/** Which fidelity a page holds, or null for pages that don't hold flows. */
export function fidelityOfPage(rawName: string): Exclude<Fidelity, 'new'> | null {
  const name = cleanPageName(rawName)?.toLowerCase() ?? '';
  if (name.startsWith('wireframes')) return 'wireframes';
  if (name.startsWith('explorations')) return 'explorations';
  if (name === 'current' || name.startsWith('current ')) return 'current';
  return null;
}

export interface SectionName {
  flow: string;
  date: string;
  round?: number;
}

/**
 * "Payment · 2026-11-10" or "Payment · 2026-11-10 · round 2".
 * A section without a date isn't a flow section, so it returns null.
 */
export function parseSectionName(raw: string): SectionName | null {
  const bits = raw.split('·').map((b) => b.trim());
  const flow = bits[0];
  const date = bits.find((b) => /^\d{4}-\d{2}-\d{2}$/.test(b));
  if (!flow || !date) return null;
  const roundBit = bits.map((b) => /^round\s+(\d+)$/i.exec(b)).find(Boolean);
  return { flow, date, round: roundBit ? Number(roundBit[1]) : undefined };
}

export function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
}

/** The minimum Trellis needs from a Figma file: pages, their sections, and the frames inside. */
export interface FigmaPageLite {
  name: string;
  sections: { id: string; name: string; frames: { id: string; name: string }[] }[];
}

const RANK: Record<Exclude<Fidelity, 'new'>, number> = { wireframes: 1, explorations: 2, current: 3 };

export function figmaNodeUrl(fileKey: string, nodeId: string): string {
  return `https://www.figma.com/design/${fileKey}?node-id=${nodeId.replace(/:/g, '-')}`;
}

/**
 * Turns pages and sections into flows (D10). A flow is at the highest
 * fidelity page where it has a section; its round is how many sections it has
 * there, or the highest "round N" in their names.
 */
export function flowsFromFigma(pages: FigmaPageLite[], fileKey: string): Flow[] {
  type Found = { fidelity: Exclude<Fidelity, 'new'>; page: string; sectionId: string; parsed: SectionName; frames: FrameRef[] };
  const byFlow = new Map<string, { name: string; found: Found[] }>();

  for (const page of pages) {
    const fidelity = fidelityOfPage(page.name);
    const pageName = cleanPageName(page.name);
    if (!fidelity || !pageName) continue;
    for (const section of page.sections) {
      const parsed = parseSectionName(section.name);
      if (!parsed) continue;
      const id = slug(parsed.flow);
      const entry = byFlow.get(id) ?? { name: parsed.flow, found: [] };
      entry.found.push({
        fidelity,
        page: pageName.replace(/\s*\(.*\)$/, ''),
        sectionId: section.id,
        parsed,
        frames: section.frames.map((f) => ({
          id: f.id,
          name: f.name,
          page: pageName.replace(/\s*\(.*\)$/, ''),
          url: figmaNodeUrl(fileKey, f.id),
          flowId: id,
        })),
      });
      byFlow.set(id, entry);
    }
  }

  return [...byFlow.entries()].map(([id, { name, found }]) => {
    const top = found.reduce((a, b) => (RANK[b.fidelity] > RANK[a.fidelity] ? b : a)).fidelity;
    const here = found
      .filter((f) => f.fidelity === top)
      .sort((a, b) => a.parsed.date.localeCompare(b.parsed.date) || (a.parsed.round ?? 0) - (b.parsed.round ?? 0));
    const newest = here[here.length - 1]!;
    const round = Math.max(here.length, ...here.map((f) => f.parsed.round ?? 0));
    return {
      id,
      name,
      fidelity: top,
      round,
      sectionDate: newest.parsed.date,
      frames: newest.frames,
      figmaUrl: figmaNodeUrl(fileKey, newest.sectionId),
      openQuestions: [],
      taskNumbers: [],
    } satisfies Flow;
  });
}
