Dobra. “OPEN IN GRAFANA” robimy tak, żeby:

* nie ciągnąć logów przez API (to już masz jako tail),
* tylko przerzucać się jednym kliknięciem do **Grafana → Explore → Loki** z gotowym filtrem na serwis/host,
* i żeby to było stabilne (nie zależne od przypadkowych ID kontenerów).

Klucz: w promtail już doklejasz label `host`. Dołóżmy jeszcze **label `container`** (ale nie trace_id!). Potem w Grafanie filtrujesz `{host="pumo-1", container="pumo-api"}`.

---

## 1) Promtail na hostach: dodaj label `container`

W `host-observe/promtail-config.yml` (ten który zbiera `/var/lib/docker/containers/*/*-json.log`) dopisz pipeline stage, który mapuje `container_name` do label `container`.

### Najprościej (działa na docker stage): regex po ścieżce + label

Promtail zna `__path__`, więc wyciągniemy container-id z path, a potem możemy labelować `container_id`. Ale Tobie zależy na **nazwie** kontenera, nie ID.

Najstabilniej: **uruchamiaj kontenery z labelami** i zbieraj z docker metadata. Promtail ma stage `docker` który wyciąga części, ale nazwy kontenera z samego json-log nie są zawsze proste.

**Szybkie i praktyczne MVP**: w UI linkujemy po `target` (nazwa kontenera), a w Loki filtrujemy po `job="docker"` + `host="..."` i w query używamy `|= "pumo-api"` (string match). To jest “brutalne”, ale działa od razu bez grzebania w metadanych.

Jeśli chcesz jednak porządnie: trzeba przejść na **Grafana Alloy** albo promtail z docker service discovery (dodatkowa robota). Na razie: MVP.

---

## 2) Ustal bazę Grafany w UI

Dodaj w `.env` frontu:

```env
VITE_GRAFANA_BASE=https://grafana.twoja-domena.tld
```

(domena za Cloudflare Access – najlepiej)

---

## 3) Generator linku Explore Loki

Grafana Explore przyjmuje stan w URL (czasem zmienia format między wersjami), ale jest jeden stabilny hack: link do Explore + query przez parametry `left=` (JSON). W praktyce działa w Grafana 9–11.

Dodaj helper:

### `packages/core/src/grafana.ts` (NOWY)

```ts
export function grafanaExploreLokiUrl(opts: {
  grafanaBase: string;
  host: string;
  needle: string; // np. container name / target
  timeRangeMs?: number; // default 30m
}) {
  const base = opts.grafanaBase.replace(/\/+$/, "");
  const range = opts.timeRangeMs ?? 30 * 60 * 1000;
  const to = Date.now();
  const from = to - range;

  // Loki query: filtr po host label i tekstowe dopasowanie do kontenera/target
  // {job="docker",host="pumo-1"} |= "pumo-api"
  const expr = `{job="docker",host="${opts.host}"} |= "${opts.needle}"`;

  const left = {
    datasource: "Loki",
    queries: [{ expr, refId: "A" }],
    range: { from: new Date(from).toISOString(), to: new Date(to).toISOString() },
  };

  const encoded = encodeURIComponent(JSON.stringify(left));
  return `${base}/explore?left=${encoded}`;
}
```

> Jeśli Twoja datasource w Grafanie nie nazywa się “Loki”, tylko np. “Loki (OPS)”, zmień `datasource` na właściwą nazwę z provisioning.

---

## 4) W UI: dodaj przycisk “OPEN IN GRAFANA” per serwis

W `apps/project/src/pages/Services.tsx`:

### Import helpera

```tsx
import { grafanaExploreLokiUrl } from "@core/grafana";
```

### W miejscu renderu serwisu dodaj link

Masz `s.target` (nazwa kontenera) i `agentId`. Do linku potrzebujesz **host label**.

Tu są dwa warianty:

### Wariant A (prosty): host = agentId

Ustal w promtail `host: pumo-1` i niech to będzie dokładnie agentId. Wtedy host label = agentId i jest spójnie.

Wtedy w JSX przy przyciskach:

```tsx
const grafanaBase = import.meta.env.VITE_GRAFANA_BASE as string | undefined;
const canOpenGrafana = !!grafanaBase;

const url = canOpenGrafana
  ? grafanaExploreLokiUrl({
      grafanaBase,
      host: s.agentId,     // musi odpowiadać labelowi host w promtail
      needle: s.target,    // nazwa kontenera/serwisu
      timeRangeMs: 60 * 60 * 1000, // 1h
    })
  : null;
```

I przyciski:

```tsx
{url && (
  <a className="btn" href={url} target="_blank" rel="noreferrer">
    OPEN IN GRAFANA
  </a>
)}
```

### Wariant B (bardziej poprawny): hostName w configu

Jeśli agentId ≠ host label, dopisz w `project_config.py` pole `host` przy agencie (np. `{"id":"pumo-1","url":"...","host":"pumo-1"}`) i w UI użyj `agent.host`. To wymaga małej zmiany w backendowym schema projects (dopisz `host?: string`).

Na MVP bierz wariant A.

---

## 5) Mała kosmetyka: disable jeśli brak VITE_GRAFANA_BASE

Jeśli ktoś odpali UI lokalnie bez env, przycisk się nie pojawi — OK.

---

## 6) Szybka checklista, żeby to zadziałało od razu

1. Na hostach promtail ma label `host: <agentId>` (np. `pumo-1`)
2. Kontenery faktycznie logują “pumo-api” w swoich logach (zwykle nazwa pojawia się w prefixach, ale jeśli nie — to i tak możesz użyć `needle` jako np. fragment loga albo endpoint)
3. Grafana ma datasource o nazwie `"Loki"` (albo zmienisz w helperze)
4. `VITE_GRAFANA_BASE` ustawione na domenę Grafany

---

## Upgrade, który naprawdę warto zrobić później (żeby filtrować po contaner label, nie string search)

* przejść na **Grafana Alloy** (albo promtail z docker discovery),
* dorzucić label `container="<container_name>"`,
* wtedy query w linku: `{job="docker",host="pumo-1",container="pumo-api"}` (bez `|=`).

Ale na start: Twój “OPEN IN GRAFANA” już będzie użyteczny i nie blokuje przyszłego rozwoju.

Chcesz, żebym od razu dopisał wariant “lepszy” (container label przez Alloy), czy zostawiamy MVP i idziemy dalej w stronę “incidents/alerts” w HUB?
