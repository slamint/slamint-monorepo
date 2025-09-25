import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { RoleName } from '../../../decorators/roles.decorator';

export class InviteUser {
  @ApiProperty({ example: 'John', required: true })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'John', required: true })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'johndoe@example.com', required: true })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'admin', enum: RoleName, required: true })
  @IsString()
  role!: RoleName;
}
