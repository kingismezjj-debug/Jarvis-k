// Same bounded algorithm for fake tests and the private Windows handle backend.
const {performance}=require('node:perf_hooks');const R=require('./controller-receipt.cjs');
const TOTAL_MS=15000,WAIT_MS=2000,QUERY_MS=2000;
async function run(o){const r=R.empty(),now=o.now||(()=>performance.now()),start=now();const remaining=()=>Math.max(0,TOTAL_MS-600-(now()-start));
 let entries=[],opened=false,dispatch=false;const inc=(e,k)=>{const c=r.roleCounters[e.role];if(c[k]>=16)throw Error();c[k]++;};
 async function call(op,arg,limit=QUERY_MS){const ms=Math.min(limit,remaining());if(ms<=0){R.fail(r,'controller_budget_exhausted');throw {category:'controller_budget_exhausted'};}let timer;try{const v=await Promise.race([o.driver[op](arg,ms),new Promise((_,reject)=>{timer=setTimeout(()=>reject({category:'controller_budget_exhausted'}),ms);})]);if(remaining()<=0)throw {category:'controller_budget_exhausted'};return v;}finally{clearTimeout(timer);}}
 function failed(e,fallback){R.fail(r,R.FAILURES.includes(e?.category)?e.category:fallback);}
 try{
  if(!R.bindingValid(o.binding))throw {category:'result_ownership_failed'};R.advance(r,'ownership_validated');
  entries=o.entries;if(!Array.isArray(entries)||entries.length<1||entries.length>32||new Set(entries.map(e=>e.token)).size!==entries.length||entries.some(e=>!R.ROLES.includes(e.role)||!Number.isInteger(e.token)||e.token<0||e.token>31)||entries.filter(e=>e.role==='main').length!==1||R.ROLES.some(role=>entries.filter(e=>e.role===role).length>16))throw {category:'target_set_incomplete'};
  entries.forEach(e=>inc(e,'resolved'));R.advance(r,'targets_resolved');
  const prepared=await call('open',undefined,3000);if(!prepared||prepared.identityVerified!==true)throw {category:'pre_kill_identity_failed'};
  entries.forEach(e=>inc(e,'identityVerified'));R.advance(r,'pre_kill_identity_verified');
  if(prepared.handlesOpened!==true)throw {category:'handle_open_failed'};opened=true;entries.forEach(e=>inc(e,'handleOpened'));R.advance(r,'target_handles_opened');
  if(prepared.protectedVerified!==true)throw {category:'protected_baseline_failed'};R.advance(r,'protected_baseline_captured');
  // Final product guard follows handle capture; it cannot enlarge the target set.
  if(o.beforeDispatch){let timer;try{await Promise.race([o.beforeDispatch(),new Promise((_,reject)=>{timer=setTimeout(()=>reject({category:'controller_budget_exhausted'}),Math.min(5000,remaining()));})]);}finally{clearTimeout(timer);}}if(remaining()<=0)throw {category:'controller_budget_exhausted'};
  R.advance(r,'termination_started');r.cleanupOutcome='incomplete';
  for(const [roles,signalStage,waitStage] of [[['main'],'main_signal_attempted','main_exit_waited'],[['corehost'],'corehost_signal_attempted','corehost_exit_waited'],[['renderer','utility'],'child_signal_attempted','child_exit_waited']]){
   R.advance(r,signalStage);
   const group=entries.filter(e=>roles.includes(e.role));
   for(const e of group){
    if(!remaining()){R.fail(r,'controller_budget_exhausted');continue;}
    let exited;try{exited=await call('state',e.token);}catch(error){inc(e,'handleError');failed(error,'handle_state_failed');continue;}
    if(exited===true){inc(e,'alreadyExited');continue;}
    if(exited!==false){inc(e,'handleError');R.fail(r,'handle_state_failed');continue;}
    try{if(!dispatch){o.markDispatch?.();dispatch=true;}inc(e,'killAttempted');const status=await call('kill',e.token);if(status==='returned'){inc(e,'killReturned');r.executed=true;}else if(status==='already_exited')inc(e,'alreadyExited');else throw {category:'kill_call_failed'};}
    catch(error){inc(e,'killError');failed(error,'kill_call_failed');}
   }
   R.advance(r,waitStage);
   for(const e of group){if(!remaining()){R.fail(r,'controller_budget_exhausted');continue;}inc(e,'exitWaitStarted');try{const exited=await call('wait',e.token,WAIT_MS);if(exited===true)inc(e,'exitObserved');else{inc(e,'waitTimedOut');R.fail(r,'exit_wait_timeout');}}catch(error){inc(e,'handleError');failed(error,'handle_state_failed');}}
  }
  r.allTerminationCallsCompleted=entries.every(e=>{const c=r.roleCounters[e.role];return c.handleError===0&&c.killError===0&&c.killReturned+c.alreadyExited===c.resolved;});
  r.allTargetsExited=R.ROLES.every(role=>r.roleCounters[role].exitObserved===r.roleCounters[role].resolved);
  R.advance(r,'target_exit_verified');if(!r.allTargetsExited)R.fail(r,'residual_target_detected');
  try{const s=await call('descendants');if(!s||!Number.isInteger(s.descendants)||s.descendants<0||s.descendants>4096||!Array.isArray(s.residualTokens)||s.residualTokens.some(t=>!entries.some(e=>e.token===t)))throw Error();for(const t of s.residualTokens)inc(entries.find(e=>e.token===t),'residualMatching');r.descendantCheckPassed=s.descendants===0&&s.residualTokens.length===0;if(!r.descendantCheckPassed)R.fail(r,s.residualTokens.length?'residual_target_detected':'residual_descendant_detected');}catch(error){failed(error,'descendant_query_failed');}
  R.advance(r,'descendant_check_completed');
  try{r.protectedSetPreserved=await call('protected')===true;if(!r.protectedSetPreserved)R.fail(r,'protected_process_missing');}catch(error){failed(error,'protected_process_missing');}
  R.advance(r,'protected_postcheck_completed');r.cleanupOutcome=r.allTargetsExited?'completed':'incomplete';
 }catch(error){
  const sc=error?.startupCounts,keys=['identityVerified','handleOpened','handleError','identityUnavailable'];
  if(sc&&Object.keys(sc).sort().join()===R.ROLES.slice().sort().join()&&R.ROLES.every(role=>Object.keys(sc[role]).sort().join()===keys.slice().sort().join()&&keys.every(k=>Number.isInteger(sc[role][k])&&sc[role][k]>=0&&sc[role][k]<=r.roleCounters[role].resolved))){for(const role of R.ROLES)for(const k of keys)r.roleCounters[role][k]=sc[role][k];if(R.ROLES.every(role=>sc[role].identityVerified===r.roleCounters[role].resolved))R.advance(r,'pre_kill_identity_verified');if(R.ROLES.every(role=>sc[role].handleOpened===r.roleCounters[role].resolved))R.advance(r,'target_handles_opened');}
  failed(error,opened?'unexpected_controller_error':'pre_kill_identity_failed');
 }
 finally{try{await o.driver.close();}catch{if(!r.primaryFailure)R.fail(r,'unexpected_controller_error');}}
 const elapsed=now()-start;r.totalDurationBucket=elapsed<5000?'under_5s':elapsed<10000?'5_to_10s':elapsed<15000?'10_to_15s':'deadline_reached';
 // Last reached operation is preserved on failure; publication itself has a separate result.
 let receiptPublished=false;try{if(!R.valid(r))throw Error();const committed=structuredClone(r);if(!committed.primaryFailure){R.advance(committed,'receipt_published');R.advance(committed,'controller_completed');}await o.publish(committed);receiptPublished=true;r.lastReachedStage=committed.lastReachedStage;}catch{R.fail(r,'receipt_write_failed');}
 return {receipt:r,receiptPublished,executed:r.executed,verified:receiptPublished&&R.passed(r)};
}
module.exports={run,TOTAL_MS,WAIT_MS,QUERY_MS};
