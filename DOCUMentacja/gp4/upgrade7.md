Dobra — robimy **per-host OTEL Collector** + **logi z `trace_id`** (żeby Loki ↔ Tempo dało się spiąć “klik z loga do trace”).

Poniżej masz gotowe pliki.

---

# 1) Per-host: docker-compose (agent + otelcol + promtail + exporters)

## Struktura na hoście

```
host-observe/
  docker-compose.yml
  otel-collector-host.yaml
  promtail-config.yml
```

## `host-observe/docker-compose.yml`

```yaml
version: "3.9"

services:
  # ---- OPS AGENT ----
  ops-agent:
    image: your/ops-agent:latest
    container_name: ops-agent
    restart: unless-stopped
    environment:
      # security (HMAC opcjonalny)
      AGENT_HMAC_SECRET: ${AGENT_HMAC_SECRET:-}
      ALLOWED_SERVICES: ${ALLOWED_SERVICES:-}

      # ---- OTEL: agent wysyła trace do lokalnego collectora ----
      OTEL_SERVICE_NAME: ${OTEL_SERVICE_NAME:-ops-agent}
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otelcol:4317
      OTEL_EXPORTER_OTLP_PROTOCOL: grpc
      OTEL_TRACES_EXPORTER: otlp
      OTEL_METRICS_EXPORTER: none
      OTEL_LOGS_EXPORTER: none
      OTEL_RESOURCE_ATTRIBUTES: ${OTEL_RESOURCE_ATTRIBUTES:-deployment.environment=prod}

      # ---- logging ----
      LOG_FORMAT: json
      LOG_LEVEL: INFO

    ports:
      - "8787:8787"  # jeśli lokalnie testujesz; docelowo i tak idzie przez cloudflared
    depends_on:
      - otelcol

  # ---- OTEL COLLECTOR (EDGE / PER-HOST) ----
  otelcol:
    image: otel/opentelemetry-collector-contrib:0.106.1
    container_name: otelcol
    restart: unless-stopped
    command: ["--config=/etc/otelcol/config.yaml"]
    volumes:
      - ./otel-collector-host.yaml:/etc/otelcol/config.yaml:ro
    ports:
      - "4317:4317"  # OTLP gRPC in (lokalnie dla agent/app)
      - "4318:4318"  # OTLP HTTP in (opcjonalnie)
      - "8888:8888"  # metrics collectora (opcjonalnie)
    environment:
      HOST_NAME: ${HOST_NAME:-unknown-host}
      # endpoint centralnego collectora:
      CENTRAL_OTLP_ENDPOINT: ${CENTRAL_OTLP_ENDPOINT:-http://CENTRAL_IP:4317}

  # ---- LOGI do Loki ----
  promtail:
    image: grafana/promtail:3.1.1
    container_name: promtail
    restart: unless-stopped
    command: ["-config.file=/etc/promtail/promtail-config.yml"]
    volumes:
      - ./promtail-config.yml:/etc/promtail/promtail-config.yml:ro
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro

  # ---- METRYKI hosta ----
  node-exporter:
    image: prom/node-exporter:v1.8.2
    container_name: node-exporter
    pid: host
    restart: unless-stopped
    command: ["--path.rootfs=/host"]
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
```

> **Uwaga**: promtail wysyła do Loki (centralnego). Agent wysyła trace do **lokalnego otelcol**, a ten dopiero do centralnego.

---

# 2) Per-host: OTEL Collector config (edge)

## `host-observe/otel-collector-host.yaml`

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  memory_limiter:
    check_interval: 2s
    limit_mib: 256
    spike_limit_mib: 64

  batch:
    timeout: 2s
    send_batch_size: 512
    send_batch_max_size: 1024

  attributes/host:
    actions:
      - key: host.name
        value: ${env:HOST_NAME}
        action: upsert

  # sampling per-host (opcjonalnie): jak chcesz ciąć, ustaw np 50
  probabilistic_sampler:
    sampling_percentage: 100

  # retry i kolejka w exporterze (contrib) zrobią robotę przy chwilowych zgonach sieci

exporters:
  otlp/central:
    endpoint: ${env:CENTRAL_OTLP_ENDPOINT}
    tls:
      insecure: true

  # metryki collectora (Prometheus zbierze z :8888)
  prometheus:
    endpoint: 0.0.0.0:8888

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

service:
  extensions: [health_check]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, attributes/host, probabilistic_sampler, batch]
      exporters: [otlp/central]
```

---

# 3) Per-host: promtail config (logi + JSON parser)

## `host-observe/promtail-config.yml`

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://CENTRAL_IP:3100/loki/api/v1/push

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
      # jeśli Twoje aplikacje logują JSON w polu "log", to to rozbije:
      - json:
          expressions:
            level: level
            msg: msg
            service: service
            trace_id: trace_id
            span_id: span_id
      # NIE dawaj trace_id jako LABEL (zabije Loki kardynalnością).
      # Zostaw trace_id jako field w log line (wystarczy do wyszukiwania).
```

> W `clients.url` i `host:` podstaw swoje. Dla wielu hostów zmieniasz `host: pumo-1` itp.

---

# 4) Log correlation: jak logować `trace_id` w Pythonie (API / agent / worker)

Cel: każdy log ma pola:

* `trace_id`
* `span_id`
* `service`
* `msg`
* `level`

### 4.1 Dependencje (w każdym Python serwisie)

Dodaj:

* `opentelemetry-instrumentation-logging`
* `python-json-logger`

Przykład:

```txt
opentelemetry-instrumentation-logging==0.48b0
python-json-logger==2.0.7
```

---

## 4.2 Wspólny moduł: `logging_setup.py` (w API i w agencie; worker też)

```python
import logging
import os
from pythonjsonlogger import jsonlogger
from opentelemetry.instrumentation.logging import LoggingInstrumentor

def setup_logging(service_name: str):
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_format = os.getenv("LOG_FORMAT", "json")

    root = logging.getLogger()
    root.setLevel(level)

    # wyczyść default handlers (ważne w uvicorn/celery)
    for h in list(root.handlers):
        root.removeHandler(h)

    handler = logging.StreamHandler()

    if log_format == "json":
        fmt = jsonlogger.JsonFormatter(
            "%(asctime)s %(levelname)s %(name)s %(message)s "
            "%(otelTraceID)s %(otelSpanID)s %(otelServiceName)s"
        )
        handler.setFormatter(fmt)
    else:
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))

    root.addHandler(handler)

    # LoggingInstrumentor dokłada:
    # otelTraceID, otelSpanID, otelServiceName do recordów
    LoggingInstrumentor().instrument(set_logging_format=True, log_level=level)

    # ułatwiamy filtrowanie w Loki:
    logging.getLogger().info("logging_ready", extra={"service": service_name})
```

> Klucz: `LoggingInstrumentor()` dokleja te pola do logów automatycznie, jeśli jesteś “w kontekście” trace’a.

---

## 4.3 API (FastAPI): gdzie wywołać setup_logging

W `api/app/main.py`:

```python
from .logging_setup import setup_logging
setup_logging("ops-api")
```

I dopiero potem `setup_otel(app)` (albo odwrotnie — oba działają; ja wolę logging wcześniej).

---

## 4.4 Agent: analogicznie

W `agent/app/main.py`:

```python
from .logging_setup import setup_logging
setup_logging(os.getenv("OTEL_SERVICE_NAME", "ops-agent"))
```

---

## 4.5 Worker: logi + trace context w taskach

W `worker/worker.py`:

```python
from worker.logging_setup import setup_logging
setup_logging(os.getenv("OTEL_SERVICE_NAME", "ops-worker"))
```

W `worker/tasks.py` masz już span’y. Wszystkie logi wykonywane **wewnątrz** `with tracer.start_as_current_span(...)` będą miały `otelTraceID`/`otelSpanID`.

Przykład:

```python
import logging
log = logging.getLogger("ops-worker")

with tracer.start_as_current_span("command.execute"):
    log.info("command_started", extra={"command_id": command_id})
```

---

# 5) “Klik z loga do trace” w Grafanie (real talk)

To działa sensownie dopiero, gdy:

* log line zawiera `trace_id` (mamy),
* w Grafanie robisz **Derived fields** w datasource Loki (jednorazowa konfiguracja):

  * regex wyciąga `otelTraceID` / `trace_id`
  * link do Tempo “TraceID = …”

Nie wrzucam tu całego GUI-klikania, ale jeśli chcesz, podam dokładny regex i wartości pól dla Grafany.

---

# 6) Jak odpalić per-host stack

Na hoście:

```bash
cd host-observe
export HOST_NAME=pumo-1
export CENTRAL_OTLP_ENDPOINT=http://CENTRAL_IP:4317
docker compose up -d
```

Potem:

* logi lecą do Loki (promtail)
* trace lecą do centralnego (otelcol → central collector → tempo)

---

## Co jeszcze mogę dopiąć od razu (bez pytania)

1. Gotowe “Derived field” dla Grafany (Loki → Tempo link) + minimalny dashboard “Commands latency / retries”.
2. Wersja bez wystawiania portów na hostach (agent tylko lokalnie + cloudflared, a exporters tylko po prywatnej sieci).

Powiedz tylko: **Prometheus ma mieć dostęp do node_exporter/cadvisor po prywatnej sieci, czy też wszystko ma iść “przez Cloudflare”?**
(Prywatna sieć jest 10x mniej upierdliwa i bardziej stabilna).
