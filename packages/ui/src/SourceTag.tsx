import type { Trust } from '@trellis/core';

/**
 * Says where an item came from and how far to trust it.
 * Solid border: verified. Dashed accent border: AI summary. No border: unavailable.
 * The wording carries the meaning too, so it never depends on the border alone.
 */
export function SourceTag({ trust, label }: { trust: Trust; label?: string }) {
  const text = trust === 'verified' ? `verified · ${label}` : trust === 'ai-summary' ? `AI summary · ${label}` : 'unavailable';
  return <span className={`t-source t-source--${trust}`}>{text}</span>;
}
