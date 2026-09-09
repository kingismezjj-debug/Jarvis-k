// Private worker channel: one immutable SQLite byte snapshot per fast cycle.
// No product imports that initialize stores, and no writes to the inspected profile.
const {Worker,isMainThread,parentPort,workerData}=require('node:worker_threads');
const fs=require('node:fs'),path=require('node:path');
const M=require('./pending-monitor.cjs');
const FAST_OPS=['assistant_journal_read','canonical_approval_read','task_state_read','execution_count_read','approval_command_count_read','provider_counter_read','executor_counter_read'];
function create(profileId){
 const worker=new Worker(__filename,{workerData:{profileId},stdout:true,stderr:true});
 // Discard raw output; any such output invalidates the reader.
 let current,poisoned=null,closed=false,readyResolve,readyReject,readyTimer;const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
 readyTimer=setTimeout(()=>{readyReject(M.error('assistant_journal_read','timeout'));void close();},2000);
 function fail(e){poisoned=poisoned||e;if(current){const c=current;current=null;c.reject(e);}else readyReject(e);}
 worker.stdout.on('data',()=>fail(M.error('assistant_journal_read')));worker.stderr.on('data',()=>fail(M.error('assistant_journal_read')));
 worker.on('error',()=>fail(M.error(current?.active||'assistant_journal_read')));worker.on('exit',()=>{closed=true;fail(M.error(current?.active||'assistant_journal_read'));});
 worker.on('message',m=>{try{
  if(m?.kind==='ready'&&Object.keys(m).length===1&&!current){clearTimeout(readyTimer);readyResolve();return;}
  if(!current||!m||typeof m!=='object')throw Error();
  if(m.kind==='start'||m.kind==='done'){if(Object.keys(m).length!==2||!FAST_OPS.includes(m.operation))throw Error();current.active=m.operation;current.progress(m);return;}
  if(m.kind==='error'){if(Object.keys(m).length!==2||!FAST_OPS.includes(m.operation))throw Error();throw M.error(m.operation);}
  if(m.kind!=='result'||Object.keys(m).length!==2)throw Error();const c=current;current=null;c.resolve(m.facts);
 }catch(e){fail(e?.monitorCause?e:M.error(current?.active||'assistant_journal_read'));}});
 async function read({signal,progress}){await ready;if(poisoned)throw poisoned;if(closed||current||signal?.aborted)throw M.error('assistant_journal_read',signal?.aborted?'cancelled':'error');
  return new Promise((resolve,reject)=>{const abort=()=>{fail(M.error(current?.active||'assistant_journal_read','cancelled'));void close();};
   const settle=fn=>v=>{signal?.removeEventListener('abort',abort);fn(v);};current={resolve:settle(resolve),reject:settle(reject),progress,active:'assistant_journal_read'};
   signal?.addEventListener('abort',abort,{once:true});worker.postMessage({kind:'read'});
  });
 }
 async function close(){clearTimeout(readyTimer);if(closed)return;closed=true;fail(M.error(current?.active||'assistant_journal_read','cancelled'));await worker.terminate();}
 return {ready,read,close};
}
if(!isMainThread){
 (async()=>{
  const P=require('./profile.cjs'),O=require('./crash-observations.cjs'),Modes=require('./provider-mode.cjs');
  const {AssistantJournalEventSchema}=require('@jarvis-k/contracts');
  const p=P.load(workerData.profileId);if(p.scenario!=='B')throw Error();
  const SQL=await require('sql.js')();let busy=false;
  parentPort.postMessage({kind:'ready'});
  parentPort.on('message',m=>{let active='assistant_journal_read',db;const step=(op,fn)=>{active=op;parentPort.postMessage({kind:'start',operation:op});const value=fn();parentPort.postMessage({kind:'done',operation:op});return value;};
   try{if(busy||m?.kind!=='read'||Object.keys(m).length!==1)throw Error();busy=true;
    const events=step('assistant_journal_read',()=>{const f=P.canonical(path.join(p.localData,'task-runtime.sqlite'));if(fs.statSync(f).size>8*1024*1024)throw Error();db=new SQL.Database(fs.readFileSync(f));const rows=db.exec('SELECT event_json FROM assistant_turn_events ORDER BY sequence')[0]?.values||[];if(rows.length>128)throw Error();return rows.map(r=>AssistantJournalEventSchema.parse(JSON.parse(r[0])));});
    const approval=step('canonical_approval_read',()=>{const d=events.find(e=>e.type==='tool.decided');return {pending:events.length===3&&d?.data.decision==='requires_approval',pendingAgeMs:Date.now()-Date.parse(d?.occurredAt),approvalResolvedCount:events.filter(e=>e.type==='approval.resolved').length};});
    const task=step('task_state_read',()=>{const rows=db.exec('SELECT state FROM tasks')[0]?.values||[];if(rows.length>128)throw Error();return {taskAwaiting:rows.length===1&&rows[0][0]==='awaiting_confirmation',taskCancelled:rows.some(r=>r[0]==='cancelled')};});
    const execution=step('execution_count_read',()=>({executionStarted:events.filter(e=>e.type==='execution.started').length,toolResults:events.filter(e=>e.type==='tool.resulted').length}));
    const observations=step('approval_command_count_read',()=>O.counts(p));
    const provider=step('provider_counter_read',()=>{const s=Modes.monitorCounters(p);if(s.factory!==1||s.instantiated!==1||s.configured!==1||(s.violation&&s.network===0))throw Error();return s;});
    const c=step('executor_counter_read',()=>P.counts(p));
    parentPort.postMessage({kind:'result',facts:{...approval,...task,...execution,approvalCommandCount:observations.approval_command,parsedApprovalDecisionCount:observations.parsed_approval_decision,harnessCancelCount:observations.harness_cancel,appCloseStarted:observations.app_close>0,providerCalls:c.preparationFakeProviderCalls,transportCalls:provider.transport,networkCalls:provider.network,executorCalls:c.preparationExecutorCalls+c.recoveryExecutorCalls,notepadCount:c.notepadObservedCount}});
   }catch{parentPort.postMessage({kind:'error',operation:active});}finally{db?.close();busy=false;}
  });
 })().catch(()=>{parentPort.postMessage({kind:'error',operation:'assistant_journal_read'});parentPort.close();});
}
module.exports={create,FAST_OPS};
