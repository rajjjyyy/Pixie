@echo off
title Pixie — Install Dependencies
color 0B
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     Pixie AI Background Remover           ║
echo  ║     Installing Dependencies...            ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ── Backend ────────────────────────────────────
echo [1/2] Installing Python backend dependencies...
echo       (This may take several minutes for PyTorch)
echo.
cd /d "%~dp0backend"

python -m venv .venv
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

call .venv\Scripts\activate.bat
python -m pip install --upgrade pip --quiet
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python packages.
    pause
    exit /b 1
)

echo.
echo [2/2] Installing Node.js frontend dependencies...
echo.
cd /d "%~dp0frontend"

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js / npm not found. Please install from https://nodejs.org
    pause
    exit /b 1
)

npm install
if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

echo.
echo  ✓ All dependencies installed successfully!
echo  Run start.bat to launch Pixie.
echo.
pause
