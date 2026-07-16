@echo off
REM ── Start the JPT AI image server (Windows) ───────────────────────────────────
REM Run from the gpu-image-server folder: run.bat

call venv\Scripts\activate.bat

REM Load variables from .env if present (simple KEY=VALUE lines).
if exist .env (
  for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if not "%%A"=="" if not "%%A:~0,1"=="#" set "%%A=%%B"
  )
)

echo Starting image server on http://localhost:%PORT%  (Ctrl+C to stop)
python server.py
pause
