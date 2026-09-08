// Public bounded timeline is separate from private ownership control metadata.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const P=require('./profile.cjs'),E=require('./exit-verifier.cjs'),G=require('./crash-gate.cjs');
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function read(p,name){const f=P.canonical(path.join(p.control,name));if(fs.existsSync(f+'.pending')||fs.statSync(f).size>32768)throw Error();return JSON.parse(fs.readFileSync(f,'utf8'));}
function publish(p,t){p=P.load(p.id);if(p.scenario!=='B'||!G.valid(t))throw Error();
 const launch=read(p,'exit-launch.json');if(launch.owner!==p.nonce||launch.stage!=='launch')throw Error();
 E.publishImmutable(path.join(p.control,'crash-timeline.json'),t);
 E.publishImmutable(path.join(p.control,'crash-timeline.binding'),{schemaVersion:1,owner:p.nonce,generation:launch.generation,digest:digest(t)});
}
function consume(p){p=P.load(p.id);const t=read(p,'crash-timeline.json'),b=read(p,'crash-timeline.binding');
 if(p.scenario!=='B'||!G.valid(t)||Object.keys(b).sort().join()!=='digest,generation,owner,schemaVersion'||b.schemaVersion!==1||b.owner!==p.nonce||
  !/^[a-f0-9]{32}$/.test(b.generation)||b.digest!==digest(t))throw Error();
 // The preparation H3 binding remains immutable across recovery generations.
 const receipt=read(p,'stable-exit-'+b.generation+'.binding');
 if(receipt.owner!==p.nonce||receipt.scenario!=='B'||receipt.stage!=='launch'||receipt.generation!==b.generation)throw Error();
 return t;
}
function checkpoint(p,t){p=P.load(p.id);if(p.scenario!=='B'||!G.valid(t)||!t.firstFailure||!t.app_close_started)throw Error();
 E.publishImmutable(path.join(p.control,'authorization-failure.json'),t);
}
module.exports={publish,consume,checkpoint};
