// One standalone read-only calibration. No profile, product UI, provider or action.
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import Monitor from './pending-monitor.cjs';
import Exit from './exit-verifier.cjs';
export async function calibrate({query=Exit.queryRows,clock=()=>performance.now(),sqlFactory}={}){
 const rows=[];let processes,processStatus='success',elapsed=0;
 const at=clock();try{processes=await query({timeoutMs:2000});}catch(e){processStatus=['query_timeout','query_cancelled'].includes(e?.category)?'timeout':'error';}elapsed=clock()-at;
 // UI and authorization helper are intentionally absent: no fabricated live timings.
 const synthetic=new Set(['canonical_approval_read','task_state_read','assistant_journal_read','execution_count_read']);
 let SQL;try{SQL=await (sqlFactory||((await import('sql.js')).default))();}catch{}
 let db;try{if(SQL){db=new SQL.Database();db.run('CREATE TABLE synthetic (value INTEGER); INSERT INTO synthetic VALUES (0)');}
  for(const operation of Monitor.OPS){
   if(operation==='process_identity_query'){rows.push({operation,durationBucket:Monitor.bucket(elapsed),status:processStatus,recommendedTimeoutClass:'process_2s'});continue;}
   const start=clock();let status='success',recommendedTimeoutClass='requires_isolated_live_target';
   if(operation==='notepad_check'){status=processStatus;if(processes&&!Array.isArray(processes))status='error';else if(processes)processes.filter(r=>r.notepad);recommendedTimeoutClass='state_500ms';}
   else if(synthetic.has(operation)){recommendedTimeoutClass='synthetic_only_500ms';try{if(!db)throw Error();db.exec('SELECT value FROM synthetic');}catch{status='error';}}
   else status='error';
   rows.push({operation,durationBucket:Monitor.bucket(clock()-start),status,recommendedTimeoutClass});
  }
 }finally{db?.close();}return rows;
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){
 calibrate().then(r=>console.log(JSON.stringify(r))).catch(()=>{console.log(JSON.stringify({operation:'process_identity_query',durationBucket:'over_2s',status:'error',recommendedTimeoutClass:'process_2s'}));process.exitCode=1;});
}
