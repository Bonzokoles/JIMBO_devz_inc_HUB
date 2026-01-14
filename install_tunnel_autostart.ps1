# Skrypt instalacji Cloudflare Tunnel do autostartu (Task Scheduler)
# Uruchom jako Administrator: Right-click -> Run as Administrator

$TaskName = "CloudflareTunnel-Jimbo77"
$TunnelName = "jimbo77-klfhome"
$CloudflaredPath = (Get-Command cloudflared).Source
$WorkingDir = "U:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB"

# Komenda do uruchomienia
$Action = New-ScheduledTaskAction `
    -Execute $CloudflaredPath `
    -Argument "tunnel run $TunnelName" `
    -WorkingDirectory $WorkingDir

# Trigger - uruchom przy starcie systemu
$Trigger = New-ScheduledTaskTrigger -AtStartup

# Ustawienia - uruchom w tle, zawsze działaj
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Principal - uruchom jako bieżący użytkownik
$Principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -RunLevel Highest

# Usuń jeśli istnieje
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

# Zarejestruj task
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "Cloudflare Tunnel: $TunnelName - https://api.jimbo77.com" `
    -Force

Write-Host "[OK] Task utworzony: $TaskName" -ForegroundColor Green
Write-Host "Publiczny URL: https://api.jimbo77.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sprawdz: Task Scheduler -> Task Scheduler Library -> $TaskName" -ForegroundColor Yellow
Write-Host ""
Write-Host "Uruchamiam tunnel teraz..." -ForegroundColor Yellow
Start-ScheduledTask -TaskName $TaskName
Write-Host "[OK] Tunnel uruchomiony!" -ForegroundColor Green
