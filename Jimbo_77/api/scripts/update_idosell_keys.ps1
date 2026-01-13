# QUICK UPDATE - IdoSell API Keys
# Uruchom po otrzymaniu nowego klucza

param(
    [Parameter(Mandatory = $true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory = $false)]
    [string]$OAuthToken = ""
)

Write-Host "`n🔑 AKTUALIZACJA KLUCZY IDOSELL" -ForegroundColor Cyan

# 1. Update .env (local API)
$envPath = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\.env"
Write-Host "`n📝 Aktualizuję .env..." -ForegroundColor Yellow
(Get-Content $envPath) -replace 'IDOSELL_API_KEY=.*', "IDOSELL_API_KEY=$ApiKey" | Set-Content $envPath
Write-Host "   ✅ .env zaktualizowany" -ForegroundColor Green

# 2. Update wrangler.toml (Worker)
$wranglerPath = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\frontend\apps\pumo-api\wrangler.toml"
Write-Host "`n📝 Aktualizuję wrangler.toml..." -ForegroundColor Yellow
$content = Get-Content $wranglerPath -Raw
$content -replace 'IDOSELL_API_KEY = ".*"', "IDOSELL_API_KEY = `"$ApiKey`"" | Set-Content $wranglerPath
Write-Host "   ✅ wrangler.toml zaktualizowany" -ForegroundColor Green

# 3. Test connection
Write-Host "`n🔍 TESTOWANIE POŁĄCZENIA..." -ForegroundColor Magenta

$headers = @{
    'X-API-KEY' = $ApiKey
    'Accept'    = 'application/json'
}

$testEndpoints = @(
    '/api/admin/v3/products/products?page=1&limit=1',
    '/api/admin/v3/orders/orders?page=1&limit=1'
)

foreach ($endpoint in $testEndpoints) {
    $url = "https://meblepumo.iai-shop.com$endpoint"
    Write-Host "`nGET $endpoint" -ForegroundColor White
    
    try {
        $response = Invoke-RestMethod -Uri $url -Headers $headers -Method GET -TimeoutSec 10
        Write-Host "   ✅ SUCCESS!" -ForegroundColor Green
        
        if ($response.products) {
            Write-Host "   📦 Products: $($response.products.Count)" -ForegroundColor Yellow
        }
        if ($response.orders) {
            Write-Host "   🛒 Orders: $($response.orders.Count)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "   ❌ FAILED: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    }
}

# 4. Deploy worker
Write-Host "`n🚀 DEPLOY WORKERA..." -ForegroundColor Cyan
Set-Location "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\frontend\apps\pumo-api"
npx wrangler deploy

Write-Host "`n✅ GOTOWE!" -ForegroundColor Green
Write-Host "`nUruchom eksport:" -ForegroundColor Cyan
Write-Host "   POST https://jimbo-like-pumo-api.stolarnia-ams.workers.dev/api/idosell/export" -ForegroundColor White
