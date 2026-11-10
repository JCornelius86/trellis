# Decisions

Each entry records what was decided, when, by whom, and why. Superseded decisions stay, marked with what replaced them.

## D1 · Surface roles
Date: 2026-11-09 · Owner: @you · Status: approved
Figma owns design intent. GitHub owns code and shared project context. Copilot performs approved work. Trellis connects these surfaces; returning to it is optional.

## D2 · Figma access
Date: 2026-11-09 · Owner: @you · Status: approved
Trellis reads Figma through the REST API. Copilot creates and modifies frames through the Figma MCP server. Trellis never writes to Figma.
Why: keeps Trellis out of the design surface and avoids building a plugin.

## D3 · Hand-off
Date: 2026-11-09 · Owner: @you · Status: approved
Trellis creates a GitHub issue from the prepared task and assigns it to Copilot's coding agent. If assignment fails, the issue stays open with a link and the task can be copied. Requires issue write access.
Why: hand-off is visible and shareable on GitHub, and Trellis can link to it later. Opening Copilot doesn't prove a session started.

## D4 · Stack and UI
Date: 2026-11-09 · Owner: @you · Status: approved
React, TypeScript, Vite, and a local Node service that holds tokens and calls GitHub and Figma. Custom components (visual direction superseded by D13).

## D5 · Distribution
Date: 2026-11-09 · Owner: @you · Status: approved
Public repository. Runs locally against real accounts. A hosted demo runs the same UI in demo mode with sample data and no service.

## D6 · Context changes
Date: 2026-11-09 · Owner: @you · Status: approved
Trellis proposes edits to `project/*.md` as pull requests on a topic branch. A person merges them; Trellis never commits to the default branch.

## D8 · No AI inside Trellis in v1
Date: 2026-11-09 · Owner: @you · Status: approved
The task preview is assembled from the user's goal (verbatim), Figma frame metadata, and context-file metadata. Copilot drafts the approach after hand-off, in the issue.
Why: what you see is exactly what gets sent. A "Suggest approach" action via GitHub Models is a candidate for v2.
Confirms A5.

## D9 · Trellis's role in each loop
Date: 2026-11-09 · Owner: @you · Status: approved
Trellis starts each lo-fi or hi-fi loop and shows what changed. Follow-up rounds happen directly in Copilot and Figma. Trellis also suggests next steps from project state (rounds, who edited last, open PRs, open assumptions) using rules, not AI.

## D10 · Flows are the unit of work
Date: 2026-11-09 · Owner: @you · Status: approved
A project is a set of flows. A flow is one Figma section moving through Wireframes, Explorations, and Current. Tasks are rounds within a flow. Flow status comes from where its section lives, plus open questions and PRs.
Why: matches how designers already organise Figma, and gives the overview something stable to show.

## D11 · Recently active, not presence
Date: 2026-11-09 · Owner: @you · Status: approved
Trellis shows who did what recently, taken from Figma version history and comments and from GitHub events (including Copilot's commits). Each item names its source and time. Live presence would need a shared server and claims Trellis can't verify; it's a v2 candidate.

## D12 · First-run wireframes
Date: 2026-11-09 · Owner: @you · Status: approved
Approved: welcome (4a), project overview (4b), composer with assembled preview (2a), flow timeline (3a), nothing-new-yet (3b), hand-off success and recovery (1d, 1e). Source: Trellis Wireframes, turns 1–4.

## D13 · Visual direction
Date: 2026-11-09 · Owner: @you · Status: approved
Blueprint (hi-fi exploration 2a): deep navy with a fine line grid, IBM Plex Sans with Plex Mono for labels, cyan accent, squarer corners. Left nav: Overview, Prototypes, Activity, Project, plus quick links. Supersedes the "friendly, soft, airy" direction in D4.
Source: Trellis Hi-fi Explorations, turn 2.

## D14 · Hi-fi first-run journey
Date: 2026-11-09 · Owner: @you · Status: approved
Approved hi-fi screens in the Blueprint direction (D13): project overview, welcome, new-task composer, hand-off success, hand-off recovery, flow detail, and flow detail with nothing new. These are eligible for Current in Figma and for implementation in Phase 4.
Source: Trellis Hi-fi Explorations, turns 2–4. Inventory in docs/design/README.md.

## D15 · Figma template and project file
Date: 2026-11-09 · Owner: @you · Status: approved
The template file stays blank and reusable: 10 fixed pages, a Read me to fill in, and a one-line description on every other page (docs/figma-template.md). Each project gets its own copy. Trellis's own copy holds the D14 screens on Current as one section, `First-run journey · 2026-11-09`, with Blueprint colors as local variables and a prototype starting at Welcome.
Why: the template's starting state has no example screens, so Trellis's designs can't live in it.
Gaps (unlinked controls with no real destination yet) are listed on the project file's Questions & issues page.
Template: https://www.figma.com/design/0tOmTAAP3wA3I90KdJK3A9 · Project file: https://www.figma.com/design/cLDDk36CONL4cSVnv98HEF

## D16 · Template pages: icons, groups, About page
Date: 2026-11-09 · Owner: @you · Status: approved
Page names carry a leading icon, and `---` divider pages split the panel into five groups (Start here, Coordinate, System, Fidelity, Keep). A new first page, About Trellis, explains the template with the prompt-and-design flowchart and an animated fidelity loop. Trellis matches page names after the icon and skips dividers. Sections may add ` · round N` when a flow has several rounds on one date.
Why: the page list is the first thing a teammate sees; grouping makes the fidelity pipeline readable at a glance. The naming rule changes before any code reads it, so nothing breaks.

## D17 · One project shape, sample data first
Date: 2026-11-09 · Owner: @you · Status: proposed
The hub reads one shape of data, a project snapshot (`packages/core/src/types.ts`). The sample projects and the local service both produce it, so every screen works the same with sample data and with real accounts. The demo includes a switch for failures (Copilot not assigned, GitHub down, copy blocked, comments unavailable).
Why: the journey can be tried, tested, and shared before anyone connects an account, and recovery states stay reachable.

## D18 · Shared state lives in GitHub and Figma
Date: 2026-11-09 · Owner: @you · Status: proposed
Trellis keeps no project database. A hand-off writes the task into the issue body with a hidden marker and a `trellis` label. Anyone's Trellis pointed at the same repository and Figma file rebuilds the same tasks, flows, and activity. Only "last visit" and an unsent draft are kept in the browser.
Why: this is how the work is shared between teammates without a server (A4, D11). A flow started from an idea gets a working name from the first words of the goal until the team names its Figma section.

## D19 · First sign-in: tokens in `.env`
Date: 2026-11-09 · Owner: @you · Status: proposed
The first version connects with personal access tokens in a local `.env` file read by the service. OAuth and the OS keychain (A3) come later. The service only answers on localhost, requires a custom header for writes, and never returns or logs a token.
Why: it works today with one file and no app registration. Changes the order in A3, which stays open.

## D20 · Small screens
Date: 2026-11-09 · Owner: @you · Status: proposed
Built mobile-first. Under 960px the side navigation becomes a menu, rails stack under the main column, the hand-off button sticks to the bottom of the screen, and the overview gets a shortcut to "Needs attention".
Gap: these layouts are not on Current in Figma yet. They need frames and a review before this is approved.

## D7 · Name
Date: 2026-11-09 · Owner: @you · Status: approved
Trellis. Throughline and Plumb were rejected: both are used by existing design-to-code tools.
