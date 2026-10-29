import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {requireReviewedPhotoPants,projectReviewedPhotoPants,PANTS_SOURCE} from '../research/three-d-30/reviewed-photo-pants.mjs';
const hash=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const provisional=()=>({
 id:'commons-0021',type:'pants',sourceSHA256:PANTS_SOURCE.originalSHA256,
 cutoutSHA256:'b'.repeat(64),originalVerified:true,cutoutVerified:true,
 visibleSourceRGBPreserved:true,frontOrientationReviewed:true,
 cropRect:[.10,.08,.82,.84],cutout:{width:256,height:512},
 ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,
 provisional:true
});
test('No real commons-0021 cutout exists yet: always fail closed without a real reviewed mask',()=>{
 assert.equal(PANTS_SOURCE.originalBenchmarkMaskAvailable,false);
 assert.equal(PANTS_SOURCE.releaseAuthorized,false);
 assert.throws(()=>requireReviewedPhotoPants(null),/review/i);
 assert.throws(()=>requireReviewedPhotoPants(provisional()),/review/i);
 for(const patch of [
  {sourceSHA256:'0'.repeat(64)},{cutoutSHA256:''},
  {visibleSourceRGBPreserved:false},{frontOrientationReviewed:false},
  {ownerApproved:true},{provisional:false},{releaseAuthorized:true},
  {cropRect:[0,0,1.7,1]},{cutout:null}
 ])assert.throws(()=>requireReviewedPhotoPants({...provisional(),...patch},{reviewed:true}));
 assert.equal(requireReviewedPhotoPants(provisional(),{reviewed:true}).id,'commons-0021');
});
for(const kind of ['female','male'])test(kind+' reviewed front-only photo projected onto separate original skinned anatomical pant geometry without altering geometry or CC0 body',async()=>{
 const root=await person(kind),ctrl=createOutfitController(root);
 const body=[];root.traverse(m=>{if(m.isSkinnedMesh&&!m.userData.work56Garment)body.push([m,hash(m.geometry.attributes.position.array),hash(m.geometry.attributes.skinWeight.array)]);});
 try{
  const neutral=ctrl.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true});
  assert.equal(neutral.pants.photoApplied,false,'No cutout means neutral fallback');
  const tracked=[];root.traverse(m=>{if(m.userData.work60Pants)tracked.push(m);});
  assert.equal(tracked.length,1);
  const head=ctrl.getState();
  assert.throws(()=>ctrl.setOutfit('shirt-pants',candidate('shirt'),{
   reviewed:true,pantsCandidate:{...provisional(),frontOrientationReviewed:false},
   pantsReviewed:true
  }),/cutout|review/i);
  assert.deepEqual(ctrl.getState(),head,'Failed source review must preserve the existing outfit');
  const s=ctrl.setOutfit('shirt-pants',candidate('shirt'),{
   reviewed:true,pantsCandidate:provisional(),pantsReviewed:true
  });
  assert.equal(s.pants.photoApplied,true);
  assert.equal(s.pants.photoFrontOnly,true);
  assert.equal(s.pants.backMaterial,'unphotographed-neutral');
  assert.equal(s.pants.sourceSHA256,PANTS_SOURCE.originalSHA256);
  assert.equal(s.pants.humanVisualApproval,false);
  assert.equal(s.pants.releaseAuthorized,false);
  assert.equal(s.dress,null);
  assert.ok(s.shirt?.sharedSkeleton,'Existing photographed shirt must remain attached to the original rig');
  let pantsMesh;root.traverse(m=>{if(m.userData.work60Pants)pantsMesh=m;});
  assert.ok(pantsMesh?.isSkinnedMesh);
  const g=pantsMesh.geometry,pos=hash(g.attributes.position.array),skin=hash(g.attributes.skinWeight.array),rest=hash(g.attributes.pantsRest.array);
  assert.equal(g.getAttribute('pantsSourceUV').count,g.getAttribute('position').count);
  const fronts=g.getAttribute('pantsSourceFront').array;
  assert.ok(fronts.some(x=>x>=.8),'Photographed front must exist');
  assert.ok(fronts.some(x=>x<=.1),'Unphotographed rear must remain neutral');
  for(let i=0;i<g.getAttribute('pantsSourceUV').count;i++){
   const u=g.getAttribute('pantsSourceUV').getX(i),v=g.getAttribute('pantsSourceUV').getY(i);
   assert.ok(Number.isFinite(u)&&u>=.099999&&u<=.920001);
   assert.ok(Number.isFinite(v)&&v>=.079999&&v<=.920001);
  }
  const shader={uniforms:{},vertexShader:'void main() {\n#include <begin_vertex>\n}',fragmentShader:'void main() {\n#include <color_fragment>\n}'};
  pantsMesh.material.onBeforeCompile(shader);
  assert.match(shader.vertexShader,/vPantsSourceUV=pantsSourceUV/);
  assert.match(shader.fragmentShader,/uPantsOriginalPhoto/);
  assert.match(shader.fragmentShader,/sourcePantsOpacity/);
  assert.ok(shader.uniforms.uPantsOriginalPhoto.value.isTexture);
  ctrl.setPose('source');ctrl.setPose('relaxed');ctrl.setPose('source');
  assert.equal(hash(g.attributes.position.array),pos);
  assert.equal(hash(g.attributes.skinWeight.array),skin);
  assert.equal(hash(g.attributes.pantsRest.array),rest);
  for(const [m,p,w] of body){
   assert.equal(hash(m.geometry.attributes.position.array),p);
   assert.equal(hash(m.geometry.attributes.skinWeight.array),w);
  }
  assert.equal(ctrl.setOutfit('pants',null).pants.photoApplied,false,'No photo option reverts to neutral, never a stale texture');
  assert.equal(ctrl.setOutfit('none').garmentMeshes,0);
 }finally{ctrl.dispose();}
});
test('Photo pants are invalid in dress/shirt slots and do not replace an existing outfit',async()=>{
 const root=await person('female'),ctrl=createOutfitController(root);
 try{
  ctrl.setOutfit('shirt',candidate('shirt'),{reviewed:true});
  const old=ctrl.getState();
  assert.throws(()=>ctrl.setOutfit('dress',candidate('dress'),{reviewed:true,pantsCandidate:provisional(),pantsReviewed:true}),/pants only|lower-body/i);
  assert.deepEqual(ctrl.getState(),old);
 }finally{ctrl.dispose();}
});
