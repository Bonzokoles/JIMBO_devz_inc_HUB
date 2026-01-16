# MoE-RAG Tunnel - Persistent Startup Script
# Runs cloudflared tunnel in background with auto-restart

$ErrorActionPreference = "Stop"

$TUNNEL_CONFIG = "U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api\moe-rag-tunnel.yml"
$TUNNEL_NAME = "moe-rag-backend"
$TUNNEL_LOG = "U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api\tunnel.log"

Write-Host "🚀 Starting MoE-RAG Cloudflare Tunnel..." -ForegroundColor Cyan
Write-Host "   Config: $TUNNEL_CONFIG" -ForegroundColor Gray
Write-Host "   Log: $TUNNEL_LOG" -ForegroundColor Gray
Write-Host ""

# Check if tunnel is already running
$existingProcess = Get-Process cloudflared -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*$TUNNEL_NAME*"
}

if ($existingProcess) {
    Write-Host "⚠️  Tunnel already running (PID: $($existingProcess.Id))" -ForegroundColor Yellow
    Write-Host "   To restart, kill process first: Stop-Process -Id $($existingProcess.Id)" -ForegroundColor Gray
    exit 0
}

# Start tunnel in background
Write-Host "🌐 Starting tunnel..." -ForegroundColor Green

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "cloudflared"
$processInfo.Arguments = "tunnel --config `"$TUNNEL_CONFIG`" run $TUNNEL_NAME"
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true
$processInfo.WorkingDirectory = Split-Path -Parent $TUNNEL_CONFIG

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo

# Output handlers
$outputBuilder = New-Object System.Text.StringBuilder
$errorBuilder = New-Object System.Text.StringBuilder

$outputHandler = {
    param([object]$sender, [System.Diagnostics.DataReceivedEventArgs]$e)
    if ($e.Data) {
        [void]$outputBuilder.AppendLine($e.Data)
        Add-Content -Path $TUNNEL_LOG -Value "[OUT] $($e.Data)"
    }
}

$errorHandler = {
    param([object]$sender, [System.Diagnostics.DataReceivedEventArgs]$e)
    if ($e.Data) {
        [void]$errorBuilder.AppendLine($e.Data)
        Add-Content -Path $TUNNEL_LOG -Value "[ERR] $($e.Data)"
    }
}

$process.add_OutputDataReceived($outputHandler)
$process.add_ErrorDataReceived($errorHandler)

# Start process
$started = $process.Start()
if (-not $started) {
    Write-Host "❌ Failed to start tunnel process" -ForegroundColor Red
    exit 1
}

$process.BeginOutputReadLine()
$process.BeginErrorReadLine()

$pid = $process.Id
Write-Host "✅ Tunnel started successfully!" -ForegroundColor Green
Write-Host "   PID: $pid" -ForegroundColor Cyan
Write-Host "   Log: $TUNNEL_LOG" -ForegroundColor Gray
Write-Host ""

# Wait a few seconds to check if tunnel is stable
Start-Sleep -Seconds 5

if ($process.HasExited) {
    Write-Host "❌ Tunnel exited immediately (Exit Code: $($process.ExitCode))" -ForegroundColor Red
    Write-Host ""
    Write-Host "Last output:" -ForegroundColor Yellow
    Write-Host $outputBuilder.ToString()
    Write-Host $errorBuilder.ToString()
    exit 1
}

# Test tunnel connectivity
Write-Host "🧪 Testing tunnel connectivity..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-RestMethod -Uri "https://rag.jimbo77.com/api/moe-rag/health" -Method Get -TimeoutSec 10
    Write-Host "✅ Tunnel is accessible!" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Tunnel not yet accessible (may need DNS propagation)" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎯 Tunnel Status:" -ForegroundColor Green
Write-Host "   Process ID: $pid" -ForegroundColor White
Write-Host "   URL: https://rag.jimbo77.com" -ForegroundColor Cyan
Write-Host "   Config: $TUNNEL_CONFIG" -ForegroundColor Gray
Write-Host "   Log: $TUNNEL_LOG" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Management Commands:" -ForegroundColor Yellow
Write-Host "   Check status:  Get-Process -Id $pid" -ForegroundColor White
Write-Host "   Stop tunnel:   Stop-Process -Id $pid" -ForegroundColor White
Write-Host "   View logs:     Get-Content '$TUNNEL_LOG' -Tail 50 -Wait" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Tunnel is running in background. Keep this window open or the tunnel will stop." -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop the tunnel." -ForegroundColor Gray
Write-Host ""

# Keep script alive to maintain tunnel
try {
    $process.WaitForExit()
} catch {
    Write-Host "⚠️  Script interrupted" -ForegroundColor Yellow
}

if ($process.HasExited) {
    Write-Host "❌ Tunnel stopped (Exit Code: $($process.ExitCode))" -ForegroundColor Red
    Write-Host ""
    Write-Host "Last output:" -ForegroundColor Yellow
    Get-Content $TUNNEL_LOG -Tail 20
}
