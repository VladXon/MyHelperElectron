@echo off
chcp 65001 >nul
cd /d "D:\repos\MyHelperElectron"

echo Starting MyHelperElectron dev environment...
echo.

REM Start server + bot in background
start "Server + Bot" cmd /k "cd /d D:\repos\MyHelperElectron\HelperDesktop.server && set NODE_OPTIONS=--max-old-space-size=4096 && npx tsx watch src/index.ts"

REM Wait for server to start
timeout /t 3 >nul

REM Start Electron app
cd /d D:\repos\MyHelperElectron\HelperDesktop.io
set NODE_OPTIONS=--max-old-space-size=8192
npx electron-forge start