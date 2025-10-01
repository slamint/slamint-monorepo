import {
  All,
  applyDecorators,
  Delete,
  Get,
  Head,
  HttpCode,
  Options,
  Patch,
  Post,
  Put,
  Type,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import {
  ApiBadRequestEnvelope,
  ApiOkResponseEnvelope,
  ApiServerErrorEnvelope,
  ApiServerGatewayTimeout,
} from '../helpers';
import { Serialize } from '../interceptors/serialize.interceptor';
import { Authenticated, Public, Roles } from './roles.decorator';

type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD'
  | 'ALL';

type SuccessCode = 200 | 201 | 204;

type RouteOptions<TModel = any> = {
  model?: Type<TModel> | Type<TModel>[];
  bearerName?: string; // defaults to 'bearer'
  /** Set desired success code. Defaults to 200. */
  success?: SuccessCode;
  /** Adds 409 Conflict response to the docs. */
  includeConflict?: boolean;
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

function withDocsAndStatus<T>(
  httpMethod: HttpMethod,
  options?: RouteOptions<T>
) {
  const model = options?.model;

  let serializeModel: Type<T> | undefined;
  const isArray = Array.isArray(model);
  if (isArray) {
    if ((model as Type<T>[]).length > 0) serializeModel = model[0];
  } else {
    serializeModel = model;
  }

  const success = options?.success ?? 200;
  const bearer = options?.bearerName ?? 'bearer';

  const decorators: any[] = [
    ApiBadRequestEnvelope(),
    ApiServerErrorEnvelope(),
    ApiServerGatewayTimeout(),
  ];

  // Success responses
  if (success === 204) {
    decorators.push(ApiNoContentResponse(), HttpCode(204));
  }
  if (success === 201) {
    // Prefer Created semantics (usually POST). Also serialize if we have a model.
    decorators.push(
      ApiCreatedResponse(
        serializeModel
          ? { type: serializeModel, isArray }
          : { description: 'Created' }
      )
    );
    // Nest will default POST to 201; for other methods we keep it explicit:
    if (httpMethod !== 'POST') decorators.push(HttpCode(201));
    if (serializeModel) decorators.push(Serialize(serializeModel));
  }

  if (success !== 204 && success !== 201 && serializeModel) {
    decorators.push(
      ApiOkResponseEnvelope(serializeModel, { isArray }),
      Serialize(serializeModel)
    );
  }

  // Optional 409 Conflict
  if (options?.includeConflict) {
    decorators.push(
      ApiConflictResponse({
        description: 'Conflict',
      })
    );
  }

  // Bearer note: only applied in authenticated/roles routes below
  return { decorators, bearer };
}

/* ------------------------------ Public route ------------------------------ */
export function PublicRoute<T>(
  httpMethod: HttpMethod,
  routePath: string,
  options?: RouteOptions<T>
) {
  const { decorators } = withDocsAndStatus<T>(httpMethod, options);
  return applyDecorators(
    METHOD[httpMethod](routePath),
    ...decorators,
    Public()
  );
}

/* --------------------------- Authenticated route -------------------------- */
export function AuthenticatedRoute<T>(
  httpMethod: HttpMethod,
  routePath: string,
  options?: RouteOptions<T>
) {
  const { decorators, bearer } = withDocsAndStatus<T>(httpMethod, options);
  return applyDecorators(
    METHOD[httpMethod](routePath),
    ...decorators,
    Authenticated(),
    ApiBearerAuth(bearer)
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
  const { decorators, bearer } = withDocsAndStatus<T>(httpMethod, options);

  return applyDecorators(
    METHOD[httpMethod](routePath),
    ...decorators,
    Authenticated(),
    Roles(...roleList),
    ApiBearerAuth(bearer)
  );
}
