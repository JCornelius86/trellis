import type { FigmaPageLite } from '@trellis/core';
import { getJson, type Fetch } from './http';

/** The few Figma REST calls Trellis needs. Trellis only ever reads from Figma (decision D2). */

export interface FigmaContext {
  fetch: Fetch;
  token: string;
  fileKey: string;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}
interface FigmaFile {
  name: string;
  document: FigmaNode;
}
export interface FigmaVersion {
  id: string;
  created_at: string;
  label: string | null;
  description: string | null;
  user: { handle: string } | null;
}
export interface FigmaComment {
  id: string;
  message: string;
  created_at: string;
  resolved_at: string | null;
  parent_id?: string | null;
  user: { handle: string } | null;
  client_meta?: { node_id?: string } | null;
}

const API = 'https://api.figma.com/v1';
const headers = (ctx: FigmaContext) => ({ 'X-Figma-Token': ctx.token });

/** Pages, the sections on each, and the frames in each section. Depth 3 is enough and keeps the response small. */
export async function filePages(ctx: FigmaContext): Promise<{ name: string; pages: FigmaPageLite[] }> {
  const file = await getJson<FigmaFile>(ctx.fetch, 'Figma', `${API}/files/${ctx.fileKey}?depth=3`, { headers: headers(ctx) });
  const pages = (file.document.children ?? [])
    .filter((node) => node.type === 'CANVAS')
    .map((page) => ({
      name: page.name,
      sections: (page.children ?? [])
        .filter((node) => node.type === 'SECTION')
        .map((section) => ({
          id: section.id,
          name: section.name,
          frames: (section.children ?? []).filter((node) => node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE').map((frame) => ({ id: frame.id, name: frame.name })),
        })),
    }));
  return { name: file.name, pages };
}

export async function versions(ctx: FigmaContext): Promise<FigmaVersion[]> {
  const result = await getJson<{ versions: FigmaVersion[] }>(ctx.fetch, 'Figma', `${API}/files/${ctx.fileKey}/versions?page_size=20`, { headers: headers(ctx) });
  return result.versions;
}

export async function comments(ctx: FigmaContext): Promise<FigmaComment[]> {
  const result = await getJson<{ comments: FigmaComment[] }>(ctx.fetch, 'Figma', `${API}/files/${ctx.fileKey}/comments`, { headers: headers(ctx) });
  return result.comments;
}
