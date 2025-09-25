import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { DepartmentDto } from './department.dto';

export class DepartmentsDto {
  @Expose()
  @ApiProperty({ type: DepartmentDto, isArray: true })
  @Type(() => DepartmentDto)
  items!: DepartmentDto[];

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
