@echo off
title Auto Fix HQ - Stop Server
color 0C

echo.
echo  Stopping any Auto Fix HQ servers running on port 3000...
echo.

REM Find and kill any process listening on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo  Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo  Done. Press any key to close.
pause >nul
