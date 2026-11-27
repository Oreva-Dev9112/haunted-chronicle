# Implementation Plan: Haunted Chronicle

## Overview

The design uses TypeScript throughout, so all tasks use TypeScript. The order follows the main loop: scaffold, Scanner, pure World_Engine, a minimal server plus Village (cozy view, concealment, JINX/Reveal), a Look and feel pass (task 9), sickness and healing visuals, automatic test runs, Chronicle, HTTP API plus hook plus MCP, the `init` command, finish gate, then recording/demo, GitHub Pages deploy, Director_Mode, Reduced_Motion, intro buttons, an automated end-to-end test, steering files, and the README. Test files for each property live in their own file under `tests/` so they can be written in parallel. Sub-tasks marked `*` are optional tests.

## Tasks

- [ ] 1. Project scaffold
  - [x] 1.1 Create the single npm package and build configuration
    - Create `package.json` (name `haunted-chronicle`, `type: module`, bin `haunted-chronicle` to `dist/cli.js`, `files`, scripts `build:node`, `build:web`, `build:demo`, `build`, `test`, `lint`, `prepare`), `tsconfig.json` (alias `@core/*`), `tsup.config.ts`, `vite.config.web.ts`, `vite.config.demo.ts`, `vitest.config.ts` with the same alias
    - Create `src/cli/index.ts` with a shebang and a subcommand dispatcher (`start`, `mcp`, `hook`, `record`, `config`) that lazily imports each handler, with stub handlers that print "not implemented"
    - Keep runtime `dependencies` to the MCP SDK, chokidar, es-module-lexer, ignore; React, R3F, three, Vite, tsup, vitest, fast-check as devDependencies
    - Add a trivial Vitest test and confirm `npm test` and `npm run build:node` pass
    - _Requirements: 1.1, 1.5_

  - [ ] 1.2 Create core purity enforcement
    - Create `src/core/types.ts` with the data model types from the design
    - Add `tests/core-purity.test.ts` that scans `src/core` and fails on `node:*` or Node builtin imports, `react`, `three`, `@react-three/*`, `Date.now`, `new Date(`, `performance.now`, `Math.random`, `process.`
    - Add ESLint `no-restricted-imports` and `no-restricted-globals` overrides for `src/core/**`
    - _Requirements: 5.2, 21.9_

- [x] 2. Snapshot codec
  - [x] 2.1 Implement `src/core/snapshot.ts`
    - Export `Snapshot` and `printSnapshot` (canonical, key-sorted JSON) and `parseSnapshot` returning `{ error }` that names the invalid field and never throws
    - _Requirements: 20.1, 20.2, 20.4_

  - [ ]* 2.2 Write property test for Snapshot round trip
    - Create `tests/core/p15-snapshot-roundtrip.test.ts`
    - **Property 15: Snapshot round trip**
    - **Validates: Requirements 20.3**

  - [ ]* 2.3 Write property test for invalid input handling
    - Create `tests/core/p17-invalid-json.test.ts`
    - **Property 17: Invalid Snapshot JSON never throws**
    - **Validates: Requirements 20.4, 10.15**

- [ ] 3. Scanner
  - [ ] 3.1 Implement file walk and ignore rules
    - Create `src/server/scanner/walk.ts` and `gitignore.ts`: respect `.gitignore`, `.git`, `node_modules`, `.haunted`; sort paths; cap at 300 with `omittedFileCount`; group by parent folder
    - Produce identical Snapshots regardless of listing order; create no Citizens, Tasks, or findings from `.haunted`
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7_

  - [ ] 3.2 Implement import graph extraction
    - Create `src/server/scanner/imports.ts` using `es-module-lexer` for static imports and re-exports of `.js/.jsx/.ts/.tsx`
    - Resolve relative specifiers to File_Nodes, drop unresolved edges, keep unparseable files with no edges, sort edges
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.3 Implement spec task extraction
    - Create `src/server/scanner/tasks.ts`: parse `.kiro/specs/*/tasks.md` checkbox lines into `{ specName, line, text, done }`
    - _Requirements: 9.1_

  - [ ] 3.4 Implement secret detection
    - Create `src/core/secrets.ts` (pure patterns: API key, private key header, token assignment) and use it from the Scanner; skip binary files and files over 1 MB; store only pattern name, path, and line
    - _Requirements: 11.1, 11.2, 11.5_

  - [ ] 3.5 Implement test results reader
    - Create `src/server/scanner/test-results.ts`: read `.haunted/test-results.json` (Vitest JSON) into `TestFailure[]` with stack frames; treat missing or invalid JSON as no results; discard failures naming unknown Test_Files
    - _Requirements: 10.1, 10.15, 10.16_

  - [ ] 3.6 Implement watching and Snapshot publishing
    - Create `src/server/scanner/watch.ts` with chokidar, debounced so an updated Snapshot is published within 1 second of file, `tasks.md`, or test report changes
    - Expose `scanProject(root)` and `watchProject(root, onSnapshot)`
    - _Requirements: 2.3, 9.8, 10.2_

  - [ ]* 3.7 Write property test for import extraction
    - Create `tests/server/p19-imports.test.ts`
    - **Property 19: Import edge extraction correctness**
    - **Validates: Requirements 3.2, 3.3, 3.5**

  - [ ]* 3.8 Write property test for secret redaction
    - Create `tests/core/p18-secret-redaction.test.ts`
    - **Property 18: Secret value redaction**
    - **Validates: Requirements 11.2**

  - [ ]* 3.9 Write unit tests for the Scanner
    - Create `tests/server/scanner.test.ts` with a temp directory: ignore rules including `.haunted`, 300-file cap, unparseable file, task extraction, test report edge cases, update latency under 1 second
    - _Requirements: 2.2, 2.3, 2.5, 2.7, 3.4, 9.1, 10.15, 10.16_

- [ ] 4. Checkpoint - Scanner complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. World_Engine core
  - [ ] 5.1 Implement hash and citizen appearance
    - Create `src/core/hash.ts` (FNV-1a `citizenSeed`) and derive name, face variant, house model, house colour from the seed only
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 5.2 Implement deterministic layout
    - Create `src/core/layout.ts`: Castle at centre, district anchors by folder-path hash, BFS flood fill in fixed sort order, skip Tombstone tiles, replay previous tiles and place only new paths
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 24.7_

  - [ ] 5.3 Implement task assignment
    - Create `src/core/tasks.ts`: longest-path-first substring match, multiple Districts allowed, Castle when no existing path matches, ignore non-existent paths
    - _Requirements: 9.2, 9.3, 9.4, 9.7_

  - [ ] 5.4 Implement sickness
    - Create `src/core/sickness.ts`: Sickness_Source selection from stack frames (skip `node_modules`, outside Project, Test_File, unknown paths), one-hop import fallback, failing Test_Files sick, reverse-BFS spread with a visited set, record failure location
    - _Requirements: 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 12.1_

  - [ ] 5.5 Implement `deriveWorldState`
    - Create `src/core/world.ts`: citizens, districts, castle, dark/sick/freed flags, gravestones, Tombstone set carried from `previous`, `everSeenPaths`, `omittedFileCount`; `EngineCtx { nowMs }` injected, never read from a clock
    - Carry forward `phase`, `jinxSeq`, `finished`, `nextSeq`
    - _Requirements: 5.2, 9.5, 9.6, 12.1, 12.3, 12.5, 12.6, 21.1, 21.2, 21.3, 21.4, 21.7_

  - [ ] 5.6 Implement `applyPromptSignal`
    - In `src/core/world.ts`: move `cozy` to `cursed` once, set `jinxSeq` to the `first_prompt` event seq, no-op when already cursed
    - _Requirements: 8.4, 8.7, 8.9_

  - [ ]* 5.7 Write property test for citizen identity
    - Create `tests/core/p02-identity.test.ts`
    - **Property 2: Citizen identity from path only**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ]* 5.8 Write property test for determinism
    - Create `tests/core/p01-determinism.test.ts`
    - **Property 1: Determinism of World_Engine**
    - **Validates: Requirements 2.6, 5.1, 5.2**

  - [ ]* 5.9 Write property test for layout validity
    - Create `tests/core/p03-layout-validity.test.ts`
    - **Property 3: Layout validity**
    - **Validates: Requirements 5.3, 5.4, 24.7**

  - [ ]* 5.10 Write property test for layout stability
    - Create `tests/core/p04-layout-stability.test.ts`
    - **Property 4: Layout stability under addition**
    - **Validates: Requirements 5.6**

  - [ ]* 5.11 Write property test for task assignment
    - Create `tests/core/p08-task-assignment.test.ts`
    - **Property 8: Task assignment correctness**
    - **Validates: Requirements 9.2, 9.3, 9.4, 9.7**

  - [ ]* 5.12 Write property test for sickness against a reference model
    - Create `tests/core/p05-sickness.test.ts` with cyclic graphs and frames in `node_modules`, the Test_File, or outside the Snapshot
    - **Property 5: Sickness source and spread equals the reference model**
    - **Validates: Requirements 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10**

  - [ ]* 5.13 Write property test for healing
    - Create `tests/core/p06-healing.test.ts`
    - **Property 6: Healing is the inverse of sickening**
    - **Validates: Requirements 12.1, 12.8**

  - [ ]* 5.14 Write property test for Freed District
    - Create `tests/core/p09-freed.test.ts`
    - **Property 9: Freed District iff fully clean**
    - **Validates: Requirements 12.3, 12.5**

  - [ ]* 5.15 Write property test for JINX once
    - Create `tests/core/p14-jinx-once.test.ts`
    - **Property 14: JINX happens exactly once**
    - **Validates: Requirements 8.4, 8.7**

- [ ] 6. Checkpoint - World_Engine complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Village: minimal server, cozy view, concealment, JINX and Reveal
  - [ ] 7.1 Implement view projections
    - Create `src/core/view.ts` with pure `cozyView(ws)` and `cursedView(ws)` returning a `VillageViewModel`
    - Cozy: happy faces, no red tint, gravestones, tombstones, lanterns, dark or glow styling, Chronicle, and a stats card of only project name, file count, district count
    - Cursed: full truth, Chronicle entries filtered to `seq >= jinxSeq` and none when `jinxSeq` is null, Freed count on the stats card
    - _Requirements: 6.8, 7.10, 7.11, 7.12, 7.13, 7.14, 7.17, 15.8_

  - [ ] 7.2 Implement the minimal village server
    - Create `src/server/start.ts` and `src/server/http.ts`: bind 127.0.0.1 only, next free port when busy, print URL, serve `dist/web`, SSE `GET /api/events` (full `world` first, then updates) from Scanner to `deriveWorldState`, and `POST /api/prompt-signal`
    - Wire the `start` subcommand to `start.ts` with `--no-open`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.4, 8.7, 8.9_

  - [ ] 7.3 Create the web app and island scene
    - Create `src/web/main.tsx`, `state/useWorldStream.ts`, `scene/VillageScene.tsx`: hex island with `InstancedMesh` per model index from `/models/kit.glb` (basic home models from `houseModel` only, Castle at centre, Districts adjacent and visually separate)
    - Folder-type model selection, scenery, sky, and the ink-outline and other postprocessing are done in task 9; do not implement them here
    - _Requirements: 6.1, 6.2_

  - [ ] 7.4 Add faces, hover, zoom, and stats card
    - Create `scene/Citizen.tsx` (plain happy or neutral face sprite beside house; expressions and hopping come from task 9.16), hover and select tooltip with path and Citizen name, zoom in and out buttons, `ui/StatsCard.tsx` driven by the active view model
    - _Requirements: 6.3, 6.6, 6.7, 6.8_

  - [ ] 7.5 Add cozy welcome, toggle, and send first prompt
    - Create `ui/IntroOverlay.tsx` (title "Welcome to <project name>", subtitle "<N> files. <N> happy little lives."), `ui/Toggles.tsx` (Cozy and Cursed `View_Mode`, client-only, defaults to Phase on load), "Send first prompt" button that calls `POST /api/prompt-signal`
    - Render only the projection selected by `View_Mode`; toggle never changes Phase or World_State; hide Chronicle and Chronicler in Cozy
    - _Requirements: 6.9, 7.1, 7.2, 7.3, 7.4, 7.15, 7.16, 8.14, 8.15, 8.16, 21.10_

  - [ ] 7.6 Add JINX and Reveal
    - Detect `jinxSeq` going from null to a number, play the flash and the word JINX, then swap the active projection to `cursedView(ws)` of the current state with no history replay; set `View_Mode` to Cursed
    - Show title "Nevermerge" in the cursed Phase with Cursed view (night lighting, dark clouds, and bats come from `cursedView` through tasks 9.14 and 9.15); use the non-flashing fade path when reduced motion is on (store from task 9.7, settings control in task 21.1)
    - _Requirements: 8.5, 8.6, 8.8, 8.10, 8.11, 8.13_

  - [ ]* 7.7 Write property test for concealment invariance
    - Create `tests/core/p24-concealment.test.ts`
    - **Property 24: Concealment invariance**
    - **Validates: Requirements 7.10, 7.11, 7.12, 7.13, 7.14, 7.15, 7.16, 7.17, 21.9, 21.10**

  - [ ]* 7.8 Write property test for Reveal equals end state
    - Create `tests/core/p25-reveal.test.ts`
    - **Property 25: Reveal equals end state, independent of history**
    - **Validates: Requirements 8.10, 8.11, 8.12, 7.10, 7.11, 7.12, 15.8**

  - [ ]* 7.9 Write property test for Dark and Sick independence
    - Create `tests/core/p20-dark-sick.test.ts`
    - **Property 20: Dark and Sick vary independently**
    - **Validates: Requirements 9.5, 9.9, 10.13, 10.14, 12.8, 12.9**

  - [ ]* 7.10 Write component tests for the cozy flow
    - Create `tests/web/cozy.test.tsx` (jsdom): welcome text, toggle preview leaves Phase unchanged, Reveal swap
    - _Requirements: 7.1, 8.14, 8.15, 8.10_

- [ ] 8. Checkpoint - Main loop works (scan, derive, render, JINX)
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Look and feel
  - Visual targets: `reference/look/Big3.tsx` (ideas only, write fresh code), the model index in `reference/README.md`, and the screenshots in `reference/screenshots/` (`v4-cozy.png` bright yellow hex island with clouds; `v4-cursed.png` night, red glowing sick districts, warm lantern-lit freed districts, dark clouds, castle with red-eyed Chronicler; `intro-*.png` and `film-*.png` for close-ups of red-tinted broken houses with dead-eyed, scared, and neutral faces)
  - Pure pieces live in `src/core` and are testable in Node. Visual pieces in `src/web/scene` read only the `VillageViewModel` from `cozyView` or `cursedView`, never `WorldState` directly, so concealment holds by construction
  - Task 7.3 (basic instancing), 7.4 (basic face sprite), and 7.6 (Reveal) are extended here by reference; task 10 keeps only the tint, glow, gravestone, tombstone, and dark-castle visuals

  - [ ] 9.1 Implement the kit catalogue and folder-type model mapper
    - Create `src/core/kit.ts`: named constants for the kit indices in `reference/README.md` and a pure `classifyFolder(folderPath)` that maps the last path segment to a folder type (for example `tests`/`__tests__` to watchtower, `server`/`api`/`routes` to blacksmith, `scripts`/`build`/`tools` to lumber mill, `components`/`ui`/`web`/`pages` to market, `data`/`db`/`models` to tavern, `lib`/`utils`/`shared` to well, `config` to windmill, `docs` to church, anything else to homes)
    - Add pure `modelFor(folderPath, citizen)`: the lowest-seed Citizen of a District uses the landmark model of its folder type, every other Citizen uses a home model (6 to 13) chosen from the Citizen's existing seed-derived `houseModel`; the Castle always uses model 22; the result depends only on folder path and Citizen, never on file contents or sickness
    - Document the folder type to model table in a comment at the top of the file
    - This uses the existing `houseModel` value (task 5.1) as a selector inside a model set, so Citizen identity from the path is unchanged
    - _Requirements: 4.4, 6.1, 6.2_

  - [ ]* 9.2 Write property tests for the model mapper
    - Create `tests/core/look-kit.test.ts`
    - Same path and folder always give the same kit index; every index is in the catalogue; every non-landmark Citizen gets a home model; each District has at most one landmark; the Castle is always model 22
    - **Property 2: Citizen identity from path only** (extended to the mapped model)
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ] 9.3 Extend the view projections with look-and-feel state
    - In `src/core/view.ts` extend `VillageViewModel` with: per-citizen `expression` (`happy`, `scared`, `sick`, `praying`); per-citizen `houseState` (`normal`, `broken`, `scaffold`, `halfBuilt`); per-district `decor` (`lantern`, `jackOLantern`, `candles`, or none) for Freed Districts; `ambience` (`day` or `night`) with cloud style (`white` or `dark`); `bats` flag; `chronicler` flag (dark orb with red ring above the Castle); `deadTrees` flag
    - `cursedView` rules: expression is `sick` for a Sick Citizen, `scared` for a healthy Citizen in a Sick District, `praying` for a healthy Citizen in a Dark District, else `happy` (first match wins); houses of Sick Citizens are `broken`; in a Dark District Citizens whose seed is divisible by 3 are `scaffold` or `halfBuilt` (by seed parity); Freed Districts get decor chosen by folder-path hash; `ambience` is `night`, `bats` and `chronicler` are true, `deadTrees` is true
    - `cozyView` rules: every expression `happy`, every `houseState` `normal`, no decor, `ambience` `day`, `bats`, `chronicler`, and `deadTrees` false; the view model reads only `WorldState` fields it already has, so no new world data is needed
    - When `finished` is true both rules yield no Dark or Sick styling (requirement 13.7)
    - _Requirements: 7.10, 7.11, 7.12, 7.13, 7.14, 7.17, 9.5, 10.12, 10.13, 10.14, 12.4, 13.7_

  - [ ]* 9.4 Write property and unit tests for the extended view model
    - Create `tests/core/look-view.test.ts`
    - For all World_States, `cozyView` has only `happy` expressions, only `normal` houses, no decor, `day`, and no bats or orb; `cursedView` expression priority is sick, scared, praying, happy; broken houses belong only to Sick Citizens; scaffold and half-built houses only appear in Dark Districts; decor only in Freed Districts
    - **Property 24: Concealment invariance** (extended to the new fields)
    - **Property 25: Reveal equals end state, independent of history** (extended to the new fields)
    - **Validates: Requirements 7.10, 7.11, 7.12, 7.13, 7.14, 7.17, 8.10, 8.11, 8.12**

  - [ ] 9.5 Implement deterministic scenery placement
    - Create `src/core/scenery.ts`: pure `deriveScenery(layout, tombstones)` returning tree, hill, rock, and fence placements on free tiles around the Districts (models 3, 4, 5, 27 to 30, 33, 34, dead variants 35 and 36), and a water ring of water tiles (model 1) around the outside of all land
    - Placement is seeded by folder-path hash and tile coordinates only, uses tiles not claimed by houses, the Castle, or Tombstones, never changes any house tile (layout stability, Property 4, stays intact), and ignores Phase and View_Mode; the view model flag `deadTrees` selects the dead variants at render time
    - _Requirements: 5.2, 5.3, 5.4, 5.6, 6.1_

  - [ ]* 9.6 Write property tests for scenery
    - Create `tests/core/look-scenery.test.ts`
    - Scenery never shares a tile with a house, the Castle, or a Tombstone; the water ring surrounds all land and no land tile is water; output is equal for shuffled Snapshot arrays; adding a file never moves existing houses
    - **Property 3: Layout validity** (extended to scenery)
    - **Property 4: Layout stability under addition** (extended to scenery)
    - **Validates: Requirements 5.3, 5.4, 5.6, 24.7**

  - [ ] 9.7 Create the minimal Reduced_Motion store
    - Create `src/web/state/reducedMotion.ts`: a small store with a `useReducedMotion()` hook and a setter; default from `prefers-reduced-motion`; look-and-feel components read it
    - Task 21.1 extends this same file with persistence and the settings control instead of creating it
    - _Requirements: 18.1, 18.2_

  - [ ] 9.8 Implement the render quality controller
    - Create `src/web/state/quality.ts`: pure `nextQuality(current, fpsSamples, fileCount, nowMs)` over tiers `high`, `medium`, `low`, `off` (postprocessing and effects), downgrading when the average of recent frame rates stays under 30 for 2 seconds, upgrading only after 10 seconds above 50, never upgrading past a manual cap, starting at `low` when `fileCount` is above 150; plus `qualityFlags(tier)` naming which effects are on (SSAO, bloom, tilt-shift, grain, vignette, outline mode `post` or `hull`)
    - Expose a `?quality=` URL override and a small quality switch in `ui/Toggles.tsx`
    - _Requirements: 6.5_

  - [ ]* 9.9 Write unit tests for the quality controller
    - Create `tests/web/quality.test.ts`: downgrade after sustained low frame rate, no flapping, manual cap respected, 300-file start tier
    - _Requirements: 6.5_

  - [ ] 9.10 Render houses and landmarks from the kit mapping
    - Create `src/web/scene/Houses.tsx`: one `InstancedMesh` per kit index using `modelFor` from task 9.1 (replaces the home-only mapping of task 7.3), Castle at the centre; load the kit once through a shared `GLTFLoader` helper
    - _Requirements: 6.1, 6.2_

  - [ ] 9.11 Render scaffolding and broken houses
    - Create `src/web/scene/HouseStates.tsx`: swap a house to scaffolding (model 23), half-built (models 24 or 25), or destroyed building (model 26) according to `houseState` in the view model; red tint stays in task 10.1
    - _Requirements: 9.5, 10.12, 10.13_

  - [ ] 9.12 Render lanterns and jack-o'-lanterns in Freed Districts
    - Create `src/web/scene/FreedDecor.tsx`: lantern (42), jack-o'-lantern (43), and candles (44) instances with a warm point glow per Freed District according to `decor`; this replaces the lantern item in task 10.1
    - _Requirements: 12.3, 12.4_

  - [ ] 9.13 Render trees, hills, rocks, fences, and the water ring
    - Create `src/web/scene/Scenery.tsx`: instanced scenery from `deriveScenery` and a gently moving water ring; dead trees when `deadTrees` is true; water motion is static when reduced motion is on
    - _Requirements: 6.1, 18.1_

  - [ ] 9.14 Add sky, lighting, and drifting clouds
    - Create `src/web/scene/Sky.tsx`: bright yellow-lit day for `ambience: 'day'`, night lighting with dark clouds for `'night'`, cloud models 31 and 32 drifting slowly; with reduced motion the clouds are static and no light changes flash
    - _Requirements: 7.10, 8.5, 18.1, 18.2_

  - [ ] 9.15 Add bats in the cursed view
    - Create `src/web/scene/Bats.tsx`: a small flock circling above the island, rendered only when `bats` is true; with reduced motion the flock is slower, smaller, and has no flapping faster than 3 times per second
    - _Requirements: 7.10, 18.1, 18.2_

  - [ ] 9.16 Add bubbly face expressions and hopping
    - In `src/web/scene/Citizen.tsx` (from task 7.4): draw face sprites for `happy`, `scared`, `sick`, and `praying` (bubbly eyes and mouth, dead eyes for `sick`) from the view model; citizens hop on a seed-based phase; with reduced motion hops are small and slow and the praying and scared expressions are static
    - _Requirements: 6.3, 7.10, 10.12, 18.1_

  - [ ] 9.17 Add the Chronicler orb above the castle
    - Create `src/web/scene/ChroniclerOrb.tsx`: a dark orb with a red ring and blinking eyes above the Castle, rendered only when `chronicler` is true (Cursed view); with reduced motion the eyes do not blink and the ring does not pulse
    - _Requirements: 7.10, 15.5, 18.1, 18.2_

  - [ ] 9.18 Implement the postprocessing pipeline
    - Create `src/web/scene/PostFx.tsx`: tilt-shift, bloom, SSAO, vignette, film grain, and ink outline, with each effect switched by `qualityFlags` from task 9.8; tier `low` falls back to an inverted-hull outline on the instanced meshes with no composer, tier `off` renders plain; film grain is static when reduced motion is on; bloom intensity is capped so no flashing occurs
    - _Requirements: 6.4, 6.5, 18.2_

  - [ ] 9.19 Compose the look-and-feel components in the scene
    - In `src/web/scene/VillageScene.tsx` mount `Houses`, `HouseStates`, `FreedDecor`, `Scenery`, `Sky`, `Bats`, `ChroniclerOrb`, and `PostFx`; every component receives the active projection (`cozyView` or `cursedView`) selected by `View_Mode`
    - _Requirements: 6.1, 6.4, 7.15, 7.16, 8.14, 8.15_

  - [ ]* 9.20 Write smoke tests for the scene builders
    - Create `tests/web/look-smoke.test.tsx`: for a fixed World_State, each scene component builds its instance list without WebGL (builders are pure functions that return instance descriptors); the Cozy projection yields no scaffold, broken, decor, bat, or orb instances; the Cursed projection yields them; the reduced-motion flag lowers the animation amplitude values
    - _Requirements: 7.10, 7.11, 7.12, 7.13, 18.1_

  - [ ] 9.21 Add the visual check list
    - Create `tests/visual/CHECKLIST.md`: for each screenshot in `reference/screenshots/` the elements to compare (cozy bright island with clouds and water ring; night with red glowing sick districts; lantern-lit freed districts; castle with the red-eyed orb; red-tinted broken houses with dead-eyed, scared, and neutral faces), the `?quality=` tiers to try, and the 300-file 30 fps check from requirement 6.5
    - The check itself is done by a person looking at the running Village; it is not an automated task
    - _Requirements: 6.4, 6.5_

- [ ] 10. Sickness and healing visuals
  - [ ] 10.1 Render cursed-state visuals
    - In `src/web/scene`: red tint on the materials of Sick Citizens' houses, red glow on Sick Districts, dark Districts, dark Castle with glowing white eyes, Gravestones, Tombstones; all driven only by `cursedView`
    - Not here, because task 9 covers them: sick, scared, and praying faces (9.16), broken houses and scaffolding (9.11), lanterns and jack-o'-lanterns (9.12), and the Chronicler orb (9.17)
    - _Requirements: 9.5, 9.6, 10.13, 10.14, 11.3, 11.4, 12.8, 12.9, 24.4, 24.5_

  - [ ] 10.2 Add heal animation
    - Play a heal animation on Sick-to-healthy transitions in the Cursed view only; use a non-flashing colour transition when reduced motion is on; play none in the Cozy view
    - _Requirements: 7.15, 12.2, 12.7_

  - [ ]* 10.3 Write unit tests for visual state transitions
    - Create `tests/web/transitions.test.ts`: heal transition detection, no heal in Cozy, gravestone removed when finding disappears
    - _Requirements: 7.15, 11.4, 12.2_

- [ ] 11. Automatic test runs
  - [ ] 11.1 Implement the scheduler reducer
    - Create `src/server/test-runner/scheduler.ts`: pure `(state, event, nowMs) -> state'` with 2 s debounce, one run at a time, exactly one follow-up, `.haunted` changes ignored, initial run at startup; no Node imports
    - _Requirements: 22.2, 22.3, 22.4, 22.6, 22.7_

  - [ ] 11.2 Implement the runner and Vitest detection
    - Create `src/server/test-runner/runner.ts`: detect Vitest in `package.json` or config, run `vitest run --reporter=json` to a temp file in `.haunted`, rename atomically on success, kill and discard after 120 s or on crash, keep prior report
    - _Requirements: 22.1, 22.5, 22.8, 22.9, 22.11_

  - [ ] 11.3 Wire scheduler and runner into the server
    - In `src/server/start.ts`: feed file changes and run completions to the scheduler, start the runner when due, rely on the Scanner picking up the new report
    - _Requirements: 22.2, 22.3, 22.10_

  - [ ]* 11.4 Write property test for the scheduler model
    - Create `tests/server/p22-scheduler.test.ts`
    - **Property 22: Test scheduler model**
    - **Validates: Requirements 22.2, 22.4, 22.6, 22.7**

  - [ ]* 11.5 Write unit tests for the runner
    - Create `tests/server/runner.test.ts`: Vitest detection fixtures, timeout and crash with a slow fixture script, atomic rename
    - _Requirements: 22.1, 22.8, 22.9_

- [ ] 12. Chronicle
  - [ ] 12.1 Implement event derivation, births, deaths, tombstones
    - Create `src/core/events.ts` and update `deriveWorldState`: events with `seq` and `atMs = ctx.nowMs`; no births for the initial scan; death only for deleted paths; Tombstones for dead paths, removed on re-creation; rename gives one death and one birth; no events for paths entering or leaving the 300-file window; also sickness, healing, secret, freed, task, and finished events
    - _Requirements: 14.9, 14.11, 21.6, 24.1, 24.2, 24.3, 24.5, 24.6, 24.8, 24.9, 24.10_

  - [ ] 12.2 Implement the Chronicler
    - Create `src/core/chronicle.ts`: template families per event type, variant by `citizenSeed(path)`, at most 30 words, no emoji, Evidence_Line path must be in `everSeenPaths`, no entry otherwise; pure reducer `reduceChronicle(world, events, ctx)` that groups same-type events within 3000 ms of the anchor `atMs`, closes quiet groups on `ctx.nowMs`, and picks the lowest-seed path as representative
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.10, 15.9, 21.8_

  - [ ] 12.3 Wire the Chronicler into the server
    - In `src/server/http.ts` and `start.ts`: run the reducer on each derivation and on a timer tick with no events so groups close; include `chronicle` in streamed `world`
    - _Requirements: 14.1, 15.5, 15.9_

  - [ ] 12.4 Build the Chronicle panel
    - Create `src/web/ui/ChroniclePanel.tsx`: parchment panel "The Chronicle", newest first, handwritten text plus monospace Evidence_Line, only in Cursed view, entries filtered by `seq >= jinxSeq`; clicking an entry moves the camera to the house or Tombstone; the Chronicler orb itself is rendered by task 9.17
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

  - [ ]* 12.5 Write property test for birth, death, and tombstones
    - Create `tests/core/p21-births-deaths.test.ts`
    - **Property 21: Birth, death, and tombstone consistency**
    - **Validates: Requirements 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7, 24.8, 24.9, 21.6**

  - [ ]* 12.6 Write property test for entry shape
    - Create `tests/core/p10-entry-shape.test.ts`
    - **Property 10: Chronicle entry shape**
    - **Validates: Requirements 14.2, 14.3, 14.4**

  - [ ]* 12.7 Write property test for Chronicle determinism
    - Create `tests/core/p11-chronicle-determinism.test.ts`
    - **Property 11: Chronicle determinism**
    - **Validates: Requirements 14.6**

  - [ ]* 12.8 Write property test for grouping
    - Create `tests/core/p12-grouping.test.ts`
    - **Property 12: Chronicle grouping**
    - **Validates: Requirements 14.7**

- [ ] 13. Checkpoint - Sickness, tests, and Chronicle work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. HTTP API, hook, and MCP
  - [ ] 14.1 Implement shared problems and API contract
    - Create `src/core/problems.ts` (`deriveProblems(snapshot, world)` covering Sickness_Sources, sick-by-import, secrets, unticked tasks, ignoring Phase) and `src/core/api.ts` (`StateResponse`, `parseStateResponse` returning `{ error }`)
    - _Requirements: 16.3, 16.4, 16.9, 16.10, 16.12, 21.11_

  - [ ] 14.2 Implement server discovery and one-server protocol
    - Create `src/server/server-info.ts`: exclusive `wx` create of `.haunted/server.json` with `port: null`, then atomic rewrite with the real port, liveness via `process.kill(pid, 0)` and `GET /__haunted_ping` matching `projectRoot`, stale replacement, removal on clean shutdown
    - Make `start` print the live server's URL instead of starting a second one
    - _Requirements: 1.6, 23.1, 23.2, 23.3, 23.4, 23.8_

  - [ ] 14.3 Complete the HTTP API
    - In `src/server/http.ts`: add `GET /__haunted_ping`, `GET /api/state` (`{ snapshot, world, problems, serverTimeMs }`, no token), reject any `Host` not `127.0.0.1:<port>` or `localhost:<port>` with 403
    - _Requirements: 16.4, 23.2, 23.7, 23.9_

  - [ ] 14.4 Implement the hook and config printers
    - Create `src/cli/hook.ts` (drain stdin, read `server.json`, stale pid check, POST with 500 ms timeout, always exit 0 with no output) and `src/cli/config.ts` (`config hook`, `config mcp` snippets using `node <abs>/dist/cli.js <subcommand>`)
    - _Requirements: 8.1, 8.2, 8.3, 16.8_

  - [ ] 14.5 Implement the MCP thin client
    - Create `src/mcp/client.ts` (ensure server: read `server.json`, ping, spawn detached `start --no-open`, poll up to 10 s, log URL to stderr only, bounded fetch with `parseStateResponse`), `tools.ts` (`whats_haunting`, `world_status`; `declare_finished` returns the refusal for now), `prompt.ts` (`whats-haunting-my-world`), `index.ts` (stdio, stdout carries protocol only)
    - The MCP process never scans, watches, runs tests, or computes a World_State
    - _Requirements: 16.1, 16.2, 16.3, 16.5, 16.7, 16.9, 16.10, 16.11, 16.12, 23.5, 23.6, 23.7_

  - [ ]* 14.6 Write property test for truthfulness
    - Create `tests/mcp/p07-truthfulness.test.ts`
    - **Property 7: Truthfulness of World_State and whats_haunting**
    - **Validates: Requirements 16.4, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8**

  - [ ]* 14.7 Write property test for one server per project
    - Create `tests/server/p23-one-server.test.ts` with a fake process table and injected spawn
    - **Property 23: One live server per project**
    - **Validates: Requirements 1.6, 23.2, 23.3, 23.4, 23.8**

  - [ ]* 14.8 Write integration tests for hook and MCP
    - Create `tests/cli/hook.test.ts` (no file, stale file, live stub, stub that never answers: exit 0, empty output, under 1 s) and `tests/mcp/tools.test.ts` (tool and prompt registration, auto-start with clean stdout, no project files opened besides `server.json`, port fallback, stale file replacement)
    - _Requirements: 1.4, 8.2, 8.3, 16.1, 16.2, 16.11, 23.4, 23.5, 23.6_

- [ ] 15. Init command
  - [ ] 15.1 Implement the pure init merge logic
    - Create `src/cli/init-merge.ts` with no file or process access: `resolveCommandForm(argv1, platform, options)` returns the command form to write, `buildHookDefinition(form)`, `mergeHookFile(existingText | null, form)`, and `mergeMcpConfig(existingText | null, form)`, each returning `{ ok: true, text, changed }` or `{ ok: false, error }`
    - Command forms: when the CLI runs from a local build or `npm link` use `node <absolute path to dist/cli.js> <subcommand>`; when the path is inside an npx cache (a `_npx` path segment) use `npx --yes github:Oreva-Dev9112/haunted-chronicle <subcommand>`, because the cache path does not last; an option `relative: true` writes `node ./dist/cli.js <subcommand>` for a repository that builds the tool itself
    - Hook file `.kiro/hooks/haunted-chronicle.json`: `{ "version": "v1", "hooks": [ { "name": "Haunted Chronicle prompt signal", "trigger": "UserPromptSubmit", "action": { "type": "command", "command": "<form> hook" } } ] }`; merging adds this hook to an existing `hooks` array only when no hook with that name exists, and leaves every other hook and field untouched
    - MCP file `.kiro/settings/mcp.json`: add `mcpServers["haunted-chronicle"]` with `command` and `args` for the form; an existing `haunted-chronicle` entry and every other server and key are kept as they are, even when different
    - Existing text that is not valid JSON, or is JSON of the wrong shape (for example `hooks` or `mcpServers` not an array or object), returns an error naming the file and the problem and never a merged result; output is 2-space JSON with a trailing newline, so a second merge returns `changed: false` with identical text
    - _Requirements: 8.1, 16.8_

  - [ ]* 15.2 Write property tests for merge idempotence and preservation
    - Create `tests/cli/init-merge.test.ts` with fast-check over generated existing hook files and MCP configs (extra servers, extra hooks, unknown keys)
    - Merging twice equals merging once; every pre-existing server, hook, and key is still present and equal after a merge; an existing `haunted-chronicle` entry is never replaced; invalid JSON and wrong shapes return an error and no text
    - **Validates: Requirements 8.1, 16.8**

  - [ ] 15.3 Implement the `init` subcommand
    - Create `src/cli/init.ts` and route `init` in `src/cli/index.ts`: target is the current directory, or `--dir <path>`; flag `--relative` selects the repository-local form
    - Read both existing files first and compute both merges; if either file holds invalid JSON, write nothing, print which file is invalid and why, and exit with status 1
    - Create `.kiro/hooks` and `.kiro/settings` when missing; write each changed file through a temp file and rename; skip unchanged files; print one line per file saying `created`, `updated`, or `unchanged`; running twice changes nothing
    - _Requirements: 8.1, 16.8_

  - [ ]* 15.4 Write integration tests for `init`
    - Create `tests/cli/init.test.ts` with temp directories: empty project creates both files; existing unrelated hooks and servers survive; second run leaves file bytes and modification times unchanged; invalid JSON in either file leaves both files untouched and exits 1; `--dir` and `--relative` behave as described
    - _Requirements: 8.1, 16.8_

  - [ ] 15.5 Run init on this repository
    - Build with `npm run build:node`, then run `node dist/cli.js init --relative` in the repository root so `.kiro/hooks/haunted-chronicle.json` and `.kiro/settings/mcp.json` hold the real hook and MCP server entries using repository-relative commands (no machine-specific absolute paths)
    - Confirm with `git check-ignore` that neither file is ignored, so they are committed with the repository
    - _Requirements: 8.1, 16.8_

- [ ] 16. Checkpoint - Kiro can ask what is haunting
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Finish gate
  - [ ] 17.1 Implement the finish gate and token-protected endpoint
    - Create `src/core/finished.ts` and `applyFinishDeclaration`; clear `finished` in `deriveWorldState` when a task is unticked, a Citizen turns Sick, or a secret appears
    - Create `src/server/token.ts` (128-bit random token per start); inject it into `index.html` as `<meta name="haunted-token">`; add `POST /api/finish` (403 for bad token or Origin, 409 when the gate fails) and `GET /api/finish-status`; never put the token in `server.json`, `/api/state`, `/api/events`, or ping
    - _Requirements: 13.1, 13.2, 13.4, 13.5, 13.6_

  - [ ] 17.2 Add the "It is finished" button and lit village
    - In `src/web/ui`: button enabled only when all tasks ticked, none Sick, no secrets, and Phase is cursed; sends the token; on `finished` show the text "It is finished", light all Districts, remove dark and sick styling, and show the Chronicler's final entry
    - _Requirements: 13.1, 13.2, 13.3, 13.7_

  - [ ] 17.3 Finish `declare_finished` in the MCP server
    - In `src/mcp/tools.ts`: read `GET /api/finish-status`, never set the flag, return the refusal message or the "already declared by the user" message
    - _Requirements: 13.4, 16.6_

  - [ ]* 17.4 Write property test for the finished gate
    - Create `tests/server/p13-finished-gate.test.ts`
    - **Property 13: Finished gate**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 16.6**

- [ ] 18. Recording and hosted demo
  - [ ] 18.1 Implement the Recording codec
    - Create `src/core/recording.ts`: `Recording` with frames `{ atMs, snapshot, signal? }`, `printRecording`, `parseRecording` rejecting decreasing `atMs` and naming the field
    - _Requirements: 19.8_

  - [ ] 18.2 Implement the `record` command
    - Create `src/cli/record.ts`: connect to the live server (`GET /api/state`, SSE), write `atMs` as time since recording start, save to `--out`
    - _Requirements: 19.9_

  - [ ] 18.3 Build the demo player and static build
    - Create `src/demo/recordingPlayer.ts` (feeds frames to `deriveWorldState` and `applyPromptSignal` with `ctx.nowMs = frame.atMs`) and `src/demo/main.tsx` reusing `src/web` components; play, pause, restart controls; starts at the cozy start; no network calls beyond its own assets
    - _Requirements: 19.1, 19.3, 19.4, 19.5, 19.6_

  - [ ] 18.4 Create the shipped recording
    - Do not hand-write a session. Create `src/demo/recording.json` as a tiny placeholder: at most 3 frames, valid for the Recording schema (non-decreasing `atMs`), with a `projectName` of `PLACEHOLDER - record a real session` and one or two obviously fake paths such as `PLACEHOLDER.md`
    - Add a short comment-style notice in `src/demo/README.md` that this file is a placeholder and that the real recording is made with `haunted-chronicle record --out src/demo/recording.json` during a real session (see the Notes section)
    - The demo shows this placeholder until it is replaced. This task does not satisfy requirement 19.2, which stays open until a real recording is committed
    - _Requirements: 19.3, 19.6, 19.8_

  - [ ]* 18.5 Write property test for Recording round trip
    - Create `tests/core/p16-recording-roundtrip.test.ts`
    - **Property 16: Recording round trip**
    - **Validates: Requirements 19.8**

  - [ ]* 18.6 Write tests for the demo
    - Create `tests/demo/recording.test.ts`: the shipped recording parses; the demo build output has no server code or network calls
    - Add a conditional block that is skipped while the recording is the placeholder (detected by the `PLACEHOLDER` project name) and, once a real recording replaces it, checks the full arc of requirement 19.2: first prompt, test failure, sickness spread, healing, a Gravestone that appears then disappears, last Task ticked, and "It is finished"
    - _Requirements: 19.1, 19.2, 19.6_

- [ ] 19. Deploy the demo to GitHub Pages
  - [ ] 19.1 Make the demo base-path aware
    - Create `src/web/assets.ts` with a pure `assetUrl(path, base)` that joins a base such as `/haunted-chronicle/` and a relative path without double slashes; use it for `models/kit.glb` in the kit loader (task 9.10) and for the recording JSON in `src/demo/main.tsx`, with `base` taken from `import.meta.env.BASE_URL`
    - In `vite.config.demo.ts` read the base from `DEMO_BASE`, defaulting to `/haunted-chronicle/` (the repository is `Oreva-Dev9112/haunted-chronicle`); the live web build keeps base `/`
    - _Requirements: 19.1, 6.1_

  - [ ]* 19.2 Write unit tests for `assetUrl`
    - Create `tests/web/assets.test.ts`: base with and without trailing slash, path with and without leading slash, root base `/`
    - _Requirements: 19.1_

  - [ ] 19.3 Add the base-path check script
    - Create `scripts/check-demo-base.mjs`: scan `dist/demo` HTML, JS, and CSS for root-relative URLs that do not start with the base (for example `/models/`, `/assets/`, `/recording`), confirm `dist/demo/models/kit.glb` and the recording JSON exist, and exit non-zero with the offending file and URL
    - Add the npm script `check:demo` and add an empty `.nojekyll` file to the demo output through `public` or the build step
    - _Requirements: 19.1_

  - [ ]* 19.4 Write a test for the check script
    - Create `tests/demo/base-path.test.ts`: a fixture directory with a bad `/models/kit.glb` reference fails the script; a fixture with `/haunted-chronicle/models/kit.glb` passes
    - _Requirements: 19.1_

  - [ ] 19.5 Add the GitHub Actions workflow
    - Create `.github/workflows/deploy-demo.yml`: triggers on push to `main` and `workflow_dispatch`; top-level `permissions` of `contents: read`, `pages: write`, `id-token: write`; `concurrency` group `pages`
    - Build job: `actions/checkout`, `actions/setup-node` (Node 20, npm cache), `npm ci`, `npm test`, `npm run build:demo` with `DEMO_BASE=/haunted-chronicle/`, `npm run check:demo`, `actions/configure-pages`, `actions/upload-pages-artifact` with path `dist/demo`
    - Deploy job: needs the build job, environment `github-pages` with the page URL output, step `actions/deploy-pages`
    - _Requirements: 19.1_

- [ ] 20. Director mode
  - [ ] 20.1 Implement Director_Mode
    - Create `src/web/scene/camera/DirectorMode.tsx`: toggle, shots in order (wide, castle, sick houses, freed district, finale), letterbox bars, hide zoom buttons and Cozy/Cursed toggle, Escape restores the previous camera, render in the current `View_Mode`; use cuts when reduced motion is on
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

  - [ ]* 20.2 Write component tests for Director_Mode
    - Create `tests/web/director.test.tsx`: shot order, Escape restores camera, controls hidden
    - _Requirements: 17.2, 17.4, 17.5_

- [ ] 21. Reduced motion
  - [ ] 21.1 Implement the Reduced_Motion setting
    - Extend `src/web/state/reducedMotion.ts` (created in task 9.7) and add a settings control: keep the `prefers-reduced-motion` default, persist in local storage, replace JINX flash and Reveal with a fade, heal with a colour transition, Director shots with cuts, no flashing more than 3 times per second
    - _Requirements: 8.8, 8.13, 12.7, 17.6, 18.1, 18.2, 18.3, 18.4_

  - [ ]* 21.2 Write component tests for Reduced_Motion
    - Create `tests/web/reduced-motion.test.tsx`: no flash class or keyframe, persistence, first-load default
    - _Requirements: 8.13, 18.2, 18.4_

- [ ] 22. Intro buttons and intro line
  - [ ] 22.1 Add Skip intro, Replay intro, and the intro line
    - In `src/web/ui/IntroOverlay.tsx`: "Skip intro" while cozy ends the intro and removes the overlay, "Replay intro" appears afterward and restarts it, show the line "For people building with AI agents who lose track of what the agent broke, what's unfinished and what's risky."; show all in the Demo too
    - _Requirements: 7.5, 7.6, 7.7, 7.8, 7.9, 19.7_

  - [ ]* 22.2 Write component tests for the intro
    - Create `tests/web/intro.test.tsx`: skip, replay, intro line text in live app and demo
    - _Requirements: 7.6, 7.8, 7.9, 19.7_

- [ ] 23. End-to-end test on a fresh project
  - [ ] 23.1 Create the e2e harness
    - Create `tests/e2e/harness.ts`: temp project with a small Vitest suite, a `.kiro/specs/demo/tasks.md`, built CLI start, helpers to read `/api/state`, edit files, and call the MCP client; the e2e tests use their own fixture project and never read the shipped demo recording
    - _Requirements: 1.1, 22.1_

  - [ ] 23.2 Write the main-loop end-to-end test
    - Create `tests/e2e/main-loop.test.ts` covering in order: happy village in cozy Phase with real state hidden from Cozy view; first prompt via the hook triggers JINX; a source edit breaks a test and sickness spreads to importers; `whats_haunting` returns the real file and line; the fix heals Citizens and frees the District; the last task is ticked; user declaration via token sets `It is finished`; all Districts lit
    - _Requirements: 8.4, 10.8, 12.1, 12.3, 13.2, 13.3, 16.3, 22.2_

  - [ ]* 23.3 Write the packaging smoke test
    - Create `tests/e2e/packaging.test.ts`: `npm pack --dry-run` lists `dist/cli.js`, `dist/web/index.html`, `dist/web/models/kit.glb`; install the tarball in a temp dir and run `haunted-chronicle --help`
    - _Requirements: 1.1, 6.1_

- [ ] 24. Steering files
  - [ ] 24.1 Create the product steering file
    - Create `.kiro/steering/product.md`: what Haunted Chronicle is, who it is for (the intro line of requirement 7.9), the cozy to cursed story, the rule that only the user declares the project finished, and the rule that the world never lies; describe only behaviour that exists in the code at this point
    - _Requirements: 1.1_

  - [ ] 24.2 Create the tech steering file
    - Create `.kiro/steering/tech.md`: TypeScript, one npm package with one bin, pure `src/core` with injected clock, Vitest and fast-check, React Three Fiber for the Village, MCP SDK, chokidar, and the build and test commands from `package.json`
    - _Requirements: 1.1_

  - [ ] 24.3 Create the structure steering file
    - Create `.kiro/steering/structure.md`: the real directory layout (`src/core`, `src/server`, `src/mcp`, `src/cli`, `src/web`, `src/demo`, `tests`), which modules may import which, the core purity rule, and the test file naming for property tests
    - _Requirements: 1.1_

- [ ] 25. README
  - [ ] 25.1 Write the README usage sections
    - Read the existing `README.md`, keep its licence and credits links (`LICENSE`, `CREDITS.md`), and rewrite it with: what Haunted Chronicle is; the line "For people building with AI agents who lose track of what the agent broke, what's unfinished and what's risky."; how to run it (`npx github:Oreva-Dev9112/haunted-chronicle`, `npm link`, `init`, `start`, `mcp`, `hook`, `record`); how to see the demo
    - State the demo status truthfully: link the GitHub Pages address `https://oreva-dev9112.github.io/haunted-chronicle/` and say it plays a placeholder recording unless `src/demo/recording.json` is a real recording; include a short "Recording the demo" section with `haunted-chronicle record --out src/demo/recording.json`
    - Mention only commands, files, and features that exist in the repository
    - _Requirements: 1.1, 1.5, 16.8, 19.9_

  - [ ] 25.2 Write the "How I used Kiro" section
    - Add to `README.md`: the spec in `.kiro/specs/haunted-chronicle` (requirements, design, tasks), the steering files in `.kiro/steering`, the prompt hook in `.kiro/hooks/haunted-chronicle.json` created by `init`, and the MCP server in `.kiro/settings/mcp.json` with its `whats_haunting`, `world_status`, and `declare_finished` tools; each claim names the file that backs it
    - _Requirements: 8.1, 16.1_

  - [ ]* 25.3 Write a test that README claims point at real files
    - Create `tests/readme.test.ts`: every repository path in backticks in `README.md` exists, every subcommand listed is registered in `src/cli/index.ts`, and the section names the steering, hook, and MCP files only if they exist
    - _Requirements: 1.1_

- [ ] 26. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional tests and can be skipped for a faster MVP; implementation tasks are required
- Each task references granular requirement numbers; each property test names its design property number
- Core stays pure: time is injected through `EngineCtx.nowMs`, and `tests/core-purity.test.ts` enforces it
- The MCP_Server and hook are thin HTTP clients of the single village server
- This plan covers design and planning only; start work by opening this file and choosing "Start task" on a task
- Look and feel (task 9): pure mapper, view model, scenery, and quality controller are tested in Node; the scene is checked by builder smoke tests and by a person comparing the running Village with `tests/visual/CHECKLIST.md`
- Requirement 19.2 stays open. Task 18.4 ships only a placeholder recording. The user will later record a real session by running the village, working with Kiro through the whole story, and running `haunted-chronicle record --out src/demo/recording.json`, then committing the file; the conditional test in task 18.6 then checks the full arc. This is a follow-up for the user, not an executable task
- One-time GitHub setting for task 19: in the repository settings, set Pages source to "GitHub Actions"; this is not done by code
- Task 15.5 uses `--relative` so the committed hook and MCP entries contain no machine-specific paths

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "3.5"] },
    { "id": 5, "tasks": ["3.6"] },
    { "id": 6, "tasks": ["3.7", "3.8", "3.9"] },
    { "id": 7, "tasks": ["4"] },
    { "id": 8, "tasks": ["5.1"] },
    { "id": 9, "tasks": ["5.2", "5.3", "5.4", "5.7"] },
    { "id": 10, "tasks": ["5.5"] },
    { "id": 11, "tasks": ["5.6", "5.8", "5.9", "5.10", "5.11", "5.12", "5.13", "5.14"] },
    { "id": 12, "tasks": ["5.15"] },
    { "id": 13, "tasks": ["6"] },
    { "id": 14, "tasks": ["7.1"] },
    { "id": 15, "tasks": ["7.2"] },
    { "id": 16, "tasks": ["7.3"] },
    { "id": 17, "tasks": ["7.4"] },
    { "id": 18, "tasks": ["7.5"] },
    { "id": 19, "tasks": ["7.6", "7.7", "7.8", "7.9"] },
    { "id": 20, "tasks": ["7.10"] },
    { "id": 21, "tasks": ["8"] },
    { "id": 22, "tasks": ["9.1", "9.5", "9.7", "9.8"] },
    { "id": 23, "tasks": ["9.2", "9.3", "9.6", "9.9"] },
    { "id": 24, "tasks": ["9.4", "9.10", "9.13", "9.14", "9.15", "9.16", "9.17", "9.18"] },
    { "id": 25, "tasks": ["9.11", "9.12"] },
    { "id": 26, "tasks": ["9.19"] },
    { "id": 27, "tasks": ["9.20", "9.21"] },
    { "id": 28, "tasks": ["10.1"] },
    { "id": 29, "tasks": ["10.2"] },
    { "id": 30, "tasks": ["10.3"] },
    { "id": 31, "tasks": ["11.1"] },
    { "id": 32, "tasks": ["11.2", "11.4"] },
    { "id": 33, "tasks": ["11.3", "11.5"] },
    { "id": 34, "tasks": ["12.1"] },
    { "id": 35, "tasks": ["12.2", "12.5"] },
    { "id": 36, "tasks": ["12.3", "12.6", "12.7", "12.8"] },
    { "id": 37, "tasks": ["12.4"] },
    { "id": 38, "tasks": ["13"] },
    { "id": 39, "tasks": ["14.1"] },
    { "id": 40, "tasks": ["14.2", "14.6"] },
    { "id": 41, "tasks": ["14.3", "14.7"] },
    { "id": 42, "tasks": ["14.4", "14.5"] },
    { "id": 43, "tasks": ["14.8"] },
    { "id": 44, "tasks": ["15.1"] },
    { "id": 45, "tasks": ["15.2", "15.3"] },
    { "id": 46, "tasks": ["15.4", "15.5"] },
    { "id": 47, "tasks": ["16"] },
    { "id": 48, "tasks": ["17.1"] },
    { "id": 49, "tasks": ["17.2", "17.3"] },
    { "id": 50, "tasks": ["17.4"] },
    { "id": 51, "tasks": ["18.1"] },
    { "id": 52, "tasks": ["18.2", "18.3", "18.5"] },
    { "id": 53, "tasks": ["18.4", "18.6"] },
    { "id": 54, "tasks": ["19.1"] },
    { "id": 55, "tasks": ["19.2", "19.3"] },
    { "id": 56, "tasks": ["19.4", "19.5"] },
    { "id": 57, "tasks": ["20.1"] },
    { "id": 58, "tasks": ["20.2", "21.1"] },
    { "id": 59, "tasks": ["21.2", "22.1"] },
    { "id": 60, "tasks": ["22.2"] },
    { "id": 61, "tasks": ["23.1"] },
    { "id": 62, "tasks": ["23.2", "23.3"] },
    { "id": 63, "tasks": ["24.1", "24.2", "24.3"] },
    { "id": 64, "tasks": ["25.1"] },
    { "id": 65, "tasks": ["25.2"] },
    { "id": 66, "tasks": ["25.3"] },
    { "id": 67, "tasks": ["26"] }
  ]
}
```
