/**
 * Node.js specific exports (for API/backend)
 * Import as: import { ... } from '@psy/observability/node'
 */

// Telemetry (OpenTelemetry)
export {
  initTelemetry,
  getTelemetrySDK,
  shutdownTelemetry,
  createSpan,
  getTraceContext,
  addSpanAttributes,
  recordSpanException,
  trace,
  context,
  SpanStatusCode,
} from './telemetry'
export type { TelemetryConfig, Span } from './telemetry'

// Structured logging (Pino)
export {
  createLogger,
  initLogger,
  getLogger,
} from './logger'
export type { StructuredLogger, CreateLoggerOptions, LogContext } from './logger'

// Metrics (Prometheus)
export {
  initMetrics,
  getMetrics,
  getRegistry,
  recordHttpRequest,
  recordError,
  trackActiveRequest,
  createCounter,
  createHistogram,
  createGauge,
  Counter,
  Histogram,
  Gauge,
  Registry,
} from './metrics'
export type { MetricsConfig, AppMetrics, HttpMetrics } from './metrics'

// Sentry
export {
  initSentry,
  isSentryInitialized,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startSpan as startSentrySpan,
  flushSentry,
  closeSentry,
  Sentry,
} from './sentry'
export type { SentryConfig } from './sentry'

// Tags and utilities
export {
  MetricNames,
  MetricLabels,
  LogLevels,
  StatusCategory,
  generateRequestId,
  getServiceTags,
} from './tags'
export type { ServiceTags, RequestTags, ErrorTags } from './tags'

