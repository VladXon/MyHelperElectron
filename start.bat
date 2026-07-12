@echo off
setlocal enabledelayedexpansion

set PROJECT_ROOT=%~dp0
set SERVER_DIR=%PROJECT_ROOT%HelperDesktop.server
set CLIENT_DIR=%PROJECT_ROOT%HelperDesktop.io
set BOT_DIR=%PROJECT_ROOT%HelperDesktop.telegram
set MODE=prod
set SKIP_DEPS=false
set SKIP_DB_CHECK=false
set ONLY_SERVER=false
set ONLY_CLIENT=false

:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--prod" set MODE=prod
if /i "%~1"=="--dev" set MODE=dev
if /i "%~1"=="--skip-deps" set SKIP_DEPS=true
if /i "%~1"=="--skip-db-check" set SKIP_DB_CHECK=true
if /i "%~1"=="--only-server" set ONLY_SERVER=true
if /i "%~1"=="--only-client" set ONLY_CLIENT=true
if /i "%~1"=="--help" goto :show_help
if /i "%~1"=="-h" goto :show_help
shift
goto :parse_args

:args_done

echo.
echo ========================================
echo   MyHelperElectron Startup
echo   Mode: %MODE%
echo ========================================
echo.

REM --- Check Node.js ---
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org/
    goto :fail
)
for /f "tokens=*" %%v in ('node -p "process.version"') do set NODE_VER=%%v
echo [OK] Node.js %NODE_VER%

REM --- Check directories ---
if not exist "%SERVER_DIR%\package.json" (
    echo [ERROR] Server not found at %SERVER_DIR%
    goto :fail
)
if not exist "%CLIENT_DIR%\package.json" (
    echo [ERROR] Client not found at %CLIENT_DIR%
    goto :fail
)

REM --- Install deps in dev mode ---
if /i "%SKIP_DEPS%"=="false" (
    if /i "%MODE%"=="dev" (
        echo.
        echo --- Dependency Check ---
        if not exist "%SERVER_DIR%\node_modules" (
            echo Installing server deps...
            cd /d "%SERVER_DIR%" && call npm ci --prefer-offline --no-audit --no-fund
        )
        if not exist "%CLIENT_DIR%\node_modules" (
            echo Installing client deps...
            cd /d "%CLIENT_DIR%" && call npm ci --prefer-offline --no-audit --no-fund
        )
        echo [OK] Dependencies ready
    )
)

echo.
echo ========================================
echo   Starting services...
echo ========================================

REM === START SERVER ===
if /i "%ONLY_CLIENT%"=="false" (
    if /i "%MODE%"=="dev" (
        start "Server [DEV]" /D "%SERVER_DIR%" cmd /k "title HelperDesktop Server [DEV] && color 0B && echo Starting server in DEV mode... && npx tsx watch src/index.ts"
    ) else (
        start "Server [PROD]" /D "%SERVER_DIR%" cmd /k "title HelperDesktop Server [PROD] && color 0A && echo Starting server in PROD mode... && npx tsx src/index.ts"
    )
    echo [OK] Server window opened
)

REM === START CLIENT ===
if /i "%ONLY_SERVER%"=="false" (
    if /i "%MODE%"=="dev" (
        start "Client [DEV]" /D "%CLIENT_DIR%" cmd /k "title HelperDesktop Client [DEV] && color 0E && echo Starting client in DEV mode... && npm run dev"
    ) else (
        start "Client [PROD]" /D "%CLIENT_DIR%" cmd /k "title HelperDesktop Client [PROD] && color 0A && echo Starting client in PROD mode... && npm run start"
    )
    echo [OK] Client window opened
)

echo.
echo ========================================
echo   MyHelperElectron is starting!
echo ========================================
echo.
if /i "%ONLY_CLIENT%"=="false" (
    echo   Server: http://localhost:3001
)
if /i "%ONLY_SERVER%"=="false" (
    echo   Client: Electron app
)
echo.
echo   Close server/client windows to stop.
echo.
pause
exit /b 0

:fail
echo.
pause
exit /b 1

:show_help
echo.
echo MyHelperElectron Startup Script
echo.
echo Usage: start.bat [options]
echo.
echo   --prod        Production mode [default]
echo   --dev         Development mode (watch + hot reload)
echo   --skip-deps   Skip dependency install
echo   --only-server Start server only
echo   --only-client Start client only
echo   --help        Show this help
echo.
pause
exit /b 0
