# Tech Stack

> Note: This file is based on the spec (`.kiro/specs/haunted-chronicle/requirements.md` and `design.md`), not only on the code written so far. It will be refreshed at the end of the project.

## Stack

- **Language:** TypeScript, ESM (`"type": "module"`), Node >= 20.
- **Packaging:** one npm package, `haunted-chronicle`, with one bin (`haunted-chronicle` -> `dist/cli.js`). Subcommands: `start`, `mcp`, `hook`, `record`, `config`, `init` (planned).
- **Core:** `src/core` is pure and isomorphic. No `node:*`, DOM, react, three, or R3F imports. No `Date.now`, `new Date(`, `performance.now`, `Math.random`, or `process.`. Time comes from an injected clock (`ctx.nowMs`). Imported via the `@core/*` alias.
- **Village (browser):** React 19 and React Three Fiber with drei and three. Models load from `/models/kit.glb`. Built with Vite.
- **Scanner:** chokidar for watching, `ignore` for `.gitignore`, es-module-lexer for imports.
- **MCP:** `@modelcontextprotocol/sdk` over stdio. Log to stderr only. The MCP server is a thin HTTP client of the village server.
- **Build:** tsup for the Node entries, Vite for the web app and the hosted demo.
- **Tests:** Vitest and fast-check. Property tests run at least 100 iterations and carry a `// Feature: haunted-chronicle, Property {n}: ...` comment. Core tests run in `node`, `src/web` component tests use `jsdom`.

## Commands (from `package.json`)

| Command | Purpose |
| --- | --- |
| `npm run build` | Build node, web, and demo |
| `npm run build:node` | tsup build of `src/cli`, `src/server`, `src/mcp` to `dist` |
| `npm run build:web` | Vite build of the Village to `dist/web` |
| `npm run build:demo` | Vite build of the hosted demo to `dist/demo` |
| `npm test` | `vitest --run` (single run, no watch) |
| `npm run lint` | `tsc --noEmit` |
| `npm run prepare` | `build:node` and `build:web` (runs on install from git) |

## Conventions

- Runtime `dependencies` hold only what `dist` needs. React, R3F, three, and Vite are devDependencies.
- The server binds to `127.0.0.1` only and needs no remote network access.
- `src/server`, `src/mcp`, `src/cli`, `src/web`, and `src/demo` depend on `src/core` and not on one another.
