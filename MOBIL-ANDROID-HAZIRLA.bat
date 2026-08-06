@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo  Simteks ERP — ANDROID uygulama
echo ========================================
echo.
echo Bu betik SADECE Android icindir.
echo iOS icin: MOBIL-IOS-HAZIRLA.bat
echo.
echo Gereksinim: Android Studio + Android SDK
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

if not exist android (
  echo.
  echo [3/4] Android platformi ekleniyor...
  call npx cap add android
  if errorlevel 1 (
    popd
    echo HATA: cap add android basarisiz.
    pause
    exit /b 1
  )
) else (
  echo.
  echo [3/4] android\ klasoru var — atlandi.
)

echo.
echo [4/4] Yalnizca Android sync...
call npx cap sync android
if errorlevel 1 (
  popd
  echo HATA: cap sync android basarisiz.
  pause
  exit /b 1
)
popd

echo.
echo ========================================
echo  ANDROID hazir.
echo ========================================
echo.
echo Klasor:  %~dp0mobile-app\android
echo.
echo Android Studio:
echo   Build → Build Bundle(s) / APK(s) → Build APK(s)
echo.
echo APK ornek yol:
echo   mobile-app\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Detay: MOBIL-UYGULAMA-OKU.txt
echo.
set /p OPENSTUDIO="Android Studio acilsin mi? (E/H): "
if /i "%OPENSTUDIO%"=="E" (
  pushd mobile-app
  call npx cap open android
  popd
)
pause
