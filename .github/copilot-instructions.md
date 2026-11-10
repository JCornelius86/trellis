# Instructions for Copilot

Read `project/brief.md`, `project/decisions.md`, `project/assumptions.md`, and `project/glossary.md` before starting any task.

- Keep requirements, assumptions, decisions, and evidence distinguishable.
- Link specifications and research rather than copying source documents.
- Distinguish verified facts from AI interpretation, and label AI summaries.
- In Figma: never edit the Working page. Never label wireframes hi-fi.
- Figma first (D21): do not build a screen or a distinct state in code until its frame is on Current. If the frame is missing, design it on Wireframes or Explorations and ask for approval. Do not build it and log a gap.
- Current (D22, D23): ask for approval before anything moves to Current, and wait for a person to agree. When you move approved work, copy it, leave the exploration where it is, and move any earlier version to Archive with its date. Delete nothing.
- Every screen or distinct state goes in a named frame. Group related frames in a section named `<flow or task> · YYYY-MM-DD`.
- Outside the frames, add provenance: created with Copilot; what changed; why; source; creation/update dates; requested by @alias when verified.
- Log missing destinations as gaps rather than creating fake successful navigation.
- Keep credentials out of Git, logs, prompts, and exported artifacts.
- Work on topic branches with small commits and the PR template. Never self-approve.
- Stop at approval gates. Show the result, unresolved gaps, and what is implemented versus proposed.

## Working in the code

- `npm install`, then `npm test`, `npm run typecheck`, and `npm run build` must all pass before you open a pull request.
- Rules that decide what Trellis shows (flow status, next steps, the prepared task, Figma naming) live in `packages/core` and have tests. Change the rule and its test together.
- Every screen reads one `ProjectSnapshot` (`packages/core/src/types.ts`). The sample data in `demo/` and the local service in `apps/service` both produce it. If you add a field, add it to both.
- Colors, type, and shapes come from `packages/ui/src/trellis.css`, which mirrors `docs/design/tokens.md`. Don't add one-off values.
- Desktop first (D20). Design and check at 1340px wide, with keyboard access and reduced motion. A page should not break in a narrow window, but do not design or polish phone layouts unless a task asks for one.
- Trellis never rewrites the user's goal and never calls an AI model (D8). Don't add either.
- A task issue from Trellis ends with a hidden `<!-- trellis:task … -->` line. Leave it in place when you edit the issue.
