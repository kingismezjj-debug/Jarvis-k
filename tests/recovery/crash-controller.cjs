// Actual termination is reachable only from the local manual Y gate. Import is inert.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const P=require('./profile.cjs'),Exit=require('./exit-verifier.cjs');
function invoke(p,manifest,terminate,{timeoutMs,signal}){
 return new Promise((resolve,reject)=>{
  if(p.scenario!=='B'||!(timeoutMs>0)){reject(Error('SAFE_TARGET_REJECTED'));return;}
  const child=cp.execFile('powershell.exe',['-NoProfile','-NonInteractive','-File',path.join(__dirname,'crash-controller.ps1')],
   {windowsHide:true,timeout:Math.max(1,Math.floor(timeoutMs)),signal,encoding:'utf8',maxBuffer:2048},(error,out)=>{
    try{const r=JSON.parse(out);if(Object.keys(r).sort().join()!=='executed,verified'||typeof r.verified!=='boolean'||typeof r.executed!=='boolean')throw Error();
      if(!terminate&&(error||!r.verified))throw Error();resolve(r);}
    catch{reject(Error('SAFE_TARGET_REJECTED'));}
   });
  child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({nonce:p.nonce,entries:manifest.entries,terminate,budgetMs:Math.min(5000,Math.floor(timeoutMs))}));
 });
}
async function resolveTargets(p,options){
 p=P.validateTree(P.load(p.id));const manifest=JSON.parse(fs.readFileSync(P.canonical(path.join(p.control,'processes.json')),'utf8'));
 Exit.validateManifest(manifest,p.nonce);
 if(manifest.entries.filter(e=>e.role==='core_host').length!==1||!manifest.entries.some(e=>e.role==='renderer'))throw Error('SAFE_TARGET_REJECTED');
 const rows=await Exit.queryRows(options);const classified=Exit.classify(manifest,rows,p.nonce).summary;
 if(classified.identityCounts.matching_identity_active!==manifest.entries.length||classified.identityCounts.identity_unavailable||
  classified.identityCounts.pid_reused_identity_mismatch||classified.identityCounts.child_of_matching_identity_active||classified.notepadCount)throw Error('SAFE_TARGET_REJECTED');
 await invoke(p,manifest,false,options);
 return {manifest,unrelated:rows.filter(r=>['electron.exe','node.exe'].includes(r.executable)&&!manifest.entries.some(e=>e.pid===r.pid))};
}
async function terminate(p,targets,options){
 await options.guard();const budget=Math.min(5000,options.remainingMs());if(budget<=0)throw Error('SAFE_DEADLINE');
 options.markDispatch();
 return invoke(P.load(p.id),targets.manifest,true,{timeoutMs:budget});
}
async function checkUnrelated(targets){
 const rows=await Exit.queryRows({timeoutMs:3000});
 if(!targets.unrelated.every(e=>rows.some(r=>['pid','parent','created','executable'].every(k=>r[k]===e[k]))))throw Error('SAFE_UNRELATED_STATE_CHANGED');
}
module.exports={resolveTargets,terminate,checkUnrelated};
