# QUICK TEST - IdoSell API Key
# Test klucza natychmiast po otrzymaniu

param(
    [Parameter(Mandatory = $true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("x-api-key", "bearer")]
    [string]$Method = "x-api-key"
)

Write-Host "`n🔑 TEST KLUCZA IDOSELL API" -ForegroundColor Cyan
Write-Host "Method: $Method" -ForegroundColor Gray
Write-Host "Key: $($ApiKey.Substring(0, 20))..." -ForegroundColor Gray

# Prepare headers
if ($Method -eq "x-api-key") {
    $headers = @{
        'X-API-KEY' = $ApiKey
        'Accept'    = 'application/json'
    }
}
else {
    $headers = @{
        'Authorization' = "Bearer $ApiKey"
        'Accept'        = 'application/json'
    }
}

# Test endpoints
$baseUrl = "https://meblepumo.iai-shop.com"
$tests = @(
    @{
        Name          = "Products (v3)"
        Url           = "/api/v3/products?limit=5"
        ExpectedField = "products"
    },
    @{
        Name          = "Products (admin/v3)"
        Url           = "/api/admin/v3/products/products?page=1&limit=5"
        ExpectedField = "products"
    },
    @{
        Name          = "Orders (v3)"
        Url           = "/api/v3/orders?limit=5"
        ExpectedField = "orders"
    },
    @{
        Name          = "Orders (admin/v3)"
        Url           = "/api/admin/v3/orders/orders?page=1&limit=5"
        ExpectedField = "orders"
    }
)

$results = @()

foreach ($test in $tests) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📍 $($test.Name)" -ForegroundColor White
    Write-Host "   GET $($test.Url)" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl$($test.Url)" -Headers $headers -Method GET -TimeoutSec 10
        
        Write-Host "   ✅ SUCCESS - Status 200" -ForegroundColor Green
        
        # Check data
        if ($response.PSObject.Properties.Name -contains $test.ExpectedField) {
            $count = $response.$($test.ExpectedField).Count
            Write-Host "   📦 Count: $count" -ForegroundColor Yellow
            
            if ($count -gt 0) {
                $item = $response.$($test.ExpectedField)[0]
                Write-Host "   🔍 Sample: $($item.id) - $($item.name ?? $item.product_name ?? 'N/A')" -ForegroundColor Cyan
            }
            
            $results += @{
                Endpoint = $test.Name
                Status   = "SUCCESS"
                Count    = $count
            }
        }
        else {
            Write-Host "   ⚠️  No '$($test.ExpectedField)' field in response" -ForegroundColor Yellow
            $response | ConvertTo-Json -Depth 1 -Compress | ForEach-Object {
                Write-Host "   $($_.Substring(0, [Math]::Min(200, $_.Length)))..." -ForegroundColor Gray
            }
            $results += @{
                Endpoint = $test.Name
                Status   = "NO_DATA"
                Count    = 0
            }
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        Write-Host "   ❌ FAILED - Status $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host "   🚫 Unauthorized - sprawdź scope 'admin' lub 'read'" -ForegroundColor Yellow
        }
        elseif ($statusCode -eq 404) {
            Write-Host "   🔍 Endpoint nie istnieje" -ForegroundColor Yellow
        }
        
        $results += @{
            Endpoint = $test.Name
            Status   = "FAILED_$statusCode"
            Count    = 0
        }
    }
}

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📊 PODSUMOWANIE" -ForegroundColor Cyan

$successful = ($results | Where-Object { $_.Status -eq "SUCCESS" }).Count
$total = $results.Count

Write-Host "`nStatus: $successful/$total OK" -ForegroundColor $(if ($successful -gt 0) { "Green" } else { "Red" })

foreach ($result in $results) {
    $icon = if ($result.Status -eq "SUCCESS") { "✅" } else { "❌" }
    $color = if ($result.Status -eq "SUCCESS") { "Green" } else { "Red" }
    Write-Host "$icon $($result.Endpoint) - $($result.Status) (Count: $($result.Count))" -ForegroundColor $color
}

if ($successful -gt 0) {
    Write-Host "`n✅ KLUCZ DZIAŁA! Możesz uruchomić eksport." -ForegroundColor Green
    Write-Host "`nNastępne kroki:" -ForegroundColor Cyan
    Write-Host "1. Uruchom FastAPI: cd u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api" -ForegroundColor White
    Write-Host "   uvicorn app.main:app --port 8001 --reload" -ForegroundColor Gray
    Write-Host "`n2. Eksport do D1:" -ForegroundColor White
    $curlCmd = "curl -X POST `"http://localhost:8001/v1/meble-pumo/idosell/export-to-d1`" -H `"Content-Type: application/json`" -d '{`"api_key`": `"$ApiKey`", `"method`": `"$Method`", `"entities`": [`"products`", `"orders`"], `"since_date`": `"2025-07-13`"}'"
    Write-Host "   $curlCmd" -ForegroundColor Gray
}
else {
    Write-Host "`n❌ KLUCZ NIE DZIAŁA! Sprawdź uprawnienia w panelu IdoSell." -ForegroundColor Red
}

Write-Host "`n"
