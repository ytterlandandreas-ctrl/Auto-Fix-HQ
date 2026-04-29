@echo off
setlocal
title Auto Fix HQ - Local Server
cd /d "%~dp0"
color 0B

echo.
echo  ===============================================
echo    AUTO FIX HQ
echo    The shop OS built for the floor
echo  ===============================================
echo.

REM --- Check Node.js is installed ---
where node >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  ERROR: Node.js is not installed or not in PATH.
    echo.
    echo  Please install Node.js 20 or later from:
    echo    https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM --- Check .env exists ---
if not exist ".env" (
    color 0E
    echo  WARNING: No .env file found in this folder.
    echo  The app may fail to connect to the database.
    echo.
    echo  Create a .env file with at minimum:
    echo    DATABASE_URL=...
    echo    NEXTAUTH_SECRET=...
    echo    NEXTAUTH_URL=http://localhost:3000
    echo    NEXT_PUBLIC_APP_URL=http://localhost:3000
    echo.
    echo  Press any key to continue anyway, or close this window to abort.
    pause >nul
    color 0B
)

REM --- First-time setup: install dependencies ---
if not exist "node_modules\" (
    color 0E
    echo  First-time setup detected.
    echo  Installing dependencies. This can take 2-5 minutes...
    echo.
    call npm install
    if errorlevel 1 (
        color 0C
        echo.
        echo  ERROR: npm install failed. See messages above.
        pause
        exit /b 1
    )
    echo.
    echo  Dependencies installed.
    echo.
    color 0B
)

REM --- Always ensure Prisma client is up-to-date ---
if not exist "node_modules\.prisma\client\index.js" (
    color 0E
    echo  Generating database client...
    call npx prisma generate
    if errorlevel 1 (
        color 0C
        echo  ERROR: prisma generate failed. See messages above.
        pause
        exit /b 1
    )
    echo.
    color 0B
)

REM --- Schedule browser to open after server is ready ---
start "" /b cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:3000"

echo  Starting development server...
echo  The browser will open automatically in a few seconds.
echo.
echo  ----------------------------------------------
echo    Server URL:  http://localhost:3000
echo    To stop:     Press Ctrl+C, or close this window
echo  ----------------------------------------------
echo.

REM --- Start the dev server (blocks until stopped) ---
call npm run dev

REM --- After server stops ---
echo.
echo  Server stopped. Press any key to close this window.
pause >nul
endlocal
