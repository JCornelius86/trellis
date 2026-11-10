import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button, buttonClass, Card, Icon, Label, Logo } from '@trellis/ui';
import { useSession } from '../lib/session';

/**
 * A plain checklist of what is connected. This screen was not part of the
 * approved designs; it exists so the first run is workable, and is logged as
 * needing a design round.
 */
export function Setup() {
  const { status, recheck } = useSession();
  const running = status !== null && status !== undefined;

  useEffect(() => {
    document.title = 'Set up · Trellis';
  }, []);

  return (
    <div className="welcome">
      <header className="welcome__bar">
        <Link to="/" className="brand">
          <Logo />
          <span>Trellis</span>
        </Link>
      </header>
      <main id="main" className="welcome__main setup">
        <div className="welcome__intro">
          <Label>Set up</Label>
          <h1 className="title">Connect one repository and one Figma file</h1>
          <p className="lead lead--sm">
            Trellis reads from GitHub and Figma through a small service on your computer. Your tokens stay in that service. They are never sent to the browser or saved in
            Git.
          </p>
        </div>

        <ol className="checklist">
          <Check done={running} title="The local service is running">
            {running ? 'Started with npm start.' : 'Run npm start in the Trellis folder. It starts the service and this page together.'}
          </Check>
          <Check done={status?.github.state === 'ok'} title="GitHub">
            {status?.github.state === 'ok'
              ? `Connected to ${status.github.repo} as @${status.github.login}.`
              : (status?.github.reason ?? 'Add GITHUB_TOKEN and GITHUB_REPO to the .env file, then start again.')}
          </Check>
          <Check done={status?.figma.state === 'ok'} title="Figma" optional>
            {status?.figma.state === 'ok'
              ? 'Connected to your project file.'
              : (status?.figma.reason ?? 'Add FIGMA_TOKEN and FIGMA_FILE_KEY to the .env file. Without it you can still hand off ideas; flows appear once a file is connected.')}
          </Check>
          <Check done={null} title="Copilot's coding agent is enabled for the repository">
            Trellis finds out at the first hand-off. If Copilot can't be assigned, the issue is still created and you get a manual next step.
          </Check>
          <Check done={null} title="Copilot can reach Figma">
            Trellis can't verify this (assumption A2). It is set in the repository's Copilot settings, with the Figma MCP server.
          </Check>
        </ol>

        <Card className="setup__how">
          <Label>How</Label>
          <ol>
            <li>
              Copy <code>.env.example</code> to <code>.env</code> in the Trellis folder.
            </li>
            <li>Fill in the four values. The file explains where each one comes from.</li>
            <li>
              Stop Trellis and run <code>npm start</code> again.
            </li>
          </ol>
        </Card>

        <div className="result__actions">
          <Button variant="primary" onClick={recheck}>
            Check again
          </Button>
          <Link to="/" className={buttonClass('secondary')}>
            Back to start
          </Link>
        </div>
      </main>
    </div>
  );
}

function Check({ done, title, optional = false, children }: { done: boolean | null | undefined; title: string; optional?: boolean; children: ReactNode }) {
  const state = done === null ? 'unknown' : done ? 'done' : 'todo';
  return (
    <li className={`check check--${state}`}>
      <span className="check__mark">{state === 'done' ? <Icon name="check" size={14} label="Done" /> : state === 'unknown' ? <Icon name="question" size={14} label="Can't be checked" /> : <Icon name="circle" size={14} label="Not yet" />}</span>
      <div>
        <h2 className="check__title">
          {title} {optional && <span className="muted small">optional</span>}
        </h2>
        <p className="muted small">{children}</p>
      </div>
    </li>
  );
}
