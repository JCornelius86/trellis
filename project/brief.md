# Brief

Status: approved · Date: 2026-11-09 · Owner: @you · Source: Phase 1 review

## Why now
As agents take on more of the work, more of what changes in a project happens out of sight: in a chat session, a branch, or a generated frame. Visibility into what is happening, and why, matters more than ever. Teams need to see agent work, share it, and contribute to it across disciplines, without having to trust a finished-looking result.

## Problem
AI makes prototypes faster to build, but speed often hides uncertainty. Teams lose track of what problem they are solving, which requirements are confirmed, what research supports the design, and who changed what. A polished prototype can conceal an unclear or outdated brief.

## Users
Designers and researchers. PMs and developers contribute context, review decisions, and collaborate on implementation.

## Value
Move from an idea or existing design to a shareable, clickable prototype with clearer intent and less coordination overhead.

## Primary use case
A designer has a flow in Figma and wants a prototype the team can trust. They open Trellis, state a goal, point at a frame, confirm which saved context applies, and hand a prepared task to GitHub Copilot. Later, they return and see verified Figma and GitHub activity, with AI summaries clearly labelled.

## Positioning
Code-first prototyping tools such as GitHub's Replica start from a design system in code. Trellis starts from Figma as the source of design intent, and adds what the Figma MCP connection alone doesn't: fidelity kept separate by page, implementation only from approved frames, and provenance on every change.

## Core journey
Setup → state a goal → (optional) scope a Figma frame or section → (optional) review the prepared task → hand off to Copilot → (optional) return and refresh.

The first post-setup screen asks, in order:
1. What do you want to accomplish?
2. Is there a specific frame or section?
3. Here is the saved project context we will use.

## MVP: in
- Connect one GitHub repo and one Figma file
- Read `project/*.md` context from the repo
- Goal, optional frame scope, prepared task
- Hand off to GitHub Copilot, with copy-and-paste fallback
- Propose context-file changes as pull requests
- Activity: PRs, commits, and issues touching the project; Figma versions and comments
- Every item shows source, date, and a verified or AI-summary label
- Recovery: inaccessible source, failed launch, clipboard failure, returning user
- Hosted demo with bundled sample data, no sign-in

## MVP: out
- Multiple projects or teams per instance
- Reading Copilot conversations or session state
- Writing to Figma from the hub
- Committing context changes directly to the default branch
- Notifications, permissions management, analytics
- Project-management features (boards, tasks, due dates)

## Success criteria
1. A first-time user goes from setup to a handed-off task without reading docs.
2. Clone to running locally with one install and one start command.
3. Every activity item names its source and date; nothing AI-derived appears unlabelled.
4. Every failure path keeps the prepared task and offers a manual next step.
5. A new project shows no empty cards or warnings about optional sources.
6. The hosted demo is fully clickable without an account.
