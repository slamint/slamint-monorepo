import { SuccessEnvelopeDto, ErrorInfoDto } from '../dtos';
import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiOkResponseEnvelope<T extends Type<unknown>>(
  model: T,
  options?: { isArray?: boolean }
) {
  return applyDecorators(
    ApiExtraModels(SuccessEnvelopeDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessEnvelopeDto) },
          {
            properties: {
              data: options?.isArray
                ? {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  }
                : {
                    $ref: getSchemaPath(model),
                  },
            },
          },
        ],
      },
    })
  );
}

export function ApiErrorEnvelope(statusCode: number, errorName: string) {
  const example = {
    success: false,
    error: {
      message: 'string',
      details: {
        message: 'string',
        error: errorName,
        statusCode,
      },
    },
    path: '/api/path',
    timestamp: '2025-09-16T02:59:58.669Z',
  };

  return applyDecorators(
    ApiExtraModels(ErrorInfoDto),
    ApiResponse({
      status: statusCode,
      description: errorName,
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorInfoDto) },
          example,
          examples: {
            [`${statusCode}_${errorName.replace(/\s+/g, '_')}`]: {
              summary: `${statusCode} ${errorName}`,
              value: example,
            },
          },
        },
      },
    })
  );
}

export const ApiBadRequestEnvelope = () => ApiErrorEnvelope(400, 'Bad Request');
export const ApiUnauthorizedEnvelope = () =>
  ApiErrorEnvelope(401, 'Unauthorized');
export const ApiForbiddenEnvelope = () => ApiErrorEnvelope(403, 'Forbidden');
export const ApiNotFoundEnvelope = () => ApiErrorEnvelope(404, 'Not Found');
export const ApiServerErrorEnvelope = () =>
  ApiErrorEnvelope(500, 'Internal Server Error');
export const ApiServerGatewayTimeout = () =>
  ApiErrorEnvelope(504, 'Gateway Timeout');
