# SIMPLE FULL EXPORT - Produkty i zamowienia 6 miesiecy
# Batch 90, auto-continue

param(
    [string]$ApiKey = "YXBwbGljYXRpb24yMTpRRnVqMXlZVWFua3ZnekZSNUFQNndRRGd6aTNuTTVJd21SVkgwbXBzcmJYM3pWZWNrZDkyMWlqZnZ3LzJZWFVn",
    [int]$BatchSize = 90,
    [string]$SinceDate = "2025-07-13",
    [string]$OutputDir = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\exports"
)

Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "FULL EXPORT: 6 MONTHS DATA" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$headers = @{ 'X-API-KEY' = $ApiKey; 'Accept' = 'application/json' }

# ===== PRODUCTS =====
Write-Host "PART 1: PRODUCTS`n" -ForegroundColor Yellow

$allProducts = @()
$page = 1
$productsFile = "$OutputDir\products_$timestamp.json"

while ($true) {
    Write-Host "  Batch $page..." -ForegroundColor White
    
    $uri = "https://meblepumo.iai-shop.com/api/admin/v3/products/products"
    $uri = $uri + "?page=$page"
    $uri = $uri + "&limit=$BatchSize"
    
    $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method GET -ErrorAction Stop
    
    if (!$response.results -or $response.results.Count -eq 0) {
        Write-Host "  No more products" -ForegroundColor Gray
        break
    }
    
    $allProducts += $response.results
    $count = $response.results.Count
    
    Write-Host "  OK: $count products | Total: $($allProducts.Count)" -ForegroundColor Green
    
    if ($page % 10 -eq 0) {
        Write-Host "  Auto-save..." -ForegroundColor Yellow
        $allProducts | ConvertTo-Json -Depth 10 -Compress | Out-File $productsFile -Encoding UTF8
    }
    
    if ($count -lt $BatchSize) {
        break
    }
    
    $page++
    Start-Sleep -Milliseconds 200
}

$allProducts | ConvertTo-Json -Depth 10 -Compress | Out-File $productsFile -Encoding UTF8
Write-Host "`nProducts saved: $($allProducts.Count)" -ForegroundColor Green
Write-Host "File: $productsFile`n" -ForegroundColor Gray

# ===== ORDERS =====
Write-Host "PART 2: ORDERS (since $SinceDate)`n" -ForegroundColor Yellow

$allOrders = @()
$page = 1
$ordersFile = "$OutputDir\orders_$timestamp.json"

while ($true) {
    Write-Host "  Batch $page..." -ForegroundColor White
    
    $uri = "https://meblepumo.iai-shop.com/api/admin/v3/orders/orders"
    $uri = $uri + "?page=$page"
    $uri = $uri + "&limit=$BatchSize"
    $uri = $uri + "&dateFrom=$SinceDate"
    
    $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method GET -ErrorAction Stop
    
    if (!$response.results -or $response.results.Count -eq 0) {
        Write-Host "  No more orders" -ForegroundColor Gray
        break
    }
    
    $allOrders += $response.results
    $count = $response.results.Count
    
    Write-Host "  OK: $count orders | Total: $($allOrders.Count)" -ForegroundColor Green
    
    if ($page % 10 -eq 0) {
        Write-Host "  Auto-save..." -ForegroundColor Yellow
        $allOrders | ConvertTo-Json -Depth 10 -Compress | Out-File $ordersFile -Encoding UTF8
    }
    
    if ($count -lt $BatchSize) {
        break
    }
    
    $page++
    Start-Sleep -Milliseconds 200
}

$allOrders | ConvertTo-Json -Depth 10 -Compress | Out-File $ordersFile -Encoding UTF8
Write-Host "`nOrders saved: $($allOrders.Count)" -ForegroundColor Green
Write-Host "File: $ordersFile`n" -ForegroundColor Gray

# ===== SUMMARY =====
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "EXPORT COMPLETE" -ForegroundColor Green
Write-Host "===================================`n" -ForegroundColor Cyan

Write-Host "Products: $($allProducts.Count)" -ForegroundColor White
Write-Host "  File: $productsFile" -ForegroundColor Gray
Write-Host "  Size: $([math]::Round((Get-Item $productsFile).Length / 1MB, 2)) MB`n" -ForegroundColor Gray

Write-Host "Orders: $($allOrders.Count)" -ForegroundColor White
Write-Host "  File: $ordersFile" -ForegroundColor Gray
Write-Host "  Size: $([math]::Round((Get-Item $ordersFile).Length / 1MB, 2)) MB`n" -ForegroundColor Gray

if ($allOrders.Count -gt 0) {
    $totalRevenue = 0
    foreach ($order in $allOrders) {
        if ($order.totalGrossPrice) {
            $totalRevenue += $order.totalGrossPrice
        }
    }
    
    Write-Host "Business Analysis:" -ForegroundColor Yellow
    Write-Host "  Total Revenue: $([math]::Round($totalRevenue, 2)) PLN" -ForegroundColor Green
    Write-Host "  Average Order: $([math]::Round($totalRevenue / $allOrders.Count, 2)) PLN`n" -ForegroundColor White
}

$summary = @{
    timestamp      = $timestamp
    products_count = $allProducts.Count
    orders_count   = $allOrders.Count
    total_revenue  = $totalRevenue
    date_from      = $SinceDate
    products_file  = $productsFile
    orders_file    = $ordersFile
}

$summaryFile = "$OutputDir\summary_$timestamp.json"
$summary | ConvertTo-Json | Out-File $summaryFile -Encoding UTF8

Write-Host "Summary: $summaryFile" -ForegroundColor Gray
Write-Host "`nDONE!" -ForegroundColor Green
