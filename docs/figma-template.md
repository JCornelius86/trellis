# Figma template

Status: approved (D15) · Date: 2026-11-09 · Owner: @you
Phase 2. For Copilot to follow through the Figma MCP server when it creates or prepares a project file.

- Template file: [Trellis | Project Template](https://www.figma.com/design/0tOmTAAP3wA3I90KdJK3A9) — duplicate it for each new project.
- Trellis's own project file: [Trellis](https://www.figma.com/design/cLDDk36CONL4cSVnv98HEF) — the approved first-run journey is on Current.

## Pages, in this order
1. **Read me**: purpose, source links (repo, brief, spec, research), owners, how to use and share.
2. **Team & ownership**: who owns which flows, working agreements.
3. **Questions & issues**: open questions, assumptions, conflicts, missing states, decisions needed. Each links to its entry in `project/`.
4. **Activity**: dated, source-linked change summaries, when available.
5. **Components**: library references, reusable patterns, tokens and states. Flag gaps; don't invent replacements.
6. **Wireframes (lo-fi)**: rough flows and alternatives. Never labelled hi-fi.
7. **Explorations (hi-fi)**: design-system alternatives. Never built from directly.
8. **Current**: agreed designs, eligible for implementation. Only people promote frames here.
9. **Working**: existing designer-owned content. Never edited by Copilot.
10. **Archive**: superseded work with dates and a link to what replaced it.

## Flows and sections
- One section per flow, named `<flow> · YYYY-MM-DD` (date of the round).
- A flow keeps its name as it moves from Wireframes to Explorations to Current. Trellis matches flows across pages by name.
- Every screen or distinct state is its own frame, named `<flow> / <screen> / <state>`, e.g. `Payment / Card list / Empty`.
- On Current, screens run left to right in flow order, with a prototype starting point named after the flow.

## Provenance
Outside the frames, beside each section, a small note:
```
Created with Copilot · Round 2
What changed: …
Why: …
Source: issue #14, decision D10
Created 2026-11-10 · Updated 2026-11-11
Requested by @alias (once verified)
```
Notes sit outside frames so they never appear in prototypes or exports.

## Prototype links
- Connect real destinations only. If a destination doesn't exist yet, log it on Questions & issues as a gap. Don't link to a placeholder that looks finished.

## What Trellis reads
- Page names (to place each flow at a fidelity)
- Section names and dates (flows and rounds)
- Version history and comments (activity, recently active)
Changing page or section naming breaks Trellis's view of the project, so the names above are fixed.

## Starting state
New files start with the Read me filled in, and every other page empty apart from a one-line description at the top. No example screens.
