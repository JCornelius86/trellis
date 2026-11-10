import type { Fidelity } from '@trellis/core';

/** A schematic thumbnail: dashed boxes for wireframes, filled blocks for hi-fi. Not a real preview. */
export function FlowThumb({ fidelity, small = false }: { fidelity: Fidelity; small?: boolean }) {
  const kind = fidelity === 'wireframes' ? 'wire' : fidelity === 'new' ? 'empty' : 'solid';
  return (
    <div className={`t-thumb t-thumb--${kind}${small ? ' t-thumb--small' : ''}`} aria-hidden="true">
      <span className="t-thumb__bar" />
      <span className="t-thumb__row">
        <span />
        <span />
        {!small && <span />}
      </span>
    </div>
  );
}
