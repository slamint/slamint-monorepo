import { ApiProperty } from '@nestjs/swagger';

class ErrorDto {
  @ApiProperty({ example: 400 })
  errorCode!: number;

  @ApiProperty({ example: 'ACCOUNT_USER_ID_INVALID' })
  errorType!: string;

  @ApiProperty({ example: 'Invalid user id' })
  errorMessage!: string;
}

export class ErrorInfoDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ type: ErrorDto })
  error!: ErrorDto;

  @ApiProperty({ example: '/api/path' })
  path!: string;

  @ApiProperty({ example: '2025-09-16T02:59:58.669Z' })
  timestamp!: string;
}
