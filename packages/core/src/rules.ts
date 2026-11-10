import type { Flow, ProjectSnapshot, PullRequest, Task } from './types';
import { handle } from './people';
import { daysBetween, isoDay, numberWord, plural, shortDate } from './time';

/**
 * Rule-based status and next steps (D9). These are plain rules over project
 * state: rounds, who edited last, open questions, pull requests, assumptions.
 * No AI, so the same state always gives the same suggestions.
 */

export type FlowStatusKey = 'agreed' | 'question' | 'ready' | 'exploring' | 'wireframing' | 'waiting' | 'unassigned';

export interface FlowStatus {
  key: FlowStatusKey;
  label: string;
}

/**
 * Pass the snapshot when you have it: a new flow whose issue has no Copilot
 * assigned is not "waiting on Copilot", and only the snapshot's tasks say so.
 */
export function flowStatus(flow: Flow, snapshot?: ProjectSnapshot): FlowStatus {
  if (flow.fidelity === 'current') return { key: 'agreed', label: 'Agreed' };
  if (flow.openQuestions.length > 0) return { key: 'question', label: 'Open question' };
  if (isReadyToReview(flow)) return { key: 'ready', label: 'Ready to review' };
  if (flow.fidelity === 'explorations') return { key: 'exploring', label: 'Exploring' };
  if (flow.fidelity === 'wireframes') return { key: 'wireframing', label: 'Wireframing' };
  const task = snapshot ? latestTask(flow, snapshot) : undefined;
  if (task && !task.assignedToCopilot) return { key: 'unassigned', label: 'Not assigned' };
  return { key: 'waiting', label: 'Waiting on Copilot' };
}

/** Two or more rounds, and the last edit wasn't Copilot's (when Trellis knows who it was). */
function isReadyToReview(flow: Flow): boolean {
  if (flow.fidelity !== 'wireframes' && flow.fidelity !== 'explorations') return false;
  return flow.round >= 2 && flow.lastEdit?.by.kind !== 'copilot';
}

function sameDay(iso: string, now: Date, timeZone?: string): boolean {
  return isoDay(iso, timeZone) === isoDay(now.toISOString(), timeZone);
}

const PAGE: Record<Flow['fidelity'], string> = {
  new: 'New',
  wireframes: 'Wireframes',
  explorations: 'Explorations',
  current: 'Current',
};

export function pageLabel(fidelity: Flow['fidelity']): string {
  return PAGE[fidelity];
}

/** The page a flow moves to when the team promotes it. */
export function nextPage(fidelity: Flow['fidelity']): string | null {
  if (fidelity === 'wireframes') return 'Explorations';
  if (fidelity === 'explorations') return 'Current';
  return null;
}

/** One line under the flow name on a card, e.g. "Wireframes · round 2". */
export function flowLine(flow: Flow, snapshot: ProjectSnapshot): string {
  if (flow.fidelity === 'current') {
    return flow.prototypePr ? `Current · prototyped in #${flow.prototypePr}` : 'Current · not prototyped';
  }
  if (flow.fidelity === 'new') {
    const task = latestTask(flow, snapshot);
    if (!task) return 'New';
    return `New · ${task.assignedToCopilot ? 'handed off' : 'issue created'} ${shortDate(task.createdAt, snapshot.clock?.timeZone)}`;
  }
  return `${PAGE[flow.fidelity]} · round ${flow.round}`;
}

export function latestTask(flow: Flow, snapshot: ProjectSnapshot): Task | undefined {
  return snapshot.tasks
    .filter((t) => flow.taskNumbers.includes(t.number) || t.flowId === flow.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function pullRequestsFor(flow: Flow, snapshot: ProjectSnapshot): PullRequest[] {
  const numbers = new Set(snapshot.tasks.filter((t) => t.flowId === flow.id || flow.taskNumbers.includes(t.number)).map((t) => t.number));
  return snapshot.pullRequests.filter((pr) => pr.mentions.some((n) => numbers.has(n)));
}

export type NextStepKind = 'review' | 'question' | 'no-prototype' | 'pr-no-reviewer' | 'assumption' | 'stalled' | 'not-assigned';

export interface NextStep {
  id: string;
  kind: NextStepKind;
  /** Highlighted steps are the one thing to do next. */
  highlight: boolean;
  title: string;
  detail: string;
  flowId?: string;
  /** A ready-made goal for the composer, written by rule. */
  suggestedGoal?: string;
  action?: { label: string; url: string };
}

/** Project-wide list for the overview's "Needs attention". */
export function nextSteps(snapshot: ProjectSnapshot, now: Date): NextStep[] {
  const steps: NextStep[] = [];

  for (const flow of snapshot.flows) {
    if (flowStatus(flow).key === 'ready') {
      steps.push({
        id: `review-${flow.id}`,
        kind: 'review',
        highlight: true,
        title: `${flow.name} is ready to review`,
        detail: [plural(flow.round, 'round'), flow.lastEdit ? `last edit by ${handle(flow.lastEdit.by)}` : null].filter(Boolean).join(' · '),
        flowId: flow.id,
        suggestedGoal: `Review the ${flow.name} ${flow.fidelity === 'wireframes' ? 'wireframes' : 'explorations'} against the brief. List what is missing or unclear before the team promotes them to ${nextPage(flow.fidelity)}.`,
      });
    }
  }

  for (const flow of snapshot.flows) {
    for (const q of flow.openQuestions) {
      const days = daysBetween(q.askedAt, now);
      steps.push({
        id: `question-${q.id}`,
        kind: 'question',
        highlight: false,
        title: `Question on ${flow.name}`,
        detail: `Asked by ${handle(q.askedBy)} · ${days >= 1 ? `open ${plural(days, 'day')}` : sameDay(q.askedAt, now, snapshot.clock?.timeZone) ? 'asked today' : 'asked yesterday'}`,
        flowId: flow.id,
        suggestedGoal: `Answer the open question on ${flow.name}: "${q.text}" Show the options as frames so the team can decide.`,
      });
    }
  }

  for (const flow of snapshot.flows) {
    if (flow.fidelity === 'current' && !flow.prototypePr) {
      steps.push({
        id: `prototype-${flow.id}`,
        kind: 'no-prototype',
        highlight: false,
        title: `${flow.name} has no prototype`,
        detail: flow.sectionDate ? `Agreed ${shortDate(flow.sectionDate)}` : 'Agreed',
        flowId: flow.id,
        suggestedGoal: `Prototype the agreed ${flow.name} flow from the frames on Current.`,
      });
    }
  }

  for (const task of snapshot.tasks) {
    const flowId = task.flowId;
    if (task.state === 'open' && !task.assignedToCopilot) {
      steps.push({
        id: `not-assigned-${task.number}`,
        kind: 'not-assigned',
        highlight: false,
        title: `Issue #${task.number} isn't assigned to Copilot`,
        detail: 'The task is saved in the issue',
        flowId,
        action: { label: 'Assign on GitHub', url: task.url },
      });
    } else if (isStalled(task, snapshot, now)) {
      steps.push(stalledStep(task, now));
    }
  }

  return steps;
}

/** Flow-level list for "Where things stand" on the flow page. */
export function flowSteps(flow: Flow, snapshot: ProjectSnapshot): NextStep[] {
  const steps: NextStep[] = [];
  const next = nextPage(flow.fidelity);

  if (flowStatus(flow).key === 'ready' && next) {
    steps.push({
      id: `review-${flow.id}`,
      kind: 'review',
      highlight: true,
      title: `Ready to review for ${next}?`,
      detail: [plural(flow.round, 'round'), flow.lastEdit ? `last edit by ${flow.lastEdit.by.kind === 'person' ? 'a person' : 'Copilot'}` : null].filter(Boolean).join(' · '),
      flowId: flow.id,
      action: flow.figmaUrl ? { label: 'Start review', url: flow.figmaUrl } : undefined,
    });
  }

  for (const q of flow.openQuestions) {
    steps.push({
      id: `question-${q.id}`,
      kind: 'question',
      highlight: steps.length === 0,
      title: `${handle(q.askedBy)} asked a question`,
      detail: `\u201c${q.text}\u201d`,
      flowId: flow.id,
      action: q.url ? { label: 'Answer in Figma', url: q.url } : undefined,
    });
  }

  for (const pr of pullRequestsFor(flow, snapshot)) {
    if (pr.state === 'open' && pr.reviewers.length === 0 && !pr.reviewed) {
      steps.push({
        id: `pr-${pr.number}`,
        kind: 'pr-no-reviewer',
        highlight: false,
        title: `PR #${pr.number} has no reviewer`,
        detail: `Opened ${shortDate(pr.createdAt)} by ${handle(pr.author)}`,
        flowId: flow.id,
        action: { label: 'Request on GitHub', url: pr.url },
      });
    }
  }

  const task = latestTask(flow, snapshot);
  const figmaAccess = snapshot.assumptions.find((a) => a.open && /figma access/i.test(a.title));
  if (task?.state === 'open' && figmaAccess) {
    steps.push({
      id: `assumption-${figmaAccess.id}`,
      kind: 'assumption',
      highlight: false,
      title: `${figmaAccess.id} is still an assumption`,
      detail: "This task depends on Copilot's Figma access",
      flowId: flow.id,
      action: figmaAccess.url ? { label: 'Confirm as decision', url: figmaAccess.url } : undefined,
    });
  }

  if (task && !task.assignedToCopilot && task.state === 'open') {
    steps.push({
      id: `not-assigned-${task.number}`,
      kind: 'not-assigned',
      highlight: false,
      title: `Issue #${task.number} isn't assigned to Copilot`,
      detail: 'The task is saved in the issue',
      flowId: flow.id,
      action: { label: 'Assign on GitHub', url: task.url },
    });
  }

  return steps;
}

/** Assigned more than a day ago, and no pull request mentions the issue. */
export function isStalled(task: Task, snapshot: ProjectSnapshot, now: Date): boolean {
  if (task.state !== 'open' || !task.assignedToCopilot) return false;
  const linked = snapshot.pullRequests.some((pr) => pr.mentions.includes(task.number));
  return !linked && daysBetween(task.createdAt, now) >= 1;
}

export function stalledStep(task: Task, now: Date): NextStep {
  return {
    id: `stalled-${task.number}`,
    kind: 'stalled',
    highlight: false,
    title: `Issue #${task.number} has no linked pull request after ${plural(daysBetween(task.createdAt, now), 'day')}.`,
    detail: 'Copilot may not have started.',
    flowId: task.flowId,
    action: { label: 'Check the issue', url: task.url },
  };
}

/** "Five flows, two agreed. Payment is ready for review." */
export function projectSummary(snapshot: ProjectSnapshot, now: Date): string {
  const flows = snapshot.flows.length;
  if (flows === 0) return 'No flows yet. Start one from an idea or a frame.';
  const agreed = snapshot.flows.filter((f) => f.fidelity === 'current').length;
  const head = `${numberWord(flows)} ${flows === 1 ? 'flow' : 'flows'}, ${numberWord(agreed).toLowerCase()} agreed.`;
  const first = nextSteps(snapshot, now)[0];
  if (!first) return head;
  const tail = first.kind === 'review' ? first.title.replace('is ready to review', 'is ready for review') : first.title.replace(/\.$/, '');
  return `${head} ${tail}.`;
}

/** One line for a project card on the welcome screen. */
export function projectLine(snapshot: ProjectSnapshot, now: Date): { line: string; attention: number } {
  const flows = snapshot.flows.length;
  const agreed = snapshot.flows.filter((f) => f.fidelity === 'current').length;
  const attention = nextSteps(snapshot, now).length;
  const waiting = snapshot.tasks
    .filter((t) => t.state === 'open' && t.assignedToCopilot && !snapshot.pullRequests.some((pr) => pr.mentions.includes(t.number)))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  if (flows > 0 && agreed === 0 && waiting && snapshot.flows.every((f) => f.fidelity === 'new')) {
    return { line: `${plural(flows, 'flow')} · waiting on Copilot since ${shortDate(waiting.createdAt)}`, attention };
  }
  return { line: `${plural(flows, 'flow')} · ${agreed} agreed`, attention };
}

/** Counts for the fidelity bar. */
export function fidelityCounts(flows: Flow[]): Record<Flow['fidelity'], number> {
  const counts: Record<Flow['fidelity'], number> = { new: 0, wireframes: 0, explorations: 0, current: 0 };
  for (const f of flows) counts[f.fidelity] += 1;
  return counts;
}
