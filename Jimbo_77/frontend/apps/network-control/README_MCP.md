# Jimbo Network Control MCP Server

To localny serwer MCP zapewniający wiedzę o urządzeniach w Twojej sieci (adresy IP, selektory CSS do paneli logowania).

## Jak to działa?

Serwer współpracuje z **Apex Agent** (w modelu "Rodzeństwo/Sibling").
1. **Jimbo MCP:** Mówi agentowi "gdzie kliknąć" (daje URL i selektory CSS).
2. **Apex Agent:** Klika fizycznie w przeglądarce.

## Instalacja

1. Upewnij się, że masz Pythona 3.10+.
2. Zainstaluj zależności:
   ```powershell
   cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend\apps\network-control
   pip install -r requirements.txt
   ```

## Konfiguracja (mcp.json)

Dodaj poniższy wpis do swojego pliku `mcp.json` (w Claude Desktop lub ustawieniach Windsurf):

```json
{
  "mcpServers": {
    "jimbo-network-control": {
      "command": "python",
      "args": ["U:\\The_yellow_hub\\JIMBO_devz_inc_HUB\\Jimbo_77\\frontend\\apps\\network-control\\server.py"],
      "env": {
        "PYTHONUTF8": "1"
      }
    }
  }
}
```

## Konfiguracja Urządzeń

Edytuj plik `network.yaml`, aby dodać swoje urządzenia (adresy IP, selektory logowania).

```yaml
devices:
  - id: "Router_01"
    ip: "192.168.0.1"
    ...
```
