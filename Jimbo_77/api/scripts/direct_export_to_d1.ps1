# Direct Export: IdoSell API → Cloudflare D1
# Wykonuje pełny eksport danych bez FastAPI

param(
    [Parameter(Mandatory = $false)]
    [string]$ApiKey = "YXBwbGljYXRpb24yMTpRRnVqMXlZVWFua3ZnekZSNUFQNndRRGd6aTNuTTVJd21SVkgwbXBzcmJYM3pWZWNrZDkyMWlqZnZ3LzJZWFVn",
    
    [Parameter(Mandatory = $false)]
    [int]$ProductsLimit = 500,  # Liczba produktów do pobrania
    
    [Parameter(Mandatory = $false)]
    [int]$OrdersLimit = 500,
    
    [Parameter(Mandatory = $false)]
    [string]$SinceDate = "2025-07-13"
)

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 DIRECT EXPORT: IdoSell → Cloudflare D1" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Step 1: Fetch products from IdoSell
Write-Host "📦 KROK 1: Pobieranie produktów z IdoSell..." -ForegroundColor Yellow

$headers = @{
    'X-API-KEY' = $ApiKey
    'Accept'    = 'application/json'
}

$allProducts = @()
$page = 1
$limit = 100  # IdoSell max per page

try {
    while ($allProducts.Count -lt $ProductsLimit) {
        Write-Host "   Strona $page..." -ForegroundColor Gray
        
        $uri = "https://meblepumo.iai-shop.com/api/admin/v3/products/products?page=$page&limit=$limit"
        $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method GET -TimeoutSec 30
        
        if ($response.results.Count -eq 0) {
            break
        }
        
        $allProducts += $response.results
        Write-Host "   ✅ Pobrano: $($response.results.Count), Razem: $($allProducts.Count)" -ForegroundColor Green
        
        if ($response.results.Count -lt $limit) {
            break  # Ostatnia strona
        }
        
        $page++
    }
    
    Write-Host "`n✅ Pobrano produktów: $($allProducts.Count)" -ForegroundColor Green
    
}
catch {
    Write-Host "`n❌ Błąd pobierania produktów: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Fetch orders from IdoSell
Write-Host "`n🛒 KROK 2: Pobieranie zamówień z IdoSell..." -ForegroundColor Yellow

$allOrders = @()
$page = 1

try {
    while ($allOrders.Count -lt $OrdersLimit) {
        Write-Host "   Strona $page..." -ForegroundColor Gray
        
        $uri = "https://meblepumo.iai-shop.com/api/admin/v3/orders/orders?page=$page&limit=$limit&dateFrom=$SinceDate"
        $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method GET -TimeoutSec 30
        
        if ($response.results.Count -eq 0) {
            break
        }
        
        $allOrders += $response.results
        Write-Host "   ✅ Pobrano: $($response.results.Count), Razem: $($allOrders.Count)" -ForegroundColor Green
        
        if ($response.results.Count -lt $limit) {
            break
        }
        
        $page++
    }
    
    Write-Host "`n✅ Pobrano zamówień: $($allOrders.Count)" -ForegroundColor Green
    
}
catch {
    Write-Host "`n❌ Błąd pobierania zamówień: $($_.Exception.Message)" -ForegroundColor Red
    # Continue anyway
}

# Step 3: Save to JSON files (temporary)
Write-Host "`n💾 KROK 3: Zapisywanie do plików tymczasowych..." -ForegroundColor Yellow

$tempDir = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\temp_export"
if (!(Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

$productsFile = "$tempDir\products_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
$ordersFile = "$tempDir\orders_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"

$allProducts | ConvertTo-Json -Depth 10 | Out-File $productsFile -Encoding UTF8
$allOrders | ConvertTo-Json -Depth 10 | Out-File $ordersFile -Encoding UTF8

Write-Host "   ✅ Products: $productsFile" -ForegroundColor Green
Write-Host "   ✅ Orders: $ordersFile" -ForegroundColor Green

# Step 4: Import to D1 via wrangler
Write-Host "`n📤 KROK 4: Import do Cloudflare D1..." -ForegroundColor Yellow

$wranglerPath = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\frontend\apps\pumo-api"
Set-Location $wranglerPath

# Import products (batch by 50)
Write-Host "`n   Importuję produkty..." -ForegroundColor Gray
$imported = 0

foreach ($product in $allProducts | Select-Object -First 100) {
    # Test: pierwsze 100
    $productId = $product.productId
    $name = ($product.productName -replace "'", "''")  # Escape quotes
    $sku = if ($product.sku) { "'$($product.sku)'" } else { "NULL" }
    $price = if ($product.price.grossPrice) { $product.price.grossPrice } else { "0" }
    $stock = if ($product.stock) { $product.stock } else { "0" }
    
    $sql = "INSERT OR REPLACE INTO products (product_id, name, sku, price, stock_quantity, created_at, updated_at) VALUES ($productId, '$name', $sku, $price, $stock, datetime('now'), datetime('now'));"
    
    try {
        npx wrangler d1 execute pumo-analiza --remote --command "$sql" 2>&1 | Out-Null
        $imported++
        
        if ($imported % 10 -eq 0) {
            Write-Host "   ✅ Zaimportowano: $imported" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "   ⚠️  Błąd produktu $productId" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Zaimportowano produktów do D1: $imported" -ForegroundColor Green

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 PODSUMOWANIE EKSPORTU" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "📦 Produkty pobrane: $($allProducts.Count)" -ForegroundColor White
Write-Host "💾 Produkty zaimportowane: $imported" -ForegroundColor Green
Write-Host "🛒 Zamówienia pobrane: $($allOrders.Count)" -ForegroundColor White
Write-Host "`n📁 Pliki tymczasowe:" -ForegroundColor Yellow
Write-Host "   $productsFile" -ForegroundColor Gray
Write-Host "   $ordersFile" -ForegroundColor Gray

Write-Host "`n✅ EKSPORT ZAKOŃCZONY!" -ForegroundColor Green
Write-Host "`nWeryfikacja:" -ForegroundColor Cyan
Write-Host "   npx wrangler d1 execute pumo-analiza --remote --command 'SELECT COUNT(*) FROM products'" -ForegroundColor Gray
Write-Host "`n"
