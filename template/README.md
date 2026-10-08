# @ama-work/{{PLUGIN_ID}}

Starter scaffold for Orchestrator plugins. Bun/TS project with Hono, Zod, CI, and semantic-release — ready for plugin-specific wiring.

## Quick Start

```bash
bun install
bun run dev
```

## Commands

| Command | Description |
|---|---|
| `bun run dev` | Start with hot-reload |
| `bun run build` | Compile to `dist/` |
| `bun run lint` | Typecheck + knip + eslint |
| `bun test` | Run tests |
| `bun run release` | Publish via semantic-release |

## Publishing

```bash
# Publish to public npm registry
npm publish --registry https://registry.npmjs.org

# Publish to private Verdaccio registry
npm publish --registry http://verdaccio.homelab
```

## Plugin Entrypoint

The orchestrator plugin host loads this package via the `module` field in `package.json` (falling back to `main`), both pointing at `dist/index.js`. This file is produced by `bun run build` (TypeScript compilation).

### Named-export rule

The loader contract (mirrors `resolvePlugin` in `ama-agent-orchestrator`):

- The entrypoint **must export a named `plugin`** object implementing `OrchestratorPlugin` (`id`, `onStart`, `onStop`).
- The default re-export (`export default plugin`) is **optional** — a module namespace exposing only `default` is rejected by the runtime loader (`'id' in mod` is always false on a module namespace).
- `tests/contract.test.ts` asserts this shape against the module and fails loudly if the contract drifts.

**Do not change the `main`/`module` fields** unless the orchestrator host contract is updated.

### Console panel (when scaffolded with `--console-panel`)

Panel assets are embedded as TypeScript strings (`src/panels/template.ts`, `src/panels/mixin.ts`) and served by a Hono router mounted in `onStart` via `bridge.mountRoutes(...)`. The orchestrator mounts plugin routes under `/plugins/@ama-work/{{PLUGIN_ID}}/`, so `templateUrl` and `mixinUrl` use absolute paths under that prefix (e.g. `/plugins/@ama-work/{{PLUGIN_ID}}/template.html`).

## Project Structure

```
src/
├── index.ts          # Plugin entry point (named `plugin` export)
├── config/env.ts     # Zod-validated env config
├── lib/validation/   # Shared Zod schemas
├── routes/           # HTTP route handlers
├── services/         # Business logic
└── repositories/     # Data access layer
tests/
├── plugin.test.ts      # Plugin behavior tests
└── contract.test.ts    # Orchestrator export-contract smoke test
```

## CI/CD

- **CI**: GitHub Actions runs lint, typecheck, and tests on push/PR to `main`.
- **Release**: semantic-release on `main` push. Publishes to npmjs.org with public scoped access.
