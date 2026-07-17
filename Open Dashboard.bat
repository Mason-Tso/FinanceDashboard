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

REM Ensure a fast production build exists (avoids dev-mode lag).
if not exist ".next\BUILD_ID" (
  echo First-time setup: building the app ^(about 20-30 seconds, one time^)...
  call npm run build
)

echo Starting the dashboard server...
echo (A second window opens - you can minimize it. Close it to stop the dashboard.)
start "Finance Dashboard Server" cmd /k "npm run start"

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
