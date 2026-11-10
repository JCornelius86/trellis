import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/core', 'demo', 'apps/service', 'apps/web'],
  },
});
