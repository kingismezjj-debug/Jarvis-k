// Test-only complete-line protocol. Nothing here imports an application or profile.
const readline = require('node:readline');
const crypto = require('node:crypto');
const {performance} = require('node:perf_hooks');
const RESULTS = Object.freeze(['granted','input_mismatch','input_eof','input_error',
  'authorization_timeout','aborted','tty_unavailable','foreground_unverified',
  'pending_state_changed','approval_command_observed','target_identity_failed']);
const used = new Set();
function challenge() {
  if (used.size === 10000) throw Error('CHALLENGE_EXHAUSTED');
  let n = crypto.randomInt(10000);
  while (used.has(n)) n = (n + 1) % 10000;
  used.add(n); return 'CRASH-B-' + String(n).padStart(4, '0');
}
function bucket(ms) { return ms < 15000 ? 'under_15s' : ms < 30000 ? '15_to_30s' : ms <= 45000 ? '30_to_45s' : 'over_45s'; }
function readLine({input=process.stdin,output=process.stdout,signal,timeoutMs=45000,
  expected=challenge(),calibration=false}={}) {
  return new Promise(resolve => {
    let rl, timer, settled=false, ended=false, bytes=0;
    const finish=(result,lineInputReceived=false,challengeMatched=false)=>{
      if(settled)return; settled=true; clearTimeout(timer);
      input.off('end',eof); input.off('error',error); input.off('data',limit);
      signal?.removeEventListener('abort',abort); rl?.close(); input.pause();
      resolve({ttyAvailable:input.isTTY===true&&output.isTTY===true,lineInputReceived,challengeMatched,result});
    };
    const eof=()=>{ended=true;finish('input_eof');},error=()=>finish('input_error'),abort=()=>finish('aborted');
    const limit=chunk=>{bytes+=Buffer.byteLength(chunk);if(bytes>256)finish('input_mismatch');};
    if(input.isTTY!==true||output.isTTY!==true)return finish('tty_unavailable');
    if(signal?.aborted)return finish('aborted');
    if(!/^CRASH-B-[0-9]{4}$/.test(expected))return finish('input_error');
    try {
      // terminal:false preserves normal console line discipline; never invokes setRawMode.
      input.once('end',eof); input.once('error',error); input.on('data',limit);
      rl=readline.createInterface({input,terminal:false,crlfDelay:Infinity});
      rl.on('error',error);
      rl.on('line',line=>{
        if(ended)return finish('input_eof');
        const match=line.trim()===expected;
        finish(match?'granted':'input_mismatch',true,match);
      });
      rl.once('close',()=>{if(!settled)finish('input_eof');});
      signal?.addEventListener('abort',abort,{once:true});
      timer=setTimeout(()=>finish('authorization_timeout'),Math.max(0,Math.min(45000,timeoutMs)));
      output.write((calibration?'独立终端校准：只测试键盘输入，不会启动或关闭任何应用。\n45秒内完整输入下列确认词并回车（严格大写）。\n':'Jarvis 的允许和拒绝按钮都不要点击。请用鼠标点击此测试终端。\n仅授权关闭隔离测试程序：45秒内完整输入下列确认词并回车（严格大写）。\n')+expected+'\n');
      input.resume();
    } catch { finish('input_error'); }
  });
}
async function authorize(options={}) {
  const now=options.now||(()=>performance.now()),at=now();
  const base={ttyAvailable:options.input ? options.input.isTTY===true&&options.output?.isTTY===true : process.stdin.isTTY===true&&process.stdout.isTTY===true,
    lineInputReceived:false,challengeMatched:false};
  const probe=options.foreground||require('./terminal-foreground.cjs').verified;
  const finish=r=>({...r,durationBucket:bucket(now()-at)});
  if(!base.ttyAvailable)return finish({...base,result:'tty_unavailable'});
  if(options.signal?.aborted)return finish({...base,result:'aborted'});
  let phase='foreground';
  try {
    const waitMs=Math.max(0,Math.min(10000,options.foregroundWaitMs??0));
    if(waitMs)(options.output||process.stdout).write('请用鼠标点击此测试终端，使其位于前台。等待机器核验后再输入确认词。Jarvis中的两个审批按钮都不要点击。\n');
    let verified=false;
    do {
      if(options.signal?.aborted)return finish({...base,result:'aborted'});
      verified=await probe({signal:options.signal,timeoutMs:1000})===true;
      if(verified||now()-at>=waitMs)break;
      await new Promise(resolve=>setTimeout(resolve,250));
    }while(now()-at<waitMs);
    if(!verified)return finish({...base,result:'foreground_unverified'});
    phase='input';
    const r=await readLine({...options,timeoutMs:Math.min(options.timeoutMs??45000,45000)-(now()-at)});
    phase='foreground';
    if(r.result==='granted'&&await probe({signal:options.signal,timeoutMs:1000})!==true)return finish({...r,result:'foreground_unverified'});
    if(r.result==='granted'&&now()-at>=Math.min(options.timeoutMs??45000,45000))return finish({...r,result:'authorization_timeout'});
    return finish(r);
  } catch {return finish({...base,result:options.signal?.aborted?'aborted':phase==='input'?'input_error':'foreground_unverified'});}
}
module.exports={RESULTS,challenge,bucket,readLine,authorize};
