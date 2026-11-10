import { demo } from '../data';

/**
 * Copies text. Returns false when the browser refuses (no permission, an
 * insecure page, an old browser), so the screen can show the text to copy by hand.
 */
export async function copyText(text: string, sample: boolean): Promise<boolean> {
  if (sample && demo.scenario === 'copy-blocked') return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
