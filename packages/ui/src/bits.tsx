import type { ElementType, ReactNode } from 'react';

/** Mono uppercase label, used above titles and sections. */
export function Label({ children, tone, as: Tag = 'span' }: { children: ReactNode; tone?: 'accent' | 'agreed' | 'attention'; as?: ElementType }) {
  return <Tag className={`t-label${tone ? ` t-label--${tone}` : ''}`}>{children}</Tag>;
}

export function Logo({ size = 26 }: { size?: number }) {
  return <span className="t-logo" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function Card({ children, className = '', tone, as: Tag = 'div' }: { children: ReactNode; className?: string; tone?: 'side' | 'attention' | 'dashed'; as?: ElementType }) {
  return <Tag className={`t-card${tone ? ` t-card--${tone}` : ''} ${className}`.trim()}>{children}</Tag>;
}

/** Text only screen readers get. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="t-sr">{children}</span>;
}
