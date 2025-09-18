import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@slamint/auth';
import { Controllers, MICRO_SERVICES } from '@slamint/core';
import { withCtx } from '@slamint/core/logging/request.context';

@ApiTags('Account Management')
@Controller(Controllers.ACCOUNT_MANAGEMENT)
export class AccMgmtController {
  constructor(
    @Inject(MICRO_SERVICES.ACCOUNT_MANAGEMENT)
    private readonly accMgmt: ClientProxy
  ) {}

  @Public()
  @Get('/ping')
  async ping() {
    return this.accMgmt.send({ cmd: 'acc.ping' }, withCtx({}));
  }
}
