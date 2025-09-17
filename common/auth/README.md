# @slamint/auth

Opinionated NestJS authentication/authorization library for the SLAMINT monorepo. It wires up **JWT (Passport)** using **OIDC discovery** (e.g., Keycloak) and provides simple decorators for public routes, authenticated routes, and role‑based access — all enforced by a single global guard.

---

## What this library does

- **Discovers OIDC config** (issuer, JWKS URI, algorithms) at runtime via `OidcConfigProvider`.
- Registers **Passport JWT** with a custom `JwtStrategy` that:

  - extracts a bearer token,
  - validates signature against JWKS,
  - (optionally) enforces audience,
  - normalizes the user payload into `{ sub, email, username, roles }`.

- Installs a **global `JwtAuthGuard`** (via `APP_GUARD`) that:

  - skips auth for `@Public()` routes,
  - requires a valid JWT for routes marked `@Authenticated()` or any route that is not public,
  - enforces roles when `@Roles('...')` is present (401 on invalid/missing token, 403 on missing roles).

- Exposes lightweight **decorators**: `@Public()`, `@Authenticated()`, and `@Roles(...roles)`.

> Private‑by‑default: Because the guard is global, endpoints are protected unless explicitly marked `@Public()`.

---

## Prerequisites

This library reads configuration via `@slamint/core` → `ConfigService` keys.

**Required**

- `OIDC_ISSUER` — OIDC issuer URL (e.g., `http://localhost:8080/realms/slamint`)

**Optional / Recommended**

- `OIDC_CLIENT` — your API client ID (used to set `audience`)

> JWKS URI and algorithms are discovered from the issuer. If discovery does not provide `jwks_uri`, the provider falls back to `"${OIDC_ISSUER}/protocol/openid-connect/certs"`.

---

## Installation & Setup

1. **Import the module** in your Nest application root module:

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@slamint/auth';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule, // <— registers passport(jwt) and global JwtAuthGuard
  ],
})
export class AppModule {}
```

2. **Environment** (example):

```env
# OIDC / Keycloak
OIDC_ISSUER=http://localhost:8080/realms/slamint
OIDC_CLIENT=slamint-api
```

No further wiring is needed. `AuthModule` internally registers `PassportModule` with `defaultStrategy: 'jwt'`, provides `JwtStrategy`, and installs `JwtAuthGuard` as a global guard.

---

## Decorators

```ts
import { Public, Authenticated, Roles } from '@slamint/auth';
```

### `@Public()`

Marks a route or controller as **public** (no JWT required).

```ts
@Public()
@Get('health')
health() { return { ok: true }; }
```

### `@Authenticated()`

Marks a route or controller as **auth‑required** without role checks.

```ts
@Authenticated()
@Get('me')
me(@Req() req: Request) { return req.user; }
```

### `@Roles(...roles: string[])`

Requires the authenticated user to have **at least one** of the given roles. Roles are taken from Keycloak’s `realm_access.roles` and/or `resource_access[client].roles` and normalized to lowercase.

```ts
@Roles('admin')
@Get('admin/summary')
getAdminSummary() { /* ... */ }

@Roles('manager', 'user')
@Get('reports')
getReports() { /* ... */ }
```

> You can combine `@Authenticated()` and `@Roles(...)`, but it’s not required: `@Roles(...)` already implies authentication.

---

## Request `user` shape

After `JwtStrategy` validates the token, `req.user` is normalized to:

```ts
interface JwtUser {
  sub: string;
  email: string;
  username: string;
  roles: string[]; // lowercase
}
```

Access it in route handlers via `@Req()` or a custom param decorator.

---

## Error semantics

- **401 Unauthorized** — no token, bad token, or signature/issuer/audience invalid.
- **403 Forbidden** — token is valid but does not include any of the required roles.

---

## How roles are extracted

The strategy consolidates roles from both places and lowercases them:

- `realm_access.roles`
- `resource_access[<clientIds>].roles` (if you pass specific client IDs to the helper; otherwise all clients present in the token are considered)

This allows you to manage roles at the realm level or per‑client (API) level in Keycloak.

---

## Minimal usage example

```ts
@Controller('v1')
export class V1Controller {
  @Public()
  @Get('ping')
  ping() {
    return { pong: true };
  }

  @Authenticated()
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }

  @Roles('admin')
  @Get('admin')
  adminOnly() {
    return { secret: '🔒' };
  }
}
```

---

## Notes & Tips

- **Audience (aud)**: If `OIDC_CLIENT` is set, the strategy enforces audience. If unset, audience is not enforced.
- **Microservices**: `JwtAuthGuard` targets HTTP context. For non‑HTTP transports you’ll need protocol‑specific guards/interceptors.
- **Private‑by‑default**: Avoid accidentally exposing routes; add `@Public()` explicitly where intended.

---

## What’s inside (files)

- `auth.module.ts` — wires up Passport JWT, OIDC provider, and global guard.
- `jwt.strategy.ts` — Passport strategy + user normalization.
- `jwt-auth.guard.ts` — global guard that honors `@Public`, `@Authenticated`, and `@Roles`.
- `roles.decorator.ts` — `@Public`, `@Authenticated`, `@Roles` decorators.
- `oidc.provider.ts` — discovers issuer metadata and builds OIDC/JWKS config.
- `keycloak.d.ts` — shared types and role extraction helper.

---

## FAQ

**Is `aud` required?**
No. If you set `OIDC_CLIENT`, the strategy sets/validates audience. If you don’t, audience is not enforced.

**Where do roles in the token come from?**
Keycloak realm roles or client roles assigned to the user. Map them via groups/role mappings as per your Keycloak setup.

**Can I disable the global guard?**
Not in this module’s default export. If you need per‑module control, expose a variant of `AuthModule` without `APP_GUARD` and apply guards locally.

---

## License

Internal — SLAMINT project.
