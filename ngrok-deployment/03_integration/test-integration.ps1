# Integration Test Suite
# Verifies all 3 workers are using ngrok proxy correctly

Write-Host "`n🧪 NGROK INTEGRATION TEST SUITE`n" -ForegroundColor Cyan
Write-Host "Testing 3 workers: agents-orchestrator, pumo-rag, image-gen`n" -ForegroundColor Gray

$testResults = @{
    passed = 0
    failed = 0
    warnings = 0
}

# Test 1: Agents Orchestrator
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST 1: Agents Orchestrator Integration" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

try {
    Write-Host "  Sending test orchestration request..." -NoNewline
    
    $orchPayload = @{
        task = "Quick test: List 3 AI trends"
        agents = @("market-analyst")
        max_tokens = 100
    } | ConvertTo-Json
    
    $orchResponse = Invoke-RestMethod `
        -Uri "https://orchestrator.jimbo77.com/orchestrate" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $orchPayload `
        -TimeoutSec 30
    
    # Check if response contains provider info
    if ($orchResponse.provider) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "    Provider: $($orchResponse.provider)" -ForegroundColor Cyan
        Write-Host "    Response length: $($orchResponse.result.Length) chars" -ForegroundColor Gray
        $testResults.passed++
    } else {
        Write-Host " ⚠️ WARNING" -ForegroundColor Yellow
        Write-Host "    Response OK but no provider info (may not be using ngrok)" -ForegroundColor Yellow
        $testResults.warnings++
    }
    
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults.failed++
}

Write-Host ""

# Test 2: PUMO RAG Embeddings
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST 2: PUMO RAG Embeddings via Ngrok" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

try {
    Write-Host "  Testing embedding generation..." -NoNewline
    
    $embedPayload = @{
        text = "Modern scandinavian furniture with minimalist design"
    } | ConvertTo-Json
    
    $embedResponse = Invoke-RestMethod `
        -Uri "https://pumo-rag.stolarnia-ams.workers.dev/api/embed" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $embedPayload `
        -TimeoutSec 20
    
    $dimensions = $embedResponse.result.data[0].Count
    
    if ($dimensions -gt 0) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "    Embedding dimensions: $dimensions" -ForegroundColor Cyan
        
        # Check if response has provider header
        if ($embedResponse.PSObject.Properties['provider']) {
            Write-Host "    Provider: $($embedResponse.provider)" -ForegroundColor Cyan
        } else {
            Write-Host "    ⚠️ No provider info in response" -ForegroundColor Yellow
            $testResults.warnings++
        }
        
        $testResults.passed++
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        Write-Host "    Invalid embedding dimensions: $dimensions" -ForegroundColor Red
        $testResults.failed++
    }
    
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults.failed++
}

Write-Host ""

# Test 3: Image Generation Failover
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST 3: Image Generation Failover" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

try {
    Write-Host "  Testing image generation..." -NoNewline
    
    $imagePayload = @{
        prompt = "A simple red circle on white background, minimal"
        width = 512
        height = 512
    } | ConvertTo-Json
    
    $imageResponse = Invoke-RestMethod `
        -Uri "https://cf-ai-image-gen.stolarnia-ams.workers.dev/api/generate" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $imagePayload `
        -TimeoutSec 45
    
    if ($imageResponse.success -and $imageResponse.image_url) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "    Image URL: $($imageResponse.image_url.Substring(0, 50))..." -ForegroundColor Cyan
        
        if ($imageResponse.provider) {
            Write-Host "    Provider: $($imageResponse.provider)" -ForegroundColor Cyan
        }
        
        if ($imageResponse.fallback_used) {
            Write-Host "    ⚡ Failover activated: CF → $($imageResponse.provider)" -ForegroundColor Yellow
        }
        
        $testResults.passed++
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        Write-Host "    No image URL in response" -ForegroundColor Red
        $testResults.failed++
    }
    
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults.failed++
}

Write-Host ""

# Test 4: Ngrok Proxy Analytics
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST 4: Ngrok Proxy Analytics (D1)" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

try {
    Write-Host "  Fetching analytics from ngrok-proxy..." -NoNewline
    
    $analyticsResponse = Invoke-RestMethod `
        -Uri "https://ngrok-proxy.stolarnia-ams.workers.dev/api/analytics" `
        -Method GET `
        -TimeoutSec 10
    
    if ($analyticsResponse.totals) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "    Total requests (24h): $($analyticsResponse.totals.total_requests)" -ForegroundColor Cyan
        Write-Host "    Total cost (24h): `$$([math]::Round($analyticsResponse.totals.total_cost, 4))" -ForegroundColor Cyan
        Write-Host "    Avg latency: $([math]::Round($analyticsResponse.totals.avg_latency))ms" -ForegroundColor Cyan
        
        if ($analyticsResponse.by_provider) {
            Write-Host "`n    Provider breakdown:" -ForegroundColor Yellow
            foreach ($stat in $analyticsResponse.by_provider) {
                $percent = [math]::Round(($stat.count / $analyticsResponse.totals.total_requests) * 100, 1)
                Write-Host "      - $($stat.provider): $($stat.count) requests ($percent%)" -ForegroundColor Gray
            }
        }
        
        $testResults.passed++
    } else {
        Write-Host " ⚠️ WARNING" -ForegroundColor Yellow
        Write-Host "    No analytics data yet (workers may not be integrated)" -ForegroundColor Yellow
        $testResults.warnings++
    }
    
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults.failed++
}

Write-Host ""

# Test 5: Cost Comparison
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST 5: Cost Optimization Analysis" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

# Calculate expected costs based on provider distribution
if ($analyticsResponse -and $analyticsResponse.by_provider) {
    $totalCost24h = $analyticsResponse.totals.total_cost
    $projectedMonthly = $totalCost24h * 30
    
    Write-Host "  24h actual cost: `$$([math]::Round($totalCost24h, 4))" -ForegroundColor Cyan
    Write-Host "  Projected monthly: `$$([math]::Round($projectedMonthly, 2))" -ForegroundColor Cyan
    
    $baselineMonthlyCost = 253  # Before ngrok integration
    $targetMonthlyCost = 138    # Target with ngrok
    
    if ($projectedMonthly -le $targetMonthlyCost * 1.1) {  # 10% tolerance
        Write-Host "`n  ✅ PASS - Cost optimization working!" -ForegroundColor Green
        $savings = $baselineMonthlyCost - $projectedMonthly
        $savingsPercent = [math]::Round(($savings / $baselineMonthlyCost) * 100, 1)
        Write-Host "    Baseline: `$$baselineMonthlyCost/month" -ForegroundColor Gray
        Write-Host "    Current: `$$([math]::Round($projectedMonthly, 2))/month" -ForegroundColor Cyan
        Write-Host "    Savings: `$$([math]::Round($savings, 2))/month ($savingsPercent%)" -ForegroundColor Green
        $testResults.passed++
    } else {
        Write-Host "`n  ⚠️ WARNING - Cost higher than target" -ForegroundColor Yellow
        Write-Host "    Target: `$$targetMonthlyCost/month" -ForegroundColor Gray
        Write-Host "    Current: `$$([math]::Round($projectedMonthly, 2))/month" -ForegroundColor Yellow
        Write-Host "    (May need more FREE tier traffic)" -ForegroundColor Yellow
        $testResults.warnings++
    }
} else {
    Write-Host "  ⚠️ SKIPPED - Insufficient data for cost analysis" -ForegroundColor Yellow
    $testResults.warnings++
}

# Final Summary
Write-Host "`n`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TEST SUITE SUMMARY" -ForegroundColor White
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Passed:   $($testResults.passed)" -ForegroundColor Green
Write-Host "  ❌ Failed:   $($testResults.failed)" -ForegroundColor $(if ($testResults.failed -gt 0) { "Red" } else { "Gray" })
Write-Host "  ⚠️  Warnings: $($testResults.warnings)" -ForegroundColor $(if ($testResults.warnings -gt 0) { "Yellow" } else { "Gray" })
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

if ($testResults.failed -eq 0) {
    Write-Host "🎉 ALL CRITICAL TESTS PASSED!" -ForegroundColor Green
    
    if ($testResults.warnings -gt 0) {
        Write-Host "⚠️  $($testResults.warnings) warning(s) - check logs above`n" -ForegroundColor Yellow
    }
    
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Monitor analytics dashboard: https://ngrok-proxy.stolarnia-ams.workers.dev/api/analytics" -ForegroundColor Gray
    Write-Host "  2. Check ngrok dashboard: https://dashboard.ngrok.com/ai-gateway/rd_33FaSZ9e7c6yHF9q1mFNNme2fDG" -ForegroundColor Gray
    Write-Host "  3. Review cost trends over next 24-48 hours" -ForegroundColor Gray
    Write-Host "  4. Proceed to Phase 4: Monitoring setup`n" -ForegroundColor Gray
    
    exit 0
} else {
    Write-Host "❌ INTEGRATION INCOMPLETE - $($testResults.failed) test(s) failed`n" -ForegroundColor Red
    Write-Host "Review errors above and check:" -ForegroundColor Yellow
    Write-Host "  - Workers deployed with ngrok integration?" -ForegroundColor Gray
    Write-Host "  - JIMBO_API_KEY set correctly in all workers?" -ForegroundColor Gray
    Write-Host "  - Ngrok proxy worker healthy? Check /health endpoint" -ForegroundColor Gray
    Write-Host "  - Network connectivity to ngrok domain?`n" -ForegroundColor Gray
    
    exit 1
}
