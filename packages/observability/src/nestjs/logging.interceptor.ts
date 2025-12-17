import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { Request, Response } from 'express'
import { LoggerService, LOGGER_TOKEN } from './logger.service'
import { recordHttpRequest, trackActiveRequest } from '../metrics'
import { generateRequestId } from '../tags'
import { addSpanAttributes, getTraceContext } from '../telemetry'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(LOGGER_TOKEN)
    private readonly logger: LoggerService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    // Generate or extract request ID
    const requestId =
      (request.headers['x-request-id'] as string) || generateRequestId()

    // Add request ID to response headers
    response.setHeader('x-request-id', requestId)

    // Get trace context for correlation
    const traceContext = getTraceContext()

    // Add span attributes for tracing
    addSpanAttributes({
      'http.request_id': requestId,
      'http.user_agent': request.headers['user-agent'] || '',
      ...(request.user && { 'user.id': (request.user as { id?: string }).id || '' }),
    })

    // Normalize route for metrics (use route pattern, not actual path)
    const route = this.getRoute(request, context)

    const startTime = Date.now()
    const endActiveRequest = trackActiveRequest(request.method)

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime
          endActiveRequest()

          // Record metrics
          recordHttpRequest({
            method: request.method,
            route,
            statusCode: response.statusCode,
            duration,
          })

          // Log the request
          this.logger.logRequest({
            requestId,
            traceId: traceContext?.traceId,
            spanId: traceContext?.spanId,
            method: request.method,
            path: request.url,
            route,
            statusCode: response.statusCode,
            duration,
            userId: (request as unknown as { user?: { id: string } }).user?.id,
            ip: request.ip || request.socket.remoteAddress,
            userAgent: request.headers['user-agent'],
          })
        },
        error: (error) => {
          const duration = Date.now() - startTime
          endActiveRequest()

          // Record error metrics (status code handled by exception filter)
          recordHttpRequest({
            method: request.method,
            route,
            statusCode: response.statusCode >= 400 ? response.statusCode : 500,
            duration,
          })
        },
      }),
    )
  }

  /**
   * Get the route pattern for metrics (parameterized, not actual values)
   */
  private getRoute(request: Request, context: ExecutionContext): string {
    // Try to get the route pattern from Express
    const expressRoute = request.route?.path
    if (expressRoute) {
      return expressRoute
    }

    // Try to get from NestJS metadata
    const controller = context.getClass()
    const handler = context.getHandler()

    const controllerPath = Reflect.getMetadata('path', controller) || ''
    const handlerPath = Reflect.getMetadata('path', handler) || ''

    const basePath = controllerPath.startsWith('/') ? controllerPath : `/${controllerPath}`
    const methodPath = handlerPath.startsWith('/') ? handlerPath : `/${handlerPath}`

    return `${basePath}${methodPath}`.replace(/\/+/g, '/') || request.path
  }
}

