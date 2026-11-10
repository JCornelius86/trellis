import type { Person, ProjectSnapshot } from '@trellis/core';

const jcornelius: Person = { login: 'jcornelius', kind: 'person' };
const repo = 'https://github.com/jcornelius86/volunteer-shifts';

/** A new idea: handed off two days ago, and nothing has come back yet. */
export const volunteer: ProjectSnapshot = {
  id: 'demo-volunteer',
  name: 'Volunteer shifts',
  sample: true,
  repo: { fullName: 'jcornelius86/volunteer-shifts', url: repo },
  links: [{ label: 'Repository', url: repo }],
  clock: { now: '2026-11-11T14:42:00Z', timeZone: 'America/New_York' },
  syncedAt: '2026-11-11T14:38:00Z',
  viewer: jcornelius,
  sources: { github: { state: 'ok' }, figma: { state: 'ok' }, figmaComments: { state: 'ok' } },

  flows: [
    {
      id: 'shift-swap',
      name: 'Shift swap',
      fidelity: 'new',
      round: 0,
      frames: [],
      openQuestions: [],
      taskNumbers: [3],
    },
  ],

  tasks: [
    {
      number: 3,
      title: 'A way for volunteers to swap shifts',
      goal: 'A way for volunteers to swap shifts',
      url: `${repo}/issues/3`,
      flowId: 'shift-swap',
      flowName: 'Shift swap',
      contextPaths: [],
      createdAt: '2026-11-09T21:12:00Z',
      createdBy: jcornelius,
      assignedToCopilot: true,
      state: 'open',
    },
  ],

  pullRequests: [],
  context: [],
  assumptions: [],

  activity: [
    { id: 'v1', at: '2026-11-09T21:12:00Z', text: 'Handed off · issue #3 assigned to Copilot', source: 'github', trust: 'verified', sourceLabel: 'GitHub', flowId: 'shift-swap', taskNumber: 3, url: `${repo}/issues/3` },
  ],
};
