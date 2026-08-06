@echo off
chcp 65001 >nul
title Simteks ERP — Güncelleme yayını
cd /d "%~dp0"

echo.
echo  ========================================
echo   Simteks ERP — Güncelleme yayını
echo   (tek adım: arayüz + EXE → Supabase)
echo  ========================================
echo.
echo  Sürüm numarası otomatik +1 artar (örn. 1.0.14 → 1.0.15).
echo  Detay: GUNCELLEME-UZAKTAN-OKU.txt
echo.

call npm run publish
if errorlevel 1 (
    echo.
    echo  [HATA] Yayın başarısız.
    echo  Kontrol: erp-update.config.js ve GUNCELLEME-UZAKTAN-OKU.txt
    pause
    exit /b 1
)

echo.
echo  Tamam. Fabrika PC uygulamayı açınca güncellemeyi görür.
pause
