// Owned standalone helper lifecycle; never attaches to an existing profile/process.
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const Exit=require('./exit-verifier.cjs'),Backend=require('./controller-backend.cjs'),Engine=require('./controller-engine.cjs'),R=require('./controller-receipt.cjs');
const worker=path.join(__dirname,'controller-worker.cjs');
const roleMap={desktop_main:'main',core_host:'corehost',renderer:'renderer',utility:'utility'};
function validateTargets(entries,rows,parent,sentinel,mode,owner){
 if(!Array.isArray(entries)||entries.length<1||entries.length>32||!parent||!sentinel||parent.pid===sentinel.pid||sentinel.parent!==parent.pid||new Set(entries.map(e=>e.pid)).size!==entries.length)throw Error('SAFE_TARGETS');
 for(const e of entries){if([parent.pid,sentinel.pid].includes(e.pid)||!R.ROLES.includes(roleMap[e.role]||e.role)||!['node.exe','electron.exe'].includes(e.executable)||mode==='B'&&e.nonce!==owner)throw Error('SAFE_TARGETS');const found=rows.filter(r=>r.pid===e.pid);if(found.length!==1||!['pid','parent','created','executable'].every(k=>found[0][k]===e[k]))throw Error('SAFE_TARGETS');}
}
async function spawnWorker(kind,owner){if(!['sentinel','sacrificial'].includes(kind)||!/^[a-f0-9]{32}$/.test(owner))throw Error('SAFE_WORKER');
 const child=cp.spawn(process.execPath,[worker,'--controller-'+kind+'='+owner],{windowsHide:true,stdio:['pipe','pipe','pipe']});let exited=false;const exit=new Promise(resolve=>child.once('exit',()=>{exited=true;resolve();}));child.stdin.on('error',()=>{});
 try{await new Promise((resolve,reject)=>{let buf='';const t=setTimeout(()=>reject(Error('SAFE_WORKER')),2000);const bad=()=>{clearTimeout(t);reject(Error('SAFE_WORKER'));};child.once('error',bad);child.once('exit',bad);child.stderr.on('data',bad);child.stdout.on('data',b=>{buf+=b.toString();if(buf==='ready\n'){clearTimeout(t);resolve();}else if(buf.length>32)bad();});});}catch{child.stdin.end('shutdown\n');throw Error('SAFE_WORKER');}
 return {child,exited:()=>exited,async shutdown(){if(exited)return;child.stdin.end('shutdown\n');let timer;try{await Promise.race([exit,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('SAFE_SHUTDOWN')),2000);})]);}finally{clearTimeout(timer);}}};
}
async function setup({mode,owner,launch,entries}){
 if(!R.bindingValid({scenario:mode,owner,launch}))throw Error('SAFE_BINDING');
 const sentinel=await spawnWorker('sentinel',owner);let directory;
 try{const rows=await Exit.queryRows({timeoutMs:2000});const parent=rows.find(r=>r.pid===process.pid),protectedRow=rows.find(r=>r.pid===sentinel.child.pid);if(!parent||!protectedRow||protectedRow.parent!==process.pid)throw Error();
  validateTargets(entries,rows,parent,protectedRow,mode,owner);
  directory=fs.mkdtempSync(path.join(fs.realpathSync.native(os.tmpdir()),'jarvis-controller-'));const binding={scenario:mode,owner,launch};
  const spec={mode,owner,parent,sentinel:protectedRow,worker,entries:entries.map((e,token)=>({...e,role:roleMap[e.role]||e.role,token}))};
  const driver=Backend.create(spec);return {binding,directory,sentinel,spec,driver,
   async run(options={}){const result=await Engine.run({binding,entries:spec.entries.map(e=>({token:e.token,role:e.role})),driver,publish:r=>R.publish(directory,binding,r),...options});
    if(result.receiptPublished){try{result.receipt=R.read(directory,binding);result.verified=R.passed(result.receipt);}catch{R.fail(result.receipt,'result_ownership_failed');result.verified=false;}}return result;},
   async close(){await driver.close();await sentinel.shutdown();}};
 }catch{await sentinel.shutdown();throw Error('SAFE_PROTECTED_BASELINE');}
}
module.exports={setup,spawnWorker,roleMap,validateTargets};
