// TEST ONLY supervisor: captured ChildProcess object, never kill by process name.
import path from 'node:path';
import { spawn } from 'node:child_process';
let live = 0;
export const liveHelpers = () => live;
const categories = new Set(['completed','cancelled','timed_out','protocol_rejected','identity_untrusted','root_rejected','entry_rejected','path_limit','entry_limit','directory_limit','payload_rejected','internal_unavailable','architecture_unavailable']);
const architectures = new Set(['arm64_native','x64_native','x64_on_arm64_emulation','unknown']);
const points = new Set(['before_enumeration','after_root_open','before_child_open','after_child_open','during_enumeration','after_result','uncooperative','stuck']);
const keys = (x, names) => x && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).sort().join() === names.split(' ').sort().join();
const counts = x => keys(x,'scannedEntries visitedDirectories openHandles peakHandles') && Object.entries(x).every(([k,v]) => Number.isInteger(v) && v >= 0 && v <= ({scannedEntries:2000,visitedDirectories:256,openHandles:6,peakHandles:6}[k]));
export function safeMessage(m) {
  if (m?.kind === 'ready') return keys(m,'kind classification') && architectures.has(m.classification);
  if (m?.kind === 'checkpoint') return keys(m,'kind classification counts') && points.has(m.classification) && counts(m.counts);
  if (m?.kind !== 'result' || !keys(m,'kind classification architecture matches truncated counts') || !categories.has(m.classification) || !architectures.has(m.architecture) || !counts(m.counts) || m.counts.openHandles !== 0 || typeof m.truncated !== 'boolean' || !Array.isArray(m.matches) || m.matches.length > 20) return false;
  if (m.classification !== 'completed' && (m.matches.length || m.truncated)) return false;
  let previous;
  for (const r of m.matches) {
    if (!keys(r,'name relativePath entryType') || !['file','directory'].includes(r.entryType) || typeof r.name !== 'string' || typeof r.relativePath !== 'string' || !r.name.length || r.name.length>255 || r.relativePath.length>512 || /[\x00-\x1f\x7f-\x9f:\\]/u.test(r.relativePath) || /[\/\\:]/u.test(r.name) || r.relativePath.split('/').some(s=>!s||s==='.'||s==='..') || r.relativePath.split('/').at(-1)!==r.name || (previous!==undefined && previous>=r.relativePath)) return false;
    previous=r.relativePath;
  }
  return Buffer.byteLength(JSON.stringify(m)) <= 16384;
}
export function runHelper(executable, fixtureBase, request, options={}) {
  if(live) throw new Error('HELPER_ALREADY_ACTIVE');
  if(options.preCancelled) return Promise.resolve({classification:'cancelled',helperExited:true,spawned:false,activeHelpers:0,matches:[]});
  live++;
  return new Promise(resolve=>{
    let closed=false, reason, staged, ready='unknown', forced=false, buffer='', messages=0, grace, timer, resultSeen=false, overflow=false, readySeen=false;
    const nativeHost=executable.endsWith('-anycpu.exe');
    const program=nativeHost?path.join(process.env.SystemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe'):executable;
    // Fixed CLR loader, not a shell search or policy change. Captured host IS the helper process.
    const loader="try { if ([Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture.ToString() -ne 'Arm64') { exit 9 }; $null=[Reflection.Assembly]::LoadFile($env:SPIKE_HELPER).EntryPoint.Invoke($null,@()) } catch { [Console]::WriteLine('{\"kind\":\"failure\",\"classification\":\"internal_unavailable\"}'); exit 8 }";
    const args=nativeHost?['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(loader,'utf16le').toString('base64')]:[];
    const child=spawn(program,args,{cwd:fixtureBase,env:{SystemRoot:process.env.SystemRoot,TEMP:fixtureBase,TMP:fixtureBase,SPIKE_FIXTURE:fixtureBase,SPIKE_HELPER:executable},stdio:['pipe','pipe','pipe'],windowsHide:true});
    const cancel=(why='cancelled')=>{if(closed||reason)return;reason=why;staged=undefined;child.stdin.write('cancel\n',()=>{});grace=setTimeout(()=>{if(!closed){forced=true;child.kill('SIGKILL');}},100);};
    const control={cancel,continue:()=>{if(!closed&&!reason)child.stdin.write('continue\n',()=>{});}};
    child.stdin.on('error',()=>{});
    child.on('error',()=>cancel('helper_failed'));
    child.stderr.on('data',()=>cancel('protocol_rejected'));
    child.stdout.setEncoding('utf8');
    child.stdout.on('data',chunk=>{
      if(overflow)return;
      buffer+=chunk;
      if(Buffer.byteLength(buffer)>32768){overflow=true;buffer='';child.stdout.pause();cancel('protocol_rejected');return;}
      let at;
      while((at=buffer.indexOf('\n'))>=0){
        const line=buffer.slice(0,at).replace(/\r$/u,'');buffer=buffer.slice(at+1);
        let m;try{m=JSON.parse(line);}catch{cancel('protocol_rejected');continue;}
        if(++messages>10000||!safeMessage(m)||resultSeen){cancel('protocol_rejected');continue;}
        if(m.kind==='ready'){if(readySeen){cancel('protocol_rejected');continue;}readySeen=true;ready=m.classification;}
        if(m.kind==='checkpoint'&&!readySeen){cancel('protocol_rejected');continue;}
        if(m.kind==='result'&&readySeen&&m.architecture!==ready){cancel('protocol_rejected');continue;}
        if(m.kind==='checkpoint'&&!reason)Promise.resolve(options.onCheckpoint?options.onCheckpoint(m,control):control.continue()).catch(()=>cancel('controller_failed'));
        if(m.kind==='result'){resultSeen=true;if(!reason){staged=m;if(options.cancelOnResult)cancel();}}
      }
    });
    child.once('close',code=>{
      closed=true;live--;clearTimeout(timer);clearTimeout(grace);
      const classification=reason??(code===0&&staged&&!buffer.trim()?staged.classification:'helper_failed');
      resolve({classification,helperExited:true,spawned:true,activeHelpers:live,forced,architecture:ready,exitCode:code,
        ...(staged?.counts?{counts:staged.counts}:{}),matches:classification==='completed'?staged.matches:[],truncated:classification==='completed'&&staged.truncated});
    });
    // Reserve the last 100 ms of the 3-second budget for forced termination.
    timer=setTimeout(()=>cancel('timed_out'),2900);
    child.stdin.write((options.rawRequest??JSON.stringify(request))+'\n',()=>{});
  });
}
