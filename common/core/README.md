# @slamint/core

Core building blocks for SLAMINT NestJS services: configuration, logging, request context, standardized API envelopes, auditing, and microservice client registry.

---

## What this library provides

- **ConfigModule (Zod‑validated):** Loads `.env` (auto‑detects from project root upward), validates with Zod, exposes typed `ConfigService` keys.
- **Logger & Request Context:** Pino logger + `AsyncLocalStorage` context with `requestId`, `traceId`, `spanId`, `userId`; `RequestIdMiddleware` sets `x-request-id` and parses W3C `traceparent`.
- **HTTP Interceptors:**

  - `ResponseInterceptor` → wraps responses into `{ success: true, data }`.
  - `LoggingInterceptor` → structured HTTP request/response logs.
  - `AuditInspector` → writes API audit records (path, method, status, user, ip) via `AuditService`.

- **Exception Filter:** `AllExceptionFilter` → normalized error envelope with `success: false`.
- **DTOs & Swagger helpers:** Success & Error envelopes and `ApiOkResponseEnvelope`, `ApiErrorEnvelope` decorators.
- **Microservice Registry:** `MicroserviceClientsModule` to inject TCP clients (e.g., `USERS`).

> Private by convention: pair `ResponseInterceptor` + `AllExceptionFilter` to keep a consistent API surface.

---

## Install & Import

```ts
// app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  ConfigCoreModule, // alias shown below
  LoggerModule,
  RequestIdMiddleware,
  ResponseInterceptor,
  LoggingInterceptor,
  AuditInspector,
  AllExceptionFilter,
  AuditLog,
  MicroserviceClientsModule,
} from '@slamint/core';

@Module({
  imports: [
    ConfigCoreModule, // global ConfigModule with Zod validation
    LoggerModule, // pino + request context hooks
    TypeOrmModule.forRoot(/* ... */),
    TypeOrmModule.forFeature([AuditLog]),
    MicroserviceClientsModule, // TCP Clients (e.g., USERS)
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInspector },
    { provide: APP_FILTER, useClass: AllExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
```

### Module alias

`config/config.module.ts` exports `NestConfigModule` and a dynamic module. In this README we refer to it as `ConfigCoreModule`:

```ts
// somewhere in @slamint/core index export, you can import as
import { NestConfigModule as ConfigCoreModule } from '@slamint/core';
```

---

## Environment keys

Defined in `ConfigKey` and validated by `config.schema.ts`:

**Runtime**

- `NODE_ENV` → `development` | `test` | `production` (default `development`)

**Database**

- `DB_HOST`, `DB_PORT` (default `5432`), `DB_USER`, `DB_PASS`, `DB_NAME`

**Keycloak / OIDC**

- `KEYCLOAK_REALM`, `KEYCLOAK_AUTH_SERVER_URL`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`
- `OIDC_ISSUER`, `OIDC_CLIENT` (used by `@slamint/auth`)

**Microservices**

- `USER_MS_HOST`, `USER_MS_PORT` (default `8082`)

> `ConfigModule` auto‑discovers `.env` by walking up from `process.cwd()`; values are merged and Zod‑validated before being loaded.

---

## Standardized API envelopes

### Success

Automatically applied by `ResponseInterceptor`:

```json
{
  "success": true,
  "data": {
    /* your handler return value */
  }
}
```

### Error

Emitted by `AllExceptionFilter`:

```json
{
  "success": false,
  "error": {
    "message": "string",
    "details": {
      "message": "string",
      "error": "BadRequestException",
      "statusCode": 400
    }
  },
  "path": "/api/path",
  "timestamp": "2025-09-16T02:59:58.669Z"
}
```

Use Swagger helpers to document envelopes:

```ts
import { ApiOkResponseEnvelope, ApiErrorEnvelope } from '@slamint/core';

@ApiOkResponseEnvelope(UserDto)
@ApiErrorEnvelope(400, 'BadRequestException')
@Get('users')
findAll() { /* ... */ }
```

---

## Logging & Request context

- `LoggerModule` exports `LOGGER` (Pino instance) and `HTTP_LOGGER` (pino‑http). Logs are enriched with `requestId`, `traceId`, `spanId`, `userId` when available.
- `RequestIdMiddleware`:

  - reads `x-request-id` or generates one; writes it back to the response
  - parses W3C `traceparent` header for distributed tracing
  - stores context in `AsyncLocalStorage` for access inside logger hooks

Minimal usage inside a provider:

```ts
import { Inject } from '@nestjs/common';
import { LOGGER } from '@slamint/core';

@Injectable()
export class SomethingService {
  constructor(@Inject(LOGGER) private readonly logger: LoggerLike) {}
  doWork() {
    this.logger.info({ msg: 'work started' });
  }
}
```

---

## Auditing

Entities & services:

- `AuditLog` (TypeORM entity): `id`, `createdAt`, `userId`, `roles`, `method`, `path`, `status`, `ip`, `meta`.
- `AuditService`: `write(partial)`, `findAll()`.
- `AuditInspector` interceptor: taps the request/response to persist an `AuditLog` row.

Enable with TypeORM and the interceptor (see AppModule snippet above). Optional controller:

```ts
// Exposes GET /admin/audit/v1/logs
export class AuditController {
  /* already included */
}
```

---

## Microservice clients

Pre‑registered TCP client(s) via `MicroserviceClientsModule`:

```ts
import { MICRO_SERVICES } from '@slamint/core';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UsersGateway {
  constructor(@Inject(MICRO_SERVICES.USERS) private client: ClientProxy) {}
  list() {
    return this.client.send({ cmd: 'users:list' }, {});
  }
}
```

`USER_MS_HOST` and `USER_MS_PORT` are read from config.

> Commands exported at `@slamint/core/gateway-commands`: `UserCommands.GET_LIST`, `UserCommands.GET_ME`.

---

## Minimal controller example

```ts
@Controller('v1')
export class V1Controller {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
```

With the global pieces wired, this returns the success envelope and all errors are normalized.

---

## File map

- `config/` → Zod schema + dynamic `ConfigModule` (`NestConfigModule` export), `ConfigKey` enum
- `logging/` → `LoggerModule`, `RequestIdMiddleware`, request context helpers
- `interceptors/` → `ResponseInterceptor`, `LoggingInterceptor`, `AuditInspector`
- `filters/` → `AllExceptionFilter`
- `domain/audit/` → `AuditLog` entity, `AuditService`, `AuditController`
- `helpers/` → Swagger helpers
- `dtos/` → success/error envelopes
- `registries/` → `MicroserviceClientsModule`, `MICRO_SERVICES`
- `gateway-commands/` → `UserCommands`
- `index.ts` → re‑exports for ergonomics

---

## FAQ

**Do I have to use all pieces?**
No. You can import only what you need (e.g., just `LoggerModule` and `ResponseInterceptor`).

**Where should I register interceptors/filters?**
Prefer global (via `APP_INTERCEPTOR`/`APP_FILTER`) to keep behavior consistent. Per‑controller is fine for special cases.

**Can I log custom fields?**
Yes—inject `LOGGER` and include any extra fields. The logger already appends request context when present.

**Does auditing require Postgres?**
`AuditLog` is a TypeORM entity; use any TypeORM‑supported DB. Ensure the entity is included in `forFeature`.

---

## License

Internal — SLAMINT project.
