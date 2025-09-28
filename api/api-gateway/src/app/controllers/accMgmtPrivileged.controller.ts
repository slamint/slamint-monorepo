import { Body, Controller, Inject, Param, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { catchError, map } from 'rxjs/operators';

import type { JwtUser } from '@slamint/auth';
import { CurrentUser } from '@slamint/auth';
import {
  AccountManagementCommands,
  AccountManagementEndPoints,
  ApiVersion,
  ChangeStatus,
  Controllers,
  InviteUser,
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
    summary: 'Invite a new user (admin)',
    description:
      'Creates a user invitation and sends the welcome email. Admin-only.',
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
    summary: 'Resend invite email (admin)',
    description:
      'Resends the onboarding email for a pending user by ID. Returns 204 on success.',
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
    return this.accMgmt
      .send(AccountManagementCommands.ACC_RESEND_EMAIL, withCtx({ id }))
      .pipe(
        map(() => undefined),
        catchError(mapRpcToHttp)
      );
  }

  @ApiOperation({
    summary: 'List available roles (admin)',
    description: 'Returns assignable roles for user management.',
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
    summary: 'Search and list users (admin/manager)',
    description:
      'Returns a paginated list of users filtered by query parameters.',
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
    summary: 'Get user by ID (admin/manager)',
    description: 'Retrieves a single user`s profile and status by ID.',
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
    summary: 'Change user status (admin)',
    description: 'Locks or unlocks a user account with an optional reason.',
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
    summary: 'Update user department (admin)',
    description: 'Sets the user`s department by department ID.',
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
    summary: 'Update user manager (admin)',
    description: 'Assigns or changes the user`s manager by manager ID.',
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
    summary: 'Update user role (admin)',
    description: 'Changes the user`s role to the specified role.',
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
