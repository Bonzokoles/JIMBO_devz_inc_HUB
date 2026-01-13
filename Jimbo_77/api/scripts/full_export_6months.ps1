# FULL EXPORT - Produkty i zamówienia z ostatnich 6 miesięcy
# Automatyczna paginacja po 90 produktów/batch

param(
    [Parameter(Mandatory = $false)]
    [string]$ApiKey = "YXBwbGljYXRpb24yMTpRRnVqMXlZVWFua3ZnekZSNUFQNndRRGd6aTNuTTVJd21SVkgwbXBzcmJYM3pWZWNrZDkyMWlqZnZ3LzJZWFVn",
    
    [Parameter(Mandatory = $false)]
    [int]$BatchSize = 90,
    
    [Parameter(Mandatory = $false)]
    [string]$SinceDate = "2025-07-13",
    
    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\exports"
)

$ErrorActionPreference = "Stop"

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 FULL EXPORT: 6 MIESIĘCY DANYCH (Od $SinceDate)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Create export directory
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$headers = @{
    'X-API-KEY' = $ApiKey
    'Accept'    = 'application/json'
}

# ============================================
# PART 1: EXPORT PRODUCTS
# ============================================
Write-Host "📦 PART 1: EKSPORT PRODUKTÓW" -ForegroundColor Yellow
Write-Host "   Batch size: $BatchSize produktów" -ForegroundColor Gray
Write-Host "   API: https://meblepumo.iai-shop.com/api/admin/v3/products/products`n" -ForegroundColor Gray

$allProducts = @()
$page = 1
$totalPages = 0
$productsFile = "$OutputDir\products_full_$timestamp.json"

try {
    while ($true) {
        Write-Host "   📄 Batch $page (pobieranie $BatchSize produktów)..." -ForegroundColor White
        
        $uri = "https://meblepumo.iai-shop.com/api/admin/v3/products/products?page=$page&limit=$BatchSize"
        
        try {
            $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method GET -TimeoutSec 30
        }
        catch {
            Write-Host "      ❌ Błąd HTTP: $($_.Exception.Message)" -ForegroundColor Red
            break
        }
        
        if (!$response.results -or $response.results.Count -eq 0) {
            Write-Host "      ℹ️  Brak więcej produktów" -ForegroundColor Gray
            break
        }
        
        $allProducts += $response.results
        $fetchedCount = $response.results.Count
        
        Write-Host "      ✅ Pobrano: $fetchedCount produktów" -ForegroundColor Green
        Write-Host "      📊 Razem: $($allProducts.Count) produktów" -ForegroundColor Cyan
        
        # Auto-save co 10 batchy (900 produktów)
        if ($page % 10 -eq 0) {
            Write-Host "`n      💾 Auto-save checkpoint..." -ForegroundColor Yellow
            $allProducts | ConvertTo-Json -Depth 10 -Compress | Out-File $productsFile -Encoding UTF8
            Write-Host "      ✅ Zapisano: $($allProducts.Count) produktów`n" -ForegroundColor Green
        }
        
        # Check if last page
        if ($fetchedCount -lt $BatchSize) {
            Write-Host "      ℹ️  Ostatni batch (mniej niż $BatchSize produktów)" -ForegroundColor Gray
            break
        }
        
        $page++
        Start-Sleep -Milliseconds 200  # Rate limiting: 5 requests/second
    }
    
    Write-Host "`n   💾 Finalny zapis produktów..." -ForegroundColor Yellow
    $allProducts | ConvertTo-Json -Depth 10 -Compress | Out-File $productsFile -Encoding UTF8
    
    Write-Host "   ✅ PRODUKTY: $($allProducts.Count) zapisanych" -ForegroundColor Green
    Write-Host "   📁 Plik: $productsFile`n" -ForegroundColor Gray
    
}
catch {
    Write-Host "`n   ❌ BŁĄD EKSPORTU PRODUKTÓW: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# PART 2: EXPORT ORDERS (Last 6 months)
# ============================================
Write-Host "`n🛒 PART 2: EKSPORT ZAMÓWIEŃ (od $SinceDate)" -ForegroundColor Yellow
Write-Host "   API: https://meblepumo.iai-shop.com/api/admin/v3/orders/orders`n" -ForegroundColor Gray

$allOrders = @()
$page = 1
$ordersFile = "$OutputDir\orders_6months_$timestamp.json"

try {
    while ($true) {
        Write-Host "   📄 Batch $page (pobieranie $BatchSize zamówień)..." -ForegroundColor White
        
        $uri = "https://meblepumo.iai-shop.com/api/admin/v3/orders/orders?page=$page&limit=$BatchSize&dateFrom=$SinceDate"
        
        try {
            $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method GET -TimeoutSec 30
        }
        catch {
            Write-Host "      ❌ Błąd HTTP: $($_.Exception.Message)" -ForegroundColor Red
            break
        }
        
        if (!$response.results -or $response.results.Count -eq 0) {
            Write-Host "      ℹ️  Brak więcej zamówień" -ForegroundColor Gray
            break
        }
        
        $allOrders += $response.results
        $fetchedCount = $response.results.Count
        
        Write-Host "      ✅ Pobrano: $fetchedCount zamówień" -ForegroundColor Green
        Write-Host "      📊 Razem: $($allOrders.Count) zamówień" -ForegroundColor Cyan
        
        # Auto-save co 10 batchy
        if ($page % 10 -eq 0) {
            Write-Host "`n      💾 Auto-save checkpoint..." -ForegroundColor Yellow
            $allOrders | ConvertTo-Json -Depth 10 -Compress | Out-File $ordersFile -Encoding UTF8
            Write-Host "      ✅ Zapisano: $($allOrders.Count) zamówień`n" -ForegroundColor Green
        }
        
        if ($fetchedCount -lt $BatchSize) {
            Write-Host "      ℹ️  Ostatni batch" -ForegroundColor Gray
            break
        }
        
        $page++
        Start-Sleep -Milliseconds 200
    }
    
    Write-Host "`n   💾 Finalny zapis zamówień..." -ForegroundColor Yellow
    $allOrders | ConvertTo-Json -Depth 10 -Compress | Out-File $ordersFile -Encoding UTF8
    
    Write-Host "   ✅ ZAMÓWIENIA: $($allOrders.Count) zapisanych" -ForegroundColor Green
    Write-Host "   📁 Plik: $ordersFile`n" -ForegroundColor Gray
    
}
catch {
    Write-Host "`n   ❌ BŁĄD EKSPORTU ZAMÓWIEŃ: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# PART 3: ANALYTICS SUMMARY
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 PODSUMOWANIE EKSPORTU" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "📦 Produkty:" -ForegroundColor Yellow
Write-Host "   Total: $($allProducts.Count)" -ForegroundColor White
Write-Host "   Plik: $productsFile" -ForegroundColor Gray
Write-Host "   Rozmiar: $([math]::Round((Get-Item $productsFile).Length / 1MB, 2)) MB`n" -ForegroundColor Gray

if ($allProducts.Count -gt 0) {
    Write-Host "   Przykładowy produkt:" -ForegroundColor Cyan
    $sample = $allProducts[0]
    Write-Host "      ID: $($sample.productId)" -ForegroundColor White
    Write-Host "      Nazwa: $($sample.productName)" -ForegroundColor White
    if ($sample.price) {
        Write-Host "      Cena brutto: $($sample.price.grossPrice) PLN" -ForegroundColor White
    }
    if ($sample.stock) {
        Write-Host "      Stan: $($sample.stock)" -ForegroundColor White
    }
    if ($sample.url) {
        Write-Host "      URL: $($sample.url)" -ForegroundColor White
    }
    Write-Host ""
}

Write-Host "🛒 Zamówienia (od $SinceDate):" -ForegroundColor Yellow
Write-Host "   Total: $($allOrders.Count)" -ForegroundColor White
Write-Host "   Plik: $ordersFile" -ForegroundColor Gray
Write-Host "   Rozmiar: $([math]::Round((Get-Item $ordersFile).Length / 1MB, 2)) MB`n" -ForegroundColor Gray

if ($allOrders.Count -gt 0) {
    # Calculate total revenue
    $totalRevenue = 0
    foreach ($order in $allOrders) {
        if ($order.totalGrossPrice) {
            $totalRevenue += $order.totalGrossPrice
        }
    }
    
    Write-Host "   📈 Analiza biznesowa:" -ForegroundColor Cyan
    Write-Host "      Liczba zamówień: $($allOrders.Count)" -ForegroundColor White
    Write-Host "      Suma wartości: $([math]::Round($totalRevenue, 2)) PLN" -ForegroundColor Green
    Write-Host "      Średnia wartość: $([math]::Round($totalRevenue / $allOrders.Count, 2)) PLN" -ForegroundColor White
    Write-Host ""
}

Write-Host "⏱️  Czas wykonania: $('{0:mm}:{0:ss}' -f ([datetime]::Now - [datetime]::ParseExact($timestamp, 'yyyyMMdd_HHmmss', $null)))" -ForegroundColor Gray
Write-Host "📁 Katalog: $OutputDir`n" -ForegroundColor Gray

# ============================================
# PART 4: CREATE ANALYSIS SUMMARY
# ============================================
Write-Host "📝 Tworzenie pliku podsumowania..." -ForegroundColor Yellow

$summary = @{
    timestamp   = $timestamp
    export_date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    date_from   = $SinceDate
    date_to     = Get-Date -Format "yyyy-MM-dd"
    products    = @{
        count   = $allProducts.Count
        file    = $productsFile
        size_mb = [math]::Round((Get-Item $productsFile).Length / 1MB, 2)
    }
    orders      = @{
        count           = $allOrders.Count
        file            = $ordersFile
        size_mb         = [math]::Round((Get-Item $ordersFile).Length / 1MB, 2)
        total_revenue   = $totalRevenue
        avg_order_value = if ($allOrders.Count -gt 0) { [math]::Round($totalRevenue / $allOrders.Count, 2) } else { 0 }
    }
}

$summaryFile = "$OutputDir\export_summary_$timestamp.json"
$summary | ConvertTo-Json -Depth 5 | Out-File $summaryFile -Encoding UTF8

Write-Host "   ✅ Plik: $summaryFile`n" -ForegroundColor Green

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ EKSPORT ZAKOŃCZONY!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "🔍 Następne kroki:" -ForegroundColor Yellow
Write-Host "   1. Analiza danych: Otwórz pliki JSON w Power BI / Excel" -ForegroundColor Gray
Write-Host "   2. Import do D1: Użyj skryptu import_to_d1.ps1" -ForegroundColor Gray
Write-Host "   3. Vectorize: Indeksuj produkty w Cloudflare Vectorize dla AI" -ForegroundColor Gray
