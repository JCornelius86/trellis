# Design

Status: approved · Date: 2026-11-09 · Owner: @you

How the first-run journey was designed, in order. Each step was reviewed before the next started.

## 1. System flow
Who does what across Trellis, GitHub (including Copilot), and Figma. Each fidelity (lo-fi, hi-fi) is a loop between prompting and design; the team promotes work when it's ready. Testing feeds the next iteration.

## 2. Wireframes (lo-fi)
Four rounds, approved in D12.

| Round | Explored | Outcome |
| --- | --- | --- |
| 1 | Three first-screen layouts; hand-off success and recovery; two returning-user views | Composer with attachments chosen (1c) |
| 2 | Composer with an assembled, AI-free preview | Approved (2a), D8 |
| 3 | Flow timeline with source labels and rule-based next steps; nothing-new state | Approved (3a, 3b), D9 |
| 4 | Welcome with a five-stage strip; project overview with flows as the unit | Approved (4a, 4b), D10, D11 |

## 3. Visual directions (hi-fi)
Three light directions, then two dark blueprint directions. Blueprint (2a) chosen in D13.

## 4. Approved hi-fi screens (D14)

| Screen | Purpose | From wireframe |
| --- | --- | --- |
| Project overview | Flows grid, needs attention with Ask Copilot, pull requests, recently active | 4b |
| Welcome | Start where your work is: Idea, Lo-fi, Hi-fi, Prototype, Test, then iterate | 4a |
| New task composer | Goal with frame and context attachments; "What Copilot will get" with a source on every line | 2a |
| Hand-off: success | Issue created and assigned; what will appear later | 1d |
| Hand-off: recovery | Partial success stated plainly; manual copy fallback | 1e |
| Flow detail | Timeline with verified, AI summary, and unavailable labels; rule-based next steps | 3a |
| Flow detail: nothing new | What will appear and when; one nudge if stuck | 3b |

## Rules every screen follows
- Every item shows its source and date. AI-written text is labelled.
- No empty cards or warnings about optional sources.
- Failures say what did happen and keep the prepared task.
- Trellis never claims to see a Copilot session.
