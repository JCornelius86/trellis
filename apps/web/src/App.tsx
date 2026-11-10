import { Link, Route, Routes } from 'react-router-dom';
import { buttonClass } from '@trellis/ui';
import { SessionProvider } from './lib/session';
import { ToastProvider } from './lib/toast';
import { Composer } from './screens/Composer';
import { FlowDetail } from './screens/FlowDetail';
import { Handoff } from './screens/Handoff';
import { Overview } from './screens/Overview';
import { ProjectRoute } from './screens/ProjectRoute';
import { Setup } from './screens/Setup';
import { Welcome } from './screens/Welcome';

/**
 * The first-run journey (decision D14):
 * welcome → project overview → new task → hand-off → flow detail.
 */
export function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/p/:projectId" element={<ProjectRoute />}>
            <Route index element={<Overview />} />
            <Route path="new" element={<Composer />} />
            <Route path="handoff/:number" element={<Handoff />} />
            <Route path="flows/:flowId" element={<FlowDetail />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </SessionProvider>
  );
}

function NotFound() {
  return (
    <main id="main" className="welcome__main">
      <h1 className="title title--sm">There's nothing at this address.</h1>
      <p>
        <Link to="/" className={buttonClass('primary')}>
          Back to start
        </Link>
      </p>
    </main>
  );
}
