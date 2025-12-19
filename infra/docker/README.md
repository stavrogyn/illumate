# Observability Infrastructure

Local observability stack for development and demonstration.

## Quick Start

```bash
# Start the observability stack
cd /path/to/psy-app
docker compose -f infra/docker/docker-compose.observability.yml up -d

# Check all services are running
docker compose -f infra/docker/docker-compose.observability.yml ps

# View logs
docker compose -f infra/docker/docker-compose.observability.yml logs -f

# Stop the stack
docker compose -f infra/docker/docker-compose.observability.yml down

# Clean up volumes (reset all data)
docker compose -f infra/docker/docker-compose.observability.yml down -v
```

## Services

| Service             | URL                    | Port  | Description                |
| ------------------- | ---------------------- | ----- | -------------------------- |
| **Grafana**         | http://localhost:3001  | 3001  | Dashboards (admin/admin)   |
| **Alloy**           | http://localhost:12345 | 12345 | Faro RUM receiver UI       |
| **Alloy Faro**      | http://localhost:12347 | 12347 | Faro collect endpoint      |
| **OTEL Collector**  | http://localhost:4318  | 4318  | Telemetry ingestion (HTTP) |
| **OTEL Collector**  | http://localhost:4317  | 4317  | Telemetry ingestion (gRPC) |
| **VictoriaMetrics** | http://localhost:8428  | 8428  | Time series metrics        |
| **Prometheus**      | http://localhost:9090  | 9090  | Metrics scraper (fallback) |
| **Loki**            | http://localhost:3100  | 3100  | Log aggregation            |
| **Tempo**           | http://localhost:3200  | 3200  | Distributed tracing        |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           APPLICATIONS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────┐              ┌─────────────────────┐           │
│  │      PSY Web        │              │      PSY API        │           │
│  │     (Next.js)       │              │     (NestJS)        │           │
│  │                     │              │                     │           │
│  │  ┌───────────────┐  │              │  ┌───────────────┐  │           │
│  │  │  Grafana Faro │  │              │  │  OTel SDK     │  │           │
│  │  │  (RUM SDK)    │  │              │  │  + Pino       │  │           │
│  │  └───────┬───────┘  │              │  └───────┬───────┘  │           │
│  └──────────┼──────────┘              └──────────┼──────────┘           │
│             │                                    │                      │
│             │ POST /collect                      │ OTLP HTTP/gRPC       │
│             ▼                                    ▼                      │
└─────────────────────────────────────────────────────────────────────────┘
              │                                    │
              ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        TELEMETRY COLLECTION                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────┐              ┌─────────────────────┐           │
│  │    Grafana Alloy    │              │   OTEL Collector    │           │
│  │    :12345, :12347   │              │   :4317, :4318      │           │
│  │                     │              │                     │           │
│  │  Faro → Loki/Tempo  │              │  OTLP → Backends    │           │
│  └──────────┬──────────┘              └──────────┬──────────┘           │
│             │                                    │                      │
└─────────────┼────────────────────────────────────┼──────────────────────┘
              │                                    │
              ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           STORAGE BACKENDS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐           │
│  │    Loki      │    │    Tempo     │    │  VictoriaMetrics │           │
│  │   :3100      │    │   :3200      │    │     :8428        │           │
│  │              │    │              │    │                  │           │
│  │    Logs      │    │   Traces     │    │    Metrics       │           │
│  │   (LogQL)    │    │  (TraceQL)   │    │    (PromQL)      │           │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘           │
│         │                   │                     │                     │
└─────────┼───────────────────┼─────────────────────┼─────────────────────┘
          │                   │                     │
          └───────────────────┼─────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │     Grafana      │
                    │      :3001       │
                    │                  │
                    │   Dashboards     │
                    │   Alerting       │
                    │   Explore        │
                    └──────────────────┘
```

## Dashboards

Pre-configured dashboards in Grafana (http://localhost:3001):

| Dashboard                    | Description                         | Data Source           |
| ---------------------------- | ----------------------------------- | --------------------- |
| **PSY Application Overview** | High-level health and metrics       | VictoriaMetrics, Loki |
| **PSY API Performance**      | Backend latency, throughput, errors | VictoriaMetrics       |
| **PSY Web Vitals (RUM)**     | Frontend Core Web Vitals            | Loki                  |

## Configuration

### API Configuration (apps/api/.env)

```bash
# OpenTelemetry
OTEL_SERVICE_NAME=psy-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics

# Application
PORT=4000
NODE_ENV=development

# Optional: Sentry
SENTRY_DSN=your-sentry-dsn
```

### Web Configuration (apps/web/.env.local)

```bash
# Grafana Faro RUM (Alloy receiver)
NEXT_PUBLIC_FARO_URL=http://localhost:12347/collect

# App metadata
NEXT_PUBLIC_APP_VERSION=0.1.0

# Optional: Sentry
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## Testing Without Applications

You can test the observability stack without running the actual applications:

### Test Faro (Web Vitals)

```bash
# Send test Web Vitals data
curl -X POST "http://localhost:12347/collect" \
  -H "Content-Type: application/json" \
  -d '{
    "measurements": [{
      "type": "web-vitals",
      "values": {"lcp": 1250, "fcp": 450, "cls": 0.05, "ttfb": 120, "inp": 85}
    }],
    "meta": {
      "app": {"name": "psy-web", "version": "0.1.0", "environment": "development"},
      "page": {"url": "http://localhost:3000/test"}
    }
  }'

# Verify data in Loki
curl -s 'http://localhost:3100/loki/api/v1/query?query={source="faro"}' | jq '.data.result[].values[][1]'
```

### Test OTEL Collector (API Traces)

```bash
# Send test trace via OTLP HTTP
curl -X POST "http://localhost:4318/v1/traces" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceSpans": [{
      "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "test-service"}}]},
      "scopeSpans": [{
        "spans": [{
          "traceId": "5B8EFFF798038103D269B633813FC60C",
          "spanId": "EEE19B7EC3C1B174",
          "name": "test-span",
          "kind": 1,
          "startTimeUnixNano": "'$(date +%s)000000000'",
          "endTimeUnixNano": "'$(date +%s)100000000'"
        }]
      }]
    }]
  }'

# Check Tempo
curl -s "http://localhost:3200/api/search?limit=5" | jq
```

## Useful Queries

### LogQL (Loki) - Logs & Web Vitals

```logql
# All Web Vitals measurements
{source="faro"} |= "web-vitals"

# Extract LCP values
{source="faro"} |= "web-vitals" | pattern `<_> lcp=<lcp> <_>` | unwrap lcp

# Average LCP over 5 minutes
avg_over_time({source="faro"} |= "web-vitals" | pattern `<_> lcp=<lcp> <_>` | unwrap lcp [5m])

# API errors (when psy-api is running)
{service_name="psy-api"} |= "error"

# Logs with specific trace ID
{service_name="psy-api"} | json | traceId="abc123"
```

### PromQL (VictoriaMetrics) - Metrics

```promql
# Request rate (requires psy-api running)
sum(rate(http_requests_total{service="psy-api"}[5m]))

# Error rate percentage
sum(rate(http_requests_total{service="psy-api",status=~"5.."}[5m]))
/ sum(rate(http_requests_total{service="psy-api"}[5m])) * 100

# p95 latency
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket{service="psy-api"}[5m])) by (le)
)
```

### TraceQL (Tempo) - Traces

```traceql
# Find traces with errors
{ status = error }

# Find slow traces (>500ms)
{ duration > 500ms }

# Find traces by service
{ resource.service.name = "psy-api" }
```

## Health Checks

```bash
# Check all services
echo "Loki:"; curl -s http://localhost:3100/ready
echo "Tempo:"; curl -s http://localhost:3200/ready
echo "VictoriaMetrics:"; curl -s http://localhost:8428/health
echo "Grafana:"; curl -s http://localhost:3001/api/health | jq -r '.database'
echo "Alloy:"; curl -s http://localhost:12345/-/ready
echo "Prometheus:"; curl -s http://localhost:9090/-/ready
```

## Troubleshooting

### Dashboards are empty

1. **No data yet** - Send test data using curl commands above
2. **Services not running** - Check `docker compose ps`
3. **Wrong time range** - In Grafana, set time range to "Last 15 minutes"

### No Web Vitals in Loki

```bash
# Check Alloy is receiving data
docker logs psy-alloy 2>&1 | tail -20

# Check Loki has labels
curl -s "http://localhost:3100/loki/api/v1/labels"

# Verify Faro endpoint
curl -X POST "http://localhost:12347/collect" \
  -H "Content-Type: application/json" \
  -d '{"logs":[{"message":"test"}],"meta":{"app":{"name":"test"}}}'
```

### No API metrics

1. Ensure psy-api is running on port 4000
2. Check metrics endpoint: `curl http://localhost:4000/metrics`
3. Check OTEL collector logs: `docker logs psy-otel-collector`

### No traces appearing

1. Verify `telemetry.ts` is imported first in `main.ts`
2. Check Tempo logs: `docker logs psy-tempo`
3. Verify OTEL endpoint is correct in API .env

### Container keeps restarting

```bash
# Check logs for specific container
docker logs psy-loki
docker logs psy-otel-collector

# Common issues:
# - Config file syntax error
# - Port already in use
# - Insufficient memory
```

## Cloud Services (Production)

For production, use managed cloud services:

| Local Service   | Cloud Alternative                     |
| --------------- | ------------------------------------- |
| VictoriaMetrics | VictoriaMetrics Cloud / Grafana Cloud |
| Loki            | Grafana Cloud Logs                    |
| Tempo           | Grafana Cloud Traces                  |
| Grafana         | Grafana Cloud                         |
| Alloy           | Grafana Cloud (Faro receiver)         |
| Sentry          | Sentry.io                             |
