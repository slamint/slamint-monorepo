import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MICRO_SERVICES, UserCommands } from '@slamint/core';

@Controller('users/v1')
export class UsersGatewayController {
  constructor(
    @Inject(MICRO_SERVICES.USERS) private readonly users: ClientProxy
  ) {}

  @Get('all')
  async getList() {
    console.log('user gateway controller get list =======>');
    return this.users.send({ cmd: UserCommands.GET_LIST }, {});
  }
}
