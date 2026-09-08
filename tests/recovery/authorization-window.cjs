// External harness only: one native helper, one local ACL-restricted pipe, no network listener.
const cp=require('node:child_process'),net=require('node:net'),path=require('node:path');
const {performance}=require('node:perf_hooks');
const P=require('./authorization-window-protocol.cjs');
const ERROR_CODES={2:'authorization_timeout',3:'helper_identity_failed',4:'helper_window_unverified',
 5:'helper_exit',6:'helper_not_foreground',7:'pipe_closed',8:'pipe_error',9:'nonce_mismatch',10:'scenario_mismatch',16:'aborted'};
function executable(){return path.join(process.env.SystemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe');}
function start(){return cp.spawn(executable(),['-NoLogo','-NoProfile','-NonInteractive','-STA','-File',path.join(__dirname,'authorization-window.ps1')],
 {windowsHide:true,stdio:['pipe','pipe','pipe']});}
function verify(ready,{signal,timeoutMs}){return new Promise(resolve=>{
 const child=cp.execFile(executable(),['-NoLogo','-NoProfile','-NonInteractive','-STA','-File',path.join(__dirname,'authorization-window.ps1'),'-Mode','Verify'],
 {windowsHide:true,encoding:'buffer',maxBuffer:128,timeout:Math.max(1,Math.min(5000,timeoutMs)),signal},
 (error,out)=>resolve(!error&&out.length===1?{helper:!!(out[0]&1),window:!!(out[0]&2),foreground:!!(out[0]&4)}:{helper:false,window:false,foreground:false}));
 child.stdin.on('error',()=>{});child.stdin.end(ready);
 });}
function connect(c){return net.createConnection({path:'\\\\.\\pipe\\jarvis-recovery-auth-'+c.instance.toString('hex')});}
async function authorize({scenario='B',owner,signal,timeoutMs=45000,onShown,dependencies={}}={}){
 const r=P.initial(),now=dependencies.now||(()=>performance.now()),at=now();
 if(scenario!=='B')return {...r,result:'scenario_mismatch'};
 if(signal?.aborted)return r;
 const c=P.context(owner),limit=Math.min(45000,timeoutMs),remaining=()=>Math.max(0,limit-(now()-at));
 const spawn=dependencies.start||start,probe=dependencies.verify||verify,open=dependencies.connect||connect;
 let child,socket,ready,stdout=Buffer.alloc(0),exited=false,exitCode,closed=false,decided=false,finishing=false,ackSent=false;
 let timer,cleanupTimer,settle,completion,probeController=new AbortController();
 const received=P.receiver(c);
 const grantComplete=()=>{if(!completion&&!finishing&&exited&&closed&&ackSent&&r.result==='granted'&&exitCode===0&&!received.failure){completion=true;publish();}};const stopSignal=()=>finish('aborted');
 const completed=new Promise(resolve=>{settle=resolve;});
 const publish=()=>{clearTimeout(timer);clearTimeout(cleanupTimer);signal?.removeEventListener('abort',stopSignal);probeController.abort();socket?.destroy();r.durationBucket=P.bucket(now()-at);if(!P.valid(r))r.result='pipe_error';settle(Object.freeze({...r}));};
 function finish(result){
  if(completion)return;
  // The first failure wins. A replay or late failure may revoke a provisional grant.
  if(!finishing||r.result==='granted')r.result=result;
  if(finishing)return;finishing=true;probeController.abort();clearTimeout(timer);
  child?.stdin.end();
  if(exited||!child){completion=true;publish();return;}
  cleanupTimer=setTimeout(()=>{if(r.result==='granted')r.result='helper_exit';completion=true;publish();},5000);
 }
 async function decision(d){
  if(finishing||decided)return;decided=true;r.pipeConsumedCount=received.consumed;
  if(d.result!=='granted'&&d.result!=='user_cancelled'){finish(d.result);return;}
  if(remaining()<=0){finish('authorization_timeout');return;}
  if(signal?.aborted){finish('aborted');return;}
  if(d.result==='user_cancelled'){socket.write(P.frame('A',c));finish('user_cancelled');return;}
  if(!d.windowOwnerVerified||!d.visible){finish('helper_window_unverified');return;}
  if(!d.foregroundVerified){finish('helper_not_foreground');return;}
  const actual=await probe(ready,{signal:probeController.signal,timeoutMs:remaining()});
  if(finishing)return;
  if(remaining()<=0){finish('authorization_timeout');return;}
  if(!actual.helper){finish('helper_identity_failed');return;}
  if(!actual.window){finish('helper_window_unverified');return;}
  if(!actual.foreground){finish('helper_not_foreground');return;}
  if(received.failure){finish(received.failure);return;}
  r.windowOwnerVerified=true;r.foregroundVerified=true;r.authorizationReceived=true;
  // Keep reading until the helper has acknowledged closure; a second frame revokes this grant.
  r.result='granted';ackSent=true;socket.write(P.frame('A',c));
 }
 async function capture(b){
  if(ready){finish('pipe_replay');return;}
  const error=P.binding(b,c,'R');if(error){finish(error);return;}
  if(b.readUInt32LE(56)!==child.pid||b.readUInt32LE(80)!==process.pid||b[6]!==0||b[7]!==0||b.subarray(92).some(Boolean)){finish('helper_identity_failed');return;}
  ready=b;const actual=await probe(ready,{signal:probeController.signal,timeoutMs:remaining()});
  if(finishing)return;
  if(!actual.helper){finish('helper_identity_failed');return;}
  if(!actual.window){finish('helper_window_unverified');return;}
  r.helperIdentityVerified=true;r.windowOwnerVerified=true;onShown?.();
  socket=open(c);
  socket.on('connect',()=>{if(finishing)return;socket.write(P.frame('H',c));});
  socket.on('data',chunk=>{if(finishing||completion)return;const d=received.push(chunk);r.pipeConsumedCount=received.consumed;
   if(!d)return;if(received.failure){finish(received.failure);return;}decision(d).catch(()=>finish('pipe_error'));
  });
  socket.on('error',()=>finish('pipe_error'));
  socket.on('end',()=>{closed=true;if(!decided)finish('pipe_closed');else grantComplete();});
  socket.on('close',()=>{closed=true;if(!decided&&!finishing)finish('pipe_closed');else grantComplete();});
 }
 try{
  if(!(limit>0)){finish('authorization_timeout');return await completed;}
  child=spawn();
  const init=P.frame('I',c);init.writeUInt32LE(process.pid,56);init.writeUInt32LE(Math.floor(limit),60);
  child.stdin.on('error',()=>finish('pipe_error'));
  child.stdout.on('data',chunk=>{
   if(stdout.length+chunk.length>P.SIZE*2){finish('pipe_error');return;}stdout=Buffer.concat([stdout,chunk]);
   while(stdout.length>=P.SIZE){const b=stdout.subarray(0,P.SIZE);stdout=stdout.subarray(P.SIZE);
    if(b[3]===69){const error=P.binding(b,c,'E');finish(error||ERROR_CODES[b[6]]||'pipe_error');}
    else capture(b).catch(()=>finish('helper_identity_failed'));
   }
  });
  child.stderr.on('data',()=>finish('helper_exit')); // never forward raw helper/compiler output
  child.on('error',()=>finish('helper_exit'));
  child.on('exit',code=>{exited=true;exitCode=code;if(code!==0&&r.result==='pipe_closed')r.result='helper_exit';
   if(r.result==='granted'&&code===0&&ackSent&&!received.failure){grantComplete();if(!completion)cleanupTimer=setTimeout(()=>finish('pipe_closed'),1000);}
   else if(finishing){completion=true;publish();}
   else finish('helper_exit');
  });
  signal?.addEventListener('abort',stopSignal,{once:true});
  timer=setTimeout(()=>finish('authorization_timeout'),limit);
  child.stdin.write(init);
 }catch{finish('helper_exit');}
 return await completed;
}
module.exports={authorize,verify,ERROR_CODES};
