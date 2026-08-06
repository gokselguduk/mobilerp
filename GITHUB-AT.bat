@echo off
chcp 65001 >nul
cd /d "%~dp0"
node scripts/paket-github.js
if errorlevel 1 (
  echo Paket olusturulamadi.
  pause
  exit /b 1
)
echo.
echo ========================================
echo  HAZIR: github-at
echo.
echo  GitHub WEB: klasorun ICINDEKilerini
echo  secip surukleyin (max 100 dosya).
echo.
echo  Hata alirsaniz GitHub Desktop kullanin:
echo  File - Add local repository - github-at
echo ========================================
explorer "%~dp0github-at"
pause
