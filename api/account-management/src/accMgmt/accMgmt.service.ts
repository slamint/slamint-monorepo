import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  EnsureFromJwtMsg,
  EnsureFromJwtResult,
  UpdateMe,
} from '@slamint/core';
import { AppUser, Role, RoleName, RPCCode, rpcErr, User } from '@slamint/core';
import { plainToInstance } from 'class-transformer';
import { isUUID } from 'class-validator';
import { In, Repository } from 'typeorm';

function pickGroups(roles: string[]): string[] {
  if (roles.includes(RoleName.admin))
    return [RoleName.admin, RoleName.manager, RoleName.engineer];
  if (roles.includes(RoleName.manager))
    return [RoleName.manager, RoleName.engineer];
  if (roles.includes(RoleName.engineer)) return [RoleName.engineer];
  return [];
}
const ALLOWED = new Set<RoleName>(Object.values(RoleName));

@Injectable()
export class AccountManagementService {
  constructor(
    @InjectRepository(AppUser) private readonly users: Repository<AppUser>
  ) {}

  normalizeTokenRoles(tokenRoles: string[]): RoleName[] {
    return Array.from(
      new Set(
        tokenRoles
          .map((r) => r.toLowerCase())
          .filter((r): r is RoleName => ALLOWED.has(r as RoleName))
      )
    ) as RoleName[];
  }
  private async syncRolesFromToken(sub: string, tokenRoles: string[]) {
    const wanted = this.normalizeTokenRoles(tokenRoles);
    const em = this.users.manager;
    const roleRepo = em.getRepository(Role);

    if (wanted.length) {
      await roleRepo
        .createQueryBuilder()
        .insert()
        .values(wanted.map((name) => ({ name })))
        .orIgnore()
        .execute();
    }

    const user = await this.users.findOneOrFail({
      where: { sub },
      relations: { roles: true },
      select: { id: true },
    });

    const currentNames = new Set((user.roles ?? []).map((r) => r.name));
    const wantedSet = new Set(wanted);

    const toAddNames = wanted.filter((n) => !currentNames.has(n));
    const toRemoveNames = [...currentNames].filter(
      (n) => !wantedSet.has(n as RoleName)
    );

    const toAdd = toAddNames.length
      ? await roleRepo.find({ where: { name: In(toAddNames as any) } })
      : [];
    const toRemove = toRemoveNames.length
      ? await roleRepo.find({ where: { name: In(toRemoveNames as any) } })
      : [];

    if (toRemove.length) {
      await em
        .createQueryBuilder()
        .relation(AppUser, 'roles')
        .of(user)
        .remove(toRemove);
    }
    if (toAdd.length) {
      await em
        .createQueryBuilder()
        .relation(AppUser, 'roles')
        .of(user)
        .add(toAdd);
    }
  }

  async ensureFromJwt(
    msg: EnsureFromJwtMsg & { roles?: string[] }
  ): Promise<EnsureFromJwtResult> {
    const now = new Date();

    // 1) minimal upsert (no relations)
    await this.users.upsert(
      {
        sub: msg.sub,
        email: msg.email ?? undefined,
        name: msg.name ?? undefined,
        username: msg.preferred_username ?? undefined,
        lastLoginAt: now,
        firstLoginAt: now, // will be ignored on conflict
      },
      ['sub']
    );

    await this.users
      .createQueryBuilder()
      .update()
      .set({
        firstLoginAt: () => `COALESCE("first_login_at", NOW())`,
        lastLoginAt: () => `NOW()`,
      })
      .where('sub = :sub', { sub: msg.sub })
      .execute();
    await this.syncRolesFromToken(msg.sub, msg.roles ?? []);
    const user = await this.users.findOne({
      where: { sub: msg.sub },
      select: ['id', 'firstLoginAt', 'lastLoginAt'],
    });
    return {
      userId: user!.id,
      isFirstLogin:
        !!user!.firstLoginAt && user!.firstLoginAt.getTime() === now.getTime(),
    };
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.users.find({ order: { createdAt: 'DESC' } });

    const userDtos = plainToInstance(User, users, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return userDtos;
  }

  async getUserById(id: string): Promise<User> {
    if (!id || !isUUID(id)) {
      throw rpcErr({
        code: RPCCode.BAD_REQUEST,
        message: 'User id is not valid',
      });
    }

    const user = await this.users.findOneBy({ id });
    if (!user) {
      throw rpcErr({
        code: RPCCode.NOT_FOUND,
        message: 'User not found',
      });
    }
    return plainToInstance(User, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  async getMe(sub: string, roles: string[]): Promise<User> {
    if (!sub)
      throw rpcErr({
        code: RPCCode.BAD_REQUEST,
        message: 'User id is not valid',
      });

    const user = await this.users.findOne({
      where: { sub },
      relations: {
        department: { departmentHead: true },
        reportingManager: true,
        roles: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });
    if (!user)
      throw rpcErr({ code: RPCCode.NOT_FOUND, message: 'User not found' });

    const dbRoles = (user.roles ?? []).map((r) => r.name);
    const effectiveRoles = roles?.length ? roles : dbRoles;
    const groups = pickGroups(effectiveRoles);
    const fullUserData = {
      ...user,
      roles: dbRoles, // always emit DB roles array
      department: user.department && {
        id: user.department.id,
        name: user.department.name,
        departmentHead: user.department.departmentHead && {
          id: user.department.departmentHead.id,
          name: user.department.departmentHead.name,
          email: user.department.departmentHead.email,
        },
      },
      reportingManager: user.reportingManager && {
        id: user.reportingManager.id,
        name: user.reportingManager.name,
        email: user.reportingManager.email,
      },
    };
    return plainToInstance(User, fullUserData, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
      groups,
    });
  }

  async updateMe(data: UpdateMe): Promise<User> {
    const { id, ...attrs } = data;
    if (!id) {
      throw rpcErr({
        code: RPCCode.BAD_REQUEST,
        message: 'User id is not valid',
      });
    }

    const user = await this.users.findOne({ where: { id } });

    if (!user) {
      throw rpcErr({
        code: RPCCode.NOT_FOUND,
        message: 'User not found',
      });
    }
    Object.assign(user, attrs);
    const updatedUser = await this.users.save(user);
    return plainToInstance(User, updatedUser, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }
}
