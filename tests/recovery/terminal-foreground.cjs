// Only a visible classic console with live OS console membership is provable here.
// ConPTY, redirected input and unknown hosting layouts fail closed; no title matching.
const cp=require('node:child_process'),path=require('node:path');
async function verified({signal,timeoutMs=1000}={}) {
  if(process.platform!=='win32'||signal?.aborted)return false;
  return new Promise(resolve=>{
    try {cp.execFile('powershell.exe',['-NoProfile','-NonInteractive','-File',
      path.join(__dirname,'terminal-foreground.ps1'),'-OwnerProcessId',String(process.pid)],
      {windowsHide:true,timeout:Math.max(1,Math.min(1000,timeoutMs)),maxBuffer:128,signal},
      (error,stdout)=>resolve(!error&&stdout.trim()==='verified'));
    }catch{resolve(false);}
  });
}
module.exports={verified};
