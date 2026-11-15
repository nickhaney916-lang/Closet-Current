/** Research-only same-source photo/rig/body BVH-only A/B — NO DEPLOY.
 * Distinct from baseline-vs-candidate startup, which includes older optimizations.
 * Synthetic signed owner/browser fixture, pinned licensed originals, not phones.
 */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {compareSourceFrames90} from '../research/parallel90-viewer/startup-comparison.mjs';
const engine=process.env.P90_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const donor=resolve('.native05-donor-541'),root='benchmark/parallel90-profile/'+engine;
const sourceFiles=[
 'research/outfit-3d-01/research-panel.mjs',
 'research/dress-mobile-01/dress-mobile-showroom.mjs',
 'research/outfit-3d-01/source-true-viewer.mjs',
 'research/dress-mobile-01/dress-outfit-controller.mjs',
 'research/three-d-42/posed-contact.mjs'
];
const run=(command,args,env={})=>execFileSync(command,args,{stdio:'inherit',env:{...process.env,...env}});
const restore=()=>run('git',['-C',donor,'restore','--',...sourceFiles]);
const variants=[{name:'body-original-control',control:true},{name:'body-reuse-candidate',control:false}];
for(const variant of variants){
 restore();
 const env={P90_ENGINE:engine,P90SWAPS:'1',P90:'',P90_WIDTH:'390',
  P90_SWITCH_COUNT:'4',P90_PROFILE_VARIANT:'candidate',
  P90_PROFILE_OUTPUT:variant.name,
  P90_BODY_BVH_CONTROL:variant.control?'1':'0'};
 run(process.execPath,['scripts/install-parallel90-viewer.mjs'],env);
 run(process.execPath,['scripts/test-native-3d-05-browser.mjs'],env);
}
const [control,candidate]=await Promise.all(variants.map(v=>
 readFile(root+'/'+v.name+'/saved-switches.json','utf8').then(JSON.parse)));
assert.equal(control.samples.length,8);
assert.equal(candidate.samples.length,8);
const median=a=>{const x=a.slice().sort((l,r)=>l-r);return (x[(x.length-1)>>1]+x[x.length>>1])/2;};
const metrics=[],frames=[];
for(const figure of ['female','male']){
 const before=control.samples.filter(x=>x.figure===figure);
 const after=candidate.samples.filter(x=>x.figure===figure);
 assert.equal(before.length,4);assert.equal(after.length,4);
 for(let i=0;i<4;i++){
  for(const key of ['operation','mode','sourceSHA256','resources','contactEvidence'])
   assert.deepEqual(after[i][key],before[i][key],
    'BVH reuse cannot change original source/rig/collision result '+key);
 }
 const shirtBefore=before.filter(x=>x.mode==='shirt'),shirtAfter=after.filter(x=>x.mode==='shirt');
 assert.equal(shirtBefore.length,2);assert.equal(shirtAfter.length,2);
 const oldMs=median(shirtBefore.map(x=>x.shirtStages.contactFit));
 const newMs=median(shirtAfter.map(x=>x.shirtStages.contactFit));
 assert.ok(oldMs>0&&newMs>0,'real source pose-contact costs required');
 metrics.push({figure,shirtSamples:2,originalContactFitMs:oldMs,reusedContactFitMs:newMs,
  contactReductionPct:Math.round((oldMs-newMs)/oldMs*1000)/10,
  originalApplyMs:median(shirtBefore.map(x=>x.renderStages.applyMs)),
  reusedApplyMs:median(shirtAfter.map(x=>x.renderStages.applyMs)),
  otherSourceAndLoaderSettingsIdentical:true});
 for(const operation of [1,4]){
  const name=figure+'-'+operation+'-canvas.png';
  const [a,b]=await Promise.all(variants.map(v=>readFile(root+'/'+v.name+'/'+name)));
  const hash=x=>createHash('sha256').update(x).digest('hex');
  frames.push({figure,operation,controlPNG:hash(a),cachedPNG:hash(b),
   ...await compareSourceFrames90(a,b)});
 }
}
await mkdir(root,{recursive:true});
await writeFile(root+'/bvh-only-control.json',JSON.stringify({
 engine,status:'PASS',variants:variants.map(x=>x.name),metrics,frames,
 actualOriginalPhoto:true,realRig163Bones:true,sourceSHAEqual:true,
 collisionScalarsIdentical:true,sourceRGBThreshold:8,
 physicalPhone:false,actualPrivateOwner:false,releaseAuthorized:false,familyAlpha:'HOLD'
},null,2));
console.log('P90_BVH_ONLY_AB',JSON.stringify({engine,status:'PASS',metrics,frames:frames.length}));
restore();
run(process.execPath,['scripts/install-parallel90-viewer.mjs'],{P90_PROFILE_VARIANT:'candidate',P90_BODY_BVH_CONTROL:'0'});
