import { Controller, Inject, Param, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiParam, ApiTags } from '@nestjs/swagger';
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
  RoleName,
  RolesRoute,
  User,
  withCtx,
} from '@slamint/core';
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
      .send(AccountManagementCommands.ACC_ME, withCtx({ sub: req.user?.sub }))
      .pipe(catchError(mapRpcToHttp));
  }

  @RolesRoute('GET', AccountManagementEndPoints.LIST_USERS, RoleName.admin, {
    model: [User],
  })
  listUsers() {
    return this.accMgmt
      .send(AccountManagementCommands.ACC_LIST_USERS, withCtx({}))
      .pipe(catchError(mapRpcToHttp));
  }

  @RolesRoute(
    'GET',
    AccountManagementEndPoints.GET_USER_BY_ID,
    RoleName.admin,
    {
      model: User,
    }
  )
  @ApiParam({ name: 'id', type: String })
  getByUserID(@Param('id') id: string) {
    return this.accMgmt
      .send(AccountManagementCommands.ACC_GET_USER_BY_ID, withCtx({ id }))
      .pipe(catchError(mapRpcToHttp));
  }
}
