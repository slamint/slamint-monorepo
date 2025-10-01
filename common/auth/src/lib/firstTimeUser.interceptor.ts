import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import {
  AccountManagementCommands,
  mapRpcToHttp,
  META_AUTH,
  META_PUBLIC,
  META_ROLES,
  MICRO_SERVICES,
  serverError,
  ServerErrorMessage,
} from '@slamint/core';
import type { Request } from 'express';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { collectUserRoles } from './jwt.utils';
import { JwtUser } from './keycloak';

interface AuthedRequest extends Request {
  user?: JwtUser & { roles?: string[] };
  __ensuredUser__?: boolean;
}

function httpErr(status: number, errorType: string, errorMessage: string) {
  return new HttpException({ errorType, errorMessage }, status);
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

    if (!shouldSkip) {
      if (!req.user) {
        throw httpErr(
          HttpStatus.UNAUTHORIZED,
          serverError.UNAUTHORIZED,
          ServerErrorMessage.UNAUTHORIZED
        );
      }

      if (!req.__ensuredUser__) {
        const u = req.user;

        const roleSet = collectUserRoles(u);
        const roles = Array.from(roleSet);
        req.user.roles = roles;

        await firstValueFrom(
          this.accMgmt
            .send(AccountManagementCommands.ACC_ENSURE_FROM_JWT, {
              sub: u.sub,
              iss: u.iss,
              email: u.email,
              email_verified: (u as any).email_verified,
              name: u.name,
              preferred_username: (u as any).preferred_username,
              roles,
            } as const)
            .pipe(catchError(mapRpcToHttp))
        );

        req.__ensuredUser__ = true;
      }
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
