import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {prepareBodyPresentation,attachReviewedShirt,releaseBodyPresentation} from '../research/three-d-11/dress-in-source-pose.mjs';
import {finishNecklineAndSeams} from '../research/three-d-22/neckline-seams.mjs';
import {shapeSourceNeutralCollarRoll} from '../research/three-d-48/source-neutral-collar-roll.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';

const hash=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const body=root=>{const a=[];root.traverse(m=>{if(m.isSkinnedMesh&&!m.userData.work56Garment)a.push([hash(m.geometry.attributes.position.array),hash(m.geometry.attributes.skinWeight.array)]);});return a;};
const protectedNames=['panelPosition','panelNormal','skinIndex','skinWeight'];

for(const kind of ['male','female'])test('3D48 original collar outer seam is pinned and skinned source unchanged: '+kind,async()=>{
 const root=await person(kind),original=body(root);
 prepareBodyPresentation(root);
 let shirt;
 try{
  shirt=attachReviewedShirt(root,candidate('shirt'),{acknowledged:true,pose:'source',improved:true});
  shirt=finishNecklineAndSeams(shirt,root);
  const m=shirt.meshes.find(m=>m.name==='Work59-source-neutral-collar-band');
  assert.ok(m?.isSkinnedMesh,'Actual original separate collar must exist');
  const attr=m.geometry.attributes.position,before=attr.array.slice();
  const protectedBefore=Object.fromEntries(protectedNames.map(n=>[n,hash(m.geometry.attributes[n].array)]));
  const originals=shirt.meshes.filter(m=>m!==shirt.meshes.find(x=>x.name==='Work59-source-neutral-collar-band')).map(m=>hash(m.geometry.attributes.position.array));
  assert.equal(shapeSourceNeutralCollarRoll(shirt,root,{enabled:false}),shirt,'Opt-out is identity');
  assert.throws(()=>shapeSourceNeutralCollarRoll({},root),'Fail closed on missing reviewed original');
  const shaped=shapeSourceNeutralCollarRoll(shirt,root);
  assert.equal(shaped.stats.sourceNeutralCollarRoll,true);
  assert.equal(shaped.stats.collarRollOuterPhotoSeamUnchanged,true);
  assert.equal(shaped.stats.collarRollSourceUVAndWeightsUnchanged,true);
  assert.equal(shaped.stats.releaseAuthorized,false);
  assert.ok(shaped.stats.collarRollChangedVertices>=25);
  assert.ok(shaped.stats.collarRollMaximumMove>=.004&&shaped.stats.collarRollMaximumMove<=.011);
  assert.ok(shaped.stats.collarRollSharedInnerSeamGap<=1e-5);
  let moved=0;
  for(let i=0;i<attr.count;i++){
   const shift=Math.hypot(...[0,1,2].map(k=>before[3*i+k]-attr.array[3*i+k]));
   if([0,1,3].includes(i%6))assert.equal(shift,0,'Original outer sewn collar boundary may not move');
   else if(shift>1e-6)moved++;
  }
  assert.ok(moved>=25,'Physical 3D collar geometry must actually change');
  for(const n of protectedNames)assert.equal(hash(m.geometry.attributes[n].array),protectedBefore[n],'No original photo coordinate or weight rewrite: '+n);
  const after=shirt.meshes.filter(x=>x!==m).map(x=>hash(x.geometry.attributes.position.array));
  assert.deepEqual(after,originals,'Source photographed torso/shoulder and all caps completely unchanged');
  assert.deepEqual(body(root),original,'Anatomical body unchanged');
 }finally{shirt?.dispose();releaseBodyPresentation(root);}
});

for(const [kind,source] of [['male',A],['female',B]])test('3D48 real full licensed photographed outfit and pose solver '+kind,async()=>{
 const root=await person(kind),original=body(root),app=createOutfitController(root,{
  independentGarments:true,poseContactFactory:createPoseContact,jeansPanelFall:true,
  tailoredShoulderSleeves:true,independentShoulderCaps:true,realisticShoulderContour:true,
  upperArmFabricVolume:true,sourceNeutralCollarRoll:true
 });
 try{
  const state=app.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true,pantsCandidate:denim(source),pantsReviewed:true});
  assert.equal(state.shirt.sourceNeutralCollarRoll,true);
  assert.equal(state.shirt.upperArmFabricVolumeTailored,true);
  assert.equal(state.shirt.collarRollOuterPhotoSeamUnchanged,true);
  assert.equal(state.shirt.collarRollSourceUVAndWeightsUnchanged,true);
  assert.equal(state.pants.sourceSHA256,source.originalSHA256);
  assert.equal(state.shirt.releaseAuthorized,false);
  for(const pose of ['source','blend-25','blend-50','blend-75','relaxed','blend-50']){
   const s=app.setPose(pose);
   assert.equal(s.shirt.poseTriangleContact.after.count,0,'Actual skinned garment triangle contact '+kind+'/'+pose);
   assert.equal(s.shirt.poseTriangleContact.fullCollisionValidated,false);
  }
  assert.deepEqual(body(root),original);
  assert.equal(app.setOutfit('none').garmentMeshes,0);
 }finally{app.dispose();}
});
