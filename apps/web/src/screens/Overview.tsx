import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  fidelityCounts,
  flowLine,
  flowStatus,
  handle,
  nextSteps,
  plural,
  projectSummary,
  type Flow,
  type FlowStatusKey,
  type NextStep,
  type ProjectSnapshot,
  type PullRequest,
} from '@trellis/core';
import { Avatar, buttonClass, Chip, FlowThumb, Icon, Label, type ChipTone, type IconName } from '@trellis/ui';
import { useFormat, useProject } from '../lib/project';
import { AppShell } from '../shell/AppShell';
import { Out } from '../shell/Out';
import { SourceNotices } from '../shell/SourceNotices';

export const STATUS_TONE: Record<FlowStatusKey, ChipTone> = {
  agreed: 'agreed',
  question: 'warning',
  ready: 'attention',
  exploring: 'soft',
  wireframing: 'soft',
  waiting: 'outline',
  unassigned: 'attention',
};

const STEP_ICON: Record<NextStep['kind'], IconName> = {
  review: 'diamond',
  question: 'question',
  'no-prototype': 'circle',
  'pr-no-reviewer': 'circle',
  assumption: 'circle',
  stalled: 'circle',
  'not-assigned': 'circle',
};

export function Overview() {
  const { snapshot } = useProject();
  const format = useFormat(snapshot);
  const base = `/p/${snapshot.id}`;
  const steps = nextSteps(snapshot, format.now);
  const agreed = snapshot.flows.filter((f) => f.fidelity === 'current').length;

  useEffect(() => {
    document.title = `${snapshot.name} · Trellis`;
  }, [snapshot.name]);

  function jumpToAttention() {
    const heading = document.getElementById('attention-title');
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    heading?.scrollIntoView?.({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    heading?.focus({ preventScroll: true });
  }

  return (
    <AppShell
      actions={
        <Link to={`${base}/new`} className={buttonClass('primary')}>
          New task
        </Link>
      }
    >
      <div className="page page--rail">
        <div className="page__main">
          <header className="pagehead">
            <Label>Overview</Label>
            <h1 className="title">{snapshot.name}</h1>
            <p className="pagehead__sub">{projectSummary(snapshot, format.now)}</p>
            {steps.length > 0 && (
              // On a phone the list sits below the flows, so this is the shortcut to it.
              <button type="button" className="jump" onClick={jumpToAttention}>
                <Chip tone="attention">
                  {steps.length} {steps.length === 1 ? 'needs' : 'need'} attention
                </Chip>
                <span className="t-sr">Jump to the list</span>
                <Icon name="chevronDown" size={14} />
              </button>
            )}
          </header>

          <SourceNotices snapshot={snapshot} />
          <FidelityBar flows={snapshot.flows} />

          <section aria-labelledby="flows-title" className="flows">
            <div className="section-head">
              <h2 id="flows-title" className="h3">
                Flows{' '}
                {snapshot.flows.length > 0 && (
                  <span className="count">
                    {agreed} of {snapshot.flows.length} agreed
                  </span>
                )}
              </h2>
              {snapshot.figma && agreed > 0 && (
                <Out href={snapshot.figma.url} what="the Current page in Figma" className="small">
                  Open Current in Figma
                </Out>
              )}
            </div>
            <ul className="flowgrid">
              {snapshot.flows.map((flow) => (
                <FlowCard key={flow.id} flow={flow} snapshot={snapshot} base={base} />
              ))}
              <li>
                <Link to={`${base}/new`} className="flowcard flowcard--start">
                  <span className="flowcard__plus">
                    <Icon name="plus" size={16} />
                  </span>
                  <span className="flowcard__start-title">Start a flow</span>
                  <span className="muted small">From an idea or a frame</span>
                </Link>
              </li>
            </ul>
          </section>
        </div>

        <aside className="rail" aria-label="What needs attention">
          <section aria-labelledby="attention-title">
            <div className="rail__head">
              <h2 id="attention-title" className="h3" tabIndex={-1}>
                Needs attention {steps.length > 0 && <span className="count count--lg">{steps.length}</span>}
              </h2>
              <Label>From project state</Label>
            </div>
            {steps.length === 0 ? (
              <p className="muted small calm">Nothing needs you right now.</p>
            ) : (
              <ul className="steps">
                {steps.map((step) => (
                  <StepCard key={step.id} step={step} base={base} />
                ))}
              </ul>
            )}
          </section>

          <PullRequests snapshot={snapshot} />
        </aside>
      </div>
    </AppShell>
  );
}

function FidelityBar({ flows }: { flows: Flow[] }) {
  const counts = fidelityCounts(flows);
  const parts = [
    { key: 'wireframes', n: counts.wireframes, text: 'in Wireframes' },
    { key: 'explorations', n: counts.explorations, text: 'in Explorations' },
    { key: 'current', n: counts.current, text: 'on Current' },
  ].filter((p) => p.n > 0);
  if (parts.length === 0) return null;
  return (
    <ul className="fidelity" aria-label="Where the flows are">
      {parts.map((p) => (
        <li key={p.key} className={`fidelity__part fidelity__part--${p.key}`} style={{ flexGrow: p.n }}>
          <span className="fidelity__bar" />
          <span className="fidelity__text">
            <b>{p.n}</b> {p.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FlowCard({ flow, snapshot, base }: { flow: Flow; snapshot: ProjectSnapshot; base: string }) {
  const status = flowStatus(flow, snapshot);
  const who = flow.lastEdit?.by;
  return (
    <li>
      <Link to={`${base}/flows/${flow.id}`} className="flowcard">
        <FlowThumb fidelity={flow.fidelity} />
        <span className="flowcard__top">
          <span className="flowcard__name" title={flow.name}>
            {flow.name}
          </span>
          <Chip tone={STATUS_TONE[status.key]}>{status.label}</Chip>
        </span>
        <span className="flowcard__line">{flowLine(flow, snapshot)}</span>
        <span className="flowcard__who">
          {who && (
            <>
              <Avatar person={who} size={22} />
              <span className="ink">{handle(who)}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{plural(flow.openQuestions.length, 'question')}</span>
        </span>
      </Link>
    </li>
  );
}

function StepCard({ step, base }: { step: NextStep; base: string }) {
  const compose = step.suggestedGoal ? `${base}/new?${new URLSearchParams({ ...(step.flowId ? { flow: step.flowId } : {}), goal: step.suggestedGoal })}` : null;
  return (
    <li className={`t-card step${step.highlight ? ' t-card--attention' : ''}`}>
      <span className="step__icon">
        <Icon name={STEP_ICON[step.kind]} size={13} />
      </span>
      <div className="step__body">
        <h3 className="step__title">{step.title}</h3>
        <p className="step__detail">{step.detail}</p>
        <div className="step__actions">
          {compose && (
            <Link to={compose} className={buttonClass('primary', 'sm')}>
              Ask Copilot
            </Link>
          )}
          {step.action && (
            <Out href={step.action.url} what="this on GitHub" className={buttonClass('primary', 'sm')} plain>
              {step.action.label}
            </Out>
          )}
          {step.flowId && (
            <Link to={`${base}/flows/${step.flowId}`} className={buttonClass('secondary', 'sm')} aria-label={`Open ${step.title}`}>
              Open
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

function PullRequests({ snapshot }: { snapshot: ProjectSnapshot }) {
  const format = useFormat(snapshot);
  const open = snapshot.pullRequests.filter((pr) => pr.state === 'open');
  const weekAgo = format.now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const merged = snapshot.pullRequests.filter((pr) => pr.state === 'merged' && pr.mergedAt && new Date(pr.mergedAt).getTime() >= weekAgo);
  if (open.length === 0 && merged.length === 0) return null;

  return (
    <section aria-labelledby="prs-title" className="prs">
      <div className="rail__head">
        <h2 id="prs-title" className="h3">
          Pull requests <span className="count count--lg">{open.length} open</span>
        </h2>
        <Out href={`${snapshot.repo.url}/pulls`} what="the pull requests on GitHub" className="small muted">
          GitHub
        </Out>
      </div>
      <ul className="prs__list">
        {open.map((pr) => (
          <PullRequestRow key={pr.number} pr={pr} />
        ))}
      </ul>
      {merged.length > 0 && <p className="muted small">Merged this week: {merged.map((pr) => `#${pr.number} ${pr.title}`).join(' · ')}</p>}
    </section>
  );
}

function PullRequestRow({ pr }: { pr: PullRequest }) {
  const needsReview = pr.reviewers.length === 0 && !pr.reviewed;
  const sub = pr.fromTrellis ? `From Trellis · ${handle(pr.author)}` : `${handle(pr.author)} · ${needsReview ? 'no reviewer yet' : pr.reviewed ? 'reviewed' : 'review requested'}`;
  return (
    <li className="pr">
      <div>
        <Out href={pr.url} what={`PR #${pr.number} on GitHub`} className="pr__title" plain>
          <span className="muted">#{pr.number}</span> {pr.title}
        </Out>
        <p className="muted small">{sub}</p>
      </div>
      {needsReview && !pr.fromTrellis ? <Chip tone="attention">Needs review</Chip> : <Chip tone="outline">Open</Chip>}
    </li>
  );
}
