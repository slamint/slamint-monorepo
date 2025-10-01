import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateManagerDto {
  @ApiProperty({
    example: '3216becf-ce28-4713-bf68-a2ed7d135496',
    required: true,
  })
  @IsString()
  managerId!: string;
}
