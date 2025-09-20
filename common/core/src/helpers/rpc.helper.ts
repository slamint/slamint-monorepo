import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import type { RpcErrPayload } from '../types/rpcCore.types';

export enum RPCCode {
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  CONFLICT = 'CONFLICT',
  FORBIDDEN = 'FORBIDDEN',
}

export const rpcErr = (p: RpcErrPayload) => new RpcException(JSON.stringify(p));

export function mapRpcToHttp(e: any): never {
  const payload: RpcErrPayload | undefined =
    (typeof e?.message === 'object' && e.message) ||
    (typeof e?.error === 'object' && e.error) ||
    tryParse(e?.message) ||
    tryParse(e?.error);

  if (!payload?.code) {
    const msg = String(e?.message ?? e ?? 'Upstream error');
    const m = msg.toLowerCase();
    if (m.includes('not found')) throw new NotFoundException(msg);
    if (m.includes('unauthorized')) throw new UnauthorizedException(msg);
    if (m.includes('forbidden')) throw new ForbiddenException(msg);
    if (m.includes('conflict') || m.includes('duplicate'))
      throw new ConflictException(msg);
    if (m.includes('bad request') || m.includes('validation'))
      throw new BadRequestException(msg);
    throw new InternalServerErrorException('Upstream error');
  }

  switch (payload.code) {
    case RPCCode.BAD_REQUEST:
      throw new BadRequestException(payload.message);
    case RPCCode.NOT_FOUND:
      throw new NotFoundException(payload.message);
    case RPCCode.UNAUTHORIZED:
      throw new UnauthorizedException(payload.message);
    case RPCCode.FORBIDDEN:
      throw new ForbiddenException(payload.message);
    case RPCCode.CONFLICT:
      throw new ConflictException(payload.message);
    default:
      throw new InternalServerErrorException(
        payload.message ?? 'Internal error'
      );
  }
}

function tryParse(x: any): any {
  if (typeof x !== 'string') return undefined;
  try {
    return JSON.parse(x);
  } catch {
    return undefined;
  }
}
