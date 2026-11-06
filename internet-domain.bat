@echo off
cd /d "%~dp0"
echo ============================================================
echo  EPM on YOUR OWN DOMAIN (Cloudflare Tunnel) - read DOMAIN-SETUP.txt first
echo ============================================================
echo.
set /p TOKEN=Paste your Cloudflare tunnel token and press Enter: 
if "%TOKEN%"=="" (echo No token. & pause & exit /b)
echo.
echo 1 = Run now (this window must stay open)
echo 2 = Install as a Windows service (starts automatically with Windows, needs "Run as administrator")
set /p CH=Choose 1 or 2: 
if "%CH%"=="2" ("%~dp0tools\cloudflared.exe" service install %TOKEN% & pause & exit /b)
"%~dp0tools\cloudflared.exe" tunnel run --token %TOKEN%
pause
