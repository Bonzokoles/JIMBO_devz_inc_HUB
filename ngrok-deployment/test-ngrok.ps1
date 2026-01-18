# Test Ngrok AI Gateway Deployment
# Verifies multi-provider routing and failover

Write-Host "`n🧪 NGROK AI GATEWAY TEST SUITE`n" -ForegroundColor Cyan

$ngrokUrl = "https://smallish-apocalyptically-candis.ngrok-free.dev/v1"

# Load API key from .env (JIMBO_API_KEY will be used)
$envPath = "U:\The_yellow_hub\.env"
$apiKey = (Get-Content $envPath | Select-String "JIMBO_API_KEY" | Select-Object -First 1) -replace '.*=', ''

if (-not $apiKey) {
    Write-Host "⚠️  JIMBO_API_KEY not found in .env. Using test without auth.`n" -ForegroundColor Yellow
    $headers = @{ "Content-Type" = "application/json" }
} else {
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $apiKey"
    }
}

# Test 1: Basic Chat Completion
Write-Host "TEST 1: Basic Chat Completion" -ForegroundColor Yellow
Write-Host "  Endpoint: $ngrokUrl/chat/completions`n" -ForegroundColor Gray

$chatPayload = @{
    model = "gpt-4-turbo"
    messages = @(
        @{
            role = "user"
            content = "Say 'Ngrok AI Gateway is working!' in one sentence."
        }
    )
    max_tokens = 50
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$ngrokUrl/chat/completions" `
        -Method POST `
        -Headers $headers `
        -Body $chatPayload `
        -TimeoutSec 30
    
    $provider = $response.Headers.'X-Ngrok-Provider'
    $content = $response.choices[0].message.content
    
    Write-Host "  ✅ SUCCESS" -ForegroundColor Green
    Write-Host "  Provider: $provider" -ForegroundColor Cyan
    Write-Host "  Response: $content`n" -ForegroundColor White
} catch {
    Write-Host "  ❌ FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "  Error details: $errorBody`n" -ForegroundColor Yellow
    }
}

# Test 2: Provider Selection (make 10 requests to see distribution)
Write-Host "`nTEST 2: Provider Distribution (10 requests)" -ForegroundColor Yellow
Write-Host "  Expected: ~50% Gemini, ~30% Claude, ~20% DeepSeek`n" -ForegroundColor Gray

$providerCount = @{}
$successCount = 0

for ($i = 1; $i -le 10; $i++) {
    Write-Host "  Request $i..." -NoNewline
    
    $testPayload = @{
        model = "gpt-4-turbo"
        messages = @(@{role = "user"; content = "Test $i"})
        max_tokens = 5
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$ngrokUrl/chat/completions" `
            -Method POST `
            -Headers $headers `
            -Body $testPayload `
            -TimeoutSec 20
        
        $provider = $response.Headers.'X-Ngrok-Provider'
        if (-not $provider) { $provider = "unknown" }
        
        if ($providerCount.ContainsKey($provider)) {
            $providerCount[$provider]++
        } else {
            $providerCount[$provider] = 1
        }
        
        Write-Host " ✓ $provider" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host " ✗ FAILED" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host "`n  Results:" -ForegroundColor Cyan
foreach ($provider in $providerCount.Keys | Sort-Object) {
    $count = $providerCount[$provider]
    $percent = [math]::Round(($count / $successCount) * 100, 1)
    Write-Host "    $provider: $count/$successCount ($percent%)" -ForegroundColor White
}
Write-Host ""

# Test 3: Rate Limit Handling (Gemini 60 RPM limit)
Write-Host "`nTEST 3: Rate Limit Failover" -ForegroundColor Yellow
Write-Host "  Sending 70 requests rapidly to trigger Gemini rate limit...`n" -ForegroundColor Gray

$rateLimitHit = $false
$failoverProvider = $null

for ($i = 1; $i -le 70; $i++) {
    if ($i % 10 -eq 0) {
        Write-Host "  Progress: $i/70..." -ForegroundColor Gray
    }
    
    $payload = @{
        model = "gpt-4-turbo"
        messages = @(@{role = "user"; content = "Quick test"})
        max_tokens = 3
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$ngrokUrl/chat/completions" `
            -Method POST `
            -Headers $headers `
            -Body $payload `
            -TimeoutSec 15
        
        $currentProvider = $response.Headers.'X-Ngrok-Provider'
        
        # Detect failover (provider changes from Gemini)
        if ($currentProvider -ne "gemini-free" -and -not $rateLimitHit) {
            $rateLimitHit = $true
            $failoverProvider = $currentProvider
            Write-Host "`n  ⚡ FAILOVER DETECTED at request $i!" -ForegroundColor Yellow
            Write-Host "    Gemini → $currentProvider`n" -ForegroundColor Cyan
        }
    } catch {
        # Ignore errors, focus on failover detection
    }
    
    Start-Sleep -Milliseconds 100
}

if ($rateLimitHit) {
    Write-Host "  ✅ Rate limit failover working ($failoverProvider took over)`n" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  No failover detected (may need more requests or Gemini limit not hit)`n" -ForegroundColor Yellow
}

# Test 4: Error Handling
Write-Host "`nTEST 4: Error Handling" -ForegroundColor Yellow
Write-Host "  Sending invalid request to test error responses...`n" -ForegroundColor Gray

$invalidPayload = @{
    model = "invalid-model-name"
    messages = @(@{role = "user"; content = "Test"})
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$ngrokUrl/chat/completions" `
        -Method POST `
        -Headers $headers `
        -Body $invalidPayload `
        -TimeoutSec 10
    
    Write-Host "  ⚠️  Expected error but got success?`n" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "  ✅ Error handling working (HTTP $statusCode)" -ForegroundColor Green
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "  Error message: $errorBody`n" -ForegroundColor Gray
    }
}

# Summary
Write-Host "`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TEST SUITE COMPLETE" -ForegroundColor White
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Next: Integrate with Cloudflare Workers" -ForegroundColor Gray
Write-Host "  See: 02_cloudflare_worker/README.md`n" -ForegroundColor Gray
