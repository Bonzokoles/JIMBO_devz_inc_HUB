# Ustawienie API Keys dla MoE-RAG
# Zapisz wartości i wykonaj w PowerShell

# OpenRouter API Key (główny - Qwen 2.5 72B)
$env:OPENROUTER_API_KEY = "sk-or-v1-YOUR_KEY_HERE"

# DeepSeek API Key (opcjonalny - reasoning model)
$env:DEEPSEEK_API_KEY = "sk-YOUR_KEY_HERE"

# OpenAI API Key (opcjonalny - fallback)
$env:OPENAI_API_KEY = "sk-YOUR_KEY_HERE"

# Aby ustawić permanentnie (zapisane w systemie):
# [System.Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY", "sk-or-v1-YOUR_KEY", "User")
# [System.Environment]::SetEnvironmentVariable("DEEPSEEK_API_KEY", "sk-YOUR_KEY", "User")

Write-Host "✅ Environment variables set for current session"
Write-Host "⚠️  To make permanent, uncomment and run the SetEnvironmentVariable commands above"
