import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import type { EnsureFromJwtMsg, EnsureFromJwtResult } from '@slamint/core';
import { AccountManagementCommands, UpdateMe, User } from '@slamint/core';

import { AccountManagementService } from './accMgmt.service';

@Controller()
export class AccountManagementController {
  constructor(private readonly svc: AccountManagementService) {}

  @MessagePattern(AccountManagementCommands.ACC_ENSURE_FROM_JWT)
  ensureFromJwt(msg: EnsureFromJwtMsg): Promise<EnsureFromJwtResult> {
    return this.svc.ensureFromJwt(msg);
  }

  @MessagePattern(AccountManagementCommands.ACC_ME)
  getMe(
    @Payload() { data }: { data: { sub: string; roles: string[] } }
  ): Promise<User> {
    return this.svc.getMe(data.sub, data.roles ?? []);
  }

  @MessagePattern(AccountManagementCommands.ACC_ME_UPDATE)
  updateMe(@Payload() { data }: { data: UpdateMe }): Promise<User> {
    return this.svc.updateMe(data);
  }

  @MessagePattern(AccountManagementCommands.ACC_LIST_USERS)
  getallUsers(): Promise<User[]> {
    return this.svc.getAllUsers();
  }

  @MessagePattern(AccountManagementCommands.ACC_GET_USER_BY_ID)
  getUserById(@Payload() { data }: { data: { id: string } }): Promise<User> {
    return this.svc.getUserById(data.id);
  }
}
