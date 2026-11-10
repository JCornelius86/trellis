import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { demo } from '../data';

/** Opens Trellis at an address, the way a person would land on it. */
function open(path: string | { pathname: string; state: unknown } = '/') {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  return user;
}

const project = '/p/demo-checkout';
const goal = 'Explore two ways to show saved cards. Keep the total visible.';

beforeEach(() => {
  demo.reset();
  // No local service in tests: Trellis should fall back to sample projects on its own.
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
});

describe('first run', () => {
  it('goes from the welcome screen to a hand-off, and the new task shows up in the project', async () => {
    const user = open('/');
    expect(await screen.findByRole('heading', { name: 'Start where your work is.' })).toBeInTheDocument();

    await user.click(await screen.findByRole('link', { name: /Start with an idea/ }));
    const box = await screen.findByLabelText('What do you want to accomplish?');
    expect(box).toHaveFocus();
    const send = screen.getByRole('button', { name: 'Hand off to Copilot' });
    expect(send).toBeDisabled();

    await user.type(box, goal);
    // The preview is the person's own words, not a rewrite.
    const preview = screen.getByRole('complementary', { name: 'What Copilot will get' });
    expect(within(preview).getByText(goal)).toBeInTheDocument();

    await user.click(send);
    expect(await screen.findByRole('heading', { name: /Issue #\d+ created and assigned to Copilot/ }, { timeout: 4000 })).toHaveFocus();
    expect(screen.getByText(goal)).toBeInTheDocument();
    expect(screen.getByText(/Trellis can't see the Copilot session itself/)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Back to overview' }));
    expect(await screen.findByRole('heading', { name: 'Checkout refresh' })).toBeInTheDocument();
    // A flow that came from an idea is named after the goal, and waits at "new".
    expect(screen.getAllByText(/Explore two ways to show/).length).toBeGreaterThan(0);
  });

  it('hands off with Ctrl+Enter', async () => {
    const user = open(`${project}/new`);
    await user.type(await screen.findByLabelText('What do you want to accomplish?'), 'Tidy the cart summary{Control>}{Enter}{/Control}');
    expect(await screen.findByRole('heading', { name: /created and assigned to Copilot/ }, { timeout: 4000 })).toBeInTheDocument();
  });

  it('keeps a draft if you leave the composer and come back', async () => {
    const user = open(`${project}/new`);
    await user.type(await screen.findByLabelText('What do you want to accomplish?'), 'Half a thought');
    await user.click(screen.getAllByRole('link', { name: 'Overview' })[0]!);
    await screen.findByRole('heading', { name: 'Checkout refresh' });
    await user.click(screen.getAllByRole('link', { name: /New task/ })[0]!);
    expect(await screen.findByLabelText('What do you want to accomplish?')).toHaveValue('Half a thought');
  });
});

describe('when something goes wrong', () => {
  it('says the issue exists when Copilot could not be assigned, and keeps the task', async () => {
    demo.setScenario('assign-fails');
    const user = open(`${project}/new`);
    await user.type(await screen.findByLabelText('What do you want to accomplish?'), goal);
    await user.click(screen.getByRole('button', { name: 'Hand off to Copilot' }));

    expect(await screen.findByRole('heading', { name: /Issue #\d+ created\. Copilot couldn't be assigned\./ }, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText('Assign Copilot on GitHub')).toBeInTheDocument();
    expect(screen.getByLabelText('Prepared task text')).toHaveTextContent(goal);
  });

  it('sends nothing when GitHub is down, and leaves the task where it was', async () => {
    demo.setScenario('github-down');
    const user = open(`${project}/new`);
    const box = await screen.findByLabelText('What do you want to accomplish?');
    await user.type(box, goal);
    await user.click(screen.getByRole('button', { name: 'Hand off to Copilot' }));

    const alert = await screen.findByRole('alert', {}, { timeout: 4000 });
    expect(within(alert).getByText('Nothing was sent')).toBeInTheDocument();
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(within(alert).getByText('Create the issue on GitHub')).toBeInTheDocument();
    expect(box).toHaveValue(goal);

    // GitHub comes back. Trying again works without retyping anything.
    demo.setScenario('ok');
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: /created and assigned to Copilot/ }, { timeout: 4000 })).toBeInTheDocument();
  });

  it('shows the task to copy by hand when the browser refuses to copy', async () => {
    demo.setScenario('copy-blocked');
    const user = open(`${project}/new`);
    await user.type(await screen.findByLabelText('What do you want to accomplish?'), goal);
    await user.click(screen.getByRole('button', { name: 'Hand off to Copilot' }));
    await screen.findByRole('heading', { name: /created and assigned to Copilot/ }, { timeout: 4000 });

    await user.click(screen.getByRole('button', { name: 'Copy task' }));
    expect(await screen.findByText("Copy didn't work")).toBeInTheDocument();
    expect(screen.getByLabelText('Prepared task text')).toHaveFocus();
  });

  it('says comments are unavailable instead of showing zero questions', async () => {
    demo.setScenario('comments-down');
    open(`${project}/flows/payment`);
    await screen.findByRole('heading', { name: 'Payment' });
    expect(screen.getAllByRole('status').some((node) => /comments/i.test(node.textContent ?? ''))).toBe(true);
    expect(screen.queryByText(/0 open questions/)).not.toBeInTheDocument();
  });
});

describe('right after a hand-off', () => {
  it("shows the result even if the project list hasn't caught up with the new issue", async () => {
    const task = { number: 99, title: 'Gift message', goal: 'A gift message step.', url: 'https://github.com/acme/shop/issues/99', contextPaths: [], createdAt: '2026-11-11T14:42:00Z', createdBy: { login: 'jc', kind: 'person' }, assignedToCopilot: true, state: 'open' };
    open({ pathname: `${project}/handoff/99`, state: { task } });
    expect(await screen.findByRole('heading', { name: 'Issue #99 created and assigned to Copilot' })).toBeInTheDocument();
  });
});

describe('coming back to a flow', () => {
  it('separates what is new since the last visit, then stops calling it new', async () => {
    open(`${project}/flows/payment`);
    await screen.findByRole('heading', { name: 'Payment' });
    expect(screen.getByText('New since your last visit')).toBeInTheDocument();
    // What an AI wrote is labelled as such.
    expect(document.querySelectorAll('.t-source--ai-summary').length).toBeGreaterThan(0);
  });

  it('tells you plainly when nothing has happened yet', async () => {
    open('/p/demo-volunteer/flows/shift-swap');
    expect(await screen.findByRole('heading', { name: 'Shift swap' })).toBeInTheDocument();
    expect(screen.getByText('This fills in when')).toBeInTheDocument();
  });
});

describe('addresses that lead nowhere', () => {
  it('offers a way back', async () => {
    open('/somewhere/else');
    expect(await screen.findByText("There's nothing at this address.")).toBeInTheDocument();
    open(`${project}/flows/not-a-flow`);
    expect(await screen.findByText("This flow isn't in the project.")).toBeInTheDocument();
  });
});
