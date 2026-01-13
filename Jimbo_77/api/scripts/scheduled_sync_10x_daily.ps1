# Scheduled Sync - 10x Daily Data Fetch from IdoSell
# Pobiera zmiany ze sklepu co ~2.4h (10 razy dziennie)
# 
# HARMONOGRAM:
# 00:00, 02:24, 04:48, 07:12, 09:36, 12:00, 14:24, 16:48, 19:12, 21:36
#
# Instalacja: 
# Uruchom jako Administrator: .\setup_scheduled_task.ps1

param(
    [string]$LogLevel = "INFO"  # INFO, DEBUG, ERROR
)

# Konfiguracja
$API_KEY = "YXBwbGljYXRpb24yMTpRRnVqMXlZVWFua3ZnekZSNUFQNndRRGd6aTNuTTVJd21SVkgwbXBzcmJYM3pWZWNrZDkyMWlqZnZ3LzJZWFVn"
$API_BASE = "https://meblepumo.iai-shop.com/api/admin/v3"
$EXPORT_DIR = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\exports"
$LOG_DIR = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\logs"

# Timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$today = Get-Date -Format "yyyy-MM-dd"
$logFile = "$LOG_DIR\sync_$today.log"

# Funkcja logowania
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $time = Get-Date -Format "HH:mm:ss"
    $logMessage = "[$time] [$Level] $Message"
    
    # Console
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARN" { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        default { Write-Host $logMessage -ForegroundColor White }
    }
    
    # File
    Add-Content -Path $logFile -Value $logMessage
}

# Tworzenie katalogów
if (!(Test-Path $EXPORT_DIR)) { New-Item -ItemType Directory -Path $EXPORT_DIR -Force | Out-Null }
if (!(Test-Path $LOG_DIR)) { New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null }

Write-Log "========================================" "INFO"
Write-Log "SCHEDULED SYNC - START" "INFO"
Write-Log "========================================" "INFO"

# Headers
$headers = @{
    'X-API-KEY'    = $API_KEY
    'Content-Type' = 'application/json'
}

# Śledź metryki
$metrics = @{
    products_new     = 0
    products_updated = 0
    orders_new       = 0
    orders_updated   = 0
    errors           = 0
    duration_seconds = 0
}

$startTime = Get-Date

try {
    # 1. Pobierz ostatnią zmianę produktów (last 3 hours)
    Write-Log "Pobieranie zmienionych produktów (ostatnie 3h)..." "INFO"
    
    $threeHoursAgo = (Get-Date).AddHours(-3).ToString("yyyy-MM-dd HH:mm:ss")
    $productsUrl = "$API_BASE/products/products?limit=100&page=1&updated_after=$threeHoursAgo"
    
    $productsResponse = Invoke-RestMethod -Uri $productsUrl -Headers $headers -Method GET -ErrorAction Stop
    $changedProducts = $productsResponse.results
    
    Write-Log "Znaleziono $($changedProducts.Count) zmienionych produktów" "SUCCESS"
    $metrics.products_updated = $changedProducts.Count
    
    # 2. Pobierz nowe zamówienia (last 3 hours)
    Write-Log "Pobieranie nowych zamówień (ostatnie 3h)..." "INFO"
    
    $ordersUrl = "$API_BASE/orders/orders?limit=100&page=1&order_add_date_from=$threeHoursAgo"
    
    $ordersResponse = Invoke-RestMethod -Uri $ordersUrl -Headers $headers -Method GET -ErrorAction Stop
    $newOrders = $ordersResponse.results
    
    Write-Log "Znaleziono $($newOrders.Count) nowych zamówień" "SUCCESS"
    $metrics.orders_new = $newOrders.Count
    
    # 3. Zapisz do plików JSON (incremental)
    if ($changedProducts.Count -gt 0) {
        $productsFile = "$EXPORT_DIR\products_incremental_$timestamp.json"
        $changedProducts | ConvertTo-Json -Depth 10 | Set-Content -Path $productsFile -Encoding UTF8
        Write-Log "Zapisano produkty do: $productsFile" "SUCCESS"
    }
    
    if ($newOrders.Count -gt 0) {
        $ordersFile = "$EXPORT_DIR\orders_incremental_$timestamp.json"
        $newOrders | ConvertTo-Json -Depth 10 | Set-Content -Path $ordersFile -Encoding UTF8
        Write-Log "Zapisano zamówienia do: $ordersFile" "SUCCESS"
    }
    
    # 4. Opcjonalnie: wyślij do Cloudflare D1 (jeśli API jest dostępne)
    $localApiUrl = "http://localhost:8001/v1/analytics/sync-incremental"
    
    try {
        $syncPayload = @{
            products  = $changedProducts
            orders    = $newOrders
            timestamp = $timestamp
        } | ConvertTo-Json -Depth 10
        
        $syncResponse = Invoke-RestMethod -Uri $localApiUrl -Method POST -Body $syncPayload -ContentType "application/json" -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        Write-Log "Dane zsynchronizowane z lokalnym API" "SUCCESS"
    }
    catch {
        Write-Log "Lokalne API niedostępne - pominięto sync (to normalne)" "WARN"
    }
    
    # 5. Metryki końcowe
    $endTime = Get-Date
    $metrics.duration_seconds = [math]::Round(($endTime - $startTime).TotalSeconds, 2)
    
    Write-Log "========================================" "INFO"
    Write-Log "SYNC COMPLETE - METRYKI:" "SUCCESS"
    Write-Log "  Produkty zaktualizowane: $($metrics.products_updated)" "INFO"
    Write-Log "  Zamówienia nowe: $($metrics.orders_new)" "INFO"
    Write-Log "  Czas wykonania: $($metrics.duration_seconds)s" "INFO"
    Write-Log "  Błędy: $($metrics.errors)" "INFO"
    Write-Log "========================================" "INFO"
    
    # Zapisz metryki
    $metricsFile = "$LOG_DIR\metrics_$today.json"
    $metrics | ConvertTo-Json | Add-Content -Path $metricsFile
    
    exit 0
    
}
catch {
    $metrics.errors += 1
    Write-Log "BŁĄD KRYTYCZNY: $($_.Exception.Message)" "ERROR"
    Write-Log $_.ScriptStackTrace "ERROR"
    
    exit 1
}
