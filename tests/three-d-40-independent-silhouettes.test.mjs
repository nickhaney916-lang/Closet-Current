import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {PANTS_RESEARCH_SOURCE,PANTS_RESEARCH_SOURCE_SECOND} from '../research/three-d-30/reviewed-photo-pants.mjs';
const sha=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const denim=src=>({id:src.id,type:'pants',sourceSHA256:src.originalSHA256,cutoutSHA256:src.cutoutSHA256,
  sourceAssetsVerified:true,originalVerified:true,cutoutVerified:true,visibleSourceRGBPreserved:true,
  frontOrientationReviewed:true,neutralColorRGB:src.id===PANTS_RESEARCH_SOURCE.id?[83,104,135]:[57,81,120],
  cropRect:src.id===PANTS_RESEARCH_SOURCE.id?[.085,.07,.87,.82]:[.055,.08,.88,.86],
  cutout:{width:src.id===PANTS_RESEARCH_SOURCE.id?435:1754,height:src.id===PANTS_RESEARCH_SOURCE.id?650:2838},
  ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,provisional:true});
const garments=root=>{const a=[];root.traverse(m=>{if(m.isSkinnedMesh&&m.userData.work56Garment)a.push(m);});return a;};
const shirt=root=>garments(root).filter(m=>!m.userData.work60Pants&&m.geometry.getAttribute('panelPosition'));
const pants=root=>garments(root).find(m=>m.userData.work60Pants);
const hashes=(m,names)=>Object.fromEntries(names.map(k=>[k,sha(m.geometry.getAttribute(k).array)]));
const sourceShirt=['panelPosition','panelNormal','skinWeight','skinIndex'];
const sourceJeans=['pantsRest','pantsSourceUV','pantsSourceFront','skinWeight','skinIndex'];
const originalBody=root=>{const a=[];root.traverse(m=>{if(m.isSkinnedMesh&&!m.userData.work56Garment)a.push([m.name,sha(m.geometry.attributes.position.array),sha(m.geometry.attributes.skinWeight.array)]);});return a;};

for(const model of ['female','male'])for(const src of [PANTS_RESEARCH_SOURCE,PANTS_RESEARCH_SOURCE_SECOND])
test(model+' preserved original shirt photograph + '+src.id+' actual independent rear/side hanging garment construction',async()=>{
 const r0=await person(model),r1=await person(model),body0=originalBody(r0),body1=originalBody(r1);
 const before=createOutfitController(r0,{shirtHangingSilhouette:false,denimHangingSilhouette:false});
 const after=createOutfitController(r1,{shirtHangingSilhouette:true,denimHangingSilhouette:true});
 try{
  const opts={reviewed:true,pantsCandidate:denim(src),pantsReviewed:true},original=candidate('shirt');
  const old=before.setOutfit('shirt-pants',original,opts),now=after.setOutfit('shirt-pants',original,opts);
  assert.equal(old.shirt.originalPhotographedTorsoDrape,undefined);
  assert.equal(old.pants.originalPhotographedHangingLegPanels,undefined);
  assert.equal(now.shirt.originalPhotographedTorsoDrape,true);
  assert.equal(now.pants.originalPhotographedHangingLegPanels,true);
  assert.equal(now.pants.sourceId,src.id);
  assert.equal(now.pants.sourceSHA256,src.originalSHA256);
  assert.ok(now.shirt.torsoMovedUniqueVertices>120);
  assert.ok(now.shirt.torsoBackPanelVertices>40&&now.shirt.torsoSidePanelVertices>20);
  assert.ok(now.shirt.torsoDrapeMaxShift>.009&&now.shirt.torsoDrapeMaxShift<=.032001);
  assert.ok(now.shirt.torsoProtectedSourceFrontMaxShift<=.003);
  assert.ok(now.pants.rearPanelMovedUniqueVertices>250);
  assert.ok(now.pants.rearPanelBackVertices>140);
  assert.ok(now.pants.rearPanelMaxShift>.014&&now.pants.rearPanelMaxShift<=.040001);
  assert.ok(now.pants.rearPanelMeasuredLegRows.every(n=>n>=12));
  assert.equal(now.pants.rearPhotoInvented,false);
  assert.equal(now.shirt.sourcePhotoTextureAndCoordinatesUnchanged,true);
  assert.equal(now.pants.originalSourcePhotoAndUVUnchanged,true);
  assert.equal(now.shirt.humanVisualApproval,false);
  assert.equal(now.pants.collisionCertified,false);
  assert.deepEqual(originalBody(r0),body0);assert.deepEqual(originalBody(r1),body1);
  assert.deepEqual(hashes(pants(r0),sourceJeans),hashes(pants(r1),sourceJeans));
  let movedShirt=0,movedPants=0,shirtMax=0,pantsMax=0;
  const sb=shirt(r0),sa=shirt(r1);
  assert.equal(sb.length,sa.length);
  const preserved=sa.map(m=>hashes(m,sourceShirt));
  for(let j=0;j<sa.length;j++){
   assert.deepEqual(hashes(sb[j],sourceShirt),hashes(sa[j],sourceShirt));
   const a=sb[j].geometry.attributes.position,b=sa[j].geometry.attributes.position;
   assert.equal(a.count,b.count);
   for(let i=0;i<a.count;i++){
    const d=Math.hypot(a.getX(i)-b.getX(i),a.getY(i)-b.getY(i),a.getZ(i)-b.getZ(i));
    if(d>.00001)movedShirt++;shirtMax=Math.max(shirtMax,d);
   }
  }
  const bp=pants(r0).geometry.attributes.position,ap=pants(r1).geometry.attributes.position;
  assert.equal(bp.count,ap.count);
  for(let i=0;i<bp.count;i++){
   const d=Math.hypot(bp.getX(i)-ap.getX(i),bp.getY(i)-ap.getY(i),bp.getZ(i)-ap.getZ(i));
   if(d>.00001)movedPants++;pantsMax=Math.max(pantsMax,d);
  }
  assert.ok(movedShirt>250&&shirtMax<=.033,'Real original shirt cloth silhouette must physically change '+JSON.stringify({movedShirt,shirtMax}));
  assert.ok(movedPants>500&&pantsMax<=.041,'Actual rear original photo jeans mesh must change '+JSON.stringify({movedPants,pantsMax}));
  for(const pose of ['relaxed','source','relaxed','source']){
   after.setPose(pose);assert.deepEqual(originalBody(r1),body1);
   assert.deepEqual(hashes(pants(r1),sourceJeans),hashes(pants(r0),sourceJeans));
   sa.forEach((m,j)=>assert.deepEqual(hashes(m,sourceShirt),preserved[j]));
  }
  const fallback=after.setOutfit('pants');
  assert.equal(fallback.pants.photoApplied,false);
  assert.equal(fallback.pants.originalPhotographedHangingLegPanels,undefined);
  assert.equal(after.setOutfit('none').garmentMeshes,0);
  console.log('THREE_D40_TRUE_REAR_AND_SIDE_HANGING_CLOTH',JSON.stringify({model,source:src.id,
    shirt:now.shirt.torsoMovedUniqueVertices,shirtMax:now.shirt.torsoDrapeMaxShift,
    pants:now.pants.rearPanelMovedUniqueVertices,pantsMax:now.pants.rearPanelMaxShift,
    sourceFrontMovedMax:now.shirt.torsoProtectedSourceFrontMaxShift,movedShirt,movedPants}));
 }finally{before.dispose();after.dispose();}
});
test('Standalone photographed shirt independently hangs, original bare pants and dress remain isolated',async()=>{
 const root=await person('female'),c=createOutfitController(root);
 try{
  const s=c.setOutfit('shirt',candidate('shirt'),{reviewed:true});
  assert.equal(s.shirt.originalPhotographedTorsoDrape,true);
  const neutral=c.setOutfit('pants');
  assert.equal(neutral.pants.originalPhotographedHangingLegPanels,undefined);
  assert.equal(neutral.pants.photoApplied,false);
  const d=c.setOutfit('dress',candidate('dress'),{reviewed:true});
  assert.ok(d.dress);assert.equal(d.pants,null);
 }finally{c.dispose();}
});
