import { initials, type Person } from '@trellis/core';
import { Icon } from './Icon';

export function Avatar({ person, size = 26 }: { person: Person; size?: 22 | 26 | 30 }) {
  return (
    <span className={`t-avatar t-avatar--${size}`} aria-hidden="true">
      {person.kind === 'copilot' ? <Icon name="diamond" size={size === 22 ? 10 : 12} /> : initials(person)}
    </span>
  );
}
