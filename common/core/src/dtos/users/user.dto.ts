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
  @ApiProperty({ example: '00fe42f8-bc93-4b44-b6a4-8a7b6d9a19f3' })
  sub!: string;

  @Expose()
  @ApiProperty({ example: 'johndoe' })
  username?: string;

  @Expose()
  @ApiProperty({ example: 'John Doe' })
  name?: string;

  @Expose()
  @ApiProperty({ example: 'johndoe@example.com' })
  email?: string;

  @Expose()
  @ApiProperty({ example: '+60123456789' })
  phone?: string;

  @Expose()
  @ApiProperty({ enum: RoleName, example: RoleName.engineer })
  role!: RoleName;

  @Expose()
  @ApiProperty({
    example: { id: randomUUID(), code: 'ENG', name: 'Engineering' },
    required: false,
  })
  @Type(() => DepartmentDto)
  department?: DepartmentDto | null;

  @Expose()
  @ApiProperty({
    example: {
      id: randomUUID(),
      name: 'Michael Scott',
      email: 'michael@dundermifflin.com',
    },
    required: false,
  })
  @Type(() => LiteUserRef)
  reportingManager?: LiteUserRef | null;

  @Expose()
  @ApiProperty({ example: 'active', enum: ['active', 'locked'] })
  status!: 'active' | 'locked';

  @Expose()
  @ApiProperty({ example: new Date().toISOString() })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: new Date().toISOString() })
  updatedAt!: Date;

  @Expose()
  @ApiProperty({ example: new Date().toISOString(), required: false })
  firstLoginAt?: Date;

  @Expose()
  @ApiProperty({ example: new Date().toISOString(), required: false })
  lastLoginAt?: Date;
}
