import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { LoggerService, LOGGER_TOKEN } from './logger.service'
import { recordError } from '../metrics'
import { generateRequestId } from '../tags'
import { captureException, isSentryInitialized } from '../sentry'
import { getTraceContext, recordSpanException } from '../telemetry'

interface ErrorResponse {
  statusCode: number
  message: string
  error: string
  timestamp: string
  path: string
  requestId: string
  traceId?: string
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(LOGGER_TOKEN)
    private readonly logger: LoggerService
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const requestId =
      (request.headers['x-request-id'] as string) || generateRequestId()
    const traceContext = getTraceContext()

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

      // Record exception in span
      recordSpanException(exception)
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = 'Internal server error'
      errorName = 'UnknownError'
    }

    // Record error metric
    recordError({
      errorType: errorName,
      route: request.route?.path || request.path,
    })

    // Get error context
    const errorContext = {
      requestId,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId,
      method: request.method,
      path: request.url,
      statusCode: status,
      userId: (request as unknown as { user?: { id: string } }).user?.id,
      ip: request.ip || request.socket.remoteAddress,
      userAgent: request.headers['user-agent'],
      body: this.sanitizeBody(request.body),
      query: request.query,
    }

    // Log the exception
    this.logger.logException(
      exception instanceof Error ? exception : new Error(String(exception)),
      errorContext
    )

    // Send to Sentry for 5xx errors
    if (status >= 500 && isSentryInitialized() && exception instanceof Error) {
      captureException(exception, {
        requestId,
        traceId: traceContext?.traceId,
        userId: errorContext.userId,
        tags: {
          status_code: status.toString(),
          route: request.route?.path || request.path,
        },
        extra: {
          method: request.method,
          path: request.url,
          query: request.query,
        },
      })
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      ...(traceContext && { traceId: traceContext.traceId }),
    }

    response.status(status).json(errorResponse)
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body
    }

    const sanitized = { ...(body as Record<string, unknown>) }
    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'authorization',
      'creditCard',
      'ssn',
    ]

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }
}

