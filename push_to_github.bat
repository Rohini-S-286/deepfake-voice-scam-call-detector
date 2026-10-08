@echo off
title Push AegisVoice AI to GitHub
color 0b
echo =================================================================
echo        PUSHING AEGISVOICE AI TO GITHUB (Rohini-S-286)
echo =================================================================
echo.
set "PATH=C:\Users\ROHINI S\AppData\Local\github-copilot-git-2.53.0-3\cmd;C:\Users\ROHINI S\AppData\Local\copilot-desktop-gh-2.96.0;%PATH%"

cd /d "C:\Users\ROHINI S\Downloads\deepfake_voice_detector"

echo [*] Configuring remote origin...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/Rohini-S-286/deepfake-voice-scam-call-detector.git

echo [*] Remote URL:
git remote -v
echo.
echo [*] Pushing commits to https://github.com/Rohini-S-286/deepfake-voice-scam-call-detector...
echo [*] If Git Credential Manager opens a browser window, please click 'Sign in with your browser'.
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo =================================================================
    echo [!] Push encountered an issue or authentication is needed.
    echo =================================================================
) else (
    echo.
    echo =================================================================
    echo [SUCCESS] All files and README successfully published to GitHub!
    echo URL: https://github.com/Rohini-S-286/deepfake-voice-scam-call-detector
    echo =================================================================
)
echo.
pause
