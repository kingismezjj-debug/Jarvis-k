// Explicit standalone manual selftest, never run by npm test/verify or a profile launch.
const crypto=require('node:crypto');const Session=require('./controller-session.cjs'),Exit=require('./exit-verifier.cjs');
async function run(){const owner=crypto.randomBytes(16).toString('hex'),launch=crypto.randomBytes(16).toString('hex'),children=[];let session,result,stable=false,finalProcessCount=0,cleanup=true;
 try{
  for(let i=0;i<4;i++)children.push(await Session.spawnWorker('sacrificial',owner));
  const rows=await Exit.queryRows({timeoutMs:2000});const roles=['main','corehost','renderer','utility'];const entries=children.map((c,i)=>{const e=rows.find(r=>r.pid===c.child.pid);if(!e||e.parent!==process.pid)throw Error();return {...e,role:roles[i]};});
  session=await Session.setup({mode:'controller_selftest',owner,launch,entries});result=await session.run();
  if(result.verified){let zeros=0;const {performance}=require('node:perf_hooks');const start=performance.now();let last=-Infinity;
   while(performance.now()-start<15000){const now=performance.now();if(now-last<200){await new Promise(resolve=>setTimeout(resolve,Math.ceil(200-(now-last))));continue;}const sample=await Exit.queryRows({timeoutMs:Math.max(1,Math.min(2000,15000-(performance.now()-start)))});last=performance.now();
    if(entries.some(e=>sample.some(r=>r.pid===e.pid&&r.created===e.created&&r.executable===e.executable))||sample.some(r=>r.notepad)){zeros=0;}else zeros++;if(zeros===3){stable=true;break;}}
  }
 }catch{if(!result)result={executed:false,verified:false,receipt:null};}
 finally{try{await session?.close();}catch{cleanup=false;}for(const c of children){try{await c.shutdown();}catch{cleanup=false;}}finalProcessCount=children.filter(c=>!c.exited()).length+(session&&!session.sentinel.exited()?1:0)+(session?.driver.activeCount()||0);}
 return {schemaVersion:1,verdict:result?.verified&&stable&&cleanup&&finalProcessCount===0?'PASS':'FAIL',testProcessTerminationPerformed:result?.executed===true,realNetworkRequestSent:false,realWindowsActionPerformed:false,sacrificialTargetCount:children.length,allTargetsExited:result?.receipt?.allTargetsExited===true,protectedSentinelPreserved:result?.receipt?.protectedSetPreserved===true,stableZeroVerified:stable,finalProcessCount,receipt:result?.receipt||null};
}
if(require.main===module){if(process.argv.length!==2){process.stdout.write(JSON.stringify({verdict:'FAIL'})+'\n');process.exitCode=1;}else run().then(r=>{process.stdout.write(JSON.stringify(r)+'\n');if(r.verdict!=='PASS')process.exitCode=1;}).catch(()=>{process.stdout.write(JSON.stringify({verdict:'FAIL'})+'\n');process.exitCode=1;});}
module.exports={run};
