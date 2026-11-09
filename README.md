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
| 2. Prepare the Figma template | Next |
| 3. Design the smallest complete journey | Approved 2026-11-09 (wireframes and hi-fi) |
| 4. Implement one vertical slice | Not started |
| 5. Verify and share | Not started |

## Design

The approved first-run journey and visual direction are documented in `docs/design/`:
- `docs/design/README.md` lists every approved screen, what it's for, and the decision that approved it.
- `docs/design/tokens.md` holds the Blueprint colors, type, and shapes.

## Planned structure

```
apps/web        React + TypeScript + Vite hub UI
apps/service    Local Node service: OAuth, tokens, GitHub and Figma calls
packages/ui     Trellis components
demo/           Sample data for the hosted demo
project/        Shared context: brief, assumptions, decisions, glossary
docs/           Staged prompt, Figma template spec
```

## Running locally

Not yet implemented. The target is one install and one start command.

## License

MIT
