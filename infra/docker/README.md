# Observability Infrastructure

Local observability stack for development and demonstration.

## Quick Start

```bash
# Start the observability stack
docker compose -f infra/docker/docker-compose.observability.yml up -d

# View logs
docker compose -f infra/docker/docker-compose.observability.yml logs -f

# Stop the stack
docker compose -f infra/docker/docker-compose.observability.yml down

# Clean up volumes
docker compose -f infra/docker/docker-compose.observability.yml down -v
```

## Services

| Service         | URL                   | Description                |
| --------------- | --------------------- | -------------------------- |
| Grafana         | http://localhost:3001 | Dashboards (admin/admin)   |
| VictoriaMetrics | http://localhost:8428 | Time series metrics        |
| Prometheus      | http://localhost:9090 | Metrics scraper (fallback) |
| Loki            | http://localhost:3100 | Log aggregation            |
| Tempo           | http://localhost:3200 | Distributed tracing        |
| OTEL Collector  | http://localhost:4318 | Telemetry ingestion (HTTP) |
| OTEL Collector  | http://localhost:4317 | Telemetry ingestion (gRPC) |

## Dashboards

Pre-configured dashboards in Grafana:

1. **PSY Application Overview** - High-level health and metrics
2. **PSY API Performance** - Backend latency, throughput, errors
3. **PSY Web Vitals (RUM)** - Frontend performance metrics

## Architecture

```
┌─────────────┐     ┌─────────────┐
│   PSY API   │     │   PSY Web   │
│  (NestJS)   │     │  (Next.js)  │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │ OTLP              │ RUM/Faro
       ▼                   ▼
┌──────────────────────────────────┐
│      OTEL Collector              │
│  (receives, processes, exports)  │
└────┬────────────┬────────────┬───┘
     │            │            │
     ▼            ▼            ▼
┌────────┐  ┌─────────┐  ┌─────────┐
│ Tempo  │  │  Loki   │  │Victoria │
│(Traces)│  │ (Logs)  │  │Metrics  │
└────┬───┘  └────┬────┘  └────┬────┘
     │           │            │
     └───────────┼────────────┘
                 ▼
          ┌───────────┐
          │  Grafana  │
          │(Visualize)│
          └───────────┘
```

## Configuration

### API Configuration

Set these environment variables in `apps/api/.env`:

```bash
# OpenTelemetry
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics

# Optional: Enable debug logging
OTEL_DEBUG=true

# Optional: Sentry
SENTRY_DSN=your-sentry-dsn
USE_SENTRY=true
```

### Web Configuration

Set these environment variables in `apps/web/.env`:

```bash
# Grafana Faro RUM
NEXT_PUBLIC_FARO_URL=your-faro-collector-url

# Optional: Sentry
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## Cloud Services (Production)

For production, use cloud services:

| Service         | Cloud Alternative                     |
| --------------- | ------------------------------------- |
| VictoriaMetrics | VictoriaMetrics Cloud / Grafana Cloud |
| Loki            | Grafana Cloud Logs                    |
| Tempo           | Grafana Cloud Traces                  |
| Grafana         | Grafana Cloud                         |
| Sentry          | Sentry.io                             |

## Useful Queries

### PromQL (Metrics)

```promql
# Request rate
sum(rate(http_requests_total{service="psy-api"}[5m]))

# Error rate
sum(rate(http_requests_total{service="psy-api",status=~"5.."}[5m]))
/ sum(rate(http_requests_total{service="psy-api"}[5m])) * 100

# p95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service="psy-api"}[5m])) by (le))
```

### LogQL (Logs)

```logql
# All API errors
{service_name="psy-api"} | json | level="error"

# Logs with specific trace ID
{service_name="psy-api"} | json | traceId="abc123"

# Slow requests (>500ms)
{service_name="psy-api"} | json | duration > 500
```

### TraceQL (Traces)

```traceql
# Find traces with errors
{ status = error }

# Find slow traces
{ duration > 500ms }

# Find traces by service
{ resource.service.name = "psy-api" }
```

## Troubleshooting

### No metrics appearing

1. Check if the API is running and exposing `/metrics`
2. Verify OTEL collector can reach the API: `curl http://localhost:4000/metrics`
3. Check collector logs: `docker compose logs otel-collector`

### No traces appearing

1. Ensure `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` is set correctly
2. Check if telemetry.ts is imported first in main.ts
3. Verify Tempo is running: `docker compose logs tempo`

### No logs appearing

1. Check Loki is running: `curl http://localhost:3100/ready`
2. Verify log format is JSON
3. Check collector logs for export errors
