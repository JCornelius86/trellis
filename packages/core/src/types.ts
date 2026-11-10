/**
 * The shapes Trellis works with.
 *
 * A ProjectSnapshot is everything the hub shows for one project. The demo
 * builds one from sample data; the local service builds one from GitHub and
 * Figma. The UI doesn't know or care which.
 */

/** Where a flow's Figma section lives. `new` means handed off, no frames yet. */
export type Fidelity = 'new' | 'wireframes' | 'explorations' | 'current';

export type Source = 'github' | 'figma';

/**
 * How much to trust an item (see the glossary):
 * - verified: read directly from GitHub or Figma
 * - ai-summary: written by a model, always labelled
 * - unavailable: the source couldn't be reached, so nothing is shown
 */
export type Trust = 'verified' | 'ai-summary' | 'unavailable';

export interface Person {
  login: string;
  kind: 'person' | 'copilot';
  /** A display name, for sources that have no @login (Figma). Shown instead of "@login". */
  name?: string;
}

export interface FrameRef {
  id: string;
  name: string;
  /** Page name without its icon, e.g. "Current". */
  page: string;
  url: string;
  flowId?: string;
}

export interface Question {
  id: string;
  askedBy: Person;
  askedAt: string;
  text: string;
  url?: string;
}

export interface Flow {
  id: string;
  name: string;
  fidelity: Fidelity;
  /** Rounds at the current fidelity. 0 for a flow with no frames yet. */
  round: number;
  /** Date in the newest section name, YYYY-MM-DD. */
  sectionDate?: string;
  frames: FrameRef[];
  figmaUrl?: string;
  lastEdit?: { by: Person; at: string };
  openQuestions: Question[];
  /** Pull request that built the prototype from Current, if any. */
  prototypePr?: number;
  taskNumbers: number[];
}

/** A hand-off: one GitHub issue created by Trellis. */
export interface Task {
  number: number;
  title: string;
  goal: string;
  url: string;
  flowId?: string;
  flowName?: string;
  frame?: { name: string; page: string; url: string };
  contextPaths: string[];
  createdAt: string;
  createdBy: Person;
  assignedToCopilot: boolean;
  state: 'open' | 'closed';
}

export interface PullRequest {
  number: number;
  title: string;
  url: string;
  author: Person;
  state: 'open' | 'merged' | 'closed';
  createdAt: string;
  mergedAt?: string;
  reviewers: Person[];
  /** True once someone other than the author has left a review. */
  reviewed: boolean;
  /** Issue numbers mentioned in the title or description. */
  mentions: number[];
  /** First lines of the description. Labelled AI when the author is Copilot. */
  summary?: string;
  fromTrellis?: boolean;
}

export interface ContextFile {
  path: string;
  name: string;
  /** Short fact about the file, e.g. "13 decisions". */
  meta: string;
  url?: string;
  includedByDefault: boolean;
}

export interface Assumption {
  id: string;
  title: string;
  open: boolean;
  url?: string;
}

export interface ActivityItem {
  id: string;
  at: string;
  /** True when only the day is known (e.g. from a Figma section name). */
  dateOnly?: boolean;
  text: string;
  /** Short form for people lists, e.g. "edited Payment". Falls back to `text`. */
  brief?: string;
  /** Set for items that come from Figma comments, so they can be withheld when comments are unavailable. */
  kind?: 'comment';
  actor?: Person;
  source: Source;
  trust: Trust;
  /** Shown in the source tag, e.g. "GitHub", "Figma", "PR #15". */
  sourceLabel: string;
  flowId?: string;
  taskNumber?: number;
  url?: string;
}

export interface SourceState {
  state: 'ok' | 'unavailable' | 'not-connected';
  /** Plain-language reason, shown as written. */
  reason?: string;
}

export interface ProjectSnapshot {
  id: string;
  name: string;
  /** True for bundled sample data. The UI labels it. */
  sample: boolean;
  repo: { fullName: string; url: string };
  figma?: { name: string; url: string };
  links: { label: string; url: string }[];
  syncedAt: string;
  viewer?: Person;
  flows: Flow[];
  tasks: Task[];
  pullRequests: PullRequest[];
  context: ContextFile[];
  assumptions: Assumption[];
  activity: ActivityItem[];
  sources: { github: SourceState; figma: SourceState; figmaComments: SourceState };
  /**
   * Sample data only: the moment the sample pretends it is, and the time zone
   * its dates are shown in, so the demo reads the same for everyone.
   */
  clock?: { now: string; timeZone: string };
  /** Sample data only: when the viewer "last visited" a flow, keyed by flow id. */
  seedLastVisit?: Record<string, string>;
}

export interface ProjectSummary {
  id: string;
  name: string;
  sample: boolean;
  line: string;
  attention: number;
}

/** What the composer collects before a hand-off. */
export interface TaskDraft {
  goal: string;
  flowName?: string;
  frame?: FrameRef | null;
  contextPaths: string[];
}

export type HandoffResult =
  | {
      outcome: 'assigned';
      task: Task;
    }
  | {
      /** Issue exists, Copilot isn't on it. */
      outcome: 'created-not-assigned';
      task: Task;
      reason: string;
    }
  | {
      /** Nothing was created. */
      outcome: 'failed';
      reason: string;
    };

export interface ServiceStatus {
  github: SourceState & { login?: string; repo?: string };
  figma: SourceState & { fileKey?: string };
}
