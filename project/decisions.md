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
React, TypeScript, Vite, and a local Node service that holds tokens and calls GitHub and Figma. Custom components: friendly, soft color, rounded, airy.

## D5 · Distribution
Date: 2026-11-09 · Owner: @you · Status: approved
Public repository. Runs locally against real accounts. A hosted demo runs the same UI in demo mode with sample data and no service.

## D6 · Context changes
Date: 2026-11-09 · Owner: @you · Status: approved
Trellis proposes edits to `project/*.md` as pull requests on a topic branch. A person merges them; Trellis never commits to the default branch.

## D7 · Name
Date: 2026-11-09 · Owner: @you · Status: approved
Trellis. Throughline and Plumb were rejected: both are used by existing design-to-code tools.
