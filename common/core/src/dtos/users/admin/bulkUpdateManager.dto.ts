import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class BulkUpdateManagerDto {
  @ApiProperty({
    example: '3216becf-ce28-4713-bf68-a2ed7d135496',
    required: true,
  })
  @IsString()
  managerId!: string;

  @ApiProperty({
    example: '3216becf-ce28-4713-bf68-a2ed7d135496',
    required: true,
  })
  @IsString()
  newManagerId!: string;
}

export class BulkUpdateManagerResponseDto {
  @ApiProperty({
    example: '0',
    required: true,
  })
  @Expose()
  affected!: number;
}
