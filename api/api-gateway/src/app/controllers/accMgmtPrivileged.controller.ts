import { Body, Controller, Inject, Param, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { catchError } from 'rxjs/operators';
import { InviteUser } from './../../../../../common/core/src/dtos/users/admin/inviteUser.dto';

import type { JwtUser } from '@slamint/auth';
import { CurrentUser } from '@slamint/auth';
import {
  AccountManagementCommands,
  AccountManagementEndPoints,
  ApiVersion,
  ChangeStatus,
  Controllers,
  ListUsersQueryDto,
  mapRpcToHttp,
  MICRO_SERVICES,
  RoleItem,
  RoleName,
  RolesRoute,
  UpdateDepartmentDto,
  UpdateManagerDto,
  UpdateRoleDto,
  User,
  UsersDto,
  withCtx,
} from '@slamint/core';
import { firstValueFrom } from 'rxjs';

@ApiTags('Account Management Privileged Routes')
@Controller(
  `${Controllers.ACCOUNT_MANAGEMENT_PRIVILEGED}/${ApiVersion.VERSION_ONE}`
)
export class AccMgmtControllerPrivileged {
  constructor(
    @Inject(MICRO_SERVICES.ACCOUNT_MANAGEMENT)
    private readonly accMgmt: ClientProxy
  ) {}

  @ApiOperation({
    summary: 'invite new user',
    description: `Invite New User for **admin** only`,
  })
  @RolesRoute(
    'POST',
    AccountManagementEndPoints.INVITE_USERS,
    [RoleName.admin],
    {
      model: User,
      success: 201,
    }
  )
  @ApiBody({ type: InviteUser })
  inviteUser(@Body() data: InviteUser) {
    return this.accMgmt
      .send(AccountManagementCommands.ACC_INVITE_USER, withCtx({ user: data }))
      .pipe(catchError(mapRpcToHttp));
  }

  @ApiOperation({
    summary: 'Resend email for new user',
    description: `Resend email for newly created user - **admin** only`,
  })
  @RolesRoute(
    'POST',
    AccountManagementEndPoints.SEND_EMAIL_USER_BY_ID,
    [RoleName.admin],
    {
      success: 204,
    }
  )
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  resendInviteEmail(@Param('id') id: string) {
    const data = this.accMgmt
      .send(AccountManagementCommands.ACC_RESEND_EMAIL, withCtx({ id }))
      .pipe(catchError(mapRpcToHttp));

    if (!data) {
      return;
    }
  }

  @ApiOperation({
    summary: 'Get roles for admin, manager role',
    description: `This Routes can be accessed with the Bearer token along with **admin** (or) **manager** role`,
  })
  @RolesRoute(
    'GET',
    AccountManagementEndPoints.USER_ROLES_LIST,
    [RoleName.admin],
    {
      model: [RoleItem],
    }
  )
  getRoles() {
    return this.accMgmt
      .send(AccountManagementCommands.ACC_GET_ROLES, withCtx({}))
      .pipe(catchError(mapRpcToHttp));
  }

  @ApiExtraModels(UsersDto, User, ListUsersQueryDto)
  @RolesRoute(
    'GET',
    AccountManagementEndPoints.LIST_USERS,
    [RoleName.admin, RoleName.manager],
    {
      model: UsersDto,
    }
  )
  @ApiOperation({
    summary: 'Get all users for admin, manager role',
    description: `This Routes can be accessed with the Bearer token along with **admin** (or) **manager** role`,
  })
  listUsers(
    @CurrentUser() currentUser: JwtUser,
    @Query() query: ListUsersQueryDto
  ) {
    return firstValueFrom(
      this.accMgmt
        .send(
          AccountManagementCommands.ACC_LIST_USERS,
          withCtx({ currentUser, query })
        )
        .pipe(catchError(mapRpcToHttp))
    );
  }

  @ApiOperation({
    summary: 'Get user by id for admin, manager role',
    description: `This Routes can be accessed with the Bearer token along with **admin** (or) **manager** role`,
  })
  @RolesRoute(
    'GET',
    AccountManagementEndPoints.GET_USER_BY_ID,
    [RoleName.admin, RoleName.manager],
    {
      model: User,
    }
  )
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  getByUserID(@Param('id') id: string, @CurrentUser() currentUser: JwtUser) {
    return this.accMgmt
      .send(
        AccountManagementCommands.ACC_GET_USER_BY_ID,
        withCtx({ id, currentUser })
      )
      .pipe(catchError(mapRpcToHttp));
  }

  @ApiOperation({
    summary: 'lock or unlock user for admin role',
    description: `lock or unlock user by user id for **admin** only`,
  })
  @RolesRoute(
    'PATCH',
    AccountManagementEndPoints.CHANGE_STATUS_USER_BY_ID,
    [RoleName.admin],
    {
      model: User,
    }
  )
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: ChangeStatus })
  changeStatus(@Param('id') id: string, @Body() data: ChangeStatus) {
    return this.accMgmt
      .send(
        AccountManagementCommands.ACC_CHANGE_STATUS_USER_BY_ID,
        withCtx({ id, reason: data.reason, status: data.status })
      )
      .pipe(catchError(mapRpcToHttp));
  }

  @ApiOperation({
    summary: 'update department of user',
    description: `update department by user id for **admin** only`,
  })
  @RolesRoute(
    'PATCH',
    AccountManagementEndPoints.UPDATE_DEPARTMENT_USER_BY_ID,
    [RoleName.admin],
    {
      model: User,
    }
  )
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateDepartmentDto })
  updateDepartment(@Param('id') id: string, @Body() data: UpdateDepartmentDto) {
    return this.accMgmt
      .send(
        AccountManagementCommands.ACC_CHANGE_DEPT_USER_BY_ID,
        withCtx({ id, deptId: data.departmentId })
      )
      .pipe(catchError(mapRpcToHttp));
  }

  @ApiOperation({
    summary: 'update manager of user',
    description: `update manager by user id for **admin** only`,
  })
  @RolesRoute(
    'PATCH',
    AccountManagementEndPoints.UPDATE_MANAGER_USER_BY_ID,
    [RoleName.admin],
    {
      model: User,
    }
  )
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateManagerDto })
  updateManager(@Param('id') id: string, @Body() data: UpdateManagerDto) {
    return this.accMgmt
      .send(
        AccountManagementCommands.ACC_CHANGE_MANAGER_USER_BY_ID,
        withCtx({ id, managerId: data.managerId })
      )
      .pipe(catchError(mapRpcToHttp));
  }

  @ApiOperation({
    summary: 'update role of user',
    description: `update role by user id for **admin** only`,
  })
  @RolesRoute(
    'PATCH',
    AccountManagementEndPoints.UPDATE_ROLE_USER_BY_ID,
    [RoleName.admin],
    {
      model: User,
    }
  )
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateRoleDto })
  changeRole(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    return this.accMgmt
      .send(
        AccountManagementCommands.ACC_CHANGE_ROLE_USER_BY_ID,
        withCtx({ id, role: data.role })
      )
      .pipe(catchError(mapRpcToHttp));
  }
}
