# Trellis

A lightweight hub for design-led, AI-assisted prototyping.

Bring an idea or an existing Figma design, link the context behind it, state what you want to accomplish, and hand a prepared task to GitHub Copilot. Come back later to see what changed in Figma and GitHub, with sources and dates, and AI summaries clearly labelled.

Trellis is a starting point and a project view. It is not another mandatory workflow, and it doesn't replace Figma or Copilot.

## Why

As agents take on more of the work, more of what changes in a project happens out of sight: in a chat session, a branch, or a generated frame. Teams need to see agent work, share it, and contribute to it across disciplines, without having to trust a finished-looking result.

## How the surfaces divide

| Surface | Role |
| --- | --- |
| Figma | Owns design intent. Read by Trellis through the REST API; written by Copilot through the Figma MCP server. |
| GitHub | Owns code, shared project context (`project/`), and change history. |
| GitHub Copilot | Performs approved work. Trellis hands off by creating an issue and assigning it to Copilot's coding agent. |
| Trellis | Connects the surfaces and shows useful project information. Returning to it is optional. |

## Status

Phase 1 (Clarify) is approved. See `project/` for the brief, assumptions, decisions, and glossary, and `docs/staged-prompt.md` for how this project is built.

| Phase | Status |
| --- | --- |
| 1. Clarify | Approved 2026-11-09 |
| 2. Prepare the Figma template | Done 2026-11-09 (D15) |
| 3. Design the smallest complete journey | Approved 2026-11-09 (wireframes and hi-fi) |
| 4. Implement one vertical slice | In review on `phase-4/vertical-slice` (waiting on Figma approval, D21) |
| 5. Verify and share | Not started |

## Design

The approved first-run journey and visual direction are documented in `docs/design/`:
- `docs/design/README.md` lists every approved screen, what it's for, and the decision that approved it.
- `docs/design/tokens.md` holds the Blueprint colors, type, and shapes.
- The approved screens are on the Current page of the [Trellis Figma file](https://www.figma.com/design/cLDDk36CONL4cSVnv98HEF). New projects start from the [project template](https://www.figma.com/design/0tOmTAAP3wA3I90KdJK3A9); see `docs/figma-template.md`.

## Running locally

You need [Node.js](https://nodejs.org) 22 or newer.

```
npm install
npm start
```

Then open http://localhost:5173. With nothing else set up, Trellis shows two sample projects, so you can walk the whole journey before connecting anything.

To use your own repository and Figma file:

1. Copy `.env.example` to `.env`.
2. Fill in the four values. The file says where each one comes from.
3. Stop Trellis (Ctrl+C) and run `npm start` again.

Your tokens stay in the small service that runs on your computer. They are never sent to the browser and `.env` is ignored by Git.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run demo` | The hub with sample data only, no service. This is what a hosted demo runs. |
| `npm test` | Runs the tests. |
| `npm run typecheck` | Checks types across the workspace. |
| `npm run build` | Builds the demo as static files in `apps/web/dist`. |

In a sample project, the "Try" menu at the top switches on a failure (Copilot can't be assigned, GitHub is down, copy is blocked, Figma comments are unavailable) so you can see how Trellis recovers.

## Structure

```
apps/web        React + TypeScript + Vite hub UI
apps/service    Local Node service: holds tokens, calls GitHub and Figma
packages/core   Shared rules: task assembly, Figma naming, next steps
packages/ui     Trellis components and Blueprint tokens
demo/           Sample data for the hosted demo
project/        Shared context: brief, assumptions, decisions, glossary
docs/           Staged prompt, Figma template spec, design, implementation notes
```

`docs/implementation.md` explains how the pieces fit, what is built, and what isn't yet.

## License

MIT
