# Assumptions

Unconfirmed beliefs the design depends on. Each moves to decisions.md once confirmed, or is removed with a note if disproved.

## A2 · Copilot has Figma access
Date: 2026-11-09 · Owner: @you · Status: open
The repo's Copilot coding agent is configured with the Figma MCP server. Trellis shows this as a setup checklist item but can't verify it.
Risk if wrong: handed-off tasks that need Figma will fail inside Copilot, out of Trellis's view.

## A3 · Local auth
Date: 2026-11-09 · Owner: @you · Status: open
GitHub and Figma OAuth apps redirect to the local service on localhost. Tokens stay in the service (OS keychain), never in the browser, Git, logs, prompts, or exports. Personal access tokens are the fallback.

## A4 · One person per instance
Date: 2026-11-09 · Owner: @you · Status: open
No shared server. "Shared activity" means what GitHub and Figma already record.

## A5 · No AI inside Trellis in v1
Date: 2026-11-09 · Owner: @you · Status: open
AI summaries in Activity come from Copilot's PR descriptions and are labelled as such.

Note: A1 (hand-off via issue assignment) was confirmed and moved to D3.
