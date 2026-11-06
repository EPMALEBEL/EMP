@echo off
rem Removes the Desktop icon and the start-with-Windows entry. Your data is not touched.
powershell -NoProfile -Command "$s=New-Object -ComObject WScript.Shell; Remove-Item ([Environment]::GetFolderPath('Desktop')+'\EPM.lnk') -ErrorAction SilentlyContinue; Remove-Item ([Environment]::GetFolderPath('Startup')+'\EPM server.lnk') -ErrorAction SilentlyContinue"
echo Removed. To stop a running server: Task Manager -> Details -> node.exe -> End task.
pause
