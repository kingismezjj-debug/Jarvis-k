!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Jarvis-K Alpha"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.jarvis-k.desktop.alpha"
!macroend
