# Design — Simpelin / The Living Grimoire

Pixel fantasy combines layered forest scenery, bronze controls, and a parchment reading surface. The editor remains readable and familiar while navigation and interactions carry the game aesthetic.

## Genre and structure

Atmospheric fantasy with pixel craft. App pages retain the working sidebar → category → rune timeline → editor structure. Motion Lab is a spell workshop using the same tokens and renderer. No combat HUD, invented XP, or locked content.

## Palette

Dark pine and desaturated teal form the world. Bronze/gold are interactive accents. The reading surface is warm parchment with dark brown ink. Ember magic uses gold, amber, copper and a pale hot core. Other spells use one coordinated elemental palette each.

`tokens.css` is authoritative. Book-local token overrides keep toolbar, prose, inputs, code and focus states readable on parchment. All pages share the palette and control voice.

## Typography and shape

Pixelify Sans for product name, headings, spell labels and rune numbers. DM Sans for readable prose and controls; JetBrains Mono for code. No pixel font on long note bodies. Small squared corners, stepped frames, inset bronze rules, pressed buttons and diamond rune nodes.

## Scenery

SVG scenery uses layered distant mountains, ruins, mist and fir trees. It stays static while idle and outside the editor text layer.

## Motion

Spells have charge, release, expansion, and drifting ember phases. Different events have distinct silhouettes: typing trails, Enter casting circle and flame, timeline directional light, completion rising star, summary inward convergence then reveal. Seeded variation, integer-pixel drawing, short trails, bounded bursts, adaptive budgets, no idle rendering loop.

Use Motion for panel transformations. Preserve composition/IME, caret, undo, and editor DOM. Reduced motion and all existing settings remain authoritative; sound stays opt-in. UI text describes real actions; only Motion Lab may simulate summary success, explicitly labelled.

## Components and voice

Navigation remains familiar and accessible. Fantasy labels are secondary to clear functional names: AI Summary, settings, notes, and categories retain their meaning. All modals, empty states, controls and both routes share the system. Keep the current routes and component boundaries.

## Exports

The authoritative CSS export is [`tokens.css`](tokens.css). Framework-neutral token exports live in [`docs/fantasy-tokens.json`](docs/fantasy-tokens.json). The app uses CSS directly; no runtime theme framework is needed.

### CSS variables

The complete CSS export is [tokens.css](tokens.css); the DTCG-style export of the same declarations is [fantasy-tokens.json](docs/fantasy-tokens.json).

### Tailwind v4 mapping

```css
@theme {
  --color-paper: oklch(17% .025 165);
  --color-surface: oklch(23% .023 165);
  --color-ink: oklch(93% .035 85);
  --color-accent: oklch(78% .125 80);
  --color-parchment: oklch(94% .035 85);
  --font-display: "Pixelify Sans", monospace;
  --font-body: "DM Sans Variable", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --spacing-md: 16px;
  --radius-md: 3px;
}
```

### shadcn/ui mapping

```css
:root {
  --background: oklch(17% .025 165);
  --foreground: oklch(93% .035 85);
  --card: oklch(23% .023 165);
  --card-foreground: oklch(93% .035 85);
  --primary: oklch(78% .125 80);
  --primary-foreground: oklch(17% .025 165);
  --muted: oklch(28% .045 110);
  --muted-foreground: oklch(78% .035 100);
  --border: oklch(36% .035 100);
  --input: oklch(36% .035 100);
  --ring: oklch(86% .14 85);
  --radius: 3px;
}
```

## Copy and transitions

Remove ornamental taglines and repeated explanatory headings. Keep functional labels, actionable empty states, provider privacy/backup information, and the witch introduction.

Note/category changes animate stable DOM surfaces with a short 260–380 ms translate/opacity entrance and an optional 540 ms gold sweep. Autosave never restarts a transition. Settings tabs retain their draft state and share a moving rune indicator. Native dialogs keep their focus trap while opening/closing; abort callbacks fire immediately before the closing animation. Motion preferences and OS reduced motion remain authoritative.

Ooalah witch is the sage-green pixel companion. She occasionally peeks out from behind the sidebar edge on the left of the workspace, gives one useful tip, then retreats. Never reserve a permanent sidebar slot or show a persistent character button/name. Wait 14 seconds initially, require 8 seconds without typing (including IME), and space appearances at least 150 seconds apart, with three tips per tab session. Stop tips during focus mode, dialogs, hidden tabs and closed mobile navigation. Keep close/Escape controls, pause auto-dismiss while reading with hover/keyboard focus, and honor reduced motion. She introduces herself only on her first actual appearance. See [behavior, asset and prompt](docs/OOALAH-WITCH.md).
