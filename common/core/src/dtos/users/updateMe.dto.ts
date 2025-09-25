import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class UpdateMe {
  @ApiProperty({ example: '2004e4a2-1ece-4b80-ac74-a9249b1fc2b4' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 'JohnDoe', required: false })
  @IsOptional()
  @IsString()
  name!: string;

  @ApiProperty({ example: '+60127812782', required: false })
  @IsOptional()
  @IsPhoneNumber()
  phone!: string;
}
