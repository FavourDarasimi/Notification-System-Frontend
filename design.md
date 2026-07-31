# Design — Notification System Client

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

## Genre

modern-minimal — developer-tool register (notification system / platform client).

## Macrostructure family

- App pages: **Index-First** — the page IS its content (the inbox is a list).
  Variation knobs: page head = graphite status band; list = hairline rules
  between rows; actions = bordered ghost buttons right-aligned.
- Tool pages: **Index-First (form variant)** — same family, form-driven: page
  head + single-column instrument form (native controls, labels above, mono
  readout lines).
- Auth pages: **Index-First (auth variant)** — centered hairline panel, wordmark
  only in the app header, no nav links.

## Theme

Cobalt — cool engineered paper, one electric-cobalt signal, ruler hairlines.

- `--color-paper`   oklch(98.5% 0.004 250)
- `--color-paper-2` oklch(96% 0.006 250)
- `--color-paper-3` oklch(93% 0.008 250)
- `--color-ink`     oklch(24% 0.02 258)
- `--color-ink-2`   oklch(34% 0.018 257)
- `--color-muted`   oklch(50% 0.014 256)
- `--color-rule`    oklch(91% 0.008 250)
- `--color-rule-2`  oklch(85% 0.01 250)
- `--color-accent`  oklch(58% 0.20 256)   (electric cobalt — signal only)
- `--color-graphite` oklch(22% 0.016 260) (the one dark band)
- `--color-focus`   oklch(62% 0.17 256)

## Typography

- Display: Space Grotesk, weight 500/600, style normal, tracking -0.02em
- Body: Inter, weight 400/500
- Mono: JetBrains Mono, weight 400/500 — labels, status, keys, meta
- Display tracking: -0.02em
- Type scale anchor: 1.25 major third from 16px; `--text-display` = clamp(2.5rem, 5vw + 0.5rem, 4.75rem)

## Spacing

4-point named scale. Values in `tokens.css`. Pages use named tokens
(`var(--space-md)`), never raw values.

## Motion

- Easings: `--ease-out` cubic-bezier(0.16, 1, 0.3, 1), `--ease-in`,
  `--ease-in-out` — no bounce, no overshoot.
- Reveal pattern: none — the page is composed, not animated. Index-First is
  motion-cut by genre.
- Reduced-motion fallback: all transitions ≤ 150ms; opacity-only.

## Microinteractions stance

- Silent success. The visible result IS the confirmation (row appears, count
  ticks). No toasts for success.
- Errors get an inline message: what broke, why, what to do.
- Hover on links: cobalt underline-grow. Focus: instant ring, never animated.
- Button press: 1px translateY on active; 100ms in / 150ms out.
- Loading: skeleton rows for the inbox; button label swap ("Sending…") for
  form submits — spinner only if the wait needs it.

## CTA voice

- Primary CTA: cobalt fill (`--color-accent`), `--color-accent-ink` text,
  6px radius, 44px min-height, rectangular — never a pill. Labels are verbs
  ("Send notification", "Sign in").
- Secondary CTA: 1px `--color-rule-2` border, ink-2 text, 6px radius, ghost
  hover to `--color-paper-2`. Label a verb ("Mark all read", "Retry").

## Per-page allowances

- Marketing pages: n/a — this app has none.
- App pages MUST NOT use enrichment — function carries the page. The graphite
  status band is structural, not decorative.
- Auth pages: typography only, hairline panel.

## What pages MUST share

- The wordmark ("Notify") and its cobalt tick.
- The accent colour and its placement (≤ 5 % per viewport: tick, underline
  hover, focus rings, one primary button, live-status text on graphite).
- The display + body + mono fonts.
- The CTA voice (button shape, radius, padding rhythm, verb labels).
- The mono machine-readout voice for status, meta, and keys (JetBrains Mono,
  UPPERCASE, 0.06em tracking).

## What pages MAY differ on

- Page head treatment: graphite status band (inbox) vs. typographic head
  (tool/auth pages).
- Form density and control composition (tool page richer than auth page).
- Nothing else — the system is locked.

## Exports

### tokens.css

The single source of truth for tokens; imported by `app/layout.tsx` before
`globals.css`. See `tokens.css` at the project root for the full token set
(colours, fonts, spacing, type scale, easings, durations, radii, z-index).
