import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';

// Experimental vectors never become production assets here. Each variant uses
// the same photo manifests, source images, model, crops and acceptance gates.
const output='benchmark/subtype-comparison',python=process.env.RECOGNITION_PYTHON||'python';
const original=Object.fromEntries(['json','bin'].map(ext=>[ext,fs.readFileSync('public/recognition-vectors.'+ext)]));
const prompts=JSON.parse(fs.readFileSync('benchmark/prompt-subtypes.json','utf8'));
const shoes=new Set(['sneakers','flat shoes','high heel shoes','sandals','ankle boots','tall boots','loafers']);
const variants=[['before',null,0],['shoes-quarter','shoes',.25],['shoes-half','shoes',.5],['dress-quarter','dress',.25],['dress-half','dress',.5],['combined-quarter','all',.25]];
const sets=['reviewed-32','holdout-16','fresh-11'],reports=[];
fs.mkdirSync(output,{recursive:true});
function run(command,args,{allowFailure=false}={}){
 const p=spawnSync(command,args,{encoding:'utf8',maxBuffer:16*1024*1024});
 if(p.error||p.status!==0&&!allowFailure)throw Error(p.error?.message||command+' failed: '+p.stderr+'\n'+p.stdout);
 return p;
}
try{
 for(const [name,group,blend] of variants){
  for(const [ext,bytes] of Object.entries(original))fs.writeFileSync('public/recognition-vectors.'+ext,bytes);
  const directory=join(output,name);fs.mkdirSync(directory,{recursive:true});
  if(group){
   const selected=Object.fromEntries(Object.entries(prompts).filter(([label])=>group==='all'||(group==='shoes')===shoes.has(label)));
   const promptPath=join(directory,'prompts.json');fs.writeFileSync(promptPath,JSON.stringify(selected,null,2)+'\n');
   const encoded=run(python,['scripts/rebuild-recognition-vectors.py','--prompt-overrides',promptPath,'--blend',String(blend),'--output-dir',directory]);
   console.log(encoded.stdout.trim());
   for(const ext of ['json','bin'])fs.copyFileSync(join(directory,'recognition-vectors.'+ext),'public/recognition-vectors.'+ext);
  }
  run(process.execPath,['scripts/build.mjs']);
  const summary={variant:name,blend,sets:{},regressions:0};
  for(const set of sets){
   const resultDir=join(directory,set),manifest='benchmark/manifest-'+set+'.json',results=join(resultDir,'results.json');
   const inference=run(process.execPath,['scripts/run-browser-photo-benchmark.mjs',manifest,resultDir]);console.log(name,set,inference.stdout.trim().split('\n').slice(-3).join(' '));
   const evaluation=run(process.execPath,['scripts/evaluate-recognition-benchmark.mjs',manifest,results]);
   fs.writeFileSync(join(resultDir,'evaluation.json'),evaluation.stdout);
   const guard=run(process.execPath,['scripts/check-recognition-regressions.mjs',manifest,results,'benchmark/regression-'+set+'.json'],{allowFailure:true});
   if(!guard.stdout)throw Error('Regression checker failed: '+guard.stderr);
   const protection=JSON.parse(guard.stdout);fs.writeFileSync(join(resultDir,'regressions.json'),guard.stdout);
   summary.regressions+=protection.failures.length;
   const metrics=JSON.parse(evaluation.stdout);summary.sets[set]={...metrics.single,negative:metrics.negative,perCategory:metrics.perCategory};
  }
  reports.push(summary);fs.writeFileSync(join(output,'summary.json'),JSON.stringify(reports,null,2)+'\n');
  console.log('Variant complete:',JSON.stringify(summary));
 }
}finally{
 for(const [ext,bytes] of Object.entries(original))fs.writeFileSync('public/recognition-vectors.'+ext,bytes);
 run(process.execPath,['scripts/build.mjs']);
}
