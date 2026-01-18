# Agents Orchestrator - Ngrok Integration Patch
# Apply this patch to integrate ngrok multi-provider routing

Write-Host "`n🔧 AGENTS ORCHESTRATOR - NGROK INTEGRATION`n" -ForegroundColor Cyan

$workerPath = "U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\agents-orchestrator"

if (-not (Test-Path $workerPath)) {
    Write-Host "❌ Worker not found at: $workerPath`n" -ForegroundColor Red
    exit 1
}

Write-Host "Worker location: $workerPath" -ForegroundColor Gray
Write-Host ""

# Step 1: Backup current version
Write-Host "Step 1: Creating backup..." -NoNewline

$backupPath = "$workerPath\src\index.ts.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if (Test-Path "$workerPath\src\index.ts") {
    Copy-Item "$workerPath\src\index.ts" $backupPath
    Write-Host " ✅" -ForegroundColor Green
    Write-Host "  Backup: $backupPath" -ForegroundColor Gray
} else {
    Write-Host " ⚠️ File not found, skipping" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Update wrangler.toml
Write-Host "Step 2: Updating wrangler.toml..." -NoNewline

$wranglerPath = "$workerPath\wrangler.toml"
if (Test-Path $wranglerPath) {
    $wranglerContent = Get-Content $wranglerPath -Raw
    
    # Add NGROK_PROXY_URL if not already present
    if ($wranglerContent -notmatch "NGROK_PROXY_URL") {
        $varsSection = @"

# Ngrok AI Gateway Integration
[vars]
NGROK_PROXY_URL = "https://ngrok-proxy.stolarnia-ams.workers.dev"
"@
        
        Add-Content $wranglerPath $varsSection
        Write-Host " ✅" -ForegroundColor Green
        Write-Host "  Added NGROK_PROXY_URL to wrangler.toml" -ForegroundColor Gray
    } else {
        Write-Host " ⚠️ Already configured" -ForegroundColor Yellow
    }
} else {
    Write-Host " ❌ wrangler.toml not found" -ForegroundColor Red
}

Write-Host ""

# Step 3: Set secrets
Write-Host "Step 3: Setting worker secrets..." -ForegroundColor Yellow
Write-Host "  You need to manually run:" -ForegroundColor Gray
Write-Host "    cd $workerPath" -ForegroundColor Cyan
Write-Host "    npx wrangler secret put JIMBO_API_KEY" -ForegroundColor Cyan
Write-Host "  (Use the same API key from ngrok-proxy worker)" -ForegroundColor Gray
Write-Host ""

# Step 4: Code changes guide
Write-Host "Step 4: Code changes required" -ForegroundColor Yellow
Write-Host ""

$codeChanges = @"
FILE: src/index.ts (or main handler file)

FIND this pattern (direct OpenRouter call):
───────────────────────────────────────────
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${env.OPENROUTER_API_KEY}\`,
    'HTTP-Referer': 'https://orchestrator.jimbo77.com',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'deepseek/deepseek-r1',
    messages: agentMessages
  })
});

REPLACE WITH (ngrok proxy):
───────────────────────────────────────────
const response = await fetch(\`\${env.NGROK_PROXY_URL}/api/chat\`, {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${env.JIMBO_API_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'deepseek-r1',  // ngrok handles provider routing
    messages: agentMessages
  })
});

// Optional: Extract provider info
const provider = response.headers.get('X-Provider');
console.log(\`Agent response from provider: \${provider}\`);

BENEFITS:
───────────────────────────────────────────
✅ Automatic failover: DeepSeek → Claude → GPT-4
✅ Rate limit handling (no more 429 errors)
✅ Cost optimization via smart routing
✅ Provider selection based on latency/cost
✅ Built-in retry logic
"@

Write-Host $codeChanges -ForegroundColor Gray
Write-Host ""

# Step 5: Deployment
Write-Host "Step 5: Deployment instructions" -ForegroundColor Yellow
Write-Host ""
Write-Host "After making code changes:" -ForegroundColor Gray
Write-Host "  1. cd $workerPath" -ForegroundColor Cyan
Write-Host "  2. npm install (if needed)" -ForegroundColor Cyan
Write-Host "  3. npx wrangler deploy" -ForegroundColor Cyan
Write-Host "  4. Test: curl https://orchestrator.jimbo77.com/orchestrate" -ForegroundColor Cyan
Write-Host ""

# Step 6: Rollback instructions
Write-Host "Step 6: Rollback (if needed)" -ForegroundColor Yellow
Write-Host ""
Write-Host "If integration fails:" -ForegroundColor Gray
Write-Host "  1. Restore backup:" -ForegroundColor Cyan
Write-Host "     Copy-Item $backupPath $workerPath\src\index.ts -Force" -ForegroundColor Cyan
Write-Host "  2. Redeploy: npx wrangler deploy" -ForegroundColor Cyan
Write-Host "  3. Or use Cloudflare rollback: npx wrangler rollback" -ForegroundColor Cyan
Write-Host ""

Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  READY TO INTEGRATE" -ForegroundColor White
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Follow steps 3-5 above to complete integration`n" -ForegroundColor Gray
