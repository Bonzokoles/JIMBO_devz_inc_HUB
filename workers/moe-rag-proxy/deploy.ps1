#!/usr/bin/env pwsh
# MoE-RAG Production Deployment Script
# Deploys Worker proxy to api.jimbo77.com

Write-Host "`n🚀 MoE-RAG - Production Deployment`n" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "wrangler.toml")) {
    Write-Host "❌ Error: wrangler.toml not found!" -ForegroundColor Red
    Write-Host "   Please run this from workers/moe-rag-proxy directory" -ForegroundColor Yellow
    exit 1
}

# 1. Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# 2. Deploy to Cloudflare
Write-Host "`n🔧 Deploying to Cloudflare..." -ForegroundColor Yellow
npx wrangler deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Deployed successfully" -ForegroundColor Green

# 3. Test deployment
Write-Host "`n🧪 Testing deployment..." -ForegroundColor Yellow

# Health check
Write-Host "   Testing health endpoint..." -ForegroundColor Cyan
$healthResponse = Invoke-RestMethod -Uri "https://api.jimbo77.com/api/moe-rag/health" -Method Get
if ($healthResponse.status -eq "healthy") {
    Write-Host "   ✅ Health check passed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Health check returned unexpected status" -ForegroundColor Yellow
}

Write-Host "`n✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "`n📊 URLs:" -ForegroundColor Cyan
Write-Host "   Health:  https://api.jimbo77.com/api/moe-rag/health" -ForegroundColor White
Write-Host "   Main:    https://api.jimbo77.com/api/moe-rag" -ForegroundColor White
Write-Host "   Debug:   https://api.jimbo77.com/api/moe-rag/debug" -ForegroundColor White
Write-Host "   Docs:    https://api.jimbo77.com/docs (backend)" -ForegroundColor White

Write-Host "`n📌 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update BACKEND_URL in wrangler.toml with your server URL" -ForegroundColor White
Write-Host "   2. Test with: curl -X POST https://api.jimbo77.com/api/moe-rag -d '{""query"":""test""}'" -ForegroundColor White
Write-Host "   3. Monitor logs: npx wrangler tail" -ForegroundColor White

Write-Host "`n🎉 MoE-RAG is live!" -ForegroundColor Green
