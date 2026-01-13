$ErrorActionPreference = "Stop"

$exeInfo = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($exeInfo) {
    Write-Host "Cloudflared found in PATH: $($exeInfo.Source)"
    $exePath = "cloudflared"
} elseif (Test-Path ".\cloudflared.exe") {
    Write-Host "Cloudflared found in current directory."
    $exePath = ".\cloudflared.exe"
} else {
    Write-Host "Cloudflared not found. Downloading..."
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
    Write-Host "Download complete."
    $exePath = ".\cloudflared.exe"
}

Write-Host "Starting tunnel for http://localhost:8000..."
# Start process and redirect output to file because cloudflared logs to stderr
$p = Start-Process -FilePath $exePath -ArgumentList "tunnel --url http://localhost:8000" -NoNewWindow -PassThru -RedirectStandardOutput "tunnel.log" -RedirectStandardError "tunnel.err"

Write-Host "Tunnel started (PID: $($p.Id)). Waiting for URL..."
Start-Sleep -Seconds 5

if (Test-Path "tunnel.err") {
    Get-Content "tunnel.err" | Select-String "trycloudflare.com"
}
if (Test-Path "tunnel.log") {
    Get-Content "tunnel.log" | Select-String "trycloudflare.com"
}
