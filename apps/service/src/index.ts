import { serve } from '@hono/node-server';
import { createApp } from './app';
import { loadEnvFile, readConfig } from './config';

loadEnvFile();
const config = readConfig();
const app = createApp(config);

// Bound to this computer only. Nothing on your network can reach it.
serve({ fetch: app.fetch, port: config.port, hostname: '127.0.0.1' }, () => {
  const github = config.github ? `${config.github.owner}/${config.github.repo}` : 'not connected';
  const figma = config.figma ? 'connected' : 'not connected';
  console.log(`Trellis service on http://127.0.0.1:${config.port}  ·  GitHub: ${github}  ·  Figma: ${figma}`);
  if (!config.github) console.log('  Copy .env.example to .env and fill it in to connect. Until then, the hub shows the sample projects.');
});
