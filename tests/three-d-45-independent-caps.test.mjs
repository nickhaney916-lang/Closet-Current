import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
const hash=arr=>createHash('sha256').update(Buffer.from(arr.buffer,arr.byteOffset,arr.byteLength)).digest('hex');
const garment=root=>{const out={shells:[],caps:[],pants:[],body:[]};root.traverse(m=>{
 if(!m.isSkinnedMesh)return;
 if(!m.userData.work56Garment)out.body.push(m);
 else if(m.userData.work60Pants)out.pants.push(m);
 else if(m.userData.work45IndependentShoulderCap)out.caps.push(m);
 else if(m.name==='Work56-independent-shirt-shell')out.shells.push(m);
});return out;};
const originals=meshes=>meshes.map(m=>Object.fromEntries(['panelPosition','panelNormal','skinIndex','skinWeight'].map(n=>[n,hash(m.geometry.getAttribute(n).array)])));
for(const kind of ['female','male'])for(const src of [A,B])test('3D45 physically separate genuine photographed bilateral cap patches '+kind+' '+src.id,async()=>{
 const root0=await person(kind),root1=await person(kind),
 opts={jeansPanelFall:true,poseContactFactory:createPoseContact,independentGarments:true,tailoredShoulderSleeves:true};
 const before=createOutfitController(root0,opts),after=createOutfitController(root1,{...opts,independentShoulderCaps:true});
 try{
  const args={reviewed:true,pantsCandidate:denim(src),pantsReviewed:true};
  const orig=before.setOutfit('shirt-pants',candidate('shirt'),args);
  const changed=after.setOutfit('shirt-pants',candidate('shirt'),args);
  assert.equal(orig.shirt.independentArmholeCapPanels,undefined);
  assert.equal(changed.shirt.independentArmholeCapPanels,true);
  assert.ok(changed.shirt.realSeparateSkinnedCapMeshes>=2);
  assert.ok(changed.shirt.armholePanelRetessellatedFaces>changed.shirt.armholePanelOriginalSourceFaces);
  assert.ok(changed.shirt.armholePanelInteriorEdgesSplit>=16);
  assert.ok(changed.shirt.originalShirtPixelsUnchanged);
  assert.ok(changed.shirt.originalFrontGarmentPhotoAndUVUnchanged);
  assert.equal(changed.shirt.sweptMotionCollisionCertified,false);
  assert.equal(changed.shirt.releaseAuthorized,false);
  assert.equal(changed.pants.sourceSHA256,src.originalSHA256);
  const a=garment(root0),b=garment(root1);
  assert.equal(a.caps.length,0);assert.ok(b.caps.length>=2);
  assert.deepEqual(originals(a.shells),originals(b.shells),'Existing source pixels, front projected panel coords and original skin weights may not change');
  assert.deepEqual(a.body.map(m=>hash(m.geometry.getAttribute('position').array)),b.body.map(m=>hash(m.geometry.getAttribute('position').array)),'Original 163-bone anatomical body geometry protected');
  assert.deepEqual(a.pants.map(m=>hash(m.geometry.getAttribute('position').array)),b.pants.map(m=>hash(m.geometry.getAttribute('position').array)),'Original genuine jeans geometry protected');
  const beforeFaces=a.shells.reduce((n,m)=>n+m.geometry.index.count/3,0);
  const retainedFaces=b.shells.reduce((n,m)=>n+m.geometry.index.count/3,0);
  const capFaces=b.caps.reduce((n,m)=>n+m.geometry.index.count/3,0);
  assert.ok(retainedFaces<beforeFaces,'Original sleeve triangles have actually been removed');
  assert.ok(capFaces>beforeFaces-retainedFaces,'New independent cap meshes must be retessellated, not duplicating the old sleeve surface');
  const sides=new Set(b.caps.map(m=>m.userData.work45IndependentShoulderCap));
  assert.ok(sides.has('L')&&sides.has('R'),'Both original sleeves receive physically separate new skinned cap geometry');
  const bodyBones=new Set(b.body.map(m=>m.skeleton));
  for(const m of b.caps){
   assert.ok(bodyBones.has(m.skeleton),'Actual cap panel uses unchanged original body skeleton');
   assert.ok(m.geometry.index.count>=60);
   for(let i=0;i<m.geometry.getAttribute('position').count;i++){
    const sum=Array.from({length:4},(_,k)=>m.geometry.getAttribute('skinWeight').getComponent(i,k)).reduce((x,y)=>x+y,0);
    assert.ok(Math.abs(sum-1)<.00005,'New original-bone weights normalized');
   }
  }
  for(const p of ['source','blend-25','blend-50','blend-75','relaxed','source']){
   const state=after.setPose(p);
   assert.equal(state.shirt.poseTriangleContact.after.count,0,'Actual skinned body/shirt geometry cannot intersect at '+p);
  }
  assert.equal(after.setOutfit('none').garmentMeshes,0);
 }finally{before.dispose();after.dispose();}
});
