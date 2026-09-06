import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';

import {
  Observable,
  TimeoutError,
  throwError,
  timeout,
  catchError,
  tap,
} from 'rxjs';
import type { Request } from 'express';
@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    switch (context.getType()) {
      case 'http':
        const req = context.switchToHttp().getRequest();
        req.headers['accept-language'] ??= req.user?.lang ?? 'en';

      default:
        break;
    }

    return next.handle().pipe();
  }
}
