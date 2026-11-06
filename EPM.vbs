' EPM - starts the server hidden (if it is not already running) and opens the app in its own window.
' Use:  EPM.vbs          -> server + app window
'       EPM.vbs server   -> server only (used for "start with Windows")
Option Explicit
Dim sh, fso, dir, up, h, args, pf, pf86, la, br, url
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
url = "http://localhost:3000"
up = False
On Error Resume Next
Set h = CreateObject("MSXML2.ServerXMLHTTP.6.0")
h.setTimeouts 800, 800, 800, 800
h.open "GET", url & "/", False
h.send
If Err.Number = 0 Then up = True
Err.Clear
On Error GoTo 0
If Not up Then
  Dim nd : nd = "node"
  If fso.FileExists(dir & "\runtime\node.exe") Then nd = """" & dir & "\runtime\node.exe"""
  sh.Run "cmd /c cd /d """ & dir & """ && " & nd & " server.js >> server.log 2>&1", 0, False
  WScript.Sleep 3500
End If
If WScript.Arguments.Count > 0 Then
  If LCase(WScript.Arguments(0)) = "server" Then WScript.Quit
End If
pf = sh.ExpandEnvironmentStrings("%ProgramFiles%")
pf86 = sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%")
la = sh.ExpandEnvironmentStrings("%LocalAppData%")
br = ""
If fso.FileExists(pf86 & "\Microsoft\Edge\Application\msedge.exe") Then br = pf86 & "\Microsoft\Edge\Application\msedge.exe"
If br = "" And fso.FileExists(pf & "\Microsoft\Edge\Application\msedge.exe") Then br = pf & "\Microsoft\Edge\Application\msedge.exe"
If br = "" And fso.FileExists(pf & "\Google\Chrome\Application\chrome.exe") Then br = pf & "\Google\Chrome\Application\chrome.exe"
If br = "" And fso.FileExists(pf86 & "\Google\Chrome\Application\chrome.exe") Then br = pf86 & "\Google\Chrome\Application\chrome.exe"
If br = "" And fso.FileExists(la & "\Google\Chrome\Application\chrome.exe") Then br = la & "\Google\Chrome\Application\chrome.exe"
If br <> "" Then
  sh.Run """" & br & """ --app=" & url, 1, False
Else
  sh.Run url, 1, False
End If
