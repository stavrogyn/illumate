import pino, { Logger, LoggerOptions, DestinationStream } from 'pino'
import { trace, context, SpanContext } from '@opentelemetry/api'
import { getServiceTags, RequestTags, ServiceTags } from './tags'

export interface LogContext extends Partial<RequestTags> {
  [key: string]: unknown
}

export interface StructuredLogger {
  info(message: string, ctx?: LogContext): void
  warn(message: string, ctx?: LogContext): void
  error(message: string, error?: Error, ctx?: LogContext): void
  debug(message: string, ctx?: LogContext): void
  fatal(message: string, error?: Error, ctx?: LogContext): void
  child(bindings: Record<string, unknown>): StructuredLogger
  flush(): void
}

export interface CreateLoggerOptions {
  /** Service name override */
  serviceName?: string
  /** Minimum log level */
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  /** Enable pretty printing (for development) */
  pretty?: boolean
  /** Custom destination stream */
  destination?: DestinationStream
  /** Additional base bindings */
  bindings?: Record<string, unknown>
}

/**
 * Get current trace context from OpenTelemetry
 */
function getTraceContext(): { traceId?: string; spanId?: string } {
  const span = trace.getSpan(context.active())
  if (!span) return {}
  
  const spanContext: SpanContext = span.spanContext()
  if (!spanContext.traceId || spanContext.traceId === '00000000000000000000000000000000') {
    return {}
  }
  
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  }
}

/**
 * Redact sensitive fields from log context
 */
function redactSensitive(ctx: LogContext): LogContext {
  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'authorization',
    'cookie',
    'creditCard',
    'ssn',
  ]
  
  const redacted = { ...ctx }
  
  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]'
    }
    // Also check nested objects
    for (const key of Object.keys(redacted)) {
      const value = redacted[key]
      if (typeof value === 'object' && value !== null) {
        const nested = value as Record<string, unknown>
        if (field in nested) {
          nested[field] = '[REDACTED]'
        }
      }
    }
  }
  
  return redacted
}

/**
 * Create a wrapper around pino logger that implements StructuredLogger
 */
function wrapPinoLogger(pinoLogger: Logger, serviceTags: ServiceTags): StructuredLogger {
  return {
    info(message: string, ctx?: LogContext) {
      const traceCtx = getTraceContext()
      pinoLogger.info({ ...redactSensitive(ctx || {}), ...traceCtx }, message)
    },
    
    warn(message: string, ctx?: LogContext) {
      const traceCtx = getTraceContext()
      pinoLogger.warn({ ...redactSensitive(ctx || {}), ...traceCtx }, message)
    },
    
    error(message: string, error?: Error, ctx?: LogContext) {
      const traceCtx = getTraceContext()
      pinoLogger.error(
        {
          ...redactSensitive(ctx || {}),
          ...traceCtx,
          err: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : undefined,
        },
        message
      )
    },
    
    debug(message: string, ctx?: LogContext) {
      const traceCtx = getTraceContext()
      pinoLogger.debug({ ...redactSensitive(ctx || {}), ...traceCtx }, message)
    },
    
    fatal(message: string, error?: Error, ctx?: LogContext) {
      const traceCtx = getTraceContext()
      pinoLogger.fatal(
        {
          ...redactSensitive(ctx || {}),
          ...traceCtx,
          err: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : undefined,
        },
        message
      )
    },
    
    child(bindings: Record<string, unknown>): StructuredLogger {
      return wrapPinoLogger(pinoLogger.child(bindings), serviceTags)
    },
    
    flush() {
      pinoLogger.flush()
    },
  }
}

/**
 * Create a structured logger with OpenTelemetry trace context injection
 */
export function createLogger(options: CreateLoggerOptions = {}): StructuredLogger {
  const serviceTags = getServiceTags()
  const isDevelopment = serviceTags.environment === 'development'
  
  const pinoOptions: LoggerOptions = {
    level: options.level || (isDevelopment ? 'debug' : 'info'),
    base: {
      service: options.serviceName || serviceTags.serviceName,
      env: serviceTags.environment,
      version: serviceTags.version,
      ...(serviceTags.release && { release: serviceTags.release }),
      ...(options.bindings || {}),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    // Enable serializers for common objects
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  }
  
  // Use pretty printing in development if explicitly enabled or by default in dev
  const usePretty = options.pretty ?? isDevelopment
  
  let logger: Logger
  
  if (usePretty && !options.destination) {
    // Dynamic import for pino-pretty to avoid bundling in production
    const prettyStream = pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname',
        messageFormat: '{msg}',
        singleLine: false,
      },
    })
    logger = pino(pinoOptions, prettyStream)
  } else if (options.destination) {
    logger = pino(pinoOptions, options.destination)
  } else {
    logger = pino(pinoOptions)
  }
  
  return wrapPinoLogger(logger, serviceTags)
}

/**
 * Global logger instance - call initLogger() to configure
 */
let globalLogger: StructuredLogger | null = null

/**
 * Initialize the global logger
 */
export function initLogger(options?: CreateLoggerOptions): StructuredLogger {
  globalLogger = createLogger(options)
  return globalLogger
}

/**
 * Get the global logger (auto-initializes with defaults if not configured)
 */
export function getLogger(): StructuredLogger {
  if (!globalLogger) {
    globalLogger = createLogger()
  }
  return globalLogger
}

export type { Logger as PinoLogger } from 'pino'

