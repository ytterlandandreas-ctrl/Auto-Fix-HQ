Dim WshShell, scriptDir
Set WshShell = CreateObject("WScript.Shell")

' Resolve the folder this .vbs lives in
scriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

' Launch the dev server silently (no terminal window)
WshShell.Run "cmd /c """ & scriptDir & "Start Auto Fix HQ.bat""", 0, False

' Wait 8 seconds for the server to boot, then open the browser
WScript.Sleep 8000
WshShell.Run "http://localhost:3000"
