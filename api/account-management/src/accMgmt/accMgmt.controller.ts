import { Controller } from '@nestjs/common';

import { AccountManagementCommands, User } from '@slamint/core';
import { AccountManagementService } from './accMgmt.service';
import { MessagePattern } from '@nestjs/microservices';
export interface EnsureFromJwtMsg {
  sub: string;
  iss?: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  realm_access?: { roles?: string[] };
}
export interface EnsureFromJwtResult {
  userId: string;
  isFirstLogin: boolean;
}

@Controller()
export class AccountManagementController {
  constructor(private readonly svc: AccountManagementService) {}

  @MessagePattern(AccountManagementCommands.ACC_LIST_USERS)
  getallUsers(): Promise<User[]> {
    return this.svc.getAllUsers();
  }
}
