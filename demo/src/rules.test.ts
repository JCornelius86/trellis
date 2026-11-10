import { describe, expect, it } from 'vitest';
import { demoSnapshots } from './index';
import { fidelityCounts, flowLine, flowStatus, flowSteps, isStalled, nextSteps, projectLine, projectSummary, type ProjectSnapshot } from '@trellis/core';

const [checkout, volunteer] = demoSnapshots() as [ProjectSnapshot, ProjectSnapshot];
const now = new Date(checkout.clock!.now);
const flow = (id: string) => checkout.flows.find((f) => f.id === id)!;

describe('flow status', () => {
  it('follows the page a flow is on, its questions, and its rounds', () => {
    expect(checkout.flows.map((f) => [f.name, flowStatus(f).label])).toEqual([
      ['Payment', 'Ready to review'],
      ['Saved cards', 'Exploring'],
      ['Confirmation', 'Open question'],
      ['Cart', 'Agreed'],
      ['Address', 'Agreed'],
    ]);
    expect(flowStatus(volunteer.flows[0]!).label).toBe('Waiting on Copilot');
  });

  it('is not ready to review when Copilot made the last edit', () => {
    const f = { ...flow('payment'), lastEdit: { by: { login: 'Copilot', kind: 'copilot' as const }, at: '2026-11-11T00:00:00Z' } };
    expect(flowStatus(f).key).toBe('wireframing');
  });

  it('writes the card line', () => {
    expect(flowLine(flow('payment'), checkout)).toBe('Wireframes · round 2');
    expect(flowLine(flow('cart'), checkout)).toBe('Current · prototyped in #11');
    expect(flowLine(flow('address'), checkout)).toBe('Current · not prototyped');
    expect(flowLine(volunteer.flows[0]!, volunteer)).toBe('New · handed off Nov 9');
  });

  it("doesn't say a flow is waiting on Copilot when Copilot was never assigned", () => {
    const unassigned = { ...volunteer, tasks: volunteer.tasks.map((t) => ({ ...t, assignedToCopilot: false })) };
    expect(flowStatus(unassigned.flows[0]!, volunteer).label).toBe('Waiting on Copilot');
    expect(flowStatus(unassigned.flows[0]!, unassigned).label).toBe('Not assigned');
    expect(flowLine(unassigned.flows[0]!, unassigned)).toBe('New · issue created Nov 9');
  });

  it('counts flows per page', () => {
    expect(fidelityCounts(checkout.flows)).toEqual({ new: 0, wireframes: 2, explorations: 1, current: 2 });
  });
});

describe('next steps (D9)', () => {
  it('lists what needs attention on the overview, most important first', () => {
    const steps = nextSteps(checkout, now);
    expect(steps.map((s) => [s.title, s.detail, s.highlight])).toEqual([
      ['Payment is ready to review', '2 rounds · last edit by @mrivera', true],
      ['Question on Confirmation', 'Asked by @jchen · open 2 days', false],
      ['Address has no prototype', 'Agreed Nov 5', false],
    ]);
    expect(steps.every((s) => s.suggestedGoal)).toBe(true);
  });

  it('lists where a flow stands', () => {
    expect(flowSteps(flow('payment'), checkout).map((s) => [s.title, s.detail, s.action?.label])).toEqual([
      ['Ready to review for Explorations?', '2 rounds · last edit by a person', 'Start review'],
      ['PR #15 has no reviewer', 'Opened Nov 10 by Copilot', 'Request on GitHub'],
      ['A2 is still an assumption', "This task depends on Copilot's Figma access", 'Confirm as decision'],
    ]);
  });

  it('puts an open question first on its flow, in the words it was asked', () => {
    const steps = flowSteps(flow('confirmation'), checkout);
    expect(steps[0]).toMatchObject({ kind: 'question', highlight: true, action: { label: 'Answer in Figma' } });
    expect(steps[0]!.detail).toBe(`\u201c${flow('confirmation').openQuestions[0]!.text}\u201d`);
  });

  it('nudges once when a hand-off has nothing back after a day', () => {
    const task = volunteer.tasks[0]!;
    expect(isStalled(task, volunteer, now)).toBe(true);
    expect(isStalled(task, volunteer, new Date('2026-11-10T02:00:00Z'))).toBe(false);
    expect(nextSteps(volunteer, now).map((s) => s.title)).toEqual(['Issue #3 has no linked pull request after 1 day.']);
  });

  it('flags an issue that exists but is not assigned', () => {
    const copy: ProjectSnapshot = { ...volunteer, tasks: [{ ...volunteer.tasks[0]!, assignedToCopilot: false }] };
    expect(nextSteps(copy, now).map((s) => s.kind)).toEqual(['not-assigned']);
  });

  it('summarises a project in a sentence', () => {
    expect(projectSummary(checkout, now)).toBe('Five flows, two agreed. Payment is ready for review.');
    expect(projectSummary({ ...checkout, flows: [] }, now)).toMatch(/^No flows yet/);
    expect(projectLine(checkout, now)).toEqual({ line: '5 flows · 2 agreed', attention: 3 });
    expect(projectLine(volunteer, now)).toEqual({ line: '1 flow · waiting on Copilot since Nov 9', attention: 1 });
  });
});
