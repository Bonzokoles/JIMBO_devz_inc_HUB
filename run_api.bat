@echo off
echo 🚀 Installing/Updating Dependencies...
python -m pip install -r Jimbo_77/api/requirements.txt
python -m pip install uvicorn

echo.
echo 🚀 Starting JIMBO77 Ops API (FastAPI)...
echo 🌐 API will be available at http://localhost:8000
echo 📚 Docs at http://localhost:8000/docs
echo.

set PYTHONPATH=%PYTHONPATH%;%CD%
python -m uvicorn Jimbo_77.api.app.main:app --reload --host 0.0.0.0 --port 8000
