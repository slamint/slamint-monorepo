import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  getAll(): Array<{ [key in string]: string }> {
    return [];
  }
}
