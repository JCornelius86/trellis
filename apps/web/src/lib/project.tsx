import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ago, agoLong, dateTime, shortDate, type ActivityItem, type ProjectSnapshot } from '@trellis/core';
import { clientFor } from '../data';

type Load = { state: 'loading' } | { state: 'ready'; snapshot: ProjectSnapshot } | { state: 'missing' } | { state: 'error'; message: string };

interface ProjectValue {
  snapshot: ProjectSnapshot;
  refresh: () => Promise<void>;
  refreshing: boolean;
}

const ProjectContext = createContext<ProjectValue | null>(null);

/** Loads one project and shares it with the screens below. */
export function useProjectLoader(projectId: string) {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const fetchNow = useCallback(async () => {
    try {
      const snapshot = await clientFor(projectId).getProject(projectId);
      setLoad(snapshot ? { state: 'ready', snapshot } : { state: 'missing' });
    } catch (error) {
      setLoad({ state: 'error', message: error instanceof Error ? error.message : 'Something went wrong.' });
    }
  }, [projectId]);

  useEffect(() => {
    setLoad({ state: 'loading' });
    void fetchNow();
  }, [fetchNow]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNow();
    setRefreshing(false);
  }, [fetchNow]);

  return { load, refresh, refreshing };
}

export function ProjectProvider({ value, children }: { value: ProjectValue; children: ReactNode }) {
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

/** The current project, or null on screens outside a project (welcome, setup). */
export function useMaybeProject(): ProjectValue | null {
  return useContext(ProjectContext);
}

export function useProject(): ProjectValue {
  const value = useContext(ProjectContext);
  if (!value) throw new Error('useProject must be used inside a project route');
  return value;
}

/** "Now" for a project: fixed for sample data, the real time (ticking each minute) otherwise. */
export function useNow(snapshot: Pick<ProjectSnapshot, 'clock'>): Date {
  const fixed = snapshot.clock?.now;
  const [now, setNow] = useState(() => (fixed ? new Date(fixed) : new Date()));
  useEffect(() => {
    if (fixed) {
      setNow(new Date(fixed));
      return;
    }
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, [fixed]);
  return now;
}

/** Date formatting bound to a project's clock and time zone. */
export function useFormat(snapshot: Pick<ProjectSnapshot, 'clock'>) {
  const now = useNow(snapshot);
  const zone = snapshot.clock?.timeZone;
  return useMemo(
    () => ({
      now,
      shortDate: (iso: string) => shortDate(iso, zone),
      dateTime: (iso: string) => dateTime(iso, zone),
      ago: (iso: string) => ago(iso, now),
      agoLong: (iso: string) => agoLong(iso, now),
    }),
    [now, zone],
  );
}

/** A sortable moment for an activity item. Date-only items count as the end of that day. */
export function itemTime(item: ActivityItem): string {
  return item.dateOnly ? `${item.at.slice(0, 10)}T23:59:59Z` : item.at;
}
