// auth/authz.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { META_PUBLIC, META_AUTH, META_ROLES } from './roles.decorator';

export interface JwtUser {
  sub: string;
  email: string;
  roles: string[];
}

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
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      META_ROLES,
      [handler, klass]
    );

    // If explicitly Authenticated or Roles present, force auth path
    const mustAuthenticate = Boolean(
      isAuth || (requiredRoles && requiredRoles.length > 0)
    );

    // Public only if marked @Public AND not explicitly @Authenticated
    if (isPublic && !mustAuthenticate) return true;

    // Otherwise require JWT (private-by-default)
    return super.canActivate(ctx);
  }

  override handleRequest<TUser = JwtUser>(
    err: unknown,
    user: TUser | false | null,
    _info: unknown,
    ctx: ExecutionContext
  ): TUser {
    if (err) throw err;
    if (!user) throw new UnauthorizedException();

    const handler = ctx.getHandler();
    const klass = ctx.getClass();
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      META_ROLES,
      [handler, klass]
    );

    if (!requiredRoles?.length) return user;

    const cast = user as unknown as JwtUser;
    const userRoles = new Set((cast.roles ?? []).map((r) => r.toLowerCase()));
    const allowed = requiredRoles.some((r) => userRoles.has(r.toLowerCase()));
    if (!allowed) throw new ForbiddenException();
    return user;
  }
}
