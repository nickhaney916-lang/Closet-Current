import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
const hash=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const snapshot=root=>{
 const shirt=[],pants=[],body=[];
 root.traverse(m=>{if(!m.isSkinnedMesh)return;
  if(!m.userData.work56Garment){body.push(hash(m.geometry.getAttribute('position').array));return;}
  const g=m.geometry,entries={name:m.name,p:Float32Array.from(g.getAttribute('position').array)};
  if(m.userData.work60Pants)pants.push(entries);else{
   const names=['panelPosition','panelNormal','skinIndex','skinWeight'];
   entries.protected={};
   for(const n of names)if(g.getAttribute(n))entries.protected[n]=hash(g.getAttribute(n).array);
   shirt.push(entries);
  }
 });
 return {shirt,pants,body};
};
for(const figure of ['female','male'])for(const photo of [A,B]){
 test('3D44 fitted photographed sleeves: '+figure+' '+photo.id,async()=>{
  const beforeRoot=await person(figure),afterRoot=await person(figure);
  const options={poseContactFactory:createPoseContact,jeansPanelFall:true,independentGarments:true};
  const before=createOutfitController(beforeRoot,options),after=createOutfitController(afterRoot,{...options,tailoredShoulderSleeves:true});
  try{
   const args={reviewed:true,pantsCandidate:denim(photo),pantsReviewed:true};
   const a=before.setOutfit('shirt-pants',candidate('shirt'),args);
   const b=after.setOutfit('shirt-pants',candidate('shirt'),args);
   assert.equal(a.shirt.sourceVerifiedUpperSleeveTailoring,undefined);
   assert.equal(b.shirt.sourceVerifiedUpperSleeveTailoring,true);
   assert.equal(b.pants.sourceSHA256,photo.originalSHA256);
   assert.equal(b.shirt.originalShirtSourcePixelsAndCoordinatesUnchanged,true);
   assert.equal(b.shirt.originalShirtSkinWeightsUnchanged,true);
   assert.equal(b.shirt.signedCollisionCertified,false);
   assert.equal(b.shirt.releaseAuthorized,false);
   assert.ok(b.shirt.upperSleeveTailoredVertices>30);
   assert.ok(b.shirt.upperSleeveMaximumModelSpaceMove>.003&&b.shirt.upperSleeveMaximumModelSpaceMove<=.02201);
   assert.ok(b.shirt.upperSleeveSourceArmProfiles.L.changed>10);
   assert.ok(b.shirt.upperSleeveSourceArmProfiles.R.changed>10);
   const x=snapshot(beforeRoot),y=snapshot(afterRoot);
   assert.deepEqual(x.body,y.body,'Original human anatomical mesh immutable');
   assert.equal(x.shirt.length,y.shirt.length);
   let moved=0;
   for(let i=0;i<x.shirt.length;i++){
    assert.deepEqual(x.shirt[i].protected,y.shirt[i].protected,'Original shirt photographic fields & skinning hashes unchanged');
    assert.equal(x.shirt[i].p.length,y.shirt[i].p.length);
    for(let j=0;j<x.shirt[i].p.length;j++)if(Math.abs(x.shirt[i].p[j]-y.shirt[i].p[j])>.0001)moved++;
   }
   assert.ok(moved>50,'Original 3D photographed upper sleeve geometry must actually change');
   assert.equal(x.pants.length,y.pants.length);
   for(let i=0;i<x.pants.length;i++)assert.equal(hash(x.pants[i].p),hash(y.pants[i].p),'Independent photographed jeans remain unchanged');
   for(const pose of ['source','blend-25','blend-50','blend-75','relaxed','blend-50']){
    const state=after.setPose(pose);
    assert.equal(state.shirt.poseTriangleContact.after.count,0,'Actual source/relaxed/intermediate pose collision must remain clear: '+pose);
    assert.equal(state.shirt.poseTriangleContact.fullCollisionValidated,false);
   }
   assert.equal(after.setOutfit('pants').pants.sourceVerifiedUpperSleeveTailoring,undefined);
   assert.equal(after.setOutfit('none').garmentMeshes,0);
   console.log('THREE_D44_ORIGINAL_SOURCE_TAILORING',JSON.stringify({figure,source:photo.id,moved,changed:b.shirt.upperSleeveTailoredVertices,max:b.shirt.upperSleeveMaximumModelSpaceMove}));
  }finally{before.dispose();after.dispose();}
 });
}
