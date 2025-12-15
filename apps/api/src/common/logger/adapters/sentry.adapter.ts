import { Injectable } from '@nestjs/common'
import { LoggerAdapter, LogContext } from './logger-adapter.interface'

/**
 * Sentry Logger Adapter
 *
 * This is a placeholder implementation. To enable Sentry:
 * 1. Install: yarn add @sentry/nestjs @sentry/profiling-node
 * 2. Initialize Sentry in main.ts
 * 3. Implement the methods below using Sentry's API
 *
 * @example
 * ```typescript
 * import * as Sentry from '@sentry/nestjs'
 *
 * error(message: string, error?: Error, context?: LogContext): void {
 *   Sentry.captureException(error || new Error(message), {
 *     extra: context,
 *   })
 * }
 * ```
 */
@Injectable()
export class SentryLoggerAdapter implements LoggerAdapter {
  info(message: string, context?: LogContext): void {
    // Sentry.addBreadcrumb({
    //   message,
    //   level: 'info',
    //   data: context,
    // })
    console.log(`[SENTRY:INFO] ${message}`, context)
  }

  warn(message: string, context?: LogContext): void {
    // Sentry.addBreadcrumb({
    //   message,
    //   level: 'warning',
    //   data: context,
    // })
    // Sentry.captureMessage(message, 'warning')
    console.warn(`[SENTRY:WARN] ${message}`, context)
  }

  error(message: string, error?: Error, context?: LogContext): void {
    // Sentry.captureException(error || new Error(message), {
    //   extra: context,
    // })
    console.error(`[SENTRY:ERROR] ${message}`, error, context)
  }

  debug(message: string, context?: LogContext): void {
    // Debug messages typically not sent to Sentry
    // Only add as breadcrumb if needed
    // Sentry.addBreadcrumb({
    //   message,
    //   level: 'debug',
    //   data: context,
    // })
    console.debug(`[SENTRY:DEBUG] ${message}`, context)
  }
}

