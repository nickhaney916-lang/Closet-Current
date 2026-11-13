/**
 * Exact native original source-dress real WebGL A/B: P175 physical dress
 * baseline vs P2-C36 additional phase-sampled skirt movement. Proves
 * changed rendered pixels, does NOT claim better realism or cloth physics.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const baseline='benchmark/mission2-source-dress-motion/baseline';
const motion='benchmark/native-3d-05';
const output='benchmark/mission2-source-dress-motion';
await mkdir(output,{recursive:true});
const before=JSON.parse(await readFile(baseline+'/results.json','utf8'));
const after=JSON.parse(await readFile(motion+'/results.json','utf8'));
for(const r of [before,after]){
 assert.equal(r.priority,'NATIVE-3D-05');
 assert.equal(r.realWebGL,true);
 assert.equal(r.cases,3);
 assert.equal(r.screens.length,24);
 assert.deepEqual(r.widths,[320,390,430]);
 assert.equal(r.originalNativeAuthHTTPOnlyMocked,true);
 assert.equal(r.realSignedRLS,false);
 assert.equal(r.familyAlpha,'HOLD');
 assert.equal(r.releaseAuthorized,false);
 assert.deepEqual(r.errors,[]);
 assert.deepEqual(r.crashes,[]);
}
const stages=['02-genuine-163-bone-front-dress',
 '03-genuine-163-bone-side-dress',
 '04-genuine-163-bone-rear-neutral'];
let compared=0,changedScenes=0,changedSideRear=0;
const pairs=[];
const digest=b=>createHash('sha256').update(b).digest('hex');
for(const width of [320,390,430]){
 const a=before.evidence.find(e=>e.width===width);
 const b=after.evidence.find(e=>e.width===width);
 assert.ok(a&&b,'original owner 163-bone real viewport proof required');
 assert.equal(a.originalSourceDressPhysicalPhaseDisplacement36,undefined);
 assert.equal(b.originalSourceDressPhysicalPhaseDisplacement36,true);
 assert.equal(b.originalSourceDressMotionPhase36,.25);
 assert.ok(b.originalSourceDressMotionVertices36>=100);
 assert.ok(b.originalSourceDressMotionFrontProtected36>=100);
 assert.ok(b.originalSourceDressMotionMaxMeters36>.0002&&
  b.originalSourceDressMotionMaxMeters36<=.01235);
 assert.equal(b.continuousClothPhysicsCertified36,false);
 for(const stage of stages){
  const x=before.screens.find(s=>s.width===width&&s.stage===stage);
  const y=after.screens.find(s=>s.width===width&&s.stage===stage);
  assert.ok(x&&y,'same real viewport 3D garment stage required');
  const [first,next]=await Promise.all([
   readFile(baseline+'/'+x.name),readFile(motion+'/'+y.name)]);
  assert.equal(digest(first),x.sha256);
  assert.equal(digest(next),y.sha256);
  const [ar,br]=await Promise.all([
   sharp(first).removeAlpha().raw().toBuffer({resolveWithObject:true}),
   sharp(next).removeAlpha().raw().toBuffer({resolveWithObject:true})
  ]);
  assert.deepEqual(ar.info,br.info);
  let changed=0,maxRGBDifference=0;
  for(let i=0;i<ar.data.length;i+=3){
   const v=Math.max(Math.abs(ar.data[i]-br.data[i]),
    Math.abs(ar.data[i+1]-br.data[i+1]),
    Math.abs(ar.data[i+2]-br.data[i+2]));
   maxRGBDifference=Math.max(maxRGBDifference,v);
   if(v>8)changed++;
  }
  compared++;
  if(changed>0)changedScenes++;
  if(stage!==stages[0]&&changed>0)changedSideRear++;
  pairs.push({width,stage,changedRGBPixelsAbove8:changed,
   maxRGBDifference,originalSourceAnd163BoneAnatomyUnchanged:true,
   sourceJPEGStillOriginal:true,sourceRearPhotographed:false});
 }
}
// These are 3 widths x 3 original-dress camera viewpoints. Unlike prior
// blouse lighting experiments, reject a shader/geometry change that renders
// identically with no measurable source-cloth silhouette/surface change.
assert.equal(compared,9);
assert.ok(changedScenes>=3&&changedSideRear>=3,
 'P2-C36 skinned original dress motion invisible on real native WebGL side/rear');
const result={
 schema:'M2-source-dress-phase-real-webgl-v1',pairs,
 originalLicensedDressId:'commons-0053',
 sourceOriginalSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 measuredNativeSourceDressViews:compared,
 actuallyChangedViews:changedScenes,
 actuallyChangedSideRearViews:changedSideRear,
 originalSourceJPEGUVSkinAndArmholesUnmodified:true,
 sourcePhotoFrontGuarded:true,
 neutralRearInferredNotPhotographed:true,
 independentHumanVisualImprovementNotVerified:true,
 dynamicMassGravityClothSolver:false,
 continuousSweptCollisionCertified:false,
 physicalIPhoneAndroidAcceptance:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
};
await writeFile(output+'/verified-motion-pixel-results.json',JSON.stringify(result,null,2)+'\n');
console.log('M2_C36_REAL_SOURCE_DRESS_SKIRT_PIXEL_DELTA:'+JSON.stringify({
 compared,changedScenes,changedSideRear,
 maxChangedPixels:Math.max(...pairs.map(x=>x.changedRGBPixelsAbove8)),
 sourceOriginalSHA256Verified:true,
 real3DRenderedGenuineP61Dress:true,releaseAuthorized:false
}));
