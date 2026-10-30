import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {denim} from '../scripts/audit-three-d-41-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
import {auditShoulders,outfitMeshes} from '../scripts/audit-three-d-42-shoulder-crossings.mjs';
const hash=v=>createHash('sha256').update(Buffer.from(v.buffer,v.byteOffset,v.byteLength)).digest('hex');
const originalFields=['panelPosition','panelNormal','skinIndex','skinWeight'];
const sourceHash=meshes=>meshes.filter(m=>m.geometry.getAttribute('panelPosition')).map(m=>Object.fromEntries(originalFields.map(k=>[k,hash(m.geometry.getAttribute(k).array)])));
for(const figure of ['female','male'])for(const photo of [A,B]){
 test('3D42 original photo+skin preserved, real pose-aware back and shoulder move '+figure+' '+photo.id,async()=>{
  const root=await person(figure),body=()=>{const out=[];root.traverse(m=>{if(m.isSkinnedMesh&&!m.userData.work56Garment)out.push([m.name,hash(m.geometry.getAttribute('position').array)]);});return out;};
  const app=createOutfitController(root,{sewnPattern:true,poseAwareShoulderContact:true});
  try{
   const before=body(),s=app.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true,pantsCandidate:denim(photo),pantsReviewed:true});
   assert.equal(s.shirt.poseAwareShoulderClearance,true);
   assert.equal(s.shirt.shoulderCollisionCertified,false);
   assert.equal(s.shirt.originalShirtSourcePixelsAndUVUnchanged,true);
   assert.equal(s.shirt.originalShirtSkinWeightsUnchanged,true);
   assert.ok(s.shirt.shoulderClearancePosedBodyTriangles>5000);
   assert.ok(s.shirt.shoulderClearanceProbeCount>100);
   assert.ok(s.shirt.shoulderClearanceEditedVertexEvents>10);
   assert.ok(s.shirt.shoulderClearanceMaximumRestMove>.001&&s.shirt.shoulderClearanceMaximumRestMove<=.039001);
   assert.equal(s.pants.independentSewnPattern,true);
   assert.equal(s.pants.sourceSHA256,photo.originalSHA256);
   const shirt=outfitMeshes(root).shirt.filter(m=>m.geometry.getAttribute('panelPosition'));
   const fields=sourceHash(shirt);
   for(const pose of ['source','relaxed','source']){
    app.setPose(pose);assert.deepEqual(sourceHash(shirt),fields);
   }
   assert.deepEqual(body(),before);
   assert.equal(app.setOutfit('pants').pants.independentSewnPattern,undefined);
   assert.equal(app.setOutfit('none').garmentMeshes,0);
  }finally{app.dispose();}
 });
}
test('3D42 source-true triangle intersections are reduced across both poses and two independently licensed denim photos',async()=>{
 const r=await auditShoulders();
 assert.ok(r.beforeTotal>0);
 assert.ok(r.afterTotal<r.beforeTotal);
 assert.ok(r.reduced>=2);
 assert.equal(r.fullCollisionValidated,false);
});
