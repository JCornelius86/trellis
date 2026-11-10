import type { HandoffResult, ProjectSnapshot, ServiceStatus } from '@trellis/core';
import { LIVE_PROJECT_ID, type TrellisClient } from './client';

/**
 * Talks to the local service (apps/service) at /api. The service holds the
 * tokens and makes the GitHub and Figma calls; the browser never sees a token.
 */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    // The service refuses writes without this header. Other sites can't add it, which blocks drive-by requests.
    headers: { 'Content-Type': 'application/json', 'X-Trellis': '1', ...init?.headers },
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(problem?.error ?? `The local service answered with an error (${response.status}).`);
  }
  return (await response.json()) as T;
}

/** Null means the local service isn't running, which is normal for the hosted demo. */
export async function getStatus(): Promise<ServiceStatus | null> {
  if (import.meta.env.MODE === 'demo') return null;
  try {
    return await request<ServiceStatus>('/api/status');
  } catch {
    return null;
  }
}

export const liveClient: TrellisClient = {
  async listProjects() {
    const project = await this.getProject(LIVE_PROJECT_ID);
    return project ? [project] : [];
  },

  async getProject(id) {
    if (id !== LIVE_PROJECT_ID) return null;
    return request<ProjectSnapshot>('/api/project');
  },

  async handOff(_projectId, draft): Promise<HandoffResult> {
    try {
      return await request<HandoffResult>('/api/handoff', { method: 'POST', body: JSON.stringify(draft) });
    } catch (error) {
      return { outcome: 'failed', reason: error instanceof Error ? error.message : "The local service couldn't be reached." };
    }
  },
};
