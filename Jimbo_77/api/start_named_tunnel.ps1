#!/usr/bin/env pwsh
# Start Named Tunnel as Windows Service (persistent)

$tunnelName = "moe-rag-backend"
$configPath = "U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api\cloudflared-config.yml"

Write-Host "`n🚇 Starting Named Tunnel: $tunnelName`n" -ForegroundColor Cyan

# Start tunnel in background
$tunnelJob = Start-Job -ScriptBlock {
    param($config, $tunnel)
    cloudflared tunnel --config $config run $tunnel
} -ArgumentList $configPath, $tunnelName

Write-Host "✅ Tunnel started in background (Job ID: $($tunnelJob.Id))" -ForegroundColor Green
Write-Host "`n📊 Tunnel Info:" -ForegroundColor Cyan
Write-Host "   Name:     $tunnelName" -ForegroundColor White
Write-Host "   URL:      https://moe.jimbo77.com" -ForegroundColor White
Write-Host "   Endpoint: https://moe.jimbo77.com/api/moe-rag" -ForegroundColor White
Write-Host "   Job ID:   $($tunnelJob.Id)" -ForegroundColor Gray

Write-Host "`n⏳ Waiting 5 seconds for tunnel to establish..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n🧪 Testing tunnel..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://moe.jimbo77.com/api/moe-rag/health" -Method Get -TimeoutSec 10
    Write-Host "✅ Tunnel is LIVE and responding!" -ForegroundColor Green
    Write-Host ($health | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "⚠️ Tunnel not responding yet (may need more time)" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host "`n📋 Management Commands:" -ForegroundColor Cyan
Write-Host "   Check status:  Get-Job -Id $($tunnelJob.Id)" -ForegroundColor White
Write-Host "   View logs:     Receive-Job -Id $($tunnelJob.Id) -Keep" -ForegroundColor White
Write-Host "   Stop tunnel:   Stop-Job -Id $($tunnelJob.Id); Remove-Job -Id $($tunnelJob.Id)" -ForegroundColor White

Write-Host "`n✅ Tunnel running in background!`n" -ForegroundColor Green

# Keep script alive to show job info
$tunnelJob | Format-Table -AutoSize
