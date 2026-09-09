# Private test-only handle backend. Only prevalidated pinned handles can be signalled.
$ErrorActionPreference = 'Stop'
$held = @()
$protectedHandle = $null
$ownerHandle = $null
$category = 'unexpected_controller_error'
$startupComplete=$false
$startupCounts=@{}
foreach($role in @('main','corehost','renderer','utility')) {$startupCounts[$role]=@{identityVerified=0;handleOpened=0;handleError=0;identityUnavailable=0}}
$currentRole=$null
function Reply($value) { [Console]::Out.WriteLine((@{ok=$true;value=$value} | ConvertTo-Json -Compress -Depth 8)) }
function Reject($name) { [Console]::Out.WriteLine((@{ok=$false;category=$name} | ConvertTo-Json -Compress)) }
function Identity($row,$expected) {
 return $null -ne $row -and $row.ProcessId -eq $expected.pid -and $row.ParentProcessId -eq $expected.parent -and $row.CreationDate.ToUniversalTime().ToString('o') -ceq $expected.created -and $row.Name.ToLowerInvariant() -ceq $expected.executable -and $row.SessionId -eq [Diagnostics.Process]::GetCurrentProcess().SessionId
}
try {
 $spec = [Console]::In.ReadLine() | ConvertFrom-Json
 $category = 'target_set_incomplete'
 if ($spec.mode -notin @('B','controller_selftest') -or $spec.owner -cnotmatch '^[a-f0-9]{32}$' -or $spec.entries.Count -lt 1 -or $spec.entries.Count -gt 32) { throw 'SAFE' }
 $rows = @(Get-CimInstance Win32_Process)
 $self=@($rows | Where-Object {$_.ProcessId -eq $PID})
 if($self.Count -ne 1 -or $self[0].ParentProcessId -ne $spec.parent.pid){throw 'SAFE'}
 $ids = @($spec.entries | ForEach-Object {[int]$_.pid})
 if (@($ids | Select-Object -Unique).Count -ne $ids.Count -or $ids -contains [int]$spec.parent.pid -or $ids -contains [int]$spec.sentinel.pid -or $ids -contains $PID) {throw 'SAFE'}
 if (@($rows | Where-Object {$_.Name -ieq 'notepad.exe'}).Count -ne 0) {throw 'SAFE'}
 $category = 'pre_kill_identity_failed'
 foreach ($e in $spec.entries) {
  $currentRole=if($e.role -in @('main','corehost','renderer','utility')){$e.role}else{$null}
  $r = @($rows | Where-Object {$_.ProcessId -eq $e.pid})
  if ($e.role -notin @('main','corehost','renderer','utility') -or $r.Count -ne 1 -or -not (Identity $r[0] $e)) {throw 'SAFE'}
  if ($spec.mode -eq 'B') {
   if ($e.executable -notin @('electron.exe','node.exe') -or ($e.role -ne 'main' -and $ids -notcontains [int]$e.parent)) {throw 'SAFE'}
   if ($e.role -in @('main','corehost') -and -not $r[0].CommandLine.Contains('--jarvis-recovery-nonce='+$spec.owner)) {throw 'SAFE'}
  } else {
   if ($e.executable -cne 'node.exe' -or $e.parent -ne $spec.parent.pid -or -not $r[0].CommandLine.Contains($spec.worker) -or -not $r[0].CommandLine.Contains('--controller-sacrificial='+$spec.owner)) {throw 'SAFE'}
  }
  $startupCounts[$e.role].identityVerified++
 }
 if (@($rows | Where-Object {$ids -contains [int]$_.ParentProcessId -and $ids -notcontains [int]$_.ProcessId}).Count -ne 0) {throw 'SAFE'}
 $category='handle_open_failed'
 foreach ($e in $spec.entries) {
  $currentRole=$e.role
  $proc=[Diagnostics.Process]::GetProcessById([int]$e.pid);$null=$proc.Handle
  $held += [pscustomobject]@{process=$proc;entry=$e}
  if ($proc.HasExited -or $proc.StartTime.ToUniversalTime().ToString('yyyyMMddHHmmssffffff') -cne ([DateTime]::Parse($e.created)).ToUniversalTime().ToString('yyyyMMddHHmmssffffff')) {throw 'SAFE'}
  $startupCounts[$e.role].handleOpened++
 }
 $category = 'protected_baseline_failed'
 $pr=@($rows | Where-Object {$_.ProcessId -eq $spec.parent.pid});$sr=@($rows | Where-Object {$_.ProcessId -eq $spec.sentinel.pid})
 if ($pr.Count -ne 1 -or $sr.Count -ne 1 -or -not (Identity $pr[0] $spec.parent) -or -not (Identity $sr[0] $spec.sentinel) -or -not $sr[0].CommandLine.Contains('--controller-sentinel='+$spec.owner) -or -not $sr[0].CommandLine.Contains($spec.worker)) {throw 'SAFE'}
 $ownerHandle=[Diagnostics.Process]::GetProcessById([int]$spec.parent.pid);$null=$ownerHandle.Handle
 $protectedHandle=[Diagnostics.Process]::GetProcessById([int]$spec.sentinel.pid);$null=$protectedHandle.Handle
 if($ownerHandle.HasExited -or $protectedHandle.HasExited -or $ownerHandle.StartTime.ToUniversalTime().ToString('yyyyMMddHHmmssffffff') -cne ([DateTime]::Parse($spec.parent.created)).ToUniversalTime().ToString('yyyyMMddHHmmssffffff') -or $protectedHandle.StartTime.ToUniversalTime().ToString('yyyyMMddHHmmssffffff') -cne ([DateTime]::Parse($spec.sentinel.created)).ToUniversalTime().ToString('yyyyMMddHHmmssffffff')){throw 'SAFE'}
 $startupComplete=$true
 Reply @{identityVerified=$true;handlesOpened=$true;protectedVerified=$true}
 while ($null -ne ($line=[Console]::In.ReadLine())) {
  try {
   $q=$line | ConvertFrom-Json
   if ($q.op -eq 'close') { break }
   if ($q.op -in @('state','kill','wait')) {
    if ($q.token -lt 0 -or $q.token -ge $held.Count) {Reject 'target_set_incomplete';continue}
    $pinned=$held[[int]$q.token].process
    $category='handle_state_failed'
    if ($q.op -eq 'state') {Reply ([bool]$pinned.HasExited)}
    elseif ($q.op -eq 'kill') {
     if ($pinned.HasExited) {Reply 'already_exited'} else {
      $category='kill_call_failed'
      try {$pinned.Kill();Reply 'returned'} catch {if ($pinned.HasExited) {Reply 'already_exited'} else {throw}}
     }
    } else {
     if ($q.ms -le 0 -or $q.ms -gt 2000) {Reject 'controller_budget_exhausted';continue}
     Reply ([bool]$pinned.WaitForExit([int]$q.ms))
    }
   } elseif ($q.op -eq 'descendants') {
    $category='descendant_query_failed';$after=@(Get-CimInstance Win32_Process);$residual=@();$desc=0
    for ($i=0;$i -lt $held.Count;$i++) {if (-not $held[$i].process.HasExited) {$residual+= $i}}
    # Numeric parent is a conservative POSTCHECK only, never a termination target.
    foreach($a in $after) {if ($ids -contains [int]$a.ParentProcessId -and $ids -notcontains [int]$a.ProcessId) {$desc++}}
    Reply @{residualTokens=@($residual);descendants=$desc}
   } elseif ($q.op -eq 'protected') {
    $category='protected_process_missing';$after=@(Get-CimInstance Win32_Process)
    $pr=@($after | Where-Object {$_.ProcessId -eq $spec.parent.pid});$sr=@($after | Where-Object {$_.ProcessId -eq $spec.sentinel.pid})
    Reply ([bool](-not $ownerHandle.HasExited -and -not $protectedHandle.HasExited -and $pr.Count -eq 1 -and $sr.Count -eq 1 -and (Identity $pr[0] $spec.parent) -and (Identity $sr[0] $spec.sentinel)))
   } else {Reject 'unexpected_controller_error'}
  } catch {Reject $category}
 }
} catch {
 if(-not $startupComplete){
  if($currentRole -and $category -eq 'handle_open_failed'){$startupCounts[$currentRole].handleError++}
  if($currentRole -and $category -eq 'pre_kill_identity_failed'){$startupCounts[$currentRole].identityUnavailable++}
  [Console]::Out.WriteLine((@{ok=$false;category=$category;startupCounts=$startupCounts}|ConvertTo-Json -Compress -Depth 8))
 }else{Reject $category}
} finally {
 foreach($item in $held) {$item.process.Dispose()}
 if ($protectedHandle) {$protectedHandle.Dispose()};if ($ownerHandle) {$ownerHandle.Dispose()}
}
