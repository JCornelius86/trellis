/** A failed call to GitHub or Figma, with a message that is safe to show. It never contains a token. */
export class SourceError extends Error {
  constructor(
    readonly source: 'GitHub' | 'Figma',
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type Fetch = typeof fetch;

function explain(source: 'GitHub' | 'Figma', status: number): string {
  if (status === 401) return `${source} didn't accept the token. It may have expired.`;
  if (status === 403) return `${source} refused the request. The token may be missing a permission, or a rate limit was reached.`;
  if (status === 404) return `${source} couldn't find it. Check the ${source === 'GitHub' ? 'repository name' : 'file key'} and that the token can see it.`;
  if (status === 429) return `${source} asked Trellis to slow down. Try again in a minute.`;
  if (status >= 500) return `${source} is having trouble right now (${status}).`;
  return `${source} answered with an error (${status}).`;
}

export async function getJson<T>(fetchImpl: Fetch, source: 'GitHub' | 'Figma', url: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetchImpl(url, init);
  } catch {
    throw new SourceError(source, 0, `${source} couldn't be reached. Check your connection.`);
  }
  if (!response.ok) throw new SourceError(source, response.status, explain(source, response.status));
  return (await response.json()) as T;
}

export async function getText(fetchImpl: Fetch, source: 'GitHub' | 'Figma', url: string, init: RequestInit): Promise<string> {
  let response: Response;
  try {
    response = await fetchImpl(url, init);
  } catch {
    throw new SourceError(source, 0, `${source} couldn't be reached. Check your connection.`);
  }
  if (!response.ok) throw new SourceError(source, response.status, explain(source, response.status));
  return response.text();
}

export function reasonOf(error: unknown, fallback: string): string {
  return error instanceof SourceError ? error.message : fallback;
}
