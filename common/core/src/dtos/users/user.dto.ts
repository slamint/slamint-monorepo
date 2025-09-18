import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { randomUUID } from 'crypto';

export class User {
  @Expose()
  @ApiProperty({ example: randomUUID() })
  id!: string;

  @Exclude()
  sub!: string;

  @Expose()
  @ApiProperty({ example: 'johndoe@example.com' })
  email!: string;

  @Expose()
  @ApiProperty({ example: 'johndoe' })
  name!: string;

  @Expose()
  @ApiProperty({ example: 'johndoe' })
  username!: string;

  @Expose()
  @ApiProperty({ example: '+6012481278' })
  phone!: string;

  @Exclude()
  locale!: string;

  @Exclude()
  firstLoginAt?: Date;

  @Expose()
  @ApiProperty({ example: Date.now() })
  createdAt!: string;

  @Expose()
  @ApiProperty({ example: Date.now() })
  updatedAt!: string;

  @Expose()
  @ApiProperty({ example: Date.now() })
  lastLoginAt!: string;
}

export class UsersDto {
  @Expose()
  @ApiProperty({ type: [User] })
  @Type(() => User)
  users!: User[];
}
