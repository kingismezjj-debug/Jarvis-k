param([ValidateSet('Window','Verify','CompileOnly')][string]$Mode='Window')
$ErrorActionPreference='Stop'
$h12init=$null; $h12stage=5; $h12category=2; $h12exit=20
function Write-StartupReceipt([int]$Stage,[int]$Category) {
 if($null -eq $h12init){return}
 $h12frame=New-Object byte[] 96
 [Array]::Copy($h12init,$h12frame,56)
 $h12frame[3]=83; $h12frame[6]=[byte]$Stage; $h12frame[7]=[byte]$Category
 $h12stdout=[Console]::OpenStandardOutput()
 $h12stdout.Write($h12frame,0,96); $h12stdout.Flush()
}
try {
 if($Mode -eq 'Window') {
  $h12init=New-Object byte[] 96; $h12stdin=[Console]::OpenStandardInput(); $h12read=0
  while($h12read -lt 96){$h12n=$h12stdin.Read($h12init,$h12read,96-$h12read);if($h12n -eq 0){throw 'SAFE_BOOTSTRAP_EOF'};$h12read+=$h12n}
  Write-StartupReceipt 5 0
  $h12stage=6; $h12category=3; $h12exit=21; Write-StartupReceipt 6 0
 }
 Add-Type -Path (Join-Path $PSScriptRoot 'authorization-window-helper.cs') -ReferencedAssemblies System.Windows.Forms,System.Drawing,System.Core
 if($Mode -eq 'CompileOnly') { 'compile_pass'; exit 0 }
 if($Mode -eq 'Verify') { [RecoveryAuthorization.Harness]::Verify(); exit 0 }
 $h12stage=7; Write-StartupReceipt 7 0; $h12category=4; $h12exit=25
 $h12result=[RecoveryAuthorization.Harness]::Run($h12init)
 exit $h12result
} catch {
 try { Write-StartupReceipt $h12stage $h12category } catch {}
 exit $h12exit
}
