# FastAPI Server Startup Script
# Uruchom FastAPI na localhost:8001 z auto-reload

Write-Host "`n🚀 URUCHAMIANIE FASTAPI SERVER" -ForegroundColor Cyan

$apiPath = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api"

# Check if in correct directory
if (!(Test-Path "$apiPath\app\main.py")) {
    Write-Host "❌ Błąd: Nie znaleziono app\main.py" -ForegroundColor Red
    Write-Host "Ścieżka: $apiPath" -ForegroundColor Gray
    exit 1
}

Set-Location $apiPath

# Check if virtual environment exists
if (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "📦 Aktywuję virtual environment..." -ForegroundColor Yellow
    .\.venv\Scripts\Activate.ps1
}
else {
    Write-Host "⚠️  Virtual environment nie znaleziony - używam globalnego Python" -ForegroundColor Yellow
}

# Check dependencies
Write-Host "`n📋 Sprawdzam dependencies..." -ForegroundColor Yellow
$required = @("fastapi", "uvicorn", "sqlalchemy", "httpx")
foreach ($pkg in $required) {
    try {
        python -c "import $($pkg.Replace('-', '_'))" 2>$null
        Write-Host "   ✅ $pkg" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ $pkg - brak! Instaluję..." -ForegroundColor Red
        pip install $pkg
    }
}

# Show .env configuration
Write-Host "`n🔐 Konfiguracja (.env):" -ForegroundColor Cyan
if (Test-Path ".env") {
    $env_content = Get-Content ".env" | Select-String "IDOSELL|DATABASE|CLOUDFLARE"
    $env_content | ForEach-Object {
        $line = $_.Line
        if ($line -match "API_KEY|TOKEN|PASSWORD") {
            $parts = $line -split "=", 2
            Write-Host "   $($parts[0])=***" -ForegroundColor Gray
        }
        else {
            Write-Host "   $line" -ForegroundColor Gray
        }
    }
}
else {
    Write-Host "   ⚠️  .env nie znaleziony!" -ForegroundColor Yellow
}

# Show available endpoints
Write-Host "`n📡 Dostępne endpointy:" -ForegroundColor Cyan
Write-Host "   http://localhost:8001/docs - Swagger UI" -ForegroundColor White
Write-Host "   http://localhost:8001/v1/meble-pumo/idosell/export-to-d1 - Export do D1" -ForegroundColor White
Write-Host "   http://localhost:8001/v1/meble-pumo/status - Status sklepu" -ForegroundColor White
Write-Host "   http://localhost:8001/health - Health check" -ForegroundColor White

Write-Host "`n🎯 Przykładowy request:" -ForegroundColor Cyan
Write-Host @"
curl -X POST "http://localhost:8001/v1/meble-pumo/idosell/export-to-d1" `
  -H "Content-Type: application/json" `
  -d '{
    "api_key": "TWÓJ_KLUCZ",
    "method": "x-api-key",
    "entities": ["products", "orders"],
    "since_date": "2025-07-13"
  }'
"@ -ForegroundColor Gray

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🔥 Uruchamiam uvicorn na porcie 8001..." -ForegroundColor Green
Write-Host "   Naciśnij Ctrl+C aby zatrzymać" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray

# Start FastAPI with auto-reload
uvicorn app.main:app --port 8001 --reload --log-level info
