# Per-Host Observability Stack

Stack dla każdego hosta projektu (PUMO, ZENON, BLOGOPS).

## Components

- **ops-agent** - FastAPI agent dla docker operations
- **otelcol** - OpenTelemetry Collector (edge)
- **promtail** - Log shipping do centralnego Loki
- **node-exporter** - System metrics
- **cadvisor** - Container metrics

## Setup

```bash
cd host-observe
export HOST_NAME=pumo-1
export CENTRAL_OTLP_ENDPOINT=http://CENTRAL_IP:4317
docker compose up -d
```

## Configuration

- `otel-collector-host.yaml` - OTLP receiver → central forwarder
- `promtail-config.yml` - Docker logs → Loki (z trace_id extraction)

## Trace Correlation

Logi zawierają:
- `otelTraceID` - link do Tempo trace
- `otelSpanID` - specific span
- `service` - service name

W Grafana Loki datasource skonfiguruj "Derived fields" dla auto-link do Tempo.

## Ports

- 4317 - OTLP gRPC (local apps → otelcol)
- 8888 - OTEL Collector metrics
- 9100 - node-exporter
- 8080 - cadvisor
- 8787 - ops-agent (opcjonalnie, zwykle przez cloudflared)
