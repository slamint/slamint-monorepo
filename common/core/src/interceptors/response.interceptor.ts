import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type ApiResponse<T> = {
  success: true;
  data: T;
};

@Injectable()
export class ResponseInterceptor<T = unknown>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _ctx: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(
        (data: T): ApiResponse<T> => ({
          success: true,
          data,
        }),
      ),
    );
  }
}
