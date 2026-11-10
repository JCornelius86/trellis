/**
 * Remembers when you last looked at a flow, in this browser only, so the flow
 * page can mark what is new since then. Nothing is sent anywhere.
 */

const key = (projectId: string, flowId: string) => `trellis.visit.${projectId}.${flowId}`;

export function lastVisit(projectId: string, flowId: string, fallback?: string): string | null {
  try {
    return localStorage.getItem(key(projectId, flowId)) ?? fallback ?? null;
  } catch {
    return fallback ?? null;
  }
}

export function recordVisit(projectId: string, flowId: string, at: string) {
  try {
    localStorage.setItem(key(projectId, flowId), at);
  } catch {
    // Storage unavailable: "new since your last visit" simply won't appear.
  }
}

/** Forgets visits to sample projects, used when the demo is reset. */
export function forgetSampleVisits() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('trellis.visit.demo-')) localStorage.removeItem(k);
  } catch {
    // Nothing to forget.
  }
}
