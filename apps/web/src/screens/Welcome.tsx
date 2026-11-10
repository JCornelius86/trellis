import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ago, projectLine, type ProjectSnapshot } from '@trellis/core';
import { Avatar, buttonClass, Chip, Icon, Label, Logo } from '@trellis/ui';
import { useNow } from '../lib/project';
import { useProjects } from '../lib/projects';
import { useSession } from '../lib/session';
import { DemoBar } from '../shell/DemoBar';

const SEEN_KEY = 'trellis.seen';

/** Remembers, in this browser only, whether you've been here before, to pick "Welcome" or "Welcome back". */
function useReturning(): boolean {
  const [returning] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Not being able to remember is fine.
    }
  }, []);
  return returning;
}

export function Welcome() {
  const session = useSession();
  const projects = useProjects();
  const returning = useReturning();
  const primary = projects.live[0] ?? projects.samples[0];
  const newTask = primary ? `/p/${primary.id}/new` : '/setup';
  const serviceRunning = session.status !== null && session.status !== undefined;

  useEffect(() => {
    document.title = 'Trellis';
  }, []);

  return (
    <div className="welcome">
      <a className="skip" href="#main">
        Skip to content
      </a>
      {!projects.loading && projects.live.length === 0 && <DemoBar />}

      <header className="welcome__bar">
        <span className="brand">
          <Logo />
          <span>Trellis</span>
        </span>
        <div className="welcome__status">
          {serviceRunning ? (
            <>
              <Connection name="GitHub" ok={session.status?.github.state === 'ok'} />
              <Connection name="Figma" ok={session.status?.figma.state === 'ok'} />
            </>
          ) : (
            session.status === null && <Chip tone="outline">Demo</Chip>
          )}
          {primary?.viewer && <Avatar person={primary.viewer} size={30} />}
        </div>
      </header>

      <main id="main" className="welcome__main" tabIndex={-1}>
        <div className="welcome__intro">
          <Label>{returning ? 'Welcome back' : 'Welcome'}</Label>
          <h1 className="display">Start where your work is.</h1>
          <p className="lead">Bring an idea, wireframes, or Figma designs. Iterate with Copilot. Finish with a prototype your team agreed on.</p>
        </div>

        <section aria-label="How a project moves" className="stages">
          <ol className="stages__row">
            <Stage step="01 · Idea" text="A goal and some context. No designs yet." art="idea">
              <Link to={newTask} className={buttonClass('primary', 'md', 't-btn--block')}>
                Start with an idea
              </Link>
            </Stage>
            <Stage step="02 · Lo-fi" text="Rough flows on the Wireframes page." art="lofi">
              <Link to={`${newTask}?pick=wireframes`} className={buttonClass('secondary', 'md', 't-btn--block')}>
                From wireframes
              </Link>
            </Stage>
            <Stage step="03 · Hi-fi" text="Design-system frames on Explorations." art="hifi">
              <Link to={`${newTask}?pick=explorations`} className={buttonClass('secondary', 'md', 't-btn--block')}>
                Bring Figma designs
              </Link>
            </Stage>
            <Stage step="04 · Prototype" text="Built by Copilot from Current only." art="prototype" />
            <Stage step="05 · Test" text="Team and users try it. Feedback becomes the next goal." art="test" />
          </ol>
          <p className="stages__loop">
            <Label>Next iteration · back to lo-fi or hi-fi</Label>
          </p>
        </section>

        {serviceRunning && !session.live && (
          <section className="t-card connect" aria-labelledby="connect-title">
            <div>
              <h2 id="connect-title" className="h3">
                Connect your repository
              </h2>
              <p className="muted">Trellis is running, but it isn't connected to GitHub yet. Until then, explore the sample projects.</p>
            </div>
            <Link to="/setup" className={buttonClass('primary')}>
              Set up
            </Link>
          </section>
        )}

        {projects.live.length > 0 && (
          <ProjectList title="Your projects" projects={projects.live}>
            <Link to={`/p/${projects.samples[0]?.id ?? ''}`} className="welcome__demo">
              Open the demo project <Icon name="arrowRight" size={13} />
            </Link>
          </ProjectList>
        )}
        {projects.liveError && (
          <p className="notice" role="alert">
            Your project couldn't be loaded: {projects.liveError} <Link to="/setup">Check setup</Link>
          </p>
        )}
        {projects.live.length === 0 && projects.samples.length > 0 && <ProjectList title="Sample projects" projects={projects.samples} />}
      </main>
    </div>
  );
}

function Connection({ name, ok }: { name: string; ok: boolean }) {
  if (ok) {
    return (
      <span className="connection">
        {name} <Icon name="check" size={13} label="connected" />
      </span>
    );
  }
  return (
    <Link to="/setup" className="connection connection--off">
      Connect {name}
    </Link>
  );
}

type Art = 'idea' | 'lofi' | 'hifi' | 'prototype' | 'test';

function Stage({ step, text, art, children }: { step: string; text: string; art: Art; children?: ReactNode }) {
  return (
    <li className={`stage stage--${art}`}>
      <Label>{step}</Label>
      <div className="stage__art" aria-hidden="true">
        {art === 'idea' && (
          <>
            <span className="bar w70" />
            <span className="bar w50" />
            <span className="bar w60" />
          </>
        )}
        {(art === 'lofi' || art === 'hifi' || art === 'prototype') && (
          <>
            <span className="tiles">
              <span />
              <span />
            </span>
            {art !== 'lofi' && <span className="pill" />}
          </>
        )}
        {art === 'test' && (
          <>
            <span className="note">
              <i className="dot dot--attention" />
              <span className="bar w100" />
            </span>
            <span className="note">
              <i className="dot dot--agreed" />
              <span className="bar w70" />
            </span>
          </>
        )}
      </div>
      <p className="stage__text">{text}</p>
      {children && <div className="stage__action">{children}</div>}
    </li>
  );
}

function ProjectList({ title, projects, children }: { title: string; projects: ProjectSnapshot[]; children?: ReactNode }) {
  return (
    <section className="projects" aria-labelledby="projects-title">
      <div className="projects__head">
        <h2 id="projects-title">
          <Label>{title}</Label>
        </h2>
        {children}
      </div>
      <ul className="projects__grid">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </ul>
    </section>
  );
}

function ProjectCard({ project }: { project: ProjectSnapshot }) {
  const now = useNow(project);
  const { line, attention } = projectLine(project, now);
  const latest = project.activity.map((a) => a.at).sort().at(-1);
  const updated = latest && !line.includes('waiting') ? ` · updated ${ago(latest, now)} ago` : '';
  return (
    <li className="t-card project">
      <div className="project__text">
        <h3 className="project__name">{project.name}</h3>
        <p className="muted small">
          {line}
          {updated}
        </p>
      </div>
      {attention > 0 && <Chip tone="attention">{attention === 1 ? '1 needs attention' : `${attention} need attention`}</Chip>}
      <Link to={`/p/${project.id}`} className={buttonClass('secondary')} aria-label={`Open ${project.name}`}>
        Open
      </Link>
    </li>
  );
}
