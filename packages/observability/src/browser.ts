/**
 * Browser-side observability (RUM, error tracking)
 * Uses Grafana Faro for comprehensive frontend monitoring
 */

import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'
import type { Faro, MetaSession, TransportItem } from '@grafana/faro-web-sdk'

export interface BrowserObservabilityConfig {
  /** Application name */
  appName: string
  /** Application version */
  appVersion: string
  /** Environment */
  environment: string
  /** Grafana Faro collector URL */
  faroUrl?: string
  /** Sentry DSN for error tracking */
  sentryDsn?: string
  /** Enable session recording */
  sessionTracking?: boolean
  /** Custom attributes */
  attributes?: Record<string, string>
  /** Enable console instrumentation */
  instrumentConsole?: boolean
  /** Enable performance monitoring */
  instrumentPerformance?: boolean
  /** Sampling rate (0-1) */
  sampleRate?: number
  /** Before send hook */
  beforeSend?: (item: TransportItem) => TransportItem | null
}

let faroInstance: Faro | null = null

/**
 * Initialize Grafana Faro for browser monitoring
 */
export function initBrowserObservability(config: BrowserObservabilityConfig): Faro | null {
  if (typeof window === 'undefined') {
    console.warn('[BrowserObservability] Not running in browser, skipping initialization')
    return null
  }

  if (faroInstance) {
    console.warn('[BrowserObservability] Already initialized')
    return faroInstance
  }

  if (!config.faroUrl) {
    console.warn('[BrowserObservability] No Faro URL provided, skipping initialization')
    return null
  }

  try {
    faroInstance = initializeFaro({
      url: config.faroUrl,
      app: {
        name: config.appName,
        version: config.appVersion,
        environment: config.environment,
      },

      instrumentations: [
        // Default web instrumentations
        ...getWebInstrumentations({
          captureConsole: config.instrumentConsole ?? true,
        }),
        // Distributed tracing
        new TracingInstrumentation(),
      ],

      // Session tracking
      sessionTracking: {
        enabled: config.sessionTracking ?? true,
        persistent: true,
      },

      // Deduplication
      dedupe: config.sampleRate !== undefined,

      // Before send hook for filtering
      beforeSend: config.beforeSend,
    })

    console.log(`[BrowserObservability] Faro initialized for ${config.appName} (${config.environment})`)
    return faroInstance
  } catch (error) {
    console.error('[BrowserObservability] Failed to initialize Faro:', error)
    return null
  }
}

/**
 * Get the Faro instance
 */
export function getFaro(): Faro | null {
  return faroInstance
}

/**
 * Push a custom event
 */
export function pushEvent(name: string, attributes?: Record<string, string>): void {
  if (!faroInstance) return
  faroInstance.api.pushEvent(name, attributes)
}

/**
 * Push an error
 */
export function pushError(error: Error, context?: Record<string, string>): void {
  if (!faroInstance) return
  faroInstance.api.pushError(error, { context })
}

/**
 * Push a log message
 */
export function pushLog(
  message: string,
  level?: string,
  context?: Record<string, string>
): void {
  if (!faroInstance) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  faroInstance.api.pushLog([message], { level: level as any, context })
}

/**
 * Set user information
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  if (!faroInstance) return
  if (user) {
    faroInstance.api.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    })
  } else {
    faroInstance.api.resetUser()
  }
}

/**
 * Get current session information
 */
export function getSession(): MetaSession | undefined {
  return faroInstance?.api.getSession()
}

/**
 * Push a custom measurement
 */
export function pushMeasurement(name: string, value: number): void {
  if (!faroInstance) return
  faroInstance.api.pushMeasurement({
    type: name,
    values: {
      value,
    },
  })
}

/**
 * Create a manual span for performance tracking
 */
export function createBrowserSpan(name: string): { end: () => void } {
  const start = performance.now()
  return {
    end: () => {
      const duration = performance.now() - start
      pushMeasurement(`custom.${name}`, duration)
    },
  }
}

/**
 * Track page navigation
 */
export function trackNavigation(path: string): void {
  if (!faroInstance) return
  pushEvent('navigation', { path })
}

/**
 * Track user interaction
 */
export function trackInteraction(action: string, target?: string, value?: string): void {
  if (!faroInstance) return
  pushEvent('interaction', {
    action,
    ...(target && { target }),
    ...(value && { value }),
  })
}

/**
 * Get trace context for propagation to backend
 */
export function getTraceContext(): { traceparent: string } | null {
  // Generate W3C trace context
  // In a real implementation, this would come from active OpenTelemetry span
  const traceId = generateTraceId()
  const spanId = generateSpanId()
  const traceparent = `00-${traceId}-${spanId}-01`
  return { traceparent }
}

function generateTraceId(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateSpanId(): string {
  const array = new Uint8Array(8)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Re-export types
export type { Faro, MetaSession, TransportItem } from '@grafana/faro-web-sdk'

