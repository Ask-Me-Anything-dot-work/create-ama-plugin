# ama-plugin-stub

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

## Project Structure

```
src/
├── index.ts          # Hono app entry point
├── config/env.ts     # Zod-validated env config
├── lib/validation/   # Shared Zod schemas
├── routes/           # HTTP route handlers
├── services/         # Business logic
└── repositories/     # Data access layer
tests/
├── health.test.ts
└── validation.test.ts
```

## CI/CD

- **CI**: GitHub Actions runs lint, typecheck, and tests on push/PR to `main`.
- **Release**: semantic-release on `main` push. Publishes to Verdaccio.
