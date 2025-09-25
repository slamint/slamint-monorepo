import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtUser } from '@slamint/auth';
import type {
  EnsureFromJwtMsg,
  EnsureFromJwtResult,
  ListUsersQueryDto,
  UpdateMe,
  UsersDto,
} from '@slamint/core';
import {
  AccountManagementErrCodes,
  AccountManagementErrMessage,
  AppUser,
  Department,
  DepartmentErrCodes,
  RoleName,
  RPCCode,
  rpcErr,
  User,
} from '@slamint/core';
import { AccountStatus } from '@slamint/core/entities/users/user.entity';
import { plainToInstance } from 'class-transformer';
import { isUUID } from 'class-validator';
import {
  Between,
  FindOptionsSelect,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { KeycloakService } from './keycloak.service';

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
    @InjectRepository(AppUser) private readonly users: Repository<AppUser>,
    @InjectRepository(Department)
    private readonly department: Repository<Department>,
    private readonly kcService: KeycloakService
  ) {}

  private async loadUserOrThrow(where: FindOptionsWhere<AppUser>) {
    const user = await this.users.findOne({
      where,
      relations: userViewRelations,
      select: userViewSelect,
    });
    if (!user)
      throw rpcErr({
        type: RPCCode.NOT_FOUND,
        code: AccountManagementErrCodes.USER_NOT_FOUND,
        message: AccountManagementErrMessage.USER_NOT_FOUND,
      });
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

  async getAllUsers(
    data: JwtUser,
    query: ListUsersQueryDto
  ): Promise<UsersDto> {
    if (!data || !data.sub) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_REQUEST_USERID,
        message: AccountManagementErrMessage.INVALID_REQUEST_USERID,
      });
    }

    const currentUser = await this.users.findOne({ where: { sub: data.sub } });

    if (!currentUser) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_REQUEST_USERID,
        message: AccountManagementErrMessage.INVALID_REQUEST_USERID,
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sort = query.sort ?? 'createdAt';
    const order = query.order ?? 'DESC';

    const base: FindOptionsWhere<AppUser> = {
      ...(query.role && { role: query.role }),
      ...(query.status && { status: query.status }),
      ...(query.departmentId && { department: { id: query.departmentId } }),
      ...(query.managerId && { reportingManager: { id: query.managerId } }),
    };

    const toDate = (s?: string) => (s ? new Date(s) : undefined);

    const cf = toDate(query.createdFrom);
    const ct = toDate(query.createdTo);
    if (cf && ct) base.createdAt = Between(cf, ct);
    else if (cf) base.createdAt = MoreThanOrEqual(cf);
    else if (ct) base.createdAt = LessThanOrEqual(ct);

    const llf = toDate(query.lastLoginFrom);
    const llt = toDate(query.lastLoginTo);
    if (llf && llt) base.lastLoginAt = Between(llf, llt);
    else if (llf) base.lastLoginAt = MoreThanOrEqual(llf);
    else if (llt) base.lastLoginAt = LessThanOrEqual(llt);

    let where: FindOptionsWhere<AppUser> | FindOptionsWhere<AppUser>[] = base;
    if (query.q?.trim()) {
      const term = ILike(`%${query.q.trim()}%`);
      where = [
        { ...base, name: term },
        { ...base, username: term },
        { ...base, email: term },
        { ...base, phone: term },
      ];
    }
    const [rows, total] = await this.users.findAndCount({
      where,
      relations: { department: true, reportingManager: true },
      select: userViewSelect,
      order: { [sort]: order, id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = plainToInstance(User, rows, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return { items, total, page, limit };
  }

  async getUserById(id: string, data: JwtUser): Promise<User> {
    if (!id || !isUUID(id)) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_USERID,
        message: AccountManagementErrMessage.INVALID_USERID,
      });
    }
    if (!data || !data.sub) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_USERID,
        message: AccountManagementErrMessage.INVALID_USERID,
      });
    }
    const currentUser = await this.users.findOne({ where: { sub: data.sub } });
    if (!currentUser) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_REQUEST_USERID,
        message: AccountManagementErrMessage.INVALID_REQUEST_USERID,
      });
    }

    const user = await this.users.findOne({
      where: {
        id,
        ...(currentUser.role === RoleName.manager && {
          reportingManager: { id: currentUser.id },
          role: RoleName.engineer,
          status: AccountStatus.ACTIVE,
        }),
      },
      relations: userViewRelations,
      select: userViewSelect,
    });
    if (!user) {
      throw rpcErr({
        type: RPCCode.NOT_FOUND,
        code: AccountManagementErrCodes.USER_NOT_FOUND,
        message: AccountManagementErrMessage.USER_NOT_FOUND,
      });
    }
    return plainToInstance(User, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  async getMe(sub: string): Promise<User> {
    if (!sub) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_USERID,
        message: AccountManagementErrMessage.INVALID_USERID,
      });
    }

    const user = await this.loadUserOrThrow({ sub });

    return this.toUserDTO(user, user.role);
  }

  async updateMe(data: UpdateMe): Promise<User> {
    const { id, ...patch } = data;
    if (!id) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_USERID,
        message: AccountManagementErrMessage.INVALID_USERID,
      });
    }

    const user = await this.loadUserOrThrow({ id });

    const forbidden = ['role', 'managerId', 'departmentId', 'status'];
    for (const k of forbidden)
      if (k in patch)
        throw rpcErr({
          type: RPCCode.BAD_REQUEST,
          code: AccountManagementErrCodes.INVALID_USERID,
          message: `Cannot update ${k} via /me`,
        });

    this.applyPatch(user, patch);
    const updated = await this.users.save(user);
    return this.toUserDTO(updated, user.role);
  }

  async changeStatus(
    id: string,
    status: AccountStatus,
    lockedReason: string
  ): Promise<User> {
    if (!id) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_USERID,
        message: AccountManagementErrMessage.INVALID_USERID,
      });
    }

    const user = await this.loadUserOrThrow({ id });

    this.applyPatch(user, {
      status,
      lockedReason: status === AccountStatus.LOCKED ? lockedReason ?? '' : '',
    });
    const updated = await this.users.save(user);
    return this.toUserDTO(updated, user.role);
  }

  async updateDepartment(id: string, deptId: string): Promise<User> {
    if (!id) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_USERID,
        message: AccountManagementErrMessage.INVALID_USERID,
      });
    }

    if (!deptId) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: DepartmentErrCodes.INVALID_DEPT,
        message: DepartmentErrCodes.INVALID_DEPT,
      });
    }
    const dept = await this.department.findOne({ where: { id: deptId } });

    if (!dept) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: DepartmentErrCodes.DEPT_NOT_FOUND,
        message: DepartmentErrCodes.DEPT_NOT_FOUND,
      });
    }
    const user = await this.loadUserOrThrow({ id });

    this.applyPatch(user, {
      department: dept,
    });

    const updated = await this.users.save(user);
    return this.toUserDTO(updated, user.role);
  }

  async updateManager(id: string, managerId: string): Promise<User> {
    if (!id) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_USERID,
        message: AccountManagementErrMessage.INVALID_USERID,
      });
    }

    if (!managerId) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_MANAGERID,
        message: AccountManagementErrMessage.INVALID_MANAGERID,
      });
    }
    const manager = await this.loadUserOrThrow({ id: managerId });

    if (!manager) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.MANAGER_NOT_FOUND,
        message: AccountManagementErrMessage.MANAGER_NOT_FOUND,
      });
    }
    const user = await this.loadUserOrThrow({ id });

    this.applyPatch(user, {
      reportingManager: manager,
      department: manager.department,
    });

    const updated = await this.users.save(user);
    return this.toUserDTO(updated, user.role);
  }

  async changeRole(id: string, role: RoleName): Promise<User> {
    if (!id) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_USERID,
        message: AccountManagementErrMessage.INVALID_USERID,
      });
    }

    const user = await this.loadUserOrThrow({ id });

    if (user.role === role) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.ROLE_MUST_DIFFERENT,
        message: AccountManagementErrMessage.ROLE_MUST_DIFFERENT,
      });
    }

    const { roles } = await this.kcService.setRealmRoles(user.sub, role);
    if (!roles.find((r) => role === r)) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_USERID,
        message: AccountManagementErrMessage.INVALID_USERID,
      });
    }
    this.applyPatch(user, {
      role,
    });

    const updated = await this.users.save(user);
    return this.toUserDTO(updated, user.role);
  }
}
