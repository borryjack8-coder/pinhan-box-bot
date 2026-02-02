@echo off
title PINHAN BOX - LOCAL TEST MODE
color 0A

echo ========================================================
echo       PINHAN BOX CONCIERGE BOT - LOCAL TESTER
echo ========================================================
echo.
echo [INFO] Step 1: Checking and Installing Dependencies...
echo.

call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b %errorlevel%
)

echo.
echo [SUCCESS] Dependencies installed!
echo.
echo [INFO] Step 2: Starting the Bot...
echo [INFO] Go to Telegram and search for your bot to test.
echo.
echo ========================================================
echo       BOT IS RUNNING... (Press Ctrl+C to stop)
echo ========================================================
echo.

node index.js

echo.
echo [WARNING] The bot has stopped or crashed. See errors above.
pause
