import type { ReactNode } from 'react';

export type ChipTone = 'attention' | 'agreed' | 'warning' | 'soft' | 'outline';

/** A status pill. Tones differ in lightness as well as hue, and always carry a text label. */
export function Chip({ tone = 'soft', children }: { tone?: ChipTone; children: ReactNode }) {
  return <span className={`t-chip t-chip--${tone}`}>{children}</span>;
}
