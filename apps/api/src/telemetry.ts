/**
 * OpenTelemetry initialization
 * MUST be imported BEFORE any other application code
 * This ensures instrumentation is applied before modules are loaded
 */

import { initTelemetry } from '@psy/observability/node'

// Initialize telemetry before anything else
initTelemetry({
  serviceName: 'psy-api',
  // OTLP endpoints are configured via environment variables:
  // OTEL_EXPORTER_OTLP_TRACES_ENDPOINT (e.g., http://localhost:4318/v1/traces)
  // OTEL_EXPORTER_OTLP_METRICS_ENDPOINT (e.g., http://localhost:4318/v1/metrics)
  debug: process.env.OTEL_DEBUG === 'true',
  attributes: {
    'service.namespace': 'psy',
  },
})

