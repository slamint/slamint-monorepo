import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AccountStatus } from '../../../entities/users/user.entity';

export class ChangeStatus {
  @ApiProperty({ example: 'Violating Policy', required: false })
  @IsOptional()
  @IsString()
  reason!: string;

  @ApiProperty({ example: AccountStatus.LOCKED, required: true })
  @IsString()
  status!: AccountStatus;
}
