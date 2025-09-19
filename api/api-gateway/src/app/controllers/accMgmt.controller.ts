import { Controller, Inject, Param, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import type { JwtUser } from '@slamint/auth/lib/keycloak';
import {
  AccountManagementCommands,
  AccountManagementEndPoints,
  ApiVersion,
  AuthenticatedRoute,
  Controllers,
  MICRO_SERVICES,
  RoleName,
  RolesRoute,
  User,
  UserMe,
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

  @AuthenticatedRoute('GET', AccountManagementEndPoints.ME, { model: UserMe })
  async getMe(@Req() req: MeRequest) {
    return {
      sub: req.user.sub,
      email: req.user.email,
      name: req.user.name,
      username: req.user.preferred_username,
      roles: req.user.roles,
      relmAccess: req.user.realm_access,
    };
  }

  @RolesRoute('GET', AccountManagementEndPoints.LIST_USERS, RoleName.admin, {
    model: [User],
  })
  listUsers() {
    return this.accMgmt.send(
      AccountManagementCommands.ACC_LIST_USERS,
      withCtx({})
    );
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
    return this.accMgmt.send(
      AccountManagementCommands.ACC_GET_USER_BY_ID,
      withCtx({ id })
    );
  }
}
