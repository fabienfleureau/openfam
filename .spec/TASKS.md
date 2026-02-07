# Tasks

## Dashboard (Web) Implementation — Pending

### Goal
Build a new Next.js (App Router) + Tailwind + TypeScript dashboard in `web/` with six core pages and three switchable visual themes. No auth/login for now.

### Scope (Pages)
- Router Health
- Profiles
- Devices
- DNS
- Captive Portal
- Settings

### Theme Directions (All must be implemented + switchable)
1. Signal Atlas
   - Feel: crisp, technical, slightly editorial
   - Type: display serif headings + clean sans UI
   - Colors: deep teal, slate, warm parchment background, muted amber highlights
   - Motif: thin rule lines, dot-grid, contour-line cards
2. Playground Control
   - Feel: friendly, kid-adjacent but still pro
   - Type: rounded grotesk headings + mono accents for data
   - Colors: soft sand background, bold coral + forest green accents, charcoal text
   - Motif: pill chips, rounded panels, playful spacing
3. Nightshift Utilities
   - Feel: industrial utility, high-contrast, rugged
   - Type: condensed display headings + utilitarian sans
   - Colors: off-white canvas, black ink, safety orange accents
   - Motif: bold section dividers, label badges, thin diagonal hatching

### Core Requirements
- New Next.js project lives at `web/`.
- Tailwind configured with CSS variables for theme tokens.
- Theme switcher (UI toggle + data attribute/class on `html` or `body`) to swap all colors/typography/motifs.
- Shared layout + sidebar/nav across all pages.
- Responsive (mobile + desktop).
- Each page must include realistic data cards/tables and at least one chart placeholder (static).

### Nice-to-Have
- Subtle page-load animation and staggered card reveals.
- Theme-specific background pattern (SVG or CSS gradients).

### Open Questions
- None. Implement with internal mock data and no auth.

