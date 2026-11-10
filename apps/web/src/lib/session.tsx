import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ServiceStatus } from '@trellis/core';
import { getStatus } from '../data';

interface Session {
  /** undefined while checking; null when the local service isn't running (demo only). */
  status: ServiceStatus | null | undefined;
  /** True when your own GitHub repository is connected. */
  live: boolean;
  recheck: () => void;
}

const SessionContext = createContext<Session>({ status: undefined, live: false, recheck: () => {} });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ServiceStatus | null | undefined>(undefined);

  const recheck = useCallback(() => {
    void getStatus().then(setStatus);
  }, []);

  useEffect(recheck, [recheck]);

  const value = useMemo(() => ({ status, live: status?.github.state === 'ok', recheck }), [status, recheck]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
