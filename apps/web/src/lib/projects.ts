import { useEffect, useState } from 'react';
import type { ProjectSnapshot } from '@trellis/core';
import { demo, demoClient, liveClient } from '../data';
import { useSession } from './session';

export interface ProjectLists {
  loading: boolean;
  /** Your own project, when GitHub is connected. */
  live: ProjectSnapshot[];
  /** Why your project couldn't be loaded, if it couldn't. */
  liveError?: string;
  samples: ProjectSnapshot[];
}

/** Your project (if connected) and the sample projects. */
export function useProjects(): ProjectLists {
  const session = useSession();
  const [lists, setLists] = useState<ProjectLists>({ loading: true, live: [], samples: [] });

  useEffect(() => {
    if (session.status === undefined) return;
    let cancelled = false;

    async function loadAll() {
      const samples = await demoClient.listProjects();
      let live: ProjectSnapshot[] = [];
      let liveError: string | undefined;
      if (session.live) {
        try {
          live = await liveClient.listProjects();
        } catch (error) {
          liveError = error instanceof Error ? error.message : 'Your project could not be loaded.';
        }
      }
      if (!cancelled) setLists({ loading: false, live, liveError, samples });
    }

    void loadAll();
    const unsubscribe = demo.subscribe(() => void loadAll());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [session.status, session.live]);

  return lists;
}
