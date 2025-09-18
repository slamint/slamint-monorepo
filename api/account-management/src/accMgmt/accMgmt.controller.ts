import { Controller, Get } from '@nestjs/common';
import { AccountManagementService } from './accMgmt.service';

import {
  AccountManagementEndPoints,
  ApiVersion,
  Controllers,
} from '@slamint/core';
import { MessagePattern } from '@nestjs/microservices';

@Controller(`${Controllers.ACCOUNT_MANAGEMENT}/${ApiVersion.VERSION_ONE}`)
export class AccountManagementController {
  constructor(private readonly appService: AccountManagementService) {}

  @Get(AccountManagementEndPoints.ME)
  getData() {
    return this.appService.getData();
  }
  @MessagePattern({ cmd: 'acc.ping' })
  ping() {
    return { ok: true, ms: 'acc-mgnt' };
  }
}
