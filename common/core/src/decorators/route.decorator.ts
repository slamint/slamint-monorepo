import { applyDecorators, Type } from '@nestjs/common';
import {
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Options,
  Head,
  All,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiBadRequestEnvelope,
  ApiOkResponseEnvelope,
  ApiServerErrorEnvelope,
  ApiServerGatewayTimeout,
} from '../helpers';
import { Authenticated, Roles } from './roles.decorator';
import { Serialize } from '../interceptors/serialize.interceptor';

type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD'
  | 'ALL';

type RouteOptions<TModel = any> = {
  model?: Type<TModel> | Type<TModel>[];
  bearerName?: string; // defaults to 'bearer'
};

const METHOD: Record<HttpMethod, (path?: string) => MethodDecorator> = {
  GET: Get,
  POST: Post,
  PUT: Put,
  PATCH: Patch,
  DELETE: Delete,
  OPTIONS: Options,
  HEAD: Head,
  ALL: All,
};

function withDocs<T>(model?: Type<T> | Type<T>[]) {
  let serializeModel: Type<T> | undefined;
  if (Array.isArray(model)) {
    // For arrays, Serialize expects the type of the array's elements
    if (model.length > 0) {
      serializeModel = model[0];
    }
  } else {
    serializeModel = model;
  }

  return applyDecorators(
    ...(serializeModel
      ? [
          ApiOkResponseEnvelope(serializeModel, {
            isArray: Array.isArray(model),
          }),
          Serialize(serializeModel),
        ]
      : []),
    ApiBadRequestEnvelope(),
    ApiServerErrorEnvelope(),
    ApiServerErrorEnvelope(),
    ApiServerGatewayTimeout()
  );
}

/* ------------------------------ Public route ------------------------------ */
export function PublicRoute<T>(
  httpMethod: HttpMethod,
  routePath: string,
  options?: RouteOptions<T>
) {
  return applyDecorators(
    METHOD[httpMethod](routePath),
    withDocs(options?.model)
  );
}

/* --------------------------- Authenticated route -------------------------- */
export function AuthenticatedRoute<T>(
  httpMethod: HttpMethod,
  routePath: string,
  options?: RouteOptions<T>
) {
  return applyDecorators(
    METHOD[httpMethod](routePath),
    withDocs(options?.model),
    Authenticated(),
    ApiBearerAuth()
  );
}

/* ------------------------------ Roles route ------------------------------- */
export function RolesRoute<T>(
  httpMethod: HttpMethod,
  routePath: string,
  roles: string | string[],
  options?: RouteOptions<T>
) {
  const roleList = Array.isArray(roles) ? roles : [roles];
  const bearer = options?.bearerName ?? 'bearer';

  return applyDecorators(
    METHOD[httpMethod](routePath),
    withDocs(options?.model),
    Authenticated(), // role guard typically implies auth
    Roles(...roleList), // your Roles decorator: (...roles: string[]) => ...
    ApiBearerAuth(bearer)
  );
}
