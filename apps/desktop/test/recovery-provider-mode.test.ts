import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {afterEach,describe,expect,it,vi} from 'vitest';
const require=createRequire(import.meta.url);
const P=require('../../../tests/recovery/profile.cjs'),M=require('../../../tests/recovery/provider-mode.cjs');
const R=require('../../../tests/recovery/provider-runtime.cjs'),S=require('../../../tests/recovery/state.cjs');
const D=require('../../../tests/recovery/diagnostics.cjs'),I=require('../../../tests/recovery/inspection.cjs');
const profiles:any[]=[],restores:Array<()=>void>=[];
const make=(scenario='C')=>{const p=P.create(scenario);profiles.push(p);return p;};
const begin=(p:any,phase='recovery',mode='absent')=>M.begin(p,phase,mode,'offline');
afterEach(()=>{for(const restore of restores.splice(0).reverse())restore();vi.restoreAllMocks();for(const p of profiles.splice(0))P.remove(p,()=>true);});
const safe=(v:any)=>expect(JSON.stringify(v)).not.toMatch(/endpoint|apiKey|Authorization|credential|[A-Z]:\\|"path"|"nonce"|"owner"|private|rawConfig/i);
function coreClass(){return class {chatAnswerProvider:any;chatAnswer:any;configureChatAnswerProductMode(input:any){this.chatAnswerProvider=input.provider;this.chatAnswer=input.options;}};}

describe('explicit provider policy and ownership',()=>{
 it.each(['A','B','C','D','E','F'])('%s recovery is explicitly absent',s=>{expect(M.select(s,'recovery')).toBe('absent');expect(()=>M.validate(s,'recovery','guarded_fake')).toThrow();});
 it('only B preparation maps to guarded_fake',()=>{expect(M.select('B','preparation')).toBe('guarded_fake');for(const s of ['A','C','D','E','F'])expect(()=>M.select(s,'preparation')).toThrow();});
 it.each([undefined,null,'','auto','unknown','ABSENT',{},'private'])('missing or invalid mode fails closed',mode=>{
  const p=make();expect(()=>P.environment(p,'recovery',mode)).toThrow();expect(()=>M.begin(p,'recovery',mode,'offline')).toThrow();
 });
 it('child mode is explicit and inherited environment cannot override it',()=>{
  const p=make();process.env.JARVIS_RECOVERY_TEST_PROVIDER_MODE='guarded_fake';
  try{expect(P.environment(p,'recovery','absent').JARVIS_RECOVERY_TEST_PROVIDER_MODE).toBe('absent');}finally{delete process.env.JARVIS_RECOVERY_TEST_PROVIDER_MODE;}
 });
 it.each(['mode','phase','owner','scenario','generation','schemaVersion','kind'])('rejects tampered launch %s',field=>{
  const p=make();begin(p);const file=path.join(p.control,'provider-launch.json'),v=JSON.parse(fs.readFileSync(file,'utf8'));
  v[field]=field==='schemaVersion'?2:'private';fs.writeFileSync(file,JSON.stringify(v));
  expect(()=>M.projection(p,'recovery','absent')).toThrow();
 });
 it('profile owner cannot add an arbitrary providerMode override',()=>{
  const p=make(),file=path.join(p.control,'owner.json'),bytes=fs.readFileSync(file),owner=JSON.parse(bytes.toString());
  fs.writeFileSync(file,JSON.stringify({...owner,providerMode:'guarded_fake'}));expect(()=>P.load(p.id)).toThrow();fs.writeFileSync(file,bytes);
 });
 it('inspection refuses missing or pending launch observations',()=>{
  const p=make();expect(()=>M.projection(p,'recovery','absent')).toThrow();begin(p);
  fs.writeFileSync(path.join(p.control,'provider-launch.json.pending'),'{');expect(()=>M.projection(p,'recovery','absent')).toThrow();
 });
});

describe('provider-free recovery and forbidden ports',()=>{
 it.each(['A','C','D','E','F'])('%s recovers twice without any provider configuration or instance',async scenario=>{
  const p=make(scenario);await S.seed(p);const Core=coreClass(),runtime=new Core();
  const factory=vi.spyOn(require('../../../tests/recovery/provider.cjs'),'provider').mockImplementation(()=>{throw Error('must not instantiate');});
  for(let n=0;n<2;n++){
   await S.recoverOffline(p);const hooks=R.installCore(Core,p,'recovery','absent');hooks.beforeRecovery(runtime);hooks.afterRecovery(runtime);
   const report=M.projection(p,'recovery','absent');expect(report).toEqual(M.empty('absent'));safe(report);
   expect((await I.inspect(p,n?'second_exit':'first_exit',{processState:()=>true})).verdict).toBe('PASS');
  }
  expect(factory).not.toHaveBeenCalled();expect(runtime.chatAnswerProvider).toBeUndefined();M.assertNoConfigurationFiles(p);
  expect(P.counts(p).recoveryProviderCalls).toBe(0);expect((await S.inspect(p)).quarantineCount).toBe(scenario==='F'?1:0);
 });
 it('absent fake factory and transport attempts fail before delegation',()=>{
  const p=make();begin(p);expect(()=>require('../../../tests/recovery/provider.cjs').provider(p,'recovery','absent')).toThrow();
  expect(()=>M.transport(p,'recovery','absent')).toThrow();
  expect(M.projection(p,'recovery','absent')).toMatchObject({providerInstantiated:false,providerFactoryCalls:1,providerTransportCalls:1});
 });
 it.each(['factory','transport','network'])('unexpected %s has an exact safe inspection failure',async kind=>{
  const p=make();await S.seed(p);await S.recoverOffline(p);expect(()=>M.forbid(p,'recovery','absent',kind)).toThrow();
  const r=await I.inspect(p,'first_exit',{processState:()=>true});
  expect(r.firstFailure).toMatchObject({assertion:'provider_'+kind+'_calls',expected:0,actual:1,stage:'first_exit',classification:'assertion_failed'});safe(r);
 });
 it('absent runtime rejects injected/enabled providers instead of registering them',()=>{
  const p=make();begin(p);const Core=coreClass(),runtime=new Core();R.installCore(Core,p,'recovery','absent');
  expect(()=>runtime.configureChatAnswerProductMode({provider:{},options:{enabled:true}})).toThrow();expect(runtime.chatAnswerProvider).toBeUndefined();
  expect(()=>M.projection(p,'recovery','absent')).toThrow();
 });
 it('production provider constructors and transports are guarded before construction',()=>{
  const p=make();begin(p);restores.push(R.installFactories(p,'recovery','absent'));
  const binding=require('../../core-host/dist/runtime-binding/chat-answer-runtime-binding.js');
  const b=new binding.ChatAnswerRuntimeBinding({});expect(b.applyProductModeConfiguration({enabled:false})).toEqual({});b.dispose();
  expect(M.projection(p,'recovery','absent').providerFactoryCalls).toBe(0);
  expect(()=>new (require('../../core-host/dist/composition/chat-composition.js').ConfigurableChatAnswerProvider)()).toThrow();
  expect(()=>new (require('../../../packages/inference-adapter-glm-chat-answer-runtime/dist/provider.js').FetchDeepseekChatAnswerRuntimeTransport)()).toThrow();
  expect(M.projection(p,'recovery','absent')).toMatchObject({providerFactoryCalls:1,providerTransportCalls:1,providerInstantiated:false});
 });
 it('all provider store mutations fail before writing a configuration file',()=>{
  const p=make();begin(p);restores.push(R.installStore(p,'recovery','absent'));
  const Store=require('../dist/secure-chat-answer-provider-store.js').SecureChatAnswerProviderStore;
  for(const method of ['save','savePublicConfiguration','setEnabled','replaceCredential','clear','writeStored'])expect(()=>Store.prototype[method].call({})).toThrow();
  M.assertNoConfigurationFiles(p);expect(()=>M.projection(p,'recovery','absent')).toThrow();
 });
 it('a planted configuration file fails inspection without reading or printing it',()=>{
  const p=make();begin(p);fs.writeFileSync(path.join(p.userData,'jarvis-k-chat-answer-test-provider.json'),'private');
  expect(()=>M.projection(p,'recovery','absent')).toThrow();
 });
});

describe('guarded fake preparation and safe projections',()=>{
 it('B preparation instantiates/configures once, proposes once, then recovery is entirely absent',async()=>{
  const p=make('B');begin(p,'preparation','guarded_fake');const Core=coreClass(),runtime=new Core();
  const hooks=R.installCore(Core,p,'preparation','guarded_fake');hooks.beforeRecovery(runtime);hooks.beforeRecovery(runtime);
  await runtime.chatAnswerProvider.startTextTurn({}, {tool:{turnId:'synthetic-turn',proposalId:'synthetic-proposal'}}).next();
  const report=M.projection(p,'preparation','guarded_fake');M.check(D.context('launch'),report,true);safe(report);
  expect(P.counts(p).preparationFakeProviderCalls).toBe(1);
  await expect(runtime.chatAnswerProvider.startTextTurn({}, {tool:{}}).next()).rejects.toThrow();
  begin(p,'recovery','absent');const EmptyCore=coreClass(),empty=new EmptyCore();const h=R.installCore(EmptyCore,p,'recovery','absent');h.beforeRecovery(empty);
  expect(M.projection(p,'recovery','absent')).toEqual(M.empty('absent'));expect(P.counts(p).recoveryProviderCalls).toBe(0);
 });
 it('a second fake factory and continuation cannot silently retry or fall back',async()=>{
  const p=make('B');begin(p,'preparation','guarded_fake');const factory=require('../../../tests/recovery/provider.cjs').provider;
  const fake=factory(p,'preparation','guarded_fake');expect(()=>factory(p,'preparation','guarded_fake')).toThrow();
  await expect(fake.continueTextTurn().next()).rejects.toThrow();expect(P.counts(p).recoveryProviderCalls).toBe(0);
 });
 it.each([{providerFactoryCalls:4097},{providerConfigured:'private'},{providerStatus:'private'},{endpoint:'private'},{providerMode:'unknown'}])('rejects unsafe projection values',patch=>{
  const value={...M.empty('absent'),...patch};expect(M.valid(value)).toBe(false);
  const ctx=D.context('first_exit');ctx.provider=value;expect(()=>D.result('C',ctx)).toThrow();
 });
});
