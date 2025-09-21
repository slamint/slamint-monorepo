import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { User } from './user.dto';

export class UsersDto {
  @Expose()
  @ApiProperty({ type: [User] })
  @Type(() => User)
  users!: User[];
}
