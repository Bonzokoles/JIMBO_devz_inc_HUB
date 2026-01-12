# Per-Host Observability Stack

Stack dla każdego hosta projektu (PUMO, ZENON, BLOGOPS).

## Components

- **ops-agent** - FastAPI agent dla docker operations
- **otelcol** - OpenTelemetry Collector (edge)
- **alloy** - Grafana Alloy dla log shipping (zamiast promtail)
- **node-exporter** - System metrics
- **cadvisor** - Container metrics

## Setup

```bash
cd host-observe
export HOST_NAME=pumo-1
export CENTRAL_OTLP_ENDPOINT=http://CENTRAL_IP:4317
# Edytuj alloy.alloy i ustaw host = "pumo-1"
docker compose up -d
```

## Configuration

- `otel-collector-host.yaml` - OTLP receiver → central forwarder
- `alloy.alloy` - Docker logs → Loki z container labels

## Grafana Alloy vs Promtail

**Alloy** zapewnia:
- Stabilne label'e: `host`, `container`, `job`
- Docker service discovery
- Precyzyjne query bez string matching: `{job="docker",host="pumo-1",container="pumo-api"}`

## Trace Correlation

Logi zawierają:
- `otelTraceID` - link do Tempo trace
- `otelSpanID` - specific span
- `container` - container name (label, nie string match)

W Grafana Loki datasource skonfiguruj "Derived fields" dla auto-link do Tempo.

## Ports

- 4317 - OTLP gRPC (local apps → otelcol)
- 8888 - OTEL Collector metrics
- 9100 - node-exporter
- 8080 - cadvisor
- 12345 - Alloy UI/metrics (opcjonalnie)
- 8787 - ops-agent (opcjonalnie, zwykle przez cloudflared)
