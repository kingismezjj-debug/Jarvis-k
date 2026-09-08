// H6 external test orchestration. No product imports, timers, or cancellation policy changes.
const {performance}=require('node:perf_hooks');
const Input=require('./authorization-input.cjs'),D=require('./diagnostics.cjs');
const AUTH_MS=45000, TARGET_MS=60000, HARD_MS=75000, PRODUCT_MS=120000;
const REASONS=Object.freeze(['user_approval_decision_observed','harness_cancel_observed',
  'product_timeout_window_reached','app_close_before_crash','state_changed_unknown_source',
  'crash_executed_while_pending',
  'deadline_exceeded','target_identity_unavailable','exit_verification_failed',...Input.RESULTS]);
const INITIAL={schemaVersion:2,nativeApprovalObserved:false,canonicalPendingObserved:false,
  localAuthorization:'aborted',authorizationWindowBucket:'under_15s',pendingToCrashBucket:'not_executed',
  approvalCommandCount:0,approvalResolvedCount:0,taskCancellationObserved:false,cancellationTiming:'not_observed',
  crashExecuted:false,reason:'state_changed_unknown_source',harness_cancel_command_count:0,
  parsed_approval_decision_count:0,user_local_authorization:'aborted',product_timeout_window_reached:false,
  app_close_started:false,crash_started:false,profileClassification:'invalid_for_acceptance',challenge_match:false,firstFailure:null,
  firstFailureCounters:null,finalCloseCounters:null,closeOutcome:'not_started',failureCheckpoint:'not_attempted',timelinePublication:'not_attempted'};
const ENUMS={localAuthorization:Input.RESULTS,user_local_authorization:Input.RESULTS,closeOutcome:['not_started','succeeded','failed'],failureCheckpoint:['not_attempted','published','unavailable'],timelinePublication:['not_attempted','published','unavailable'],
 authorizationWindowBucket:['under_15s','15_to_30s','30_to_45s','over_45s'],
 pendingToCrashBucket:['under_30s','30_to_60s','60_to_75s','not_executed'],
 cancellationTiming:['before_authorization','during_target_resolution','after_crash','not_observed'],
 reason:REASONS,profileClassification:['invalid_for_acceptance','eligible_for_recovery']};
function valid(t){return !!t&&Object.keys(t).sort().join()===Object.keys(INITIAL).sort().join()&&
 Object.entries(INITIAL).every(([k,v])=>k==='schemaVersion'?t[k]===2:k==='firstFailure'?(t[k]===null||D.validFailure(t[k])):
 ['firstFailureCounters','finalCloseCounters'].includes(k)?(t[k]===null||validCounts(t[k])):ENUMS[k]?ENUMS[k].includes(t[k]):
 typeof v==='boolean'?typeof t[k]==='boolean':Number.isInteger(t[k])&&t[k]>=0&&t[k]<=4096)&&
 (t.profileClassification!=='eligible_for_recovery'||t.crashExecuted&&t.crash_started&&t.localAuthorization==='granted'&&
  t.user_local_authorization==='granted'&&t.challenge_match&&t.firstFailure===null&&t.nativeApprovalObserved&&t.canonicalPendingObserved&&
  t.reason==='crash_executed_while_pending'&&t.pendingToCrashBucket!=='not_executed'&&t.approvalCommandCount===0&&
  t.approvalResolvedCount===0&&t.parsed_approval_decision_count===0&&t.harness_cancel_command_count===0&&
  !t.product_timeout_window_reached&&!t.app_close_started&&!t.taskCancellationObserved);}
function authBucket(ms){return ms<15000?'under_15s':ms<30000?'15_to_30s':ms<=45000?'30_to_45s':'over_45s';}
function crashBucket(ms){return ms<30000?'under_30s':ms<60000?'30_to_60s':'60_to_75s';}
async function bounded(operation,ms){
 if(ms<=0)throw Error('DEADLINE');const controller=new AbortController();let timer;
 try{return await Promise.race([Promise.resolve().then(()=>operation({timeoutMs:ms,signal:controller.signal})),
  new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('DEADLINE'));},ms);})]);}
 finally{clearTimeout(timer);controller.abort();}
}

const COUNT_KEYS=['approvalCommandCount','approvalResolvedCount','harnessCancelCount','parsedApprovalDecisionCount','executionStarted','providerCalls','transportCalls','networkCalls','executorCalls','notepadCount'];
function validCounts(c){return !!c&&Object.keys(c).sort().join()===COUNT_KEYS.slice().sort().join()&&COUNT_KEYS.every(k=>Number.isInteger(c[k])&&c[k]>=0&&c[k]<=4096);}
function counts(f){const c=Object.fromEntries(COUNT_KEYS.map(k=>[k,f[k]]));if(!validCounts(c))throw D.failure('inspection_operation','launch');return c;}
function inputFailure(result){
 const map={input_mismatch:['local_authorization_input','challenge_match','input_mismatch'],
 input_eof:['local_authorization_channel','open','eof'],input_error:['local_authorization_channel','readable','input_error'],
 authorization_timeout:['local_authorization_deadline','within_45s','expired'],
 aborted:['local_authorization_channel','open','aborted'],tty_unavailable:['local_authorization_channel','open','tty_unavailable'],
 foreground_unverified:['local_authorization_foreground','verified','foreground_unverified'],
 pending_state_changed:['canonical_approval_state','pending','changed'],
 approval_command_observed:['approval_command_count',0,1],target_identity_failed:['process_identity',true,false]};
 const [a,e,v]=map[result]||map.input_error;return D.failure(a,'launch','assertion_failed',e,v);
}
async function run(o){
 const t={...INITIAL};const now=o.now||(()=>performance.now());let phase='before_authorization',lastCounts=null;
 const elapsed=()=>now()-o.pendingAt;const budget=()=>Math.min(5000,HARD_MS-elapsed());
 const fail=(a,e,v,result='pending_state_changed')=>{t.localAuthorization=result;throw D.failure(a,'launch','assertion_failed',e,v);};
 const checkTime=()=>{if(!Number.isFinite(elapsed())||elapsed()<0||elapsed()>=HARD_MS){t.reason='deadline_exceeded';fail('crash_deadline','within_75s','expired');}};
 async function check(maxMs=5000){
  checkTime();const f=await bounded(o.facts,Math.min(maxMs,budget()));checkTime();lastCounts=counts(f);
  t.nativeApprovalObserved=f.nativeApproval===true;t.canonicalPendingObserved=f.pending===true;
  t.approvalCommandCount=f.approvalCommandCount;t.approvalResolvedCount=f.approvalResolvedCount;
  t.harness_cancel_command_count=f.harnessCancelCount;t.parsed_approval_decision_count=f.parsedApprovalDecisionCount;
  t.app_close_started=f.appCloseStarted===true;t.product_timeout_window_reached=f.pendingAgeMs>=PRODUCT_MS;
  if(f.taskCancelled){t.taskCancellationObserved=true;t.cancellationTiming=phase;}
  t.reason='state_changed_unknown_source';
  if(t.approvalCommandCount||t.parsed_approval_decision_count||t.approvalResolvedCount){t.reason='user_approval_decision_observed';fail('approval_command_count',0,Math.max(t.approvalCommandCount,t.parsed_approval_decision_count,t.approvalResolvedCount),'approval_command_observed');}
  if(t.harness_cancel_command_count){t.reason='harness_cancel_observed';fail('harness_cancel_count',0,t.harness_cancel_command_count);}
  if(t.product_timeout_window_reached){t.reason='product_timeout_window_reached';fail('crash_deadline','within_75s','expired');}
  if(t.app_close_started){t.reason='app_close_before_crash';fail('application_close_state',false,true);}
  if(f.executionStarted!==0)fail('execution_started_count',0,f.executionStarted);
  if(f.executorCalls!==0)fail('preparation_executor_count',0,f.executorCalls);
  if(f.notepadCount!==0)fail('notepad_observed_count',0,f.notepadCount);
  if(!t.canonicalPendingObserved)fail('canonical_approval_state','pending','changed');
  if(!t.nativeApprovalObserved)fail('native_approval_projection',true,false);
  if(!Number.isFinite(f.pendingAgeMs)||f.pendingAgeMs<0||f.pendingAgeMs>=HARD_MS)fail('crash_deadline','within_75s','expired');
  if(f.providerCalls!==1)fail('preparation_provider_count',1,f.providerCalls);
  if(f.transportCalls!==1)fail('provider_transport_calls',1,f.transportCalls);
  if(f.networkCalls!==0)fail('provider_network_calls',0,f.networkCalls);
 }
 async function waitInput(){
  const controller=new AbortController();const at=now();let timer,stopped=false,monitor,inflight;
  const ms=Math.min(AUTH_MS,HARD_MS-elapsed());
  try {
   const input=Promise.resolve().then(()=>o.authorize({timeoutMs:ms,signal:controller.signal})).catch(()=>({result:'input_error',challengeMatched:false}));
   const timeout=new Promise(resolve=>{timer=setTimeout(()=>resolve({result:'authorization_timeout',challengeMatched:false}),ms);});
   const watch=new Promise((_,reject)=>{
    const tick=async()=>{if(stopped)return;const started=now();try{inflight=check(500);await inflight;}catch(e){reject(e);return;}
     if(!stopped)monitor=setTimeout(tick,Math.max(0,250-(now()-started)));};
    monitor=setTimeout(tick,250);
   });
   const r=await Promise.race([input,timeout,watch]);
   // Drain an in-flight bounded inspection before publishing or entering the final check.
   stopped=true;clearTimeout(monitor);if(inflight){if(r?.result==='granted')await inflight;else await inflight.catch(()=>{});}
   if(!r||!Input.RESULTS.includes(r.result))return {result:'input_error',challengeMatched:false};
   if(now()-at>=ms)return {result:'authorization_timeout',challengeMatched:false};
   return r;
  } finally {stopped=true;clearTimeout(timer);clearTimeout(monitor);controller.abort();t.authorizationWindowBucket=authBucket(now()-at);}
 }
 try{
  if(o.scenario!=='B')throw D.failure('scenario_classification_match','launch','assertion_failed',true,false);
  await check();const authorization=await waitInput();
  t.localAuthorization=t.user_local_authorization=authorization.result;t.challenge_match=authorization.challengeMatched===true;
  if(t.localAuthorization!=='granted'){t.reason=t.localAuthorization;throw inputFailure(t.localAuthorization);}
  if(!t.challenge_match){t.localAuthorization='input_mismatch';t.reason='input_mismatch';throw inputFailure('input_mismatch');}
  phase='during_target_resolution';await check();t.reason='target_identity_unavailable';
  let targets;try{targets=await bounded(o.resolve,budget());}catch{t.localAuthorization='target_identity_failed';throw inputFailure('target_identity_failed');}
  checkTime();await check();
  const guard=async()=>{checkTime();await check();checkTime();};await guard();
  const receipt=await o.crash(targets,{guard,markDispatch:()=>{checkTime();t.crash_started=true;},remainingMs:()=>HARD_MS-elapsed()});
  if(receipt?.executed!==true)throw inputFailure('target_identity_failed');
  t.crash_started=true;t.crashExecuted=true;t.pendingToCrashBucket=crashBucket(elapsed());t.reason='crash_executed_while_pending';phase='after_crash';
  if(receipt.verified===false){t.reason='target_identity_unavailable';throw inputFailure('target_identity_failed');}
  checkTime();
  try{await o.verifyExit();}catch{t.reason='exit_verification_failed';throw D.failure('process_exit_state','launch','assertion_failed',true,false);}
  t.profileClassification='eligible_for_recovery';
 }catch(e){
  t.firstFailure=D.safeFailure(e,'launch');t.firstFailureCounters=lastCounts;
  if(!t.crash_started){
   // Immutable failure checkpoint MUST precede close. Close errors never replace the first failure.
   t.app_close_started=true;
   try{t.failureCheckpoint='published';await o.checkpoint(Object.freeze({...t}));}catch{t.failureCheckpoint='unavailable';}
   try{await o.close();t.closeOutcome='succeeded';}catch{t.closeOutcome='failed';}
   try{t.finalCloseCounters=counts(await o.finalCounters());}catch{t.finalCloseCounters=null;}
  }
 }
 t.timelinePublication='published';
 if(!valid(t))throw Error('SAFE_GATE_RESULT_INVALID');
 try{await o.publish(Object.freeze({...t}));}catch{
  t.timelinePublication='unavailable';t.profileClassification='invalid_for_acceptance';
  if(!t.firstFailure)t.firstFailure=D.failure('inspection_result_write','launch').failure;
 }
 return t;
}
module.exports={AUTH_MS,TARGET_MS,HARD_MS,PRODUCT_MS,REASONS,INITIAL,valid,authBucket,crashBucket,bounded,run,inputFailure,counts,validCounts};
