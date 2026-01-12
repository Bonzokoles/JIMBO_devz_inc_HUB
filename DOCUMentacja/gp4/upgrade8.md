Dobra — wtedy robimy to “normalnie”: **metryki po prywatnej sieci**, a **Cloudflare tylko dla ludzi (GUI) i ewentualnie worker→agent**. To jest stabilne i nie robi z Prometheusa akrobaty.

Poniżej konkret: jak to spiąć, co wystawić, co zablokować, i gotowe zmiany w configach.

---

## 1) Zasada sieciowa

### Prywatna sieć (VPN / LAN / overlay)

Udostępniasz **tylko**:

* node_exporter `9100/tcp`
* cadvisor `8080/tcp`
* (opcjonalnie) agent `/metrics` jeśli chcesz, ale to już luksus
* promtail → Loki (to jest outbound z hosta do centralnego)

### Publicznie (internet)

* nic z tych portów
* Grafana/Prometheus/Alertmanager/Uptime Kuma: najlepiej też nie publicznie; jeśli chcesz dostęp “z zewnątrz” — to **Cloudflare Access**.

---

## 2) Centralny Prometheus: targets po prywatnych IP

W `observability/prometheus/prometheus.yml` zostawiasz targety jako prywatne IP:

```yaml
  - job_name: nodes
    static_configs:
      - targets:
          - "10.0.0.11:9100"
          - "10.0.0.12:9100"

  - job_name: cadvisor
    static_configs:
      - targets:
          - "10.0.0.11:8080"
          - "10.0.0.12:8080"
```

To wszystko. Żadnych Access tokenów, żadnego tunelowania metryk.

---

## 3) Per-host compose: nie wystawiaj portów publicznie

Jeśli host ma prywatny IP, a firewall blokuje publiczne, to nawet jak w compose masz `ports:`, to i tak będzie działało “lokalnie”. Ale ja wolę twardo: **bindować tylko na prywatnym interfejsie** albo na `127.0.0.1` + reverse przez prywatny routing.

### Najprostsze (i OK): bind na 0.0.0.0, ale firewall rules tylko private

Jeżeli masz UFW/iptables, zrób:

* pozwól `9100/8080` tylko z IP centralnego Prometheusa
* drop resztę

Przykład (UFW):

```bash
ufw allow from 10.0.0.20 to any port 9100 proto tcp
ufw allow from 10.0.0.20 to any port 8080 proto tcp
ufw deny 9100/tcp
ufw deny 8080/tcp
```

(10.0.0.20 = IP serwera observability)

### “Czyściej”: publikuj porty tylko na prywatnym IP

W docker-compose na hoście możesz zrobić:

```yaml
ports:
  - "10.0.0.11:9100:9100"
```

Ale to zależy od systemu i interfejsów — firewall jest zwykle szybszy w utrzymaniu.

---

## 4) Promtail i OTEL: też po prywatnej

### Promtail → Loki

W `host-observe/promtail-config.yml` ustaw `clients.url` na prywatny adres centralnego Loki:

```yaml
clients:
  - url: http://10.0.0.20:3100/loki/api/v1/push
```

### Edge OTEL collector → central collector

W `host-observe` env:

```env
CENTRAL_OTLP_ENDPOINT=http://10.0.0.20:4317
```

---

## 5) Centralny stack: ogranicz ekspozycję portów (bezpiecznie)

Jeśli masz dostęp do Grafany i reszty przez Cloudflare Access, to na serwerze observability możesz:

* **nie wystawiać Prometheusa/Alertmanager/Loki/Tempo** publicznie wcale
* zostawić tylko wewnętrznie w sieci dockera
* a na zewnątrz (przez CF Access) wystawić tylko Grafanę (i ewentualnie Uptime Kuma)

### Minimalnie: wystaw tylko Grafanę i Kuma

W `observability/docker-compose.yml`:

* zostaw `grafana:3000`, `uptime-kuma:3001`
* reszcie możesz nawet usunąć `ports:` (będą dostępne tylko w sieci compose)

Przykład (co usuwać):

* loki `3100` – usuń `ports` (promtail i grafana gadają po sieci compose)
* prometheus `9090` – usuń `ports`
* alertmanager `9093` – usuń `ports`
* tempo `3200/4317/4318` – usuń `ports` (albo zostaw `3200` jeśli chcesz debug)
* otel-collector `4317/4318/8888` – jeśli hosty łączą się po prywatnej sieci, to **musisz** wystawić `4317` na hosta, ale nie na internet (firewall). Możesz zostawić `ports`, ale firewall ogarnia.

---

## 6) Cloudflare Access: tylko do UI

W Cloudflare Access robisz aplikacje:

* `grafana.ops.tld` → serwer:3000
* `kuma.ops.tld` → serwer:3001
* (opcjonalnie) `prom.ops.tld` → serwer:9090 (ja bym nie wystawiał, chyba że naprawdę chcesz)

Reszta zostaje prywatna.

---

## 7) Bonus: “service discovery” bez ręcznego wpisywania hostów

Jeśli hostów będzie dużo, ręczne IP w `prometheus.yml` zacznie boleć. Najprostsze opcje:

1. **file_sd_configs**: generujesz plik `targets.json` z JIMBO HUB (masz już system)
2. **Consul** (cięższe)
3. **Docker swarm/k8s discovery** (jeśli kiedyś przejdziesz)

Na teraz polecam **file_sd** (proste, odporne).

Jeśli chcesz, rozpiszę gotowca:

* `prometheus.yml` z `file_sd_configs`
* format `targets.json`
* endpoint w Twoim FastAPI, który generuje targets z configu projektów

---

Jeżeli mówisz “do prywatnej też”, to mamy spójny plan:

* metryki/logi/traces lecą po prywatnej,
* UI wystawiasz przez Cloudflare Access,
* i masz realny NOC bez cyrku.

Chcesz teraz:

1. dorzucić **file_sd_configs** (automatyczne targety dla Prometheusa), czy
2. zrobić **Grafana Derived Fields** (klik z loga do trace) jako następny krok?
