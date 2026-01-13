#!/usr/bin/env pwsh
# Quick Deploy to Cloudflare Pages
# Automatyczny deploy frontend + backend

Write-Host "`n🚀 PUMO Analytics - Quick Deploy`n" -ForegroundColor Cyan

# 1. Frontend Build
Write-Host "📦 Building Frontend..." -ForegroundColor Yellow
cd Jimbo_77/frontend/apps/pumo-frontend-legacy
npm install
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend built successfully" -ForegroundColor Green

# 2. Backend Deploy (Cloudflare Worker)
Write-Host "`n🔧 Deploying Backend Worker..." -ForegroundColor Yellow
cd ../pumo-api
npx wrangler deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend deploy failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend deployed successfully" -ForegroundColor Green

# 3. Frontend Deploy (Cloudflare Pages)
Write-Host "`n🌐 Deploying Frontend to Pages..." -ForegroundColor Yellow
cd ../pumo-frontend-legacy
npx wrangler pages deploy dist --project-name=pumo-analytics

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend deploy failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "`n📊 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: https://pumo-analytics.pages.dev" -ForegroundColor White
Write-Host "   Backend: https://jimbo-like-pumo-api.stolarnia-ams.workers.dev" -ForegroundColor White
Write-Host "   API Docs: https://jimbo-like-pumo-api.stolarnia-ams.workers.dev/docs" -ForegroundColor White

Write-Host "`n🎉 Aplikacja dostępna online!" -ForegroundColor Green
