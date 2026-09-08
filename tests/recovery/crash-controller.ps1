# External manual-test controller. Never called by automated tests with terminate=true.
$ErrorActionPreference = 'Stop'
$held = @()
$executed = $false
try {
  $spec = [Console]::In.ReadToEnd() | ConvertFrom-Json
  if ($spec.entries.Count -lt 3 -or $spec.entries.Count -gt 32 -or $spec.budgetMs -le 0 -or $spec.budgetMs -gt 5000) { throw 'SAFE' }
  $watch = [Diagnostics.Stopwatch]::StartNew()
  $rows = @(Get-CimInstance Win32_Process)
  if (@($rows | Where-Object {$_.Name -ieq 'notepad.exe'}).Count -ne 0) { throw 'SAFE' }
  $ids = @($spec.entries | ForEach-Object { [int]$_.pid })
  foreach ($e in $spec.entries) {
    if ($e.nonce -cne $spec.nonce -or $e.role -notin @('desktop_main','core_host','renderer','utility')) { throw 'SAFE' }
    $r = @($rows | Where-Object {$_.ProcessId -eq $e.pid})
    if ($r.Count -ne 1 -or $r[0].ParentProcessId -ne $e.parent -or $r[0].CreationDate.ToUniversalTime().ToString('o') -cne $e.created -or $r[0].Name.ToLowerInvariant() -cne $e.executable) { throw 'SAFE' }
    if ($e.role -in @('desktop_main','core_host') -and -not $r[0].CommandLine.Contains('--jarvis-recovery-nonce=' + $spec.nonce)) { throw 'SAFE' }
    if ($e.role -ne 'desktop_main' -and $ids -notcontains [int]$e.parent) { throw 'SAFE' }
    $proc = [Diagnostics.Process]::GetProcessById([int]$e.pid)
    $null = $proc.Handle # Pin an OS process handle; later PID reuse cannot retarget termination.
    # CIM reports microseconds; compare at its precision after pinning the handle.
    if ($proc.HasExited -or $proc.StartTime.ToUniversalTime().ToString('yyyyMMddHHmmssffffff') -cne $r[0].CreationDate.ToUniversalTime().ToString('yyyyMMddHHmmssffffff')) { throw 'SAFE' }
    $held += [pscustomobject]@{ process=$proc; role=$e.role }
  }
  if (@($rows | Where-Object {$ids -contains [int]$_.ParentProcessId -and $ids -notcontains [int]$_.ProcessId}).Count -ne 0) { throw 'SAFE' }
  if ($watch.ElapsedMilliseconds -ge $spec.budgetMs) { throw 'SAFE' }
  if ($spec.terminate -eq $true) {
    # Main first: stop its supervisor before touching child handles. No tree/name kill.
    foreach ($item in @($held | Sort-Object @{Expression={if($_.role -eq 'desktop_main'){0}elseif($_.role -eq 'core_host'){1}else{2}}})) {
      if ($watch.ElapsedMilliseconds -ge $spec.budgetMs) { throw 'SAFE' }
      if (-not $item.process.HasExited) { $item.process.Kill(); $executed=$true }
    }
  }
  [Console]::Out.WriteLine((@{verified=$true;executed=$executed} | ConvertTo-Json -Compress))
} catch {
  [Console]::Out.WriteLine((@{verified=$false;executed=$executed} | ConvertTo-Json -Compress))
  exit 1
} finally { foreach ($item in $held) { $item.process.Dispose() } }
