import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {afterEach,describe,expect,it,vi} from 'vitest';
const require=createRequire(import.meta.url),M=require('../../../tests/recovery/pending-monitor.cjs'),G=require('../../../tests/recovery/crash-gate.cjs');
const P=require('../../../tests/recovery/profile.cjs'),Reader=require('../../../tests/recovery/pending-reader.cjs');
const monitors:any[]=[],readers:any[]=[],profiles:any[]=[];
afterEach(async()=>{for(const m of monitors.splice(0))await m.stop();for(const r of readers.splice(0))await r.close();vi.useRealTimers();for(const p of profiles.splice(0))P.remove(p,()=>true);});
const facts=()=>({pending:true,taskAwaiting:true,pendingAgeMs:1000,taskCancelled:false,executionStarted:0,toolResults:0,approvalResolvedCount:0,approvalCommandCount:0,parsedApprovalDecisionCount:0,harnessCancelCount:0,appCloseStarted:false,providerCalls:1,transportCalls:1,networkCalls:0,executorCalls:0,notepadCount:0});
const safe=(v:any)=>expect(JSON.stringify(v)).not.toMatch(/secret|stack|credential|"pid"|"nonce"|"path"|[A-Z]:\\|payload|sql text/i);
function fixture(){let time=0;const f=facts();const d:any={fast:vi.fn(async({progress}:any)=>{for(const operation of Reader.FAST_OPS){progress({kind:'start',operation});progress({kind:'done',operation});}return {...f};}),ui:vi.fn(async()=>true),process:vi.fn(async()=>({identityValid:true,notepadCount:0})),helper:vi.fn(async()=> 'waiting'),now:()=>time,remaining:()=>45000};
 const make=()=>{const m=M.create({...d,fast:(...a:any[])=>d.fast(...a),ui:(...a:any[])=>d.ui(...a),process:(...a:any[])=>d.process(...a),helper:(...a:any[])=>d.helper(...a)});monitors.push(m);return m;};return {f,d,make,setTime:(n:number)=>{time=n;}};}
describe('H15 operation diagnostics and independent bounds',()=>{
 it.each(M.OPS)('fixed operation %s has timeout/error without raw data',async(op:string)=>{
  vi.useFakeTimers();const {d,make}=fixture();
  if(Reader.FAST_OPS.includes(op))d.fast=({progress}:any)=>{progress({kind:'start',operation:op});return new Promise(()=>{});};
  else if(op==='ui_projection_read')d.ui=()=>new Promise(()=>{});
  else if(op==='helper_state_read')d.helper=()=>new Promise(()=>{});
  else d.process=()=>new Promise(()=>{});
  const m=make(),p=m.complete().catch((e:any)=>e);await vi.advanceTimersByTimeAsync(2501);const e=await p;
  expect(e.failure.assertion).not.toBe('inspection_operation');expect(e.failure.stage).toBe('authorization_wait');expect(e.failure.actual).toBe('timeout');
  expect(M.validSummary(m.summary())).toBe(true);safe(m.summary());safe(e.failure);
  const failure=M.error(op,'error');expect(failure.failure.actual).toBe('error');expect(failure.monitorCause).toMatch(/_error$/);
 });
 it('process query preserves process_state_unavailable and precise timeout',async()=>{vi.useFakeTimers();const {d,make}=fixture();d.process=()=>new Promise(()=>{});const m=make(),p=m.complete().catch((e:any)=>e);await vi.advanceTimersByTimeAsync(2001);expect((await p).failure).toEqual({assertion:'pending_monitor_process_query',expected:'completed',actual:'timeout',stage:'authorization_wait',classification:'process_state_unavailable'});});
 it.each(['ui','process','helper','fast'])('%s error has no raw cause',async key=>{const {d,make}=fixture();d[key]=async()=>{throw Error('secret C:\\private stack');};const m=make();const e=await m.complete().catch((e:any)=>e);expect(e.failure.actual).toBe('error');safe(e.failure);safe(m.summary());});
 it('slow query does not block fast detection and queries never overlap',async()=>{
  vi.useFakeTimers();const {f,d,make}=fixture();const m=make();await m.complete();let active=0,max=0;
  d.process=async()=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,1500));active--;return {identityValid:true,notepadCount:0};};
  m.start();await vi.advanceTimersByTimeAsync(1100);f.approvalCommandCount=1;await vi.advanceTimersByTimeAsync(250);
  expect(m.primary().monitorCause).toBe('approval_command_observed');expect(max).toBe(1);expect(d.fast.mock.calls.length).toBeGreaterThan(3);
 });
 it('slow query completing between ticks cannot overlap next slow cycle',async()=>{vi.useFakeTimers();const {d,make}=fixture();let active=0,max=0;d.process=async()=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,1100));active--;return {identityValid:true,notepadCount:0};};const m=make();m.start();await vi.advanceTimersByTimeAsync(4500);expect(max).toBe(1);expect(m.primary()).toBe(null);});
 it.each([['pending',false,'pending_state_changed'],['executionStarted',1,'execution_started_observed'],['executorCalls',1,'executor_invocation_observed'],['networkCalls',1,'provider_network_observed'],['notepadCount',1,'notepad_observed']])('fast unsafe %s is rejected',async(key,value,cause)=>{const {f,make}=fixture();(f as any)[key as string]=value;const e=await make().complete().catch((e:any)=>e);expect(e.monitorCause).toBe(cause);});
 it('process unavailability cannot produce completed facts',async()=>{const {d,make}=fixture();d.process=async()=>({identityValid:false,notepadCount:0});await expect(make().complete()).rejects.toMatchObject({monitorCause:'process_query_error'});});
 it('cancellation is explicit',async()=>{const {make}=fixture();const m=make();m.cancel();await expect(m.complete()).rejects.toMatchObject({monitorCause:'monitor_cancelled'});});
 it('total fast deadline remains bounded across individually short operations',async()=>{vi.useFakeTimers();const {d,make}=fixture();d.fast=async({progress}:any)=>{for(const operation of Reader.FAST_OPS){progress({kind:'start',operation});await new Promise(r=>setTimeout(r,300));progress({kind:'done',operation});}return facts();};const m=make(),p=m.complete().catch((e:any)=>e);await vi.advanceTimersByTimeAsync(751);expect((await p).monitorCause).toBe('monitor_deadline_exceeded');});
 it('late completion after monotonic budget does not pass',async()=>{const {d,make,setTime}=fixture();d.ui=async()=>{setTime(800);return true;};await expect(make().complete()).rejects.toMatchObject({failure:{actual:'timeout'}});});
 it('missing operation receipt is unavailable rather than a successful snapshot',async()=>{const {d,make}=fixture();d.fast=async()=>facts();await expect(make().complete()).rejects.toMatchObject({monitorOperation:'assistant_journal_read'});});
 it('notepad result decoding failure names the Notepad operation',async()=>{const {d,make}=fixture();d.process=async()=>({identityValid:true,notepadCount:'unavailable'});await expect(make().complete()).rejects.toMatchObject({monitorOperation:'notepad_check'});});
 it('fast facts are refreshed after slow query before granting a complete check',async()=>{vi.useFakeTimers();const {f,d,make}=fixture();d.process=async()=>{await new Promise(r=>setTimeout(r,500));f.approvalCommandCount=1;return {identityValid:true,notepadCount:0};};const m=make(),p=m.complete().catch((e:any)=>e);await vi.advanceTimersByTimeAsync(501);expect((await p).monitorCause).toBe('approval_command_observed');expect(m.lastCounts().approvalCommandCount).toBe(1);});
 it('summary validation rejects unknown keys, classifications and unbounded attempts',()=>{for(const mutate of [(s:any)=>s.raw='secret',(s:any)=>s.helper_state_read.classification='secret',(s:any)=>s.helper_state_read.attemptCount=4097]){const s=M.blank();mutate(s);expect(M.validSummary(s)).toBe(false);}});
});
const grant=()=>({helperIdentityVerified:true,windowOwnerVerified:true,foregroundVerified:true,authorizationReceived:true,pipeConsumedCount:1,result:'granted',durationBucket:'under_15s'});
function gate(m:any,f:any){const o:any={scenario:'B',pendingAt:0,now:()=>0,monitor:m,authorize:async()=>grant(),resolve:vi.fn(async()=>({})),crash:vi.fn(async(_:any,c:any)=>{await c.guard();c.markDispatch();return {executed:true};}),verifyExit:vi.fn(),close:vi.fn(),checkpoint:vi.fn(),finalCounters:async()=>({...f}),publish:vi.fn()};return o;}
describe('H15 first failure, helper draining and final review',()=>{
 it('final complete review runs after authorization and H3 target resolution',async()=>{const {f,d,make}=fixture(),m=make(),o=gate(m,f);const order:string[]=[];o.authorize=async()=>{order.push('authorize');return grant();};o.resolve=async()=>{order.push('resolve');return {};};const original=d.fast;d.fast=async(x:any)=>{order.push('fast');return original(x);};const r=await G.run(o);expect(r.crashExecuted).toBe(true);expect(order.slice(order.indexOf('resolve')+1).filter(s=>s==='fast').length).toBeGreaterThanOrEqual(2);expect(r.helperFinalResult).toBe('granted');safe(r);});
 it('grant racing with unsafe fast facts cannot dispatch crash',async()=>{const {f,make}=fixture(),o=gate(make(),f);o.authorize=async()=>{f.approvalCommandCount=1;return grant();};const r=await G.run(o);expect(r.crashExecuted).toBe(false);expect(r.primaryFailure.actual).toBe('failed');expect(r.reason).toBe('approval_command_observed');expect(o.crash).not.toHaveBeenCalled();});
 it('monitor timeout survives helper cancellation and failed app cleanup',async()=>{
  vi.useFakeTimers();const {f,d,make}=fixture(),m=make(),o=gate(m,f);let helper:any;
  o.authorize=({signal}:any)=>(helper=new Promise(resolve=>{signal.addEventListener('abort',()=>resolve({result:'aborted'}));d.process=()=>new Promise(()=>{});}));o.finishAuthorization=()=>helper;
  o.close=async()=>{f.approvalResolvedCount=1;throw Error('secret');};
  const p=G.run(o);await vi.advanceTimersByTimeAsync(3100);const r=await p;
  expect(r.primaryFailure).toEqual(r.firstFailure);expect(r.firstFailure.actual).toBe('timeout');expect(r.helperFinalResult).toBe('aborted_by_monitor');expect(r.cleanupOutcome).toBe('failed');expect(r.firstFailureCounters.approvalResolvedCount).toBe(0);expect(r.finalCounters.approvalResolvedCount).toBe(1);expect(o.crash).not.toHaveBeenCalled();safe(r);
 });
 it('helper identity proof remains visible when monitor aborts afterward',async()=>{vi.useFakeTimers();const {f,make}=fixture(),o=gate(make(),f);let final:any;o.authorize=({signal}:any)=>(final=new Promise(resolve=>signal.addEventListener('abort',()=>resolve({...grant(),result:'aborted',authorizationReceived:false,pipeConsumedCount:0}))));o.finishAuthorization=()=>final;const p=G.run(o);await vi.advanceTimersByTimeAsync(10);f.approvalCommandCount=1;await vi.advanceTimersByTimeAsync(300);const r=await p;expect(r.helperFinalDiagnostics.helperIdentityVerified).toBe(true);expect(r.helperIdentityVerified).toBe(true);expect(r.helperFinalResult).toBe('aborted_by_monitor');expect(r.crashExecuted).toBe(false);});
 it('helper cleanup timeout is separate from primary failure',async()=>{vi.useFakeTimers();const {f,make}=fixture(),m=make(),o=gate(m,f);o.authorize=()=>new Promise(()=>{});o.finishAuthorization=()=>new Promise(()=>{});const p=G.run(o);await vi.advanceTimersByTimeAsync(10);f.approvalCommandCount=1;await vi.advanceTimersByTimeAsync(5500);const r=await p;expect(r.reason).toBe('approval_command_observed');expect(r.helperFinalResult).toBe('helper_cleanup_timeout');});
});
describe('H15 real offline worker, production exclusion',()=>{
 it('shared synthetic snapshot reads all fast operations with no provider/executor calls',async()=>{
  const State=require('../../../tests/recovery/state.cjs'),O=require('../../../tests/recovery/crash-observations.cjs'),Modes=require('../../../tests/recovery/provider-mode.cjs');
  const p=P.create('B');profiles.push(p);await State.seed(p);O.begin(p);Modes.begin(p,'preparation','guarded_fake','offline');
  for(const key of ['factory','instantiated','configured','transport'])Modes.record(p,'preparation','guarded_fake',key);P.count(p,'preparationFakeProviderCalls');
  const {tasks}=await State.repositories(p);await tasks.createTask({id:'synthetic-task',title:'Synthetic',state:'awaiting_confirmation',createdAt:State.now().toISOString(),updatedAt:State.now().toISOString()});
  for(const e of State.history('C').slice(0,3))await tasks.assistantTurns.append({...e,occurredAt:new Date().toISOString()});
  const r=Reader.create(p.id);readers.push(r);await r.ready;const ops:any[]=[];const result=await r.read({progress:(m:any)=>ops.push(m)});
  expect(result).toMatchObject({pending:true,taskAwaiting:true,executionStarted:0,toolResults:0,networkCalls:0,executorCalls:0});expect(ops.filter(m=>m.kind==='done').map(m=>m.operation)).toEqual(Reader.FAST_OPS);safe(result);
  const monitor=M.create({fast:(x:any)=>r.read(x),ui:async()=>true,process:async()=>({identityValid:true,notepadCount:0}),helper:async()=> 'waiting'});monitors.push(monitor);
  expect((await monitor.complete()).pending).toBe(true);
  Modes.record(p,'preparation','guarded_fake','network');Modes.record(p,'preparation','guarded_fake','violation');
  await expect(monitor.complete()).rejects.toMatchObject({monitorCause:'provider_network_observed'});
 });
 it('active B uses monitor; final H3 controller remains authoritative',()=>{const s=fs.readFileSync(path.join(P.REPO,'tests/recovery/authorize-crash.mjs'),'utf8');expect(s).toContain('Monitor.create');expect(s).toContain('Exit.classify');expect(s).toContain('Controller.resolveTargets');expect(s).toContain('Controller.terminate');expect(s).not.toContain('facts:options=>facts');});
 it('no production import or package entry for H15',()=>{const config=JSON.parse(fs.readFileSync(path.join(P.REPO,'package.json'),'utf8'));expect(JSON.stringify(config.build.files)).toContain('!tests/**');for(const dir of ['apps','packages']){const walk=(d:string)=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name==='node_modules'||e.name==='test')continue;const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(/[\\/]src[\\/].*\.[cm]?[jt]sx?$/.test(f))expect(fs.readFileSync(f,'utf8')).not.toMatch(/pending-monitor|pending-reader|pending-calibration/);}};walk(path.join(P.REPO,dir));}});
});

describe('H15 standalone calibration bounds and exclusions',()=>{
 it('one injected process read, safe output and no unavailable UI claims',async()=>{
  const {calibrate}=await import('../../../tests/recovery/pending-calibration.mjs');
  const query=vi.fn(async(_options:any)=>[{notepad:false}]);const r=await calibrate({query});
  expect(query).toHaveBeenCalledOnce();expect(query.mock.calls[0][0]).toEqual({timeoutMs:2000});
  expect(r).toHaveLength(11);expect(r.find((x:any)=>x.operation==='ui_projection_read')).toMatchObject({status:'error',recommendedTimeoutClass:'requires_isolated_live_target'});safe(r);
 });
 it('process timeout remains timeout without disclosing raw query error',async()=>{const {calibrate}=await import('../../../tests/recovery/pending-calibration.mjs');const r=await calibrate({query:async()=>{throw {category:'query_timeout',raw:'secret'};}});expect(r.find((x:any)=>x.operation==='process_identity_query').status).toBe('timeout');safe(r);});
 it('no profile or window launcher or action dependency in calibration',()=>{const s=fs.readFileSync(path.join(P.REPO,'tests/recovery/pending-calibration.mjs'),'utf8');expect(s).not.toMatch(/P\.create|P\.load|Window\.authorize|Controller\.terminate|desktop\.mjs/);});
});
