import { Body, Controller, Inject, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { catchError } from 'rxjs/operators';

import type { JwtUser } from '@slamint/auth/lib/keycloak';
import {
  AccountManagementCommands,
  AccountManagementEndPoints,
  ApiVersion,
  AuthenticatedRoute,
  Controllers,
  mapRpcToHttp,
  MICRO_SERVICES,
  UpdateMe,
  User,
  withCtx,
} from '@slamint/core';
import { firstValueFrom } from 'rxjs';
interface MeRequest extends Request {
  user: JwtUser;
}
@ApiTags('Account Management')
@Controller(`${Controllers.ACCOUNT_MANAGEMENT}/${ApiVersion.VERSION_ONE}`)
export class AccMgmtController {
  constructor(
    @Inject(MICRO_SERVICES.ACCOUNT_MANAGEMENT)
    private readonly accMgmt: ClientProxy
  ) {}
  @AuthenticatedRoute('GET', AccountManagementEndPoints.ME, { model: User })
  async getMe(@Req() req: MeRequest) {
    return this.accMgmt
      .send(
        AccountManagementCommands.ACC_ME,
        withCtx({ sub: req.user?.sub, roles: req.user?.roles ?? [] })
      )
      .pipe(catchError(mapRpcToHttp));
  }

  // Update Me Data
  @AuthenticatedRoute('PATCH', AccountManagementEndPoints.ME, {
    model: User,
  })
  @ApiBody({ type: UpdateMe })
  async patchMe(@Body() data: UpdateMe) {
    return firstValueFrom(
      this.accMgmt
        .send(AccountManagementCommands.ACC_ME_UPDATE, withCtx(data))
        .pipe(catchError(mapRpcToHttp))
    );
  }
}
