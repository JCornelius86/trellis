# Implementation

Status: in review · Date: 2026-11-09 · Owner: @you

What Phase 4 built, how it fits together, and what is still missing. Decisions D17–D20 that this relies on are **proposed**, not approved.

## What you can do

The approved first-run journey (D14), end to end:

1. **Welcome.** Pick where your work is: an idea, wireframes, or Figma designs.
2. **Overview.** See every flow, where it stands, and what needs attention.
3. **New task.** Write the goal, attach a frame and context files, and see exactly what Copilot will get.
4. **Hand off.** Trellis creates an issue and assigns Copilot's coding agent. If assigning fails, the issue is kept and you get the manual step. If nothing could be sent, your task stays on screen.
5. **Flow.** Come back later to see what changed, with a source and date on every line, and what is new since your last visit.

It runs two ways with the same screens:

- **Sample data** (`npm run demo`, or `npm start` with no `.env`): two made-up projects. Nothing leaves the browser.
- **Your accounts** (`npm start` with `.env` filled in): one repository and one Figma file.

## How it fits together

```
Browser (apps/web)
   │  reads one ProjectSnapshot, sends one TaskDraft
   ├── sample projects (demo/)               no network at all
   └── local service (apps/service)          127.0.0.1 only, holds the tokens
          ├── GitHub REST: repo, issues, pull requests, project/*.md
          └── Figma REST: pages, sections, frames, versions, comments
```

- `packages/core` holds the rules, with no network or screen code: how a goal becomes a prepared task, how Figma page and section names become flows, and which next steps to suggest. Nothing in it calls an AI model (D8, D9).
- `packages/ui` holds the components and the Blueprint tokens (D13).
- The browser never sees a token. It talks to the service through `/api`, and the service refuses anything that isn't from localhost.

## How a team shares it

There is no Trellis server and no Trellis database (D18, proposed). What you hand off is written into the GitHub issue, with a hidden last line that lets any teammate's Trellis rebuild the same task. Flows come from the Figma file's sections. Activity comes from GitHub and Figma history. Two people who point Trellis at the same repository and Figma file see the same project.

"Recently active" shows who did what and when, from those histories (D11). It is not live presence.

## Implemented and proposed

| Area | State |
| --- | --- |
| Seven approved screens (D14) in the Blueprint direction (D13) | Implemented |
| Prepared task assembled word for word from the goal, frame, and context (D8) | Implemented |
| Hand-off: create issue, assign Copilot, partial success, total failure (D3) | Implemented; assignment not yet tried on a real repository (A6) |
| Rule-based next steps (D9), flows from Figma sections (D10, D16), recently active (D11) | Implemented |
| Sample projects with a failure switch (D5, D17) | Implemented; D17 proposed |
| Tokens in `.env` (D19) | Implemented; D19 proposed, changes the order in A3 |
| Small-screen layouts (D20) | Implemented; D20 proposed, no frames on Current yet |
| Setup screen and the "Nothing was sent" panel | Implemented without an approved design |
| Flow status "Not assigned", and open questions listed under "Where things stand" | Implemented; small additions to the D9 rules, proposed |

## Not built yet

- **Prototypes, Activity, and Project** in the side navigation. They are shown as "not built yet" and don't link anywhere.
- **Context changes by pull request** (D6).
- **OAuth and the keychain** (A3).
- **More than one project** with real accounts. One repository and one Figma file per `.env`.
- **A hosted demo.** The workflow in `.github/workflows/demo.yml` publishes one to GitHub Pages when someone runs it by hand.

## Known gaps

- "Start review" opens the flow in Figma. Promoting a flow is done there by moving its section; Trellis has no review screen.
- With real accounts, Trellis can't tell who last edited one flow, only who last saved the Figma file. So "Ready to review" relies on the number of rounds.
- A flow started from an idea is named from the first words of the goal. There is no name field in the approved composer.
- GitHub has a preview API that reports what Copilot's agent is doing. Trellis doesn't use it, because the design says Trellis can't see a Copilot session. Worth a decision.
- The service reads the 50 most recent issues and 30 most recent pull requests. Older ones don't appear.

## Checks

- `npm test`: rules, sample data, the service against a stand-in for GitHub and Figma, and the journey in the browser (including each failure).
- Viewed at 390px and 1340px wide with sample data and with the stand-in accounts.
- Automated accessibility scan (axe) on every screen: no violations. Tab order and reduced motion checked by hand.
