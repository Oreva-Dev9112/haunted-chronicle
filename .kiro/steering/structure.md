# Structure

> Note: This file is based on the spec (`.kiro/specs/haunted-chronicle/requirements.md`, `design.md`, `tasks.md`), not only on the code written so far. It will be refreshed at the end of the project. Items marked **(planned)** do not exist yet.

## Directory layout

```
src/
  core/      pure, isomorphic logic (no I/O, no clock)
  server/    Node only: scanner, test runner, HTTP API, server.json
  mcp/       MCP stdio server, a thin HTTP client of the village server
  cli/       bin entry and subcommands
  web/       Village browser app (React + R3F)
  demo/      hosted demo, reuses src/web components
tests/       Vitest tests, mirrors the src areas
public/models/kit.glb    model kit served at /models/kit.glb
reference/               look and behaviour references (ideas only, not imported)
```

Build outputs go to `dist/` (`dist/cli.js`, `dist/web`, `dist/demo`). Config files live in the package root.

### Present now

| Path | Status |
| --- | --- |
| `src/core/types.ts`, `src/core/snapshot.ts` | present |
| `src/cli/{index,start,mcp,hook,record,config}.ts` | present (stub handlers) |
| `src/server/start.ts`, `src/mcp/index.ts` | present (stubs) |
| `src/web/{index.html,main.tsx}`, `src/demo/{index.html,main.tsx}` | present (stubs) |
| `tests/smoke.test.ts` | present |
| `package.json`, `tsconfig.json`, `tsup.config.ts`, `vite.config.{web,demo}.ts`, `vitest.config.ts` | present |

### Planned

- `src/core/`: `hash.ts`, `layout.ts`, `sickness.ts`, `tasks.ts`, `secrets.ts`, `world.ts`, `events.ts`, `chronicle.ts`, `problems.ts`, `view.ts`, `recording.ts`, `finished.ts`, `api.ts`, `kit.ts`, `scenery.ts`
- `src/server/`: `scanner/{walk,gitignore,imports,tasks,test-results,watch}.ts`, `test-runner/{scheduler,runner}.ts`, `server-info.ts`, `token.ts`, `http.ts`
- `src/mcp/`: `client.ts`, `tools.ts`, `prompt.ts`
- `src/web/`: `scene/` (VillageScene, Houses, HouseStates, FreedDecor, Scenery, Sky, Bats, ChroniclerOrb, PostFx, Citizen, camera/DirectorMode), `ui/` (StatsCard, ChroniclePanel, Toggles, IntroOverlay), `state/` (useWorldStream, viewMode, reducedMotion, quality)
- `src/demo/`: `recordingPlayer.ts`, `recording.json`
- `tests/`: `core/`, `server/`, `mcp/`, `cli/`, `web/`, `visual/CHECKLIST.md`, `core-purity.test.ts`

## Who may import what

| Area | May import |
| --- | --- |
| `src/core` | `src/core` only (plus type-only or pure packages) |
| `src/server` | `src/core` |
| `src/mcp` | `src/core` |
| `src/cli` | `src/core`; `server/start` and `mcp/index` as entry points only |
| `src/web` | `src/core` via `@core/*` |
| `src/demo` | `src/core` and the shared `src/web` `scene/` and `ui/` components |
| `tests` | anything under test |

`server`, `mcp`, `cli`, `web`, and `demo` do not import one another, except the two exceptions above (CLI entry points, demo reusing web components). Only the village server owns the Scanner and World_State. The MCP server, hook, and `record` talk to it over loopback HTTP. Web scene code reads only the `VillageViewModel` from `cozyView` or `cursedView`, never `WorldState` directly.

## Core purity rule

`src/core` must not:

- import `node:*`, a bare Node builtin (`fs`, `path`, `child_process`, ...), `react`, `three`, or `@react-three/*`
- use `Date.now`, `new Date(`, `performance.now`, `Math.random`, or `process.`

Time comes in as `ctx.nowMs`. Core is deterministic: equal inputs give equal outputs. `tests/core-purity.test.ts` (planned, task 1.2) and an ESLint override on `src/core/**` enforce this.

## Test file naming

- Property tests: `tests/<area>/pNN-<kebab-name>.test.ts`, where `NN` is the design property number, for example `tests/core/p05-sickness.test.ts`, `tests/server/p22-scheduler.test.ts`. One property per file.
- Extended look-and-feel properties and unit tests: `tests/core/look-<name>.test.ts`, `tests/web/<name>.test.ts(x)`.
- Other unit tests: `tests/<area>/<subject>.test.ts`. Component tests use `.test.tsx` and `jsdom`.
- Each property test uses fast-check with at least 100 runs and carries `// Feature: haunted-chronicle, Property {n}: {property text}` and a `**Validates: Requirements ...**` note.
- Areas: `core/` (pure, node env), `server/`, `mcp/`, `cli/`, `web/`.
