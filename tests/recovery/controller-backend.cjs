// Private bounded transport. No raw stderr/output escapes this module.
const cp=require('node:child_process'),path=require('node:path');const R=require('./controller-receipt.cjs');
function create(spec){let child,active,buffer='',poisoned=false,closed=false;
 function fail(category){poisoned=true;if(active){const a=active;active=null;a.reject({category});}}
 function receive(chunk){buffer+=chunk;if(buffer.length>8192){fail('unexpected_controller_error');return;}let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i).trim();buffer=buffer.slice(i+1);try{const r=JSON.parse(line);if(!active||typeof r.ok!=='boolean'||Object.keys(r).sort().join()!==(r.ok?'ok,value':r.startupCounts?'category,ok,startupCounts':'category,ok')||!r.ok&&!R.FAILURES.includes(r.category))throw Error();const a=active;active=null;r.ok?a.resolve(r.value):a.reject({category:r.category,...(r.startupCounts?{startupCounts:r.startupCounts}:{})});}catch{fail('unexpected_controller_error');}}}
 function request(op,arg,ms){if(poisoned||closed||active)return Promise.reject({category:'unexpected_controller_error'});return new Promise((resolve,reject)=>{let timer;const settle=fn=>v=>{clearTimeout(timer);fn(v);};active={resolve:settle(resolve),reject:settle(reject)};timer=setTimeout(()=>{fail('controller_budget_exhausted');void close();},ms);
  if(op==='open'){child=cp.spawn('powershell.exe',['-NoProfile','-NonInteractive','-File',path.join(__dirname,'crash-controller.ps1')],{windowsHide:true,stdio:['pipe','pipe','pipe']});child.stdout.setEncoding('utf8');child.stdout.on('data',receive);child.stderr.on('data',()=>fail('unexpected_controller_error'));child.on('error',()=>fail('unexpected_controller_error'));child.on('exit',()=>{closed=true;if(active)fail('unexpected_controller_error');});child.stdin.on('error',()=>fail('unexpected_controller_error'));child.stdin.write(JSON.stringify(spec)+'\n');}
  else child.stdin.write(JSON.stringify({op,...(Number.isInteger(arg)?{token:arg}:{}),...(op==='wait'?{ms:Math.max(1,Math.floor(ms-50))}:{})})+'\n');
 });}
 async function close(){if(!child||closed)return;child.stdin.end(JSON.stringify({op:'close'})+'\n');await new Promise(resolve=>{const timer=setTimeout(()=>{if(!closed)child.kill();resolve();},500);child.once('exit',()=>{clearTimeout(timer);resolve();});});}
 return Object.fromEntries([...['open','state','kill','wait','descendants','protected'].map(op=>[op,(arg,ms)=>request(op,arg,ms)]),['close',close],['activeCount',()=>child&&!closed?1:0]]);
}
module.exports={create};
