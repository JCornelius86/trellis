import { Link, Outlet, useParams } from 'react-router-dom';
import { buttonClass, Label, Logo } from '@trellis/ui';
import { isSampleId } from '../data';
import { ProjectProvider, useProjectLoader } from '../lib/project';

/** Loads the project named in the URL, then shows the screen for the rest of the path. */
export function ProjectRoute() {
  const { projectId = '' } = useParams();
  const { load, refresh, refreshing } = useProjectLoader(projectId);

  if (load.state === 'ready') {
    return (
      <ProjectProvider value={{ snapshot: load.snapshot, refresh, refreshing }}>
        <Outlet />
      </ProjectProvider>
    );
  }

  return (
    <div className="welcome">
      <header className="welcome__bar">
        <Link to="/" className="brand">
          <Logo />
          <span>Trellis</span>
        </Link>
      </header>
      <main id="main" className="welcome__main" aria-busy={load.state === 'loading'}>
        {load.state === 'loading' && (
          <p className="muted" role="status">
            {isSampleId(projectId) ? 'Opening the sample project…' : 'Reading GitHub and Figma…'}
          </p>
        )}
        {load.state === 'missing' && (
          <Problem title="That project isn't here." body="The link may be old, or the project belongs to someone else's Trellis." />
        )}
        {load.state === 'error' && <Problem title="The project couldn't be loaded." body={load.message} retry={() => void refresh()} setup />}
      </main>
    </div>
  );
}

function Problem({ title, body, retry, setup }: { title: string; body: string; retry?: () => void; setup?: boolean }) {
  return (
    <div className="welcome__intro" role="alert">
      <Label tone="attention">Something's off</Label>
      <h1 className="title title--sm">{title}</h1>
      <p className="lead lead--sm">{body}</p>
      <div className="result__actions">
        {retry && (
          <button type="button" className={buttonClass('primary')} onClick={retry}>
            Try again
          </button>
        )}
        {setup && (
          <Link to="/setup" className={buttonClass('secondary')}>
            Check setup
          </Link>
        )}
        <Link to="/" className={buttonClass('secondary')}>
          Back to start
        </Link>
      </div>
    </div>
  );
}
