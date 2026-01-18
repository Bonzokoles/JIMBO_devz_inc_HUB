# Ngrok Vault Setup Script
# Automatically reads API keys from .env and adds them to ngrok vault

Write-Host "`n[NGROK VAULT CONFIGURATION]`n" -ForegroundColor Cyan

# Load .env file
$envPath = "U:\The_yellow_hub\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "[ERROR] .env file not found at $envPath" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envPath
$envVars = @{}

foreach ($line in $envContent) {
    if ($line -match '^([^#=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

Write-Host "[OK] Loaded .env file with $($envVars.Count) variables`n" -ForegroundColor Green

# Check if ngrok CLI is installed
try {
    $ngrokVersion = ngrok version 2>&1
    Write-Host "[OK] Ngrok CLI detected: $ngrokVersion`n" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Ngrok CLI not found. Install from: https://ngrok.com/download" -ForegroundColor Red
    Write-Host "   Or run: choco install ngrok`n" -ForegroundColor Yellow
    exit 1
}

# Vault secrets to configure
$vaultSecrets = @{
    "VAULT_GEMINI_KEY" = @{
        envKey = "GEMINI_API_KEY"
        description = "Google Gemini 1.5 Pro (FREE tier)"
    }
    "VAULT_OPENROUTER_KEY" = @{
        envKey = "OPENROUTER_API_KEY"
        description = "OpenRouter (Claude + DeepSeek)"
    }
    "VAULT_OPENAI_KEY_1" = @{
        envKey = "OPENAI_API_KEY"
        description = "OpenAI GPT-4 (rotation key 1)"
    }
    "VAULT_OPENAI_KEY_2" = @{
        envKey = "OPENAI_API_KEY_2"
        description = "OpenAI GPT-4 (rotation key 2)"
        optional = $true
    }
    "VAULT_OPENAI_KEY_3" = @{
        envKey = "OPENAI_API_KEY_3"
        description = "OpenAI GPT-4 (rotation key 3)"
        optional = $true
    }
    "VAULT_JIMBO_API_KEY_1" = @{
        envKey = "JIMBO_API_KEY"
        description = "JIMBO API Key (for securing ngrok endpoint)"
        generate = $true
    }
    "VAULT_JIMBO_API_KEY_2" = @{
        envKey = "JIMBO_API_KEY_2"
        description = "JIMBO API Key #2 (backup)"
        generate = $true
    }
    "VAULT_OTEL_TOKEN" = @{
        envKey = "OTEL_TOKEN"
        description = "OpenTelemetry auth token"
        generate = $true
    }
}

Write-Host "`n[Vault Configuration]`n" -ForegroundColor Cyan
$vaultSecrets.Keys | ForEach-Object {
    $secret = $vaultSecrets[$_]
    if ($secret.generate) { 
        $status = "WILL GENERATE"
        $color = "Green"
    } elseif ($envVars.ContainsKey($secret.envKey)) { 
        $status = "FOUND"
        $color = "Green"
    } elseif ($secret.optional) { 
        $status = "OPTIONAL"
        $color = "Yellow"
    } else { 
        $status = "MISSING"
        $color = "Red"
    }
    Write-Host "  $_" -NoNewline
    Write-Host " ($($secret.description))" -ForegroundColor Gray
    Write-Host "    -> $status`n" -ForegroundColor $color
}

# Confirm before proceeding
Write-Host "`n[WARNING] This will add/update secrets in ngrok vault." -ForegroundColor Yellow
Write-Host "   Gateway ID: rd_33FaSZ9e7c6yHF9q1mFNNme2fDG`n" -ForegroundColor Gray
$confirm = Read-Host "Continue? (y/N)"
if ($confirm -ne "y") {
    Write-Host "`n[CANCELLED]`n" -ForegroundColor Red
    exit 0
}

Write-Host "`n[Adding secrets to ngrok vault...]`n" -ForegroundColor Cyan

# Add each secret
$success = 0
$failed = 0

foreach ($vaultKey in $vaultSecrets.Keys) {
    $secret = $vaultSecrets[$vaultKey]
    
    Write-Host "  Adding $vaultKey..." -NoNewline
    
    # Determine value
    $value = $null
    if ($secret.generate) {
        # Generate random key
        $bytes = New-Object byte[] 32
        [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
        $value = [System.Convert]::ToBase64String($bytes)
        Write-Host " (generated)" -ForegroundColor Gray
    } elseif ($envVars.ContainsKey($secret.envKey)) {
        $value = $envVars[$secret.envKey]
    } elseif ($secret.optional) {
        Write-Host " SKIPPED (optional, not in .env)" -ForegroundColor Yellow
        continue
    } else {
        Write-Host " FAILED (missing in .env)" -ForegroundColor Red
        $failed++
        continue
    }
    
    # Add to ngrok vault
    try {
        # Use echo to pipe value to ngrok vault add (avoids interactive prompt)
        $valueLength = $value.Length
        $maskedValue = $value.Substring(0, [Math]::Min(10, $valueLength)) + "..."
        
        # Create temp file for value (ngrok vault add reads from stdin)
        $tempFile = [System.IO.Path]::GetTempFileName()
        Set-Content -Path $tempFile -Value $value -NoNewline
        
        $result = Get-Content $tempFile | ngrok vault add $vaultKey 2>&1
        Remove-Item $tempFile -Force
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " [OK] SUCCESS ($maskedValue)" -ForegroundColor Green
            $success++
        } else {
            Write-Host " [FAIL] FAILED: $result" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host " [FAIL] FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# Summary
Write-Host "`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  VAULT CONFIGURATION SUMMARY" -ForegroundColor White
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  [OK] Success: $success" -ForegroundColor Green
Write-Host "  [FAIL] Failed:  $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

if ($failed -gt 0) {
    Write-Host "⚠️  Some secrets failed. Check error messages above.`n" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "🎉 All secrets successfully added to ngrok vault!`n" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Deploy ngrok configuration: ngrok ai-gateway config apply 01_ngrok_config.yml" -ForegroundColor Gray
    Write-Host "  2. Test endpoint: .\test-ngrok.ps1`n" -ForegroundColor Gray
    exit 0
}
