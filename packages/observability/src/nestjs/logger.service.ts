import { Injectable } from '@nestjs/common'
import type { LoggerService as NestLoggerService } from '@nestjs/common'
import { createLogger } from '../logger'
import type { StructuredLogger, CreateLoggerOptions, LogContext } from '../logger'

export const LOGGER_TOKEN = Symbol('OBSERVABILITY_LOGGER')

/**
 * NestJS Logger Service wrapper around the structured logger
 * Implements NestJS LoggerService interface for compatibility
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: StructuredLogger

  constructor(options?: CreateLoggerOptions) {
    this.logger = createLogger(options)
  }

  log(message: string, context?: string | LogContext): void {
    if (typeof context === 'string') {
      this.logger.info(message, { context })
    } else {
      this.logger.info(message, context)
    }
  }

  error(message: string, trace?: string, context?: string): void
  error(message: string, error?: Error, ctx?: LogContext): void
  error(message: string, errorOrTrace?: Error | string, ctxOrContext?: LogContext | string): void {
    if (typeof errorOrTrace === 'string') {
      // NestJS style: error(message, trace, context)
      this.logger.error(message, new Error(errorOrTrace), {
        context: typeof ctxOrContext === 'string' ? ctxOrContext : undefined,
      })
    } else {
      // Our style: error(message, error, ctx)
      this.logger.error(message, errorOrTrace, ctxOrContext as LogContext)
    }
  }

  warn(message: string, context?: string | LogContext): void {
    if (typeof context === 'string') {
      this.logger.warn(message, { context })
    } else {
      this.logger.warn(message, context)
    }
  }

  debug(message: string, context?: string | LogContext): void {
    if (typeof context === 'string') {
      this.logger.debug(message, { context })
    } else {
      this.logger.debug(message, context)
    }
  }

  verbose(message: string, context?: string | LogContext): void {
    // Map verbose to debug
    this.debug(message, context)
  }

  fatal(message: string, error?: Error, ctx?: LogContext): void {
    this.logger.fatal(message, error, ctx)
  }

  /**
   * Log an HTTP request
   */
  logRequest(ctx: LogContext): void {
    const statusCode = ctx.statusCode || 200
    const message = `${ctx.method} ${ctx.path}`

    if (statusCode >= 500) {
      this.logger.error(message, undefined, ctx)
    } else if (statusCode >= 400) {
      this.logger.warn(message, ctx)
    } else {
      this.logger.info(message, ctx)
    }
  }

  /**
   * Log an exception with full details
   */
  logException(error: Error, ctx?: LogContext): void {
    this.logger.error(error.message, error, ctx)
  }

  /**
   * Create a child logger with additional bindings
   */
  child(bindings: Record<string, unknown>): LoggerService {
    const childLogger = new LoggerService()
    // @ts-expect-error - accessing private for inheritance
    childLogger.logger = this.logger.child(bindings)
    return childLogger
  }

  /**
   * Flush pending logs
   */
  flush(): void {
    this.logger.flush()
  }

  /**
   * Get underlying structured logger for advanced usage
   */
  getStructuredLogger(): StructuredLogger {
    return this.logger
  }
}

