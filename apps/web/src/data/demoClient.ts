import { assembleTask, flowIdFor, flowNameFromGoal, type HandoffResult, type ProjectSnapshot, type Task } from '@trellis/core';
import { demoSnapshots } from '@trellis/demo';
import type { TrellisClient } from './client';

/**
 * The demo: sample projects that live in this browser tab. Hand-offs change
 * the sample data so the whole journey can be clicked through, but nothing is
 * ever sent to GitHub or Figma.
 */

/** Failure paths you can switch on from the demo bar, so recovery screens are reachable. */
export type DemoScenario = 'ok' | 'assign-fails' | 'github-down' | 'copy-blocked' | 'comments-down';

export const SCENARIOS: { value: DemoScenario; label: string }[] = [
  { value: 'ok', label: 'Everything works' },
  { value: 'assign-fails', label: "Copilot can't be assigned" },
  { value: 'github-down', label: "GitHub can't be reached" },
  { value: 'copy-blocked', label: 'Copy is blocked' },
  { value: 'comments-down', label: "Figma comments can't be reached" },
];

const STORE_KEY = 'trellis.demo.v1';

interface DemoState {
  scenario: DemoScenario;
  projects: ProjectSnapshot[];
}

function load(): DemoState {
  try {
    const saved = sessionStorage.getItem(STORE_KEY);
    if (saved) return JSON.parse(saved) as DemoState;
  } catch {
    // Storage can be unavailable (private windows). The demo still works, it just forgets on reload.
  }
  return { scenario: 'ok', projects: demoSnapshots() };
}

let state: DemoState = load();
const listeners = new Set<() => void>();

function save() {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // See load().
  }
  listeners.forEach((fn) => fn());
}

export const demo = {
  get scenario(): DemoScenario {
    return state.scenario;
  },
  setScenario(scenario: DemoScenario) {
    state = { ...state, scenario };
    save();
  },
  reset() {
    state = { scenario: 'ok', projects: demoSnapshots() };
    save();
  },
  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

/** What a viewer sees: the stored sample data, adjusted for the scenario that is switched on. */
function view(project: ProjectSnapshot): ProjectSnapshot {
  if (state.scenario !== 'comments-down') return project;
  return {
    ...project,
    sources: { ...project.sources, figmaComments: { state: 'unavailable', reason: "Figma comments couldn't be reached." } },
    flows: project.flows.map((f) => ({ ...f, openQuestions: [] })),
    activity: project.activity.filter((a) => a.kind !== 'comment'),
  };
}

function nextNumber(project: ProjectSnapshot): number {
  return Math.max(0, ...project.tasks.map((t) => t.number), ...project.pullRequests.map((p) => p.number)) + 1;
}

export const demoClient: TrellisClient = {
  async listProjects() {
    return state.projects.map(view);
  },

  async getProject(id) {
    const project = state.projects.find((p) => p.id === id);
    return project ? view(project) : null;
  },

  async handOff(projectId, draft): Promise<HandoffResult> {
    // A short pause, so the "Handing off…" state is visible as it would be for real.
    await new Promise((resolve) => setTimeout(resolve, 450));

    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return { outcome: 'failed', reason: 'This sample project no longer exists. Reset the demo to get it back.' };
    if (state.scenario === 'github-down') {
      return { outcome: 'failed', reason: "GitHub couldn't be reached, so no issue was created." };
    }

    const prepared = assembleTask(draft);
    const now = project.clock?.now ?? new Date().toISOString();
    const number = nextNumber(project);
    const flowName = draft.flowName ?? flowNameFromGoal(draft.goal);
    const flowId = flowIdFor(flowName)!;
    const assigned = state.scenario !== 'assign-fails';

    const task: Task = {
      number,
      title: prepared.title,
      goal: draft.goal.trim(),
      url: `${project.repo.url}/issues/${number}`,
      flowId,
      flowName,
      frame: prepared.marker.frame,
      contextPaths: draft.contextPaths,
      createdAt: now,
      createdBy: project.viewer ?? { login: 'you', kind: 'person' },
      assignedToCopilot: assigned,
      state: 'open',
    };

    const flows = project.flows.some((f) => f.id === flowId)
      ? project.flows.map((f) => (f.id === flowId ? { ...f, taskNumbers: [...f.taskNumbers, number] } : f))
      : [...project.flows, { id: flowId, name: flowName, fidelity: 'new' as const, round: 0, frames: [], openQuestions: [], taskNumbers: [number] }];

    const updated: ProjectSnapshot = {
      ...project,
      flows,
      tasks: [...project.tasks, task],
      activity: [
        ...project.activity,
        {
          id: `handoff-${number}`,
          at: now,
          text: assigned ? `Handed off · issue #${number} assigned to Copilot` : `Issue #${number} created, not assigned`,
          source: 'github',
          trust: 'verified',
          sourceLabel: 'GitHub',
          flowId,
          taskNumber: number,
          url: task.url,
        },
      ],
    };
    state = { ...state, projects: state.projects.map((p) => (p.id === projectId ? updated : p)) };
    save();

    if (!assigned) {
      return {
        outcome: 'created-not-assigned',
        task,
        reason: `Copilot's coding agent isn't enabled for ${project.repo.fullName}. Your task is saved in the issue, so nothing is lost.`,
      };
    }
    return { outcome: 'assigned', task };
  },
};
