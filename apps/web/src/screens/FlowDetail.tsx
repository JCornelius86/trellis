import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  flowStatus,
  flowSteps,
  handle,
  isStalled,
  latestTask,
  pageLabel,
  pullRequestsFor,
  stalledStep,
  type ActivityItem,
  type Flow,
  type NextStep,
  type ProjectSnapshot,
  type Task,
} from '@trellis/core';
import { buttonClass, Card, Chip, Label, SourceTag } from '@trellis/ui';
import { itemTime, useFormat, useProject } from '../lib/project';
import { lastVisit, recordVisit } from '../lib/visits';
import { AppShell } from '../shell/AppShell';
import { Out } from '../shell/Out';
import { STATUS_TONE } from './Overview';

export function FlowDetail() {
  const { snapshot } = useProject();
  const { flowId = '' } = useParams();
  const base = `/p/${snapshot.id}`;
  const flow = snapshot.flows.find((f) => f.id === flowId);

  useEffect(() => {
    document.title = flow ? `${flow.name} · ${snapshot.name} · Trellis` : 'Trellis';
  }, [flow, snapshot.name]);

  if (!flow) {
    return (
      <AppShell crumbs={[{ label: 'Overview', to: base }, { label: 'Flow' }]}>
        <div className="page page--narrow">
          <h1 className="title title--sm">This flow isn't in the project.</h1>
          <p className="muted">Its section may have been renamed or archived in Figma.</p>
          <p>
            <Link to={base} className={buttonClass('primary')}>
              Back to overview
            </Link>
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell crumbs={[{ label: 'Overview', to: base }, { label: flow.name }]}>
      <FlowBody key={flow.id} flow={flow} snapshot={snapshot} base={base} />
    </AppShell>
  );
}

function FlowBody({ flow, snapshot, base }: { flow: Flow; snapshot: ProjectSnapshot; base: string }) {
  const format = useFormat(snapshot);
  const task = latestTask(flow, snapshot);
  const items = snapshot.activity
    .filter((a) => a.flowId === flow.id || (a.taskNumber !== undefined && flow.taskNumbers.includes(a.taskNumber)))
    .sort((a, b) => itemTime(a).localeCompare(itemTime(b)));

  // Read the previous visit once, then record this one.
  const [seenUntil] = useState(() => lastVisit(snapshot.id, flow.id, snapshot.seedLastVisit?.[flow.id]));
  useEffect(() => {
    recordVisit(snapshot.id, flow.id, format.now.toISOString());
  }, [snapshot.id, flow.id, format.now]);

  const sinceHandoff = items.filter((a) => !task || a.taskNumber !== task.number || !/^(Handed off|Issue #\d+ created)/.test(a.text));
  const nothingBack = flow.fidelity === 'new' && sinceHandoff.length === 0;

  if (nothingBack && task) return <NothingNew flow={flow} task={task} snapshot={snapshot} />;

  const status = flowStatus(flow, snapshot);
  const prs = pullRequestsFor(flow, snapshot).sort((a, b) => b.number - a.number);
  const steps = flowSteps(flow, snapshot);
  const earlier = seenUntil ? items.filter((a) => itemTime(a) <= seenUntil) : items;
  const fresh = seenUntil ? items.filter((a) => itemTime(a) > seenUntil) : [];
  const commentsDown = snapshot.sources.figmaComments.state === 'unavailable';
  const nextRound = flow.round + 1;
  const compose = `${base}/new?${new URLSearchParams({ flow: flow.id, ...(flow.frames[0] ? { frame: flow.frames[0].id } : {}) })}`;

  return (
    <div className="page page--rail">
      <div className="page__main">
        <header className="pagehead flowhead">
          <div>
            <Label>
              Flow · {pageLabel(flow.fidelity)}
              {flow.round > 0 ? ` · round ${flow.round}` : ''}
            </Label>
            <div className="flowhead__title">
              <h1 className="title">{flow.name}</h1>
              <Chip tone={STATUS_TONE[status.key]}>{status.label}</Chip>
            </div>
            {task && (
              <p className="pagehead__sub">
                Task #{task.number} · {task.goal}
              </p>
            )}
          </div>
          <div className="flowhead__links">
            {flow.figmaUrl && (
              <Out href={flow.figmaUrl} what={`the ${flow.name} section in Figma`} className={buttonClass('secondary')}>
                Open in Figma
              </Out>
            )}
            {prs[0] && (
              <Out href={prs[0].url} what={`PR #${prs[0].number} on GitHub`} className={buttonClass('secondary')}>
                PR #{prs[0].number}
              </Out>
            )}
          </div>
        </header>

        <section aria-label="What changed" className="timeline">
          {items.length === 0 && !commentsDown && <p className="muted">Nothing has been recorded for this flow in GitHub or Figma yet.</p>}
          <ol className={`timeline__list${fresh.length > 0 ? ' is-earlier' : ''}`}>
            {earlier.map((item) => (
              <TimelineRow key={item.id} item={item} format={format} />
            ))}
          </ol>
          {fresh.length > 0 && (
            <>
              <h2 className="timeline__new">
                <Label tone="accent">New since your last visit</Label>
              </h2>
              <ol className="timeline__list">
                {fresh.map((item) => (
                  <TimelineRow key={item.id} item={item} format={format} />
                ))}
              </ol>
            </>
          )}
          {seenUntil && fresh.length === 0 && items.length > 0 && <p className="muted small timeline__quiet">Nothing new since your last visit.</p>}
          {commentsDown && <UnavailableRow reason={snapshot.sources.figmaComments.reason ?? "Figma comments couldn't be reached."} />}
        </section>
      </div>

      <aside className="rail rail--panel" aria-label="Where things stand">
        <section aria-labelledby="stand-title" className="stand">
          <div className="rail__head">
            <h2 id="stand-title" className="h3">
              Where things stand
            </h2>
            <Label>From project state</Label>
          </div>
          {steps.length === 0 ? (
            <p className="muted small calm">Nothing is waiting on you here.</p>
          ) : (
            <ul className="steps">
              {steps.map((step) => (
                <StandCard key={step.id} step={step} />
              ))}
            </ul>
          )}
        </section>
        <div className="handoffbar">
          <Link to={compose} className={buttonClass('primary', 'lg', 't-btn--block')}>
            {flow.fidelity === 'current' ? 'Start a task' : `Start round ${nextRound}`}
          </Link>
          <p className="muted small center">{flow.frames[0] ? 'Opens a new task with this frame attached' : 'Opens a new task for this flow'}</p>
        </div>
      </aside>
    </div>
  );
}

function TimelineRow({ item, format }: { item: ActivityItem; format: ReturnType<typeof useFormat> }) {
  const isSummary = item.trust === 'ai-summary';
  return (
    <li className={`row${isSummary ? ' row--summary' : ''}`}>
      <span className="row__date">{isSummary ? '' : format.shortDate(item.at)}</span>
      <span className="row__text">{isSummary ? `“${item.text}”` : item.actor ? `${handle(item.actor)} ${item.text}` : item.text}</span>
      <SourceTag trust={item.trust} label={item.sourceLabel} />
    </li>
  );
}

function UnavailableRow({ reason }: { reason: string }) {
  const { refresh, refreshing } = useProject();
  return (
    <div className="row row--unavailable" role="status">
      <span className="row__date" aria-hidden="true">
        —
      </span>
      <span className="row__text">
        {reason} Nothing is shown rather than stale data.{' '}
        <button type="button" className="linklike" onClick={() => void refresh()} disabled={refreshing}>
          Retry
        </button>
      </span>
      <SourceTag trust="unavailable" />
    </div>
  );
}

function StandCard({ step }: { step: NextStep }) {
  return (
    <li className={`t-card stand__card${step.highlight ? ' t-card--attention' : ''}`}>
      <h3 className="step__title">{step.title}</h3>
      <p className="step__detail">{step.detail}</p>
      {step.action && (
        <Out href={step.action.url} what={step.action.label === 'Start review' ? 'this section in Figma, where the review happens' : 'this on GitHub'} className="stand__action" plain>
          {step.action.label} →
        </Out>
      )}
    </li>
  );
}

/** A hand-off with nothing back yet: say what will appear and when, and nudge once if it looks stuck. */
function NothingNew({ flow, task, snapshot }: { flow: Flow; task: Task; snapshot: ProjectSnapshot }) {
  const format = useFormat(snapshot);
  const stalled = isStalled(task, snapshot, format.now) ? stalledStep(task, format.now) : null;
  const waiting = [
    task.contextPaths.length === 0 ? 'Copilot opens a pull request that drafts brief.md' : `Copilot opens a pull request that mentions #${task.number}`,
    snapshot.figma ? 'Frames appear on Wireframes in the Figma file' : 'Frames appear on Wireframes in the new Figma file',
    'Someone comments or edits in either place',
  ];

  return (
    <div className="page page--narrow">
      <header className="pagehead">
        <Label>
          Flow · new · {task.assignedToCopilot ? 'handed off' : 'issue created'} {format.shortDate(task.createdAt)}
        </Label>
        <h1 className="title">{flow.name}</h1>
        <p className="pagehead__sub">
          Task #{task.number} · {task.goal}
        </p>
      </header>

      <p className="lead lead--ink">{task.assignedToCopilot ? 'Nothing has landed in GitHub or Figma since the hand-off.' : `Issue #${task.number} exists, but Copilot isn't assigned to it yet.`}</p>

      <Card tone="side" className="fills">
        <Label>This fills in when</Label>
        <ul>
          {waiting.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Card>

      {stalled && (
        <div className="nudge">
          <p>
            <strong>{stalled.title}</strong> {stalled.detail}
          </p>
          <Out href={task.url} what={`issue #${task.number} on GitHub`} className="nudge__link">
            Check the issue
          </Out>
        </div>
      )}
      {!task.assignedToCopilot && (
        <div className="nudge">
          <p>
            <strong>Copilot isn't assigned.</strong> The task is saved in the issue.
          </p>
          <Out href={task.url} what={`issue #${task.number} on GitHub`} className="nudge__link">
            Assign on GitHub
          </Out>
        </div>
      )}
    </div>
  );
}
