// Manual authorization only. Importing this module starts nothing.
const fs=require('node:fs'),path=require('node:path');
const P=require('./profile.cjs'),Exit=require('./exit-verifier.cjs'),Session=require('./controller-session.cjs'),R=require('./controller-receipt.cjs'),D=require('./diagnostics.cjs');
async function resolveTargets(p,options){
 p=P.validateTree(P.load(p.id));const manifest=JSON.parse(fs.readFileSync(P.canonical(path.join(p.control,'processes.json')),'utf8'));
 Exit.validateManifest(manifest,p.nonce);
 if(manifest.entries.filter(e=>e.role==='core_host').length!==1||!manifest.entries.some(e=>e.role==='renderer'))throw Error('SAFE_TARGET_REJECTED');
 const rows=await Exit.queryRows(options);const s=Exit.classify(manifest,rows,p.nonce).summary;
 if(s.identityCounts.matching_identity_active!==manifest.entries.length||s.identityCounts.identity_unavailable||s.identityCounts.pid_reused_identity_mismatch||s.identityCounts.child_of_matching_identity_active||s.notepadCount)throw Error('SAFE_TARGET_REJECTED');
 return {manifest};
}
async function terminate(p,targets,options){
 await options.guard();p=P.load(p.id);const l=JSON.parse(fs.readFileSync(P.canonical(path.join(p.control,'exit-launch.json')),'utf8'));
 if(l.owner!==p.nonce||l.stage!=='launch')throw Error('SAFE_TARGET_REJECTED');
 let session,result,guardFailure;
 try{session=await Session.setup({mode:'B',owner:p.nonce,launch:l.generation,entries:targets.manifest.entries});
  // No Kill may be dispatched once the independent 75-second pending boundary expires.
  result=await session.run({beforeDispatch:async()=>{try{await options.guard();}catch(error){if(D.validFailure(error?.failure))guardFailure=error.failure;throw error;}if(options.remainingMs()<=0)throw {category:'controller_budget_exhausted'};},markDispatch:()=>{if(options.remainingMs()<=0)throw {category:'controller_budget_exhausted'};options.markDispatch();}});
 }catch{if(!result){const receipt=R.empty();R.fail(receipt,'protected_baseline_failed');result={receipt,receiptPublished:false,executed:false,verified:false};}}
 finally{if(session){try{await session.close();if(result)result.controllerCleanup='completed';}catch{if(result){result.controllerCleanup='incomplete';result.verified=false;}}}}
 return {...result,...(guardFailure?{guardFailure}:{} )};
}
function failureFor(result){const category=result?.receipt?.primaryFailure?.category;return R.FAILURES.includes(category)?category:'unexpected_controller_error';}
module.exports={resolveTargets,terminate,failureFor};
