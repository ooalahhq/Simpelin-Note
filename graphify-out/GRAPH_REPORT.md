# Graph Report - Simpelin-Note  (2026-10-23)

## Corpus Check
- 79 files · ~196,438 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 459 nodes · 897 edges · 52 communities (24 shown, 28 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6212dc7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MotionLab.tsx
- WorkspaceApp.tsx
- model.ts
- IMPLEMENTATION.md
- devDependencies
- ai.ts
- compilerOptions
- NoteEditor.tsx
- OoalahWitch
- scripts
- WorkspaceApp
- Design — Simpelin / The Living Grimoire
- dependencies
- layout.tsx
- app.spec.ts
- entities
- @fontsource/jetbrains-mono
- @fontsource/pixelify-sans
- @fontsource-variable/dm-sans
- @fontsource-variable/manrope
- lowlight
- lucide-react
- motion
- next
- next.config.ts
- next-env.d.ts
- pixi.js
- react
- react-dom
- @tiptap/extension-code-block-lowlight
- @tiptap/extension-highlight
- @tiptap/extension-image
- @tiptap/extension-placeholder
- @tiptap/extension-table
- @tiptap/extension-task-item
- @tiptap/extension-task-list
- @tiptap/extension-text-align
- @tiptap/extension-text-style
- @tiptap/pm
- @tiptap/react
- @tiptap/starter-kit

## God Nodes (most connected - your core abstractions)
1. `WorkspaceApp()` - 20 edges
2. `compilerOptions` - 16 edges
3. `OoalahWitch()` - 14 edges
4. `renderSpell()` - 14 edges
5. `scripts` - 12 edges
6. `Settings()` - 12 edges
7. `createWorkspace()` - 12 edges
8. `POST()` - 11 edges
9. `MotionDirector` - 11 edges
10. `document()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `burst()` --calls--> `seeded()`  [EXTRACTED]
  tests/spells.test.ts → src/features/motion/presets.ts
- `NoteEditor()` --calls--> `safeUrl()`  [EXTRACTED]
  src/components/NoteEditor.tsx → src/lib/security.ts
- `Settings()` --calls--> `exportBackup()`  [EXTRACTED]
  src/components/Settings.tsx → src/lib/backup.ts
- `Settings()` --calls--> `previewBackup()`  [EXTRACTED]
  src/components/Settings.tsx → src/lib/backup.ts
- `save()` --calls--> `isLocalAIBaseUrl()`  [EXTRACTED]
  src/components/Settings.tsx → src/lib/ai.ts

## Import Cycles
- None detected.

## Communities (52 total, 28 thin omitted)

### Community 0 - "MotionLab.tsx"
Cohesion: 0.10
Nodes (35): AnimationSettings(), FantasyScenery(), EffectsHandle, EffectsOverlay, Burst, MotionDirector, MotionStats, createPainter() (+27 more)

### Community 1 - "WorkspaceApp.tsx"
Cohesion: 0.11
Nodes (32): Settings(), save(), Field(), IconButton(), Modal(), Spinner(), Toggle(), EntityDialog() (+24 more)

### Community 2 - "model.ts"
Cohesion: 0.11
Nodes (26): MotionLab(), applyBackup(), assetIds(), exportBackup(), previewBackup(), blocks(), inline(), inlineParagraph() (+18 more)

### Community 3 - "IMPLEMENTATION.md"
Cohesion: 0.06
Nodes (29): Menempatkan perubahan, Mengembangkan Simpelin, Sebelum mengirim perubahan, AI, Arsitektur Simpelin, Komponen dan alur data, Penyimpanan dan batas perilaku, Stylesheet (+21 more)

### Community 4 - "devDependencies"
Cohesion: 0.06
Nodes (35): esbuild, eslint, @eslint/js, eslint-plugin-react-hooks, fake-indexeddb, jsdom, devDependencies, esbuild (+27 more)

### Community 5 - "ai.ts"
Cohesion: 0.11
Nodes (26): isValidCustomBaseUrl(), maxDuration, POST(), readBody(), runtime, test(), SummaryDialog(), run() (+18 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 7 - "NoteEditor.tsx"
Cohesion: 0.12
Nodes (12): EditorToolbar(), AssetImage, Callout, CodeBlock, slashItems, EditorEffect, NoteEditor(), insertImage() (+4 more)

### Community 8 - "OoalahWitch"
Cohesion: 0.16
Nodes (12): OoalahWitch(), armHide(), focusOut(), hide(), leave(), onEditing(), onVisibility(), schedule() (+4 more)

### Community 9 - "scripts"
Cohesion: 0.11
Nodes (18): engines, node, name, private, scripts, build, dev, format (+10 more)

### Community 10 - "WorkspaceApp"
Cohesion: 0.20
Nodes (16): reorder(), WorkspaceApp(), addNote(), chooseNode(), emit(), importData(), removeEntity(), selectCategory() (+8 more)

### Community 11 - "Design — Simpelin / The Living Grimoire"
Cohesion: 0.12
Nodes (14): Components and voice, Copy and transitions, CSS variables, Design — Simpelin / The Living Grimoire, Exports, Genre and structure, Motion, Palette (+6 more)

### Community 12 - "dependencies"
Cohesion: 0.29
Nodes (7): dexie, jszip, marked, dependencies, dexie, jszip, marked

## Knowledge Gaps
- **143 isolated node(s):** `config`, `name`, `version`, `private`, `dev` (+138 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `scripts`, `entities`, `@fontsource/jetbrains-mono`, `@fontsource/pixelify-sans`, `@fontsource-variable/dm-sans`, `@fontsource-variable/manrope`, `lowlight`, `lucide-react`, `motion`, `next`, `pixi.js`, `react`, `react-dom`, `@tiptap/extension-code-block-lowlight`, `@tiptap/extension-highlight`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`, `@tiptap/extension-table`, `@tiptap/extension-task-item`, `@tiptap/extension-task-list`, `@tiptap/extension-text-align`, `@tiptap/extension-text-style`, `@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `OoalahWitch()` connect `OoalahWitch` to `WorkspaceApp.tsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `OoalahWitch()` (e.g. with `enter()` and `focusIn()`) actually correct?**
  _`OoalahWitch()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _143 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MotionLab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09783368273934312 - nodes in this community are weakly interconnected._
- **Should `WorkspaceApp.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10509803921568628 - nodes in this community are weakly interconnected._