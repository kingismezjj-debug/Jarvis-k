// Independent calibration: no profile, database, provider, executor or crash imports.
import path from 'node:path';
import Input from './authorization-input.cjs';
export async function selftest(options={}) { return Input.authorize({...options,calibration:true}); }
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)) {
  selftest().then(r=>{console.log(JSON.stringify(r));if(r.result!=='granted')process.exitCode=1;});
}
