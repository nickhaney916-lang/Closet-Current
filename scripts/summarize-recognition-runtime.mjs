import {readFile} from 'node:fs/promises';
const paths=process.argv.slice(2);
if(!paths.length||paths.length>2)throw Error('Usage: node scripts/summarize-recognition-runtime.mjs before.json [after.json]');
const reports=await Promise.all(paths.map(async path=>{
 const rows=JSON.parse(await readFile(path,'utf8'));
 if(!Array.isArray(rows))throw Error('Expected the downloaded browser benchmark JSON array.');
 const sample=key=>rows.map(x=>x.runtimeMetrics?.[key]).filter(x=>Number.isFinite(x)&&x>=0).sort((a,b)=>a-b);
 const percentile=(values,p)=>values.length?values[Math.ceil(values.length*p)-1]:null;
 const timings=Object.fromEntries(['loadMs','decodeMs','inferenceMs','totalMs'].map(key=>{
  const vals=sample(key);return [key,{n:vals.length,p50:percentile(vals,.5),p95:percentile(vals,.95)}];
 }));
 const outputs=new Map(rows.map(x=>[x.id,{category:x.prediction?.category??null,type:x.prediction?.type??null,strong:!!x.strong,categoryConfirmed:!!x.categoryConfirmed,reason:x.reason??null,details:x.details??{},error:x.error??null}]));
 return {path,rows:rows.length,errors:rows.filter(x=>x.error).length,coldLoadMs:rows.find(x=>Number.isFinite(x.coldLoadMs))?.coldLoadMs??null,timings,outputs};
}));
const view=r=>({file:r.path,count:r.rows,errors:r.errors,coldLoadMs:r.coldLoadMs,timings:r.timings});
const result={reports:reports.map(view)};
if(reports.length===2){
 const [a,b]=reports;
 const common=[...a.outputs.keys()].filter(id=>b.outputs.has(id));
 const changed=common.filter(id=>JSON.stringify(a.outputs.get(id))!==JSON.stringify(b.outputs.get(id)));
 result.parity={common:common.length,missingBefore:[...b.outputs.keys()].filter(id=>!a.outputs.has(id)),missingAfter:[...a.outputs.keys()].filter(id=>!b.outputs.has(id)),changedOutputIds:changed,identical:changed.length===0&&a.outputs.size===b.outputs.size};
}
console.log(JSON.stringify(result,null,2));
if(result.parity&&!result.parity.identical)process.exitCode=2;
