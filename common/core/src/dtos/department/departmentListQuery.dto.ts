// list-department.query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ListDepartmentQueryDto {
  @ApiPropertyOptional({ description: 'Full-text query over name/code' })
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by department id (UUID)' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ description: 'Only active/inactive departments' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ISO date (inclusive)' })
  @IsOptional()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'ISO date (inclusive)' })
  @IsOptional()
  createdTo?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'name'] as const })
  @IsOptional()
  sort?: 'createdAt' | 'name' = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] as const })
  @IsOptional()
  order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
