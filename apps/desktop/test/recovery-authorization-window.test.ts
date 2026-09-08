import fs from 'node:fs';import path from 'node:path';import {EventEmitter} from 'node:events';import {createRequire} from 'node:module';
import {afterEach,describe,expect,it,vi} from 'vitest';
const require=createRequire(import.meta.url),P=require('../../../tests/recovery/authorization-window-protocol.cjs'),W=require('../../../tests/recovery/authorization-window.cjs');
const G=require('../../../tests/recovery/crash-gate.cjs'),Root=require('../../../tests/recovery/profile.cjs');
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();});
const safe=(r:any)=>expect(JSON.stringify(r)).not.toMatch(/CRASH-B-|"pid"|"nonce"|"path"|timestamp|creation|handle|raw|secret|[A-Z]:\\/i);
function fake(){
 const child:any=new EventEmitter();child.pid=91001;child.stdout=new EventEmitter();child.stderr=new EventEmitter();
 const socket:any=new EventEmitter();let ctx:any,ready:any,closed=false;const emitted:any[]=[];
 const finish=()=>{if(closed)return;closed=true;queueMicrotask(()=>{socket.emit('end');socket.emit('close');child.emit('exit',0);});};
 const config:any={autoDecision:true,code:1,flags:7,mutate:(_:any)=>{},ack:'normal',handshake:()=>{},late:false};
 child.stdin=new EventEmitter();child.stdin.end=vi.fn(finish);child.stdin.write=(init:Buffer)=>{
  ctx={scenario:'B',nonce:Buffer.from(init.subarray(8,24)),owner:Buffer.from(init.subarray(24,40)),instance:Buffer.from(init.subarray(40,56))};
  ready=P.frame('R',ctx);ready.writeUInt32LE(child.pid,56);ready.writeUInt32LE(process.pid,80);
  queueMicrotask(()=>child.stdout.emit('data',ready));
 };
 function send(){const b=P.frame('M',ctx,config.code);b[7]=config.flags;config.mutate(b);socket.emit('data',b);}
 socket.write=vi.fn((b:Buffer)=>{emitted.push(b[3]);if(b[3]===72){config.handshake();if(config.autoDecision)queueMicrotask(send);}else if(b[3]===65){if(config.ack==='replay')send();else if(config.ack==='exit_first'){closed=true;child.emit('exit',0);queueMicrotask(()=>socket.emit('end'));}else finish();}});
 socket.destroy=vi.fn();
 const dependencies={start:vi.fn(()=>child),connect:vi.fn(()=>{queueMicrotask(()=>socket.emit('connect'));return socket;}),verify:vi.fn(async()=>({helper:true,window:true,foreground:true}))};
 return {child,socket,config,dependencies,send,emitted,get ready(){return ready;},get ctx(){return ctx;}};
}
describe('H10 fixed pipe protocol',()=>{
 it('only fixed authorize/cancel frames are accepted, fragmented reads supported',()=>{const c=P.context(),rx=P.receiver(c),b=P.frame('M',c,1);b[7]=7;expect(rx.push(b.subarray(0,20))).toBe(null);expect(rx.push(b.subarray(20))).toMatchObject({result:'granted'});expect(rx.consumed).toBe(1);});
 it.each([0,3,255])('rejects undefined decision %s',code=>{const c=P.context(),r=P.receiver(c);expect(r.push(P.frame('M',c,code)).result).toBe('pipe_error');});
 it.each([['scenario',5,'scenario_mismatch'],['nonce',8,'nonce_mismatch'],['ownership',24,'nonce_mismatch'],['instance',40,'nonce_mismatch']])('rejects altered %s',(_,offset,result)=>{const c=P.context(),b=P.frame('M',c,1);b[offset as number]^=1;expect(P.receiver(c).push(b).result).toBe(result);});
 it('rejects second message and coalesced replay',()=>{const c=P.context(),b=P.frame('M',c,1),r=P.receiver(c);r.push(b);expect(r.push(b).result).toBe('pipe_replay');expect(P.receiver(c).push(Buffer.concat([b,b])).result).toBe('pipe_replay');});
 it('rejects arbitrary raw content in reserved fields',()=>{const c=P.context(),b=P.frame('M',c,1);b[60]=1;expect(P.receiver(c).push(b).result).toBe('pipe_error');});
 it('safe result schema rejects extra internal identities and incomplete grants',()=>{expect(P.valid({...P.initial(),result:'granted'})).toBe(false);expect(P.valid({...P.initial(),pid:4})).toBe(false);});
});
describe('H10 isolated helper lifecycle uses only fake transport',()=>{
 it('authorizes once after independent identity/window/foreground checks and helper/pipe exit',async()=>{const f=fake(),r=await W.authorize({dependencies:f.dependencies});expect(r).toMatchObject({helperIdentityVerified:true,windowOwnerVerified:true,foregroundVerified:true,authorizationReceived:true,pipeConsumedCount:1,result:'granted'});expect(f.dependencies.verify).toHaveBeenCalledTimes(2);expect(f.socket.destroy).toHaveBeenCalled();safe(r);});
 it('pipe end after child exit is not a false helper failure',async()=>{const f=fake();f.config.ack='exit_first';expect((await W.authorize({dependencies:f.dependencies})).result).toBe('granted');});
 it('cancel button is user_cancelled',async()=>{const f=fake();f.config.code=2;f.config.flags=0;expect((await W.authorize({dependencies:f.dependencies})).result).toBe('user_cancelled');});
 it.each([['helper',false,'helper_identity_failed'],['window',false,'helper_window_unverified']])('initial %s mismatch fails before opening pipe',async(key,value,result)=>{const f=fake();f.dependencies.verify.mockResolvedValue({helper:true,window:true,foreground:true,[key as string]:value});const r=await W.authorize({dependencies:f.dependencies});expect(r.result).toBe(result);expect(f.dependencies.connect).not.toHaveBeenCalled();safe(r);});
 it.each([['helper',false,'helper_identity_failed'],['window',false,'helper_window_unverified'],['foreground',false,'helper_not_foreground']])('post-click %s mismatch prevents grant',async(key,value,result)=>{const f=fake();f.dependencies.verify.mockResolvedValueOnce({helper:true,window:true,foreground:true}).mockResolvedValueOnce({helper:true,window:true,foreground:true,[key as string]:value});expect((await W.authorize({dependencies:f.dependencies})).result).toBe(result);});
 it.each([[0,'helper_window_unverified'],[5,'helper_not_foreground']])('click attestation flags %# cannot bypass checks',async(flags,result)=>{const f=fake();f.config.flags=flags;expect((await W.authorize({dependencies:f.dependencies})).result).toBe(result);});
 it('foreign helper instance is rejected',async()=>{const f=fake();f.child.pid=123;f.child.stdin.write=((write:any)=>(b:Buffer)=>{write(b);f.ready.writeUInt32LE(987,56);})(f.child.stdin.write);expect((await W.authorize({dependencies:f.dependencies})).result).toBe('helper_identity_failed');});
 it.each([[5,'scenario_mismatch'],[8,'nonce_mismatch']])('bad pipe binding %# is accurately classified',async(offset,result)=>{const f=fake();f.config.mutate=(b:Buffer)=>{b[offset as number]^=1;};expect((await W.authorize({dependencies:f.dependencies})).result).toBe(result);});
 it('replay revokes a provisional grant before returning',async()=>{const f=fake();f.config.ack='replay';expect((await W.authorize({dependencies:f.dependencies})).result).toBe('pipe_replay');});
 it.each([['end','pipe_closed'],['error','pipe_error']])('pipe %s classification preserved',async(event,result)=>{const f=fake();f.config.autoDecision=false;f.config.handshake=()=>queueMicrotask(()=>f.socket.emit(event,Error('secret')));const r=await W.authorize({dependencies:f.dependencies});expect(r.result).toBe(result);safe(r);});
 it('unexpected helper exit is helper_exit',async()=>{const f=fake();f.config.autoDecision=false;f.config.handshake=()=>queueMicrotask(()=>f.child.emit('exit',17));expect((await W.authorize({dependencies:f.dependencies})).result).toBe('helper_exit');});
 it('45s timeout closes only its helper using EOF',async()=>{vi.useFakeTimers();const f=fake();f.config.autoDecision=false;const p=W.authorize({dependencies:f.dependencies});await vi.advanceTimersByTimeAsync(45000);expect((await p).result).toBe('authorization_timeout');expect(f.child.stdin.end).toHaveBeenCalled();});
 it('abort ignores even a valid late authorize message',async()=>{const f=fake(),c=new AbortController();f.config.autoDecision=false;f.config.handshake=()=>{c.abort();f.send();};const r=await W.authorize({signal:c.signal,dependencies:f.dependencies});expect(r.result).toBe('aborted');expect(r.authorizationReceived).toBe(false);expect(r.pipeConsumedCount).toBe(0);});
 it('unsupported scenario creates no helper',async()=>{const f=fake();expect((await W.authorize({scenario:'C',dependencies:f.dependencies})).result).toBe('scenario_mismatch');expect(f.dependencies.start).not.toHaveBeenCalled();});
 it.each(Object.entries(W.ERROR_CODES))('native safe diagnostic %s maps to %s',async(code,result)=>{const f=fake();f.config.autoDecision=false;f.config.handshake=()=>f.child.stdout.emit('data',P.frame('E',f.ctx,Number(code)));expect((await W.authorize({dependencies:f.dependencies})).result).toBe(result);});
});
describe('H10 governance monitor is shared, not duplicated',()=>{
 function fixture(){const f:any={nativeApproval:true,pending:true,pendingAgeMs:1000,taskCancelled:false,executionStarted:0,approvalCommandCount:0,approvalResolvedCount:0,harnessCancelCount:0,parsedApprovalDecisionCount:0,appCloseStarted:false,providerCalls:1,transportCalls:1,networkCalls:0,executorCalls:0,notepadCount:0};const w=fake();w.config.autoDecision=false;let p:any;
 const o:any={scenario:'B',pendingAt:performance.now(),facts:async()=>({...f}),authorize:(x:any)=>(p=W.authorize({...x,dependencies:w.dependencies})),finishAuthorization:()=>p,resolve:vi.fn(async()=>({})),crash:vi.fn(),verifyExit:vi.fn(),checkpoint:async()=>{},close:vi.fn(async()=>{}),finalCounters:async()=>f,publish:async()=>{}};return {f,w,o};}
 it.each([['pending',false,'pending_state_changed'],['approvalCommandCount',1,'approval_command_observed'],['executionStarted',1,'execution_started_observed']])('%s change aborts helper and forbids crash',async(key,value,result)=>{vi.useFakeTimers();const {f,w,o}=fixture();const p=G.run(o);await vi.advanceTimersByTimeAsync(5);f[key as string]=value;await vi.advanceTimersByTimeAsync(300);const r=await p;expect(r.localAuthorization).toBe(result);expect(w.child.stdin.end).toHaveBeenCalled();w.send();expect(o.crash).not.toHaveBeenCalled();expect(r.profileClassification).toBe('invalid_for_acceptance');safe(r);});
 it('crash target failure preserves specific process assertion',async()=>{const {w,o}=fixture();w.config.autoDecision=true;o.resolve=async()=>{throw Error();};const r=await G.run(o);expect(r.localAuthorization).toBe('target_identity_failed');expect(r.firstFailure.assertion).toBe('process_identity');expect(o.crash).not.toHaveBeenCalled();});
});
describe('H10 native source and production boundaries',()=>{
 const source=fs.readFileSync(path.join(Root.REPO,'tests/recovery/authorization-window-helper.cs'),'utf8');
 it('exact visible wording and two unambiguous controls',()=>{expect(source).toContain(P.TITLE);expect(source).toContain(P.BODY.replace(/\n/g,'\\n'));P.BUTTONS.forEach((b:string)=>expect(source).toContain(b));expect(source.match(/new Button\(\)/g)).toHaveLength(2);});
 it('no default authorize; keyboard requires explicit button focus; X/Esc cancel',()=>{expect(source).toContain('AcceptButton=null');expect(source).toContain('cancel.Focus()');expect(source).toContain('allow.Focused&&allow.Enabled');expect(source).toContain('key==Keys.Escape){Choose(2)');expect(source).toContain('e.Cancel=true;Choose(2)');});
 it('verifies complete process identity and native window ownership',()=>{for(const api of ['NtQueryInformationProcess','StartTime','SessionId','MainModule','OpenProcessToken','GetWindowThreadProcessId','IsWindowVisible','GetForegroundWindow'])expect(source).toContain(api);});
 it('same-user protected ACL, no remote client, first instance and authenticated client',()=>{expect(source).toContain('SetAccessRuleProtection(true,false)');expect(source).toContain('WindowsIdentity.GetCurrent().User');expect(source).toContain('0x40080003,8,1');expect(source).toContain('GetNamedPipeClientProcessId');expect(source).toContain('id==parent.Id');});
 it('helper never reads or sends input to Jarvis, and never accesses IPC or tools',()=>{expect(source).not.toMatch(/SendInput|SendKeys|PostMessage|GetWindowText|FindWindow|ApprovalService|ipcRenderer|sqlite|notepad\.exe|Process\.Start|\.Kill\(/i);});
 it('window selftest imports only its standalone authorization module',()=>{const s=fs.readFileSync(path.join(Root.REPO,'tests/recovery/authorization-window-selftest.mjs'),'utf8');expect(s).not.toMatch(/from .*?(?:profile|state|desktop|crash|provider)/);});
 it('active B path has no terminal/Y/challenge calibration dependency',()=>{const s=fs.readFileSync(path.join(Root.REPO,'tests/recovery/authorize-crash.mjs'),'utf8');expect(s).toContain('Window.authorize');expect(s).not.toMatch(/isTTY|challenge|terminal-foreground|authorization-input|await selftest/);});
});
