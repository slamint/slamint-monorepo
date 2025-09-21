import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';
import { randomUUID } from 'crypto';

export class UpdateMe {
  @ApiProperty({
    example: randomUUID(),
    description: 'should be passed from [Get]/me api',
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    example: 'JohnDoe',
  })
  @IsString()
  name!: string;

  @ApiProperty({ example: '+60127812782' })
  @IsPhoneNumber()
  phone!: string;
}
