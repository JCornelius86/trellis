# Blueprint tokens

Status: approved (D13) · Date: 2026-11-09

All colors in OKLCH.

## Color
| Token | Value | Use |
| --- | --- | --- |
| bg | oklch(0.25 0.065 255) | App background |
| grid | oklch(0.31 0.065 255) | 1px grid lines, 28px spacing |
| side | oklch(0.22 0.06 255) | Sidebar and right rail |
| surface | oklch(0.285 0.068 255) | Cards, inputs |
| surface-2 | oklch(0.33 0.07 255) | Thumbnails, chips |
| line | oklch(0.40 0.065 255) | Borders, dividers |
| ink | oklch(0.97 0.008 250) | Primary text |
| muted | oklch(0.78 0.035 250) | Secondary text |
| accent | oklch(0.82 0.11 215) | Primary actions, focus |
| accent-ink | oklch(0.22 0.06 255) | Text on accent |
| accent-soft | oklch(0.36 0.08 230) | Selected nav, Exploring status |
| accent-soft-ink | oklch(0.88 0.08 215) | Links, text on accent-soft |
| attention | oklch(0.40 0.075 80) / ink oklch(0.93 0.09 88) | Ready to review, needs attention |
| agreed | oklch(0.37 0.07 165) / ink oklch(0.90 0.09 165) | Agreed, success |
| warning | oklch(0.38 0.09 20) / ink oklch(0.90 0.07 25) | Open question, conflict |

## Type
- IBM Plex Sans 400/500/600 for UI and headings
- IBM Plex Mono 400/500 for labels (uppercase, 0.08em tracking), repo and file names, source tags

| Role | Size |
| --- | --- |
| Display | 56 / 600 |
| Page title | 34–38 / 600 |
| Section title | 17 / 600 |
| Body | 14–15 |
| Meta | 12–12.5 |
| Label (mono) | 11 |

## Shape
- Cards: 10px radius, 1px line border
- Buttons and nav items: 8px radius
- Status chips: pill
- Source tags: 4px radius; solid border = verified, dashed accent = AI summary, no border = unavailable
