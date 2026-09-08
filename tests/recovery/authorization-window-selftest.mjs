// Independent test-only UI/pipe calibration. No profile, SQLite, provider, executor or crash dependency.
import path from 'node:path';
import Window from './authorization-window.cjs';
export async function selftest(options={}) { return Window.authorize({...options,scenario:'B'}); }
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)) {
 selftest().then(r=>{console.log(JSON.stringify(r));if(r.result!=='granted')process.exitCode=1;});
}
