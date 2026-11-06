@echo off
cd /d "%~dp0"
echo Making a TEMPORARY public https link to your EPM server (no domain needed).
echo Keep start.bat running in another window. Look for the line with  https://....trycloudflare.com
echo Press Ctrl+C to stop sharing.
echo.
"%~dp0tools\cloudflared.exe" tunnel --url http://localhost:3000
pause
