import type { Person } from './types';

const COPILOT = /^(copilot|copilot-swe-agent)(\[bot\])?$/i;

export function isCopilotLogin(login: string): boolean {
  return COPILOT.test(login);
}

export function person(login: string): Person {
  return isCopilotLogin(login) ? { login: 'Copilot', kind: 'copilot' } : { login, kind: 'person' };
}

/** "@mrivera", or "Copilot" for the coding agent. */
export function handle(p: Person): string {
  if (p.kind === 'copilot') return 'Copilot';
  return p.name ?? `@${p.login}`;
}

/** Two letters for an avatar. Copilot gets a diamond in the UI instead. */
export function initials(p: Person): string {
  if (p.name) {
    const words = p.name.split(/\s+/).filter(Boolean);
    const letters = words.length > 1 ? `${words[0]![0]}${words[words.length - 1]![0]}` : (words[0] ?? '').slice(0, 2);
    if (letters) return letters.toUpperCase();
  }
  return p.login.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || '?';
}
