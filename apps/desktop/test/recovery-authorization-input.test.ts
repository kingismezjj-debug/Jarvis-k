import fs from 'node:fs';
import path from 'node:path';
import {PassThrough} from 'node:stream';
import {createRequire} from 'node:module';
import cp from 'node:child_process';
import {afterEach,describe,expect,it,vi} from 'vitest';
const require=createRequire(import.meta.url),Input=require('../../../tests/recovery/authorization-input.cjs');
const G=require('../../../tests/recovery/crash-gate.cjs'),D=require('../../../tests/recovery/diagnostics.cjs');
const P=require('../../../tests/recovery/profile.cjs'),F=require('../../../tests/recovery/terminal-foreground.cjs');
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
const expected='CRASH-B-4821';
function terminal(){const input:any=new PassThrough();input.isTTY=true;input.setRawMode=vi.fn();const output:any={isTTY:true,write:vi.fn()};return {input,output,expected};}
function facts(){return {nativeApproval:true,pending:true,pendingAgeMs:1000,taskCancelled:false,executionStarted:0,approvalCommandCount:0,approvalResolvedCount:0,harnessCancelCount:0,parsedApprovalDecisionCount:0,appCloseStarted:false,providerCalls:1,transportCalls:1,networkCalls:0,executorCalls:0,notepadCount:0};}
function fixture(){const f=facts();const o:any={scenario:'B',pendingAt:performance.now(),facts:vi.fn(async()=>({...f})),authorize:vi.fn(async()=>({helperIdentityVerified:true,windowOwnerVerified:true,foregroundVerified:true,authorizationReceived:true,pipeConsumedCount:1,result:'granted',durationBucket:'under_15s'})),resolve:vi.fn(async()=>({synthetic:true})),crash:vi.fn(async(_:any,c:any)=>{await c.guard();c.markDispatch();return require('../../../tests/recovery/controller-fixture.cjs').success();}),verifyExit:vi.fn(async()=>{}),checkpoint:vi.fn(async()=>{}),close:vi.fn(async()=>{}),finalCounters:vi.fn(async()=>({...f})),publish:vi.fn(async()=>{})};return {f,o};}
const safe=(r:any)=>expect(JSON.stringify(r)).not.toMatch(/CRASH-B-\d{4}|rawInput|secret|"pid"|"nonce"|"path"|timestamp|stack|credential|[A-Z]:\\/i);
describe('H8 complete-line input',()=>{
 it.each([expected+'\r\n',' '+expected+' \n',expected+'\n'])('matches complete trimmed uppercase line %#',async line=>{const t=terminal(),p=Input.readLine(t);t.input.write(line);expect(await p).toMatchObject({result:'granted',lineInputReceived:true,challengeMatched:true});expect(t.input.setRawMode).not.toHaveBeenCalled();});
 it.each(['crash-b-4821','CRASH-B-48','Y','y','yes','','CRASH-B-4821x','CRASH-B-4821 extra'])('rejects nonmatching complete line %#',async line=>{const t=terminal(),p=Input.readLine(t);t.input.write(line+'\n');const r=await p;expect(r.result).toBe('input_mismatch');safe(r);});
 it('waits for newline; a partial line is never authorization',async()=>{const t=terminal();let done=false;const p=Input.readLine(t).then((r:any)=>{done=true;return r;});t.input.write(expected);await Promise.resolve();expect(done).toBe(false);t.input.write('\n');expect((await p).result).toBe('granted');});
 it.each(['',expected])('EOF including an unterminated matching line is eof %#',async text=>{const t=terminal(),p=Input.readLine(t);t.input.end(text);expect((await p).result).toBe('input_eof');});
 it('stdin error stays input_error without raw exception',async()=>{const t=terminal(),p=Input.readLine(t);t.input.emit('error',Error('secret path stack'));const r=await p;expect(r.result).toBe('input_error');safe(r);});
 it('timeout is distinct and removes input listeners',async()=>{vi.useFakeTimers();const t=terminal(),p=Input.readLine(t);await vi.advanceTimersByTimeAsync(45000);expect((await p).result).toBe('authorization_timeout');expect(t.input.listenerCount('data')).toBe(0);});
 it.each([true,false])('abort signal has its own classification %#',async before=>{const t=terminal(),c=new AbortController();if(before)c.abort();const p=Input.readLine({...t,signal:c.signal});c.abort();expect((await p).result).toBe('aborted');});
 it.each(['input','output'])('missing %s TTY fails closed',async key=>{const t=terminal();(t as any)[key].isTTY=false;expect((await Input.readLine(t)).result).toBe('tty_unavailable');});
 it('oversized line is bounded and not echoed by the reader',async()=>{const t=terminal(),p=Input.readLine(t);t.input.write('secret'.repeat(60));expect((await p).result).toBe('input_mismatch');expect(JSON.stringify(t.output.write.mock.calls)).not.toContain('secret');});
 it('each challenge is unique within the gate process and matches the fixed schema',()=>{const values=Array.from({length:100},()=>Input.challenge());expect(new Set(values).size).toBe(100);values.forEach(v=>expect(v).toMatch(/^CRASH-B-[0-9]{4}$/));});
 it('foreground must be proven before reading input',async()=>{const t=terminal(),probe=vi.fn(async()=>false);const r=await Input.authorize({...t,foreground:probe});expect(r.result).toBe('foreground_unverified');expect(t.output.write).not.toHaveBeenCalled();safe(r);});
 it('foreground is checked again after a correct complete line',async()=>{const t=terminal(),probe=vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);const p=Input.authorize({...t,foreground:probe});await vi.waitFor(()=>expect(t.output.write).toHaveBeenCalled());t.input.write(expected+'\n');expect((await p).result).toBe('foreground_unverified');expect(probe).toHaveBeenCalledTimes(2);});
 it('calibration grants with fake console identity and complete line, returning only five safe fields',async()=>{const {selftest}=await import('../../../tests/recovery/authorize-input-selftest.mjs');const t=terminal(),p=selftest({...t,foreground:async()=>true});await vi.waitFor(()=>expect(t.output.write).toHaveBeenCalled());t.input.write(expected+'\n');const r=await p;expect(r.result).toBe('granted');expect(Object.keys(r).sort()).toEqual(['challengeMatched','durationBucket','lineInputReceived','result','ttyAvailable'].sort());safe(r);});
});
describe('H8 precise failure mapping and monitored approval',()=>{
 it.each([
  ['input_mismatch','local_authorization_input','challenge_match','input_mismatch'],
  ['input_eof','local_authorization_channel','open','eof'],
  ['input_error','local_authorization_channel','readable','input_error'],
  ['authorization_timeout','local_authorization_deadline','within_45s','expired'],
  ['aborted','local_authorization_channel','open','aborted'],
  ['tty_unavailable','local_authorization_channel','open','tty_unavailable'],
  ['foreground_unverified','local_authorization_foreground','verified','foreground_unverified'],
 ])('%s preserves the accurate first failure',async(result,assertion,expectedValue,actual)=>{
  const {o}=fixture();o.authorize=async()=>({result});const r=await G.run(o);
  expect(r.firstFailure).toEqual({assertion,expected:expectedValue,actual,stage:'launch',classification:'assertion_failed'});
  expect(r.nativeApprovalObserved).toBe(true);expect(r.localAuthorization).toBe(result);expect(o.crash).not.toHaveBeenCalled();safe(r);
 });
 it('authorization transport rejection is pipe_error, not timeout',async()=>{const {o}=fixture();o.authorize=async()=>{throw Error('secret');};expect((await G.run(o)).localAuthorization).toBe('pipe_error');});
 it.each([
  ['pending',false,'canonical_approval_state'],['approvalCommandCount',1,'approval_command_count'],
  ['executionStarted',1,'execution_started_count'],['executorCalls',1,'preparation_executor_count'],
  ['notepadCount',1,'notepad_observed_count'],['appCloseStarted',true,'application_close_state'],
  ['pendingAgeMs',120000,'crash_deadline'],
 ])('watcher stops input on %s',async(key,value,assertion)=>{
  vi.useFakeTimers();const {o,f}=fixture();let signal:any;o.authorize=({signal:s}:any)=>{signal=s;return new Promise(()=>{});};
  const p=G.run(o);await vi.advanceTimersByTimeAsync(1);(f as any)[key]=value;await vi.advanceTimersByTimeAsync(300);const r=await p;
  expect(r.firstFailure.assertion).toBe(assertion);expect(signal.aborted).toBe(true);expect(o.crash).not.toHaveBeenCalled();expect(o.close).toHaveBeenCalledOnce();
 });
 it('45 second timeout checkpoints close-start before normal close and keeps both counter snapshots',async()=>{
  vi.useFakeTimers();const {o,f}=fixture(),order:string[]=[];o.authorize=()=>new Promise(()=>{});
  o.checkpoint=async(t:any)=>{order.push('checkpoint');expect(t.app_close_started).toBe(true);expect(t.localAuthorization).toBe('authorization_timeout');expect(t.firstFailureCounters.approvalCommandCount).toBe(0);};
  o.close=async()=>{order.push('close');f.approvalResolvedCount=1;throw Error('secret');};
  const p=G.run(o);await vi.advanceTimersByTimeAsync(45001);const r=await p;
  expect(order).toEqual(['checkpoint','close']);expect(r.closeOutcome).toBe('failed');expect(r.localAuthorization).toBe('authorization_timeout');expect(r.firstFailureCounters.approvalResolvedCount).toBe(0);expect(r.finalCloseCounters.approvalResolvedCount).toBe(1);safe(r);
 });
 it('checkpoint failure is separate from close outcome and original input failure',async()=>{const {o}=fixture();o.authorize=async()=>({result:'input_eof'});o.checkpoint=async()=>{throw Error();};const r=await G.run(o);expect(r.failureCheckpoint).toBe('unavailable');expect(r.closeOutcome).toBe('succeeded');expect(r.firstFailure.actual).toBe('eof');});
 it('timeline publication failure never overwrites the inner failure or first counts',async()=>{const {o}=fixture();o.authorize=async()=>({result:'input_error'});o.publish=async()=>{throw Error('secret');};const r=await G.run(o);expect(r.timelinePublication).toBe('unavailable');expect(r.firstFailure.actual).toBe('input_error');expect(r.firstFailureCounters.approvalCommandCount).toBe(0);safe(r);});
 it('successful fake crash cannot be eligible without durable timeline publication',async()=>{const {o}=fixture();o.publish=async()=>{throw Error();};const r=await G.run(o);expect(r.crashExecuted).toBe(true);expect(r.profileClassification).toBe('invalid_for_acceptance');expect(r.firstFailure.assertion).toBe('inspection_result_write');});
 it('hung monitoring read is bounded and never mistaken for missing native approval',async()=>{vi.useFakeTimers();const {o}=fixture();o.authorize=()=>new Promise(()=>{});o.facts.mockImplementationOnce(async()=>facts()).mockImplementation(()=>new Promise(()=>{}));const p=G.run(o);await vi.advanceTimersByTimeAsync(751);const r=await p;expect(r.firstFailure.classification).toBe('inspection_error');expect(r.firstFailure.assertion).not.toBe('native_approval_projection');expect(o.crash).not.toHaveBeenCalled();});
 it('only a truly absent native projection reports false',async()=>{const {o,f}=fixture();f.nativeApproval=false;expect((await G.run(o)).firstFailure).toMatchObject({assertion:'native_approval_projection',actual:false});});
 it('outer H1 wrapper preserves the inner diagnostic',()=>{const e=G.inputFailure('input_eof');expect(D.safeFailure(e,'launch')).toEqual(e.failure);});
});
describe('H8 external-only wiring and foreground identity',()=>{
 it('selftest has no app/profile/database/provider/executor/termination dependencies',()=>{const s=fs.readFileSync(path.join(P.REPO,'tests/recovery/authorize-input-selftest.mjs'),'utf8');expect(s).not.toMatch(/from ['"].*(?:profile|state|desktop|controller|provider)/);const i=fs.readFileSync(path.join(P.REPO,'tests/recovery/authorization-input.cjs'),'utf8');expect(i).not.toMatch(/require\(['"].*(?:profile|state|desktop|controller|provider)/);});
 it('outer CLI forwards the gate firstFailure without a fake native assertion',()=>{const s=fs.readFileSync(path.join(P.REPO,'tests/recovery/authorize-crash.mjs'),'utf8');expect(s).toContain('firstFailure:result.firstFailure');expect(s).not.toContain("D.failure('native_approval_projection','launch','assertion_failed',true,false)");expect(s).not.toMatch(/Input.authorize|process.stdin.isTTY|authorize-input-selftest/);expect(s).toContain("Window.authorize({...options,scenario:'B',owner:p.nonce})");});
 it('probe output and subprocess error are strictly bounded booleans',async()=>{vi.spyOn(cp,'execFile').mockImplementation((...args:any[])=>{args[3](Error('secret'), 'verified');return {} as any;});expect(await F.verified()).toBe(false);});
 it('foreground compares live console membership and actual visible foreground handle, never window titles',()=>{const s=fs.readFileSync(path.join(P.REPO,'tests/recovery/terminal-foreground.ps1'),'utf8');expect(s).toContain('GetConsoleProcessList');expect(s).toContain('GetForegroundWindow');expect(s).toContain('IsWindowVisible');expect(s).not.toMatch(/GetWindowText|WindowTitle|Stop-Process|taskkill/);});
});
