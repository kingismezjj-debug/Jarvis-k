import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
const require = createRequire(import.meta.url);
const P = require('../../../tests/recovery/profile.cjs');
const State = require('../../../tests/recovery/state.cjs');
const Process = require('../../../tests/recovery/processes.cjs');
const D = require('../../../tests/recovery/diagnostics.cjs');
const I = require('../../../tests/recovery/inspection.cjs');
const E = require('../../../tests/recovery/exit-verifier.cjs');
const S = require('../../../tests/recovery/exit-summary.cjs');
const owned: any[] = [];
const make = () => { const p = P.create('D'); owned.push(p); return p; };
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); for (const p of owned.splice(0)) P.remove(p, () => true); });
const created = '2026-01-01T00:00:00.000Z';
const entry = (pid: number, role: string, parent = 10, nonce = 'test-owner') =>
  ({ pid, parent, created, executable: role === 'core_host' ? 'node.exe' : 'electron.exe', role, nonce });
const manifest = (nonce = 'test-owner') => ({ nonce, entries: [entry(10,'desktop_main',1,nonce),entry(11,'core_host',10,nonce),entry(12,'renderer',10,nonce),entry(13,'utility',10,nonce)] });
function virtual(samples: any[], options: any = {}) {
  let time = 0, attempts = 0; const seen: number[] = []; const timeouts: number[] = [];
  const query = async ({ timeoutMs }: any) => { timeouts.push(timeoutMs); seen.push(time); const sample = samples[Math.min(attempts++,samples.length-1)]; time += options.latency || 0; return sample; };
  return { manifest: manifest(), nonce: 'test-owner', stage: 'first_exit', query,
    now: () => time, pause: async (ms: number) => { time += ms; }, launchExitObserved: () => time >= (options.exitAt || 0),
    seen, timeouts, elapsed: () => time, ...options };
}
const safe = (value: any) => {
  const text = JSON.stringify(value);
  expect(text).not.toMatch(/test-owner|electron\.exe|node\.exe|2026-01|"pid"|"parent"|"created"|"nonce"|"path"|private|credential|rawCommand|stack/i);
};
async function failure(run: Promise<any>) { try { await run; throw Error('expected rejection'); } catch (e: any) { expect(e.failure?.assertion).toBe('process_exit_state'); safe(e.safeProcessSummary); return e; } }

describe('complete identity classification', () => {
  it('same PID with different creation/executable is reuse, not the original active identity', () => {
    for (const change of [{ created: '2026-02-01T00:00:00.000Z' }, { executable: 'other' }]) {
      const s = E.classify(manifest(),[{ ...manifest().entries[0], ...change }],'test-owner').summary;
      expect(s.roleCounts.desktop_main).toBe(0); expect(s.identityCounts.pid_reused_identity_mismatch).toBe(1); safe(s);
    }
  });
  it('parent number reuse cannot attach an unrelated child', () => {
    const m = manifest(), reused = { ...m.entries[0], created: '2026-02-01T00:00:00.000Z' };
    const s = E.classify(m,[reused,entry(99,'utility',10)],m.nonce).summary;
    expect(Object.values(s.roleCounts).every(v => v === 0)).toBe(true);
    expect(s.identityCounts.child_of_matching_identity_active).toBe(0);
  });
  it('tracks an unrecorded child only after matching the full parent, including after parent exit', () => {
    const m = manifest(), child = entry(99,'utility',10);
    const first = E.classify(m,[m.entries[0],child],m.nonce);
    expect(first.summary.identityCounts.child_of_matching_identity_active).toBe(1);
    const second = E.classify(m,[child],m.nonce,first.knownChildren);
    expect(second.summary.roleCounts.utility).toBe(1);
  });
  it('still recognizes captured CoreHost without its exited parent', () => {
    const m = manifest(); expect(E.classify(m,[m.entries[1]],m.nonce).summary.roleCounts.core_host).toBe(1);
  });
  it.each(['created','executable','parent'])('missing required %s fails closed', key => {
    const m = manifest(); const r = { ...m.entries[0], [key]: undefined };
    expect(E.classify(m,[r],m.nonce).summary.identityCounts.identity_unavailable).toBe(1);
  });
  it('does not silently accept changed parent with otherwise matching identity', () => {
    const m = manifest(); expect(E.classify(m,[{ ...m.entries[0],parent:999 }],m.nonce).summary.identityCounts.identity_unavailable).toBe(1);
  });
  it('rejects wrong manifest ownership, role, or parent identity graph', () => {
    for (const m of [{ ...manifest(),nonce:'other' },{ nonce:'test-owner',entries:[{ ...manifest().entries[0],role:'unknown' }] },
      { nonce:'test-owner',entries:[manifest().entries[0],{ ...manifest().entries[1],parent:999 }] }]) expect(() => E.classify(m,[],'test-owner')).toThrow();
  });
});

describe('strict monotonic deadline and stable samples', () => {
  it('an early timer wake cannot reduce the 200 ms interval', async () => {
    let time=0; const seen: number[]=[];
    const r=await E.sampleUntilStable(virtual([[]],{now:()=>time,query:async()=>{seen.push(time);return [];},pause:async(ms:number)=>{time+=Math.min(100,ms);}}));
    expect(r.stableSampleCount).toBe(3); expect(seen).toEqual([0,200,400]);
  });
  it.each(S.ROLES)('%s briefly remains then three stable zero samples pass', async (role: string) => {
    const e = manifest().entries.find((e: any) => e.role === role); const v = virtual([[e],[e],[],[],[]]);
    const result = await E.sampleUntilStable(v); expect(result.stableSampleCount).toBe(3); expect(result.queryAttempts).toBe(5);
    expect(v.seen.slice(1).every((t,i) => t-v.seen[i] >= 200)).toBe(true); safe(result);
  });
  it('requires launch exit signal before counting the three zero samples', async () => {
    const v = virtual([[]],{ exitAt:400 }); const r = await E.sampleUntilStable(v);
    expect(r.launchExitObserved).toBe(true); expect(r.queryAttempts).toBe(5);
  });
  it('resets stable count when a matching process reappears', async () => {
    const v = virtual([[],[],[manifest().entries[2]],[],[],[]]);
    expect((await E.sampleUntilStable(v)).queryAttempts).toBe(6);
  });
  it('continuous matching process fails at 15 seconds with its exact safe role', async () => {
    const v = virtual([[manifest().entries[1]]]); const e = await failure(E.sampleUntilStable(v));
    expect(v.elapsed()).toBe(15000); expect(e.safeProcessSummary.timeoutClassification).toBe('deadline_exceeded');
    expect(e.safeProcessSummary.roleCounts.core_host).toBe(1); expect(e.failure.classification).toBe('assertion_failed');
  });
  it('fewer than three zeros cannot pass before the deadline', async () => {
    const v = virtual([[]],{ latency:7400 }); const e = await failure(E.sampleUntilStable(v));
    expect(e.safeProcessSummary.stableSampleCount).toBeLessThan(3); expect(e.safeProcessSummary.timeoutClassification).toBe('deadline_exceeded');
    expect(v.timeouts[0]).toBe(15000); expect(v.timeouts[1]).toBe(7400);
  });
  it('identity reuse alone can still reach stable exit', async () => {
    const v = virtual([[{ ...manifest().entries[0], created:'2026-02-01T00:00:00.000Z' }]]);
    const r = await E.sampleUntilStable(v); expect(r.stableSampleCount).toBe(3); expect(r.identityCounts.pid_reused_identity_mismatch).toBe(1);
  });
  it('identity unavailable fails immediately without claiming a zero sample', async () => {
    const v = virtual([[{ ...manifest().entries[0],created:null }]]); const e = await failure(E.sampleUntilStable(v));
    expect(e.safeProcessSummary.identityCounts.identity_unavailable).toBe(1); expect(e.safeProcessSummary.queryAttempts).toBe(1);
  });
  it('Notepad presence prevents success despite zero matching application identities', async () => {
    const e=await failure(E.sampleUntilStable(virtual([[{...entry(99,'utility'),executable:'other',notepad:true}]])));
    expect(e.safeProcessSummary.notepadCount).toBe(1); expect(e.safeProcessSummary.stableSampleCount).toBe(0);
  });
  it('bounded diagnostic validation rejects extra identities, free text and oversized counts', () => {
    for(const s of [{...S.empty(),pid:10},{...S.empty(),timeoutClassification:'private raw error'},
      {...S.empty(),queryAttempts:4097},{...S.empty(),roleCounts:{...S.empty().roleCounts,desktop_main:-1}}]) {
      expect(S.valid(s)).toBe(false); expect(new D.SafeFailure(D.failure('process_exit_state','first_exit').failure,s).safeProcessSummary).toBeUndefined();
    }
  });
  it.each(['query_timeout','query_error','query_cancelled'])('%s is distinct and never forwards raw errors', async category => {
    const v = virtual([[]],{ query: async () => { throw { category, message:'private credential', stack:'private' }; } });
    const e = await failure(E.sampleUntilStable(v)); expect(e.safeProcessSummary.timeoutClassification).toBe(category);
  });
  it('aborts an indefinitely pending query at the total deadline', async () => {
    vi.useFakeTimers(); let signal: AbortSignal | undefined;
    const v = virtual([[]],{ query: ({signal:s}: any) => { signal=s; return new Promise(() => {}); } });
    const pending = failure(E.sampleUntilStable(v)); await vi.advanceTimersByTimeAsync(15000);
    const e = await pending; expect(signal?.aborted).toBe(true); expect(e.safeProcessSummary.timeoutClassification).toBe('query_timeout');
  });
  it('external cancellation aborts the query with a bounded category', async () => {
    const controller = new AbortController();
    const pending = failure(E.sampleUntilStable(virtual([[]],{ signal:controller.signal,query:()=>new Promise(()=>{}) })));
    controller.abort(); expect((await pending).safeProcessSummary.timeoutClassification).toBe('query_cancelled');
  });
  it('passes a remaining-budget timeout and cancellation to the actual inspector transport', async () => {
    const fn = vi.spyOn(cp,'execFile').mockImplementation((...args: any[]) => {
      expect(args[2].timeout).toBe(731); expect(args[2].signal).toBeDefined();
      args[3](null,'[]'); return {} as any;
    });
    expect(await E.queryRows({ timeoutMs:731.8,signal:new AbortController().signal })).toEqual([]); expect(fn).toHaveBeenCalledOnce();
  });
  it('missing executable metadata is unavailable rather than evidence of PID reuse', async () => {
    vi.spyOn(cp,'execFile').mockImplementation((...args: any[]) => {
      args[3](null,JSON.stringify([{ProcessId:10,ParentProcessId:1,created}])); return {} as any;
    });
    const rows=await E.queryRows({timeoutMs:100,signal:new AbortController().signal});
    const result=E.classify(manifest(),rows,'test-owner').summary;
    expect(result.identityCounts.identity_unavailable).toBe(1); expect(result.identityCounts.pid_reused_identity_mismatch).toBe(0);
  });
});

describe('one immutable exit result for finish, inspection and cleanup', () => {
  async function setup() {
    const p = make(); await State.seed(p); await State.recoverOffline(p);
    E.beginLaunch(p,'first_exit'); fs.writeFileSync(path.join(p.control,'launch.lock'),p.nonce); fs.writeFileSync(path.join(p.control,'ever-launched'),'yes');
    fs.writeFileSync(path.join(p.control,'processes.json'),JSON.stringify(manifest(p.nonce))); return p;
  }
  const options = () => { const v=virtual([[]]); return {query:v.query,now:v.now,pause:v.pause,launchExitObserved:()=>true}; };
  const stableFile = (p: any) => path.join(p.control,fs.readdirSync(p.control).find((n: string) => /^stable-exit-.*\.json$/.test(n)));
  it('writes stable result before releasing lock; inspect/cleanup reuse it without querying', async () => {
    const p = await setup(); const unlink = fs.unlinkSync; let released = false;
    vi.spyOn(fs,'unlinkSync').mockImplementation(file => {
      if (String(file) === path.join(p.control,'launch.lock')) {
        expect(fs.existsSync(stableFile(p))).toBe(true); expect(() => E.consume(p,'first_exit')).toThrow(); released=true;
      } return unlink(file);
    });
    const r = await E.verify(p,'first_exit',options()); expect(released).toBe(true); expect(Object.isFrozen(r)).toBe(true); safe(r);
    const query = vi.spyOn(Process,'rows').mockImplementation(() => { throw Error('must not sample'); });
    const check = await I.inspect(p,'first_exit'); expect(check.verdict).toBe('PASS'); expect(query).not.toHaveBeenCalled();
    expect(E.consume(p,'first_exit')).toEqual(r); expect(E.cleanupGuard(p)).toBe(true);
    P.remove(p,E.cleanupGuard); owned.splice(owned.indexOf(p),1);
  });
  it('failed verification keeps the launch lock and blocks cleanup', async () => {
    const p = await setup(); const v=virtual([[manifest(p.nonce).entries[1]]]);
    const e = await failure(E.verify(p,'first_exit',{query:v.query,now:v.now,pause:v.pause,launchExitObserved:()=>true}));
    expect(fs.existsSync(path.join(p.control,'launch.lock'))).toBe(true); expect(()=>E.cleanupGuard(p)).toThrow();
    const ctx=D.context('first_exit'); expect(()=>D.recordFailure(p,ctx,e)).toThrow();
    expect(D.readResult(p,'first_exit').safeProcessSummary.roleCounts.core_host).toBe(1);
  });
  it('missing stable result cannot fall back to an immediate process sample', async () => {
    const p=await setup(); fs.unlinkSync(path.join(p.control,'launch.lock'));
    const query=vi.spyOn(Process,'rows'); const r=await I.inspect(p,'first_exit');
    expect(r.verdict).toBe('FAIL'); expect(r.firstFailure.assertion).toBe('process_exit_state'); expect(query).not.toHaveBeenCalled();
  });
  it.each(['truncated','pending','version','stage','binding_scenario','binding_owner','generation','expired','manifest_changed'])('rejects %s result without fallback', async kind => {
    const p=await setup(); await E.verify(p,'first_exit',options());
    const file=stableFile(p), binding=file.replace(/\.json$/,'.binding');
    if(kind==='truncated') fs.writeFileSync(file,'{');
    if(kind==='pending') fs.writeFileSync(file+'.pending','{');
    if(kind==='version'||kind==='stage'){const r=JSON.parse(fs.readFileSync(file,'utf8'));r[kind==='version'?'schemaVersion':'stage']=kind==='version'?2:'second_exit';fs.writeFileSync(file,JSON.stringify(r));}
    if(['binding_scenario','binding_owner','generation'].includes(kind)){const b=JSON.parse(fs.readFileSync(binding,'utf8'));b[kind==='binding_scenario'?'scenario':kind==='binding_owner'?'owner':'generation']='wrong';fs.writeFileSync(binding,JSON.stringify(b));}
    if(kind==='manifest_changed'){const m=manifest(p.nonce);m.entries[0].parent=99;fs.writeFileSync(path.join(p.control,'processes.json'),JSON.stringify(m));}
    expect(()=>E.consume(p,'first_exit',kind==='expired'?{wallNow:()=>Date.now()+E.RESULT_TTL_MS+1}:{})).toThrow();
  });
  it('new launch invalidates previous receipt, while old published bytes stay immutable', async () => {
    const p=await setup(); await E.verify(p,'first_exit',options()); const file=stableFile(p),bytes=fs.readFileSync(file);
    E.beginLaunch(p,'second_exit'); expect(()=>E.consume(p,'first_exit')).toThrow(); expect(()=>E.consume(p,'second_exit')).toThrow();
    expect(fs.readFileSync(file)).toEqual(bytes); expect(()=>E.publishImmutable(file,{})).toThrow(); expect(fs.readFileSync(file)).toEqual(bytes);
  });
  it('publication is exclusive and pending/binding failure never releases lock', async () => {
    const p=await setup(); vi.spyOn(fs,'linkSync').mockImplementation(()=>{throw Error('private');});
    await failure(E.verify(p,'first_exit',options())); expect(fs.existsSync(path.join(p.control,'launch.lock'))).toBe(true);
    expect(()=>E.consume(p,'first_exit')).toThrow();
  });
  it('publication reaching the deadline leaves the lock held and the receipt unusable', async () => {
    const p=await setup(); const v=options(); const clock=v.now; let publicationDelay=0; const link=fs.linkSync;
    vi.spyOn(fs,'linkSync').mockImplementation((from,to)=>{link(from,to);publicationDelay=15000;});
    const error=await failure(E.verify(p,'first_exit',{...v,now:()=>clock()+publicationDelay}));
    expect(error.safeProcessSummary.timeoutClassification).toBe('deadline_exceeded');
    expect(fs.existsSync(path.join(p.control,'launch.lock'))).toBe(true); expect(()=>E.consume(p,'first_exit')).toThrow();
  });
});
