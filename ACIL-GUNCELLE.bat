@echo off
chcp 65001 >nul
title Simteks ERP — Acil guncelleme (eski yama temizle + kur)
cd /d "%~dp0"

echo.
echo  ========================================
echo   ACIL GUNCELLEME
echo  ========================================
echo.
echo  1) Eski AppData yamasi silinecek
echo  2) Setup 1.0.14+ kurulacak
echo.
echo  Uygulamayi KAPATIN, sonra devam edin.
pause

set "CONTENT=%APPDATA%\tekstil-erp\content"
if exist "%CONTENT%" (
  echo  Siliniyor: %CONTENT%
  rmdir /s /q "%CONTENT%"
  echo  Tamam.
) else (
  echo  Eski yama yok — tamam.
)

echo.
echo  Setup araniyor...
set "SETUP="
for %%F in ("%~dp0dist\Simteks-Tekstil-ERP-Setup-*.exe") do set "SETUP=%%~fF"
if not defined SETUP (
  echo  [HATA] dist\ icinde Setup EXE yok.
  echo  Once: GUNCELLEME-YAYINLA.bat
  pause
  exit /b 1
)

echo  Kurulum: %SETUP%
start "" "%SETUP%"
echo.
echo  Kurulum penceresinde "Ileri / Install" deyin.
echo  Bitince uygulamayi acin — yama/EXE panelleri gorunmemeli.
pause
