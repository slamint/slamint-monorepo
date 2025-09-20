import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EnsureFromJwtMsg, EnsureFromJwtResult } from '@slamint/core';
import { AppUser, RPCCode, rpcErr, User } from '@slamint/core';
import { plainToInstance } from 'class-transformer';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';

@Injectable()
export class AccountManagementService {
  constructor(
    @InjectRepository(AppUser) private readonly users: Repository<AppUser>
  ) {}

  async ensureFromJwt(msg: EnsureFromJwtMsg): Promise<EnsureFromJwtResult> {
    const now = new Date();

    let user = await this.users.findOne({ where: { sub: msg.sub } });
    if (user) {
      let changed = false;

      if (!user.email && msg.email) {
        user.email = msg.email;
        changed = true;
      }
      if (!user.name && msg.name) {
        user.name = msg.name;
        changed = true;
      }

      user.lastLoginAt = now;
      changed = true;

      if (changed) await this.users.save(user);
      return { userId: user.id, isFirstLogin: false };
    }

    const created = this.users.create({
      sub: msg.sub,
      email: msg.email ?? undefined,
      name: msg.name ?? undefined,
      username: msg.preferred_username ?? undefined,
      firstLoginAt: now,
      lastLoginAt: now,
    });
    try {
      user = await this.users.save(created);
      return { userId: user.id, isFirstLogin: true };
    } catch {
      user = await this.users.findOneOrFail({ where: { sub: msg.sub } });
      user.lastLoginAt = now;
      await this.users.save(user);
      return { userId: user.id, isFirstLogin: false };
    }
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

  async getMe(sub: string): Promise<User> {
    if (!sub) {
      throw rpcErr({
        code: RPCCode.BAD_REQUEST,
        message: 'User id is not valid',
      });
    }

    const user = await this.users.findOne({ where: { sub } });

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
}
