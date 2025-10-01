import { AccountManagementErrCodes } from '../enums/errorCode.enum';

export type RpcErrCode =
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL';

type errorCode = AccountManagementErrCodes;
export interface RpcErrPayload {
  type: RpcErrCode;
  code?: errorCode;
  message: string;
  details?: unknown;
}
