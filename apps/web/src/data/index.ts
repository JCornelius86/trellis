import { isSampleId, type TrellisClient } from './client';
import { demoClient } from './demoClient';
import { liveClient } from './liveClient';

export function clientFor(projectId: string): TrellisClient {
  return isSampleId(projectId) ? demoClient : liveClient;
}

export * from './client';
export { demo, demoClient, SCENARIOS, type DemoScenario } from './demoClient';
export { getStatus, liveClient } from './liveClient';
