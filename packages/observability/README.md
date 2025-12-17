# @psy/observability

Unified observability layer for PSY monorepo.

## Features

- **OpenTelemetry Tracing** - Distributed tracing with automatic instrumentation
- **Structured Logging** - Pino-based JSON logs with trace context
- **Prometheus Metrics** - HTTP and custom application metrics
- **Sentry Integration** - Error tracking and performance monitoring
- **Browser RUM** - Grafana Faro for Web Vitals and frontend monitoring

## Installation

```bash
yarn add @psy/observability
```

## Usage

### Backend (NestJS)

```typescript
// 1. Initialize telemetry FIRST in your entry point
// src/telemetry.ts
import { initTelemetry } from '@psy/observability/node'

initTelemetry({
  serviceName: 'my-api',
  traceEndpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
})

// 2. Import telemetry before other modules
// src/main.ts
import './telemetry'
import { NestFactory } from '@nestjs/core'
// ...

// 3. Use the NestJS module
// src/app.module.ts
import { ObservabilityModule } from '@psy/observability/nestjs'

@Module({
  imports: [ObservabilityModule.forRootAsync()],
})
export class AppModule {}
```

### Frontend (Next.js)

```typescript
// src/app/layout.tsx
import { ObservabilityProvider } from '@/lib/observability/provider'

const config = {
  faroUrl: process.env.NEXT_PUBLIC_FARO_URL,
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  version: '1.0.0',
}

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ObservabilityProvider config={config}>
          {children}
        </ObservabilityProvider>
      </body>
    </html>
  )
}
```

## API Reference

### Node.js (`@psy/observability/node`)

#### Telemetry

```typescript
import { initTelemetry, createSpan, getTraceContext } from '@psy/observability/node'

// Initialize once at startup
initTelemetry({ serviceName: 'my-service' })

// Create custom spans
await createSpan('processOrder', async (span) => {
  span.setAttribute('order.id', orderId)
  // ... business logic
})

// Get trace context for propagation
const ctx = getTraceContext() // { traceId, spanId }
```

#### Logger

```typescript
import { createLogger, getLogger } from '@psy/observability/node'

const logger = createLogger({ serviceName: 'my-service' })

logger.info('User logged in', { userId: '123' })
logger.error('Failed to process', error, { requestId })
```

#### Metrics

```typescript
import { initMetrics, recordHttpRequest, createCounter } from '@psy/observability/node'

// Initialize metrics
initMetrics()

// Record HTTP request
recordHttpRequest({
  method: 'GET',
  route: '/api/users',
  statusCode: 200,
  duration: 45,
})

// Create custom counter
const ordersCounter = createCounter('orders_total', 'Total orders', ['status'])
ordersCounter.inc({ status: 'completed' })
```

#### Sentry

```typescript
import { initSentry, captureException } from '@psy/observability/node'

initSentry({ dsn: process.env.SENTRY_DSN })

try {
  // ...
} catch (error) {
  captureException(error, { userId, requestId })
}
```

### Browser (`@psy/observability/browser`)

```typescript
import {
  initBrowserObservability,
  pushEvent,
  pushError,
  trackNavigation,
} from '@psy/observability/browser'

// Initialize Faro
initBrowserObservability({
  appName: 'my-app',
  appVersion: '1.0.0',
  environment: 'production',
  faroUrl: 'https://faro-collector.example.com/collect',
})

// Track custom events
pushEvent('purchase', { productId: '123', price: '99.99' })

// Track errors
pushError(new Error('Something went wrong'), { context: 'checkout' })

// Track navigation
trackNavigation('/checkout')
```

### NestJS Module (`@psy/observability/nestjs`)

```typescript
import { ObservabilityModule, LoggerService, InjectLogger } from '@psy/observability/nestjs'

// Module registration
@Module({
  imports: [
    // Auto-configures from environment
    ObservabilityModule.forRootAsync(),

    // Or with explicit config
    ObservabilityModule.forRoot({
      metrics: true,
      sentry: { dsn: '...' },
      globalInterceptor: true,
      globalExceptionFilter: true,
    }),
  ],
})
export class AppModule {}

// Using the logger
@Injectable()
export class MyService {
  constructor(@InjectLogger() private readonly logger: LoggerService) {}

  async doSomething() {
    this.logger.info('Starting operation', { userId: '123' })
  }
}
```

## Tags & Constants

```typescript
import { MetricNames, MetricLabels, generateRequestId, getServiceTags } from '@psy/observability'

// Standard metric names
MetricNames.HTTP_REQUESTS_TOTAL // 'http_requests_total'
MetricNames.HTTP_REQUEST_DURATION_SECONDS // 'http_request_duration_seconds'

// Standard labels
MetricLabels.METHOD // 'method'
MetricLabels.ROUTE // 'route'
MetricLabels.STATUS_CODE // 'status_code'

// Utilities
const requestId = generateRequestId() // 'req_lx8k2j_a7b3c5d'
const tags = getServiceTags() // { serviceName, environment, version, release }
```

## Environment Variables

| Variable                              | Description               | Default           |
| ------------------------------------- | ------------------------- | ----------------- |
| `SERVICE_NAME`                        | Service identifier        | from package.json |
| `NODE_ENV`                            | Environment               | development       |
| `APP_VERSION`                         | Application version       | 0.0.0             |
| `GIT_COMMIT_SHA`                      | Git commit for releases   | -                 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`  | OTLP trace endpoint       | -                 |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | OTLP metrics endpoint     | -                 |
| `OTEL_DEBUG`                          | Enable OTel debug logging | false             |
| `SENTRY_DSN`                          | Sentry DSN                | -                 |

## Best Practices

1. **Initialize telemetry first** - Import telemetry.ts before any other modules
2. **Use structured logging** - Always pass context objects, not string interpolation
3. **Add trace context** - Include requestId, traceId in all logs
4. **Use parameterized routes** - `/users/:id` not `/users/123` for metrics
5. **Redact sensitive data** - Don't log passwords, tokens, PII
