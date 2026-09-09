// Dedicated authorization window entry owns a NEW B preparation; never attaches to a retained profile.
import fs from 'node:fs';import path from 'node:path';import {performance} from 'node:perf_hooks';
import P from './profile.cjs';import State from './state.cjs';import I from './inspection.cjs';import D from './diagnostics.cjs';
import Exit from './exit-verifier.cjs';import Gate from './crash-gate.cjs';import O from './crash-observations.cjs';
import Controller from './crash-controller.cjs';import Modes from './provider-mode.cjs';
import Timeline from './crash-timeline.cjs';
import Window from './authorization-window.cjs';
import Monitor from './pending-monitor.cjs';
import Reader from './pending-reader.cjs';
function monitoring(running,reader,helperState){
 const p=running.p;
 let manifest;try{manifest=JSON.parse(fs.readFileSync(P.canonical(path.join(p.control,'processes.json')),'utf8'));Exit.validateManifest(manifest,p.nonce);}catch{throw Monitor.error('process_identity_query');}
 return Monitor.create({remaining:()=>Math.min(45000,75000-(performance.now()-running.pendingObservedAt)),
  fast:options=>reader.read(options),helper:async()=>helperState(),
  ui:async()=>running.page.evaluate(async()=>{const r=await window.jarvis.getSnapshot();if(!r.ok)throw Error();
   return r.data.assistantTurn?.status==='awaiting_approval'&&
    !!document.querySelector('[data-testid="assistant-native-approval"]')&&
    document.querySelector('[data-testid="assistant-tool-allow"]')?.disabled===false&&
    document.querySelector('[data-testid="assistant-tool-deny"]')?.disabled===false;}),
  process:async options=>{const rows=await Exit.queryRows(options);const {summary,knownChildren}=Exit.classify(manifest,rows,p.nonce);
   const identityValid=summary.identityCounts.matching_identity_active===manifest.entries.length&&knownChildren.length===0&&
    ['identity_unavailable','pid_reused_identity_mismatch','no_matching_process','child_of_matching_identity_active'].every(k=>summary.identityCounts[k]===0);
   return {identityValid,notepadCount:summary.notepadCount};}
 });
}
export async function authorizeCrash(args){
 const ctx=D.context('launch');ctx.check('scenario_classification_match',true,args.length===1&&args[0]==='B');
 const p=P.create('B');let running,reader,monitor,gateEntered=false;
 try{
  await State.seed(p);I.requirePass(await I.inspect(p,'prepare'));O.begin(p);
  reader=Reader.create(p.id);await reader.ready;
  running=await (await import('./desktop.mjs')).launch(p,'preparation');
  let targets,authorization,helperStatus='not_started';
  monitor=monitoring(running,reader,()=>helperStatus);
  gateEntered=true;
  const result=await Gate.run({scenario:'B',pendingAt:running.pendingObservedAt,now:()=>performance.now(),
   monitor,authorize:options=>{helperStatus='waiting';authorization=Window.authorize({...options,scenario:'B',owner:p.nonce});authorization.then(r=>{if(r.result==='granted')helperStatus='granted';},()=>{});return authorization;},
   finishAuthorization:()=>authorization,
   resolve:async options=>{targets=await Controller.resolveTargets(p,options);return targets;},
   crash:(t,options)=>Controller.terminate(p,t,options),
   verifyExit:async()=>{
    // H3 proves stable process absence; separate classification preserves abnormal-exit meaning.
    await Gate.bounded(()=>running.waitForLaunchExit(),15000);
    await running.finishExit();Exit.consume(p,'launch');
    const observed=O.counts(p);if(Object.values(observed).some(Boolean))throw Error();
   },close:()=>running.close(),checkpoint:t=>Timeline.checkpoint(p,t),
   finalCounters:()=>finalCounters(p),publish:t=>Timeline.publish(p,t)});
  // Safe output is diagnostic, never final acceptance evidence. Ownership stays in control metadata.
  return {schemaVersion:1,scenario:'B',verdict:result.profileClassification==='eligible_for_recovery'?'PASS':'FAIL',timeline:result,
   ...(result.profileClassification==='eligible_for_recovery'?{}:{firstFailure:result.firstFailure})};
 }catch(e){if(running&&!gateEntered){try{await running.close();}catch{}}throw new D.SafeFailure(D.safeFailure(e,'launch'));}
 finally{await monitor?.stop();await reader?.close();}
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
