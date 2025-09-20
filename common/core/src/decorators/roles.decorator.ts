import { SetMetadata } from '@nestjs/common';

export const META_PUBLIC = 'isPublic';
export const META_AUTH = 'isAuth';
export const META_ROLES = 'roles';

export enum RoleName {
  admin = 'admin',
  user = 'user',
  manager = 'manager',
}

export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(META_PUBLIC, true);

export const Authenticated = (): MethodDecorator & ClassDecorator =>
  SetMetadata(META_AUTH, true);

export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(META_ROLES, roles);
