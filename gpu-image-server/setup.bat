@echo off
REM ── One-time setup for the JPT AI image server (Windows) ──────────────────────
REM Run this once from the gpu-image-server folder: setup.bat

echo Creating virtual environment...
python -m venv venv
call venv\Scripts\activate.bat

echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing PyTorch (CUDA 12.4 build for your RTX 3050)...
pip install torch --index-url https://download.pytorch.org/whl/cu124

echo Installing the rest of the requirements...
pip install -r requirements.txt

echo.
echo Done. Next steps:
echo   1) copy .env.example to .env and fill in API_TOKEN (and GITHUB_TOKEN).
echo   2) run:  run.bat
echo.
pause
