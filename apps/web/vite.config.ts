/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const servicePort = process.env.TRELLIS_PORT ?? '8787';

export default defineConfig({
  plugins: [react()],
  // Relative paths, so the built demo works from any folder (for example GitHub Pages).
  base: './',
  server: {
    port: 5173,
    // The browser only ever talks to the local service through this proxy. Tokens stay in the service.
    proxy: { '/api': `http://127.0.0.1:${servicePort}` },
  },
  test: {
    name: 'web',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
