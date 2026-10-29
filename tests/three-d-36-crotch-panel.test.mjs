import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {PANTS_RESEARCH_SOURCE} from '../research/three-d-30/reviewed-photo-pants.mjs';
const sha=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const candidateJeans=()=>({id:PANTS_RESEARCH_SOURCE.id,type:'pants',sourceSHA256:PANTS_RESEARCH_SOURCE.originalSHA256,
 cutoutSHA256:PANTS_RESEARCH_SOURCE.cutoutSHA256,sourceAssetsVerified:true,originalVerified:true,
 cutoutVerified:true,visibleSourceRGBPreserved:true,frontOrientationReviewed:true,
 neutralColorRGB:[83,104,135],cropRect:[.085,.07,.87,.82],cutout:{width:435,height:650},
 ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,provisional:true});
const pants=root=>{let m;root.traverse(o=>{if(o.userData?.work60Pants)m=o;});assert.ok(m);return m;};
function hashes(g){return Object.fromEntries(['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'].map(k=>[k,sha(g.attributes[k].array)]));}
function bodyHashes(root){const out=[];root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)out.push({name:o.name,position:sha(o.geometry.attributes.position.array),skin:sha(o.geometry.attributes.skinWeight.array)});});return out;}
for(const model of ['female','male'])test(model+' actual 3D35 vs 3D36 original-photographed rear-seat crotch cloth saddle retains all licensed source pixels/UV/CC0 bone data',async()=>{
 const beforeRoot=await person(model),afterRoot=await person(model);
 const aBody=bodyHashes(beforeRoot),bBody=bodyHashes(afterRoot);
 const before=createOutfitController(beforeRoot,{naturalPantsDrape:true,posteriorJeansFairing:true,structuralPantsEnvelope:true,independentJeansLoft:true,crotchSeatPanel:false});
 const after=createOutfitController(afterRoot,{naturalPantsDrape:true,posteriorJeansFairing:true,structuralPantsEnvelope:true,independentJeansLoft:true,crotchSeatPanel:true});
 try{
  const old=before.setOutfit('pants',null,{pantsCandidate:candidateJeans(),pantsReviewed:true}),
   now=after.setOutfit('pants',null,{pantsCandidate:candidateJeans(),pantsReviewed:true});
  assert.equal(old.pants.naturalJeansDrape,true);
  assert.equal(old.pants.originalCrotchSaddle,undefined);
  assert.equal(now.pants.originalCrotchSaddle,true);
  assert.equal(now.pants.naturalJeansDrape,true);
  assert.ok(now.pants.crotchMovedUniqueVertices>35);
  assert.ok(now.pants.crotchMaxMovement>=.003&&now.pants.crotchMaxMovement<=.034001);
  assert.ok(now.pants.crotchPanelRows>=7&&now.pants.crotchCenterVertices>0);
  assert.ok(now.pants.crotchContactLimited>=0);
  assert.ok(now.pants.crotchNegativeAfter<=now.pants.crotchNegativeBefore);
  assert.ok(now.pants.crotchOrientedMinAfter>=now.pants.crotchOrientedMinBefore-.0005);
  assert.equal(now.pants.crotchOriginalUVUntouched,true);
  assert.equal(now.pants.crotchSkinWeightsUnchanged,true);
  assert.equal(now.pants.crotchSourcePhotoUntouched,true);
  assert.equal(now.pants.fullCollisionValidated,false);
  assert.equal(now.pants.humanVisualApproval,false);
  assert.equal(now.pants.releaseAuthorized,false);
  const bg=pants(beforeRoot).geometry,ag=pants(afterRoot).geometry;
  assert.deepEqual(hashes(bg),hashes(ag),'Original JPEG cutout, source UV, source-rest coordinates and skin identical');
  assert.deepEqual(bodyHashes(beforeRoot),aBody,'Before original CC0 body immutable');
  assert.deepEqual(bodyHashes(afterRoot),bBody,'After original CC0 body immutable');
  assert.equal(bg.attributes.position.count,ag.attributes.position.count);
  let changed=0,max=0;
  for(let i=0;i<ag.attributes.position.array.length;i+=3){
   const d=Math.hypot(...[0,1,2].map(k=>ag.attributes.position.array[i+k]-bg.attributes.position.array[i+k]));
   if(d>.00001)changed++;max=Math.max(max,d);
  }
  assert.ok(changed>100,'3D36 must move genuine connected rear crotch geometry: '+changed);
  assert.ok(max<=.0345,'No oversized crotch panel movement '+max);
  for(const pose of ['relaxed','source','relaxed','source']){
   after.setPose(pose);assert.deepEqual(hashes(ag),hashes(bg),'3D36 never rewrites original photo coordinates while posing');
  }
  const fallback=after.setOutfit('pants');
  assert.equal(fallback.pants.photoApplied,false);
  assert.equal(fallback.pants.originalCrotchSaddle,undefined);
  assert.equal(after.setOutfit('none').garmentMeshes,0);
  console.log('3D36_MEASURED_CROTCH_PANEL',model,JSON.stringify({moved:now.pants.crotchMovedUniqueVertices,change:changed,max:now.pants.crotchMaxMovement,mean:now.pants.crotchMeanMovement,rows:now.pants.crotchPanelRows,centerline:now.pants.crotchCenterVertices,contactMinBefore:now.pants.crotchOrientedMinBefore,contactMinAfter:now.pants.crotchOrientedMinAfter,contactLimited:now.pants.crotchContactLimited}));
 }finally{before.dispose();after.dispose();}
});
test('Fail closed missing photo source, neutral back remains neutral, dress/shirt preview unchanged',async()=>{
 const root=await person('female'),ctrl=createOutfitController(root);
 try{
  const neutral=ctrl.setOutfit('pants');assert.equal(neutral.pants.posteriorFabricFairing,undefined);
  assert.equal(neutral.pants.photoApplied,false);
  const previous=ctrl.getState();
  assert.throws(()=>ctrl.setOutfit('pants',null,{pantsCandidate:{...candidateJeans(),sourceAssetsVerified:false},pantsReviewed:true}),/cutout|review/i);
  assert.deepEqual(ctrl.getState(),previous);
  const dress=ctrl.setOutfit('dress',candidate('dress'),{reviewed:true});
  assert.equal(dress.pants,null);assert.ok(dress.dress);
 }finally{ctrl.dispose();}
});
