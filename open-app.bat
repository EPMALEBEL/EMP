@echo off
rem Opens EPM in its own app window (no browser tabs). Start the server first (start.bat).
set URL=http://localhost:3000
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" ( start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=%URL% & exit /b )
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" ( start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=%URL% & exit /b )
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" ( start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app=%URL% & exit /b )
start "" %URL%
