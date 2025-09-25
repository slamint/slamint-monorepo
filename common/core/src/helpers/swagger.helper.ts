import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorInfoDto, SuccessEnvelopeDto } from '../dtos';

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

export function ApiErrorEnvelope(
  statusCode: number,
  errorType: string,
  exampleMessage = 'Error message'
) {
  const example = {
    success: false,
    error: {
      errorCode: statusCode,
      errorType, // e.g. "ACCOUNT_USER_ID_INVALID"
      errorMessage: exampleMessage,
    },
    path: '/api/path',
    timestamp: '2025-09-16T02:59:58.669Z',
  };

  return applyDecorators(
    ApiExtraModels(ErrorInfoDto),
    ApiResponse({
      status: statusCode,
      description: errorType,
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorInfoDto) },
          example,
          examples: {
            [`${statusCode}_${errorType}`]: {
              summary: `${statusCode} ${errorType}`,
              value: example,
            },
          },
        },
      },
    })
  );
}

/**
 * Convenience helpers for common HTTP statuses with generic errorType.
 * For domain-specific codes, prefer ApiErrorEnvelope(status, 'YOUR_DOMAIN_CODE', 'Your message')
 */
export const ApiBadRequestEnvelope = (msg = 'Bad request') =>
  ApiErrorEnvelope(400, 'BAD_REQUEST', msg);

export const ApiUnauthorizedEnvelope = (msg = 'Unauthorized') =>
  ApiErrorEnvelope(401, 'UNAUTHORIZED', msg);

export const ApiForbiddenEnvelope = (msg = 'Forbidden') =>
  ApiErrorEnvelope(403, 'FORBIDDEN', msg);

export const ApiNotFoundEnvelope = (msg = 'Not found') =>
  ApiErrorEnvelope(404, 'NOT_FOUND', msg);

export const ApiServerErrorEnvelope = (msg = 'Internal server error') =>
  ApiErrorEnvelope(500, 'INTERNAL_SERVER_ERROR', msg);

export const ApiServerGatewayTimeout = (msg = 'Gateway timeout') =>
  ApiErrorEnvelope(504, 'GATEWAY_TIMEOUT', msg);
