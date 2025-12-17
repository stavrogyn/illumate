import { Inject, Injectable } from '@nestjs/common'
import { LOGGER_ADAPTER } from './adapters/logger-adapter.interface'
import type { LoggerAdapter, LogContext } from './adapters/logger-adapter.interface'

@Injectable()
export class LoggerService {
  constructor(
    @Inject(LOGGER_ADAPTER)
    private readonly adapter: LoggerAdapter,
  ) {}

  info(message: string, context?: LogContext): void {
    this.adapter.info(message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.adapter.warn(message, context)
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.adapter.error(message, error, context)
  }

  debug(message: string, context?: LogContext): void {
    this.adapter.debug(message, context)
  }

  /**
   * Log an HTTP request
   */
  logRequest(context: LogContext): void {
    const statusCode = context.statusCode || 200
    const message = `${context.method} ${context.path}`

    if (statusCode >= 500) {
      this.error(message, undefined, context)
    } else if (statusCode >= 400) {
      this.warn(message, context)
    } else {
      this.info(message, context)
    }
  }

  /**
   * Log an exception with full details
   */
  logException(error: Error, context?: LogContext): void {
    this.error(error.message, error, context)
  }
}

