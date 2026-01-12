OK — lepszy wariant = **Grafana Alloy** zamiast promtail. Dzięki temu dostajesz stabilne label’e typu:

* `host="pumo-1"`
* `container="pumo-api"`
* (opcjonalnie) `project="pumo"`, `service="pumo-api"` itd.

I wtedy “OPEN IN GRAFANA” robi **precyzyjne** query bez `|= "tekst"`.

Poniżej masz komplet: **compose per-host**, **config Alloy**, **zmiana w Prometheus**, **zmiana w UI generatorze linków**.

---

## 1) Per-host: zamiana Promtail → Grafana Alloy

W katalogu hosta (np. `host-observe/`) dodaj plik:

### `host-observe/alloy.alloy` (NOWY)

To jest konfig Alloy, który:

* odkrywa kontenery z Dockera (po socket),
* zbiera logi kontenerów,
* etykietuje je `host` i `container`,
* wysyła do centralnego Loki.

```hcl
// ============ LOKI OUTPUT ============
loki.write "central" {
  endpoint {
    url = "http://10.0.0.20:3100/loki/api/v1/push" // <-- central Loki (prywatny)
  }
}

// ============ DISCOVERY: DOCKER ============
discovery.docker "containers" {
  host = "unix:///var/run/docker.sock"
}

// ============ PROCESSING: LABELS + PARSING ============
loki.process "docker_logs" {
  // static labels (nie generują kardynalności)
  stage.static_labels {
    values = {
      host = "pumo-1" // <-- ustaw per-host (albo podmienisz env + templating)
      job  = "docker"
    }
  }

  // nazwa kontenera jako label "container"
  stage.labels {
    values = {
      container = "container_name"
    }
  }

  // Docker JSON logs parsing
  stage.docker {}

  // (opcjonalnie) drop noise
  // stage.drop { expression = ".*healthcheck.*" }
}

// ============ SOURCE: DOCKER LOGS ============
loki.source.docker "containers" {
  host       = "unix:///var/run/docker.sock"
  targets    = discovery.docker.containers.targets
  forward_to = [loki.process.docker_logs.receiver]
}

// wire processed logs -> writer
loki.process "docker_logs" {
  forward_to = [loki.write.central.receiver]

  stage.static_labels {
    values = {
      host = "pumo-1"
      job  = "docker"
    }
  }

  stage.labels {
    values = {
      container = "container_name"
    }
  }

  stage.docker {}
}
```

> **UWAGA**: powyżej masz podwójny blok `loki.process "docker_logs"` bo Alloy wymaga, żeby `forward_to` było w procesorze, który dostaje z source i wysyła do writer.
> Jeśli chcesz “ładniej”, można to zwinąć, ale zostawiam czytelnie.

### Jak ustawiać `host` bez ręcznego edytowania

Najprościej: na każdym hoście trzymasz własny `alloy.alloy` z hostem. To i tak 1 linijka.

---

## 2) Per-host: docker-compose z Alloy

Podmień promtail w `host-observe/docker-compose.yml` na Alloy.

### `host-observe/docker-compose.yml` (FRAGMENT)

Usuń service `promtail` i dodaj:

```yaml
  alloy:
    image: grafana/alloy:v1.4.2
    container_name: alloy
    restart: unless-stopped
    command: ["run", "/etc/alloy/alloy.alloy"]
    volumes:
      - ./alloy.alloy:/etc/alloy/alloy.alloy:ro
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    ports:
      - "12345:12345" # opcjonalnie UI/metrics, możesz wywalić
```

> Alloy do logów Dockera i tak potrzebuje socket + dostęp do logów.
> Port 12345 możesz nie wystawiać, to tylko dla debug.

---

## 3) Centralny Loki: nic nie zmieniasz

Alloy pcha logi do Loki tak samo jak promtail.

---

## 4) Teraz query w Grafanie jest precyzyjne

Masz w Loki:

* `{job="docker", host="pumo-1", container="pumo-api"}`

I to jest dokładnie to, co chcesz do linka.

---

## 5) UI: “OPEN IN GRAFANA” — wersja poprawna z container label

Podmień helper w `packages/core/src/grafana.ts` na wersję, która robi query z labelami:

### `packages/core/src/grafana.ts` (PODMIANA)

```ts
export function grafanaExploreLokiUrl(opts: {
  grafanaBase: string;
  host: string;
  container: string;
  timeRangeMs?: number;
  datasourceName?: string; // default: "Loki"
}) {
  const base = opts.grafanaBase.replace(/\/+$/, "");
  const range = opts.timeRangeMs ?? 60 * 60 * 1000; // 1h
  const to = Date.now();
  const from = to - range;

  const ds = opts.datasourceName ?? "Loki";
  const expr = `{job="docker",host="${opts.host}",container="${opts.container}"}`;

  const left = {
    datasource: ds,
    queries: [{ expr, refId: "A" }],
    range: { from: new Date(from).toISOString(), to: new Date(to).toISOString() },
  };

  return `${base}/explore?left=${encodeURIComponent(JSON.stringify(left))}`;
}
```

W `ServicesPage` zmień wywołanie:

```tsx
const url = grafanaBase
  ? grafanaExploreLokiUrl({
      grafanaBase,
      host: s.agentId,      // musi = label host w Alloy config
      container: s.target,  // target = nazwa kontenera
      timeRangeMs: 2 * 60 * 60 * 1000, // 2h
    })
  : null;
```

I przycisk jak wcześniej.

---

## 6) Prometheus: metryki hosta dalej jak były

To się nie zmienia:

* node_exporter `9100`
* cadvisor `8080`

Alloy możesz też monitorować, ale nie musisz na start.

---

## 7) Najważniejsza zgodność: `host` label musi pasować do `agentId`

Żeby UI nie musiało znać “prawdziwej nazwy hosta” i mapować, zrób tak:

* w `project_config.py` agent ma `id: "pumo-1"`
* na hoście w `alloy.alloy` ustaw `host = "pumo-1"`

I temat zamknięty.

---

## 8) Bonus: dołóż label `project` i `service` (polecam)

W `alloy.alloy` w `stage.static_labels` możesz dodać:

```hcl
values = {
  host    = "pumo-1"
  job     = "docker"
  project = "pumo"
}
```

A `service` może być równy `container` albo osobno.

Wtedy query może być nawet `{project="pumo",container="pumo-api"}`.

---

## 9) Co usuwasz / przestaje być potrzebne

* `promtail-config.yml` na hostach – wylatuje
* `promtail` service – wylatuje

Centralny promtail (ten z observability hosta) możesz zostawić do zbierania logów *samego centralnego hosta*, albo też go zastąpić Alloy (ale to już kosmetyka).

---

Jeśli chcesz, mogę Ci też podać “wersję jednoplikową” `alloy.alloy` z użyciem **env var HOST_NAME**, żebyś nie edytował pliku per host (ale wtedy musisz wejść w templating lub generowanie pliku przy deployu). Na teraz najprościej: per-host jedna linijka i koniec.
