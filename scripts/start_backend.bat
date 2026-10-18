@echo off
echo ===================================================
echo Starting AeroSentinel FastAPI Backend Engine...
echo ===================================================
cd /d "%~dp0..\backend"
call venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
