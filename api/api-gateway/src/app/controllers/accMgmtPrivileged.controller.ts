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
  @ApiParam({ name: 'id', type: String })
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
  @ApiParam({ name: 'id', type: String })
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
  @ApiParam({ name: 'id', type: String })
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
  @ApiParam({ name: 'id', type: String })
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
  @ApiParam({ name: 'id', type: String })
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
