import fs from 'node:fs';import path from 'node:path';import {EventEmitter} from 'node:events';import {createRequire} from 'node:module';
import cp from 'node:child_process';
import {afterEach,describe,expect,it,vi} from 'vitest';
const require=createRequire(import.meta.url),G=require('../../../tests/recovery/crash-gate.cjs');
const P=require('../../../tests/recovery/profile.cjs'),O=require('../../../tests/recovery/crash-observations.cjs'),E=require('../../../tests/recovery/exit-verifier.cjs');
const profiles:any[]=[];
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();for(const p of profiles.splice(0))P.remove(p,()=>true);});
const facts=()=>({nativeApproval:true,pending:true,pendingAgeMs:1000,taskCancelled:false,executionStarted:0,
 approvalCommandCount:0,approvalResolvedCount:0,harnessCancelCount:0,parsedApprovalDecisionCount:0,appCloseStarted:false,
 providerCalls:1,transportCalls:1,networkCalls:0,executorCalls:0,notepadCount:0});
function fixture(){let time=0;const f=facts();const o:any={scenario:'B',pendingAt:0,now:()=>time,facts:vi.fn(async()=>({...f})),
 authorize:vi.fn(async()=>{time+=1000;return {result:'granted',challengeMatched:true};}),resolve:vi.fn(async()=>({fake:true})),
 crash:vi.fn(async(_t:any,guard:any)=>{await guard.guard();guard.markDispatch();return {executed:true};}),verifyExit:vi.fn(async()=>{}),
 close:vi.fn(async()=>{}),checkpoint:vi.fn(async()=>{}),finalCounters:vi.fn(async()=>({...f})),publish:vi.fn(async()=>{})};return {o,f,setTime:(n:number)=>{time=n;}};}
const redacted=(v:any)=>expect(JSON.stringify(v)).not.toMatch(/"pid"|"nonce"|"path"|timestamp|createdAt|"Authorization"|credential|rawInput|stack|secret|[A-Z]:\\/i);
describe('H6 bounded local authorization state machine',()=>{
 it.each(['A','C','D','E','F','unknown'])('rejects scenario %s',scenario=>{const {o}=fixture();o.scenario=scenario;return G.run(o).then((r:any)=>{expect(r.crashExecuted).toBe(false);expect(o.crash).not.toHaveBeenCalled();});});
 it.each([['nativeApproval',false],['pending',false],['executionStarted',1],['providerCalls',0],['providerCalls',2],['transportCalls',2],['networkCalls',1],['executorCalls',1],['notepadCount',1],['approvalCommandCount',1],['approvalResolvedCount',1],['harnessCancelCount',1],['parsedApprovalDecisionCount',1],['appCloseStarted',true]])('rejects unsafe %s=%s',async(k,v)=>{
  const {o,f}=fixture();(f as any)[k as string]=v;const r=await G.run(o);expect(r.profileClassification).toBe('invalid_for_acceptance');expect(o.authorize).not.toHaveBeenCalled();expect(o.crash).not.toHaveBeenCalled();redacted(r);
 });
 it('Challenge followed by fresh pending and identity checks invokes only injected fake crash',async()=>{
  const {o}=fixture();const r=await G.run(o);expect(r).toMatchObject({localAuthorization:'granted',crashExecuted:true,reason:'crash_executed_while_pending',profileClassification:'eligible_for_recovery'});
  expect(o.crash).toHaveBeenCalledOnce();expect(o.verifyExit).toHaveBeenCalledOnce();expect(o.close).not.toHaveBeenCalled();expect(o.facts.mock.calls.length).toBeGreaterThanOrEqual(4);redacted(r);
 });
 it.each(['input_mismatch','authorization_timeout','raw-secret'])('does not terminate after %s',async result=>{const {o}=fixture();o.authorize=async()=>({result});const r=await G.run(o);expect(r.crashExecuted).toBe(false);expect(o.close).toHaveBeenCalledOnce();expect(o.resolve).not.toHaveBeenCalled();redacted(r);});
 it('rejects late input at the 45 second boundary',async()=>{const {o,setTime}=fixture();o.authorize=async()=>{setTime(45000);return {result:'granted',challengeMatched:true};};expect((await G.run(o)).localAuthorization).toBe('authorization_timeout');expect(o.crash).not.toHaveBeenCalled();});
 it('rejects pending changing after authorization',async()=>{const {o,f}=fixture();o.authorize=async()=>{f.pending=false;f.taskCancelled=true;return {result:'granted',challengeMatched:true};};const r=await G.run(o);expect(r.cancellationTiming).toBe('during_target_resolution');expect(o.crash).not.toHaveBeenCalled();});
 it('rejects pending changing during target resolution',async()=>{const {o,f}=fixture();o.resolve=async()=>{f.pending=false;return {};};expect((await G.run(o)).crashExecuted).toBe(false);expect(o.crash).not.toHaveBeenCalled();});
 it('rejects identity resolution failure without retaining raw exception',async()=>{const {o}=fixture();o.resolve=async()=>{throw Error('secret C:\\private stack');};const r=await G.run(o);expect(r.reason).toBe('target_identity_unavailable');expect(o.crash).not.toHaveBeenCalled();redacted(r);});
 it('bounds hung target resolution and closes without killing',async()=>{vi.useFakeTimers();const {o}=fixture();o.resolve=()=>new Promise(()=>{});const promise=G.run(o);await vi.advanceTimersByTimeAsync(5001);const r=await promise;expect(r.crashExecuted).toBe(false);expect(o.close).toHaveBeenCalledOnce();});
 it.each([75000,76000])('75 second monotonic hard deadline rejects %s',async n=>{const {o,setTime}=fixture();o.resolve=async()=>{setTime(n);return {};};expect((await G.run(o)).reason).toBe('deadline_exceeded');expect(o.crash).not.toHaveBeenCalled();});
 it('60 seconds is a target, 60–75 is explicit bounded classification',async()=>{const {o,setTime}=fixture();o.resolve=async()=>{setTime(61000);return {};};expect((await G.run(o)).pendingToCrashBucket).toBe('60_to_75s');expect(G.TARGET_MS).toBe(60000);});
 it('cannot extend a product timeout based on a late UI observation',async()=>{const {o,f}=fixture();f.pendingAgeMs=120001;const r=await G.run(o);expect(r.product_timeout_window_reached).toBe(true);expect(r.reason).toBe('product_timeout_window_reached');expect(o.crash).not.toHaveBeenCalled();});
 it('refuses insufficient safety margin even before the product timeout',async()=>{const {o,f}=fixture();f.pendingAgeMs=75000;expect((await G.run(o)).crashExecuted).toBe(false);});
 it('records crash but never calls normal close after exit verification failure',async()=>{const {o}=fixture();o.verifyExit=async()=>{throw Error('secret');};const r=await G.run(o);expect(r.crashExecuted).toBe(true);expect(r.reason).toBe('exit_verification_failed');expect(r.profileClassification).toBe('invalid_for_acceptance');expect(o.close).not.toHaveBeenCalled();});
 it('uncertain partial termination cannot retry or fall back to normal close',async()=>{const {o}=fixture();o.crash=async(_t:any,c:any)=>{c.markDispatch();throw Error('secret');};const r=await G.run(o);expect(r.crash_started).toBe(true);expect(r.profileClassification).toBe('invalid_for_acceptance');expect(o.close).not.toHaveBeenCalled();});
 it('known partial termination is recorded as a side effect and never eligible',async()=>{const {o}=fixture();o.crash=async()=>({executed:true,verified:false});const r=await G.run(o);expect(r.crashExecuted).toBe(true);expect(r.profileClassification).toBe('invalid_for_acceptance');expect(o.close).not.toHaveBeenCalled();});
 it('final controller guard rejects a newly resolved decision',async()=>{const {o,f}=fixture();o.crash=async(_t:any,c:any)=>{f.approvalResolvedCount=1;await c.guard();throw Error('unreachable');};const r=await G.run(o);expect(r.crashExecuted).toBe(false);expect(r.reason).toBe('user_approval_decision_observed');expect(o.close).toHaveBeenCalledOnce();});
 it('app close observed during resolution prevents dispatch',async()=>{const {o,f}=fixture();o.resolve=async()=>{f.appCloseStarted=true;return {};};expect((await G.run(o)).reason).toBe('app_close_before_crash');expect(o.crash).not.toHaveBeenCalled();});
});
describe('safe diagnostics and existing product boundaries',()=>{
 it.each(['PID','nonce','path','timestamp','rawInput'])('rejects extra %s field',k=>expect(G.valid({...G.INITIAL,[k]:'private'})).toBe(false));
 it.each([-1,4097,NaN,Infinity,'0'])('rejects unbounded counter %s',n=>expect(G.valid({...G.INITIAL,approvalCommandCount:n})).toBe(false));
 it('immutable atomic timeline cannot overwrite or accept partial content',()=>{const p=P.create('B');profiles.push(p);const f=path.join(p.control,'crash-timeline.json');E.publishImmutable(f,G.INITIAL);expect(G.valid(JSON.parse(fs.readFileSync(f,'utf8')))).toBe(true);expect(()=>E.publishImmutable(f,G.INITIAL)).toThrow();expect(G.valid({schemaVersion:1})).toBe(false);});
 it('observation records contain only bounded enum keys',()=>{const p=P.create('B');profiles.push(p);O.begin(p);O.record(p,'approval_command');expect(O.counts(p).approval_command).toBe(1);expect(()=>O.record(p,'secret')).toThrow();redacted(O.counts(p));});
 it('only parsed native decisions are counted without saving envelopes',()=>{
  const p=P.create('B');profiles.push(p);O.begin(p);class Core{handle(_r:any){return 'delegated';}}O.installCore(Core,p);
  const C=require('@jarvis-k/contracts'),runtime=new Core();
  for(const type of ['agent.approveTask','agent.cancelTask'])runtime.handle({protocolVersion:C.PROTOCOL_VERSION,commandId:'synthetic-command',correlationId:'synthetic-correlation',createdAt:'2026-01-01T00:00:00.000Z',command:{type,payload:{taskId:'synthetic-task',...(type==='agent.approveTask'?{confirmation:'explicit_ui_confirmation'}:{})}}});
  runtime.handle({command:{type:'agent.approveTask',payload:'invalid'}});
  expect(O.counts(p)).toMatchObject({approval_command:2,parsed_approval_decision:2,harness_cancel:0});redacted(O.counts(p));
 });
 it('eligible timeline cannot hide an approval, cancellation or close',async()=>{
  const {o}=fixture(),t=await G.run(o);for(const [k,v] of Object.entries({approvalCommandCount:1,parsed_approval_decision_count:1,harness_cancel_command_count:1,app_close_started:true,crashExecuted:false}))expect(G.valid({...t,[k]:v})).toBe(false);
 });
 it('private binding rejects wrong ownership, tampering and pending timeline files',()=>{
  const T=require('../../../tests/recovery/crash-timeline.cjs'),p=P.create('B');profiles.push(p);const launch=E.beginLaunch(p,'launch');
  T.publish(p,G.INITIAL);P.atomic(path.join(p.control,'stable-exit-'+launch.generation+'.binding'),{owner:p.nonce,scenario:'B',stage:'launch',generation:launch.generation});
  expect(T.consume(p)).toEqual(G.INITIAL);const f=path.join(p.control,'crash-timeline.json');fs.writeFileSync(f+'.pending','{');expect(()=>T.consume(p)).toThrow();fs.unlinkSync(f+'.pending');
  fs.writeFileSync(f,JSON.stringify({...G.INITIAL,localAuthorization:'authorization_timeout'}));expect(()=>T.consume(p)).toThrow();
 });
 it('CLI rejects wrong scenarios before creating any profile',async()=>{const {authorizeCrash}=await import('../../../tests/recovery/authorize-crash.mjs');const before=fs.readdirSync(P.BASE).length;await expect(authorizeCrash(['C'])).rejects.toThrow();expect(fs.readdirSync(P.BASE).length).toBe(before);});
 it('product 120/130 second timers are unchanged and observers are external',()=>{
  expect(fs.readFileSync(path.join(P.REPO,'packages/core/src/bounded-notepad-task-service.ts'),'utf8')).toContain('}, 120000)');
  expect(fs.readFileSync(path.join(P.REPO,'packages/core/src/assistant-runtime.ts'),'utf8')).toContain('? 130000 : 1000');
  const src=fs.readFileSync(path.join(P.REPO,'tests/recovery/crash-controller.ps1'),'utf8');
  expect(src).toContain('$proc.Handle');expect(src).toContain('CreationDate');expect(src).toContain('ParentProcessId');expect(src).not.toMatch(/taskkill|Stop-Process|Kill\(\$true\)/);
 });
});

describe('controller interfaces use fake process transport only',()=>{
 function setup(){const p=P.create('B');profiles.push(p);const m={nonce:p.nonce,entries:[['desktop_main',10,1],['core_host',11,10],['renderer',12,10]].map(([role,pid,parent])=>({role,pid,parent,nonce:p.nonce,created:'2026-01-01T00:00:00.000Z',executable:role==='core_host'?'node.exe':'electron.exe'}))};P.atomic(path.join(p.control,'processes.json'),m);return {p,m,C:require('../../../tests/recovery/crash-controller.cjs')};}
 it('resolver and final controller validate before sending exact private identities to fake transport',async()=>{
  const {p,m,C}=setup();vi.spyOn(E,'queryRows').mockResolvedValue(m.entries);const sent:any[]=[];
  vi.spyOn(cp,'execFile').mockImplementation((...args:any[])=>{const callback=args[3];return {stdin:{on(){},end(s:string){const spec=JSON.parse(s);sent.push(spec);queueMicrotask(()=>callback(null,JSON.stringify({verified:true,executed:spec.terminate})));}}} as any;});
  const targets=await C.resolveTargets(p,{timeoutMs:1000});const guard=vi.fn(async()=>{});expect(await C.terminate(p,targets,{guard,markDispatch:()=>{},remainingMs:()=>1000})).toEqual({verified:true,executed:true});
  expect(guard).toHaveBeenCalledOnce();expect(sent.map(s=>s.terminate)).toEqual([false,true]);expect(sent.every(s=>s.entries.length===3&&s.nonce===p.nonce)).toBe(true);
 });
 it.each(['reuse','missing','new_child','notepad'])('rejects %s before any process controller',async kind=>{
  const {p,m,C}=setup();const rows=kind==='reuse'?[{...m.entries[0],created:'2026-01-02T00:00:00.000Z'},...m.entries.slice(1)]:kind==='missing'?m.entries.slice(1):kind==='new_child'?[...m.entries,{...m.entries[2],pid:13}]:[...m.entries,{...m.entries[2],pid:99,parent:2,notepad:true}];
  vi.spyOn(E,'queryRows').mockResolvedValue(rows);const exec=vi.spyOn(cp,'execFile').mockImplementation(()=>{throw Error('must not invoke');});await expect(C.resolveTargets(p,{timeoutMs:1000})).rejects.toThrow();expect(exec).not.toHaveBeenCalled();
 });
 it('final guard failure prevents even the fake termination transport',async()=>{const {p,m,C}=setup();const exec=vi.spyOn(cp,'execFile');await expect(C.terminate(p,{manifest:m},{guard:async()=>{throw Error();},remainingMs:()=>1000})).rejects.toThrow();expect(exec).not.toHaveBeenCalled();});
 it('unrelated identity change fails without touching another process',async()=>{const {m,C}=setup();vi.spyOn(E,'queryRows').mockResolvedValue([]);await expect(C.checkUnrelated({unrelated:m.entries})).rejects.toThrow();});
});
