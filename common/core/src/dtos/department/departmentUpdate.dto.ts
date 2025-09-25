import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class DepartmentAddOrUpdateDto {
  @Expose()
  @ApiProperty({ example: 'NET', required: false })
  @IsOptional()
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Network & Infrastructure', required: false })
  @IsOptional()
  @IsString()
  name!: string;
}

export class ChangeDepartmentStatusDto {
  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  isActive!: false;
}
