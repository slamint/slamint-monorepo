import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClassConstructor<T> = new (...args: any[]) => T;

export const Serialize = <T>(dto: ClassConstructor<T>) =>
  UseInterceptors(new SerializeInterceptor(dto));

export class SerializeInterceptor<T> implements NestInterceptor {
  constructor(private readonly dto: ClassConstructor<T>) {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: unknown) =>
        plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        })
      )
    );
  }
}
