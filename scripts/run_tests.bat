@echo off
echo ===================================================
echo Running AeroSentinel Backend Test Suite...
echo ===================================================
cd /d "%~dp0..\backend"
call venv\Scripts\activate
pytest tests\test_backend.py -v
