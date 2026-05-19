@echo off
title Pixie — AI Background Remover
color 0B

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     Pixie AI Background Remover           ║
echo  ║     Starting...                           ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ── Start Python backend ────────────────────────
echo  Starting Python backend on http://localhost:8000 ...

if not exist "%~dp0backend\.venv\Scripts\uvicorn.exe" (
    echo  Virtual environment not found. Run install.bat first.
    pause
    exit /b 1
)

start "Pixie Backend" cmd /k ""%~dp0backend\.venv\Scripts\uvicorn.exe" app:app --host 127.0.0.1 --port 8000 --app-dir "%~dp0backend""

:: Give the backend a moment to start
timeout /t 4 /nobreak >nul

:: ── Start React frontend ─────────────────────────
echo  Starting React frontend on http://localhost:5173 ...
cd /d "%~dp0frontend"

where npm >nul 2>&1
if errorlevel 1 (
    echo  ERROR: npm not found. Install Node.js from https://nodejs.org
    pause
    exit /b 1
)

start "Pixie Frontend" cmd /k "npm run dev"

:: Give frontend a moment to compile
timeout /t 4 /nobreak >nul

:: ── Open browser ─────────────────────────────────
echo  Opening http://localhost:5173 in your browser...
start "" "http://localhost:5173"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║  Pixie is running!                        ║
echo  ║  Frontend → http://localhost:5173          ║
echo  ║  Backend  → http://localhost:8000          ║
echo  ║  Close both terminal windows to stop.      ║
echo  ╚══════════════════════════════════════════╝
echo.
pause
