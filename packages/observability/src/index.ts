/**
 * @psy/observability - Unified observability layer
 *
 * This package provides standardized observability across all services:
 * - OpenTelemetry for distributed tracing
 * - Pino for structured logging with trace context
 * - Prometheus metrics
 * - Sentry for error tracking
 * - Grafana Faro for browser RUM
 *
 * Usage:
 * - Backend (NestJS): import from '@psy/observability/node'
 * - Frontend (Next.js): import from '@psy/observability/browser'
 * - Shared utilities: import from '@psy/observability'
 */

// Shared tags and utilities (work in both Node and Browser)
export {
  MetricNames,
  MetricLabels,
  LogLevels,
  StatusCategory,
  generateRequestId,
  getServiceTags,
} from './tags'

export type {
  ServiceTags,
  RequestTags,
  ErrorTags,
} from './tags'

// Export LogContext type from logger
export type { LogContext } from './logger'

