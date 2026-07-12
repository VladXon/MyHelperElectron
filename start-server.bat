@echo off
cd /d D:\repos\MyHelperElectron\HelperDesktop.server
set NODE_OPTIONS=--max-old-space-size=4096
npx tsx watch src/index.ts