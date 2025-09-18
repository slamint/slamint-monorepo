import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AccountManagementService } from './accMgmt.service';
import { AccountManagementCommands } from '@slamint/core';
import type { EnsureFromJwtMsg, EnsureFromJwtResult } from '@slamint/core';

@Controller()
export class AccountManagementMessagesController {
  constructor(private readonly svc: AccountManagementService) {}

  @MessagePattern(AccountManagementCommands.ACC_ENSURE_FROM_JWT)
  ensureFromJwt(msg: EnsureFromJwtMsg): Promise<EnsureFromJwtResult> {
    return this.svc.ensureFromJwt(msg);
  }
}
