# Skrypt do usunięcia Cloudflare Tunnel z autostartu

$TaskName = "CloudflareTunnel-Jimbo77"

# Zatrzymaj jeśli działa
Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

# Usuń task
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

Write-Host "✅ Task usunięty: $TaskName" -ForegroundColor Green
Write-Host "Tunnel nie będzie już uruchamiał się automatycznie." -ForegroundColor Yellow
