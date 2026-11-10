import type { HandoffResult, ProjectSnapshot, ServiceStatus, TaskDraft } from '@trellis/core';

/**
 * Everything the screens need from "the outside". There are two
 * implementations: the demo (sample data, in the browser) and the live one
 * (your GitHub and Figma, through the local service). Screens use this
 * interface and never ask which one they got.
 */
export interface TrellisClient {
  listProjects(): Promise<ProjectSnapshot[]>;
  getProject(id: string): Promise<ProjectSnapshot | null>;
  handOff(projectId: string, draft: TaskDraft): Promise<HandoffResult>;
}

export const LIVE_PROJECT_ID = 'local';

export function isSampleId(projectId: string): boolean {
  return projectId.startsWith('demo-');
}

export type { ServiceStatus };
