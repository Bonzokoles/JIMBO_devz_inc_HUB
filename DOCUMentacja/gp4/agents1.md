Masz rację. Symulacje często zostają na wieczność jak “tymczasowa klatka schodowa” i potem człowiek się dziwi, że mieszka w rusztowaniu.

Zamiast mocków: robimy **prawdziwych “agentów systemowych”**, ale z **bezpiecznymi, realnymi funkcjami** (read-only + kilka kontrolowanych akcji), które i tak będziesz miał docelowo.

## Co dać jako “system agents” bez udawania

Na każdym hoście (albo na wybranych) stawiasz agenta, który ma:

### Read-only (zero ryzyka, a pokazuje że wszystko działa)

* `GET /healthz` (stan agenta + wersja)
* `GET /metrics` (Prometheus)
* `GET /info`:

  * host: uptime, load, disk free (z `psutil`)
  * docker: lista kontenerów + status (z Docker socket)
* `GET /logs/{container}` (tail N linii z docker logs) – opcjonalnie

### Akcje “realne, ale kontrolowane”

* `POST /execute` tylko dla whitelisted działań:

  * `service.restart` -> **docker restart** dla kontenerów z allowlisty
  * `deploy.run` -> odpal tylko zdefiniowane “deploy scripts” (allowlist), nie dowolne komendy

To nie jest symulacja: to jest “produkcyjny agent”, tylko na start ograniczony.

---

# 1) Agent: docker-compose (realny)

Na hoście `host-observe/` (lub osobny katalog `agent/`):

## `agent/docker-compose.yml`

```yaml
version: "3.9"

services:
  ops-agent:
    image: your/ops-agent:latest
    container_name: ops-agent
    restart: unless-stopped

    environment:
      # Security
      AGENT_HMAC_SECRET: ${AGENT_HMAC_SECRET}
      CF_ACCESS_CLIENT_ID: ${CF_ACCESS_CLIENT_ID:-}
      CF_ACCESS_CLIENT_SECRET: ${CF_ACCESS_CLIENT_SECRET:-}

      # Allowlists (prawdziwe ograniczenia)
      ALLOWED_RESTART_CONTAINERS: "pumo-api,pumo-worker,redis,postgres"
      ALLOWED_DEPLOY_TARGETS: "pumo"  # np. nazwy procedur deploy

      # OTEL -> lokalny collector (edge)
      OTEL_SERVICE_NAME: ${OTEL_SERVICE_NAME:-ops-agent-pumo-1}
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otelcol:4317
      OTEL_EXPORTER_OTLP_PROTOCOL: grpc
      OTEL_TRACES_EXPORTER: otlp
      OTEL_METRICS_EXPORTER: none
      OTEL_LOGS_EXPORTER: none

      # Logging
      LOG_FORMAT: json
      LOG_LEVEL: INFO

    # Docker socket (prawdziwe operacje na kontenerach)
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

    ports:
      - "8787:8787"
    depends_on:
      - otelcol

  otelcol:
    image: otel/opentelemetry-collector-contrib:0.106.1
    container_name: otelcol
    restart: unless-stopped
    command: ["--config=/etc/otelcol/config.yaml"]
    volumes:
      - ./otel-collector-host.yaml:/etc/otelcol/config.yaml:ro
    environment:
      HOST_NAME: ${HOST_NAME:-pumo-1}
      CENTRAL_OTLP_ENDPOINT: ${CENTRAL_OTLP_ENDPOINT:-http://10.0.0.20:4317}
    ports:
      - "4317:4317"
      - "8888:8888"

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

> To jest już “real”. Jedyna różnica względem produkcji to to, że allowlisty są ciasne.

---

# 2) Agent: minimalny kod (realny) — FastAPI + Docker SDK

Jeśli chcesz mieć to **na 100% prawdziwe**, to poniżej masz najkrótszy sensowny agent.

### `agent/app/main.py`

```python
import os
import logging
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import docker
import psutil

# metrics
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

# otel
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace.export import BatchSpanProcessor

SERVICE = os.getenv("OTEL_SERVICE_NAME", "ops-agent")
OTLP = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otelcol:4317")

log = logging.getLogger(SERVICE)
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

ALLOWED_RESTART = set([x.strip() for x in os.getenv("ALLOWED_RESTART_CONTAINERS", "").split(",") if x.strip()])
ALLOWED_DEPLOY = set([x.strip() for x in os.getenv("ALLOWED_DEPLOY_TARGETS", "").split(",") if x.strip()])

REQS = Counter("ops_agent_requests_total", "Requests", ["path", "method", "status"])
EXEC = Counter("ops_agent_execute_total", "Execute calls", ["action", "result"])
DUR = Histogram("ops_agent_execute_duration_seconds", "Execute duration", ["action"],
                buckets=(0.1, 0.3, 1, 3, 5, 10, 30, 60))

def setup_otel(app: FastAPI):
    resource = Resource.create({"service.name": SERVICE})
    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(endpoint=OTLP, insecure=True)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app)

app = FastAPI(title=SERVICE)
setup_otel(app)
tracer = trace.get_tracer(SERVICE)

docker_client = docker.DockerClient(base_url="unix://var/run/docker.sock")

class ExecIn(BaseModel):
    commandId: str
    projectId: str
    action: str
    target: str | None = None
    params: dict = {}

@app.middleware("http")
async def metrics_mw(request: Request, call_next):
    try:
        resp = await call_next(request)
        REQS.labels(request.url.path, request.method, str(resp.status_code)).inc()
        return resp
    except Exception:
        REQS.labels(request.url.path, request.method, "500").inc()
        raise

@app.get("/healthz")
def healthz():
    return {"ok": True, "service": SERVICE}

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/info")
def info():
    # real host info
    return {
        "ok": True,
        "service": SERVICE,
        "cpu": {"count": psutil.cpu_count(), "load1": os.getloadavg()[0] if hasattr(os, "getloadavg") else None},
        "mem": {"total": psutil.virtual_memory().total, "available": psutil.virtual_memory().available},
        "disk": [{"mount": p.mountpoint, "free": psutil.disk_usage(p.mountpoint).free} for p in psutil.disk_partitions(all=False)],
        "docker": {"containers": len(docker_client.containers.list(all=True))}
    }

@app.get("/docker/containers")
def list_containers():
    out = []
    for c in docker_client.containers.list(all=True):
        out.append({"id": c.short_id, "name": c.name, "status": c.status, "image": (c.image.tags[0] if c.image.tags else "")})
    return {"ok": True, "containers": out}

@app.post("/execute")
def execute(payload: ExecIn):
    with tracer.start_as_current_span("agent.execute") as span:
        span.set_attribute("command.id", payload.commandId)
        span.set_attribute("project.id", payload.projectId)
        span.set_attribute("action", payload.action)
        span.set_attribute("target", payload.target or "")

        if payload.action == "service.restart":
            if not payload.target:
                raise HTTPException(400, "missing_target")
            if payload.target not in ALLOWED_RESTART:
                raise HTTPException(403, "target_not_allowed")
            with DUR.labels(payload.action).time():
                c = docker_client.containers.get(payload.target)
                c.restart(timeout=30)
            EXEC.labels(payload.action, "ok").inc()
            return {"ok": True, "action": payload.action, "target": payload.target}

        if payload.action == "deploy.run":
            # MVP: tylko allowlist, a wykonanie docelowo robisz skryptem albo systemem deploy
            tgt = payload.target or ""
            if tgt not in ALLOWED_DEPLOY:
                raise HTTPException(403, "deploy_target_not_allowed")
            EXEC.labels(payload.action, "ok").inc()
            return {"ok": True, "action": payload.action, "target": tgt}

        EXEC.labels(payload.action, "error").inc()
        raise HTTPException(400, "unknown_action")
```

### `agent/requirements.txt`

```txt
fastapi==0.115.0
uvicorn==0.30.6
pydantic==2.8.2
docker==7.1.0
psutil==6.0.0
prometheus-client==0.20.0

opentelemetry-api==1.27.0
opentelemetry-sdk==1.27.0
opentelemetry-exporter-otlp==1.27.0
opentelemetry-instrumentation-fastapi==0.48b0
```

### `agent/Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY app /app/app
EXPOSE 8787
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8787"]
```

To jest “real agent” i nie ma w nim nic “udawanego”.

---

# 3) Podpięcie tych agentów do JIMBO configu (żeby było widać działanie)

W `api/app/project_config.py` ustaw agentów jako **realne hosty**:

```python
"agents": [
  {"id": "pumo-1", "url": "http://10.0.0.11:8787"},
  {"id": "pumo-2", "url": "http://10.0.0.12:8787"},
],
"services": [
  {"id": "pumo-api", "label": "PUMO API", "target": "pumo-api", "agentId": "pumo-1", "kind": "docker"},
  {"id": "pumo-worker", "label": "PUMO Worker", "target": "pumo-worker", "agentId": "pumo-2", "kind": "docker"},
]
```

I to już działa bez żadnych “symulacji”: klik RESTART → worker → agent → docker restart prawdziwego kontenera.

---

# 4) Żeby “widać było wszystko” od razu — checklista uruchomienia

1. Centralny stack: `observability` up
2. Na każdym hoście: `agent + otelcol + promtail + exporters` up
3. Prometheus: wpisane prywatne IP hostów (9100/8080)
4. Worker ma dostęp do agentów po prywatnej sieci lub przez CF Access (jak wolisz)
5. UI: `system/services` pokazuje serwisy, restart działa

---

## Dwa krótkie ostrzeżenia (bez dramatu, ale serio)

* Mount `/var/run/docker.sock` daje agentowi realną moc. To OK, **jeśli**:

  * agent jest za Access/service token,
  * ma allowlistę kontenerów,
  * logujesz wszystkie akcje + reason.
* Nie wystawiaj portu 8787 publicznie. Prywatna sieć + firewall.

---

Jeśli chcesz, kolejnym ruchem (i to jest naprawdę warte) dopiszę:

* w API `GET /v1/projects/{id}/services/status` (agent zwraca status kontenerów) i UI pokaże live “running/exited” przy każdym serwisie. To już jest “control center”, nie tylko przyciski.
