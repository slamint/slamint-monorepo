import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AccountManagementCommands, User } from '@slamint/core';

import { AccountManagementService } from './accMgmt.service';

@Controller()
export class AccountManagementController {
  constructor(private readonly svc: AccountManagementService) {}

  @MessagePattern(AccountManagementCommands.ACC_LIST_USERS)
  getallUsers(): Promise<User[]> {
    return this.svc.getAllUsers();
  }

  @MessagePattern(AccountManagementCommands.ACC_GET_USER_BY_ID)
  getUserById(@Payload() data: { id: string }): Promise<User> {
    return this.svc.getUserById(data.id);
  }
}
