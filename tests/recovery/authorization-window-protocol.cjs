// Test-only fixed binary protocol. Private frames never reach diagnostics or evidence.
const crypto=require('node:crypto');
const SIZE=96;
const RESULTS=Object.freeze(['granted','user_cancelled','authorization_timeout','helper_identity_failed',
 'helper_window_unverified','helper_not_foreground','helper_exit','pipe_closed','pipe_error','pipe_replay',
 'nonce_mismatch','scenario_mismatch','pending_state_changed','approval_command_observed',
 'execution_started_observed','target_identity_failed','aborted']);
const TITLE='Jarvis 恢复测试授权——不是应用操作审批';
const BODY='Jarvis窗口中的‘允许/拒绝’请勿点击。\n下面的按钮只授权测试工具关闭当前隔离测试实例，\n不会授权打开记事本或执行其他电脑操作。';
const BUTTONS=Object.freeze(['授权测试关闭','取消测试']);
function context(owner){if(owner!==undefined&&!/^[a-f0-9]{32}$/.test(owner))throw Error('SAFE_OWNER_INVALID');
 return {scenario:'B',nonce:crypto.randomBytes(16),owner:owner?Buffer.from(owner,'hex'):crypto.randomBytes(16),instance:crypto.randomBytes(16)};}
function frame(kind,c,code=0){if(!['I','R','H','M','A','X','E','S'].includes(kind)||c.scenario!=='B')throw Error('SAFE_FRAME_INVALID');
 const b=Buffer.alloc(SIZE);b.write('H10'+kind);b[4]=1;b[5]=66;b[6]=code;
 for(const [key,offset] of [['nonce',8],['owner',24],['instance',40]]){if(!Buffer.isBuffer(c[key])||c[key].length!==16)throw Error('SAFE_FRAME_INVALID');c[key].copy(b,offset);}
 return b;}
function binding(b,c,kind){if(!Buffer.isBuffer(b)||b.length!==SIZE||b.toString('ascii',0,4)!=='H10'+kind||b[4]!==1)return 'pipe_error';
 if(b[5]!==66||c.scenario!=='B')return 'scenario_mismatch';
 if(!crypto.timingSafeEqual(b.subarray(8,24),c.nonce)||!crypto.timingSafeEqual(b.subarray(24,40),c.owner)||!crypto.timingSafeEqual(b.subarray(40,56),c.instance))return 'nonce_mismatch';
 return null;}
function receiver(c){let buffer=Buffer.alloc(0),consumed=0,failure=null;
 return {push(chunk){if(failure)return {result:failure};if(consumed&&chunk.length){failure='pipe_replay';return {result:failure};}
   if(buffer.length+chunk.length>SIZE){failure='pipe_replay';return {result:failure};}
   buffer=Buffer.concat([buffer,chunk]);if(buffer.length<SIZE)return null;
   failure=binding(buffer,c,'M');if(failure)return {result:failure};
   if(![1,2].includes(buffer[6])||buffer[7]>7||buffer.subarray(56).some(Boolean)){failure='pipe_error';return {result:failure};}
   consumed=1;const r={result:buffer[6]===1?'granted':'user_cancelled',windowOwnerVerified:!!(buffer[7]&1),foregroundVerified:!!(buffer[7]&2),visible:!!(buffer[7]&4)};buffer=Buffer.alloc(0);return r;
 },get consumed(){return consumed;},get failure(){return failure;}};}
function initial(){return {helperIdentityVerified:false,windowOwnerVerified:false,foregroundVerified:false,authorizationReceived:false,pipeConsumedCount:0,result:'aborted',durationBucket:'under_15s'};}
function valid(r){const S=require('./authorization-startup.cjs');const keys=r&&Object.keys(r).sort().join();return r&&(keys===Object.keys(initial()).sort().join()||keys===Object.keys({...initial(),...S.fields()}).sort().join()&&S.valid(r))&&
 ['helperIdentityVerified','windowOwnerVerified','foregroundVerified','authorizationReceived'].every(k=>typeof r[k]==='boolean')&&
 [0,1].includes(r.pipeConsumedCount)&&RESULTS.includes(r.result)&&['under_15s','15_to_30s','30_to_45s','over_45s'].includes(r.durationBucket)&&
 (r.result!=='granted'||r.helperIdentityVerified&&r.windowOwnerVerified&&r.foregroundVerified&&r.authorizationReceived&&r.pipeConsumedCount===1);}
function bucket(ms){return ms<15000?'under_15s':ms<30000?'15_to_30s':ms<=45000?'30_to_45s':'over_45s';}
module.exports={SIZE,RESULTS,TITLE,BODY,BUTTONS,context,frame,binding,receiver,initial,valid,bucket};
