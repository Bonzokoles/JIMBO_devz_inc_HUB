# Deploy Ngrok Proxy Worker to Cloudflare
# Creates D1 database, sets secrets, and deploys worker

Write-Host "`n🚀 DEPLOYING NGROK PROXY WORKER`n" -ForegroundColor Cyan

# Step 1: Create D1 database
Write-Host "Step 1: Creating D1 database..." -ForegroundColor Yellow

try {
    $d1Output = npx wrangler d1 create ngrok-analytics 2>&1 | Out-String
    
    if ($d1Output -match "database_id\s*=\s*`"([^`"]+)`"") {
        $databaseId = $matches[1]
        Write-Host "  ✅ D1 database created: $databaseId" -ForegroundColor Green
        
        # Update wrangler.toml with database_id
        $wranglerPath = "wrangler.toml"
        $content = Get-Content $wranglerPath -Raw
        $content = $content -replace 'database_id = "TBD"', "database_id = `"$databaseId`""
        Set-Content $wranglerPath -Value $content
        Write-Host "  ✅ Updated wrangler.toml with database_id`n" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Database may already exist, continuing...`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Error creating database (may already exist): $($_.Exception.Message)`n" -ForegroundColor Yellow
}

# Step 2: Execute schema
Write-Host "Step 2: Creating database schema..." -ForegroundColor Yellow

try {
    npx wrangler d1 execute ngrok-analytics --file=./schema.sql
    Write-Host "  ✅ Schema created`n" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Schema execution failed: $($_.Exception.Message)`n" -ForegroundColor Yellow
}

# Step 3: Set secrets
Write-Host "Step 3: Setting worker secrets..." -ForegroundColor Yellow

# Load from .env
$envPath = "U:\The_yellow_hub\.env"
$envVars = @{}

if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envVars[$key] = $value
        }
    }
}

# Secrets to set
$secrets = @{
    "NGROK_API_KEY" = $envVars["NGROK_API_KEY"]
    "JIMBO_API_KEY" = $envVars["JIMBO_API_KEY"]
}

foreach ($secretName in $secrets.Keys) {
    $secretValue = $secrets[$secretName]
    
    if ($secretValue) {
        Write-Host "  Setting $secretName..." -NoNewline
        try {
            # Use temporary file to avoid interactive prompt
            $tempFile = [System.IO.Path]::GetTempFileName()
            Set-Content -Path $tempFile -Value $secretValue -NoNewline
            
            $result = Get-Content $tempFile | npx wrangler secret put $secretName 2>&1
            Remove-Item $tempFile -Force
            
            Write-Host " ✅" -ForegroundColor Green
        } catch {
            Write-Host " ❌ FAILED" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️  $secretName not found in .env, skipping" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 4: Deploy worker
Write-Host "Step 4: Deploying worker to Cloudflare..." -ForegroundColor Yellow

try {
    npx wrangler deploy
    Write-Host "`n  ✅ Worker deployed successfully!`n" -ForegroundColor Green
} catch {
    Write-Host "`n  ❌ Deployment failed: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# Step 5: Test deployment
Write-Host "Step 5: Testing deployment..." -ForegroundColor Yellow

Start-Sleep -Seconds 3

try {
    $testUrl = "https://ngrok-proxy.stolarnia-ams.workers.dev/health"
    $response = Invoke-RestMethod -Uri $testUrl -Method GET -TimeoutSec 10
    
    if ($response.status -eq "healthy") {
        Write-Host "  ✅ Health check passed!" -ForegroundColor Green
        Write-Host "  Ngrok URL: $($response.ngrok_url)" -ForegroundColor Cyan
        Write-Host "  Timestamp: $($response.timestamp)`n" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠️  Unexpected health check response`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Health check failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Summary
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE" -ForegroundColor White
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Worker URL: https://ngrok-proxy.stolarnia-ams.workers.dev" -ForegroundColor Green
Write-Host "  Endpoints:" -ForegroundColor Cyan
Write-Host "    - /health (health check)" -ForegroundColor Gray
Write-Host "    - /api/chat (chat completions)" -ForegroundColor Gray
Write-Host "    - /api/embeddings (embeddings)" -ForegroundColor Gray
Write-Host "    - /api/images (image generation)" -ForegroundColor Gray
Write-Host "    - /api/analytics (usage stats)`n" -ForegroundColor Gray
Write-Host "  Next: Update existing workers to use ngrok proxy" -ForegroundColor Yellow
Write-Host "  See: ../03_integration/README.md`n" -ForegroundColor Gray
