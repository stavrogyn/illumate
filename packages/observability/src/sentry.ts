import * as Sentry from '@sentry/node'
import type { NodeOptions } from '@sentry/node'
import { getServiceTags } from './tags'

export interface SentryConfig {
  /** Sentry DSN */
  dsn: string
  /** Environment override */
  environment?: string
  /** Release version override */
  release?: string
  /** Enable debug mode */
  debug?: boolean
  /** Sample rate for errors (0.0 to 1.0) */
  sampleRate?: number
  /** Sample rate for transactions (0.0 to 1.0) */
  tracesSampleRate?: number
  /** Enable profiling */
  profilesSampleRate?: number
  /** Additional tags */
  tags?: Record<string, string>
  /** Integrations to add */
  integrations?: NodeOptions['integrations']
  /** Before send hook for filtering/modifying events */
  beforeSend?: NodeOptions['beforeSend']
}

let sentryInitialized = false

/**
 * Initialize Sentry for Node.js (NestJS backend)
 */
export function initSentry(config: SentryConfig): void {
  if (sentryInitialized) {
    console.warn('[Sentry] Already initialized')
    return
  }

  const serviceTags = getServiceTags()

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment || serviceTags.environment,
    release: config.release || serviceTags.release || serviceTags.version,
    debug: config.debug || false,
    sampleRate: config.sampleRate ?? 1.0,
    tracesSampleRate: config.tracesSampleRate ?? (serviceTags.environment === 'production' ? 0.1 : 1.0),
    profilesSampleRate: config.profilesSampleRate ?? 0,
    
    // Set initial scope tags
    initialScope: {
      tags: {
        service: serviceTags.serviceName,
        ...config.tags,
      },
    },

    // Integrations
    integrations: [
      // HTTP integration for tracking outgoing requests
      Sentry.httpIntegration(),
      // Add custom integrations
      ...(Array.isArray(config.integrations) ? config.integrations : []),
    ],

    // Filter sensitive data
    beforeSend: config.beforeSend || ((event) => {
      // Remove sensitive headers
      if (event.request?.headers) {
        const headers = event.request.headers
        delete headers['authorization']
        delete headers['cookie']
        delete headers['x-api-key']
      }
      return event
    }),

    // Breadcrumb filter
    beforeBreadcrumb: (breadcrumb) => {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null
      }
      return breadcrumb
    },
  })

  sentryInitialized = true
  console.log(`[Sentry] Initialized for ${serviceTags.serviceName} (${serviceTags.environment})`)
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized(): boolean {
  return sentryInitialized
}

/**
 * Capture exception with additional context
 */
export function captureException(
  error: Error,
  context?: {
    userId?: string
    requestId?: string
    traceId?: string
    tags?: Record<string, string>
    extra?: Record<string, unknown>
  }
): string {
  return Sentry.captureException(error, (scope) => {
    if (context?.userId) {
      scope.setUser({ id: context.userId })
    }
    if (context?.requestId) {
      scope.setTag('request_id', context.requestId)
    }
    if (context?.traceId) {
      scope.setTag('trace_id', context.traceId)
    }
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value)
      }
    }
    if (context?.extra) {
      scope.setExtras(context.extra)
    }
    return scope
  })
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
): string {
  return Sentry.captureMessage(message, level)
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  Sentry.setUser(user)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  message: string
  category?: string
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  data?: Record<string, unknown>
}): void {
  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'app',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Create a custom span for performance monitoring
 */
export async function startSpan<T>(
  name: string,
  operation: string,
  callback: () => T | Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: operation,
    },
    async () => callback()
  )
}

/**
 * Flush Sentry events (useful before process exit)
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout)
}

/**
 * Close Sentry client
 */
export async function closeSentry(timeout = 2000): Promise<boolean> {
  return Sentry.close(timeout)
}

// Re-export Sentry for advanced usage
export { Sentry }

