import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../domain/audit/audit.service';
import type { Request, Response } from 'express';

type RealmAccess = { roles?: string[] };
interface AuthUser {
  sub?: string;
  preferred_username?: string;
  realm_access?: RealmAccess;
}

@Injectable()
export class AuditInspector implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const res = ctx.switchToHttp().getResponse<Response>();
    const started = Date.now();

    return next.handle().pipe(
      tap(() => {
        const user = req.user ?? {};
        const roles = user.realm_access?.roles;
        // fire-and-forget inside tap; don't make tap callback `async`
        void this.auditService.write({
          userId: user.sub,
          roles: Array.isArray(roles) ? roles.join(',') : undefined,
          method: req.method,
          path: req.originalUrl ?? req.url,
          status: res.statusCode ?? 200,
          ip: req.ip,
          meta: { durationMs: Date.now() - started },
        });
      })
    );
  }
}
