// Standalone real-Windows synthetic experiment; never imported by product code.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rename,rm,symlink,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';
import {runHelper,liveHelpers,safeMessage} from './controller.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const report={stageId:'UI-3M-2B-B',hostOsArchitecture:'arm64',nodeArchitecture:process.arch,nodeVersion:process.version,electronStarted:false,architectures:[],cases:[],userFilesEnumerated:false,userFileContentsRead:false,realNetworkRequestSent:false,realWindowsActionPerformed:false};
if(process.platform!=='win32'){console.log(JSON.stringify({...report,classification:'not_verified'}));process.exit(1);}
const base=await mkdtemp(path.join(tmpdir(),'jarvis-handle-spike-'));
const ps=s=>spawnSync('powershell.exe',['-NoProfile','-EncodedCommand',Buffer.from(s,'utf16le').toString('base64')],{encoding:'utf8',windowsHide:true,timeout:10000});
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const attribute=(p,a)=>{const r=ps(`[IO.File]::SetAttributes(${quote(p)},[IO.FileAttributes]${a})`);assert.equal(r.status,0);};
const denied=p=>{const r=ps(`$p=${quote(p)};$a=Get-Acl -LiteralPath $p;$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User;$r=New-Object Security.AccessControl.FileSystemAccessRule($sid,'ListDirectory','Deny');$a.AddAccessRule($r);Set-Acl -LiteralPath $p -AclObject $a`);assert.equal(r.status,0);};
const restore=p=>ps(`$p=${quote(p)};$a=Get-Acl -LiteralPath $p;foreach($r in @($a.Access)){if($r.AccessControlType -eq 'Deny'){$a.RemoveAccessRuleSpecific($r)}};Set-Acl -LiteralPath $p -AclObject $a`);
const compiler=path.join(process.env.SystemRoot,'Microsoft.NET','Framework64','v4.0.30319','csc.exe');
let sentinel, fixtureCount=0;
async function fixture(){const f=await mkdtemp(path.join(base,'case-'));const root=path.join(f,'root');await mkdir(root);fixtureCount++;return{f,root};}
async function put(p){await writeFile(p,'synthetic');}
let exe, target, lastObservation;
async function test(name,body){let fixtureData;lastObservation=undefined;try{fixtureData=await fixture();await body(fixtureData);report.cases.push({target,name,result:'PASS'});if(!process.argv.includes('--arch-only'))console.log(JSON.stringify({kind:'test',target,name,result:'PASS'}));}catch(e){report.cases.push({target,name,result:e?.code==='EPERM'?'NOT_VERIFIED':'FAIL',classification:e?.code==='EPERM'?'permission_unavailable':'assertion_failed',...(lastObservation?{observation:lastObservation}:{})});}finally{if(fixtureData){try{await rm(fixtureData.f,{recursive:true,force:true});}catch{report.cases.push({target,name:'fixture_cleanup',result:'FAIL'});}}} }
const request=(root,extra={})=>({kind:'search',root,query:'match',maxResults:20,probe:'none',...extra});
const search=(root,extra={},options={})=>{const pending=runHelper(exe,base,request(root,extra),options);return pending.then(r=>{lastObservation={classification:r.classification,architecture:r.architecture,forced:r.forced};return r;});};
const completed=r=>{assert.equal(r.classification,'completed');assert.equal(r.helperExited,true);assert.equal(r.activeHelpers,0);assert.equal(r.counts.openHandles,0);};
const empty=(r,status)=>{assert.equal(r.classification,status);assert.equal(r.helperExited,true);assert.deepEqual(r.matches,[]);assert.equal(liveHelpers(),0);};
try{
  sentinel=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore',windowsHide:true});
  for(target of ['anycpu','x64']){
    exe=path.join(base,`SearchHandleHelper-${target}.exe`);
    const build=spawnSync(compiler,['/nologo','/target:exe',`/platform:${target}`,'/r:System.Web.Extensions.dll',`/out:${exe}`,path.join(here,'DirectoryHandleHelper.cs')],{encoding:'utf8',windowsHide:true,timeout:30000});
    if(build.status!==0){report.architectures.push({target,classification:'not_verified',build:'FAIL',compilerCategories:[...new Set((build.stdout??'').match(/CS[0-9]{4}/g)??[])]});continue;}
    const binary=await readFile(exe);const machine=binary.readUInt16LE(binary.readUInt32LE(0x3c)+4);assert.equal(machine,target==='x64'?0x8664:0x14c);
    await test('normal_unicode_types_case_insensitive',async({root})=>{
      await put(path.join(root,'MATCH-中文-😀.txt'));await mkdir(path.join(root,'match-dir'));await put(path.join(root,'match-dir','match-child.txt'));
      const r=await search(root);completed(r);assert.equal(r.matches.length,3);assert.equal(r.matches.find(m=>m.name==='match-dir').entryType,'directory');
      report.architectures.push({target,managedHost:target==='anycpu'?'installed_arm64_clr':'direct_executable',actualRuntime:r.architecture,emulation:r.architecture==='x64_on_arm64_emulation',classification:target==='x64'&&r.architecture==='arm64_native'?'not_verified':r.architecture==='arm64_native'?'arm64_native_verified':r.architecture==='x64_native'?'x64_native_verified':r.architecture==='x64_on_arm64_emulation'?'x64_on_arm64_emulation_verified':'not_verified',build:'PASS'});
    });
    if(process.argv.includes('--arch-only'))continue;
    for(const mode of ['missing','file','drive','unc','device','system'])await test(`root_${mode}`,async({root})=>{
      let p=root;if(mode==='missing')p=path.join(root,'missing');if(mode==='file'){p=path.join(root,'file');await put(p);}if(mode==='drive')p=path.parse(root).root;if(mode==='unc')p='\\\\invalid-synthetic-host\\share';if(mode==='device')p='\\\\?\\'+root;if(mode==='system')p=process.env.SystemRoot;
      const r=await search(p);assert.notEqual(r.classification,'completed');assert.deepEqual(r.matches,[]);
    });
    for(const type of ['junction','dir'])await test(`root_${type}`,async({f,root})=>{const link=path.join(f,'link');await symlink(root,link,type);empty(await search(link),'root_rejected');});
    for(const mode of ['rename','junction','delete'])await test(`opened_root_${mode}_same_handle`,async({f,root})=>{
      if(mode!=='delete')await put(path.join(root,'match-original.txt'));
      const other=path.join(f,'other');await mkdir(other);await put(path.join(other,'match-outside.txt'));
      const r=await search(root,{probe:'after_root_open'},{onCheckpoint:async(m,c)=>{if(mode==='delete')await rm(root,{recursive:true});else{await rename(root,path.join(f,'original'));if(mode==='junction')await symlink(other,root,'junction');}c.continue();}});
      if(mode==='delete'){assert.ok(['completed','identity_untrusted'].includes(r.classification));assert.deepEqual(r.matches,[]);}else{completed(r);assert.deepEqual(r.matches.map(x=>x.name),['match-original.txt']);}
    });
    for(const type of ['junction','dir','loop'])await test(`child_${type}_skipped`,async({f,root})=>{const other=path.join(f,'other');await mkdir(other);await put(path.join(other,'match-outside.txt'));await symlink(type==='loop'?root:other,path.join(root,'match-link'),type==='dir'?'dir':'junction');const r=await search(root);completed(r);assert.deepEqual(r.matches,[]);assert.equal(r.counts.visitedDirectories,1);});
    for(const mode of ['junction','identity','disappear'])await test(`before_child_open_${mode}`,async({f,root})=>{
      const p=path.join(root,'child');await mkdir(p);const other=path.join(f,'other');await mkdir(other);await put(path.join(other,'match-outside.txt'));let once=false;
      const r=await search(root,{probe:'before_child_open'},{onCheckpoint:async(m,c)=>{if(!once){once=true;await rename(p,path.join(f,'old'));if(mode==='junction')await symlink(other,p,'junction');if(mode==='identity')await mkdir(p);}c.continue();}});empty(r,'identity_untrusted');
    });
    await test('child_attributes_changed_before_open',async({root})=>{const child=path.join(root,'child');await mkdir(child);await put(path.join(child,'match-hidden'));const r=await search(root,{probe:'before_child_open'},{onCheckpoint:(m,c)=>{attribute(child,18);c.continue();}});empty(r,'identity_untrusted');});
    await test('file_identity_replaced_before_open',async({f,root})=>{const p=path.join(root,'match-file');await put(p);const r=await search(root,{probe:'before_child_open'},{onCheckpoint:async(m,c)=>{await rename(p,path.join(f,'old'));await put(p);c.continue();}});empty(r,'identity_untrusted');});
    await test('after_child_open_replacement_aba',async({f,root})=>{
      const p=path.join(root,'child');await mkdir(p);await put(path.join(p,'match-original.txt'));const other=path.join(f,'other');await mkdir(other);await put(path.join(other,'match-outside.txt'));let once=false;
      const r=await search(root,{probe:'after_child_open'},{onCheckpoint:async(m,c)=>{if(!once){once=true;await rename(p,path.join(f,'old'));await symlink(other,p,'junction');}c.continue();}});completed(r);assert.deepEqual(r.matches.map(x=>x.name),['match-original.txt']);
    });
    await test('root_replacement_stress_20',async({f,root})=>{await put(path.join(root,'match-original.txt'));const other=path.join(f,'other');await mkdir(other);await put(path.join(other,'match-outside.txt'));for(let i=0;i<20;i++){const old=path.join(f,'old');const r=await search(root,{probe:'after_root_open'},{onCheckpoint:async(m,c)=>{await rename(root,old);await symlink(other,root,'junction');c.continue();}});completed(r);assert.deepEqual(r.matches.map(x=>x.name),['match-original.txt']);await rm(root);await rename(old,root);}});
    for(const a of [2,4,6])for(const type of ['file','directory','junction'])await test(`attributes_${a}_${type}`,async({f,root})=>{
      const p=path.join(root,'match-hidden');if(type==='file')await put(p);else if(type==='directory'){await mkdir(p);await put(path.join(p,'match-secret'));}else{const other=path.join(f,'other');await mkdir(other);await put(path.join(other,'match-secret'));await symlink(other,p,'junction');}
      attribute(p,a|(type==='directory'?16:0));const r=await search(root);completed(r);assert.deepEqual(r.matches,[]);assert.equal(r.counts.visitedDirectories,1);
    });
    await test('unreadable_child',async({root})=>{const p=path.join(root,'child');await mkdir(p);await put(path.join(p,'match-secret'));try{denied(p);empty(await search(root),'identity_untrusted');}finally{restore(p);}});
    await test('max_results_20_ordinal',async({root})=>{for(let i=29;i>=0;i--)await put(path.join(root,`match-${String(i).padStart(2,'0')}`));const r=await search(root);completed(r);assert.equal(r.matches.length,20);assert.equal(r.truncated,true);assert.equal(r.matches[0].name,'match-00');assert.equal(r.matches[19].name,'match-19');});
    await test('entries_2000_hard_limit',async({root})=>{for(let i=0;i<2005;i++)await put(path.join(root,`match-${i}`));const r=await search(root);empty(r,'entry_limit');assert.equal(r.counts.scannedEntries,2000);});
    await test('directories_256_hard_limit',async({root})=>{for(let i=0;i<258;i++)await mkdir(path.join(root,`dir-${i}`));const r=await search(root);empty(r,'directory_limit');assert.equal(r.counts.visitedDirectories,256);});
    await test('depth_4',async({root})=>{let p=root;for(let i=0;i<6;i++){p=path.join(p,'child');await mkdir(p);await put(path.join(p,`match-${i}`));}const r=await search(root);completed(r);assert.equal(r.counts.visitedDirectories,5);assert.equal(r.matches.length,4);assert.equal(r.truncated,true);});
    await test('name_255_no_clipping',async({root})=>{const name='match'+ '字'.repeat(250);await put(path.join(root,name));const r=await search(root);completed(r);assert.equal(r.matches[0].name,name);});
    await test('name_256_os_rejected',async({root})=>{await assert.rejects(put(path.join(root,'x'.repeat(256))));});
    await test('relative_path_512',async({root})=>{let p=root;for(let i=0;i<3;i++){p=path.join(p,'a'.repeat(180));await mkdir(p);}empty(await search(root),'path_limit');});
    await test('payload_16k',async({root})=>{for(let i=0;i<20;i++)await put(path.join(root,'match'+String(i).padStart(2,'0')+'字'.repeat(245)));empty(await search(root),'payload_rejected');});
    for(const extra of [{query:''},{query:'x'.repeat(121)},{query:'a/b'},{query:'*'},{query:'a\n'},{query:'a.*'},{maxResults:21},{scopeToken:'synthetic'},{path:'synthetic'}])await test('strict_request_'+Object.keys(extra)[0]+'_'+report.cases.length,async({root})=>empty(await search(root,extra),'protocol_rejected'));
    await test('duplicate_request_key',async({root})=>empty(await search(root,{}, {rawRequest:JSON.stringify(request(root)).replace('\"query\":','\"query\":\"other\",\"query\":')}),'protocol_rejected'));
    await test('second_request_rejected',async({root})=>empty(await search(root,{probe:'before_enumeration'}, {rawRequest:JSON.stringify(request(root,{probe:'before_enumeration'}))+'\n'+JSON.stringify(request(root))}),'protocol_rejected'));
    await test('query_120_utf16',async({root})=>completed(await search(root,{query:'😀'.repeat(60)})));
    await test('oversized_request',async({root})=>empty(await search(root,{}, {rawRequest:'x'.repeat(5000)}),'protocol_rejected'));
    await test('prestart_cancel',async({root})=>{const r=await search(root,{}, {preCancelled:true});empty(r,'cancelled');assert.equal(r.spawned,false);});
    for(const point of ['before_enumeration','during_enumeration','after_result','uncooperative','stuck'])await test(`cancel_${point}_exit_handles_cleanup`,async({f,root})=>{
      await put(path.join(root,'match'));const r=await search(root,{probe:point},{onCheckpoint:(m,c)=>c.cancel()});empty(r,'cancelled');if(['uncooperative','stuck'].includes(point))assert.equal(r.forced,true);const moved=path.join(f,'moved');await rename(root,moved);await rm(moved,{recursive:true});assert.equal(sentinel.exitCode,null);
    });
    await test('cancel_result_before_delivery',async({root})=>{await put(path.join(root,'match'));empty(await search(root,{}, {cancelOnResult:true}),'cancelled');});
    await test('timeout_exit_no_partial',async({root})=>empty(await search(root,{probe:'stuck'},{onCheckpoint:()=>{}}),'timed_out'));
    await test('abnormal_exit',async({root})=>empty(await search(root,{probe:'abnormal'}),'helper_failed'));
    await test('broken_protocol',async({root})=>empty(await search(root,{probe:'bad_protocol'}),'protocol_rejected'));
    await test('singleton_helper',async({root})=>{let attempted=false;const r=await search(root,{probe:'after_root_open'},{onCheckpoint:(m,c)=>{assert.throws(()=>search(root),/HELPER_ALREADY_ACTIVE/);attempted=true;c.cancel();}});empty(r,'cancelled');assert.equal(attempted,true);});
    for(const name of ['other_reparse_tag','mapped_network_drive'])report.cases.push({target,name,result:'NOT_VERIFIED',classification:'fixture_unavailable'});
  }
  assert.equal(liveHelpers(),0);assert.equal(sentinel.exitCode,null);
  assert.ok(report.architectures.some(a=>a.classification==='arm64_native_verified'));
  assert.ok(report.architectures.some(a=>['x64_native_verified','x64_on_arm64_emulation_verified'].includes(a.classification)));
  assert.equal(safeMessage({kind:'ready',classification:'arm64_native',extra:true}),false);
  assert.equal(safeMessage({kind:'result',classification:'completed',architecture:'arm64_native',matches:[{name:'x',relativePath:'../x',entryType:'file'}],truncated:false,counts:{scannedEntries:1,visitedDirectories:1,openHandles:0,peakHandles:1}}),false);
}catch{report.controllerFailure=true;}
finally{
  if(sentinel){const closed=new Promise(r=>sentinel.once('close',r));sentinel.kill();await closed;}
  try{await rm(base,{recursive:true,force:true});report.syntheticCleanup=true;}catch{report.syntheticCleanup=false;}
}
report.activeHelpers=liveHelpers();report.fixtureCount=fixtureCount;
report.passed=report.cases.filter(x=>x.result==='PASS').length;report.failed=report.cases.filter(x=>x.result==='FAIL').length;report.notVerified=report.cases.filter(x=>x.result==='NOT_VERIFIED').length;
console.log(JSON.stringify(report));process.exitCode=report.failed||report.controllerFailure||!report.syntheticCleanup||report.architectures.length!==2||report.architectures.some(a=>a.classification==='not_verified')?1:0;
