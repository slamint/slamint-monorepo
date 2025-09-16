import { ApiProperty } from '@nestjs/swagger';

export class ErrorDetailsDto {
  @ApiProperty()
  message!: string;

  @ApiProperty()
  error!: string;

  @ApiProperty()
  statusCode!: number;
}

export class ErrorBodyDto {
  @ApiProperty()
  message!: string;

  @ApiProperty({ type: ErrorDetailsDto })
  details!: ErrorDetailsDto;
}

export class ErrorInfoDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ type: ErrorBodyDto })
  error!: ErrorBodyDto;

  @ApiProperty()
  path!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2025-09-16T02:59:58.669Z',
  })
  timestamp!: Date;
}
