import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'admin',
    required: true,
  })
  @IsString()
  role!: string;
}
