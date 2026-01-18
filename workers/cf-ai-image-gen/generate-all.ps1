# Generate 4 blog images using Cloudflare Workers AI (FREE!)

$images = @(
    @{ prompt = "Modern AI chatbot interface with holographic display, purple blue gradients, futuristic UI"; name = "ai-chat-hero.png" },
    @{ prompt = "Digital library with floating holographic books, purple blue lighting, AI brain"; name = "knowledge-base.png" },
    @{ prompt = "Global network map, glowing connection points, purple orange gradients"; name = "edge-computing.png" },
    @{ prompt = "Semantic search visualization, vector embeddings, blue teal colors, neural network"; name = "ai-search.png" }
)

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎨 FREE Blog Image Generator" -ForegroundColor White
Write-Host "   Cloudflare Workers AI - SDXL" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Set-Location "U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\cf-ai-image-gen"

$success = 0

for ($i = 0; $i -lt $images.Count; $i++) {
    $img = $images[$i]
    $num = $i + 1
    
    Write-Host "[$num/4] $($img.name)" -ForegroundColor Yellow
    Write-Host "      $($img.prompt.Substring(0, [Math]::Min(60, $img.prompt.Length)))..." -ForegroundColor Gray
    
    try {
        bun run ./download-png.ts $img.prompt $img.name 2>&1 | Out-Null
        
        $file = Get-Item "U:\The_yellow_hub\my-bonzo-ai-blog\public\generated\$($img.name)" -ErrorAction Stop
        
        if ($file.Length -gt 10KB) {
            $sizeKB = [math]::Round($file.Length / 1KB, 1)
            Write-Host "      ✅ ${sizeKB}KB`n" -ForegroundColor Green
            $success++
        } else {
            Write-Host "      ❌ File too small (0KB)`n" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "      ❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
    }
    
    # Delay to avoid rate limits
    if ($i -lt $images.Count - 1) {
        Start-Sleep -Seconds 3
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Generated: $success/4 images" -ForegroundColor Green
Write-Host "💰 Cost: $0.00 (FREE!)" -ForegroundColor Green
Write-Host "📁 U:\The_yellow_hub\my-bonzo-ai-blog\public\generated\" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
