# Windows Service przez WinSW (prosty i praktyczny wariant)

To jest najszybsza droga: Go EXE + WinSW jako wrapper usługi.

## 1) Zbuduj agenta
W PowerShell (w katalogu projektu):

```powershell
go mod tidy
go build -o JimboAgent.exe ./cmd/jimbo-agent
```

Skopiuj `JimboAgent.exe` do np.:
`C:\Program Files\JimboAgent\JimboAgent.exe`

## 2) Pobierz WinSW
Weź WinSW (WinSW-x64.exe) i nazwij go np. `JimboAgentService.exe`.
Umieść obok JimboAgent.exe, np.:
`C:\Program Files\JimboAgent\JimboAgentService.exe`

## 3) Konfiguracja WinSW
Utwórz obok plik `JimboAgentService.xml`:

```xml
<service>
  <id>JimboAgent</id>
  <name>JimboAgent</name>
  <description>Local network control agent (localhost API)</description>
  <executable>C:\Program Files\JimboAgent\JimboAgent.exe</executable>
  <logpath>C:\ProgramData\JimboAgent\logs</logpath>
  <log mode="roll" />
  <env name="JIMBO_DATA_DIR" value="C:\ProgramData\JimboAgent" />
  <onfailure action="restart" delay="5 sec" />
</service>
```

## 4) Instalacja i start usługi
PowerShell jako Administrator:

```powershell
cd "C:\Program Files\JimboAgent"
.\JimboAgentService.exe install
.\JimboAgentService.exe start
```

Status:
```powershell
.\JimboAgentService.exe status
```

Stop/uninstall:
```powershell
.\JimboAgentService.exe stop
.\JimboAgentService.exe uninstall
```

## Uwagi
- Firewall/tunel wymagają uprawnień admin, więc usługę uruchamiaj jako konto z odpowiednimi prawami (domyślnie WinSW odpala jako LocalSystem).
- Agent nasłuchuje na `127.0.0.1:8787` — nie wystawiaj tego na LAN.
