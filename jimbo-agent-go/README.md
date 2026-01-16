# JimboAgent (Windows, Go) — lokalny agent do kontroli sieci

To jest **lokalny agent** działający na Windows jako proces/usługa. UI (dashboard) gada z nim po HTTP/WS na `127.0.0.1:8787`.

## Co robi v1
- Net: `ipconfig /all`, `route print`, `ping`, `tracert`
- Firewall: dodawanie/usuwanie/listowanie reguł przez `netsh advfirewall`
- Tunel: zarządzanie `cloudflared` (start/stop/status) + log stream (WebSocket) + log tail

Uczciwie: to nie jest “systemowy router”, tylko **sterowanie tym komputerem**.

---

## Szybki start (DEV)
1) Zainstaluj Go 1.22+
2) W folderze projektu:

```powershell
go mod tidy
go run ./cmd/jimbo-agent
```

3) Token do API znajdziesz w:
`C:\ProgramData\JimboAgent\secret.txt`

Test:
```powershell
$token = Get-Content "C:\ProgramData\JimboAgent\secret.txt"
Invoke-RestMethod -Headers @{Authorization="Bearer $token"} -Uri http://127.0.0.1:8787/health
```

---

## Cloudflared jako domyślny tunel
Agent tworzy (jeśli brak) plik:
`C:\ProgramData\JimboAgent\config.json`

Domyślnie wygląda tak:
- `cloudflared.binPath`: `cloudflared`
- `cloudflared.defaultArgs`: `["tunnel","--no-autoupdate","run","<TUNNEL_NAME>"]`

### Ważne
Musisz podmienić `<TUNNEL_NAME>` na nazwę Twojego tunelu, albo wołać `/tunnel/start` z własnymi `args`.

---

## API
Wszystko (oprócz `/health`) wymaga nagłówka:
`Authorization: Bearer <token>`

### Health
- `GET /health`

### Net
- `GET /net/status`
- `POST /net/ping` `{ "host": "1.1.1.1", "count": 4 }`
- `POST /net/tracert` `{ "host": "example.com" }`

### Firewall
- `GET /firewall/rules`
- `POST /firewall/rule/add`
  ```json
  {
    "name": "Block Chrome",
    "dir": "out",
    "action": "block",
    "program": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "protocol": "ANY"
  }
  ```
- `POST /firewall/rule/remove` `{ "name": "Block Chrome" }`

### Tunnel (cloudflared)
- `POST /tunnel/start`  (body opcjonalne)
  - bez body: używa `config.json` (binPath + defaultArgs)
  - z body:
    ```json
    {
      "binPath": "cloudflared",
      "args": ["tunnel","--no-autoupdate","run","mytunnel"]
    }
    ```
- `POST /tunnel/stop`
- `GET /tunnel/status`
- `GET /tunnel/log-tail`

### Stream (SSE)
- `GET /stream` (Server-Sent Events)
  - eventy: `heartbeat`, `log`, `tunnel`

---

## Bezpieczeństwo (krótko)
- Agent nasłuchuje tylko na `127.0.0.1`
- Token jest wymagany
- CORS jest ograniczony do localhost (konfig w `cmd/jimbo-agent/main.go`)

---

## Uruchomienie jako Windows Service (prod)
Zobacz: `docs/windows-service-winsw.md`
