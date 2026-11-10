import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { assembleTask, newIssueUrl, plural, type ContextFile, type FrameRef, type ProjectSnapshot, type TaskDraft } from '@trellis/core';
import { Button, FlowThumb, Icon, Label } from '@trellis/ui';
import { clientFor } from '../data';
import { useProject } from '../lib/project';
import { AppShell } from '../shell/AppShell';
import { Out } from '../shell/Out';
import { TaskText } from '../shell/TaskText';

const draftKey = (projectId: string) => `trellis.draft.${projectId}`;

function savedGoal(projectId: string): string {
  try {
    return sessionStorage.getItem(draftKey(projectId)) ?? '';
  } catch {
    return '';
  }
}

function saveGoal(projectId: string, goal: string) {
  try {
    if (goal) sessionStorage.setItem(draftKey(projectId), goal);
    else sessionStorage.removeItem(draftKey(projectId));
  } catch {
    // Without storage the draft just isn't kept across a reload.
  }
}

type Panel = 'frames' | 'context' | null;

export function Composer() {
  const { snapshot, refresh } = useProject();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const base = `/p/${snapshot.id}`;

  const flowParam = snapshot.flows.find((f) => f.id === params.get('flow'));
  const frames = useMemo(() => snapshot.flows.flatMap((f) => f.frames), [snapshot.flows]);
  const pick = params.get('pick');

  const [goal, setGoal] = useState(() => params.get('goal') ?? (flowParam ? '' : savedGoal(snapshot.id)));
  const [frame, setFrame] = useState<FrameRef | null>(() => frames.find((f) => f.id === params.get('frame')) ?? flowParam?.frames[0] ?? null);
  const [flowName, setFlowName] = useState<string | undefined>(flowParam?.name);
  const [included, setIncluded] = useState<string[]>(() => snapshot.context.filter((c) => c.includedByDefault).map((c) => c.path));
  const [panel, setPanel] = useState<Panel>(pick ? 'frames' : null);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.title = `New task · ${snapshot.name} · Trellis`;
    textarea.current?.focus();
  }, [snapshot.name]);

  useEffect(() => saveGoal(snapshot.id, goal), [snapshot.id, goal]);

  const draft: TaskDraft = { goal, flowName, frame, contextPaths: included };
  const prepared = useMemo(() => assembleTask({ goal, flowName, frame, contextPaths: included }), [goal, flowName, frame, included]);
  const ready = goal.trim().length > 0 && !sending;

  function chooseFrame(next: FrameRef | null) {
    setFrame(next);
    const owner = snapshot.flows.find((f) => f.id === next?.flowId);
    if (owner) setFlowName(owner.name);
    setPanel(null);
  }

  function suggest(text: string) {
    setGoal((current) => (current.trim() ? `${current.trimEnd()} ${text}` : text));
    textarea.current?.focus();
  }

  async function handOff(event?: FormEvent) {
    event?.preventDefault();
    if (!ready) return;
    setSending(true);
    setFailure(null);
    const result = await clientFor(snapshot.id).handOff(snapshot.id, draft);
    if (result.outcome === 'failed') {
      setSending(false);
      setFailure(result.reason);
      return;
    }
    saveGoal(snapshot.id, '');
    await refresh();
    // The task rides along: GitHub's issue list can lag a moment behind the issue it just created.
    navigate(`${base}/handoff/${result.task.number}`, { state: { task: result.task, reason: result.outcome === 'created-not-assigned' ? result.reason : undefined } });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void handOff();
  }

  const subject = flowName ?? 'the flow';
  const suggestions = [
    { label: 'Explore alternatives', text: `Explore two alternative approaches to ${subject === 'the flow' ? 'this' : `the ${subject} flow`}. Show them side by side on Wireframes.` },
    { label: 'Prototype the agreed flow', text: `Prototype the agreed ${flowName ?? ''} flow from the frames on Current.`.replace('  ', ' ') },
    { label: 'Review against the brief', text: `Review ${frame ? `"${frame.name}"` : 'the latest frames'} against the brief. List what is missing or unclear.` },
  ];

  const pickable = pick ? frames.filter((f) => (pick === 'wireframes' ? f.page === 'Wireframes' : f.page !== 'Wireframes')) : frames;

  return (
    <AppShell crumbs={[{ label: 'Overview', to: base }, { label: 'New task' }]}>
      <form className="page page--rail composer" onSubmit={(event) => void handOff(event)}>
        <div className="page__main composer__main">
          <header className="pagehead">
            <Label>{flowName ? `New task · ${flowName} flow` : 'New task'}</Label>
            <h1 className="title title--sm">
              <label htmlFor="goal">What do you want to accomplish?</label>
            </h1>
          </header>

          <div className="goalbox">
            <textarea
              id="goal"
              ref={textarea}
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              onKeyDown={onKeyDown}
              rows={3}
              placeholder="Say it the way you'd say it to a teammate."
            />
            <div className="goalbox__bar">
              <div className="goalbox__attached">
                {frame && (
                  <span className="attach">
                    <span className="attach__swatch" aria-hidden="true" />
                    <span>{frame.name}</span>
                    <span className="muted">· {frame.page}</span>
                    <button type="button" className="attach__remove" onClick={() => setFrame(null)} aria-label={`Remove frame ${frame.name}`}>
                      <Icon name="close" size={12} />
                    </button>
                  </span>
                )}
                {snapshot.context.length > 0 && (
                  <button type="button" className="attach attach--button" aria-expanded={panel === 'context'} onClick={() => setPanel(panel === 'context' ? null : 'context')}>
                    {plural(included.length, 'context file')} <Icon name="chevronDown" size={12} />
                  </button>
                )}
              </div>
              <div className="goalbox__add">
                <button type="button" className="linklike" aria-expanded={panel === 'frames'} onClick={() => setPanel(panel === 'frames' ? null : 'frames')}>
                  + Frame
                </button>
                {snapshot.context.length > 0 && (
                  <button type="button" className="linklike" aria-expanded={panel === 'context'} onClick={() => setPanel(panel === 'context' ? null : 'context')}>
                    + Context
                  </button>
                )}
              </div>
            </div>

            {panel === 'frames' && <FramePicker frames={pickable} snapshot={snapshot} selected={frame} onChoose={chooseFrame} />}
            {panel === 'context' && <ContextPicker files={snapshot.context} included={included} onChange={setIncluded} />}
          </div>

          <ul className="suggestions" aria-label="Starting points">
            {suggestions.map((s) => (
              <li key={s.label}>
                <button type="button" className="suggestion" onClick={() => suggest(s.text)}>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>

          {failure && (
            <div className="t-card t-card--dashed failure" role="alert">
              <Label tone="attention">Nothing was sent</Label>
              <p>{failure} Your task is still here, so you can try again or take it to GitHub yourself.</p>
              <div className="failure__actions">
                <Button variant="primary" onClick={() => void handOff()} busy={sending}>
                  Try again
                </Button>
                <Out href={newIssueUrl(snapshot.repo.fullName, prepared)} what="a new issue on GitHub with this task filled in" className="t-btn t-btn--secondary t-btn--md">
                  Create the issue on GitHub
                </Out>
              </div>
              <TaskText text={prepared.text} sample={snapshot.sample} />
            </div>
          )}
        </div>

        <aside className="rail rail--panel" aria-label="What Copilot will get">
          <div className="preview">
            <h2 className="h3">What Copilot will get</h2>
            <p className="muted small">Assembled from your inputs. Nothing here is generated.</p>

            <section className="preview__section" aria-labelledby="preview-goal">
              <PreviewHead id="preview-goal" label="Goal" origin="as written" />
              <p className={goal.trim() ? 'preview__goal' : 'preview__goal muted'}>{goal.trim() || 'Your goal appears here as you type.'}</p>
            </section>

            <section className="preview__section" aria-labelledby="preview-frame">
              <PreviewHead id="preview-frame" label="Frame" origin={frame ? 'from Figma' : undefined} />
              {frame ? (
                <div className="preview__frame">
                  <FlowThumb fidelity={frame.page === 'Wireframes' ? 'wireframes' : 'current'} small />
                  <p>
                    <span className="strong">{frame.name}</span>
                    <span className="muted small">
                      {frame.page} page{flowName ? ` · ${flowName} flow` : ''}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="muted small">{prepared.sections[1]!.lines[0]}</p>
              )}
            </section>

            <section className="preview__section" aria-labelledby="preview-context">
              <PreviewHead id="preview-context" label="Context" origin={included.length ? 'from repo' : undefined} />
              {snapshot.context.length === 0 ? (
                <p className="muted small">{prepared.sections[2]!.lines[0]}</p>
              ) : (
                <ul className="preview__files">
                  {snapshot.context.map((file) => {
                    const on = included.includes(file.path);
                    return (
                      <li key={file.path} className={on ? '' : 'is-off'}>
                        <span className="mono">{on ? file.name : <s>{file.name}</s>}</span>
                        <span className="muted small">{on ? file.meta : 'not included'}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <p className="muted small preview__note">Copilot drafts the approach in the issue, where you can review it.</p>
          </div>

          <div className="handoffbar">
            <Button type="submit" variant="primary" size="lg" className="t-btn--block" disabled={!goal.trim()} busy={sending}>
              {sending ? 'Handing off…' : 'Hand off to Copilot'}
            </Button>
            <p className="muted small center">
              Creates an issue in {snapshot.repo.fullName} and assigns Copilot's coding agent.
              <span className="kbd-hint">
                {' '}
                <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> works too.
              </span>
            </p>
          </div>
        </aside>
      </form>
    </AppShell>
  );
}

function PreviewHead({ id, label, origin }: { id: string; label: string; origin?: string }) {
  return (
    <div className="preview__head">
      <h3 id={id}>
        <Label>{label}</Label>
      </h3>
      {origin && <span className="origin">{origin}</span>}
    </div>
  );
}

function FramePicker({ frames, snapshot, selected, onChoose }: { frames: FrameRef[]; snapshot: ProjectSnapshot; selected: FrameRef | null; onChoose: (frame: FrameRef) => void }) {
  if (frames.length === 0) {
    return (
      <div className="picker" role="group" aria-label="Frames">
        <p className="muted small">
          {snapshot.figma ? 'No frames here yet.' : 'No Figma file is connected yet.'} You can hand off without a frame, and new frames will go on the Wireframes page.
        </p>
      </div>
    );
  }
  return (
    <div className="picker" role="group" aria-label="Frames">
      <ul className="picker__list">
        {frames.map((f) => {
          const flow = snapshot.flows.find((x) => x.id === f.flowId);
          return (
            <li key={f.id}>
              <button type="button" className="picker__item" aria-pressed={selected?.id === f.id} onClick={() => onChoose(f)}>
                <Icon name="frame" size={14} />
                <span className="picker__name">{f.name}</span>
                <span className="muted small">
                  {f.page}
                  {flow ? ` · ${flow.name}` : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ContextPicker({ files, included, onChange }: { files: ContextFile[]; included: string[]; onChange: (paths: string[]) => void }) {
  return (
    <fieldset className="picker">
      <legend className="t-sr">Context files to include</legend>
      <ul className="picker__list">
        {files.map((file) => {
          const on = included.includes(file.path);
          return (
            <li key={file.path}>
              <label className="picker__item">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onChange(on ? included.filter((p) => p !== file.path) : files.map((f) => f.path).filter((p) => p === file.path || included.includes(p)))}
                />
                <span className="picker__name mono">{file.name}</span>
                <span className="muted small">{file.meta}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
