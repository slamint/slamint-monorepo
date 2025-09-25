import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { User } from './user.dto';

export class UsersDto {
  @Expose()
  @ApiProperty({ type: User, isArray: true })
  @Type(() => User)
  items!: User[];

  @Expose()
  @ApiProperty({ type: Number, example: 42 })
  total!: number;

  @Expose()
  @ApiProperty({ type: Number, example: 1 })
  page!: number;

  @Expose()
  @ApiProperty({ type: Number, example: 20 })
  limit!: number;
}
