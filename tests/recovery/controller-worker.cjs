// Fixed sacrificial/sentinel helper: no app, provider, executor or recovery imports.
const readline=require('node:readline');
const marker=process.argv[2];
if(!/^--controller-(sentinel|sacrificial)=[a-f0-9]{32}$/.test(marker||''))process.exitCode=2;
else {const input=readline.createInterface({input:process.stdin});input.on('line',line=>{if(line==='shutdown')input.close();});input.on('close',()=>{process.exitCode=0;});process.stdout.write('ready\n');}
