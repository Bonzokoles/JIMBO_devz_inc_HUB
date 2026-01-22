@echo off
TITLE JIMBO 77 - PUBLISHER PRODUCTION LAUNCHER
color 0A

echo ===================================================
echo   JIMBO 77 - PUBLISHER 2.0 PRODUCTION SYSTEM
echo ===================================================
echo.

echo 🚀 Starting SUB-AGENTS (The Swarm)...
echo ---------------------------------------
start "Writer Agent (6030)" /min cmd /k "title Writer Agent && cd agents/python/writer-agent && python main.py"
echo ✅ Writer Agent Started on Port 6030
start "SEO Agent (6031)" /min cmd /k "title SEO Agent && cd agents/python/seo-agent && python main.py"
echo ✅ SEO Agent Started on Port 6031
start "Research Agent (6062)" /min cmd /k "title Research Agent && cd agents/python/research-agent && python main.py"
echo ✅ Research Agent Started on Port 6062

echo.
echo 🚀 Starting MAIN API ORCHESTRATOR...
echo ---------------------------------------
set PYTHONPATH=%CD%
start "JIMBO API (8000)" /min cmd /k "title JIMBO API && python -m uvicorn Jimbo_77.api.app.main:app --host 0.0.0.0 --port 8000"
echo ✅ Main API Started on Port 8000

echo.
echo 🚀 Starting DASHBOARD FRONTEND...
echo ---------------------------------------
cd Jimbo_77/frontend
start "Frontend Dashboard" cmd /k "npm run dev"

echo.
echo ===================================================
echo   ALL SYSTEMS GO! 
echo   Dashboard: http://localhost:5173
echo   Docs:      http://localhost:8000/docs
echo ===================================================
echo.
pause
