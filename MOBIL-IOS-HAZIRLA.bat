@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo  Simteks ERP — iOS uygulama
echo ========================================
echo.
echo Bu betik SADECE iOS icindir.
echo Android icin: MOBIL-ANDROID-HAZIRLA.bat
echo.
echo ONEMLI:
echo   IPA / App Store derlemesi Mac + Xcode ister.
echo   Bu Windows PC'de yalnizca ios\ proje iskeleti
echo   hazirlanir / guncellenir.
echo.
echo Mac'te ekstra: Xcode, CocoaPods (pod install)
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo HATA: Node.js bulunamadi.
  pause
  exit /b 1
)

echo [1/4] Ortak web paketi (public)...
node scripts\build-mobil-app.js
if errorlevel 1 (
  echo HATA: build-mobil-app.js basarisiz.
  pause
  exit /b 1
)

echo.
echo [2/4] npm install (mobile-app)...
pushd mobile-app
call npm install
if errorlevel 1 (
  popd
  echo HATA: npm install basarisiz.
  pause
  exit /b 1
)

if not exist ios (
  echo.
  echo [3/4] iOS platformi ekleniyor...
  call npx cap add ios
  if errorlevel 1 (
    popd
    echo HATA: cap add ios basarisiz.
    pause
    exit /b 1
  )
) else (
  echo.
  echo [3/4] ios\ klasoru var — atlandi.
)

echo.
echo [4/4] Yalnizca iOS sync...
call npx cap sync ios
if errorlevel 1 (
  popd
  echo HATA: cap sync ios basarisiz.
  pause
  exit /b 1
)
popd

echo.
echo ========================================
echo  iOS iskeleti hazir / guncellendi.
echo ========================================
echo.
echo Klasor:  %~dp0mobile-app\ios
echo.
echo Mac'te yapilacaklar:
echo   1) mobile-app klasorunu Mac'e kopyalayin
echo   2) cd mobile-app
echo   3) npm install
echo   4) npx cap sync ios
echo   5) cd ios\App ^&^& pod install
echo   6) npx cap open ios   (Xcode)
echo   7) Xcode: Product → Archive / Run (iPhone)
echo.
echo Detay: MOBIL-UYGULAMA-OKU.txt
echo.
pause
