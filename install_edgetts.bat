@echo off
echo Installing Microsoft Edge TTS...
echo.

:: Check if Python is installed
python --version > nul 2>&1
if %errorlevel% neq 0 (
  echo Python is not installed. Please install Python 3.8 or higher.
  exit /b 1
)

:: Install edge-tts via pip
echo Installing edge-tts using pip (Python package manager)...
pip install edge-tts

:: Verify installation
echo.
echo Verifying installation...
python -m edge_tts --version

echo.
echo Edge TTS installed successfully!
echo.
echo You can now use Edge TTS in your AI Human Teacher application.
echo Edge TTS provides high-quality text-to-speech capabilities with many voices.
echo.
pause 