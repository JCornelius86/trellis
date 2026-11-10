import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { assembleTask, isoDay, type Task } from '@trellis/core';
import { Button, buttonClass, Card, Label } from '@trellis/ui';
import { copyText } from '../lib/clipboard';
import { useFormat, useProject } from '../lib/project';
import { useToast } from '../lib/toast';
import { AppShell } from '../shell/AppShell';
import { Out } from '../shell/Out';
import { TaskText } from '../shell/TaskText';

/** GitHub's guide to turning on and using the coding agent. */
const COPILOT_AGENT_DOCS = 'https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/create-a-pr';

function textOf(task: Task): string {
  return assembleTask({
    goal: task.goal,
    flowName: task.flowName,
    frame: task.frame ? { id: '', ...task.frame } : null,
    contextPaths: task.contextPaths,
  }).text;
}

export function Handoff() {
  const { snapshot } = useProject();
  const { number } = useParams();
  const location = useLocation();
  const base = `/p/${snapshot.id}`;
  const carried = location.state as { task?: Task; reason?: string } | null;
  const task = snapshot.tasks.find((t) => String(t.number) === number) ?? (String(carried?.task?.number) === number ? carried?.task : undefined);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = task ? `Issue #${task.number} · ${snapshot.name} · Trellis` : 'Trellis';
    // Move focus to the result, so keyboard and screen-reader users land on what just happened.
    heading.current?.focus();
  }, [task, snapshot.name]);

  if (!task) {
    return (
      <AppShell crumbs={[{ label: 'Overview', to: base }, { label: 'Hand-off' }]}>
        <div className="page page--narrow">
          <h1 className="title title--sm">This hand-off isn't in the project.</h1>
          <p className="muted">It may belong to another project, or the sample data was reset.</p>
          <p>
            <Link to={base} className={buttonClass('primary')}>
              Back to overview
            </Link>
          </p>
        </div>
      </AppShell>
    );
  }

  const crumbs = [{ label: 'Overview', to: base }, ...(task.flowId ? [{ label: task.flowName ?? 'Flow', to: `${base}/flows/${task.flowId}` }] : []), { label: task.assignedToCopilot ? 'Handed off' : 'Partly done' }];
  const reason = carried?.reason;

  return (
    <AppShell crumbs={crumbs}>
      <div className="page page--narrow">
        {task.assignedToCopilot ? <Success task={task} headingRef={heading} /> : <Recovery task={task} reason={reason} headingRef={heading} />}
      </div>
    </AppShell>
  );
}

function Success({ task, headingRef }: { task: Task; headingRef: RefObject<HTMLHeadingElement | null> }) {
  const { snapshot } = useProject();
  const format = useFormat(snapshot);
  const toast = useToast();
  const [copyFailed, setCopyFailed] = useState(false);
  const base = `/p/${snapshot.id}`;
  const text = textOf(task);
  const section = `${task.flowName ?? 'the flow'} · ${isoDay(task.createdAt, snapshot.clock?.timeZone)}`;

  async function copy() {
    const ok = await copyText(text, snapshot.sample);
    setCopyFailed(!ok);
    if (ok) toast('Task copied.');
  }

  return (
    <>
      <header className="pagehead result">
        <div className="result__label">
          <SuccessMark />
          <Label tone="agreed">Handed off · {format.dateTime(task.createdAt)}</Label>
        </div>
        <h1 className="title" ref={headingRef} tabIndex={-1}>
          Issue #{task.number} created and assigned to Copilot
        </h1>
        <p>
          <Out href={task.url} what={`issue #${task.number} on GitHub`} className="result__link">
            Open #{task.number} on GitHub
          </Out>
        </p>
      </header>

      <Card className="sent">
        <Label>Sent in the issue</Label>
        <p>{task.goal}</p>
        <p className="muted small sent__meta">
          {task.frame && (
            <span>
              {task.frame.name} · {task.frame.page}
            </span>
          )}
          {task.contextPaths.length > 0 && <span>{task.contextPaths.map((p) => p.split('/').pop()).join(', ')}</span>}
        </p>
      </Card>

      <Card tone="side" className="later">
        <Label>What shows up here later</Label>
        <ol className="later__list">
          <li>
            <span className="later__n">01</span>
            <p>
              <span>Frames Copilot saves in Figma</span>
              <span className="muted small">On Wireframes, in a section named {section}</span>
            </p>
          </li>
          <li>
            <span className="later__n">02</span>
            <p>
              <span>Pull requests that mention #{task.number}</span>
              <span className="muted small">With Copilot's summary, labelled as AI</span>
            </p>
          </li>
          <li>
            <span className="later__n">03</span>
            <p>
              <span>Edits and comments from your team</span>
              <span className="muted small">From Figma version history and GitHub</span>
            </p>
          </li>
        </ol>
        <p className="muted small later__note">Trellis can't see the Copilot session itself. Nothing appears here until work lands in Figma or GitHub.</p>
      </Card>

      <div className="result__actions">
        <Link to={base} className={buttonClass('primary')}>
          Back to overview
        </Link>
        <Button onClick={() => void copy()}>Copy task</Button>
      </div>
      {copyFailed && (
        <Card tone="dashed" className="copybox">
          <TaskText text={text} sample={snapshot.sample} startFailed />
        </Card>
      )}
    </>
  );
}

function Recovery({ task, reason, headingRef }: { task: Task; reason?: string; headingRef: RefObject<HTMLHeadingElement | null> }) {
  const { snapshot } = useProject();
  const base = `/p/${snapshot.id}`;
  return (
    <>
      <header className="pagehead result">
        <Label tone="attention">Partly done</Label>
        <h1 className="title" ref={headingRef} tabIndex={-1}>
          Issue #{task.number} created. Copilot couldn't be assigned.
        </h1>
        <p className="lead lead--sm">{reason ?? `Copilot's coding agent may not be enabled for ${snapshot.repo.fullName}. Your task is saved in the issue, so nothing is lost.`}</p>
      </header>

      <div className="result__actions">
        <Out href={task.url} what={`issue #${task.number} on GitHub, where you can assign Copilot`} className={buttonClass('primary')}>
          Assign Copilot on GitHub
        </Out>
        <Out href={COPILOT_AGENT_DOCS} what="GitHub's guide to the coding agent" className={buttonClass('secondary')} sample={false}>
          How to enable the coding agent
        </Out>
      </div>

      <Card tone="dashed" className="copybox">
        <TaskText text={textOf(task)} sample={snapshot.sample} />
      </Card>

      <p className="muted small">
        This hand-off is listed on the {task.flowId ? <Link to={`${base}/flows/${task.flowId}`}>{task.flowName} flow</Link> : 'project'} as "issue created, not assigned" until Copilot picks it up.
      </p>
    </>
  );
}

/** A small check that draws itself once. Decorative, and still for people who prefer reduced motion. */
function SuccessMark() {
  return (
    <svg className="successmark" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="m7.5 12.5 3 3 6-7" />
    </svg>
  );
}
