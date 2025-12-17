import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
  register as globalRegistry,
} from 'prom-client'
import { MetricNames, MetricLabels, StatusCategory, getServiceTags } from './tags'

export interface MetricsConfig {
  /** Custom registry (defaults to global) */
  registry?: Registry
  /** Service name prefix for metrics */
  prefix?: string
  /** Enable default Node.js metrics */
  collectDefaultMetrics?: boolean
  /** Default metrics collection interval */
  defaultMetricsInterval?: number
  /** Custom labels to add to all metrics */
  defaultLabels?: Record<string, string>
}

export interface HttpMetrics {
  /** Increment request counter */
  requestsTotal: Counter<string>
  /** Observe request duration */
  requestDuration: Histogram<string>
  /** Current active requests */
  activeRequests: Gauge<string>
}

export interface AppMetrics extends HttpMetrics {
  /** Error counter */
  errorsTotal: Counter<string>
  /** Application info gauge */
  appInfo: Gauge<string>
}

let metricsInstance: AppMetrics | null = null
let metricsRegistry: Registry = globalRegistry

/**
 * Initialize Prometheus metrics
 */
export function initMetrics(config: MetricsConfig = {}): AppMetrics {
  if (metricsInstance) {
    return metricsInstance
  }

  const serviceTags = getServiceTags()
  const registry = config.registry || globalRegistry
  metricsRegistry = registry

  // Set default labels
  const defaultLabels = {
    [MetricLabels.SERVICE]: serviceTags.serviceName,
    [MetricLabels.ENVIRONMENT]: serviceTags.environment,
    ...(config.defaultLabels || {}),
  }
  registry.setDefaultLabels(defaultLabels)

  // Collect default Node.js metrics if enabled
  if (config.collectDefaultMetrics !== false) {
    collectDefaultMetrics({
      register: registry,
      prefix: config.prefix || '',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    })
  }

  // HTTP requests counter
  const requestsTotal = new Counter({
    name: MetricNames.HTTP_REQUESTS_TOTAL,
    help: 'Total number of HTTP requests',
    labelNames: [MetricLabels.METHOD, MetricLabels.ROUTE, MetricLabels.STATUS_CODE, MetricLabels.STATUS],
    registers: [registry],
  })

  // HTTP request duration histogram
  const requestDuration = new Histogram({
    name: MetricNames.HTTP_REQUEST_DURATION_SECONDS,
    help: 'HTTP request duration in seconds',
    labelNames: [MetricLabels.METHOD, MetricLabels.ROUTE, MetricLabels.STATUS_CODE],
    // Buckets for response times (in seconds): 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s, 10s
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  })

  // Active requests gauge
  const activeRequests = new Gauge({
    name: 'http_requests_in_flight',
    help: 'Number of HTTP requests currently being processed',
    labelNames: [MetricLabels.METHOD],
    registers: [registry],
  })

  // Error counter
  const errorsTotal = new Counter({
    name: MetricNames.APP_ERRORS_TOTAL,
    help: 'Total number of application errors',
    labelNames: [MetricLabels.ERROR_TYPE, MetricLabels.ROUTE],
    registers: [registry],
  })

  // App info gauge (for version tracking)
  const appInfo = new Gauge({
    name: MetricNames.APP_INFO,
    help: 'Application information',
    labelNames: [MetricLabels.VERSION, 'release'],
    registers: [registry],
  })

  // Set app info (always 1, but labels provide version info)
  appInfo.set(
    {
      [MetricLabels.VERSION]: serviceTags.version,
      release: serviceTags.release || 'unknown',
    },
    1
  )

  metricsInstance = {
    requestsTotal,
    requestDuration,
    activeRequests,
    errorsTotal,
    appInfo,
  }

  return metricsInstance
}

/**
 * Get initialized metrics instance
 */
export function getMetrics(): AppMetrics {
  if (!metricsInstance) {
    return initMetrics()
  }
  return metricsInstance
}

/**
 * Get the metrics registry
 */
export function getRegistry(): Registry {
  return metricsRegistry
}

/**
 * Record HTTP request metrics
 */
export function recordHttpRequest(params: {
  method: string
  route: string
  statusCode: number
  duration: number // in milliseconds
}): void {
  const metrics = getMetrics()
  const { method, route, statusCode, duration } = params
  const status = StatusCategory.fromCode(statusCode)

  // Increment counter
  metrics.requestsTotal.inc({
    [MetricLabels.METHOD]: method,
    [MetricLabels.ROUTE]: route,
    [MetricLabels.STATUS_CODE]: statusCode.toString(),
    [MetricLabels.STATUS]: status,
  })

  // Record duration (convert ms to seconds)
  metrics.requestDuration.observe(
    {
      [MetricLabels.METHOD]: method,
      [MetricLabels.ROUTE]: route,
      [MetricLabels.STATUS_CODE]: statusCode.toString(),
    },
    duration / 1000
  )
}

/**
 * Record an error
 */
export function recordError(params: { errorType: string; route?: string }): void {
  const metrics = getMetrics()
  metrics.errorsTotal.inc({
    [MetricLabels.ERROR_TYPE]: params.errorType,
    [MetricLabels.ROUTE]: params.route || 'unknown',
  })
}

/**
 * Track active request (call start when request begins, end when it completes)
 */
export function trackActiveRequest(method: string): () => void {
  const metrics = getMetrics()
  metrics.activeRequests.inc({ [MetricLabels.METHOD]: method })

  return () => {
    metrics.activeRequests.dec({ [MetricLabels.METHOD]: method })
  }
}

/**
 * Create a custom counter metric
 */
export function createCounter(name: string, help: string, labelNames: string[]): Counter<string> {
  return new Counter({
    name,
    help,
    labelNames,
    registers: [metricsRegistry],
  })
}

/**
 * Create a custom histogram metric
 */
export function createHistogram(
  name: string,
  help: string,
  labelNames: string[],
  buckets?: number[]
): Histogram<string> {
  return new Histogram({
    name,
    help,
    labelNames,
    buckets: buckets || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [metricsRegistry],
  })
}

/**
 * Create a custom gauge metric
 */
export function createGauge(name: string, help: string, labelNames: string[]): Gauge<string> {
  return new Gauge({
    name,
    help,
    labelNames,
    registers: [metricsRegistry],
  })
}

// Export prom-client types for custom metrics
export { Counter, Histogram, Gauge, Registry } from 'prom-client'

