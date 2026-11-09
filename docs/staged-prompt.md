# Staged kickoff prompt

This is how Trellis is built: a staged prompt, not a request to generate the product in one pass. Its stopping points are the point.

```text
Help me build Trellis: a lightweight, design-led hub for turning ideas or
existing Figma designs into agreed, clickable prototypes.

Work incrementally. Do not generate a complete application before we have
reviewed its core flows.

INPUTS
- Repository: [link]
- Figma destination or permission to create a new file: [link/new file]
- Requester alias: [@alias]

PRODUCT BOUNDARIES
Figma owns design intent. GitHub owns code and shared project context.
Copilot performs approved work. Trellis connects these surfaces and shows
useful project information; returning to it is optional.

Do not assume that opening Copilot proves a session started, that Trellis
can read Copilot conversations, or that Copilot's Figma access authorizes
Trellis.

PHASE 1 — CLARIFY
Inspect the supplied materials and existing repository instructions.
Identify confirmed requirements, assumptions, conflicts, and unknowns.
Propose a short brief and a small MVP. Ask only questions that change the
implementation or design direction.

Create shared context files only after approval:
project/brief.md, project/assumptions.md, project/decisions.md,
project/glossary.md
Propose exact entries before writing them. Record source, date, and owner.
Link confidential specs and research; do not copy them.

PHASE 2 — PREPARE THE FIGMA TEMPLATE
Use a dedicated project copy. Analyze existing source designs without
modifying designers' Working pages.

Create these pages in this order:
1. Read me — purpose, source links, owners, usage and sharing guidance.
2. Team & ownership — lightweight responsibilities and working agreements.
3. Questions & issues — unresolved questions, assumptions, conflicts,
   missing states, and decisions needed.
4. Activity — dated, source-linked change summaries when available.
5. Components — library references, reusable patterns, tokens and states.
6. Wireframes (lo-fi) — rough flows and alternative approaches.
7. Explorations (hi-fi) — design-system-based alternatives.
8. Current — agreed designs that are eligible for implementation.
9. Working — existing designer-owned content, never edited by the agent.
10. Archive — superseded work with dates and replacement links.

Start with lightweight instructions and empty reusable patterns, not
invented product content or a large set of speculative screens.

Every screen or distinct state must be in a named frame. Group related
frames in a section named: <flow or task> · YYYY-MM-DD

Outside the screen frames, include compact provenance: Created with
Copilot; what changed; why; source; creation/update dates; Requested by
@alias when verified.

Connect actual destinations with prototype interactions and give each flow
a named starting point. Log missing destinations as gaps rather than
creating fake successful navigation.

PHASE 3 — DESIGN THE SMALLEST COMPLETE JOURNEY
Explore first-run alternatives in Wireframes before writing UI code.

Prioritize: Setup → state a goal → optionally scope a Figma frame/section
→ review an optional prepared task → hand off to Copilot → optionally
return and refresh project information.

Do not fill a new project with empty flows, PR cards, or warnings about
optional sources. Explain what will appear after shared work exists.

Cover existing designs, idea-only starts, inaccessible sources, failed
hand-offs, clipboard failure, and returning users. Preserve the prepared
task and offer truthful manual recovery.

Show designs and wait for approval. Promote agreed hi-fi work to Current.
Do not build directly from Explorations. Never label wireframes hi-fi.

PHASE 4 — IMPLEMENT ONE VERTICAL SLICE
Build the approved first-run journey end to end before adding breadth.
Use React, TypeScript, Vite, Trellis components, and a local Node service.

Keep credentials out of Git, logs, prompts, and exported artifacts. Use
approved authorization paths and explicit provider error states.

Add verified GitHub/Figma activity progressively. Label AI summaries. Do
not present local edits, stale data, or unavailable sources as proof of
shared activity or inactivity.

PHASE 5 — VERIFY AND SHARE
Test the complete journey, keyboard access, reduced motion, recovery
paths, and the hosted demo.

Work on topic branches. Use small commits and the repository PR template.
Require another person's review before merging; never self-approve.

At each phase, show the result, unresolved gaps, and what is implemented
versus proposed. Stop at approval gates rather than treating this prompt
as blanket permission for every future write or build.

Start with Phase 1 only.
```
