export interface LogContext {
  requestId?: string
  userId?: string
  path?: string
  method?: string
  statusCode?: number
  duration?: number
  userAgent?: string
  ip?: string
  [key: string]: unknown
}

export interface LoggerAdapter {
  /**
   * Log informational message
   */
  info(message: string, context?: LogContext): void

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void

  /**
   * Log error message with optional error object
   */
  error(message: string, error?: Error, context?: LogContext): void

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void
}

export const LOGGER_ADAPTER = Symbol('LOGGER_ADAPTER')

