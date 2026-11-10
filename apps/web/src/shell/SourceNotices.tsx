import type { ProjectSnapshot } from '@trellis/core';
import { useProject } from '../lib/project';

/**
 * Says plainly when GitHub or Figma couldn't be reached. Trellis shows nothing
 * from that source rather than something stale. Sources that were never
 * connected get no warning: they are optional.
 */
export function SourceNotices({ snapshot }: { snapshot: ProjectSnapshot }) {
  const { refresh } = useProject();
  const down = (['github', 'figma'] as const).filter((key) => snapshot.sources[key].state === 'unavailable');
  if (down.length === 0) return null;
  return (
    <div className="notice" role="status">
      {down.map((key) => (
        <p key={key}>
          {snapshot.sources[key].reason ?? `${key === 'github' ? 'GitHub' : 'Figma'} couldn't be reached.`} Nothing from {key === 'github' ? 'GitHub' : 'Figma'} is shown
          rather than stale data.
        </p>
      ))}
      <button type="button" className="linklike" onClick={() => void refresh()}>
        Retry
      </button>
    </div>
  );
}
