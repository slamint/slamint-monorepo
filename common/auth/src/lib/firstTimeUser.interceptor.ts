import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import type { Request } from 'express';
import { catchError, firstValueFrom, throwError } from 'rxjs';

import {
  AccountManagementCommands,
  META_AUTH,
  META_PUBLIC,
  META_ROLES,
  MICRO_SERVICES,
} from '@slamint/core';
import { JwtUser } from './keycloak';

interface AuthedRequest extends Request {
  user?: JwtUser;
  __ensuredUser__?: boolean;
}

@Injectable()
export class EnsureUserInterceptor implements NestInterceptor {
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
    if (!shouldSkip && req.user) {
      const u = req.user;

      await firstValueFrom(
        this.accMgmt.send(AccountManagementCommands.ACC_ENSURE_FROM_JWT, {
          sub: u.sub,
          iss: u.iss,
          email: u.email,
          email_verified: u.email_verified,
          name: u.name,
          preferred_username: u.preferred_username,
        } as const)
      );
      req.__ensuredUser__ = true;
    }

    return next.handle().pipe(
      catchError((err) => {
        (err as Error).message = `[TRACE ${klass}.${handler}] ${String(
          (err as Error).message ?? err
        )}`;
        return throwError(() => err);
      })
    );
  }
}
