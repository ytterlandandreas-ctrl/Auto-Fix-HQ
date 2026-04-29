@echo off
setlocal
title Auto Fix HQ - Update Database Schema
cd /d "%~dp0"
color 0E

echo.
echo  ===============================================
echo    UPDATE DATABASE SCHEMA
echo  ===============================================
echo.
echo  This pushes any schema changes in prisma/schema.prisma
echo  to your database (Neon).
echo.
echo  Press any key to continue, or close to abort.
pause >nul

echo.
echo  Generating Prisma client...
call npx prisma generate
echo.
echo  Pushing schema to database...
call npx prisma db push

echo.
echo  Done. Press any key to close.
pause >nul
endlocal
