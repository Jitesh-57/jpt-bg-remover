@echo off
rem Double-click to install (first time) and start LaunchPilot on Windows.
setlocal
cd /d "%~dp0"
title LaunchPilot

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Opening the download page...
  echo Install the LTS version, then double-click this file again.
  start "" https://nodejs.org/en/download
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing LaunchPilot. This takes a minute the first time...
  call npm.cmd install --no-audit --no-fund || goto :failed
  call npm.cmd run browser:install || goto :failed
)

if not exist .env (
  copy .env.example .env >nul
  echo.
  echo Paste your Anthropic API key after ANTHROPIC_API_KEY= in the file that opens,
  echo then save and close Notepad. Get a key at https://console.anthropic.com
  notepad .env
)

echo Starting LaunchPilot. Keep this window open while you use it.
rem Open the dashboard a few seconds later, once the server is up.
start "" /min cmd /c "timeout /t 4 /nobreak >nul & start "" http://127.0.0.1:4310"
call npm.cmd start
pause
exit /b 0

:failed
echo.
echo Setup failed. Check your internet connection and try again.
pause
exit /b 1
