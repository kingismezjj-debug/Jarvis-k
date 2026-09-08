param([int]$OwnerProcessId)
$ErrorActionPreference='Stop'
try {
 Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class RecoveryConsoleIdentity {
 [DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow();
 [DllImport("kernel32.dll")] public static extern uint GetConsoleProcessList(uint[] list,uint count);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr window);
}
'@
 $members=New-Object uint[] 64
 $count=[RecoveryConsoleIdentity]::GetConsoleProcessList($members,64)
 $window=[RecoveryConsoleIdentity]::GetConsoleWindow()
 if($OwnerProcessId -gt 0 -and $count -gt 0 -and $count -le 64 -and
   $members -contains [uint32]$OwnerProcessId -and $members -contains [uint32]$PID -and
   $window -ne [IntPtr]::Zero -and [RecoveryConsoleIdentity]::IsWindowVisible($window) -and
   $window -eq [RecoveryConsoleIdentity]::GetForegroundWindow()) { 'verified' } else { 'unverified' }
} catch { 'unverified' }
