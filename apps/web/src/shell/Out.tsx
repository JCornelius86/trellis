import type { ReactNode } from 'react';
import { Icon, VisuallyHidden } from '@trellis/ui';
import { useMaybeProject } from '../lib/project';
import { useToast } from '../lib/toast';

interface OutProps {
  href: string;
  /** What the link opens, for the sample-data note: "PR #15 on GitHub". */
  what: string;
  children: ReactNode;
  className?: string;
  /** Hide the arrow when the label already has one or the link is a button. */
  plain?: boolean;
  sample?: boolean;
}

/**
 * A link that leaves Trellis for GitHub or Figma. In a sample project those
 * places don't exist, so instead of a dead link it says what would have opened.
 */
export function Out({ href, what, children, className, plain = false, sample }: OutProps) {
  const project = useMaybeProject();
  const toast = useToast();
  const isSample = sample ?? project?.snapshot.sample ?? false;
  const arrow = plain ? null : <Icon name="external" size={13} />;

  if (isSample) {
    return (
      <button type="button" className={`out out--sample ${className ?? ''}`.trim()} onClick={() => toast(`Sample data: this would open ${what}.`)}>
        {children}
        {arrow}
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={`out ${className ?? ''}`.trim()}>
      {children}
      {arrow}
      <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
    </a>
  );
}
