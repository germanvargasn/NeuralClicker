@echo off
setlocal
REM Build Neural Clicker listener into a Windows executable.
REM Run this from the folder containing pc_listener.py.

python -m pip install --upgrade pip
python -m pip install -r requirements.txt

REM Calling PyInstaller through Python avoids PATH issues where
REM the pyinstaller command is installed but not discoverable.
python -m PyInstaller --onefile --name NeuralClickerListener pc_listener.py

if exist "dist\NeuralClickerListener.exe" (
    echo.
    echo Build complete. Executable created at: dist\NeuralClickerListener.exe
) else (
    echo.
    echo Build did not create the expected executable.
    echo Try running: python -m PyInstaller --onefile --name NeuralClickerListener pc_listener.py
)

pause
