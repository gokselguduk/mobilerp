@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo  Simteks ERP — Mobil uygulama (www)
echo ========================================
echo.

node scripts\build-mobil-app.js
if errorlevel 1 (
  echo.
  echo HATA: www paketi olusturulamadi.
  pause
  exit /b 1
)

echo.
echo Tamam. Cikti: mobile-app\public\
echo.
echo Sonraki adim (Android APK):
echo   1) MOBIL-APK-HAZIRLA.bat
echo   2) Android Studio ile acip APK uret
echo.
echo PWA (ana ekrana ekle):
echo   Telefon tarayicida mobil-erp.html ac → "Ana ekrana ekle"
echo.
pause
