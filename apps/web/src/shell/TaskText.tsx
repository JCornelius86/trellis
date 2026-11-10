import { useEffect, useRef, useState } from 'react';
import { Button, Icon, Label } from '@trellis/ui';
import { copyText } from '../lib/clipboard';
import { useToast } from '../lib/toast';

/**
 * The prepared task as plain text, with a copy button. If the browser refuses
 * to copy, it says so and selects the text so it can be copied by hand.
 */
export function TaskText({ text, sample, startFailed = false }: { text: string; sample: boolean; startFailed?: boolean }) {
  const [failed, setFailed] = useState(startFailed);
  const pre = useRef<HTMLPreElement>(null);
  const toast = useToast();

  const selectAll = () => {
    const node = pre.current;
    if (!node) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  useEffect(() => {
    if (failed) {
      pre.current?.focus();
      selectAll();
    }
  }, [failed]);

  async function copy() {
    const ok = await copyText(text, sample);
    setFailed(!ok);
    if (ok) toast('Task copied.');
  }

  return (
    <div className="tasktext">
      <div className="tasktext__head">
        <Label tone={failed ? 'attention' : undefined}>{failed ? "Copy didn't work" : 'Prepared task'}</Label>
        {failed ? (
          <span className="muted small">Select the text and copy it with your keyboard</span>
        ) : (
          <Button size="sm" onClick={() => void copy()}>
            <Icon name="copy" size={13} /> Copy task
          </Button>
        )}
      </div>
      <pre ref={pre} tabIndex={0} onFocus={failed ? selectAll : undefined} aria-label="Prepared task text">
        {text}
      </pre>
    </div>
  );
}
