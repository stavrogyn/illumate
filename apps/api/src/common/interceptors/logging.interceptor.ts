import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { Request, Response } from 'express'
import { LoggerService } from '../logger/logger.service'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    const requestId =
      (request.headers['x-request-id'] as string) ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Add request ID to response headers
    response.setHeader('x-request-id', requestId)

    const startTime = Date.now()

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime

          this.logger.logRequest({
            requestId,
            method: request.method,
            path: request.url,
            statusCode: response.statusCode,
            duration,
            userId: (request as unknown as { user?: { id: string } }).user?.id,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          })
        },
        error: () => {
          // Errors are handled by AllExceptionsFilter
          // We don't log here to avoid duplicate logs
        },
      }),
    )
  }
}

