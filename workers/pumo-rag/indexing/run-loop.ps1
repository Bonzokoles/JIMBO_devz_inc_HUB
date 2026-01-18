# Auto-restart indexing loop
$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n🔁 AUTO-RESTART INDEXING LOOP" -ForegroundColor Cyan
Write-Host "Ctrl+C aby zatrzymać`n" -ForegroundColor Yellow

$iteration = 0
while ($true) {
    $iteration++
    
    # Run indexing
    cd "U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\pumo-rag\indexing"
    bun run index-products.ts 2>&1 | Out-Null
    
    # Check progress
    $progress = Get-Content "U:\The_yellow_hub\docs\PUMO\indexing_progress.json" -Raw | ConvertFrom-Json
    
    $time = Get-Date -Format "HH:mm:ss"
    $chunks = $progress.processedChunks.Count
    $products = $progress.indexedProducts
    $errors = $progress.errors.Count
    $percentChunks = [math]::Round($chunks / 533 * 100, 1)
    
    $color = if ($errors -eq 0) { "Green" } else { "Red" }
    Write-Host "[$time] #$iteration | Chunks: $chunks/533 ($percentChunks%) | Products: $products | Errors: $errors" -ForegroundColor $color
    
    # Check if complete
    if ($chunks -ge 533) {
        Write-Host "`n🎉 ZAKOŃCZONO! Wszystkie chunki przetworzone!" -ForegroundColor Green
        Write-Host "✅ Zaindexowano: $products produktów" -ForegroundColor Cyan
        break
    }
    
    # Small delay before restart
    Start-Sleep -Seconds 1
}
