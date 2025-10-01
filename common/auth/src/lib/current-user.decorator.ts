import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RoleName } from '@slamint/core';
import { JwtUser } from './keycloak';

export const ROLE_PRIORITY: RoleName[] = [
  RoleName.admin,
  RoleName.manager,
  RoleName.engineer,
  RoleName.user,
];

export function pickPrimaryRole(roles: RoleName[]): RoleName {
  for (const r of ROLE_PRIORITY) if (roles?.includes(r)) return r;
  return RoleName.user;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtUser => {
    const req = ctx.switchToHttp().getRequest();
    return {
      ...req.user,
      priorityRole: pickPrimaryRole(req.user?.roles),
    } as JwtUser;
  }
);
