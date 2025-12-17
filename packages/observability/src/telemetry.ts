import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { Resource } from '@opentelemetry/resources'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'

// deployment.environment.name is not in stable semconv yet
const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core'
import { diag, DiagConsoleLogger, DiagLogLevel, trace, context, SpanStatusCode, Span } from '@opentelemetry/api'
import { getServiceTags } from './tags'

export interface TelemetryConfig {
  /** Service name for tracing */
  serviceName?: string
  /** OTLP endpoint for traces (e.g., http://localhost:4318/v1/traces) */
  traceEndpoint?: string
  /** OTLP endpoint for metrics (e.g., http://localhost:4318/v1/metrics) */
  metricEndpoint?: string
  /** Enable console debug output */
  debug?: boolean
  /** Additional resource attributes */
  attributes?: Record<string, string>
  /** Disable specific instrumentations */
  disabledInstrumentations?: string[]
  /** Metrics export interval in milliseconds */
  metricsInterval?: number
}

let sdk: NodeSDK | null = null

/**
 * Initialize OpenTelemetry SDK
 * IMPORTANT: Call this BEFORE importing any instrumented modules (e.g., NestJS)
 */
export function initTelemetry(config: TelemetryConfig = {}): NodeSDK {
  if (sdk) {
    console.warn('[Telemetry] SDK already initialized, returning existing instance')
    return sdk
  }

  const serviceTags = getServiceTags()
  const serviceName = config.serviceName || serviceTags.serviceName

  // Enable debug logging if requested
  if (config.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)
  }

  // Build resource with service information
  const resource = new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceTags.version,
    [ATTR_DEPLOYMENT_ENVIRONMENT]: serviceTags.environment,
    ...(serviceTags.release && { 'service.release': serviceTags.release }),
    ...(serviceTags.region && { 'cloud.region': serviceTags.region }),
    ...config.attributes,
  })

  // Configure trace exporter (defaults to OTLP HTTP)
  const traceEndpoint = config.traceEndpoint || process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
  const traceExporter = traceEndpoint
    ? new OTLPTraceExporter({ url: traceEndpoint })
    : undefined

  // Configure metric exporter
  const metricEndpoint = config.metricEndpoint || process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT
  const metricReader = metricEndpoint
    ? new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({ url: metricEndpoint }),
        exportIntervalMillis: config.metricsInterval || 60000,
      })
    : undefined

  // Configure instrumentations
  const instrumentations = [
    // HTTP instrumentation with custom attributes
    new HttpInstrumentation({
      requestHook: (span, request) => {
        // Add custom attributes to HTTP client requests
        if ('headers' in request && typeof request.headers === 'object') {
          const headers = request.headers as Record<string, string | string[] | undefined>
          if (headers['x-request-id']) {
            span.setAttribute('http.request_id', String(headers['x-request-id']))
          }
        }
      },
      responseHook: (span, response) => {
        // Add response attributes
        if ('statusCode' in response) {
          const statusCode = response.statusCode as number
          if (statusCode >= 400) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP ${statusCode}`,
            })
          }
        }
      },
    }),
    // NestJS instrumentation
    new NestInstrumentation(),
    // Auto-instrumentations for common libraries
    ...getNodeAutoInstrumentations({
      // Disable fs instrumentation to reduce noise
      '@opentelemetry/instrumentation-fs': { enabled: false },
      // Configure HTTP instrumentation is already added above
      '@opentelemetry/instrumentation-http': { enabled: false },
      // Disable DNS to reduce noise
      '@opentelemetry/instrumentation-dns': { enabled: false },
    }),
  ]

  // Create and start SDK
  sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    instrumentations,
  })

  // Handle graceful shutdown
  const shutdown = async () => {
    try {
      await sdk?.shutdown()
      console.log('[Telemetry] SDK shutdown complete')
    } catch (err) {
      console.error('[Telemetry] Error during shutdown:', err)
    }
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  // Start the SDK
  sdk.start()
  console.log(`[Telemetry] SDK initialized for service: ${serviceName}`)

  return sdk
}

/**
 * Get the current SDK instance
 */
export function getTelemetrySDK(): NodeSDK | null {
  return sdk
}

/**
 * Shutdown telemetry SDK
 */
export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown()
    sdk = null
  }
}

/**
 * Create a custom span for manual instrumentation
 */
export function createSpan<T>(
  name: string,
  fn: (span: Span) => T | Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = trace.getTracer('app')
  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
          span.setAttribute(key, value)
        }
      }
      const result = await fn(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      })
      if (error instanceof Error) {
        span.recordException(error)
      }
      throw error
    } finally {
      span.end()
    }
  })
}

/**
 * Get current trace context for propagation
 */
export function getTraceContext(): { traceId: string; spanId: string } | null {
  const span = trace.getSpan(context.active())
  if (!span) return null

  const spanContext = span.spanContext()
  if (!spanContext.traceId || spanContext.traceId === '00000000000000000000000000000000') {
    return null
  }

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  }
}

/**
 * Add attributes to the current span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
  const span = trace.getSpan(context.active())
  if (span) {
    for (const [key, value] of Object.entries(attributes)) {
      span.setAttribute(key, value)
    }
  }
}

/**
 * Record an exception on the current span
 */
export function recordSpanException(error: Error): void {
  const span = trace.getSpan(context.active())
  if (span) {
    span.recordException(error)
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    })
  }
}

export { trace, context, SpanStatusCode } from '@opentelemetry/api'
export type { Span } from '@opentelemetry/api'

