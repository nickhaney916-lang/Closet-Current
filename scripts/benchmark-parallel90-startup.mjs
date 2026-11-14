/** Paired same-host baseline/candidate/restored native browser experiments. No private accounts. */
import {execFileSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compareSourceFrames90} from '../research/parallel90-viewer/startup-comparison.mjs';
const engine=process.env.P90_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const root='benchmark/parallel90-profile/'+engine,donor=resolve('.native05-donor-541');
const run=(cmd,args,env={})=>execFileSync(cmd,args,{stdio:'inherit',env:{...process.env,...env}});
if(process.env.P90_COMPARE_ONLY!=='1'){
 for(const variant of ['baseline','candidate','restored']){
  run('git',['-C',donor,'restore','--','research/outfit-3d-01/research-panel.mjs','research/dress-mobile-01/dress-mobile-showroom.mjs']);
  const env={P90_ENGINE:engine,P90_PROFILE_VARIANT:variant,P90_SWITCH_COUNT:'4',P90SWAPS:'1',P90_WIDTH:'390',P90:''};
  run(process.execPath,['scripts/install-parallel90-viewer.mjs'],env);
  run(process.execPath,['scripts/test-native-3d-05-browser.mjs'],env);
 }
}
const data={};
for(const variant of ['baseline','candidate','restored']){
 data[variant]=JSON.parse(await readFile(root+'/'+variant+'/saved-switches.json','utf8'));
 assert.equal(data[variant].samples.length,8);
 for(const row of data[variant].samples){
  assert.equal(row.startup.initialMode,variant==='candidate'?'none':'pants');
  if(variant==='candidate')assert.equal(row.startup.initialGarmentMeshes,0);
  else assert.ok(row.startup.initialGarmentMeshes>0);
 }
}
const median=x=>{x=x.slice().sort((a,b)=>a-b);return (x[(x.length-1)>>1]+x[x.length>>1])/2;};
const frames=[],metrics=[];
for(const figure of ['female','male']){
 for(const operation of [1,4]){
  const name=figure+'-'+operation+'-canvas.png';
  const [a,b,c]=await Promise.all(['baseline','candidate','restored'].map(v=>readFile(root+'/'+v+'/'+name)));
  const digest=x=>createHash('sha256').update(x).digest('hex');
  frames.push({figure,operation,comparison:'baseline-candidate',baselinePNG:digest(a),candidatePNG:digest(b),...await compareSourceFrames90(a,b)});
  frames.push({figure,operation,comparison:'baseline-restored',baselinePNG:digest(a),restoredPNG:digest(c),...await compareSourceFrames90(a,c)});
 }
 for(const variant of ['baseline','candidate','restored']){
  const rows=data[variant].samples.filter(x=>x.figure===figure);
  for(let i=0;i<4;i++){
   const original=data.baseline.samples.filter(x=>x.figure===figure)[i];
   assert.equal(rows[i].sourceSHA256,original.sourceSHA256);
   assert.deepEqual(rows[i].resources,original.resources);
  }
  metrics.push({figure,variant,samples:rows.length,
   medianEndToEndMs:median(rows.map(x=>x.elapsedMs)),
   medianInitialGarmentMs:median(rows.map(x=>x.startup.initialGarmentMs)),
   medianSceneSetupMs:median(rows.map(x=>x.startup.sceneSetupMs)),
   medianSourcesMs:median(rows.map(x=>x.startup.sourceLoadMs)),
   medianPresentMs:median(rows.map(x=>x.startup.presentMs))});
 }
}
await mkdir(root,{recursive:true});
await writeFile(root+'/comparison.json',JSON.stringify({engine,status:'PASS',
 experiment:'same worker; sequential baseline/candidate/restored, fresh browser per variant, 4 changes per rig/variant',
 metrics,frames,sourceAndFinalResourcesUnchanged:true,
 onlyThrowawayNeutralPantsBuildRemoved:true,physicalPhone:false,
 humanFidelityApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'},null,2));
console.log('P90_STARTUP_COMPARISON',JSON.stringify({engine,metrics,frames:frames.length,status:'PASS'}));

if(process.env.P90_COMPARE_ONLY!=='1'){
 run('git',['-C',donor,'restore','--','research/outfit-3d-01/research-panel.mjs','research/dress-mobile-01/dress-mobile-showroom.mjs']);
 run(process.execPath,['scripts/install-parallel90-viewer.mjs'],{P90_PROFILE_VARIANT:'candidate'});
}
