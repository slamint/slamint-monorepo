export type RpcErrCode =
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL';

export interface RpcErrPayload {
  code: RpcErrCode;
  message: string;
  details?: unknown;
}
