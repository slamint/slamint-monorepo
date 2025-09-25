import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JwtUser } from '@slamint/auth';

import type {
  EnsureFromJwtMsg,
  EnsureFromJwtResult,
  ListUsersQueryDto,
  RoleName,
  UsersDto,
} from '@slamint/core';
import { AccountManagementCommands, UpdateMe, User } from '@slamint/core';

import { AccountStatus } from '@slamint/core/entities/users/user.entity';
import { AccountManagementService } from './accMgmt.service';

@Controller()
export class AccountManagementController {
  constructor(private readonly svc: AccountManagementService) {}

  @MessagePattern(AccountManagementCommands.ACC_ENSURE_FROM_JWT)
  ensureFromJwt(msg: EnsureFromJwtMsg): Promise<EnsureFromJwtResult> {
    return this.svc.ensureFromJwt(msg);
  }

  @MessagePattern(AccountManagementCommands.ACC_ME)
  getMe(@Payload() { data }: { data: { sub: string } }): Promise<User> {
    return this.svc.getMe(data.sub);
  }

  @MessagePattern(AccountManagementCommands.ACC_ME_UPDATE)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  updateMe(@Payload() { data }: { data: UpdateMe }): Promise<User> {
    return this.svc.updateMe(data);
  }

  @MessagePattern(AccountManagementCommands.ACC_LIST_USERS)
  getallUsers(
    @Payload()
    {
      data: { currentUser, query },
    }: {
      data: { currentUser: JwtUser; query: ListUsersQueryDto };
    }
  ): Promise<UsersDto> {
    return this.svc.getAllUsers(currentUser, query);
  }

  @MessagePattern(AccountManagementCommands.ACC_GET_USER_BY_ID)
  getUserById(
    @Payload() { data }: { data: { id: string; currentUser: JwtUser } }
  ): Promise<User> {
    return this.svc.getUserById(data.id, data.currentUser);
  }

  @MessagePattern(AccountManagementCommands.ACC_CHANGE_STATUS_USER_BY_ID)
  ChangeStatusById(
    @Payload()
    {
      data,
    }: {
      data: { id: string; reason: AccountStatus; status: AccountStatus };
    }
  ): Promise<User> {
    return this.svc.changeStatus(data.id, data.status, data.reason);
  }

  @MessagePattern(AccountManagementCommands.ACC_CHANGE_DEPT_USER_BY_ID)
  UpdateDepartment(
    @Payload()
    { data }: { data: { id: string; deptId: string } }
  ): Promise<User> {
    return this.svc.updateDepartment(data.id, data.deptId);
  }
  @MessagePattern(AccountManagementCommands.ACC_CHANGE_MANAGER_USER_BY_ID)
  changeManager(
    @Payload()
    { data }: { data: { id: string; managerId: string } }
  ): Promise<User> {
    return this.svc.updateManager(data.id, data.managerId);
  }

  @MessagePattern(AccountManagementCommands.ACC_CHANGE_ROLE_USER_BY_ID)
  changeRole(
    @Payload()
    { data }: { data: { id: string; role: RoleName } }
  ): Promise<User> {
    return this.svc.changeRole(data.id, data.role);
  }
}
