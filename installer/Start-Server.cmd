@echo off
setlocal

title BattleTech Mercenary Manager
set "APP_DIR=%~dp0apps\campaign-manager"

if not exist "%APP_DIR%\package.json" (
    echo The campaign manager files were not found:
    echo %APP_DIR%
    echo.
    echo Extract the complete ZIP before running this file.
    pause
    exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo Node.js and npm are required.
    echo Install Node.js 22 LTS, then double-click this file again.
    pause
    exit /b 1
)

pushd "%APP_DIR%"
echo Installing dependencies...
call npm.cmd install
if errorlevel 1 goto install_failed

echo.
echo Starting BattleTech Mercenary Manager...
echo Open http://localhost:3000/ in a web browser.
echo Keep this window open while using the application.
echo Press Ctrl+C to stop the server.
echo.
call npm.cmd start
set "EXIT_CODE=%ERRORLEVEL%"
popd

if not "%EXIT_CODE%"=="0" (
    echo.
    echo npm start failed with exit code %EXIT_CODE%.
    pause
)

exit /b %EXIT_CODE%

:install_failed
popd
echo.
echo npm install failed.
pause
exit /b 1
