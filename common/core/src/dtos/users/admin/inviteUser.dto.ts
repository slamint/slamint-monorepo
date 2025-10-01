import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

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

  @ApiProperty({
    example: '3216becf-ce28-4713-bf68-a2ed7d135496',
    required: false,
  })
  @IsString()
  role!: string;

  @ApiProperty({
    example: '3216becf-ce28-4713-bf68-a2ed7d135496',
    required: false,
  })
  @Optional()
  @IsString({ message: 'departmentId is required when role is manager' })
  departmentId!: string;

  @ApiProperty({
    example: '3216becf-ce28-4713-bf68-a2ed7d135496',
    required: false,
  })
  @Optional()
  @IsString({ message: 'managerId is required when role is engineer' })
  managerId!: string;
}
