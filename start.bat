@echo off
cd /d "%~dp0"
set NODE=node
if exist "%~dp0runtime\node.exe" set NODE="%~dp0runtime\node.exe"
if "%NODE%"=="node" where node >nul 2>nul || (echo Node.js runtime not found. Keep the "runtime" folder next to this file. & pause & exit /b)
set EPM_LOOP=1
:run
%NODE% server.js
rem Exit code 75 = restart requested from the app (Settings - Server address & port)
if %errorlevel%==75 (
  echo.
  echo Restarting the EPM server...
  timeout /t 1 /nobreak >nul
  goto run
)
pause
