// Test-only launch policy and bounded observations. Never a product provider/config store.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const MODES = Object.freeze(['absent','guarded_fake']);
const FIELDS = ['providerMode','providerConfigured','providerInstantiated','providerFactoryCalls','providerTransportCalls','providerNetworkCalls','providerStatus'];
const EVENTS = ['factory','instantiated','configured','transport','network','violation'];
const exact = (o, keys) => o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).sort().join('|') === [...keys].sort().join('|');
const bounded = n => Number.isInteger(n) && n >= 0 && n <= 4096;
function failure(name='provider_mode', actual='unavailable', expected=true) {
  return require('./diagnostics.cjs').failure(name,'launch','inspection_error',expected,actual);
}
function select(scenario, phase) {
  if (!['A','B','C','D','E','F'].includes(scenario) || !['preparation','recovery'].includes(phase) || phase === 'preparation' && scenario !== 'B') throw failure();
  return phase === 'preparation' ? 'guarded_fake' : 'absent';
}
function validate(scenario, phase, mode) {
  if (!MODES.includes(mode) || mode !== select(scenario,phase)) throw failure();
  return mode;
}
function empty(mode) {
  if (!MODES.includes(mode)) throw failure();
  return {providerMode:mode,providerConfigured:false,providerInstantiated:false,providerFactoryCalls:0,providerTransportCalls:0,providerNetworkCalls:0,providerStatus:'unconfigured'};
}
function valid(s) {
  return exact(s,FIELDS) && MODES.includes(s.providerMode) && typeof s.providerConfigured === 'boolean' && typeof s.providerInstantiated === 'boolean' &&
    ['providerFactoryCalls','providerTransportCalls','providerNetworkCalls'].every(k=>bounded(s[k])) && ['unconfigured','unavailable','available'].includes(s.providerStatus);
}
function read(file) {
  const P=require('./profile.cjs');
  if(fs.existsSync(file+'.pending') || fs.statSync(P.canonical(file)).size>8192) throw failure();
  return JSON.parse(fs.readFileSync(file,'utf8'));
}
function begin(p, phase, mode, kind) {
  const P=require('./profile.cjs'); p=P.load(p.id); validate(p.scenario,phase,mode);
  if(!['desktop','offline'].includes(kind)) throw failure();
  if(kind==='offline' && fs.existsSync(path.join(p.control,'ever-launched')))throw failure();
  const launch=kind==='desktop'?read(path.join(p.control,'exit-launch.json')):null;
  if(launch && (launch.owner!==p.nonce || launch.scenario!==p.scenario)) throw failure();
  const generation=launch?.generation || crypto.randomBytes(16).toString('hex');
  const audit={schemaVersion:1,owner:p.nonce,scenario:p.scenario,phase,mode,kind,generation};
  fs.mkdirSync(path.join(p.control,'provider-audit-'+generation));
  P.atomic(path.join(p.control,'provider-launch.json'),audit); return audit;
}
function current(p, phase, mode) {
  const P=require('./profile.cjs');p=P.load(p.id);validate(p.scenario,phase,mode);
  const a=read(path.join(p.control,'provider-launch.json'));
  if(!exact(a,['schemaVersion','owner','scenario','phase','mode','kind','generation']) || a.schemaVersion!==1 || a.owner!==p.nonce ||
    a.scenario!==p.scenario || a.phase!==phase || a.mode!==mode || !['desktop','offline'].includes(a.kind) || !/^[a-f0-9]{32}$/.test(a.generation)) throw failure();
  if(fs.existsSync(path.join(p.control,'ever-launched')) && a.kind!=='desktop')throw failure();
  if(a.kind==='desktop') {const l=read(path.join(p.control,'exit-launch.json'));if(l.generation!==a.generation || l.owner!==p.nonce || l.scenario!==p.scenario)throw failure();}
  return a;
}
function counts(p,a) {
  const P=require('./profile.cjs'),dir=P.canonical(path.join(p.control,'provider-audit-'+a.generation)),files=fs.readdirSync(dir);
  if(files.length>128) throw failure('provider_policy');
  const c=Object.fromEntries(EVENTS.map(k=>[k,0]));
  for(const file of files){if(!/^[a-f0-9]{24}\.json$/.test(file))throw failure();const e=read(path.join(dir,file));if(!exact(e,['kind'])||!EVENTS.includes(e.kind))throw failure();c[e.kind]++;}
  return c;
}
function record(p,phase,mode,kind) {
  const a=current(p,phase,mode),c=counts(p,a);if(!EVENTS.includes(kind)||Object.values(c).reduce((a,b)=>a+b,0)>=128)throw failure('provider_policy');
  fs.writeFileSync(path.join(p.control,'provider-audit-'+a.generation,crypto.randomBytes(12).toString('hex')+'.json'),JSON.stringify({kind}),{flag:'wx'});
}
function forbid(p,phase,mode,kind) {
  record(p,phase,mode,kind);throw failure('provider_policy');
}
function factory(p,phase,mode) {
  record(p,phase,mode,'factory');
  if(mode!=='guarded_fake'||phase!=='preparation'||p.scenario!=='B'||counts(p,current(p,phase,mode)).factory!==1)throw failure('provider_factory_calls');
}
function transport(p,phase,mode) {
  record(p,phase,mode,'transport');
  if(mode!=='guarded_fake'||phase!=='preparation'||p.scenario!=='B'||counts(p,current(p,phase,mode)).transport!==1)throw failure('provider_transport_calls');
}
function assertNoConfigurationFiles(p) {
  const P=require('./profile.cjs');let n=0;
  function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(++n>20000)throw failure();const f=P.canonical(path.join(dir,e.name));if(e.isDirectory())walk(f);else if(/(?:provider|credential).*\.json$/i.test(e.name))throw failure('provider_configuration_files');}}
  walk(p.userData);walk(p.localData);
}
function projection(p, phase, mode, {seed=false}={}) {
  const P=require('./profile.cjs');p=P.load(p.id);validate(p.scenario,phase,mode);assertNoConfigurationFiles(p);
  if(seed){if(fs.existsSync(path.join(p.control,'ever-launched'))||fs.existsSync(path.join(p.control,'provider-launch.json')))throw failure();return empty(mode);}
  const c=counts(p,current(p,phase,mode));
  if(c.violation || c.instantiated>1 || c.configured>1)throw failure('provider_policy');
  return {...empty(mode),providerConfigured:c.configured===1,providerInstantiated:c.instantiated===1,providerFactoryCalls:c.factory,providerTransportCalls:c.transport,providerNetworkCalls:c.network,providerStatus:c.configured?'available':'unconfigured'};
}
function check(ctx,s,configured) {
  if(!valid(s))throw failure();
  ctx.check('provider_configured',configured,s.providerConfigured);ctx.check('provider_instantiated',configured,s.providerInstantiated);
  ctx.check('provider_factory_calls',configured?1:0,s.providerFactoryCalls);ctx.check('provider_transport_calls',configured?1:0,s.providerTransportCalls);
  ctx.check('provider_network_calls',0,s.providerNetworkCalls);ctx.check('provider_status',configured?'available':'unconfigured',s.providerStatus);
}
module.exports={MODES,FIELDS,select,validate,empty,valid,begin,current,record,forbid,factory,transport,projection,check,assertNoConfigurationFiles};
