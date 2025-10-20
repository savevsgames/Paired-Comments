@echo off
REM Setup script for AI Training Demo (Windows)

echo Setting up AI Training Demo environment...
echo.

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo Setup complete!
echo.
echo Next steps:
echo    1. Activate environment: venv\Scripts\activate.bat
echo    2. Run data preparation: python src\data\prepare_datasets.py
echo    3. Review datasets in datasets\ folder
