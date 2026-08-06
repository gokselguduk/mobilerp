@echo off
chcp 65001 >nul
cd /d "%~dp0"
REM Eski ad → Android betigine yonlendir
echo MOBIL-APK-HAZIRLA.bat artik MOBIL-ANDROID-HAZIRLA.bat olarak ayrildi.
echo.
call "%~dp0MOBIL-ANDROID-HAZIRLA.bat"
