@echo off
chcp 65001 >nul
cd /d "D:\repos\MyHelperElectron\HelperDesktop.io"
set ELECTRON_DISABLE_SECURITY_WARNINGS=1
npx vite build --config vite.main.config.ts --watch &
npx vite build --config vite.preload.config.ts --watch &
npx vite --config vite.renderer.config.ts