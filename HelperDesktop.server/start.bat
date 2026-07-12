@echo off
cd /d "%~dp0"
echo Starting server with auto-restart...
call npx tsx watch src/index.ts
pause
