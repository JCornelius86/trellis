import type { ProjectSnapshot } from '@trellis/core';
import { checkout } from './checkout';
import { volunteer } from './volunteer';

/** Fresh copies each time, so the demo can change its own state without touching the originals. */
export function demoSnapshots(): ProjectSnapshot[] {
  return JSON.parse(JSON.stringify([checkout, volunteer])) as ProjectSnapshot[];
}

export const DEMO_PROJECT_ID = checkout.id;
