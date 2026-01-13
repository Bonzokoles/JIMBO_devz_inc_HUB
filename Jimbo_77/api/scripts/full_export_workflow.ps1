# Complete IdoSell to D1 Export Workflow
# 1. Test key → 2. Start API → 3. Execute export

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("x-api-key", "bearer")]
    [string]$Method = "x-api-key",
    
    [Parameter(Mandatory=$false)]
    [string]$SinceDate = "2025-07-13",
    
    [Parameter(Mandatory=$false)]
    [string[]]$Entities = @("products", "orders")
)

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 PEŁNY WORKFLOW: IdoSell → Cloudflare D1" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$scriptsPath = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\scripts"

# STEP 1: Test API Key
Write-Host "📍 KROK 1/3: Testowanie klucza API..." -ForegroundColor Yellow
& "$scriptsPath\test_idosell_key.ps1" -ApiKey $ApiKey -Method $Method

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Klucz API nie działa! Przerwanie." -ForegroundColor Red
    exit 1
}

Read-Host "`n✅ Test OK. Naciśnij Enter aby uruchomić FastAPI..."

# STEP 2: Start FastAPI (in background)
Write-Host "`n📍 KROK 2/3: Uruchamianie FastAPI server..." -ForegroundColor Yellow

$fastApiJob = Start-Job -ScriptBlock {
    Set-Location "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api"
    uvicorn app.main:app --port 8001 --reload
}

Write-Host "   FastAPI Job ID: $($fastApiJob.Id)" -ForegroundColor Gray
Write-Host "   Czekam 5 sekund na startup..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Check if server is running
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8001/health" -Method GET -TimeoutSec 5
    Write-Host "   ✅ FastAPI działa! Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ FastAPI nie odpowiada!" -ForegroundColor Red
    Stop-Job -Id $fastApiJob.Id
    Remove-Job -Id $fastApiJob.Id
    exit 1
}

Read-Host "`n✅ Server OK. Naciśnij Enter aby wykonać eksport..."

# STEP 3: Execute Export
Write-Host "`n📍 KROK 3/3: Eksport do D1..." -ForegroundColor Yellow

$exportBody = @{
    api_key = $ApiKey
    method = $Method
    entities = $Entities
    since_date = $SinceDate
} | ConvertTo-Json

Write-Host "`nRequest body:" -ForegroundColor Gray
Write-Host $exportBody -ForegroundColor DarkGray

Write-Host "`nWysyłam POST /v1/meble-pumo/idosell/export-to-d1..." -ForegroundColor White

try {
    $response = Invoke-RestMethod `
        -Uri "http://localhost:8001/v1/meble-pumo/idosell/export-to-d1" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $exportBody `
        -TimeoutSec 300  # 5 minutes timeout
    
    Write-Host "`n✅ EKSPORT ZAKOŃCZONY!" -ForegroundColor Green
    
    # Show summary
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📊 PODSUMOWANIE EKSPORTU" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    
    # Test results
    if ($response.test_results) {
        Write-Host "🔍 Test API:" -ForegroundColor Yellow
        Write-Host "   Working endpoints: $($response.test_results.working_endpoints -join ', ')" -ForegroundColor Green
    }
    
    # Export summary
    if ($response.export_summary) {
        $summary = $response.export_summary
        Write-Host "`n📦 Dane pobrane z IdoSell:" -ForegroundColor Yellow
        
        if ($summary.data.products) {
            $p = $summary.data.products
            Write-Host "   Products: $($p.total_fetched) (batches: $($p.batches))" -ForegroundColor White
        }
        
        if ($summary.data.orders) {
            $o = $summary.data.orders
            Write-Host "   Orders: $($o.total_fetched) (batches: $($o.batches))" -ForegroundColor White
        }
    }
    
    # D1 results
    if ($response.d1_results) {
        Write-Host "`n💾 Zapisano do D1:" -ForegroundColor Yellow
        
        if ($response.d1_results.products) {
            $dp = $response.d1_results.products
            Write-Host "   Products: $($dp.inserted) inserted" -ForegroundColor Green
        }
        
        if ($response.d1_results.orders) {
            $do = $response.d1_results.orders
            Write-Host "   Orders: $($do.inserted) inserted" -ForegroundColor Green
        }
    }
    
    Write-Host "`n⏰ Timestamp: $($response.timestamp)" -ForegroundColor Gray
    
    # Full response
    Write-Host "`n📄 Pełna odpowiedź:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor DarkGray
    
} catch {
    Write-Host "`n❌ BŁĄD EKSPORTU!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nResponse body:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Red
    }
}

# Cleanup
Write-Host "`n🧹 Zamykanie FastAPI server..." -ForegroundColor Yellow
Stop-Job -Id $fastApiJob.Id
Remove-Job -Id $fastApiJob.Id
Write-Host "   ✅ Server zatrzymany" -ForegroundColor Green

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎯 WORKFLOW ZAKOŃCZONY!" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
