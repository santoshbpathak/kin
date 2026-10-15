import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { randomUUID } from 'crypto'
import { Response } from 'express'

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp()
    const res = ctx.getResponse<Response>()
    const requestId = randomUUID()
    res.setHeader('X-Request-ID', requestId)

    return next.handle().pipe(
      tap(data => {
        // Inject request_id into JSON responses
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          (data as Record<string, unknown>)['request_id'] = requestId
        }
      }),
    )
  }
}
