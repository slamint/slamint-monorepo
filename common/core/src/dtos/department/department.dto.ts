import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { randomUUID } from 'node:crypto';

export class DepartmentDto {
  @Expose()
  @ApiProperty({ example: randomUUID() })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'NET' })
  code!: string;

  @Expose()
  @ApiProperty({ example: 'Network & Infrastructure' })
  name!: string;

  @Expose()
  @ApiProperty({ example: new Date().toISOString() })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: new Date().toISOString() })
  updatedAt!: Date;
}
