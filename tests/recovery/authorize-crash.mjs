// Dedicated authorization window entry owns a NEW B preparation; never attaches to a retained profile.
import fs from 'node:fs';import path from 'node:path';import {performance} from 'node:perf_hooks';
import P from './profile.cjs';import State from './state.cjs';import I from './inspection.cjs';import D from './diagnostics.cjs';
import Exit from './exit-verifier.cjs';import Gate from './crash-gate.cjs';import O from './crash-observations.cjs';
import Controller from './crash-controller.cjs';import Modes from './provider-mode.cjs';
import Timeline from './crash-timeline.cjs';
import Window from './authorization-window.cjs';
export async function facts(running,{timeoutMs=2000,signal}={}){
 const at=performance.now();
 const p=running.p;const ui=await running.page.evaluate(async()=>{const r=await window.jarvis.getSnapshot();
  if(!r.ok)throw Error();const s=r.data;return {native:s.assistantTurn?.status==='awaiting_approval'&&
   !!document.querySelector('[data-testid="assistant-native-approval"]')&&
   document.querySelector('[data-testid="assistant-tool-allow"]')?.disabled===false&&
   document.querySelector('[data-testid="assistant-tool-deny"]')?.disabled===false};}).catch(()=>{throw D.failure('native_approval_projection','launch','inspection_error');});
 const live=await Exit.queryRows({timeoutMs:Math.max(1,Math.min(2000,timeoutMs-(performance.now()-at))),signal});
 const SQL=(await import('sql.js')).default;const db=new (await SQL()).Database(fs.readFileSync(P.canonical(path.join(p.localData,'task-runtime.sqlite'))));
 try{
  const rows=db.exec('SELECT event_json FROM assistant_turn_events ORDER BY sequence')[0]?.values||[];if(rows.length>128)throw Error();
  const events=rows.map(r=>JSON.parse(r[0])),tasks=db.exec('SELECT state FROM tasks')[0]?.values||[];
  const decision=events.find(e=>e.type==='tool.decided');const c=P.counts(p),o=O.counts(p),m=Modes.projection(p,'preparation','guarded_fake');
  Modes.check(D.context('launch'),m,true);
  return {nativeApproval:ui.native,pending:events.length===3&&tasks.length===1&&tasks[0][0]==='awaiting_confirmation'&&decision?.data.decision==='requires_approval',
   pendingAgeMs:Date.now()-Date.parse(decision?.occurredAt),taskCancelled:tasks.some(r=>r[0]==='cancelled'),
   executionStarted:events.filter(e=>e.type==='execution.started').length,approvalResolvedCount:events.filter(e=>e.type==='approval.resolved').length,
   approvalCommandCount:o.approval_command,parsedApprovalDecisionCount:o.parsed_approval_decision,harnessCancelCount:o.harness_cancel,
   appCloseStarted:o.app_close>0,providerCalls:c.preparationFakeProviderCalls,transportCalls:m.providerTransportCalls,
   networkCalls:m.providerNetworkCalls,executorCalls:c.preparationExecutorCalls+c.recoveryExecutorCalls,
   notepadCount:Math.max(c.notepadObservedCount,live.filter(r=>r.notepad).length)};
 }finally{db.close();}
}
export async function authorizeCrash(args){
 const ctx=D.context('launch');ctx.check('scenario_classification_match',true,args.length===1&&args[0]==='B');
 const p=P.create('B');let running,gateEntered=false;
 try{
  await State.seed(p);I.requirePass(await I.inspect(p,'prepare'));O.begin(p);
  running=await (await import('./desktop.mjs')).launch(p,'preparation');
  let targets,authorization;
  gateEntered=true;
  const result=await Gate.run({scenario:'B',pendingAt:running.pendingObservedAt,now:()=>performance.now(),
   facts:options=>facts(running,options),authorize:options=>(authorization=Window.authorize({...options,scenario:'B',owner:p.nonce})),
   finishAuthorization:()=>authorization,
   resolve:async options=>{targets=await Controller.resolveTargets(p,options);return targets;},
   crash:(t,options)=>Controller.terminate(p,t,options),
   verifyExit:async()=>{
    // H3 proves stable process absence; separate classification preserves abnormal-exit meaning.
    await Gate.bounded(()=>running.waitForLaunchExit(),15000);
    await running.finishExit();Exit.consume(p,'launch');await Controller.checkUnrelated(targets);
    const observed=O.counts(p);if(Object.values(observed).some(Boolean))throw Error();
   },close:()=>running.close(),checkpoint:t=>Timeline.checkpoint(p,t),
   finalCounters:()=>finalCounters(p),publish:t=>Timeline.publish(p,t)});
  // Safe output is diagnostic, never final acceptance evidence. Ownership stays in control metadata.
  return {schemaVersion:1,scenario:'B',verdict:result.profileClassification==='eligible_for_recovery'?'PASS':'FAIL',timeline:result,
   ...(result.profileClassification==='eligible_for_recovery'?{}:{firstFailure:result.firstFailure})};
 }catch(e){if(running&&!gateEntered){try{await running.close();}catch{}}throw new D.SafeFailure(D.safeFailure(e,'launch'));}
}

// Final close counts are independent of the first-failure snapshot and do not require a live UI.
export async function finalCounters(p){
 const c=P.counts(p),o=O.counts(p),m=Modes.projection(p,'preparation','guarded_fake');
 const SQL=(await import('sql.js')).default;const db=new (await SQL()).Database(fs.readFileSync(P.canonical(path.join(p.localData,'task-runtime.sqlite'))));
 try{const rows=db.exec('SELECT event_json FROM assistant_turn_events ORDER BY sequence')[0]?.values||[];if(rows.length>128)throw Error();
 const events=rows.map(r=>JSON.parse(r[0]));return Gate.counts({approvalCommandCount:o.approval_command,approvalResolvedCount:events.filter(e=>e.type==='approval.resolved').length,
 harnessCancelCount:o.harness_cancel,parsedApprovalDecisionCount:o.parsed_approval_decision,executionStarted:events.filter(e=>e.type==='execution.started').length,
 providerCalls:c.preparationFakeProviderCalls,transportCalls:m.providerTransportCalls,networkCalls:m.providerNetworkCalls,
 executorCalls:c.preparationExecutorCalls+c.recoveryExecutorCalls,notepadCount:c.notepadObservedCount});}finally{db.close();}
}
