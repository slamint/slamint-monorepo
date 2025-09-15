import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { UserCommands } from '@slamint/core';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: UserCommands.GET_LIST })
  getAll() {
    console.log('user controller get list =======>');

    return this.usersService.getAll();
  }
}
