OK — dorzucam **(1) /metrics** i **(2) OTEL → Tempo** dla: **FastAPI (API)** + **worker (Celery)** + **agent (FastAPI na hostach)**.

Poniżej masz gotowe, w miarę “plug & play”.

---

# 1) METRYKI `/metrics`

## 1.1 API (FastAPI): `prometheus-fastapi-instrumentator`

### A) Dependencje (API)

Dodaj do `api/pyproject.toml` / `requirements.txt`:

* `prometheus-fastapi-instrumentator`
* `prometheus-client`

Przykład (requirements):

```txt
prometheus-fastapi-instrumentator==7.0.0
prometheus-client==0.20.0
```

### B) `api/app/metrics.py` (NOWY)

```python
from prometheus_fastapi_instrumentator import Instrumentator

def setup_metrics(app):
    Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        should_respect_env_var=True,
        env_var_name="METRICS_ENABLED",
    ).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
```

### C) W `api/app/main.py` (DOPISZ)

```python
from .metrics import setup_metrics

# po utworzeniu app = FastAPI(...)
setup_metrics(app)
```

### D) Prometheus scrape config (centralny `prometheus.yml`)

Dodaj job:

```yaml
  - job_name: ops-api
    metrics_path: /metrics
    static_configs:
      - targets:
          - "10.0.0.20:8000"   # <- IP/host gdzie stoi API
```

> Jeśli API jest w docker-compose na tym samym serwerze co Prometheus, możesz dać `api:8000` (nazwa serwisu w sieci compose).

---

## 1.2 Worker (Celery): metryki Prometheus przez `prometheus_client`

Celery nie ma “/metrics” z pudełka w sensowny sposób, więc robimy najprościej:

* worker zbiera metryki tasków (czas, sukces/porażka, retry)
* wystawia je na HTTP `/metrics` przez wbudowany serwer prom-client

### A) Dependencje (worker)

Dodaj:

```txt
prometheus-client==0.20.0
```

### B) `worker/metrics.py` (NOWY)

```python
from __future__ import annotations
import os
from prometheus_client import Counter, Histogram, Gauge, start_http_server

WORKER_METRICS_PORT = int(os.getenv("WORKER_METRICS_PORT", "9108"))

TASKS_TOTAL = Counter(
    "ops_worker_tasks_total",
    "Total tasks processed by ops worker",
    ["task", "state"],
)

TASK_DURATION = Histogram(
    "ops_worker_task_duration_seconds",
    "Task duration seconds",
    ["task"],
    buckets=(0.1, 0.3, 1, 3, 5, 10, 30, 60, 120, 300),
)

QUEUE_LAG = Gauge(
    "ops_worker_queue_lag_seconds",
    "Seconds since task was received (approx)",
    ["task"],
)

def start_metrics_server():
    start_http_server(WORKER_METRICS_PORT)
```

### C) `worker/celery_signals.py` (NOWY) — hooki Celery

```python
from __future__ import annotations
import time
from celery.signals import task_prerun, task_postrun, task_failure, task_retry
from .metrics import TASKS_TOTAL, TASK_DURATION, QUEUE_LAG

_started_at = {}

@task_prerun.connect
def _task_prerun(task_id=None, task=None, *args, **kwargs):
    if not task:
        return
    name = task.name or "unknown"
    _started_at[task_id] = time.time()
    # kolejka lag: przybliżenie, bo nie zawsze mamy enqueued_at
    QUEUE_LAG.labels(task=name).set(0)

@task_postrun.connect
def _task_postrun(task_id=None, task=None, state=None, *args, **kwargs):
    if not task:
        return
    name = task.name or "unknown"
    start = _started_at.pop(task_id, None)
    if start:
        TASK_DURATION.labels(task=name).observe(time.time() - start)
    TASKS_TOTAL.labels(task=name, state=state or "unknown").inc()

@task_failure.connect
def _task_failure(task_id=None, task=None, exception=None, *args, **kwargs):
    if not task:
        return
    name = task.name or "unknown"
    TASKS_TOTAL.labels(task=name, state="FAILURE").inc()

@task_retry.connect
def _task_retry(request=None, reason=None, *args, **kwargs):
    name = getattr(request, "task", None) or "unknown"
    TASKS_TOTAL.labels(task=name, state="RETRY").inc()
```

### D) `worker/entrypoint.py` (NOWY) — start metryki + import signal hooks

```python
from .metrics import start_metrics_server
import worker.celery_signals  # noqa: F401 (rejestracja sygnałów)

def init_worker():
    start_metrics_server()
```

### E) `worker/worker.py` (DOPISZ init)

```python
import os
from celery import Celery
from .entrypoint import init_worker

init_worker()

celery = Celery(
    "ops_worker",
    broker=os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0"),
)
celery.conf.update(
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_reject_on_worker_lost=True,
)
```

### F) W `docker-compose` (worker) wystaw port

```yaml
worker:
  # ...
  ports:
    - "9108:9108"
  environment:
    WORKER_METRICS_PORT: 9108
```

### G) Prometheus job dla workera

```yaml
  - job_name: ops-worker
    metrics_path: /metrics
    static_configs:
      - targets:
          - "10.0.0.20:9108"   # host z workerem
```

---

## 1.3 Agent (FastAPI): `/metrics`

Na agentach też dorzuć instrumentator (ten sam co API).

### A) Dependencje agenta

```txt
prometheus-fastapi-instrumentator==7.0.0
prometheus-client==0.20.0
```

### B) W `agent/app/main.py` po `app = FastAPI(...)`

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
```

### C) Prometheus job dla agentów

Jeśli agentów jest dużo, dodaj osobne targety:

```yaml
  - job_name: agents
    metrics_path: /metrics
    static_configs:
      - targets:
          - "10.0.0.11:8787"  # jeśli to port agenta; UWAGA: prometheus musi mieć dostęp sieciowy
          - "10.0.0.12:8787"
```

> Jeśli agenty są dostępne tylko przez Cloudflare Access, Prometheus nie “wejdzie” bez kombinowania z tokenami. Najczyściej: Prometheus ma prywatny dostęp do hostów (VPN/prywatna sieć). Cloudflare zostawiasz dla ludzi/worker → agent.

---

# 2) TRACING OTEL → Tempo

Tempo już słucha na:

* OTLP gRPC: `tempo:4317`
* OTLP HTTP: `tempo:4318`

Bierzemy **OTLP gRPC**, bo jest standardowo stabilny.

## 2.1 Env vars (w każdym komponencie: API/worker/agent)

Dodaj:

```env
OTEL_SERVICE_NAME=ops-api            # albo ops-worker / ops-agent-pumo-1
OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=none
OTEL_LOGS_EXPORTER=none
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=prod
```

Na hostach (agenty) endpoint będzie inny, np. do centralnego tempo:

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://<CENTRAL_IP>:4317
```

---

## 2.2 FastAPI (API): OpenTelemetry auto-instrumentation (proste i działa)

### A) Dependencje (API)

Dodaj:

```txt
opentelemetry-api==1.27.0
opentelemetry-sdk==1.27.0
opentelemetry-exporter-otlp==1.27.0
opentelemetry-instrumentation-fastapi==0.48b0
opentelemetry-instrumentation-asgi==0.48b0
opentelemetry-instrumentation-requests==0.48b0
```

### B) `api/app/otel.py` (NOWY)

```python
import os
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

def setup_otel(app):
    service_name = os.getenv("OTEL_SERVICE_NAME", "ops-api")
    resource = Resource.create({
        "service.name": service_name,
        **_parse_resource_attrs(os.getenv("OTEL_RESOURCE_ATTRIBUTES", "")),
    })

    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://tempo:4317"),
        insecure=True,
    )
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument_app(app)
    RequestsInstrumentor().instrument()

def _parse_resource_attrs(s: str) -> dict:
    out = {}
    for part in (s or "").split(","):
        part = part.strip()
        if not part or "=" not in part:
            continue
        k, v = part.split("=", 1)
        out[k.strip()] = v.strip()
    return out
```

### C) W `api/app/main.py` (DOPISZ)

```python
from .otel import setup_otel

setup_otel(app)
```

---

## 2.3 Agent (FastAPI na hostach): identycznie jak API

* dodaj te same dependencje OTEL
* dodaj `agent/app/otel.py` (kopiuj z API, zmień default service name na `ops-agent`)
* w `agent/app/main.py` wywołaj `setup_otel(app)`

Dodatkowo ustaw env per host:

```env
OTEL_SERVICE_NAME=ops-agent-pumo-1
OTEL_EXPORTER_OTLP_ENDPOINT=http://<CENTRAL_IP>:4317
```

---

## 2.4 Worker (Celery): manual spans (to jest najlepsze, bo Celery auto bywa kapryśne)

### A) Dependencje (worker)

Dodaj:

```txt
opentelemetry-api==1.27.0
opentelemetry-sdk==1.27.0
opentelemetry-exporter-otlp==1.27.0
opentelemetry-instrumentation-httpx==0.48b0
```

### B) `worker/otel.py` (NOWY)

```python
import os
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

def setup_otel():
    service_name = os.getenv("OTEL_SERVICE_NAME", "ops-worker")
    resource = Resource.create({
        "service.name": service_name,
        **_parse_resource_attrs(os.getenv("OTEL_RESOURCE_ATTRIBUTES", "")),
    })

    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://tempo:4317"),
        insecure=True,
    )
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

def _parse_resource_attrs(s: str) -> dict:
    out = {}
    for part in (s or "").split(","):
        part = part.strip()
        if not part or "=" not in part:
            continue
        k, v = part.split("=", 1)
        out[k.strip()] = v.strip()
    return out
```

### C) `worker/worker.py` (DOPISZ init OTEL)

```python
from .otel import setup_otel
setup_otel()
```

### D) Opatrzenie taska spanami: w `worker/tasks.py`

Na początku pliku:

```python
from opentelemetry import trace
tracer = trace.get_tracer("ops-worker")
```

W środku `enqueue_command` otocz kluczowe kroki:

```python
with tracer.start_as_current_span("command.execute") as span:
    span.set_attribute("command.id", command_id)
    span.set_attribute("command.project_id", cmd.project_id)
    span.set_attribute("command.action", cmd.action)
    span.set_attribute("command.target", cmd.target or "")

    # lock
    with tracer.start_as_current_span("lock.acquire"):
        ...

    # call agent
    with tracer.start_as_current_span("agent.call") as s2:
        s2.set_attribute("agent.url", agent_url)
        result = call_agent(agent_url, payload, timeout=90)
```

I w błędach:

```python
span.record_exception(e)
span.set_status(trace.status.Status(trace.status.StatusCode.ERROR))
```

(Jeśli chcesz to “na czysto”, dopiszę gotowy patch pod Twoją wersję `tasks.py`.)

---

# 3) Tempo + Grafana: klik → trace (powiązanie)

W Grafanie już masz datasource Tempo. Żeby w panelu Prometheus/Loki pojawiały się linki do trace:

* to wymaga jeszcze korelacji (trace_id w logach). Na MVP pomijamy.
* najważniejsze: w Tempo widzisz flow API/worker/agent.

---

# 4) Dwa praktyczne “miny” (żebyś nie stracił wieczoru)

1. **Prometheus scraping agentów przez Cloudflare Access**
   To nie jest przyjemne. Najprościej: Prometheus ma prywatny dostęp do hostów (VPN / prywatna sieć).
   Cloudflare zostawiasz dla ludzi i worker→agent.

2. **Tempo endpoint z hostów**
   Hosty muszą widzieć centralny `4317`. Jeśli nie mają prywatnej trasy, możesz:

   * wystawić tempo przez prywatny tunnel (ale OTLP przez CF bywa kłopotliwy),
   * albo zrobić mały “otel-collector” na każdym hoście i pushować dalej (bardziej pro).

---

Jeśli chcesz, następny krok zrobię “do końca”:

* dorzucę **OpenTelemetry Collector** do centralnego compose (przyjmuje OTLP z hostów, filtruje, forwarduje do Tempo) — to rozwiązuje ładnie temat sieci i daje Ci miejsce na sampling/ratelimity.
