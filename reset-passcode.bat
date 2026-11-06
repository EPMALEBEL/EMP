@echo off
cd /d "%~dp0"
set NODE=node
if exist "%~dp0runtime\node.exe" set NODE="%~dp0runtime\node.exe"
echo STOP the server (close the start.bat window) before using this.
echo.
set /p EM=User ID (e-mail) [epm@admin.com]: 
if "%EM%"=="" set EM=epm@admin.com
set /p PW=New passcode (at least 8 characters): 
%NODE% reset-passcode.js "%EM%" "%PW%"
pause
