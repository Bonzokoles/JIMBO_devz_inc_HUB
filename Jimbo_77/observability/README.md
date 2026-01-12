# JIMBO77 Observability Stack

Centralny observability stack dla JIMBO77 Control Hub.

## Stack

- **Grafana** (3000) - UI, dashboards
- **Prometheus** (9090) - metryki
- **Loki** (3100) - logi
- **Tempo** (3200, 4317, 4318) - tracing (OTLP)
- **Alertmanager** (9093) - alerty
- **Uptime Kuma** (3001) - uptime monitoring

## Quick Start

```bash
cd observability
docker compose up -d
```

## Access

- Grafana: http://localhost:3000 (admin/admin_change_me)
- Prometheus: http://localhost:9090
- Alertmanager: http://localhost:9093
- Uptime Kuma: http://localhost:3001

## Configuration

- `prometheus/prometheus.yml` - scrape targets
- `prometheus/rules.yml` - alert rules
- `loki/loki-config.yml` - Loki storage
- `grafana/provisioning/` - datasources, dashboards

## Per-Host Setup

Deploy `host-observe/docker-compose.yml` on each project host for:
- node-exporter (9100) - system metrics
- cadvisor (8080) - container metrics
- promtail - log shipping to central Loki

See `host-observe/README.md` for details.
