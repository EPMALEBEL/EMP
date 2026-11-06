@echo off
rem One-time: puts an "EPM" icon on the Desktop and starts the server automatically when you sign in to Windows.
cd /d "%~dp0"
if not exist "%~dp0runtime\node.exe" where node >nul 2>nul || (echo Node.js is not installed. Download it from https://nodejs.org and run this again. & pause & exit /b)
set "HERE=%~dp0"
powershell -NoProfile -Command "$s=New-Object -ComObject WScript.Shell; $d=[Environment]::GetFolderPath('Desktop'); $l=$s.CreateShortcut($d+'\EPM.lnk'); $l.TargetPath='wscript.exe'; $l.Arguments='\"'+$env:HERE+'EPM.vbs\"'; $l.WorkingDirectory=$env:HERE; $l.IconLocation=$env:HERE+'public\favicon.ico'; $l.Description='Engineering Project Manager'; $l.Save(); $st=[Environment]::GetFolderPath('Startup'); $k=$s.CreateShortcut($st+'\EPM server.lnk'); $k.TargetPath='wscript.exe'; $k.Arguments='\"'+$env:HERE+'EPM.vbs\" server'; $k.WorkingDirectory=$env:HERE; $k.WindowStyle=7; $k.Save()"
echo.
echo Done.
echo  - Desktop icon "EPM": double-click to open the app in its own window (the server starts by itself, no black window).
echo  - The server now also starts automatically when you sign in to Windows.
echo.
echo IMPORTANT (first time only): the administrator passcode is written in the file server.log in this folder.
echo Open it with Notepad, sign in, then change the passcode.
echo.
pause
