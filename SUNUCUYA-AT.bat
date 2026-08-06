@echo off
chcp 65001 >nul
cd /d "%~dp0.."
node scripts/paket-sunucu.js
echo.
echo ========================================
echo  HAZIR: sunucuya-at klasoru
echo  Icerigini hosting / Netlify / sunucuya yukleyin
echo ========================================
pause
