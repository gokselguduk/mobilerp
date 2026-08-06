@echo off
chcp 65001 >nul
cd /d "%~dp0.."
node scripts/paket-sunucu.js mobil
echo.
echo ========================================
echo  HAZIR: sunucuya-at-mobil klasoru
echo  Sadece mobil ERP — bunu sunucuya yukleyin
echo  Adres: .../mobil-erp.html
echo ========================================
pause
