@echo off
REM =============================================================================
REM  JPT AI Image Server — ONE-CLICK start.
REM  Just double-click this file. It sets everything up the first time
REM  (virtual env, PyTorch+CUDA, dependencies, config) and then runs the server.
REM  Later runs skip setup and start instantly.
REM =============================================================================
cd /d "%~dp0"
setlocal enabledelayedexpansion

REM ── First-time setup ─────────────────────────────────────────────────────────
if not exist venv (
  echo [setup] Creating virtual environment...
  python -m venv venv || goto :err
  call venv\Scripts\activate.bat
  echo [setup] Upgrading pip...
  python -m pip install --upgrade pip
  echo [setup] Installing PyTorch with CUDA (for your RTX 3050)...
  pip install torch --index-url https://download.pytorch.org/whl/cu124 || goto :err
  echo [setup] Installing dependencies...
  pip install -r requirements.txt || goto :err
) else (
  call venv\Scripts\activate.bat
)

REM ── Auto-create config with a random API token on first run ──────────────────
if not exist .env (
  echo [setup] Creating .env with a random API token...
  for /f %%i in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString('N')"') do set "TOK=%%i"
  (
    echo API_TOKEN=!TOK!
    echo MODEL_ID=Lykon/dreamshaper-8
    echo HOST=0.0.0.0
    echo PORT=7860
    echo # Optional: paste a GitHub token to enable GPT-4o smart prompts
    echo GITHUB_TOKEN=
  ) > .env
  echo.
  echo   Your API token is: !TOK!
  echo   ^(saved in .env — you'll paste this into Vercel later^)
  echo.
)

REM ── Load .env into the environment ───────────────────────────────────────────
for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do set "%%A=%%B"

echo.
echo [run] Starting image server on http://localhost:%PORT%
echo [run] First run downloads the model once (~2-5 GB). Ctrl+C to stop.
echo.
python server.py
goto :eof

:err
echo.
echo [error] Setup failed. Make sure Python 3.10-3.11 is installed and on PATH.
echo         Download: https://www.python.org/downloads/
pause
