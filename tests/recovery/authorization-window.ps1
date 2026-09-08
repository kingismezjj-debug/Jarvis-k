param([ValidateSet('Window','Verify','CompileOnly')][string]$Mode='Window')
$ErrorActionPreference='Stop'
try {
 Add-Type -Path (Join-Path $PSScriptRoot 'authorization-window-helper.cs') -ReferencedAssemblies System.Windows.Forms,System.Drawing,System.Core
 if($Mode -eq 'CompileOnly') { 'compile_pass'; exit 0 }
 if($Mode -eq 'Verify') { [RecoveryAuthorization.Harness]::Verify(); exit 0 }
 [RecoveryAuthorization.Harness]::Run()
} catch { exit 17 }
