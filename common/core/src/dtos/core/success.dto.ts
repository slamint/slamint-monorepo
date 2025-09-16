// src/common/dto/success.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class OkPayloadDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok' | string; // keep as literal 'ok' or widen to string if needed
}

/**
 * Your success envelope:
 * {
 *   success: true,
 *   data: { status: 'ok' }
 * }
 */
export class SuccessEnvelopeDto<TData> {
  @ApiProperty({ example: true })
  success!: boolean;

  // Swagger will get the concrete schema via helper decorators (see below)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  @ApiProperty() data!: TData;
}
