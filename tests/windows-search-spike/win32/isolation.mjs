// Read-only repository isolation / protocol checks. No product startup or fixtures.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {safeMessage} from './controller.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const files=execFileSync('git',['ls-files','-z','apps','packages'],{cwd:root,encoding:'utf8'}).split('\0').filter(p=>/\/src\/.*\.(?:ts|tsx|js|mjs|cjs|json)$/u.test(p));
for(const file of files)assert.doesNotMatch(readFileSync(path.join(root,file),'utf8'),/windows-search-spike|DirectoryHandleHelper|SearchHandleHelper/u);
const pkg=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'));
assert.ok(pkg.build.files.includes('!**/tests/**'));
for(const field of ['files','extraResources','extraFiles']){
  for(const entry of pkg.build[field]??[]){const from=typeof entry==='string'?entry:entry.from;assert.ok(from?.startsWith('!')||!/(?:windows-search-spike|^tests\/)/u.test(from));}
}
const helper=readFileSync(new URL('./DirectoryHandleHelper.cs',import.meta.url),'utf8');
assert.doesNotMatch(helper,/FindFirstFile|FindNextFile|Directory\.Enumerate|Directory\.GetFiles|System\.Net|Process\.Start|NtQueryDirectoryFile/u);
assert.match(helper,/GetFileInformationByHandleEx\(h,first\?20:19/u);
assert.match(helper,/Same\(expected,Id\(child\)\)/u);
const good={kind:'result',classification:'completed',architecture:'arm64_native',matches:[],truncated:false,counts:{scannedEntries:0,visitedDirectories:1,openHandles:0,peakHandles:1}};
assert.equal(safeMessage(good),true);
for(const alteration of [{extra:true},{matches:[{name:'x',relativePath:'../x',entryType:'file'}]},{matches:[{name:'x',relativePath:'/x',entryType:'file'}]},{counts:{...good.counts,scannedEntries:2001}},{counts:{...good.counts,openHandles:1}},{architecture:'invalid'},{classification:'cancelled',matches:[{name:'x',relativePath:'x',entryType:'file'}]}])assert.equal(safeMessage({...good,...alteration}),false);
console.log(JSON.stringify({classification:'PASS',productionSourceFilesChecked:files.length,testOnlyExclusion:true,pathEnumerationFallback:false,protocolNegativeChecks:7}));
