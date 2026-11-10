import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Settings come from a .env file in the repository root (never committed) or
 * from the environment. Personal access tokens are the first, simple way to
 * connect; OAuth with the OS keychain (assumption A3) is not built yet.
 */

export interface Config {
  port: number;
  github: { token: string; owner: string; repo: string } | null;
  figma: { token: string; fileKey: string } | null;
  /** Plain-language reasons a source isn't configured, shown on the setup screen. */
  problems: { github?: string; figma?: string };
}

export function loadEnvFile(cwd = process.cwd()) {
  for (const candidate of [resolve(cwd, '.env'), resolve(cwd, '../../.env')]) {
    if (existsSync(candidate)) {
      process.loadEnvFile(candidate);
      return;
    }
  }
}

export function readConfig(env: Record<string, string | undefined> = process.env): Config {
  const problems: Config['problems'] = {};
  const token = env.GITHUB_TOKEN?.trim();
  const repoSetting = env.GITHUB_REPO?.trim();
  const repoMatch = /^([\w.-]+)\/([\w.-]+)$/.exec(repoSetting ?? '');

  let github: Config['github'] = null;
  if (!token || !repoSetting) {
    problems.github = 'Add GITHUB_TOKEN and GITHUB_REPO to the .env file, then start Trellis again.';
  } else if (!repoMatch) {
    problems.github = 'GITHUB_REPO should look like owner/name, for example octocat/hello-world.';
  } else {
    github = { token, owner: repoMatch[1]!, repo: repoMatch[2]! };
  }

  const figmaToken = env.FIGMA_TOKEN?.trim();
  const fileSetting = env.FIGMA_FILE_KEY?.trim();
  // Accept a whole Figma URL as well as the bare key, because that is what people have on their clipboard.
  const fileKey = /figma\.com\/(?:design|file)\/([0-9A-Za-z]+)/.exec(fileSetting ?? '')?.[1] ?? fileSetting;
  let figma: Config['figma'] = null;
  if (!figmaToken || !fileKey) {
    problems.figma = 'Add FIGMA_TOKEN and FIGMA_FILE_KEY to the .env file to see flows from your Figma file.';
  } else if (!/^[0-9A-Za-z]+$/.test(fileKey)) {
    problems.figma = "FIGMA_FILE_KEY should be the key from the file's URL: figma.com/design/KEY/Name.";
  } else {
    figma = { token: figmaToken, fileKey };
  }

  const port = Number(env.TRELLIS_PORT ?? 8787);
  return { port: Number.isInteger(port) && port > 0 ? port : 8787, github, figma, problems };
}
