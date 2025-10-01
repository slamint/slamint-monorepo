import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtUser } from '@slamint/auth';
import {
  AccountManagementErrCodes,
  AccountManagementErrMessage,
  AppUser,
  BulkUpdateManagerDto,
  BulkUpdateManagerResponseDto,
  Department,
  DepartmentErrCodes,
  DepartmentErrMessage,
  EnsureFromJwtMsg,
  EnsureFromJwtResult,
  InviteUser,
  ListUsersQueryDto,
  RoleItem,
  RoleName,
  RPCCode,
  rpcErr,
  serverError,
  ServerErrorMessage,
  UpdateMe,
  User,
  UsersDto,
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
import { KCUser } from './../../../../common/auth/src/lib/keycloak.d';
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

  async getRoles(): Promise<RoleItem[]> {
    const roles = await this.kcService.getRealmRolesCached();

    return plainToInstance(RoleItem, roles, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  async inviteUser(data: InviteUser): Promise<User> {
    const roles = await this.getRoles();

    const role = roles.find((r) => r.id === data.role);

    if (!role) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.ROLE_NOT_EXIST,
        message: AccountManagementErrMessage.INVALID_USERID,
      });
    }
    if (role.name === RoleName.manager) {
      if (!data.departmentId) {
        throw rpcErr({
          type: RPCCode.BAD_REQUEST,
          code: AccountManagementErrCodes.DEPARTMENT_ID_REQUIRED,
          message: AccountManagementErrMessage.DEPARTMENT_ID_REQUIRED,
        });
      }

      const dept = await this.department.findOne({
        where: { id: data.departmentId },
      });

      if (!dept) {
        throw rpcErr({
          type: RPCCode.BAD_REQUEST,
          code: DepartmentErrCodes.DEPT_NOT_FOUND,
          message: DepartmentErrMessage.DEPT_NOT_FOUND,
        });
      }
    }

    if (role.name === RoleName.engineer) {
      if (!data.managerId) {
        throw rpcErr({
          type: RPCCode.BAD_REQUEST,
          code: AccountManagementErrCodes.MANAGER_ID_REQUIRED,
          message: AccountManagementErrMessage.MANAGER_ID_REQUIRED,
        });
      }
      const manager = await this.users.findOne({
        where: { id: data.managerId, role: RoleName.manager },
      });

      if (!manager) {
        throw rpcErr({
          type: RPCCode.BAD_REQUEST,
          code: AccountManagementErrCodes.MANAGER_NOT_FOUND,
          message: AccountManagementErrMessage.MANAGER_NOT_FOUND,
        });
      }
    }

    const user: KCUser = await this.kcService.inviteUser(data);
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.username;

    await this.users
      .createQueryBuilder()
      .insert()
      .values({
        sub: user.id,
        email: user.email ?? undefined,
        name: name ?? undefined,
        username: user.username ?? undefined,
        role: role.name as RoleName,
        ...(role.name === RoleName.engineer && {
          reportingManager: { id: data.managerId },
        }),
        ...((role.name === RoleName.manager ||
          role.name === RoleName.engineer) && {
          department: { id: data.departmentId },
        }),
      })
      .orIgnore()
      .execute();

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
      .where('sub = :sub', { sub: user.id })
      .setParameters({
        name: name ?? null,
        email: user.email ?? null,
        username: user.username ?? null,
      })
      .execute();

    const insertedUser = await this.users.findOne({
      where: { sub: user.id },
    });
    return plainToInstance(User, insertedUser, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  async sendemail(id: string): Promise<{ status: 'ok' }> {
    const emailSent = await this.kcService.sendEmail(id, true);

    if (!emailSent) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: serverError.INTERNAL_SERVER_ERROR,
        message: AccountManagementErrMessage.EMAIL_TRIGGER,
      });
    }

    return { status: 'ok' };
  }

  allowedSort = new Set([
    'createdAt',
    'name',
    'lastLoginAt',
    'role',
    'status',
    'id',
  ]);

  getSort(requested?: string): keyof AppUser {
    return (
      requested && this.allowedSort.has(requested) ? requested : 'createdAt'
    ) as keyof AppUser;
  }

  toDate(s?: string): Date | undefined {
    return s ? new Date(s) : undefined;
  }

  addRange<T extends object>(
    obj: T,
    field: keyof T,
    from?: string,
    to?: string
  ): void {
    const f = this.toDate(from);
    const t = this.toDate(to);
    if (f && t) (obj as any)[field] = Between(f, t);
    else if (f) (obj as any)[field] = MoreThanOrEqual(f);
    else if (t) (obj as any)[field] = LessThanOrEqual(t);
  }

  buildSearchWhere(
    base: FindOptionsWhere<AppUser>,
    q?: string
  ): FindOptionsWhere<AppUser> | FindOptionsWhere<AppUser>[] {
    const term = q?.trim();
    if (!term) return base;

    const like = ILike(`%${term}%`);
    return [
      { ...base, name: like },
      { ...base, username: like },
      { ...base, email: like },
      { ...base, phone: like },
    ];
  }

  async getAllUsers(
    data: JwtUser,
    query: ListUsersQueryDto
  ): Promise<UsersDto> {
    if (!data?.sub) {
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
    const sort = this.getSort(query.sort);
    const order: 'ASC' | 'DESC' = query.order === 'ASC' ? 'ASC' : 'DESC';

    // Base filters
    const base: FindOptionsWhere<AppUser> = {
      ...(query.role && { role: query.role }),
      ...(query.status && { status: query.status }),
      ...(query.departmentId && { department: { id: query.departmentId } }),
      ...(query.managerId && { reportingManager: { id: query.managerId } }),
    };

    // Date ranges
    this.addRange(base, 'createdAt', query.createdFrom, query.createdTo);
    this.addRange(base, 'lastLoginAt', query.lastLoginFrom, query.lastLoginTo);

    // Global search
    const where = this.buildSearchWhere(base, query.q);

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
    if (!data?.sub) {
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

    if (Object.values(AccountStatus).includes(status)) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_STATUS,
        message: AccountManagementErrMessage.INVALID_STATUS,
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
        message: DepartmentErrMessage.INVALID_DEPT,
      });
    }
    const dept = await this.department.findOne({ where: { id: deptId } });

    if (!dept) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: DepartmentErrCodes.DEPT_NOT_FOUND,
        message: DepartmentErrMessage.DEPT_NOT_FOUND,
      });
    }
    const user = await this.loadUserOrThrow({ id });

    if ([RoleName.admin, RoleName.user].includes(user.role)) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.ROLE_CANNOT_BE_ASSIGNED,
        message: AccountManagementErrMessage.ROLE_CANNOT_BE_ASSIGNED,
      });
    }

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
    if (id === managerId) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_MANAGERID,
        message: AccountManagementErrMessage.INVALID_MANAGERID,
      });
    }

    const manager = await this.loadUserOrThrow({
      id: managerId,
    });

    if (!manager || manager.role !== RoleName.manager) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.MANAGER_NOT_FOUND,
        message: AccountManagementErrMessage.MANAGER_NOT_FOUND,
      });
    }

    if (manager.department === null || manager.department === undefined) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.DEPARTMENT_NOT_ASSIGNED,
        message: AccountManagementErrMessage.DEPARTMENT_NOT_ASSIGNED,
      });
    }

    const user = await this.loadUserOrThrow({ id });

    if (user.role !== RoleName.engineer) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.MANAGER_CANNOT_BE_ASSIGNED,
        message: AccountManagementErrMessage.MANAGER_CANNOT_BE_ASSIGNED,
      });
    }

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

    const { role: currentRole } = user;

    if (currentRole === RoleName.manager) {
      const managed = await this.users.count({
        where: { reportingManager: { id } },
      });

      if (managed > 0) {
        throw rpcErr({
          type: RPCCode.BAD_REQUEST,
          code: AccountManagementErrCodes.MANAGER_HAS_ENGINEER,
          message: AccountManagementErrMessage.MANAGER_HAS_ENGINEER,
        });
      }
    }

    if (user.role === role) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.ROLE_MUST_DIFFERENT,
        message: AccountManagementErrMessage.ROLE_MUST_DIFFERENT,
      });
    }

    const { roles } = await this.kcService.setRealmRoles(user.sub, role);
    if (!roles.includes(role)) {
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

  async bulkUpdateManager(
    data: BulkUpdateManagerDto
  ): Promise<BulkUpdateManagerResponseDto> {
    if (!data.managerId) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_MANAGERID,
        message: AccountManagementErrMessage.INVALID_MANAGERID,
      });
    }

    if (!data.newManagerId) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_NEW_MANAGERID,
        message: AccountManagementErrMessage.INVALID_MANAGERID,
      });
    }

    const [oldMgr, newMgr] = await Promise.all([
      this.loadUserOrThrow({ id: data.managerId }),
      this.loadUserOrThrow({ id: data.newManagerId }),
    ]);

    if (!oldMgr || oldMgr.role !== RoleName.manager) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.MANAGER_NOT_FOUND,
        message: AccountManagementErrMessage.MANAGER_NOT_FOUND,
      });
    }

    if (!newMgr || newMgr.role !== RoleName.manager) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.MANAGER_NOT_FOUND,
        message: AccountManagementErrMessage.MANAGER_NOT_FOUND,
      });
    }

    const count = await this.users.count({
      where: { id: data.managerId, role: RoleName.manager },
    });

    if (count === 0) {
      return plainToInstance(
        BulkUpdateManagerResponseDto,
        { affected: 0 },
        {
          excludeExtraneousValues: true,
          enableImplicitConversion: true,
        }
      );
    }

    const result = await this.users
      .createQueryBuilder()
      .update()
      .where('reportingManager = :oldManagerId AND role=:role', {
        oldManagerId: data.managerId,
        role: RoleName.engineer,
      })
      .set({
        reportingManager: { id: data.newManagerId },
        department: newMgr.department ? { id: newMgr.department.id } : null,
      })
      .execute();

    return plainToInstance(BulkUpdateManagerResponseDto, result, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  async deleteById(id: string): Promise<boolean> {
    if (!id) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: AccountManagementErrCodes.INVALID_USERID,
        message: AccountManagementErrMessage.INVALID_USERID,
      });
    }

    const user = await this.loadUserOrThrow({ id });

    if (user.role === RoleName.manager) {
      const managed = await this.users.count({
        where: { reportingManager: { id } },
      });

      if (managed > 0) {
        throw rpcErr({
          type: RPCCode.BAD_REQUEST,
          code: AccountManagementErrCodes.MANAGER_HAS_ENGINEER,
          message: AccountManagementErrMessage.MANAGER_HAS_ENGINEER,
        });
      }
    }
    const kcDeleted = await this.kcService.deleteUserByID(user.sub);

    if (!kcDeleted) {
      throw rpcErr({
        type: RPCCode.INTERNAL_SERVER_ERROR,
        code: serverError.INTERNAL_SERVER_ERROR,
        message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
      });
    }

    const result = await this.users.remove(user);

    if (!result) {
      throw rpcErr({
        type: RPCCode.INTERNAL_SERVER_ERROR,
        code: serverError.INTERNAL_SERVER_ERROR,
        message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
      });
    }

    return true;
  }
}
