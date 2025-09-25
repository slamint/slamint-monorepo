import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export enum RPCCode {
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  CONFLICT = 'CONFLICT',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export type RpcErrPayload = {
  type: RPCCode; // high-level classification
  code?: string; // YOUR domain code, e.g. "ACCOUNT_USER_ID_INVALID"
  message?: string; // human message
};

export const rpcErr = (p: RpcErrPayload) => new RpcException(JSON.stringify(p));

function tryParse(x: any): any {
  if (typeof x !== 'string') return undefined;
  try {
    return JSON.parse(x);
  } catch {
    return undefined;
  }
}

export function mapRpcToHttp(e: any): never {
  const payload: RpcErrPayload | undefined =
    (typeof e?.message === 'object' && e.message) ||
    (typeof e?.error === 'object' && e.error) ||
    tryParse(e?.message) ||
    tryParse(e?.error);

  // If upstream didn't send a structured payload, best-effort map by string
  if (!payload?.type) {
    const msg = String(e?.message ?? e ?? 'Upstream error');
    const m = msg.toLowerCase();
    if (m.includes('not found'))
      throw new HttpException(
        { errorType: 'NOT_FOUND', errorMessage: msg },
        HttpStatus.NOT_FOUND
      );
    if (m.includes('unauthorized'))
      throw new HttpException(
        { errorType: 'UNAUTHORIZED', errorMessage: msg },
        HttpStatus.UNAUTHORIZED
      );
    if (m.includes('forbidden'))
      throw new HttpException(
        { errorType: 'FORBIDDEN', errorMessage: msg },
        HttpStatus.FORBIDDEN
      );
    if (m.includes('conflict') || m.includes('duplicate'))
      throw new HttpException(
        { errorType: 'CONFLICT', errorMessage: msg },
        HttpStatus.CONFLICT
      );
    if (m.includes('bad request') || m.includes('validation'))
      throw new HttpException(
        { errorType: 'BAD_REQUEST', errorMessage: msg },
        HttpStatus.BAD_REQUEST
      );
    throw new HttpException(
      { errorType: 'INTERNAL_SERVER_ERROR', errorMessage: 'Upstream error' },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  const type = payload.type;
  const code = payload.code;
  const msg = payload.message ?? '';

  switch (type) {
    case RPCCode.BAD_REQUEST:
      throw new HttpException(
        {
          errorType: code ?? 'BAD_REQUEST',
          errorMessage: msg || 'Bad request',
        },
        HttpStatus.BAD_REQUEST
      );
    case RPCCode.NOT_FOUND:
      throw new HttpException(
        {
          errorType: code ?? 'NOT_FOUND',
          errorMessage: msg || 'Not found',
        },
        HttpStatus.NOT_FOUND
      );
    case RPCCode.UNAUTHORIZED:
      throw new HttpException(
        {
          errorType: code ?? 'UNAUTHORIZED',
          errorMessage: msg || 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED
      );
    case RPCCode.FORBIDDEN:
      throw new HttpException(
        {
          errorType: code ?? 'FORBIDDEN',
          errorMessage: msg || 'Forbidden',
        },
        HttpStatus.FORBIDDEN
      );
    case RPCCode.CONFLICT:
      throw new HttpException(
        { errorType: code ?? 'CONFLICT', errorMessage: msg || 'Conflict' },
        HttpStatus.CONFLICT
      );
    default:
      throw new HttpException(
        {
          errorType: code ?? 'INTERNAL_SERVER_ERROR',
          errorMessage: msg || 'Internal error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
  }
}
