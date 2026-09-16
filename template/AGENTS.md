# AGENTS.md

## 1. Purpose
This file defines the interaction protocol for both AI agents and human contributors to this repository. It is foundational and is always loaded into agent sessions to ensure a consistent set of expectations and workflows.

This is a plugin scaffold for the Orchestrator. It provides a baseline Bun/TS project with CI, release tooling, and architectural conventions — ready for interactive CLI layering (sub-issue 2) and bridge wiring (sub-issue 3).

## 2. Tech Stack
- **Bun**: Runtime, package manager, and test runner.
- **TypeScript**: Typed JavaScript in strict mode (`moduleResolution: bundler`).
- **Hono**: Ultrafast web framework for the Edges, used for HTTP routing.
- **Zod**: TypeScript-first schema validation with static type inference.
- **Linting**: `tsc --noEmit` for type checking and `knip` for identifying unused files, dependencies, and exports.
- **Testing**: `bun test` for unit and integration tests.
- **CI**: GitHub Actions (lint, typecheck, test on push/PR).
- **Release**: semantic-release with conventional commits.
- **Hooks**: Husky (commit-msg → commitlint, pre-commit → lint+test).

## 3. Project Structure
The repository follows a clean, predictable layout:
- `src/index.ts`: Entry point, Hono app definition, and `/health` route.
- `src/routes/`: Architectural layer for HTTP route definitions.
- `src/services/`: Architectural layer for business logic.
- `src/repositories/`: Architectural layer for data access.
- `src/lib/validation/`: Shared Zod schemas used for request/response validation.
- `src/config/env.ts`: Zod-validated environment configuration.
- `tests/`: Project tests using `bun:test`.

## 4. Standard Workflows
### Canonical Commands
- **Setup**: `bun install`
- **Development**: `bun run dev` (runs with hot-reload)
- **Linting**: `bun run lint` (runs `tsc --noEmit`, `knip`, and `eslint`)
- **Testing**: `bun test`
- **Build**: `bun run build` (produces `dist/`)

### Agentic Implementation Expectations
When performing implementation or bugfix work, agents MUST:
1. Always run `bun run lint` before `bun test`.
2. Fix all lint and test failures before opening a Pull Request.
3. If failures cannot be fixed within the session, post the complete failure output as a comment on the corresponding issue and stop — DO NOT open a PR.

## 5. MCP Usage
This project is designed to be used with global Model Context Protocol (MCP) servers.
- **Context7**: Use for broader codebase search, documentation retrieval, or understanding external libraries.
- **GitHub**: Use for managing issues, comments, pull requests, and repository metadata.

*Note: This repository does not bundle its own MCP servers; it serves as a backend designed to be interacted with by an orchestrator or gateway that exposes these tools.*

## 6. Coding Conventions
- **Modular Design**: Prefer small, focused modules over monolithic scripts.
- **Type Inference**: Always export types derived from Zod schemas using `z.infer<typeof schema>`.
- **Side Effects**: Avoid side effects at import time; prefer explicit initialization or `main()` functions.
- **Invariants**:
  - The `/health` route should always be present and return a `200 OK`.
  - Use Zod schemas to validate all external inputs (env vars, request bodies, query params).

## 7. When Changing Protocols
- If a change affects public behavior (e.g., modifying routes, environment variable contracts, or response shapes), you MUST update `AGENTS.md` in the same Pull Request to reflect these changes.
- Always add or adjust tests that correspond to the documented behavior changes.
