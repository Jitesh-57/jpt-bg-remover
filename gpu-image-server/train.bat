@echo off
REM =============================================================================
REM  Train Pixel Shine's watermark detector on your GPU.
REM  Usage:  drag a folder of clean (watermark-free) photos onto this file,
REM          or run:  train.bat D:\datasets\clean-photos
REM  Run start.bat once first (it creates the venv and installs everything).
REM  Takes a few hours on an RTX 3050; safe to stop with Ctrl+C and run again —
REM  it resumes from the last finished epoch.
REM =============================================================================
cd /d "%~dp0"
if "%~1"=="" (
  echo Usage: train.bat ^<folder of clean photos^>
  pause
  exit /b 1
)
if not exist venv (
  echo [error] Run start.bat once first to set up Python and the dependencies.
  pause
  exit /b 1
)
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
echo.
echo [preview] Writing 16 sample training images to synth-preview\ so you can check them...
python -m watermark.synth --images "%~1" --out synth-preview --count 16
echo.
echo [train] Starting. The best model is saved to weights\wm_detector.pt after each epoch.
python -m watermark.train --images "%~1" --resume --workers 2
echo.
echo [done] Restart start.bat so the server picks up the new model.
pause
