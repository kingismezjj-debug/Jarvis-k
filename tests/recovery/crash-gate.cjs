// H6 external test orchestration. No product imports, timers, or cancellation policy changes.
const {performance}=require('node:perf_hooks');
const AUTH_MS=45000, TARGET_MS=60000, HARD_MS=75000, PRODUCT_MS=120000;
const REASONS=Object.freeze(['user_approval_decision_observed','harness_cancel_observed',
  'product_timeout_window_reached','app_close_before_crash','state_changed_unknown_source',
  'crash_executed_while_pending','authorization_denied','authorization_timeout',
  'deadline_exceeded','target_identity_unavailable','exit_verification_failed']);
const INITIAL={schemaVersion:1,nativeApprovalObserved:false,canonicalPendingObserved:false,
  localAuthorization:'denied',authorizationWindowBucket:'under_15s',pendingToCrashBucket:'not_executed',
  approvalCommandCount:0,approvalResolvedCount:0,taskCancellationObserved:false,cancellationTiming:'not_observed',
  crashExecuted:false,reason:'state_changed_unknown_source',harness_cancel_command_count:0,
  parsed_approval_decision_count:0,user_local_authorization:'denied',product_timeout_window_reached:false,
  app_close_started:false,crash_started:false,profileClassification:'invalid_for_acceptance'};
const ENUMS={localAuthorization:['granted','denied','timeout'],user_local_authorization:['granted','denied','timeout'],
 authorizationWindowBucket:['under_15s','15_to_30s','30_to_45s','over_45s'],
 pendingToCrashBucket:['under_30s','30_to_60s','60_to_75s','not_executed'],
 cancellationTiming:['before_authorization','during_target_resolution','after_crash','not_observed'],
 reason:REASONS,profileClassification:['invalid_for_acceptance','eligible_for_recovery']};
function valid(t){return !!t&&Object.keys(t).sort().join()===Object.keys(INITIAL).sort().join()&&
 Object.entries(INITIAL).every(([k,v])=>k==='schemaVersion'?t[k]===1:ENUMS[k]?ENUMS[k].includes(t[k]):
 typeof v==='boolean'?typeof t[k]==='boolean':Number.isInteger(t[k])&&t[k]>=0&&t[k]<=4096)&&
 (t.profileClassification!=='eligible_for_recovery'||t.crashExecuted&&t.crash_started&&t.localAuthorization==='granted'&&
  t.user_local_authorization==='granted'&&t.nativeApprovalObserved&&t.canonicalPendingObserved&&
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
// Reads only one bounded line; never retains or echoes raw keystrokes.
function localY({input=process.stdin,output=process.stdout,timeoutMs=AUTH_MS,signal}={}){
 return new Promise(resolve=>{
  if(!input.isTTY||!output.isTTY||signal?.aborted){resolve('denied');return;}
  output.write('请确认Jarvis窗口已显示原生允许/拒绝按钮，且你没有点击任何按钮。\n若确认并授权仅终止本次隔离测试实例，请在45秒内输入 Y。\n输入其他内容或超时将安全取消本次验收。\n');
  let value='',settled=false;const raw=!!input.isRaw;
  const finish=result=>{if(settled)return;settled=true;clearTimeout(timer);input.off('data',data);input.off('end',end);input.off('error',end);signal?.removeEventListener('abort',abort);if(input.setRawMode)input.setRawMode(raw);input.pause();value='';resolve(result);};
  const data=chunk=>{for(const ch of chunk.toString()){if(ch==='\r'||ch==='\n'){finish(/^[Yy]$/.test(value)?'granted':'denied');return;}if(ch==='\u0003'||ch==='\u0004'||value.length>=1||!/^[Yy]$/.test(ch)){finish('denied');return;}value=ch;}};
  const end=()=>finish('denied'),abort=()=>finish('timeout');const timer=setTimeout(()=>finish('timeout'),Math.min(AUTH_MS,timeoutMs));
  if(input.setRawMode)input.setRawMode(true);input.on('data',data);input.once('end',end);input.once('error',end);signal?.addEventListener('abort',abort,{once:true});input.resume();
 });
}
async function run(o){
 const t={...INITIAL};const now=o.now||(()=>performance.now());let phase='before_authorization';
 const elapsed=()=>now()-o.pendingAt;const budget=()=>Math.min(5000,HARD_MS-elapsed());
 const checkTime=()=>{if(!Number.isFinite(elapsed())||elapsed()<0||elapsed()>=HARD_MS){t.reason='deadline_exceeded';throw Error();}};
 async function check(){
  checkTime();const f=await bounded(o.facts,budget());checkTime();
  for(const k of ['approvalCommandCount','approvalResolvedCount','harnessCancelCount','parsedApprovalDecisionCount','providerCalls','transportCalls','networkCalls','executorCalls','notepadCount'])if(!Number.isInteger(f[k])||f[k]<0||f[k]>4096)throw Error();
  t.nativeApprovalObserved=f.nativeApproval===true;t.canonicalPendingObserved=f.pending===true;
  t.approvalCommandCount=f.approvalCommandCount;t.approvalResolvedCount=f.approvalResolvedCount;
  t.harness_cancel_command_count=f.harnessCancelCount;t.parsed_approval_decision_count=f.parsedApprovalDecisionCount;
  t.app_close_started=f.appCloseStarted===true;t.product_timeout_window_reached=f.pendingAgeMs>=PRODUCT_MS;
  if(f.taskCancelled){t.taskCancellationObserved=true;t.cancellationTiming=phase;}
  if(t.approvalCommandCount||t.parsed_approval_decision_count||t.approvalResolvedCount)t.reason='user_approval_decision_observed';
  else if(t.harness_cancel_command_count)t.reason='harness_cancel_observed';
  else if(t.product_timeout_window_reached)t.reason='product_timeout_window_reached';
  else if(t.app_close_started)t.reason='app_close_before_crash';
  else t.reason='state_changed_unknown_source';
  if(!t.nativeApprovalObserved||!t.canonicalPendingObserved||!Number.isFinite(f.pendingAgeMs)||f.pendingAgeMs<0||f.pendingAgeMs>=HARD_MS||
    t.approvalCommandCount||t.parsed_approval_decision_count||t.approvalResolvedCount||t.harness_cancel_command_count||t.app_close_started||
    f.executionStarted!==0||f.providerCalls!==1||f.transportCalls!==1||f.networkCalls||f.executorCalls||f.notepadCount)throw Error();
 }
 try{
  if(o.scenario!=='B')throw Error();await check();
  const at=now();let authorization;
  try{authorization=await bounded(o.authorize,Math.min(AUTH_MS,HARD_MS-elapsed()));}catch{authorization='timeout';}
  t.authorizationWindowBucket=authBucket(now()-at);
  t.localAuthorization=t.user_local_authorization=['granted','denied','timeout'].includes(authorization)?authorization:'denied';
  if(now()-at>=AUTH_MS)t.localAuthorization=t.user_local_authorization='timeout';
  if(t.localAuthorization!=='granted'){t.reason=t.localAuthorization==='timeout'?'authorization_timeout':'authorization_denied';throw Error();}
  phase='during_target_resolution';await check();t.reason='target_identity_unavailable';
  const targets=await bounded(o.resolve,budget());checkTime();await check();
  // Real controller must use the supplied guard immediately before its first OS termination.
  const guard=async()=>{checkTime();await check();checkTime();};
  await guard();
  const receipt=await o.crash(targets,{guard,markDispatch:()=>{checkTime();t.crash_started=true;},remainingMs:()=>HARD_MS-elapsed()});
  if(receipt?.executed!==true)throw Error();
  t.crash_started=true;t.crashExecuted=true;t.pendingToCrashBucket=crashBucket(elapsed());t.reason='crash_executed_while_pending';phase='after_crash';
  if(receipt.verified===false){t.reason='target_identity_unavailable';throw Error();}
  if(elapsed()>=HARD_MS){t.reason='deadline_exceeded';throw Error();}
  try{await o.verifyExit();}catch{t.reason='exit_verification_failed';throw Error();}
  t.profileClassification='eligible_for_recovery';
 }catch{
  // An uncertain partial crash is never retried or converted to a normal close.
  if(!t.crash_started){try{await o.close();t.app_close_started=true;}catch{/* retained for safe inspection */}}
 }
 if(!valid(t))throw Error('SAFE_GATE_RESULT_INVALID');await o.publish(Object.freeze({...t}));return t;
}
module.exports={AUTH_MS,TARGET_MS,HARD_MS,PRODUCT_MS,REASONS,INITIAL,valid,authBucket,crashBucket,bounded,localY,run};
