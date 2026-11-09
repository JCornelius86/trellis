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

## D7 · Name
Date: 2026-11-09 · Owner: @you · Status: approved
Trellis. Throughline and Plumb were rejected: both are used by existing design-to-code tools.
