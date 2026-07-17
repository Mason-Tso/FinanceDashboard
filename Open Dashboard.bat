@echo off
title Finance Dashboard Launcher
cd /d "%~dp0"

echo ================================================
echo   Finance Dashboard
echo ================================================
echo.

REM If something is already listening on port 3000, the server is up.
netstat -ano | findstr "LISTENING" | findstr /C:":3000 " >nul 2>&1
if %errorlevel%==0 (
  echo Dashboard is already running. Opening Chrome...
  goto openbrowser
)

echo Starting the dashboard server...
echo (A second window will open - you can minimize it. Close it to stop the dashboard.)
start "Finance Dashboard Server" cmd /k "npm run dev"

echo.
echo Waiting for the dashboard to be ready...
:waitloop
timeout /t 1 /nobreak >nul
netstat -ano | findstr "LISTENING" | findstr /C:":3000 " >nul 2>&1
if not %errorlevel%==0 goto waitloop

:openbrowser
start chrome "http://localhost:3000"
echo.
echo Done! Your dashboard should now be open in Chrome.
timeout /t 3 /nobreak >nul
exit
