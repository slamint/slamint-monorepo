// auth/authz.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { META_AUTH, META_PUBLIC, META_ROLES, RoleName } from '@slamint/core';
import { collectUserRoles } from './jwt.utils';
import { JwtUser } from './keycloak';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(ctx: ExecutionContext) {
    const handler = ctx.getHandler();
    const klass = ctx.getClass();

    const isPublic = this.reflector.getAllAndOverride<boolean>(META_PUBLIC, [
      handler,
      klass,
    ]);
    const isAuth = this.reflector.getAllAndOverride<boolean>(META_AUTH, [
      handler,
      klass,
    ]);
    const required = this.reflector.getAllAndOverride<ReadonlyArray<RoleName>>(
      META_ROLES,
      [handler, klass]
    );

    const mustAuth = Boolean(isAuth || (required && required.length > 0));
    if (isPublic && !mustAuth) return true;
    return super.canActivate(ctx);
  }

  override handleRequest<TUser = JwtUser>(
    err: any,
    user: any,
    _info: any,
    context: ExecutionContext,
    _status?: any
  ): TUser {
    if (err) throw err;
    if (!user) throw new UnauthorizedException();

    const handler = context.getHandler();
    const klass = context.getClass();
    const required = this.reflector.getAllAndOverride<ReadonlyArray<RoleName>>(
      META_ROLES,
      [handler, klass]
    );

    if (!required?.length) return user as TUser;

    const cast = user as JwtUser;
    const userRoles = collectUserRoles(cast);
    const allowed = required.some((r) => userRoles.has(r));
    if (!allowed) throw new ForbiddenException();

    return user as TUser;
  }
}
