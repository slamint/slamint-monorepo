import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { RoleName } from '../../decorators/roles.decorator';
import { AccountStatus } from '../../entities/users/user.entity';

export class ListUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Full-text query over name/username/email/phone',
  })
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ enum: RoleName })
  @IsOptional()
  @IsEnum(RoleName)
  role?: RoleName;

  @ApiPropertyOptional({ enum: AccountStatus })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by reporting manager userId' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({ description: 'ISO date (inclusive)' })
  @IsOptional()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'ISO date (inclusive)' })
  @IsOptional()
  createdTo?: string;

  @ApiPropertyOptional({ description: 'ISO date (inclusive)' })
  @IsOptional()
  lastLoginFrom?: string;

  @ApiPropertyOptional({ description: 'ISO date (inclusive)' })
  @IsOptional()
  lastLoginTo?: string;

  @ApiPropertyOptional({
    enum: ['createdAt', 'name', 'lastLoginAt', 'role', 'status'] as const,
  })
  @IsOptional()
  sort?: 'createdAt' | 'name' | 'lastLoginAt' | 'role' | 'status';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] as const })
  @IsOptional()
  order?: 'ASC' | 'DESC';

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
