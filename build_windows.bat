@echo off
REM Build Neural Clicker listener into a Windows executable.
REM Run this from the folder containing pc_listener.py.

python -m pip install --upgrade pip
pip install -r requirements.txt
pyinstaller --onefile --name NeuralClickerListener pc_listener.py

echo.
echo Build complete. Executable should be in: dist\NeuralClickerListener.exe
pause
