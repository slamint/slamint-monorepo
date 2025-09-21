import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { randomUUID } from 'crypto';
import { RoleName } from '../../decorators/roles.decorator';
import { DepartmentDto } from '../department/department.dto';

export class LiteUserRef {
  @Expose()
  @ApiProperty({ example: randomUUID() })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'johndoe' })
  name?: string;

  @Expose()
  @ApiProperty({ example: 'johndoe@example.com' })
  email?: string;
}

export class User {
  @Expose()
  @ApiProperty({ example: randomUUID() })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'johndoe' })
  name?: string;

  @Expose()
  @ApiProperty({ example: 'johndoe@example.com' })
  email?: string;

  @Expose()
  @ApiProperty({ example: 'johndoe' })
  username!: string;

  @Expose()
  @ApiProperty({ example: '+6012481278' })
  phone!: string;

  @Expose()
  @ApiProperty({ example: Date.now() })
  createdAt!: string;

  @Expose()
  @ApiProperty({ example: Date.now() })
  updatedAt!: string;

  @Expose()
  @ApiProperty({ example: Date.now() })
  lastLoginAt!: string;

  @Expose()
  @ApiProperty({ example: RoleName.engineer })
  roles?: string[];

  @Expose({ groups: ['manager', 'engineer', 'admin'] })
  @ApiProperty({
    example: {
      id: randomUUID(),
      name: 'IT',
      email: 'it@example.com',
      departmentHead: {
        id: randomUUID(),
        name: 'michael',
        email: 'michael@example.com',
      },
    },
  })
  @Type(() => DepartmentDto)
  department?: DepartmentDto;

  @Expose({ groups: ['manager', 'engineer', 'admin'] })
  @ApiProperty({
    example: {
      id: randomUUID(),
      name: 'michael',
      email: 'michael@example.com',
    },
  })
  @Type(() => LiteUserRef)
  reportingManager?: LiteUserRef;
}
