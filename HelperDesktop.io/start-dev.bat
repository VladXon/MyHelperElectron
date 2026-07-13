@echo off
chcp 65001 >nul
cd /d "D:\repos\MyHelperElectron\HelperDesktop.io"

set NODE_OPTIONS=--max-old-space-size=8192
set ELECTRON_FORGE_START_OPTS=--max-old-space-size=8192

npx electron-forge start