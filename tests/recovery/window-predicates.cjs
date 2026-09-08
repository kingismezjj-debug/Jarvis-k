// Test-only identity projection and bounded readiness sampling.
const {performance}=require('node:perf_hooks');
const KEYS=['processIdentity','isWindow','ownerQuerySucceeded','ownerMatches','visible','foreground','queryOutcome'];
const STATES=['not_reached','passed','failed','unavailable'];
const ERRORS=['window_handle_invalid','owner_query_failed','owner_mismatch','window_not_visible','window_query_timeout','window_query_error'];
const blank=()=>Object.fromEntries(KEYS.map(k=>[k,'not_reached']));
const proof=()=>({predicates:Object.fromEntries(KEYS.map(k=>[k,'passed'])),result:'passed'});
const queryFail=result=>({predicates:{...blank(),queryOutcome:'unavailable'},result});
function valid(p){return p&&Object.keys(p).sort().join()===KEYS.slice().sort().join()&&KEYS.every(k=>STATES.includes(p[k]));}
function decode(out){if(!Buffer.isBuffer(out)||out.length!==7||[...out].some(x=>x>3))return queryFail('window_query_error');return {predicates:Object.fromEntries(KEYS.map((k,i)=>[k,STATES[out[i]]])),result:'passed'};}
function failure(q,click=false){if(!q||!valid(q.predicates)||!['passed',...ERRORS,'aborted'].includes(q.result))return 'window_query_error';if(q.result!=='passed')return q.result;const p=q.predicates;if(p.queryOutcome!=='passed')return 'window_query_error';
 if(p.processIdentity!=='passed')return 'helper_identity_failed';if(p.isWindow==='failed')return 'window_handle_invalid';if(p.isWindow!=='passed')return 'window_query_error';
 if(p.ownerQuerySucceeded!=='passed')return 'owner_query_failed';if(p.ownerMatches!=='passed')return 'owner_mismatch';if(p.queryOutcome!=='passed')return 'window_query_error';if(p.visible!=='passed')return 'window_not_visible';if(click&&p.foreground!=='passed')return 'helper_not_foreground';return null;}
function fields(){return {windowHandleValid:false,windowOwnerQuerySucceeded:false,windowVisibleVerified:false,readinessSamples:0,readiness_verification:blank(),authorization_click_verification:blank()};}
function project(r,q,phase){if(!valid(q?.predicates))return;const p=q.predicates;r[phase]={...p};if(p.processIdentity==='passed')r.helperIdentityVerified=true;
 r.windowHandleValid=p.isWindow==='passed';r.windowOwnerQuerySucceeded=p.ownerQuerySucceeded==='passed';r.windowOwnerVerified=p.ownerMatches==='passed';r.windowVisibleVerified=p.visible==='passed';if(phase==='authorization_click_verification')r.foregroundVerified=p.foreground==='passed';}
async function sample(probe,ready,{signal,timeoutMs}){timeoutMs=Math.floor(timeoutMs);if(timeoutMs<1)return queryFail('window_query_timeout');let timer;const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
 try{return await Promise.race([Promise.resolve().then(()=>probe(ready,{signal:controller.signal,timeoutMs})).catch(()=>queryFail('window_query_error')),new Promise(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(queryFail('window_query_timeout'));},timeoutMs);}),new Promise(resolve=>{controller.signal.addEventListener('abort',()=>resolve(queryFail(signal?.aborted?'aborted':'window_query_timeout')),{once:true});if(signal?.aborted)controller.abort();})]);}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);controller.abort();}}
async function stable(probe,ready,{signal,timeoutMs=5000,now=()=>performance.now(),onSample=()=>{}}){const end=now()+Math.min(5000,timeoutMs);let streak=0,count=0,last=queryFail('window_query_timeout'),reason='window_query_timeout';
 while(now()<end&&count<64){if(signal?.aborted)return {query:last,result:'aborted',samples:count};if(end-now()<1)break;last=await sample(probe,ready,{signal,timeoutMs:Math.floor(end-now())});count++;onSample(last,count);reason=failure(last);
 if(now()>=end)return {query:last,result:reason||'window_query_timeout',samples:count};
 if(reason===null){streak++;if(streak===3)return {query:last,result:'passed',samples:count};}else{streak=0;if(reason!=='window_not_visible'&&reason!=='window_handle_invalid')return {query:last,result:reason,samples:count};}
 if(end-now()<150)break;await new Promise(resolve=>{const done=()=>{clearTimeout(t);signal?.removeEventListener('abort',done);resolve();};const t=setTimeout(done,150);signal?.addEventListener('abort',done,{once:true});});
 }
 return {query:last,result:signal?.aborted?'aborted':reason||'window_query_timeout',samples:count};}
function validFields(r){return ['windowHandleValid','windowOwnerQuerySucceeded','windowVisibleVerified'].every(k=>typeof r[k]==='boolean')&&Number.isInteger(r.readinessSamples)&&r.readinessSamples>=0&&r.readinessSamples<=64&&valid(r.readiness_verification)&&valid(r.authorization_click_verification)&&(r.result!=='granted'||r.windowHandleValid&&r.windowOwnerQuerySucceeded&&r.windowVisibleVerified&&r.readinessSamples>=3&&failure({predicates:r.readiness_verification,result:'passed'})===null&&failure({predicates:r.authorization_click_verification,result:'passed'},true)===null);}
module.exports={KEYS,STATES,ERRORS,blank,proof,queryFail,valid,decode,failure,fields,project,sample,stable,validFields};
