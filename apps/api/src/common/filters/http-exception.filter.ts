import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import { captureException } from '../sentry'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error'

    // Capture any 5xx in Sentry and log server-side so production failures
    // are not silently returned as JSON to the client. 4xx are validation
    // and auth concerns — not error-worthy.
    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
      captureException(exception)
    }

    res.status(status).json({
      status,
      error: typeof message === 'string' ? message : (message as Record<string, unknown>),
      path: req.url,
      timestamp: new Date().toISOString(),
      request_id: res.getHeader('X-Request-ID') ?? randomUUID(),
    })
  }
}
