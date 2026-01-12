OK — dokładamy **OpenTelemetry Collector** jako “bufor/koncentrator” przed Tempo. To jest praktyczne, bo:

* hosty/agenty wysyłają OTLP do **kolektora** (jeden endpoint),
* collector może robić **sampling**, batchowanie, retry,
* dalej leci do **Tempo** (lokalnie w stacku).

Poniżej masz komplet: zmiany w `observability/docker-compose.yml` + `otel-collector/config.yaml` + co ustawiasz w API/worker/agentach.

---

## 1) Zmiany w strukturze katalogu

Dodaj:

```
observability/
  otel-collector/
    config.yaml
```

---

## 2) Dopisz service do `observability/docker-compose.yml`

Wklej **ten blok** do compose (obok tempo):

```yaml
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.106.1
    container_name: otel-collector
    command: ["--config=/etc/otelcol/config.yaml"]
    volumes:
      - ./otel-collector/config.yaml:/etc/otelcol/config.yaml:ro
    ports:
      - "4317:4317"   # OTLP gRPC in (z hostów / usług)
      - "4318:4318"   # OTLP HTTP in (opcjonalnie)
      - "8888:8888"   # collector metrics (dla Prometheus)
    depends_on:
      - tempo
```

> Ważne: teraz to **collector** ma porty 4317/4318 “na zewnątrz”. Tempo dalej ma swoje porty, ale nie musisz ich wystawiać publicznie (możesz zostawić jak jest albo ograniczyć).

---

## 3) `observability/otel-collector/config.yaml` (GOTOWIEC)

To przyjmie OTLP, dorzuci podstawowe atrybuty, zrobi batch i wyśle do Tempo.

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
    limit_mib: 512
    spike_limit_mib: 128

  batch:
    timeout: 2s
    send_batch_size: 1024
    send_batch_max_size: 2048

  attributes/add_common:
    actions:
      - key: ops.stack
        value: "jimbo77-observability"
        action: insert

  # Sampling (opcjonalnie): 100% na start, potem zmienisz na np. 0.2
  probabilistic_sampler:
    sampling_percentage: 100

exporters:
  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true

  # Debug (opcjonalnie): loguje spany w logach collectora
  logging:
    verbosity: basic

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

  pprof:
    endpoint: 0.0.0.0:1888

service:
  extensions: [health_check, pprof]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, attributes/add_common, probabilistic_sampler, batch]
      exporters: [otlp/tempo]
```

### Jak zmniejszyć sampling później

Zmień:

```yaml
probabilistic_sampler:
  sampling_percentage: 20
```

(= 20% trace’y)

---

## 4) Prometheus: zbieraj metryki collectora

W `prometheus/prometheus.yml` dopisz:

```yaml
  - job_name: otel-collector
    static_configs:
      - targets: ["otel-collector:8888"]
```

Collector sam wystawia metryki na `/metrics` pod portem `8888`.

---

## 5) Teraz gdzie wysyłają OTEL: API / Worker / Agent

### API (FastAPI)

Zmień env:

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_SERVICE_NAME=ops-api
```

### Worker (Celery)

Zmień env:

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_SERVICE_NAME=ops-worker
```

### Agent na hostach (najważniejsze)

Na hostach ustaw:

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://<CENTRAL_OBSERVABILITY_IP>:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_SERVICE_NAME=ops-agent-pumo-1
```

> Jeśli hosty nie mają prywatnej trasy do tego IP, to wtedy dopiero wchodzimy w Cloudflare Tunnel/VPN. Najzdrowiej: prywatna sieć/VPN. Cloudflare do OTLP bywa upierdliwy (gRPC + Access + timeouts).

---

## 6) Tempo: możesz (opcjonalnie) nie wystawiać 4317/4318

Skoro collector pośredniczy, Tempo nie musi mieć wystawionych 4317/4318 na hosta. W compose możesz ograniczyć ports dla tempo do samego 3200 (UI query):

```yaml
  tempo:
    ports:
      - "3200:3200"
```

Zostawienie 4317/4318 też nie szkodzi, ale po co kusić los.

---

## 7) Jak sprawdzić, że działa (bez zgadywania)

1. Odpal stack:

```bash
docker compose up -d
```

2. Sprawdź health collectora:

* `http://<server>:13133/` (health_check extension)
  Jeśli nie wystawiłeś portu 13133 na hosta — sprawdź z kontenera (docker exec).

3. Grafana → Explore → Tempo → powinny pojawić się trace’y po ruchu do API/Agenta.

---

## 8) Dwa sensowne ulepszenia (ale nie obowiązkowe na teraz)

1. **OTEL Collector na hostach** (edge collector)
   Jeśli hosty są “trudne sieciowo”, stawiasz mały collector obok agenta i on wysyła dalej do centralnego (lepsze retry, bufor).

2. **Korelacja logów z trace_id**
   Wtedy w Grafanie klikasz z loga w trace. Do tego trzeba w logach mieć `trace_id` (np. loguru/structlog + OTEL context).

---

Jeśli chcesz, następnym krokiem dopiszę:

* minimalny **OTEL Collector per-host** (mały compose: agent + otelcol),
* plus **log format** w API/agent/worker żeby dorzucać `trace_id` do logów (wtedy Loki ↔ Tempo spina się jak trzeba).
