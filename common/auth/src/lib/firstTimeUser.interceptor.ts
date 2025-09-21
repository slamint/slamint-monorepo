import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import {
  AccountManagementCommands,
  META_AUTH,
  META_PUBLIC,
  META_ROLES,
  MICRO_SERVICES,
} from '@slamint/core';
import type { Request } from 'express';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { JwtUser } from './keycloak';

interface AuthedRequest extends Request {
  user?: JwtUser & { roles?: string[] };
  __ensuredUser__?: boolean;
}

function extractRoles(u: JwtUser): string[] {
  const ignore = new Set([
    'offline_access',
    'uma_authorization',
    'default-roles-slamint',
    'manage-account',
    'manage-account-links',
    'view-profile',
  ]);
  const realm = (u?.realm_access?.roles ?? []).map((r: string) =>
    r.toLowerCase()
  );
  const clientId = (u as any).azp ?? (u as any).clientId;
  const client = clientId
    ? (u?.resource_access?.[clientId]?.roles ?? []).map((r: string) =>
        r.toLowerCase()
      )
    : [];
  return Array.from(new Set([...realm, ...client])).filter(
    (r) => !ignore.has(r)
  );
}

@Injectable()
export class FirstTimeUserInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(MICRO_SERVICES.ACCOUNT_MANAGEMENT)
    private readonly accMgmt: ClientProxy
  ) {}

  async intercept(ctx: ExecutionContext, next: CallHandler) {
    const http = ctx.switchToHttp();
    const req = http.getRequest<AuthedRequest>();

    const handler = ctx.getHandler();
    const klass = ctx.getClass();

    const isPublic =
      this.reflector.getAllAndOverride<boolean>(META_PUBLIC, [
        handler,
        klass,
      ]) ?? false;
    const isAuth =
      this.reflector.getAllAndOverride<boolean>(META_AUTH, [handler, klass]) ??
      false;
    const requiredRoles =
      this.reflector.getAllAndOverride<readonly string[]>(META_ROLES, [
        handler,
        klass,
      ]) ?? [];

    const mustAuthenticate = isAuth || requiredRoles.length > 0;
    const shouldSkip = isPublic && !mustAuthenticate;

    if (!shouldSkip && req.user && !req.__ensuredUser__) {
      const u = req.user;
      const roles = extractRoles(u);

      req.user.roles = roles;

      await firstValueFrom(
        this.accMgmt.send(AccountManagementCommands.ACC_ENSURE_FROM_JWT, {
          sub: u.sub,
          iss: u.iss,
          email: u.email,
          email_verified: u.email_verified,
          name: u.name,
          preferred_username: u.preferred_username,
          roles,
        } as const)
      );

      req.__ensuredUser__ = true;
    }

    const handlerName =
      typeof handler === 'function' && handler.name
        ? handler.name
        : 'anonymous';
    const className =
      typeof klass === 'function' && klass.name ? klass.name : 'UnknownClass';

    return next.handle().pipe(
      catchError((err) => {
        (err as Error).message = `[TRACE ${className}.${handlerName}] ${String(
          (err as Error).message ?? err
        )}`;
        return throwError(() => err);
      })
    );
  }
}
