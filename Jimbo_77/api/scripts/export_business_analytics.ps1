# FULL BUSINESS ANALYTICS EXPORT
# Produkty + Zamówienia z pełną analizą biznesową

param(
    [string]$ApiKey = "YXBwbGljYXRpb24yMTpRRnVqMXlZVWFua3ZnekZSNUFQNndRRGd6aTNuTTVJd21SVkgwbXBzcmJYM3pWZWNrZDkyMWlqZnZ3LzJZWFVn",
    [int]$BatchSize = 100,
    [string]$SinceDate = "2025-07-13",
    [string]$OutputDir = "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\exports"
)

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "  FULL BUSINESS ANALYTICS EXPORT" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$headers = @{ 'X-API-KEY' = $ApiKey; 'Accept' = 'application/json' }

# Analytics objects
$analytics = @{
    products_count     = 0
    orders_count       = 0
    total_revenue      = 0
    total_orders_net   = 0
    total_orders_gross = 0
    customers          = @{}
    payment_methods    = @{}
    delivery_methods   = @{}
    order_sources      = @{}
    products_sold      = @{}
    daily_sales        = @{}
    customer_segments  = @{
        buyers           = 0
        non_buyers       = 0
        repeat_customers = 0
    }
    conversion_data    = @{
        total_customers       = 0
        customers_with_orders = 0
    }
}

# ========== PRODUCTS ==========
Write-Host "PART 1: PRODUCTS EXPORT`n" -ForegroundColor Yellow

$allProducts = @()
$page = 1
$productsFile = "$OutputDir\products_$timestamp.json"

while ($true) {
    Write-Host "  Batch $page..." -ForegroundColor White -NoNewline
    
    $uri = "https://meblepumo.iai-shop.com/api/admin/v3/products/products"
    $uri = $uri + "?page=$page&limit=$BatchSize"
    
    try {
        $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method GET -ErrorAction Stop
    }
    catch {
        Write-Host " ERROR: $_" -ForegroundColor Red
        break
    }
    
    if (!$response.results -or $response.results.Count -eq 0) {
        Write-Host " No more products" -ForegroundColor Gray
        break
    }
    
    $allProducts += $response.results
    $count = $response.results.Count
    
    Write-Host " OK: $count | Total: $($allProducts.Count)" -ForegroundColor Green
    
    # Auto-save co 1000
    if ($page % 10 -eq 0) {
        Write-Host "    Auto-save..." -ForegroundColor Yellow
        $allProducts | ConvertTo-Json -Depth 10 -Compress | Out-File $productsFile -Encoding UTF8
    }
    
    if ($count -lt $BatchSize) {
        break
    }
    
    $page++
    Start-Sleep -Milliseconds 200
}

$analytics.products_count = $allProducts.Count
$allProducts | ConvertTo-Json -Depth 10 -Compress | Out-File $productsFile -Encoding UTF8
Write-Host "`n Products saved: $($allProducts.Count)" -ForegroundColor Green
Write-Host "  File: $productsFile`n" -ForegroundColor Gray

# ========== ORDERS WITH ANALYTICS ==========
Write-Host "PART 2: ORDERS + BUSINESS ANALYTICS`n" -ForegroundColor Yellow

$allOrders = @()
$page = 1
$ordersFile = "$OutputDir\orders_$timestamp.json"

while ($true) {
    Write-Host "  Batch $page..." -ForegroundColor White -NoNewline
    
    $uri = "https://meblepumo.iai-shop.com/api/admin/v3/orders/orders"
    $uri = $uri + "?page=$page&limit=$BatchSize&dateFrom=$SinceDate"
    
    try {
        $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method GET -ErrorAction Stop
    }
    catch {
        Write-Host " ERROR: $_" -ForegroundColor Red
        break
    }
    
    if (!$response.results -or $response.results.Count -eq 0) {
        Write-Host " No more orders" -ForegroundColor Gray
        break
    }
    
    $allOrders += $response.results
    $count = $response.results.Count
    
    # ANALYTICS PER ORDER
    foreach ($order in $response.results) {
        $details = $order.orderDetails
        
        # Revenue
        if ($details.payments.orderBaseCurrency.orderProductsCost) {
            $gross = $details.payments.orderBaseCurrency.orderProductsCost
            $analytics.total_revenue += $gross
            $analytics.total_orders_gross += $gross
        }
        
        # Customer tracking
        $clientId = $order.clientResult.clientAccount.clientId
        if ($clientId) {
            if (!$analytics.customers.ContainsKey($clientId)) {
                $analytics.customers[$clientId] = @{
                    email        = $order.clientResult.clientAccount.clientEmail
                    orders_count = 0
                    total_spent  = 0
                    first_order  = $details.orderAddDate
                    last_order   = $details.orderAddDate
                }
            }
            $analytics.customers[$clientId].orders_count++
            $analytics.customers[$clientId].total_spent += $gross
            $analytics.customers[$clientId].last_order = $details.orderAddDate
            
            if ($analytics.customers[$clientId].orders_count -gt 1) {
                $analytics.customer_segments.repeat_customers++
            }
        }
        
        # Payment methods
        if ($details.prepaids -and $details.prepaids.Count -gt 0) {
            $payform = $details.prepaids[0].payformName
            if ($payform) {
                if (!$analytics.payment_methods.ContainsKey($payform)) {
                    $analytics.payment_methods[$payform] = 0
                }
                $analytics.payment_methods[$payform]++
            }
        }
        
        # Delivery methods
        $courier = $details.dispatch.courierName
        if ($courier) {
            if (!$analytics.delivery_methods.ContainsKey($courier)) {
                $analytics.delivery_methods[$courier] = 0
            }
            $analytics.delivery_methods[$courier]++
        }
        
        # Order sources (Allegro, website, etc)
        $source = $details.orderSourceResults.orderSourceDetails.orderSourceName
        if ($source) {
            if (!$analytics.order_sources.ContainsKey($source)) {
                $analytics.order_sources[$source] = 0
            }
            $analytics.order_sources[$source]++
        }
        
        # Products sold
        if ($details.productsResults) {
            foreach ($product in $details.productsResults) {
                $productId = $product.productId
                if (!$analytics.products_sold.ContainsKey($productId)) {
                    $analytics.products_sold[$productId] = @{
                        name     = $product.productName
                        quantity = 0
                        revenue  = 0
                    }
                }
                $analytics.products_sold[$productId].quantity += $product.productQuantity
                $analytics.products_sold[$productId].revenue += $product.productOrderPrice
            }
        }
        
        # Daily sales
        $orderDate = ($details.orderAddDate -split ' ')[0]
        if (!$analytics.daily_sales.ContainsKey($orderDate)) {
            $analytics.daily_sales[$orderDate] = @{
                orders  = 0
                revenue = 0
            }
        }
        $analytics.daily_sales[$orderDate].orders++
        $analytics.daily_sales[$orderDate].revenue += $gross
    }
    
    Write-Host " OK: $count | Total: $($allOrders.Count)" -ForegroundColor Green
    
    # Auto-save co 1000
    if ($page % 10 -eq 0) {
        Write-Host "    Auto-save orders..." -ForegroundColor Yellow
        $allOrders | ConvertTo-Json -Depth 10 -Compress | Out-File $ordersFile -Encoding UTF8
    }
    
    if ($count -lt $BatchSize) {
        break
    }
    
    $page++
    Start-Sleep -Milliseconds 200
}

$analytics.orders_count = $allOrders.Count
$allOrders | ConvertTo-Json -Depth 10 -Compress | Out-File $ordersFile -Encoding UTF8
Write-Host "`n Orders saved: $($allOrders.Count)" -ForegroundColor Green
Write-Host "  File: $ordersFile`n" -ForegroundColor Gray

# ========== CUSTOMER SEGMENTATION ==========
$analytics.customer_segments.buyers = $analytics.customers.Count
$analytics.conversion_data.customers_with_orders = $analytics.customers.Count
$analytics.conversion_data.total_customers = $analytics.customers.Count

# Calculate non-buyers (customers without orders - from orders data)
$uniqueCustomers = @{}
foreach ($order in $allOrders) {
    $clientId = $order.clientResult.clientAccount.clientId
    if ($clientId) {
        $uniqueCustomers[$clientId] = $true
    }
}
$analytics.customer_segments.buyers = $uniqueCustomers.Count

# ========== SUMMARY REPORT ==========
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  BUSINESS ANALYTICS SUMMARY" -ForegroundColor Green
Write-Host "===============================================`n" -ForegroundColor Cyan

Write-Host "PRODUCTS:" -ForegroundColor Yellow
Write-Host "  Total products: $($analytics.products_count)" -ForegroundColor White
Write-Host "  File size: $([math]::Round((Get-Item $productsFile).Length / 1MB, 2)) MB`n" -ForegroundColor Gray

Write-Host "ORDERS:" -ForegroundColor Yellow
Write-Host "  Total orders: $($analytics.orders_count)" -ForegroundColor White
Write-Host "  Period: $SinceDate to $(Get-Date -Format 'yyyy-MM-dd')" -ForegroundColor Gray
Write-Host "  File size: $([math]::Round((Get-Item $ordersFile).Length / 1MB, 2)) MB`n" -ForegroundColor Gray

Write-Host "REVENUE:" -ForegroundColor Yellow
Write-Host "  Total revenue: $([math]::Round($analytics.total_revenue, 2)) PLN" -ForegroundColor Green
if ($analytics.orders_count -gt 0) {
    Write-Host "  Average order value: $([math]::Round($analytics.total_revenue / $analytics.orders_count, 2)) PLN" -ForegroundColor White
}
Write-Host ""

Write-Host "CUSTOMERS:" -ForegroundColor Yellow
Write-Host "  Total customers: $($analytics.customers.Count)" -ForegroundColor White
Write-Host "  Buyers: $($analytics.customer_segments.buyers)" -ForegroundColor Green
Write-Host "  Repeat customers: $($analytics.customer_segments.repeat_customers)" -ForegroundColor Cyan
if ($analytics.customers.Count -gt 0) {
    $repeatRate = [math]::Round(($analytics.customer_segments.repeat_customers / $analytics.customers.Count) * 100, 2)
    Write-Host "  Repeat rate: $repeatRate%" -ForegroundColor White
}
Write-Host ""

Write-Host "TOP 5 PAYMENT METHODS:" -ForegroundColor Yellow
$analytics.payment_methods.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5 | ForEach-Object {
    Write-Host "  $($_.Key): $($_.Value) orders" -ForegroundColor White
}
Write-Host ""

Write-Host "TOP 5 DELIVERY METHODS:" -ForegroundColor Yellow
$analytics.delivery_methods.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5 | ForEach-Object {
    Write-Host "  $($_.Key): $($_.Value) deliveries" -ForegroundColor White
}
Write-Host ""

Write-Host "ORDER SOURCES:" -ForegroundColor Yellow
$analytics.order_sources.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    $percent = [math]::Round(($_.Value / $analytics.orders_count) * 100, 2)
    Write-Host "  $($_.Key): $($_.Value) ($percent%)" -ForegroundColor White
}
Write-Host ""

Write-Host "TOP 10 BEST SELLING PRODUCTS:" -ForegroundColor Yellow
$analytics.products_sold.GetEnumerator() | Sort-Object { $_.Value.quantity } -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Host "  $($_.Value.name)" -ForegroundColor White
    Write-Host "    Qty: $($_.Value.quantity) | Revenue: $([math]::Round($_.Value.revenue, 2)) PLN" -ForegroundColor Gray
}
Write-Host ""

# Save analytics to JSON
$analyticsFile = "$OutputDir\analytics_$timestamp.json"
$analytics | ConvertTo-Json -Depth 10 | Out-File $analyticsFile -Encoding UTF8

Write-Host "ANALYTICS SAVED:" -ForegroundColor Yellow
Write-Host "  $analyticsFile" -ForegroundColor Gray
Write-Host ""

# Save customer data
$customersFile = "$OutputDir\customers_$timestamp.json"
$analytics.customers | ConvertTo-Json -Depth 5 | Out-File $customersFile -Encoding UTF8
Write-Host "  $customersFile" -ForegroundColor Gray
Write-Host ""

Write-Host "===============================================" -ForegroundColor Green
Write-Host "  EXPORT COMPLETE!" -ForegroundColor Green
Write-Host "===============================================`n" -ForegroundColor Green
