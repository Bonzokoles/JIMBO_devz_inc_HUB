$ErrorActionPreference = "SilentlyContinue"
Write-Host "`nAUTO-RESTART INDEXING" -ForegroundColor Cyan
$i = 0
while ($true) {
    $i++
    cd "U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\pumo-rag\indexing"
    bun run index-products.ts 2>&1 | Out-Null
    $p = Get-Content "U:\The_yellow_hub\docs\PUMO\indexing_progress.json" -Raw | ConvertFrom-Json
    $t = Get-Date -Format "HH:mm:ss"
    Write-Host "[$t] #$i | Chunks: $($p.processedChunks.Count)/533 | Products: $($p.indexedProducts)" -ForegroundColor Green
    if ($p.processedChunks.Count -ge 533) { Write-Host "`nZAKONCZONO!" -ForegroundColor Green; break }
    Start-Sleep -Seconds 1
}
