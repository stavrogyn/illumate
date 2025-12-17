/**
 * Standardized observability tags used across all services
 * These ensure consistency in metrics, traces, and logs
 */

export interface ServiceTags {
  /** Service name (e.g., 'psy-api', 'psy-web') */
  serviceName: string
  /** Environment (e.g., 'development', 'staging', 'production') */
  environment: string
  /** Application version from package.json */
  version: string
  /** Git commit SHA for release tracking */
  release?: string
  /** Deployment region if applicable */
  region?: string
}

export interface RequestTags {
  /** Unique request identifier */
  requestId: string
  /** OpenTelemetry trace ID */
  traceId?: string
  /** OpenTelemetry span ID */
  spanId?: string
  /** User ID if authenticated */
  userId?: string
  /** Tenant/organization ID if multi-tenant */
  tenantId?: string
  /** HTTP method */
  method?: string
  /** HTTP route (parameterized path) */
  route?: string
  /** HTTP path (actual path) */
  path?: string
  /** HTTP status code */
  statusCode?: number
  /** Request duration in milliseconds */
  duration?: number
  /** Client IP address */
  ip?: string
  /** User agent string */
  userAgent?: string
}

export interface ErrorTags extends RequestTags {
  /** Error name/type */
  errorName: string
  /** Error message */
  errorMessage: string
  /** Error stack trace (be careful with PII) */
  errorStack?: string
}

/**
 * Semantic conventions for metric names
 * Following OpenTelemetry and Prometheus naming conventions
 */
export const MetricNames = {
  // HTTP metrics
  HTTP_REQUESTS_TOTAL: 'http_requests_total',
  HTTP_REQUEST_DURATION_SECONDS: 'http_request_duration_seconds',
  HTTP_REQUEST_SIZE_BYTES: 'http_request_size_bytes',
  HTTP_RESPONSE_SIZE_BYTES: 'http_response_size_bytes',
  
  // Database metrics
  DB_QUERY_DURATION_SECONDS: 'db_query_duration_seconds',
  DB_POOL_CONNECTIONS: 'db_pool_connections',
  DB_POOL_IDLE: 'db_pool_idle',
  DB_POOL_WAITING: 'db_pool_waiting',
  
  // Application metrics
  APP_INFO: 'app_info',
  APP_UPTIME_SECONDS: 'app_uptime_seconds',
  APP_ERRORS_TOTAL: 'app_errors_total',
  
  // Business metrics
  AUTH_LOGIN_TOTAL: 'auth_login_total',
  AUTH_REGISTRATION_TOTAL: 'auth_registration_total',
  SESSIONS_CREATED_TOTAL: 'sessions_created_total',
  CLIENTS_CREATED_TOTAL: 'clients_created_total',
} as const

/**
 * Semantic conventions for log levels
 */
export const LogLevels = {
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50,
  FATAL: 60,
} as const

/**
 * Standard label names for Prometheus metrics
 */
export const MetricLabels = {
  SERVICE: 'service',
  ENVIRONMENT: 'env',
  VERSION: 'version',
  METHOD: 'method',
  ROUTE: 'route',
  STATUS: 'status',
  STATUS_CODE: 'status_code',
  ERROR_TYPE: 'error_type',
} as const

/**
 * HTTP status code categories for metrics
 */
export const StatusCategory = {
  fromCode: (code: number): string => {
    if (code >= 200 && code < 300) return '2xx'
    if (code >= 300 && code < 400) return '3xx'
    if (code >= 400 && code < 500) return '4xx'
    if (code >= 500) return '5xx'
    return 'unknown'
  },
} as const

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `req_${timestamp}_${random}`
}

/**
 * Extract service tags from environment
 */
export function getServiceTags(): ServiceTags {
  return {
    serviceName: process.env.SERVICE_NAME || process.env.npm_package_name || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || process.env.APP_VERSION || '0.0.0',
    release: process.env.GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA,
    region: process.env.REGION || process.env.AWS_REGION,
  }
}

