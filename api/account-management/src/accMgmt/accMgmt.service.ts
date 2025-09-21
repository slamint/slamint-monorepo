import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  EnsureFromJwtMsg,
  EnsureFromJwtResult,
  UpdateMe,
} from '@slamint/core';
import { AppUser, RoleName, RPCCode, rpcErr, User } from '@slamint/core';
import { plainToInstance } from 'class-transformer';
import { isUUID } from 'class-validator';
import { FindOptionsSelect, FindOptionsWhere, Repository } from 'typeorm';

// Single-role priority from token
const ROLE_PRIORITY: RoleName[] = [
  RoleName.admin,
  RoleName.manager,
  RoleName.engineer,
  RoleName.user,
];
function pickHighestRole(tokenRoles: string[] | undefined): RoleName | null {
  if (!tokenRoles?.length) return null;
  const lower = new Set(tokenRoles.map((r) => r.toLowerCase()));
  for (const r of ROLE_PRIORITY) if (lower.has(r)) return r;
  return null;
}

// Optional groups for class-transformer DTOs
function groupsFromViewer(role: RoleName): string[] {
  if (role === RoleName.admin) return ['admin', 'manager', 'engineer'];
  if (role === RoleName.manager) return ['manager', 'engineer'];
  if (role === RoleName.engineer) return ['engineer'];
  return []; // 'user' -> hide gated fields
}

// Only relations you actually need
const userViewRelations = {
  department: true,
  reportingManager: true,
} as const;

// Base entity field selection only (no unmapped FK props here)
const userViewSelect: FindOptionsSelect<AppUser> = {
  id: true,
  sub: true,
  email: true,
  name: true,
  username: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
};

@Injectable()
export class AccountManagementService {
  constructor(
    @InjectRepository(AppUser) private readonly users: Repository<AppUser>
  ) {}

  private async loadUserOrThrow(where: FindOptionsWhere<AppUser>) {
    const user = await this.users.findOne({
      where,
      relations: userViewRelations,
      select: userViewSelect,
    });
    if (!user)
      throw rpcErr({ code: RPCCode.NOT_FOUND, message: 'User not found' });
    return user;
  }

  private toUserDTO(entity: AppUser, viewerRole: RoleName): User {
    const shaped = {
      ...entity,
      role: entity.role,
      department: entity.department && {
        id: entity.department.id,
        name: entity.department.name,
      },
      reportingManager: entity.reportingManager && {
        id: entity.reportingManager.id,
        name: entity.reportingManager.name,
        email: entity.reportingManager.email,
      },
    };

    return plainToInstance(User, shaped, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
      groups: groupsFromViewer(viewerRole),
    });
  }

  private applyPatch<T extends object>(target: T, patch: Partial<T>) {
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) (target as any)[k] = v;
    }
  }

  // Set single-column role from token (skip write if unchanged)
  private async syncRoleFromToken(sub: string, tokenRoles?: string[]) {
    const wanted = pickHighestRole(tokenRoles);
    if (!wanted) return;

    const current = await this.users.findOne({
      where: { sub },
      select: { id: true, role: true },
    });
    if (!current) return;

    if (current.role !== wanted) {
      await this.users
        .createQueryBuilder()
        .update()
        .set({ role: wanted })
        .where('id = :id', { id: current.id })
        .execute();
    }
  }

  async ensureFromJwt(
    msg: EnsureFromJwtMsg & { roles?: string[] }
  ): Promise<EnsureFromJwtResult> {
    const now = new Date();
    const initialRole = pickHighestRole(msg.roles) ?? RoleName.user;

    // 1) insert if missing
    await this.users
      .createQueryBuilder()
      .insert()
      .values({
        sub: msg.sub,
        email: msg.email ?? undefined,
        name: msg.name ?? undefined,
        username: msg.preferred_username ?? undefined,
        firstLoginAt: now,
        lastLoginAt: now,
        role: initialRole,
      })
      .orIgnore()
      .execute();

    // 2) update sparse fields + timestamps (preserve firstLoginAt if already set)
    await this.users
      .createQueryBuilder()
      .update()
      .set({
        firstLoginAt: () => `COALESCE("first_login_at", NOW())`,
        lastLoginAt: () => `NOW()`,
        name: () => `CASE WHEN "name" IS NULL THEN :name ELSE "name" END`,
        email: () => `CASE WHEN "email" IS NULL THEN :email ELSE "email" END`,
        username: () =>
          `CASE WHEN "username" IS NULL THEN :username ELSE "username" END`,
      })
      .where('sub = :sub', { sub: msg.sub })
      .setParameters({
        name: msg.name ?? null,
        email: msg.email ?? null,
        username: msg.preferred_username ?? null,
      })
      .execute();

    // 3) single-role sync
    await this.syncRoleFromToken(msg.sub, msg.roles);

    // 4) result (+ first-login flag)
    const user = await this.users.findOne({
      where: { sub: msg.sub },
      select: ['id', 'firstLoginAt', 'lastLoginAt'],
    });

    return {
      userId: user!.id,
      isFirstLogin:
        !!user!.firstLoginAt &&
        user!.firstLoginAt.getTime() === user!.lastLoginAt!.getTime(),
    };
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.users.find({
      relations: userViewRelations,
      select: userViewSelect,
      order: { createdAt: 'DESC' },
    });
    return plainToInstance(User, users, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  async getUserById(id: string): Promise<User> {
    if (!id || !isUUID(id)) {
      throw rpcErr({
        code: RPCCode.BAD_REQUEST,
        message: 'User id is not valid',
      });
    }
    const user = await this.users.findOne({
      where: { id },
      relations: userViewRelations,
      select: userViewSelect,
    });
    if (!user) {
      throw rpcErr({ code: RPCCode.NOT_FOUND, message: 'User not found' });
    }
    return plainToInstance(User, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  async getMe(sub: string, tokenRoles?: string[]): Promise<User> {
    if (!sub) {
      throw rpcErr({
        code: RPCCode.BAD_REQUEST,
        message: 'User id is not valid',
      });
    }

    const user = await this.loadUserOrThrow({ sub });

    return this.toUserDTO(user, user.role);
  }

  async updateMe(data: UpdateMe): Promise<User> {
    const { id, ...patch } = data;
    if (!id) {
      throw rpcErr({
        code: RPCCode.BAD_REQUEST,
        message: 'User id is not valid',
      });
    }

    const user = await this.loadUserOrThrow({ id });

    // Block privileged fields via /me
    const forbidden = ['role', 'managerId', 'departmentId', 'status'];
    for (const k of forbidden)
      if (k in patch)
        throw rpcErr({
          code: RPCCode.BAD_REQUEST,
          message: `Cannot update ${k} via /me`,
        });

    this.applyPatch(user, patch);
    const updated = await this.users.save(user);
    return this.toUserDTO(updated, user.role);
  }
}
