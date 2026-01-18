# Simple Blog Images Generator

Write-Host "`nGenerating 4 images...`n" -ForegroundColor Cyan

Set-Location "U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\cf-ai-image-gen"

$prompts = @(
    "Modern AI chatbot purple blue gradients",
    "Digital library holographic books",
    "Global network glowing points",
    "Semantic search visualization"
)

$names = @("ai-chat-hero.png", "knowledge-base.png", "edge-computing.png", "ai-search.png")

for ($i = 0; $i -lt 4; $i++) {
    Write-Host "[$($i+1)/4] $($names[$i])" -ForegroundColor Yellow
    
    bun run ./download-png.ts $prompts[$i] $names[$i]
    
    if ($i -lt 3) { Start-Sleep -Seconds 3 }
}

Write-Host "`nDone! Check: U:\The_yellow_hub\my-bonzo-ai-blog\public\generated\`n" -ForegroundColor Green
