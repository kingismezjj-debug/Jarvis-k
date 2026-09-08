// Fixed counters only, isolated test controls. No command contents or timestamps.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),P=require('./profile.cjs');
const KEYS=['approval_command','parsed_approval_decision','harness_cancel','app_close'];
function directory(p){return P.canonical(path.join(P.load(p.id).control,'crash-observations'));}
function begin(p){if(p.scenario!=='B')throw Error();fs.mkdirSync(path.join(p.control,'crash-observations'));}
function record(p,key){if(!KEYS.includes(key))throw Error();const dir=directory(p);if(fs.readdirSync(dir).length>=128)throw Error();
 fs.writeFileSync(path.join(dir,crypto.randomBytes(12).toString('hex')+'.json'),JSON.stringify({key}),{flag:'wx'});}
function counts(p){const out=Object.fromEntries(KEYS.map(k=>[k,0]));const dir=directory(p),files=fs.readdirSync(dir);if(files.length>128)throw Error();
 for(const n of files){if(!/^[a-f0-9]{24}\.json$/.test(n))throw Error();const r=JSON.parse(fs.readFileSync(P.canonical(path.join(dir,n)),'utf8'));
 if(Object.keys(r).join()!=='key'||!KEYS.includes(r.key))throw Error();out[r.key]++;}return out;}
function installCore(Core,p){const handle=Core.prototype.handle;
 Core.prototype.handle=function(raw){const parsed=require('@jarvis-k/contracts').CommandEnvelopeSchema.safeParse(raw);
 if(parsed.success&&['agent.approveTask','agent.cancelTask'].includes(parsed.data.command.type)){record(p,'approval_command');record(p,'parsed_approval_decision');}
 return handle.call(this,raw);};
}
module.exports={KEYS,begin,record,counts,installCore};
