import { useEffect, useId, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { handle, type ActivityItem, type ProjectSnapshot } from '@trellis/core';
import { Avatar, Icon, Label, Logo } from '@trellis/ui';
import { useFormat, useProject } from '../lib/project';
import { useProjects } from '../lib/projects';
import { DemoBar } from './DemoBar';
import { Out } from './Out';

export interface Crumb {
  label: string;
  to?: string;
}

interface AppShellProps {
  /** Breadcrumbs for inner screens. The overview shows the repository and Figma file instead. */
  crumbs?: Crumb[];
  actions?: ReactNode;
  children: ReactNode;
}

/** The frame around every project screen: sidebar, top bar, and the sample-data bar. */
export function AppShell({ crumbs, actions, children }: AppShellProps) {
  const { snapshot, refresh, refreshing } = useProject();
  const format = useFormat(snapshot);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const menuId = useId();

  // Close the mobile menu when the route changes or Escape is pressed.
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="shell__body">
        {menuOpen && <button type="button" className="shell__scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
        <aside id={menuId} className={`sidebar${menuOpen ? ' is-open' : ''}`} aria-label="Project">
          <Sidebar snapshot={snapshot} />
        </aside>

        <div className="shell__main">
          {snapshot.sample && <DemoBar onChange={() => void refresh()} />}
          <header className="topbar">
            <button type="button" className="topbar__menu" aria-expanded={menuOpen} aria-controls={menuId} onClick={() => setMenuOpen((open) => !open)}>
              <Icon name="menu" size={18} label={menuOpen ? 'Close menu' : 'Open menu'} />
            </button>

            {crumbs ? (
              <nav className="crumbs" aria-label="Breadcrumb">
                <ol>
                  {crumbs.map((crumb, index) => (
                    <li key={crumb.label} aria-current={index === crumbs.length - 1 ? 'page' : undefined}>
                      {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
                    </li>
                  ))}
                </ol>
              </nav>
            ) : (
              <div className="topbar__sources">
                <Out href={snapshot.repo.url} what={`${snapshot.repo.fullName} on GitHub`} className="mono">
                  {snapshot.repo.fullName}
                </Out>
                {snapshot.figma && (
                  <Out href={snapshot.figma.url} what={`${snapshot.figma.name} in Figma`} className="mono">
                    {snapshot.figma.name}
                  </Out>
                )}
              </div>
            )}

            <div className="topbar__end">
              <button type="button" className="sync" onClick={() => void refresh()} disabled={refreshing} title="Check GitHub and Figma again">
                <span>{refreshing ? 'Syncing…' : `Synced ${format.agoLong(snapshot.syncedAt)}`}</span>
                <Icon name="refresh" size={13} />
              </button>
              {actions}
            </div>
          </header>

          <main id="main" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ snapshot }: { snapshot: ProjectSnapshot }) {
  const navigate = useNavigate();
  const projects = useProjects();
  const format = useFormat(snapshot);
  const all = [...projects.live, ...projects.samples];
  const options = all.some((p) => p.id === snapshot.id) ? all : [snapshot, ...all];
  const base = `/p/${snapshot.id}`;

  return (
    <>
      <Link to="/" className="brand">
        <Logo />
        <span>Trellis</span>
      </Link>

      <label className="switcher">
        <span className="t-sr">Project</span>
        <select value={snapshot.id} onChange={(event) => navigate(`/p/${event.target.value}`)}>
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.sample && projects.live.length > 0 ? ' (sample)' : ''}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={14} />
      </label>

      <nav aria-label="Sections">
        <ul className="nav">
          <li>
            <Link to={base} className="nav__item is-active" aria-current="page">
              Overview
            </Link>
          </li>
          {/* These sections aren't designed or built yet. They are shown as unavailable rather than left out, so the plan is visible. */}
          {['Prototypes', 'Activity', 'Project'].map((label) => (
            <li key={label}>
              <span className="nav__item is-soon" aria-disabled="true">
                {label}
                <span className="nav__soon">not built yet</span>
              </span>
            </li>
          ))}
        </ul>
      </nav>

      {snapshot.links.length > 0 && (
        <section aria-labelledby="quick-links">
          <h2 id="quick-links" className="sidebar__heading">
            <Label>Quick links</Label>
          </h2>
          <ul className="quicklinks">
            {snapshot.links.map((link) => (
              <li key={link.label}>
                <Out href={link.url} what={link.label.toLowerCase()}>
                  {link.label}
                </Out>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RecentlyActive items={recentPeople(snapshot.activity)} format={format} />
    </>
  );
}

/** The newest thing each person (or Copilot) did, three at most. From Figma and GitHub history, not live presence (D11). */
export function recentPeople(activity: ActivityItem[]): ActivityItem[] {
  const seen = new Set<string>();
  const out: ActivityItem[] = [];
  for (const item of [...activity].sort((a, b) => b.at.localeCompare(a.at))) {
    if (!item.actor || seen.has(item.actor.login)) continue;
    seen.add(item.actor.login);
    out.push(item);
    if (out.length === 3) break;
  }
  return out;
}

function RecentlyActive({ items, format }: { items: ActivityItem[]; format: ReturnType<typeof useFormat> }) {
  if (items.length === 0) return null;
  return (
    <section className="recent" aria-labelledby="recently-active">
      <h2 id="recently-active" className="sidebar__heading">
        <Label>Recently active</Label>
      </h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Avatar person={item.actor!} />
            <p>
              <span>
                <b>{handle(item.actor!)}</b> {item.brief ?? item.text}
              </span>
              <span className="recent__meta">
                {item.sourceLabel} · {format.ago(item.at)}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
