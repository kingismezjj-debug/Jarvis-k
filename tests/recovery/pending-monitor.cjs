// Test-only scheduling and safe diagnostics. Never dispatches an action.
const {performance}=require('node:perf_hooks');
const OPS=Object.freeze(['ui_projection_read','canonical_approval_read','task_state_read','assistant_journal_read','approval_command_count_read','execution_count_read','provider_counter_read','executor_counter_read','notepad_check','process_identity_query','helper_state_read']);
const STATUS=['passed','failed','timeout','error','cancelled','not_run'];
const BUCKETS=['under_100ms','100_to_250ms','250_to_500ms','500ms_to_1s','1s_to_2s','over_2s'];
const CAUSES=['ui_read_timeout','ui_read_error','process_query_timeout','process_query_error','persistence_read_timeout','persistence_read_error','counter_read_timeout','counter_read_error','helper_state_timeout','helper_state_error','monitor_deadline_exceeded','monitor_cancelled','pending_state_changed','approval_command_observed','execution_started_observed','executor_invocation_observed','notepad_observed','provider_network_observed','unknown_monitor_failure'];
const ASSERTIONS=OPS.map(op=>'pending_monitor_'+({process_identity_query:'process_query'}[op]||op));
const FAST_MS=250,SLOW_MS=1000,FAST_DEADLINE=750,SLOW_DEADLINE=2500;
const TIMEOUTS=Object.freeze(Object.fromEntries(OPS.map(op=>[op,op==='process_identity_query'?2000:op==='ui_projection_read'?750:500])));
const bucket=ms=>BUCKETS[ms<100?0:ms<250?1:ms<500?2:ms<1000?3:ms<=2000?4:5];
const blank=()=>Object.fromEntries(OPS.map(op=>[op,{status:'not_run',durationBucket:'under_100ms',classification:'not_run',attemptCount:0}]));
const exact=(o,keys)=>o&&Object.keys(o).sort().join()===keys.slice().sort().join();
function validSummary(s){return exact(s,OPS)&&OPS.every(op=>{const r=s[op];return exact(r,['status','durationBucket','classification','attemptCount'])&&STATUS.includes(r.status)&&BUCKETS.includes(r.durationBucket)&&['completed','not_run',...CAUSES].includes(r.classification)&&Number.isInteger(r.attemptCount)&&r.attemptCount>=0&&r.attemptCount<=4096;});}
function family(op){return op==='ui_projection_read'?'ui_read':['process_identity_query','notepad_check'].includes(op)?'process_query':op==='helper_state_read'?'helper_state':op.includes('counter')||op==='approval_command_count_read'?'counter_read':'persistence_read';}
function error(op,status='error',cause){
 const D=require('./diagnostics.cjs');if(!OPS.includes(op))op='assistant_journal_read';
 const classification=cause&&CAUSES.includes(cause)?cause:status==='cancelled'?'monitor_cancelled':family(op)+'_'+(status==='timeout'?'timeout':'error');
 const group=family(op),e=D.failure(ASSERTIONS[OPS.indexOf(op)],'authorization_wait',status==='failed'?'assertion_failed':group==='process_query'?'process_state_unavailable':group==='persistence_read'?'persistence_unavailable':'inspection_error','completed',status);
 e.monitorCause=classification;e.monitorOperation=op;return e;
}
function create({fast,ui,process:processQuery,helper,now=()=>performance.now(),remaining=()=>45000}){
 const summary=blank();let primary=null,stopped=false,watching=false,fastBusy=null,slowBusy=null,fastTimer,slowTimer,deadlineTimer;
 const controllers=new Set(),starts=new Map();let rejectFailure;
 const failure=new Promise((_,reject)=>{rejectFailure=reject;});failure.catch(()=>{});
 function freeze(e){if(!primary){primary=e?.monitorCause?e:error('assistant_journal_read','error','unknown_monitor_failure');if(OPS.includes(primary.monitorOperation)){const r=summary[primary.monitorOperation];summary[primary.monitorOperation]={...r,status:STATUS.includes(primary.failure.actual)?primary.failure.actual:'error',classification:primary.monitorCause};}Object.freeze(primary.failure);rejectFailure(primary);}return primary;}
 function record(op,status,ms,cause){if(primary)return;summary[op]={...summary[op],status,durationBucket:bucket(ms),classification:cause||'completed'};}
 function begin(op){if(!OPS.includes(op)||starts.has(op)||summary[op].attemptCount>=4096)throw error(op);starts.set(op,now());summary[op].attemptCount++;}
 function done(op,status='passed',cause){if(!starts.has(op))throw error(op);const ms=now()-starts.get(op);if(status==='passed'&&ms>=TIMEOUTS[op]){record(op,'timeout',ms,family(op)+'_timeout');starts.delete(op);throw error(op,'timeout');}record(op,status,ms,cause);starts.delete(op);}
 async function timed(op,fn,max=TIMEOUTS[op]){
  if(primary)throw primary;if(stopped)throw error(op,'cancelled');begin(op);
  const controller=new AbortController();controllers.add(controller);let timer;const start=now(),ms=Math.floor(Math.min(max,remaining()));
  try{if(ms<=0)throw error(op,'timeout','monitor_deadline_exceeded');
   const value=await Promise.race([Promise.resolve().then(()=>fn({timeoutMs:ms,signal:controller.signal})),new Promise((_,reject)=>{timer=setTimeout(()=>reject(error(op,'timeout')),ms);}),new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(error(op,'cancelled')),{once:true}))]);
   if(now()-start>=ms)throw error(op,'timeout');done(op);return value;
  }catch(e){const known=e?.monitorCause?e:error(op,e?.category==='query_timeout'?'timeout':e?.category==='query_cancelled'?'cancelled':'error');if(starts.has(op))done(op,known.failure.actual,known.monitorCause);throw known;}
  finally{clearTimeout(timer);controllers.delete(controller);controller.abort();}
 }
 function unsafe(op,cause){record(op,'failed',0,cause);throw error(op,'failed',cause);}
 function validateFast(f){
  if(!f||typeof f!=='object')throw error('assistant_journal_read');
  const countOps={executionStarted:'execution_count_read',toolResults:'execution_count_read',approvalResolvedCount:'canonical_approval_read',approvalCommandCount:'approval_command_count_read',parsedApprovalDecisionCount:'approval_command_count_read',harnessCancelCount:'approval_command_count_read',providerCalls:'provider_counter_read',transportCalls:'provider_counter_read',networkCalls:'provider_counter_read',executorCalls:'executor_counter_read',notepadCount:'executor_counter_read'};
  for(const [key,op] of Object.entries(countOps))if(!Number.isInteger(f[key])||f[key]<0||f[key]>4096)throw error(op);
  if(!Number.isFinite(f.pendingAgeMs)||typeof f.pending!=='boolean')throw error('canonical_approval_read');
  if(typeof f.taskAwaiting!=='boolean'||typeof f.taskCancelled!=='boolean')throw error('task_state_read');
  if(typeof f.appCloseStarted!=='boolean')throw error('approval_command_count_read');
  lastFast={...f};
  if(f.approvalCommandCount||f.parsedApprovalDecisionCount||f.approvalResolvedCount)unsafe('approval_command_count_read','approval_command_observed');
  if(f.executionStarted||f.toolResults)unsafe('execution_count_read','execution_started_observed');
  if(f.executorCalls)unsafe('executor_counter_read','executor_invocation_observed');
  if(f.networkCalls)unsafe('provider_counter_read','provider_network_observed');
  if(f.notepadCount)unsafe('notepad_check','notepad_observed');
  if(!f.taskAwaiting||f.taskCancelled)unsafe('task_state_read','pending_state_changed');
  if(f.harnessCancelCount||f.appCloseStarted)unsafe('approval_command_count_read','pending_state_changed');
  if(!f.pending||f.pendingAgeMs<0||f.pendingAgeMs>=75000)unsafe('canonical_approval_read','pending_state_changed');
  if(f.providerCalls!==1||f.transportCalls!==1)throw error('provider_counter_read');return f;
 }
 let lastFast,lastSlow;
 async function fastCycle(){
  let active='assistant_journal_read',opTimer,cycleTimer;const seen=new Set();const controller=new AbortController();controllers.add(controller);
  const rejectors={};const fail=new Promise((_,reject)=>{rejectors.reject=reject;});
  function progress(m){if(primary||stopped)return;if(!m||!OPS.includes(m.operation)||!['start','done'].includes(m.kind))throw error(active);
   if(m.kind==='start'){active=m.operation;begin(active);clearTimeout(opTimer);opTimer=setTimeout(()=>rejectors.reject(error(active,'timeout')),Math.min(TIMEOUTS[active],remaining()));}
   else{if(m.operation!==active||seen.has(active))throw error(active);done(active);seen.add(active);clearTimeout(opTimer);}
  }
  try{
   cycleTimer=setTimeout(()=>rejectors.reject(error(active,'timeout','monitor_deadline_exceeded')),Math.min(FAST_DEADLINE,remaining()));
   const [f,h]=await Promise.all([Promise.race([Promise.resolve().then(()=>fast({signal:controller.signal,progress,timeoutMs:Math.min(FAST_DEADLINE,remaining())})),fail,new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(error(active,'cancelled')),{once:true}))]),timed('helper_state_read',async options=>{const state=await helper(options);if(!['waiting','granted','not_started'].includes(state))throw error('helper_state_read');return state;})]);
   for(const op of ['assistant_journal_read','canonical_approval_read','task_state_read','execution_count_read','approval_command_count_read','provider_counter_read','executor_counter_read'])if(!seen.has(op))throw error(op);
   if(!['waiting','granted','not_started'].includes(h))throw error('helper_state_read');lastFast=validateFast(f);return lastFast;
  }catch(e){const known=e?.monitorCause?e:error(active);if(starts.has(active))done(active,known.failure.actual,known.monitorCause);throw freeze(known);}
  finally{clearTimeout(opTimer);clearTimeout(cycleTimer);controllers.delete(controller);controller.abort();}
 }
 async function slowCycle(){
  let timer;
  try{const [native,rows]=await Promise.race([Promise.all([timed('ui_projection_read',async options=>{const value=await ui(options);if(value!==true)throw error('ui_projection_read','failed','pending_state_changed');return value;}),timed('process_identity_query',async options=>{const value=await processQuery(options);if(!value||value.identityValid!==true)throw error('process_identity_query');return value;})]),new Promise((_,reject)=>{timer=setTimeout(()=>reject(error('process_identity_query','timeout','monitor_deadline_exceeded')),Math.min(SLOW_DEADLINE,remaining()));})]);
   if(native!==true)unsafe('ui_projection_read','pending_state_changed');
   const count=await timed('notepad_check',async()=>{if(!Number.isInteger(rows.notepadCount)||rows.notepadCount<0||rows.notepadCount>4096)throw error('notepad_check');return rows.notepadCount;});
   if(count)unsafe('notepad_check','notepad_observed');lastSlow={nativeApproval:native,notepadCount:count};return lastSlow;
  }catch(e){throw freeze(e);}finally{clearTimeout(timer);}
 }
 function launch(kind){if(primary||stopped)return Promise.reject(primary||error('helper_state_read','cancelled'));
  if(kind==='fast'){if(fastBusy)return fastBusy;fastBusy=fastCycle().finally(()=>{fastBusy=null;});return fastBusy;}
  if(slowBusy)return slowBusy;slowBusy=slowCycle().finally(()=>{slowBusy=null;});return slowBusy;
 }
 function start(){if(watching)return;watching=true;
  function tick(kind){const at=now();launch(kind).then(()=>{if(watching&&!stopped&&!primary){const id=setTimeout(()=>tick(kind),Math.max(0,(kind==='fast'?FAST_MS:SLOW_MS)-(now()-at)));if(kind==='fast')fastTimer=id;else slowTimer=id;}}).catch(()=>{});}
  fastTimer=setTimeout(()=>tick('fast'),FAST_MS);slowTimer=setTimeout(()=>tick('slow'),SLOW_MS);
  deadlineTimer=setTimeout(()=>freeze(error('helper_state_read','timeout','monitor_deadline_exceeded')),Math.max(1,remaining()));
 }
 async function complete(){
  if(primary)throw primary;let timer;
  try{return await Promise.race([(async()=>{await Promise.all([fastBusy,slowBusy]);if(primary)throw primary;
   await Promise.all([launch('fast'),launch('slow')]);if(primary)throw primary;
   // Re-read fast facts AFTER the slow query so a slow identity query cannot age approval proof.
   await launch('fast');if(primary)throw primary;
   return {...lastFast,...lastSlow,notepadCount:Math.max(lastFast.notepadCount,lastSlow.notepadCount)};
  })(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(error('canonical_approval_read','timeout','monitor_deadline_exceeded')),Math.max(1,Math.min(5000,remaining())));})]);}
  catch(e){throw freeze(e);}finally{clearTimeout(timer);}
 }
 async function pause(){watching=false;clearTimeout(fastTimer);clearTimeout(slowTimer);clearTimeout(deadlineTimer);await Promise.allSettled([fastBusy,slowBusy]);clearTimeout(fastTimer);clearTimeout(slowTimer);}
 async function stop(){stopped=true;clearTimeout(fastTimer);clearTimeout(slowTimer);clearTimeout(deadlineTimer);for(const c of controllers)c.abort();await Promise.allSettled([fastBusy,slowBusy]);}
 function cancel(){freeze(error('helper_state_read','cancelled'));void stop();}
 return {start,complete,pause,stop,cancel,failure,summary:()=>structuredClone(summary),primary:()=>primary,lastCounts:()=>lastFast};
}
module.exports={OPS,STATUS,BUCKETS,CAUSES,ASSERTIONS,TIMEOUTS,FAST_MS,SLOW_MS,FAST_DEADLINE,SLOW_DEADLINE,bucket,blank,validSummary,error,create};
