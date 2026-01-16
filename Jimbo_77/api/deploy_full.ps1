#!/usr/bin/env pwsh
# Quick deploy MoE-RAG: Backend + Tunnel + Worker
# End-to-end deployment w 1 komendzie

Write-Host "`n🚀 MoE-RAG - Full Deployment Pipeline`n" -ForegroundColor Cyan

$apiDir = "U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api"
$workerDir = "U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\moe-rag-proxy"

# STEP 1: Start Backend
Write-Host "📡 STEP 1: Starting Backend API..." -ForegroundColor Yellow
Set-Location $apiDir

# Check if already running
$backendRunning = Test-NetConnection -ComputerName localhost -Port 3885 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($backendRunning) {
    Write-Host "   ✅ Backend already running on port 3885" -ForegroundColor Green
} else {
    Write-Host "   🔧 Starting backend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$apiDir\start_local.ps1`"" -WindowStyle Minimized
    
    Write-Host "   ⏳ Waiting for backend to start..." -ForegroundColor Yellow
    $attempts = 0
    while (-not (Test-NetConnection -ComputerName localhost -Port 3885 -InformationLevel Quiet -WarningAction SilentlyContinue) -and $attempts -lt 20) {
        Start-Sleep -Seconds 1
        $attempts++
        Write-Host "." -NoNewline
    }
    Write-Host ""
    
    if (Test-NetConnection -ComputerName localhost -Port 3885 -InformationLevel Quiet -WarningAction SilentlyContinue) {
        Write-Host "   ✅ Backend started successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Backend failed to start!" -ForegroundColor Red
        exit 1
    }
}

# STEP 2: Start Tunnel
Write-Host "`n🌐 STEP 2: Starting Cloudflare Tunnel..." -ForegroundColor Yellow

# Find cloudflared
$exePath = $null
$exeInfo = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($exeInfo) {
    $exePath = "cloudflared"
} elseif (Test-Path "$apiDir\cloudflared.exe") {
    $exePath = "$apiDir\cloudflared.exe"
}

if (-not $exePath) {
    Write-Host "   ❌ cloudflared not found!" -ForegroundColor Red
    Write-Host "   Run: cd $apiDir && powershell .\start_tunnel.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "   🚇 Launching tunnel..." -ForegroundColor Cyan
Set-Location $apiDir

$tunnelProcess = Start-Process -FilePath $exePath `
    -ArgumentList "tunnel --url http://localhost:3885" `
    -NoNewWindow `
    -PassThru `
    -RedirectStandardOutput "moe_rag_tunnel.log" `
    -RedirectStandardError "moe_rag_tunnel.err"

Write-Host "   ⏳ Waiting for tunnel URL..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Extract URL
$tunnelUrl = $null
if (Test-Path "moe_rag_tunnel.err") {
    $match = Get-Content "moe_rag_tunnel.err" | Select-String "https://.*\.trycloudflare\.com" | Select-Object -First 1
    if ($match) {
        $tunnelUrl = $match.Matches.Value
    }
}

if (-not $tunnelUrl) {
    Write-Host "   ⚠️ Could not extract tunnel URL automatically" -ForegroundColor Yellow
    Write-Host "   Check: moe_rag_tunnel.err" -ForegroundColor Gray
    Write-Host "   Tunnel PID: $($tunnelProcess.Id)" -ForegroundColor Gray
    exit 1
}

Write-Host "   ✅ Tunnel active: $tunnelUrl" -ForegroundColor Green
$tunnelUrl | Out-File -FilePath "tunnel_url.txt" -Encoding UTF8

# STEP 3: Update Worker Config
Write-Host "`n📝 STEP 3: Updating Worker configuration..." -ForegroundColor Yellow
Set-Location $workerDir

$wranglerPath = "wrangler.toml"
$wranglerContent = Get-Content $wranglerPath -Raw

# Update BACKEND_URL
$updatedContent = $wranglerContent -replace 'BACKEND_URL = ".*"', "BACKEND_URL = `"$tunnelUrl/api/moe-rag`""
$updatedContent | Out-File -FilePath $wranglerPath -Encoding UTF8 -NoNewline

Write-Host "   ✅ wrangler.toml updated with: $tunnelUrl" -ForegroundColor Green

# STEP 4: Deploy Worker
Write-Host "`n🚀 STEP 4: Deploying Cloudflare Worker..." -ForegroundColor Yellow

npm install --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️ npm install had warnings (continuing...)" -ForegroundColor Yellow
}

npx wrangler deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Worker deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Worker deployed to api.jimbo77.com" -ForegroundColor Green

# STEP 5: Test Production
Write-Host "`n🧪 STEP 5: Testing production..." -ForegroundColor Yellow

try {
    $healthCheck = Invoke-RestMethod -Uri "https://api.jimbo77.com/api/moe-rag/health" -Method Get
    if ($healthCheck.status -eq "healthy") {
        Write-Host "   ✅ Production health check passed!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Unexpected health status: $($healthCheck.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ Could not reach production endpoint (may take a minute to propagate)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "`n📊 Infrastructure:" -ForegroundColor Cyan
Write-Host "   Backend:     http://localhost:3885" -ForegroundColor White
Write-Host "   Tunnel:      $tunnelUrl" -ForegroundColor White
Write-Host "   Production:  https://api.jimbo77.com/api/moe-rag" -ForegroundColor White

Write-Host "`n🔄 Active Processes:" -ForegroundColor Cyan
Write-Host "   Backend running (check Task Manager for python.exe)" -ForegroundColor Gray
Write-Host "   Tunnel PID: $($tunnelProcess.Id)" -ForegroundColor Gray

Write-Host "`n⚠️ IMPORTANT: Keep this PowerShell window open!" -ForegroundColor Yellow
Write-Host "   Closing it will stop the tunnel (and break production)" -ForegroundColor Red

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test: curl https://api.jimbo77.com/api/moe-rag/health" -ForegroundColor White
Write-Host "   2. Monitor tunnel: tail -f $apiDir\moe_rag_tunnel.err" -ForegroundColor White
Write-Host "   3. Add frontend UI in hub.jimbo77.com" -ForegroundColor White

Write-Host "`n🎉 MoE-RAG is LIVE!`n" -ForegroundColor Green

# Keep script running
try {
    Write-Host "Press CTRL+C to stop tunnel and cleanup...`n" -ForegroundColor Gray
    Wait-Process -Id $tunnelProcess.Id
} catch {
    Write-Host "`n⛔ Tunnel stopped" -ForegroundColor Yellow
}
