#!/usr/bin/env pwsh
# Cloudflare Tunnel dla MoE-RAG Backend
# Wystawia lokalny port 3885 na publiczny URL

$ErrorActionPreference = "Stop"

Write-Host "`n🌐 MoE-RAG Backend Tunnel Setup`n" -ForegroundColor Cyan

# Sprawdź czy backend działa
Write-Host "📡 Checking if backend is running on port 3885..." -ForegroundColor Yellow
$backendRunning = Test-NetConnection -ComputerName localhost -Port 3885 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $backendRunning) {
    Write-Host "❌ Backend not running on port 3885!" -ForegroundColor Red
    Write-Host "   Please start backend first:" -ForegroundColor Yellow
    Write-Host "   cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api" -ForegroundColor White
    Write-Host "   python run.py" -ForegroundColor White
    exit 1
}

Write-Host "✅ Backend is running" -ForegroundColor Green

# Znajdź cloudflared
$exeInfo = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($exeInfo) {
    Write-Host "✅ Cloudflared found in PATH: $($exeInfo.Source)" -ForegroundColor Green
    $exePath = "cloudflared"
} elseif (Test-Path ".\cloudflared.exe") {
    Write-Host "✅ Cloudflared found in current directory" -ForegroundColor Green
    $exePath = ".\cloudflared.exe"
} else {
    Write-Host "📥 Downloading cloudflared..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
    Write-Host "✅ Download complete" -ForegroundColor Green
    $exePath = ".\cloudflared.exe"
}

# Uruchom tunel
Write-Host "`n🚇 Starting tunnel for http://localhost:3885..." -ForegroundColor Yellow
Write-Host "   (Press CTRL+C to stop)" -ForegroundColor Gray

# Start cloudflared z przekierowaniem logów
$p = Start-Process -FilePath $exePath `
    -ArgumentList "tunnel --url http://localhost:3885" `
    -NoNewWindow `
    -PassThru `
    -RedirectStandardOutput "moe_rag_tunnel.log" `
    -RedirectStandardError "moe_rag_tunnel.err"

Write-Host "✅ Tunnel started (PID: $($p.Id))" -ForegroundColor Green
Write-Host "`n⏳ Waiting for tunnel URL (5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Wyciągnij URL z logów
$tunnelUrl = $null

if (Test-Path "moe_rag_tunnel.err") {
    $tunnelUrl = Get-Content "moe_rag_tunnel.err" | Select-String "https://.*\.trycloudflare\.com" | Select-Object -First 1
}

if (Test-Path "moe_rag_tunnel.log") {
    if (-not $tunnelUrl) {
        $tunnelUrl = Get-Content "moe_rag_tunnel.log" | Select-String "https://.*\.trycloudflare\.com" | Select-Object -First 1
    }
}

if ($tunnelUrl) {
    $url = $tunnelUrl.Matches.Value
    Write-Host "`n✅ TUNNEL ACTIVE!" -ForegroundColor Green
    Write-Host "`n📊 Public URLs:" -ForegroundColor Cyan
    Write-Host "   Health:  $url/api/moe-rag/health" -ForegroundColor White
    Write-Host "   Main:    $url/api/moe-rag" -ForegroundColor White
    Write-Host "   Debug:   $url/api/moe-rag/debug" -ForegroundColor White
    Write-Host "   Docs:    $url/docs" -ForegroundColor White
    
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Test health: curl $url/api/moe-rag/health" -ForegroundColor White
    Write-Host "   2. Update wrangler.toml BACKEND_URL = `"$url`"" -ForegroundColor White
    Write-Host "   3. Deploy Worker: cd workers/moe-rag-proxy && npx wrangler deploy" -ForegroundColor White
    
    Write-Host "`n💾 Tunnel URL saved to tunnel_url.txt" -ForegroundColor Yellow
    $url | Out-File -FilePath "tunnel_url.txt" -Encoding UTF8
    
    Write-Host "`n🔄 Tunnel running... Press CTRL+C to stop`n" -ForegroundColor Green
    
    # Keep script running
    try {
        Wait-Process -Id $p.Id
    } catch {
        Write-Host "`n⛔ Tunnel stopped" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n⚠️ Could not extract tunnel URL" -ForegroundColor Yellow
    Write-Host "   Check logs:" -ForegroundColor Gray
    Write-Host "   - moe_rag_tunnel.log" -ForegroundColor Gray
    Write-Host "   - moe_rag_tunnel.err" -ForegroundColor Gray
    Write-Host "`n   Tunnel process is running (PID: $($p.Id))" -ForegroundColor White
}
