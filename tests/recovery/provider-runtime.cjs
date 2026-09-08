// External bootstrap hooks only; the production recovery algorithm is called unchanged.
const M=require('./provider-mode.cjs');
function installCore(CoreRuntime,p,phase,mode) {
  M.validate(p.scenario,phase,mode);
  const fake=mode==='guarded_fake'?require('./provider.cjs').provider(p,phase,mode):undefined;
  const configure=CoreRuntime.prototype.configureChatAnswerProductMode;
  let configured=false;
  CoreRuntime.prototype.configureChatAnswerProductMode=function(input) {
    if(mode==='absent') {
      if(input?.provider || input?.options?.enabled===true) M.forbid(p,phase,mode,'violation');
      return configure.call(this,input || {});
    }
    if(!configured){M.record(p,phase,mode,'configured');configured=true;}
    return configure.call(this,{provider:fake,options:{enabled:true,providerId:'chat-answer.recovery-test'}});
  };
  return {beforeRecovery(runtime) {
    if(mode==='guarded_fake')runtime.configureChatAnswerProductMode();
    else if(runtime.chatAnswerProvider!==undefined || runtime.chatAnswer?.enabled===true)M.forbid(p,phase,mode,'violation');
  },afterRecovery(runtime) {
    if(mode==='absent' && (runtime.chatAnswerProvider!==undefined || runtime.chatAnswer?.enabled===true))M.forbid(p,phase,mode,'violation');
  }};
}
function installFactories(p,phase,mode) {
  M.validate(p.scenario,phase,mode);
  const deny=()=>M.forbid(p,phase,mode,'factory');
  // Even disabled production binding eagerly constructs a configurable provider.
  // This test-only binding has no provider and rejects every enable/configuration request.
  const restores=[];
  const binding=require('../../apps/core-host/dist/runtime-binding/chat-answer-runtime-binding.js'),originalBinding=binding.ChatAnswerRuntimeBinding;
  restores.push(()=>{binding.ChatAnswerRuntimeBinding=originalBinding;});
  binding.ChatAnswerRuntimeBinding=class {
    constructor(input){if(input.initialChatAnswerProvider||input.initialChatAnswerOptions?.enabled||input.activeChatAnswer||input.configurableChatAnswerProvider)deny();}
    applyProductModeConfiguration(input){if(input?.enabled)deny();return {};}
    applyProviderConfiguration(){deny();}
    dispose(){}
  };
  const modules=[
    ['../../apps/core-host/dist/composition/chat-composition.js',['ConfigurableChatAnswerProvider','LocalSmokeChatAnswerProvider','OneShotFixedUtteranceChatAnswerProvider']],
    ['../../packages/capabilities/dist/fixture-chat-answer-provider.js',['FixtureChatAnswerProvider']],
    ['../../packages/inference-adapter-openai-chat-answer/dist/openai-compatible.js',['OpenAiCompatibleFixtureChatAnswerProvider']],
    ['../../packages/inference-adapter-glm-chat-answer-runtime/dist/provider.js',['OpenAiCompatibleChatAnswerRuntimeProvider','FetchOpenAiCompatibleChatAnswerRuntimeTransport','GlmChatAnswerRuntimeProvider','FetchGlmChatAnswerRuntimeTransport','DeepseekChatAnswerRuntimeProvider','FetchDeepseekChatAnswerRuntimeTransport']],
  ];
  for(const [file,names] of modules){const m=require(file);for(const name of names){if(typeof m[name]!=='function')throw Error('PROVIDER_GUARD_UNAVAILABLE');
    const original=m[name];restores.push(()=>{m[name]=original;});
    m[name]=class {constructor(){M.forbid(p,phase,mode,name.includes('Transport')?'transport':'factory');}};
  }}
  return ()=>restores.reverse().forEach(restore=>restore());
}
function installStore(p,phase,mode) {
  const Store=require('../../apps/desktop/dist/secure-chat-answer-provider-store.js').SecureChatAnswerProviderStore;
  const restores=[];
  for(const method of ['save','savePublicConfiguration','setEnabled','replaceCredential','clear','writeStored']) {
    if(typeof Store.prototype[method]!=='function')throw Error('PROVIDER_GUARD_UNAVAILABLE');
    const original=Store.prototype[method];restores.push(()=>{Store.prototype[method]=original;});
    Store.prototype[method]=()=>M.forbid(p,phase,mode,'violation');
  }
  return ()=>restores.reverse().forEach(restore=>restore());
}
module.exports={installCore,installFactories,installStore};
