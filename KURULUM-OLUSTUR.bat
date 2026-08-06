@echo off
chcp 65001 >nul
title Simteks Tekstil ERP — Kurulum dosyasi olustur
cd /d "%~dp0"

echo.
echo  Simteks Tekstil ERP — Windows kurulum dosyasi (.exe) olusturuluyor...
echo  Bu islem birkaç dakika surebilir.
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [HATA] Node.js bulunamadi. https://nodejs.org adresinden kurun.
    pause
    exit /b 1
)

if not exist "node_modules\electron" (
    echo node_modules yukleniyor...
    call npm install
    if errorlevel 1 (
        echo [HATA] npm install basarisiz.
        pause
        exit /b 1
    )
)

call npm run build:win
if errorlevel 1 (
    echo.
    echo [HATA] Derleme basarisiz.
    pause
    exit /b 1
)

if exist "dist\Simteks-Tekstil-ERP-Setup-1.0.2.exe" (
    if not exist "releases" mkdir releases
    copy /Y "dist\Simteks-Tekstil-ERP-Setup-1.0.2.exe" "releases\" >nul
    echo.
    echo  [TAMAM] Kurulum dosyasi hazir:
    echo  dist\Simteks-Tekstil-ERP-Setup-1.0.2.exe
    echo  releases\Simteks-Tekstil-ERP-Setup-1.0.2.exe
    echo.
    echo  Bu .exe dosyasini diger bilgisayarlara kopyalayip calistirin.
) else (
    echo [HATA] Kurulum dosyasi bulunamadi.
)

pause
