import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { LoggerService } from '../logger/logger.service'

interface ErrorResponse {
  statusCode: number
  message: string
  error: string
  timestamp: string
  path: string
  requestId?: string
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const requestId = (request.headers['x-request-id'] as string) || this.generateRequestId()

    let status: number
    let message: string
    let errorName: string

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>
        message = Array.isArray(responseObj.message)
          ? responseObj.message.join(', ')
          : (responseObj.message as string) || exception.message
      } else {
        message = exception.message
      }

      errorName = exception.name
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = 'Internal server error'
      errorName = exception.name
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = 'Internal server error'
      errorName = 'UnknownError'
    }

    // Log the exception
    this.logger.logException(
      exception instanceof Error ? exception : new Error(String(exception)),
      {
        requestId,
        method: request.method,
        path: request.url,
        statusCode: status,
        userId: (request as unknown as { user?: { id: string } }).user?.id,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        body: this.sanitizeBody(request.body),
        query: request.query,
      },
    )

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    }

    response.status(status).json(errorResponse)
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body
    }

    const sanitized = { ...(body as Record<string, unknown>) }
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret']

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }
}

