import { describe, expect, it } from 'vitest';
import {
  ago,
  agoLong,
  assembleTask,
  cleanPageName,
  dateTime,
  describeContextFile,
  encodeMarker,
  fidelityOfPage,
  flowNameFromGoal,
  flowsFromFigma,
  goalFromBody,
  initials,
  newIssueUrl,
  parseAssumptions,
  parseMarker,
  parseSectionName,
  person,
  shortDate,
  titleFromGoal,
  type FrameRef,
} from './index';

describe('Figma page and section names (D10, D16)', () => {
  it('ignores the leading icon on a page name', () => {
    expect(cleanPageName('✏️ Wireframes (lo-fi)')).toBe('Wireframes (lo-fi)');
    expect(cleanPageName('✅ Current')).toBe('Current');
    expect(cleanPageName('Read me')).toBe('Read me');
  });

  it('treats divider pages as not a page', () => {
    expect(cleanPageName('---')).toBeNull();
    expect(cleanPageName(' — ')).toBeNull();
  });

  it('places pages at a fidelity', () => {
    expect(fidelityOfPage('✏️ Wireframes (lo-fi)')).toBe('wireframes');
    expect(fidelityOfPage('🎨 Explorations (hi-fi)')).toBe('explorations');
    expect(fidelityOfPage('✅ Current')).toBe('current');
    expect(fidelityOfPage('🛠 Working')).toBeNull();
    expect(fidelityOfPage('---')).toBeNull();
  });

  it('reads flow, date, and round from a section name', () => {
    expect(parseSectionName('Payment · 2026-11-10')).toEqual({ flow: 'Payment', date: '2026-11-10', round: undefined });
    expect(parseSectionName('First-run journey · 2026-11-09 · round 4')).toEqual({ flow: 'First-run journey', date: '2026-11-09', round: 4 });
    expect(parseSectionName('Scratch')).toBeNull();
  });

  it('builds flows at their highest fidelity, with rounds counted there', () => {
    const flows = flowsFromFigma(
      [
        { name: '📖 Read me', sections: [] },
        { name: '---', sections: [] },
        {
          name: '✏️ Wireframes (lo-fi)',
          sections: [
            { id: '1:1', name: 'Payment · 2026-11-09', frames: [{ id: '1:2', name: 'Payment / Card list / Default' }] },
            { id: '1:3', name: 'Payment · 2026-11-10', frames: [{ id: '1:4', name: 'Payment / Card list / Option B' }] },
            { id: '1:5', name: 'Cart · 2026-11-01', frames: [] },
            { id: '1:9', name: 'Notes', frames: [] },
          ],
        },
        { name: '✅ Current', sections: [{ id: '2:1', name: 'Cart · 2026-11-03', frames: [{ id: '2:2', name: 'Cart / Items / Default' }] }] },
      ],
      'KEY',
    );
    expect(flows.map((f) => [f.id, f.fidelity, f.round, f.sectionDate])).toEqual([
      ['payment', 'wireframes', 2, '2026-11-10'],
      ['cart', 'current', 1, '2026-11-03'],
    ]);
    expect(flows[0]!.frames[0]).toMatchObject({ name: 'Payment / Card list / Option B', page: 'Wireframes', url: 'https://www.figma.com/design/KEY?node-id=1-4' });
  });
});

describe('prepared task (D8)', () => {
  const frame: FrameRef = { id: '412:88', name: 'Payment step', page: 'Wireframes', url: 'https://www.figma.com/design/K?node-id=412-88' };
  const goal = 'Explore two ways to show saved cards on the payment step. Keep the total visible on small screens.';

  it('uses the goal exactly as written', () => {
    const task = assembleTask({ goal: `  ${goal}  `, flowName: 'Payment', frame, contextPaths: ['project/brief.md'] });
    expect(task.sections[0]).toEqual({ key: 'goal', label: 'Goal', origin: 'as written', lines: [goal] });
    expect(task.body).toContain(`## Goal\n${goal}\n`);
    expect(task.text.startsWith(`GOAL\n${goal}\n`)).toBe(true);
  });

  it('shows the same lines in the preview and in the issue', () => {
    const task = assembleTask({ goal, flowName: 'Payment', frame, contextPaths: ['project/brief.md', 'project/decisions.md'] });
    for (const section of task.sections) for (const line of section.lines) expect(task.body).toContain(line);
    expect(task.text).toContain('Payment step · Wireframes · https://www.figma.com/design/K?node-id=412-88');
    expect(task.text).toContain('project/brief.md · project/decisions.md');
  });

  it('says so plainly when there is no frame or context', () => {
    const task = assembleTask({ goal: 'A way for volunteers to swap shifts', contextPaths: [] });
    expect(task.sections[1]!.lines[0]).toMatch(/^No frame attached/);
    expect(task.sections[2]!.lines[0]).toMatch(/^None yet/);
  });

  it('makes a readable title from the first sentence', () => {
    expect(titleFromGoal(goal)).toBe('Explore two ways to show saved cards on the payment step');
    expect(titleFromGoal('x '.repeat(80)).length).toBeLessThanOrEqual(72);
    expect(flowNameFromGoal('A way for volunteers to swap shifts')).toBe('A way for volunteers');
    expect(flowNameFromGoal('A gift message step for checkout.')).toBe('A gift message step');
    expect(flowNameFromGoal('Checkout.')).toBe('Checkout');
  });

  it('round-trips the hidden marker, even with awkward characters', () => {
    const marker = { v: 1 as const, flow: 'A --> B', frame: { name: 'x', page: 'Current', url: 'https://f/?a=1&b=2' }, context: ['project/brief.md'] };
    const encoded = encodeMarker(marker);
    expect(encoded.indexOf('-->')).toBe(encoded.length - 3);
    expect(parseMarker(`## Goal\nhi\n\n${encoded}`)).toEqual(marker);
    expect(parseMarker('no marker here')).toBeNull();
    expect(parseMarker('<!-- trellis:task {broken -->')).toBeNull();
  });

  it('reads the goal back out of an issue body', () => {
    const task = assembleTask({ goal, flowName: 'Payment', frame, contextPaths: [] });
    expect(goalFromBody(task.body)).toBe(goal);
    expect(goalFromBody('just text')).toBeNull();
  });

  it('builds a manual new-issue link that carries the task', () => {
    const task = assembleTask({ goal, contextPaths: [] });
    const url = new URL(newIssueUrl('acme/shop', task));
    expect(url.pathname).toBe('/acme/shop/issues/new');
    expect(url.searchParams.get('title')).toBe(task.title);
    expect(url.searchParams.get('body')).toBe(task.body);
  });
});

describe('context files', () => {
  it('counts decisions and open assumptions, and reads the brief status', () => {
    expect(describeContextFile('project/decisions.md', '# Decisions\n\n## D1 · A\ntext\n\n## D2 · B\n').meta).toBe('2 decisions');
    const assumptions = '# Assumptions\n\n## A2 · Copilot has Figma access\nDate: 2026-11-09 · Owner: @you · Status: open\ntext\n\n## A9 · Old\nDate: 2026-11-01 · Status: confirmed\n';
    expect(describeContextFile('project/assumptions.md', assumptions).meta).toBe('1 open');
    expect(parseAssumptions(assumptions)).toEqual([
      { id: 'A2', title: 'Copilot has Figma access', open: true, url: undefined },
      { id: 'A9', title: 'Old', open: false, url: undefined },
    ]);
    expect(describeContextFile('project/brief.md', '# Brief\n\nStatus: approved · Date: 2026-11-09 · Owner: @you').meta).toBe('approved Nov 9');
  });

  it('leaves the glossary out by default', () => {
    expect(describeContextFile('project/glossary.md', '| Term | Meaning |\n| --- | --- |\n| A | b |\n').includedByDefault).toBe(false);
    expect(describeContextFile('project/brief.md', 'x').includedByDefault).toBe(true);
  });
});

describe('people and time', () => {
  it('recognises Copilot under its different logins', () => {
    expect(person('copilot-swe-agent[bot]')).toEqual({ login: 'Copilot', kind: 'copilot' });
    expect(person('Copilot').kind).toBe('copilot');
    expect(person('mrivera')).toEqual({ login: 'mrivera', kind: 'person' });
    expect(initials(person('mrivera'))).toBe('MR');
  });

  it('formats dates in a given time zone', () => {
    expect(shortDate('2026-11-09T21:12:00Z', 'America/New_York')).toBe('Nov 9');
    expect(shortDate('2026-11-05')).toBe('Nov 5');
    expect(dateTime('2026-11-09T21:12:00Z', 'America/New_York')).toBe('Nov 9, 4:12 PM');
  });

  it('describes ages', () => {
    const now = new Date('2026-11-11T14:42:00Z');
    expect(ago('2026-11-11T14:37:00Z', now)).toBe('5m');
    expect(ago('2026-11-09T15:02:00Z', now)).toBe('2d');
    expect(agoLong('2026-11-11T14:38:00Z', now)).toBe('4 min ago');
    expect(agoLong('2026-11-11T14:41:50Z', now)).toBe('just now');
  });
});
