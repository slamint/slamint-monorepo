# SLAMINT Monorepo

Nx‑powered workspace for building NestJS microservices and shared libraries (@slamint/\*).

---

## Overview

- **APIs**: `api/api-gateway` (HTTP gateway), `api/users` (users microservice)
- **Libraries**: `common/core` (config, logging, auditing, envelopes, MS clients), `common/auth` (JWT/OIDC auth & decorators)
- **Tooling**: Nx 21, pnpm workspace, TypeScript 5.9, Webpack for Nest apps

> Minimal, “private‑by‑default” auth/guards and standardized API envelopes are provided by the shared libs.

---

## Prerequisites

- **Node.js**: 20.x (LTS)
- **pnpm**: 9+
- **PostgreSQL** (for audit logs, optional until you enable the entity)
- **Keycloak / OIDC issuer** (for `@slamint/auth` when you run the gateway)

Install workspace deps:

```bash
pnpm install
```

---

## Quick start (dev)

Run all apps in development mode (watch):

```bash
pnpm run start:dev
```

This runs Nx `serve` for all projects with development configuration, streaming logs.

Run a single app:

```bash
pnpm nx serve @slamint/api-gateway --configuration=development
# or
pnpm nx serve @slamint/users --configuration=development
```

---

## Build

Build all projects:

```bash
pnpm run build
```

Build a single project:

```bash
pnpm nx build @slamint/api-gateway
pnpm nx build @slamint/core
pnpm nx build @slamint/auth
```

Visualize dependency graph:

```bash
pnpm nx graph
```

---

## Environment configuration

Create a workspace‑level `.env` (auto‑loaded by libs) and per‑app env files as needed.
Typical keys:

```bash
# Runtime
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=sla_mint
DB_PASS=P@ssword1
DB_NAME=sla_mint

# OIDC / Keycloak (for @slamint/auth)
OIDC_ISSUER=http://localhost:8080/realms/slamint
OIDC_CLIENT=slamint-api

# Microservices
USER_MS_HOST=127.0.0.1
USER_MS_PORT=8082
```

> `@slamint/core` validates env with Zod; `@slamint/auth` discovers JWKS from `OIDC_ISSUER`.

---

## Folder structure (high‑level)

```
api/
  api-gateway/        # Nest app (HTTP + Swagger)
  users/              # Nest microservice (TCP)
common/
  core/               # Config, logging, interceptors, filters, audit, MS registry
  auth/               # OIDC/JWT auth module + guards + decorators
scripts & root files
  generate.sh         # Nx generators wrapper for libs/apps
  nx.json             # Nx workspace config (plugins, generators, defaults)
  pnpm-workspace.yaml # pnpm packages scope
  package.json        # scripts (start:dev, build)
```

For a detailed tree, see `tree.md` in the repo.

---

## How to generate new projects

Use the helper script to scaffold with consistent options.

Generate a library under `common/`:

```bash
./generate.sh lib <project-name>
```

Generate an API under `api/`:

```bash
./generate.sh api <project-name>
```

After generation:

```bash
pnpm nx build @slamint/<project-name>
```

---

## Running the gateway

The gateway consumes `@slamint/core` and `@slamint/auth`.

1. Ensure OIDC issuer is reachable and env vars are set (`OIDC_ISSUER`, `OIDC_CLIENT`).
2. Start the service:

```bash
pnpm nx serve @slamint/api-gateway --configuration=development
```

3. Visit Swagger UI at the printed URL (served from the build outputs).

---

## Development tips

- Use **private‑by‑default** controllers and opt‑in public endpoints with `@Public()` from `@slamint/auth`.
- Keep global interceptors/filters in the app module for consistent envelopes and logs.
- For MS calls (TCP), inject clients from `MicroserviceClientsModule` in `@slamint/core`.
- `pnpm nx show projects --json` to list projects; `nx graph` to explore dependencies.

---

## Packaging libraries locally (optional)

A Verdaccio target exists for local NPM registry testing.

```bash
pnpm nx local-registry
# then configure npm/pnpm to use http://localhost:4873 for publish/install tests
```

---

## Docker & orchestration

A `docker-compose.yml` exists at the root for future service composition (DB, Keycloak, services). Add service blocks incrementally as you containerize apps.

---

## Troubleshooting

- **Port already in use**: stop orphaned processes or change `PORT` env per app.
- **Path aliases**: ensure the app’s `tsconfig.json` extends root `tsconfig.base.json` and that libs export entrypoints.
- **JWT errors**: verify `OIDC_ISSUER` is correct and the issuer’s JWKS is reachable.
- **TypeORM/Audit**: include `AuditLog` entity in `TypeOrmModule.forFeature([AuditLog])` when enabling auditing.

---

## Scripts (reference)

- `pnpm run start:dev` — serve all apps (dev/watch)
- `pnpm run build` — build all projects
- `./generate.sh lib <name>` — scaffold a new library under `common/`
- `./generate.sh api <name>` — scaffold a Nest application under `api/`

---

## License

Internal — SLAMINT project.
