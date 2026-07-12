@echo off
REM ============================================================
REM MyHelperElectron — Universal Startup Script
REM ============================================================
REM Запускает: Express Server + Telegram Bot (child) + Electron Client
REM Поддерживает: dev / prod режимы, проверку зависимостей, диагностику
REM ============================================================

setlocal enabledelayedexpansion

REM --- Конфигурация ---
set PROJECT_ROOT=%~dp0
set SERVER_DIR=%PROJECT_ROOT%HelperDesktop.server
set CLIENT_DIR=%PROJECT_ROOT%HelperDesktop.io
set BOT_DIR=%PROJECT_ROOT%HelperDesktop.telegram
set LOG_DIR=%PROJECT_ROOT%logs
set DB_FILE=%SERVER_DIR%helperdesktop.db
set MODE=prod

REM --- Цвета для вывода ---
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "RED=%ESC%[91m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "BLUE=%ESC%[94m"
set "CYAN=%ESC%[96m"
set "WHITE=%ESC%[97m"
set "GRAY=%ESC%[90m"
set "RESET=%ESC%[0m"
set "BOLD=%ESC%[1m"

REM --- Функции вывода ---
:log_info
echo %GREEN%[INFO]%RESET% %*
goto :eof

:log_warn
echo %YELLOW%[WARN]%RESET% %*
goto :eof

:log_error
echo %RED%[ERROR]%RESET% %*
goto :eof

:log_debug
echo %GRAY%[DEBUG]%RESET% %*
goto :eof

:log_step
echo.
echo %CYAN%%BOLD%=== %* ===%RESET%
goto :eof

:log_success
echo %GREEN%[OK]%RESET% %*
goto :eof

:log_fail
echo %RED%[FAIL]%RESET% %*
goto :eof

REM ============================================================
REM ПАРСИНГ АРГУМЕНТОВ
REM ============================================================
set SKIP_DEPS=false
set SKIP_DB_CHECK=false
set ONLY_SERVER=false
set ONLY_CLIENT=false
set VERBOSE=false

:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--prod" set MODE=prod
if /i "%~1"=="--dev" set MODE=dev
if /i "%~1"=="--skip-deps" set SKIP_DEPS=true
if /i "%~1"=="--skip-db-check" set SKIP_DB_CHECK=true
if /i "%~1"=="--only-server" set ONLY_SERVER=true
if /i "%~1"=="--only-client" set ONLY_CLIENT=true
if /i "%~1"=="--verbose" set VERBOSE=true
if /i "%~1"=="--help" goto :show_help
shift
goto :parse_args

:args_done

:show_help
echo.
echo %BOLD%MyHelperElectron Startup Script%RESET%
echo.
echo Usage: start.bat [options]
echo.
echo Options:
echo   --prod              Production mode (build + run)
echo   --dev               Development mode (watch + hot reload) [default]
echo   --skip-deps         Skip dependency installation check
echo   --skip-db-check     Skip database integrity check
echo   --only-server       Start only Express server + bot
echo   --only-client       Start only Electron client (requires running server)
echo   --verbose           Verbose output
echo   --help              Show this help
echo.
echo Examples:
echo   start.bat                    ^<-- dev mode, full stack
echo   start.bat --prod             ^<-- production build and run
echo   start.bat --only-server      ^<-- server only (for API testing)
echo   start.bat --only-client      ^<-- client only (server must be running)
echo.
exit /b 0

REM ============================================================
REM ПРОВЕРКА ОКРУЖЕНИЯ
REM ============================================================
call :log_step "Environment Check"

REM Node.js версия
node --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Node.js not found in PATH"
    echo Please install Node.js 20+ from https://nodejs.org/
    exit /b 1
)
for /f "tokens=2 delims=v" %%v in ('node --version') do set NODE_VER=%%v
for /f "tokens=1 delims=." %%m in ("%NODE_VER%") do set NODE_MAJOR=%%m
if %NODE_MAJOR% LSS 20 (
    call :log_warn "Node.js version %NODE_VER% < 20 (recommended 20+)"
) else (
    call :log_success "Node.js %NODE_VER%"
)

REM npm версия
npm --version >nul 2>&1
if errorlevel 1 (
    call :log_error "npm not found"
    exit /b 1
)
for /f %%v in ('npm --version') do call :log_success "npm %%v"

REM Проверка директорий
if not exist "%SERVER_DIR%package.json" (
    call :log_error "Server directory not found: %SERVER_DIR%"
    exit /b 1
)
if not exist "%CLIENT_DIR%package.json" (
    call :log_error "Client directory not found: %CLIENT_DIR%"
    exit /b 1
)
if not exist "%BOT_DIR%package.json" (
    call :log_warn "Bot directory not found: %BOT_DIR% (bot will not start)"
)

REM Создание папки логов
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1

REM ============================================================
РЕЖИМ PRODUCTION: СБОРКА
REM ============================================================
if /i "%MODE%"=="prod" (
    call :log_step "Production Build"
    
    REM Server build
    call :log_info "Building server..."
    cd /d "%SERVER_DIR%"
    if not exist "node_modules" (
        call :log_info "Installing server dependencies..."
        npm ci --prefer-offline --no-audit --no-fund 2>&1 | findstr /v /c:"npm notice" /c:"added" /c:"audit" /c:"fund"
        if errorlevel 1 call :log_fail "Server npm ci failed" & exit /b 1
    )
    npm run build 2>&1 | findstr /v /c:"npm notice"
    if errorlevel 1 call :log_fail "Server build failed" & exit /b 1
    call :log_success "Server built"
    
    REM Client build
    call :log_info "Building client..."
    cd /d "%CLIENT_DIR%"
    if not exist "node_modules" (
        call :log_info "Installing client dependencies..."
        npm ci --prefer-offline --no-audit --no-fund 2>&1 | findstr /v /c:"npm notice" /c:"added" /c:"audit" /c:"fund"
        if errorlevel 1 call :log_fail "Client npm ci failed" & exit /b 1
    )
    npm run make 2>&1 | findstr /v /c:"npm notice"
    if errorlevel 1 call :log_fail "Client build failed" & exit /b 1
    call :log_success "Client built"
    
    REM Bot build
    if exist "%BOT_DIR%package.json" (
        call :log_info "Building bot..."
        cd /d "%BOT_DIR%"
        if not exist "node_modules" npm ci --prefer-offline --no-audit --no-fund >nul 2>&1
        npm run build 2>&1 | findstr /v /c:"npm notice"
        if errorlevel 1 call :log_warn "Bot build failed (non-fatal)"
        else call :log_success "Bot built"
    )
    
    call :log_success "Production build complete"
    echo.
    echo Artifacts:
    echo   Server: %SERVER_DIR%dist\
    echo   Client: %CLIENT_DIR%out\make\
    echo   Bot:    %BOT_DIR%dist\
    echo.
)

REM ============================================================
ПРОВЕРКА ЗАВИСИМОСТЕЙ
REM ============================================================
if /i "%SKIP_DEPS%"=="true" goto :deps_done
if /i "%MODE%"=="prod" goto :deps_done

call :log_step "Dependency Check"

REM Server deps
cd /d "%SERVER_DIR%"
if not exist "node_modules" (
    call :log_info "Installing server dependencies..."
    npm ci --prefer-offline --no-audit --no-fund 2>&1 | findstr /v /c:"npm notice" /c:"added" /c:"audit" /c:"fund"
    if errorlevel 1 call :log_fail "Server npm ci failed" & exit /b 1
) else (
    call :log_debug "Server node_modules exists, skipping install"
)

REM Client deps
cd /d "%CLIENT_DIR%"
if not exist "node_modules" (
    call :log_info "Installing client dependencies..."
    npm ci --prefer-offline --no-audit --no-fund 2>&1 | findstr /v /c:"npm notice" /c:"added" /c:"audit" /c:"fund"
    if errorlevel 1 call :log_fail "Client npm ci failed" & exit /b 1
) else (
    call :log_debug "Client node_modules exists, skipping install"
)

REM Bot deps
if exist "%BOT_DIR%package.json" (
    cd /d "%BOT_DIR%"
    if not exist "node_modules" (
        call :log_info "Installing bot dependencies..."
        npm ci --prefer-offline --no-audit --no-fund 2>&1 | findstr /v /c:"npm notice" /c:"added" /c:"audit" /c:"fund"
        if errorlevel 1 call :log_warn "Bot npm ci failed (non-fatal)"
    )
)

call :log_success "Dependencies ready"

:deps_done

REM ============================================================
ПРОВЕРКА БАЗЫ ДАННЫХ
REM ============================================================
if /i "%SKIP_DB_CHECK%"=="false" (
    call :log_step "Database Check"
    
    if exist "%DB_FILE%" (
        call :log_debug "Database found: %DB_FILE%"
        REM Проверка целостности
        cd /d "%SERVER_DIR%"
        node -e "
            const Database = require('better-sqlite3');
            try {
                const db = new Database('%DB_FILE%');
                db.pragma('integrity_check');
                db.prepare('SELECT 1').get();
                console.log('OK');
                db.close();
            } catch(e) {
                console.error('DB ERROR:', e.message);
                process.exit(1);
            }
        " 2>&1 | findstr /v /c:"npm notice"
        if errorlevel 1 (
            call :log_error "Database integrity check failed"
            echo Attempting recovery...
            REM Бэкап и попытка восстановления через WAL
            copy "%DB_FILE%" "%DB_FILE%.corrupt.%DATE:~-4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%".bak >nul
            call :log_warn "Database backed up, server will recreate schema"
        ) else (
            call :log_success "Database OK"
        )
    ) else (
        call :log_info "Database not found, will be created on server start"
    )
)

REM ============================================================
ПРОВЕРКА КОНФИГУРАЦИИ
REM ============================================================
call :log_step "Configuration Check"

REM Bot config
if exist "%BOT_DIR%bot-config.json" (
    call :log_debug "bot-config.json exists"
    REM Проверка токена
    node -e "
        const fs = require('fs');
        const cfg = JSON.parse(fs.readFileSync('%BOT_DIR%bot-config.json', 'utf8'));
        if (!cfg.token || cfg.token.includes('YOUR_BOT_TOKEN')) {
            console.warn('WARN: Bot token not configured');
            process.exit(1);
        }
        console.log('OK');
    " 2>&1 | findstr /v /c:"npm notice"
    if errorlevel 1 call :log_warn "Bot token not configured in bot-config.json"
    else call :log_success "Bot config OK"
) else if exist "%BOT_DIR%bot-config.example.json" (
    call :log_warn "bot-config.json missing, copy from bot-config.example.json and add BOT_TOKEN"
) else (
    call :log_debug "Bot config not required (bot disabled)"
)

REM Server .env
if exist "%SERVER_DIR%.env" (
    call :log_debug "Server .env exists"
) else (
    call :log_debug "Server .env not found (using defaults)"
)

REM ============================================================
ЗАПУСК СЕРВЕРА
REM ============================================================
if /i "%ONLY_CLIENT%"=="false" (
    call :log_step "Starting Server"
    
    cd /d "%SERVER_DIR%"
    
    set SERVER_CMD=tsx watch src/index.ts
    set SERVER_LOG=%LOG_DIR%server.log
    set SERVER_ERR_LOG=%LOG_DIR%server.err.log
    
    if /i "%MODE%"=="prod" (
        set SERVER_CMD=node dist/HelperDesktop.server/src/index.js
        if not exist "dist/HelperDesktop.server/src/index.js" (
            call :log_error "Server not built. Run: start.bat --prod"
            exit /b 1
        )
    )
    
    call :log_info "Command: %SERVER_CMD%"
    call :log_info "Log: %SERVER_LOG%"
    call :log_info "Err: %SERVER_ERR_LOG%"
    
    REM Запуск сервера в фоне
    if /i "%VERBOSE%"=="true" (
        start "HelperDesktop Server" cmd /c "%SERVER_CMD% ^> \"%SERVER_LOG%\" 2^> \"%SERVER_ERR_LOG%\""
    ) else (
        start /b "" cmd /c "%SERVER_CMD% ^> \"%SERVER_LOG%\" 2^> \"%SERVER_ERR_LOG%\""
    )
    
    REM Ожидание готовности сервера
    call :log_info "Waiting for server to start..."
    set MAX_WAIT=30
    set WAITED=0
    :wait_server
    timeout /t 1 /nobreak >nul
    set /a WAITED+=1
    curl -s -f http://localhost:3001/api/health >nul 2>&1
    if errorlevel 1 (
        if %WAITED% GEQ %MAX_WAIT% (
            call :log_error "Server did not start within %MAX_WAIT% seconds"
            call :log_error "Check logs: %SERVER_LOG% / %SERVER_ERR_LOG%"
            type "%SERVER_ERR_LOG%" 2>nul
            exit /b 1
        )
        goto :wait_server
    )
    
    call :log_success "Server started on http://localhost:3001"
)

REM ============================================================
ЗАПУСК КЛИЕНТА
REM ============================================================
if /i "%ONLY_SERVER%"=="false" (
    call :log_step "Starting Client"
    
    cd /d "%CLIENT_DIR%"
    
    set CLIENT_CMD=npm run dev
    set CLIENT_LOG=%LOG_DIR%client.log
    
    if /i "%MODE%"=="prod" (
        set CLIENT_CMD=npm run start
    )
    
    call :log_info "Command: %CLIENT_CMD%"
    call :log_info "Log: %CLIENT_LOG%"
    
    if /i "%VERBOSE%"=="true" (
        start "HelperDesktop Client" cmd /c "%CLIENT_CMD% ^> \"%CLIENT_LOG%\" 2^>&1"
    ) else (
        start /b "" cmd /c "%CLIENT_CMD% ^> \"%CLIENT_LOG%\" 2^>&1"
    )
    
    call :log_success "Client started"
)

REM ============================================================
ИТОГ
REM ============================================================
call :log_step "Summary"
echo.
echo %BOLD%MyHelperElectron is running%RESET%
echo.
if /i "%ONLY_CLIENT%"=="false" (
    echo   Server:  http://localhost:3001
    echo   Health:  http://localhost:3001/api/health
    echo   API:     http://localhost:3001/api
    echo   WS:      ws://localhost:3001/ws
    echo   Logs:    %LOG_DIR%server.log / .err.log
)
if /i "%ONLY_SERVER%"=="false" (
    echo   Client:  Electron app (check taskbar)
    echo   Logs:    %LOG_DIR%client.log
)
echo.
echo Press Ctrl+C in server window to stop all processes.
echo.

REM В dev режиме держим скрипт живым для логов
if /i "%MODE%"=="dev" (
    if /i "%ONLY_SERVER%"=="true" (
        echo Tailing server log (Ctrl+C to exit)...
        timeout /t 2 /nobreak >nul
        type "%LOG_DIR%server.log" 2>nul
        powershell -Command "Get-Content '%LOG_DIR%server.log' -Wait -Tail 50"
    )
)

endlocal
exit /b 0