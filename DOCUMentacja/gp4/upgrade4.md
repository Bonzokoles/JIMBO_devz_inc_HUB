Poniżej masz **gotowy docker-compose** na “centralny observability stack” + pliki konfiguracyjne. To jest układ, który realnie działa w praktyce:

* **Grafana** (UI)
* **Loki** (logi)
* **Promtail** (zbieranie logów *na tym hoście centralnym*; na innych hostach uruchomisz osobny promtail)
* **Prometheus** (metryki)
* **Alertmanager** (alerty)
* **Tempo** (tracing)
* **Uptime Kuma** (uptime + proste alerty)

Dorzucam też **per-host compose** (node-exporter + cadvisor + promtail), bo bez tego “wiele hostów” = puste wykresy.

---

# 1) Struktura katalogu

```
observability/
  docker-compose.yml
  prometheus/
    prometheus.yml
    rules.yml
  alertmanager/
    alertmanager.yml
  loki/
    loki-config.yml
  promtail/
    promtail-config.yml
  tempo/
    tempo.yml
  grafana/
    provisioning/
      datasources/
        datasources.yml
      dashboards/
        dashboards.yml
    dashboards/
      (tu wrzucisz jsony dashboardów, opcjonalnie)
```

---

# 2) `docker-compose.yml` (centralny stack)

```yaml
version: "3.9"

services:
  grafana:
    image: grafana/grafana:11.2.0
    container_name: grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin_change_me
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=%(protocol)s://%(domain)s/
      # jeśli chcesz reverse proxy/CF: ustaw GF_SERVER_DOMAIN i root_url pod swoją domenę
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
      - loki
      - tempo

  loki:
    image: grafana/loki:3.1.1
    container_name: loki
    command: ["-config.file=/etc/loki/loki-config.yml"]
    volumes:
      - ./loki/loki-config.yml:/etc/loki/loki-config.yml:ro
      - loki_data:/loki
    ports:
      - "3100:3100"

  promtail:
    image: grafana/promtail:3.1.1
    container_name: promtail
    command: ["-config.file=/etc/promtail/promtail-config.yml"]
    volumes:
      - ./promtail/promtail-config.yml:/etc/promtail/promtail-config.yml:ro
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    depends_on:
      - loki

  prometheus:
    image: prom/prometheus:v2.54.1
    container_name: prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--web.enable-lifecycle"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/rules.yml:/etc/prometheus/rules.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  alertmanager:
    image: prom/alertmanager:v0.27.0
    container_name: alertmanager
    command:
      - "--config.file=/etc/alertmanager/alertmanager.yml"
      - "--storage.path=/alertmanager"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager_data:/alertmanager
    ports:
      - "9093:9093"

  tempo:
    image: grafana/tempo:2.6.0
    container_name: tempo
    command: ["-config.file=/etc/tempo/tempo.yml"]
    volumes:
      - ./tempo/tempo.yml:/etc/tempo/tempo.yml:ro
      - tempo_data:/var/tempo
    ports:
      - "3200:3200"   # tempo query
      - "4317:4317"   # OTLP gRPC ingest
      - "4318:4318"   # OTLP HTTP ingest

  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    volumes:
      - uptime_kuma_data:/app/data
    ports:
      - "3001:3001"

volumes:
  grafana_data:
  loki_data:
  prometheus_data:
  alertmanager_data:
  tempo_data:
  uptime_kuma_data:
```

---

# 3) Loki config: `loki/loki-config.yml`

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

limits_config:
  allow_structured_metadata: true

ruler:
  alertmanager_url: http://alertmanager:9093
```

---

# 4) Promtail config: `promtail/promtail-config.yml`

To zbiera:

* `/var/log/*`
* logi dockerowe z `/var/lib/docker/containers/*/*-json.log`

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: varlogs
    static_configs:
      - targets: [localhost]
        labels:
          job: varlogs
          host: central
          __path__: /var/log/*log

  - job_name: docker
    static_configs:
      - targets: [localhost]
        labels:
          job: docker
          host: central
          __path__: /var/lib/docker/containers/*/*-json.log

    pipeline_stages:
      - docker: {}
```

---

# 5) Prometheus: `prometheus/prometheus.yml`

Tu dodajesz:

* centralny host (node_exporter + cadvisor jeśli uruchomisz je też tutaj),
* inne hosty (po IP/hostname albo przez CF Tunnel tylko jeśli naprawdę musisz — lepiej prywatnie).

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - /etc/prometheus/rules.yml

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["prometheus:9090"]

  # Central host exporters (opcjonalnie, jeśli uruchomisz)
  - job_name: central-node
    static_configs:
      - targets: ["host.docker.internal:9100"]
    # na Linux zwykle nie działa host.docker.internal; zamiast tego wystaw node_exporter jako service w compose

  # Przykład: hosty (podmień na swoje IP/nazwy)
  - job_name: nodes
    static_configs:
      - targets:
          - "10.0.0.11:9100"
          - "10.0.0.12:9100"
          - "10.0.0.13:9100"

  - job_name: cadvisor
    static_configs:
      - targets:
          - "10.0.0.11:8080"
          - "10.0.0.12:8080"
          - "10.0.0.13:8080"

  # FastAPI /metrics (jeśli dodasz instrumentację)
  - job_name: ops-api
    metrics_path: /metrics
    static_configs:
      - targets: ["api.ops.internal:8000"]  # lub IP/host
```

---

# 6) Prometheus rules: `prometheus/rules.yml` (sensowne minimum, bez spamu)

```yaml
groups:
  - name: ops-min
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 60s
        labels:
          severity: critical
        annotations:
          summary: "Target down"
          description: "Prometheus target is down for > 60s."

      - alert: HighCpuLoad
        expr: avg(rate(node_cpu_seconds_total{mode!="idle"}[2m])) by (instance) > 0.9
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High CPU"
          description: "CPU > 90% for 2m on {{ $labels.instance }}"

      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes{fstype!~"tmpfs|overlay"}) < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space"
          description: "Disk space <10% on {{ $labels.instance }} ({{ $labels.mountpoint }})"
```

---

# 7) Alertmanager: `alertmanager/alertmanager.yml`

Na start bez integracji (tylko “log”), ale zostawię webhook slot na Discord/Telegram.

```yaml
route:
  receiver: "default"
  group_wait: 10s
  group_interval: 1m
  repeat_interval: 4h

receivers:
  - name: "default"
    # webhook_configs:
    #   - url: "https://twoj-webhook"
    #     send_resolved: true
```

---

# 8) Tempo: `tempo/tempo.yml`

OTLP ingest włączony na 4317/4318.

```yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
        http:

storage:
  trace:
    backend: local
    local:
      path: /var/tempo/traces

compactor:
  compaction:
    block_retention: 48h

metrics_generator:
  registry:
    external_labels:
      source: tempo
  storage:
    path: /var/tempo/generator
```

---

# 9) Grafana provisioning: datasources + dashboards

## `grafana/provisioning/datasources/datasources.yml`

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100

  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
```

## `grafana/provisioning/dashboards/dashboards.yml`

```yaml
apiVersion: 1

providers:
  - name: "local-dashboards"
    orgId: 1
    folder: "OPS"
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /var/lib/grafana/dashboards
```

---

# 10) Odpalanie

W katalogu `observability/`:

```bash
docker compose up -d
```

Wejścia:

* Grafana: `http://<server>:3000` (login admin/admin_change_me)
* Prometheus: `http://<server>:9090`
* Alertmanager: `http://<server>:9093`
* Loki: `http://<server>:3100`
* Tempo: `http://<server>:3200`
* Uptime Kuma: `http://<server>:3001`

---

# 11) Per-host stack (na KAŻDYM hoście z dockerem) — node-exporter + cadvisor + promtail

To wrzucasz na każdy host projektu (pumo-1, pumo-2, …). Nazwij np. `host-observe/docker-compose.yml`.

## `host-observe/docker-compose.yml`

```yaml
version: "3.9"

services:
  node-exporter:
    image: prom/node-exporter:v1.8.2
    container_name: node-exporter
    pid: host
    restart: unless-stopped
    command:
      - "--path.rootfs=/host"
    volumes:
      - /:/host:ro,rslave
    ports:
      - "9100:9100"

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.49.1
    container_name: cadvisor
    restart: unless-stopped
    privileged: true
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    ports:
      - "8080:8080"

  promtail:
    image: grafana/promtail:3.1.1
    container_name: promtail
    restart: unless-stopped
    command: ["-config.file=/etc/promtail/promtail-config.yml"]
    volumes:
      - ./promtail-config.yml:/etc/promtail/promtail-config.yml:ro
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
```

## `host-observe/promtail-config.yml`

Podmień `host:` na nazwę hosta (albo ustaw ENV i wstaw przez templating później).

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://<CENTRAL_IP_OR_DNS>:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    static_configs:
      - targets: [localhost]
        labels:
          job: docker
          host: pumo-1
          __path__: /var/lib/docker/containers/*/*-json.log
    pipeline_stages:
      - docker: {}

  - job_name: varlogs
    static_configs:
      - targets: [localhost]
        labels:
          job: varlogs
          host: pumo-1
          __path__: /var/log/*log
```

> Jeżeli nie chcesz wystawiać 3100/9090/9093 na świat, zrób to po **prywatnej sieci** (najlepiej) albo przez **Cloudflare Tunnel** jako private access.
> Prometheus scrape przez Cloudflare jest możliwy, ale to już “kombinatoryka” (i łatwo sobie strzelić w stopę latencją). Najczyściej: prywatny networking/VPN.

---

# 12) Co jeszcze warto dopiąć od razu (2 małe rzeczy)

1. **/metrics w FastAPI i workerze** (Prometheus scraping) – wtedy zobaczysz realne czasy requestów i tasków.
2. **OTEL do Tempo** – wtedy masz tracing end-to-end (klik w UI → API → worker → agent).

Jak chcesz, dorzucę gotowe snippety:

* FastAPI + `prometheus-fastapi-instrumentator` (metryki),
* OpenTelemetry setup (FastAPI/worker/agent) pod Tempo OTLP.
