import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {PANTS_RESEARCH_SOURCE,PANTS_RESEARCH_SOURCE_SECOND} from '../research/three-d-30/reviewed-photo-pants.mjs';

const hash=array=>createHash('sha256').update(Buffer.from(array.buffer,array.byteOffset,array.byteLength)).digest('hex');
const srcCandidate=s=>({id:s.id,type:'pants',sourceSHA256:s.originalSHA256,
 cutoutSHA256:s.cutoutSHA256,sourceAssetsVerified:true,originalVerified:true,
 cutoutVerified:true,visibleSourceRGBPreserved:true,frontOrientationReviewed:true,
 neutralColorRGB:s.id===PANTS_RESEARCH_SOURCE.id?[83,104,135]:[57,81,120],
 cropRect:s.id===PANTS_RESEARCH_SOURCE.id?[.085,.07,.87,.82]:[.055,.08,.88,.86],
 cutout:{width:s.id===PANTS_RESEARCH_SOURCE.id?435:1754,height:s.id===PANTS_RESEARCH_SOURCE.id?650:2838},
 ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,provisional:true});
const garments=root=>{const out=[];root.traverse(o=>{if(o.isSkinnedMesh&&o.userData.work56Garment)out.push(o);});return out;};
const jeans=root=>garments(root).find(o=>o.userData.work60Pants);
const attrs=(mesh,names)=>Object.fromEntries(names.map(n=>[n,hash(mesh.geometry.getAttribute(n).array)]));
const originalBody=root=>{
 const output=[];root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)
 output.push([o.name,hash(o.geometry.getAttribute('position').array)]);});return output;};

for(const figure of ['female','male'])for(const source of [PANTS_RESEARCH_SOURCE,PANTS_RESEARCH_SOURCE_SECOND]){
 test('3D41 source-measured leg cloth fall: '+figure+' / '+source.id,async()=>{
  const original=await person(figure),changed=await person(figure);
  const bodyBefore=originalBody(original),bodyAfter=originalBody(changed);
  const before=createOutfitController(original,{jeansPanelFall:false});
  const after=createOutfitController(changed,{jeansPanelFall:true});
  try{
   const args={reviewed:true,pantsCandidate:srcCandidate(source),pantsReviewed:true};
   const a=before.setOutfit('shirt-pants',candidate('shirt'),args);
   const b=after.setOutfit('shirt-pants',candidate('shirt'),args);
   assert.equal(a.pants.sourceMeasuredLowerLegFall,undefined);
   assert.equal(b.pants.sourceMeasuredLowerLegFall,true);
   assert.equal(b.pants.sourceId,source.id);
   assert.equal(b.pants.sourceSHA256,source.originalSHA256);
   assert.equal(b.pants.cutoutSHA256,source.cutoutSHA256);
   assert.equal(b.pants.originalDenimPixelsAndUVUnchanged,true);
   assert.equal(b.pants.originalPantsSkinningAndRestUnchanged,true);
   assert.equal(b.pants.trueSewnTopology,false);
   assert.equal(b.pants.signedCollisionValidated,false);
   assert.equal(b.pants.humanVisualApproval,false);
   assert.equal(b.pants.releaseAuthorized,false);
   assert.ok(b.pants.legFallMovedVertices>230);
   assert.ok(b.pants.legFallBelowKnee>40);
   assert.ok(b.pants.legFallAboveKnee>90);
   assert.ok(b.pants.legFallSideVertices>25);
   assert.ok(b.pants.legFallMaxMovement>.007&&b.pants.legFallMaxMovement<=.030);
   assert.ok(b.pants.legFallMeasuredStations.every(n=>n>=14));
   assert.deepEqual(originalBody(original),bodyBefore);
   assert.deepEqual(originalBody(changed),bodyAfter);
   const immutable=['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
   assert.deepEqual(attrs(jeans(original),immutable),attrs(jeans(changed),immutable));
   const old=jeans(original).geometry.getAttribute('position'),next=jeans(changed).geometry.getAttribute('position');
   let moved=0,max=0;
   assert.equal(old.count,next.count);
   for(let i=0;i<old.count;i++){
    const d=Math.hypot(old.getX(i)-next.getX(i),old.getY(i)-next.getY(i),old.getZ(i)-next.getZ(i));
    if(d>.00001)moved++;
    max=Math.max(max,d);
   }
   assert.ok(moved>400&&max<.031,JSON.stringify({moved,max}));
   for(const pose of ['source','relaxed','source']){
    before.setPose(pose);after.setPose(pose);
    assert.deepEqual(attrs(jeans(original),immutable),attrs(jeans(changed),immutable));
   }
   // Source-only rollback must never apply the speculative cloth geometry.
   const neutral=after.setOutfit('pants');
   assert.equal(neutral.pants.photoApplied,false);
   assert.equal(neutral.pants.sourceMeasuredLowerLegFall,undefined);
   assert.equal(after.setOutfit('none').garmentMeshes,0);
   console.log('THREE_D41_LICENSED_ORIGINAL_LEG_FALL',JSON.stringify({figure,source:source.id,moved,max,stats:b.pants.legFallMeasuredStations}));
  }finally{before.dispose();after.dispose();}
 });
}
test('Research opt-in never modifies original neutral or unreviewed garments',async()=>{
 const root=await person('female'),controller=createOutfitController(root,{jeansPanelFall:true});
 try{
  assert.equal(controller.setOutfit('pants').pants.sourceMeasuredLowerLegFall,undefined);
  assert.equal(controller.setOutfit('shirt',candidate('shirt'),{reviewed:true}).pants,null);
  assert.ok(controller.setOutfit('dress',candidate('dress'),{reviewed:true}).dress);
 }finally{controller.dispose();}
});
