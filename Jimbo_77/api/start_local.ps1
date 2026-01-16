#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start MoE-RAG API locally for development
    
.DESCRIPTION
    Uruchamia FastAPI server z MoE-RAG na porcie 8001
    
.EXAMPLE
    .\start_local.ps1
#>

Write-Host ""
Write-Host "Starting MoE-RAG API (Local Development)" -ForegroundColor Cyan
Write-Host ""

# Check if agents/logs directory exists
$apiDir = Split-Path -Parent $PSScriptRoot
$logsDir = Join-Path -Path $apiDir -ChildPath "agents\logs"
if (-not (Test-Path $logsDir)) {
    Write-Host "Creating agents/logs directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    Write-Host "Directory created" -ForegroundColor Green
    Write-Host ""
}

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found! Install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Check if required packages are installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
$requiredPackages = @("fastapi", "uvicorn", "sentence-transformers")
$missingPackages = @()

foreach ($package in $requiredPackages) {
    $installed = python -c "import $package" 2>&1
    if ($LASTEXITCODE -ne 0) {
        $missingPackages += $package
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Host "Missing packages: $($missingPackages -join ', ')" -ForegroundColor Yellow
    Write-Host "Installing missing packages..." -ForegroundColor Yellow
    pip install $($missingPackages -join ' ') --quiet
    Write-Host "Dependencies installed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "All dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Display server info
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  MoE-RAG API - Local Development Server" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Server URL:      http://localhost:3885" -ForegroundColor White
Write-Host "  API Docs:        http://localhost:3885/docs" -ForegroundColor White
Write-Host "  MoE-RAG Health:  http://localhost:3885/api/moe-rag/health" -ForegroundColor White
Write-Host "  MoE-RAG Debug:   http://localhost:3885/api/moe-rag/debug" -ForegroundColor White
Write-Host ""
Write-Host "  Port: 3885 (RAG_API_PORT from config/ports.env)" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start server
Set-Location $PSScriptRoot
try {
    python run.py
} catch {
    Write-Host ""
    Write-Host "Server stopped with error: $_" -ForegroundColor Red
    exit 1
}
