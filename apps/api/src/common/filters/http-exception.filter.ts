import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
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

    res.status(status).json({
      status,
      error: typeof message === 'string' ? message : (message as Record<string, unknown>),
      path: req.url,
      timestamp: new Date().toISOString(),
      request_id: res.getHeader('X-Request-ID') ?? uuidv4(),
    })
  }
}
