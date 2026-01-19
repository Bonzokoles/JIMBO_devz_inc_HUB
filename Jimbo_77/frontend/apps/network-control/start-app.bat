@echo off
echo Starting Jimbo_net Control Center...
cd /d "%~dp0"
call npm run dev
echo Application started successfully!
pause