# Setup Windows Task Scheduler - 10x Daily Sync
# MUSI być uruchomiony jako Administrator!
#
# Harmonogram: Co 2h24m (10 razy dziennie)
# Godziny: 00:00, 02:24, 04:48, 07:12, 09:36, 12:00, 14:24, 16:48, 19:12, 21:36

# Sprawdź uprawnienia administratora
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ BŁĄD: Musisz uruchomić ten skrypt jako Administrator!" -ForegroundColor Red
    Write-Host "   Kliknij prawym na PowerShell → Uruchom jako administrator" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "`n🔧 INSTALACJA SCHEDULED TASK - 10x DZIENNIE`n" -ForegroundColor Cyan

# Konfiguracja
$TaskName = "PUMO_IdoSell_Sync_10xDaily"
$ScriptPath = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\scripts\scheduled_sync_10x_daily.ps1"
$LogPath = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\logs\task_scheduler.log"

# Sprawdź czy skrypt istnieje
if (!(Test-Path $ScriptPath)) {
    Write-Host "❌ BŁĄD: Skrypt nie istnieje: $ScriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Skrypt znaleziony: $ScriptPath" -ForegroundColor Green

# Usuń istniejące zadanie (jeśli istnieje)
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "⚠️  Usuwam istniejące zadanie..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Definiuj triggery - 10 razy dziennie
$triggers = @()

# Godziny: 00:00, 02:24, 04:48, 07:12, 09:36, 12:00, 14:24, 16:48, 19:12, 21:36
$schedules = @(
    @{Hour=0; Minute=0},
    @{Hour=2; Minute=24},
    @{Hour=4; Minute=48},
    @{Hour=7; Minute=12},
    @{Hour=9; Minute=36},
    @{Hour=12; Minute=0},
    @{Hour=14; Minute=24},
    @{Hour=16; Minute=48},
    @{Hour=19; Minute=12},
    @{Hour=21; Minute=36}
)

foreach ($schedule in $schedules) {
    $trigger = New-ScheduledTaskTrigger -Daily -At "$($schedule.Hour):$($schedule.Minute)"
    $triggers += $trigger
}

Write-Host "✅ Utworzono 10 triggerów (co ~2h24m)" -ForegroundColor Green

# Definiuj akcję
$action = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -LogLevel INFO >> `"$LogPath`" 2>&1"

Write-Host "✅ Akcja zdefiniowana" -ForegroundColor Green

# Ustawienia zadania
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -MultipleInstances IgnoreNew

Write-Host "✅ Ustawienia skonfigurowane" -ForegroundColor Green

# Rejestruj zadanie
try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Trigger $triggers `
        -Action $action `
        -Settings $settings `
        -Description "Automatyczny sync danych IdoSell → PUMO Analytics (10x dziennie)" `
        -User $env:USERNAME `
        -RunLevel Highest `
        -Force
    
    Write-Host "`n✅ ZADANIE ZAINSTALOWANE POMYŚLNIE!" -ForegroundColor Green
    Write-Host "`n📋 SZCZEGÓŁY:" -ForegroundColor Cyan
    Write-Host "   Nazwa: $TaskName" -ForegroundColor White
    Write-Host "   Częstotliwość: 10x dziennie (co ~2h24m)" -ForegroundColor White
    Write-Host "   Godziny: 00:00, 02:24, 04:48, 07:12, 09:36, 12:00, 14:24, 16:48, 19:12, 21:36" -ForegroundColor White
    Write-Host "   Skrypt: $ScriptPath" -ForegroundColor White
    Write-Host "   Logi: $LogPath" -ForegroundColor White
    
    Write-Host "`n🔍 TESTOWANIE:" -ForegroundColor Yellow
    Write-Host "   Uruchom ręcznie: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
    Write-Host "   Sprawdź status: Get-ScheduledTask -TaskName '$TaskName' | fl" -ForegroundColor Gray
    Write-Host "   Zobacz logi: Get-Content '$LogPath' -Tail 50" -ForegroundColor Gray
    
    Write-Host "`n🚀 TEST URUCHOMIENIA..." -ForegroundColor Cyan
    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 2
    
    $taskInfo = Get-ScheduledTaskInfo -TaskName $TaskName
    Write-Host "   Ostatnie uruchomienie: $($taskInfo.LastRunTime)" -ForegroundColor White
    Write-Host "   Wynik: $($taskInfo.LastTaskResult) (0 = sukces)" -ForegroundColor White
    
    Write-Host "`n✅ GOTOWE! Zadanie działa w tle." -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ BŁĄD podczas instalacji: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
