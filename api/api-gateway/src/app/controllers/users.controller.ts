import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MICRO_SERVICES, UserCommands } from '@slamint/core';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
@ApiTags('Users')
@Controller('users/v1')
export class UsersGatewayController {
  constructor(
    @Inject(MICRO_SERVICES.USERS) private readonly users: ClientProxy
  ) {}
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  @Get('all')
  async getList() {
    return this.users.send({ cmd: UserCommands.GET_LIST }, {});
  }
}
