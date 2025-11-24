@echo off
REM Quick Start Script for CognitoAI RAG Server on Windows

echo.
echo ╔══════════════════════════════════════════════╗
echo ║   CognitoAI RAG Server - Quick Start         ║
echo ╚══════════════════════════════════════════════╝
echo.

REM Check if Ollama is installed
echo [1/3] Checking Ollama...
ollama -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Ollama not found. Please install from https://ollama.ai
    pause
    exit /b 1
) else (
    echo ✅ Ollama is installed
)

REM Check if Python is installed
echo [2/3] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.10+
    pause
    exit /b 1
) else (
    echo ✅ Python is installed
)

REM Check if venv exists, if not create it
echo [3/3] Setting up virtual environment...
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install/Update requirements
echo Installing dependencies...
pip install -r requirements-rag.txt -q

echo.
echo ╔══════════════════════════════════════════════╗
echo ║   ✅ Setup Complete!                          ║
echo ║                                              ║
echo ║   Starting RAG Server...                     ║
echo ║   Server will run on http://localhost:8501  ║
echo ║                                              ║
echo ║   Keep this window open while chatbot runs   ║
echo ╚══════════════════════════════════════════════╝
echo.

REM Start Ollama in background if not already running
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Starting Ollama...
    start "" ollama serve
    timeout /t 3 /nobreak
)

REM Run RAG server
python rag-server.py
