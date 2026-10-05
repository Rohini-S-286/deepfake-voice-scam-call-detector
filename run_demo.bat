@echo off
title AegisVoice AI - Deepfake Voice Scam Detector
color 0b
echo =================================================================
echo        AEGISVOICE AI - DEEPFAKE VOICE SCAM CALL DETECTOR
echo =================================================================
echo.
echo [*] Checking dependencies...
python -c "import fastapi, uvicorn, scipy, numpy, soundfile" >nul 2>&1
if errorlevel 1 (
    echo [!] Installing required packages...
    python -m pip install -r requirements.txt
)

echo [*] Launching AegisVoice AI Defense Dashboard...
python run.py
pause
