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
@Injectable()
export class WatchInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...');

    const now = Date.now();
    return next.handle().pipe(
      timeout(10000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }

        return throwError(() => err);
      }),
      tap(() => console.log(`After... ${Date.now() - now}ms`)),
    );
  }
}
