# Demo data

Sample projects for the hosted demo and for trying Trellis without accounts.
Nothing here is real: the people, repositories, issues, and Figma file are made up.

- `src/checkout.ts`: "Checkout refresh", a project mid-way with five flows.
- `src/volunteer.ts`: "Volunteer shifts", a new idea that was handed off and has nothing back yet.

Each file exports one `ProjectSnapshot` (see `packages/core/src/types.ts`), the
same shape the local service builds from GitHub and Figma. The demo pretends it
is always the morning of 11 Nov 2026 (`clock`) so "5m ago" stays true.
