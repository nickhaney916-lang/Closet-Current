import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {PANTS_RESEARCH_SOURCE,PANTS_RESEARCH_SOURCE_SECOND} from '../research/three-d-30/reviewed-photo-pants.mjs';

const hash=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
function clothSource(){return candidate('shirt');}
function candidateJeans(src){return {id:src.id,type:'pants',sourceSHA256:src.originalSHA256,cutoutSHA256:src.cutoutSHA256,
 sourceAssetsVerified:true,originalVerified:true,cutoutVerified:true,visibleSourceRGBPreserved:true,
 frontOrientationReviewed:true,neutralColorRGB:src.id===PANTS_RESEARCH_SOURCE.id?[83,104,135]:[57,81,120],
 cropRect:src.id===PANTS_RESEARCH_SOURCE.id?[.085,.07,.87,.82]:[.055,.08,.88,.86],
 cutout:{width:src.id===PANTS_RESEARCH_SOURCE.id?435:1754,height:src.id===PANTS_RESEARCH_SOURCE.id?650:2838},
 ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,provisional:true};}
const modelBody=r=>{let result=[];r.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)result.push({name:o.name,original:hash(o.geometry.attributes.position.array),skin:hash(o.geometry.attributes.skinWeight.array)});});return result;};
const meshes=r=>{const array=[];r.traverse(o=>{if(o.isSkinnedMesh&&o.userData.work56Garment)array.push(o);});return array;};
const pants=r=>meshes(r).find(m=>m.userData.work60Pants);
const shirtMeshes=r=>meshes(r).filter(m=>!m.userData.work60Pants);
const immutableShirt=m=>Object.fromEntries(['panelPosition','panelNormal','skinIndex','skinWeight'].map(id=>[id,hash(m.geometry.attributes[id].array)]));
const immutablePants=m=>Object.fromEntries(['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'].map(id=>[id,hash(m.geometry.attributes[id].array)]));

for(const model of ['female','male'])for(const original of [PANTS_RESEARCH_SOURCE,PANTS_RESEARCH_SOURCE_SECOND])
 test(model+' original shirt over separately photographed denim '+original.id+' physical hem drape and neutral fallback',async()=>{
  const beforeRoot=await person(model),afterRoot=await person(model);
  const originalBody1=modelBody(beforeRoot),originalBody2=modelBody(afterRoot);
  const before=createOutfitController(beforeRoot,{shirtHangingSilhouette:false,denimHangingSilhouette:false,sourceShirtWaistFit:false,clothWaistContact:false});
  const after=createOutfitController(afterRoot,{shirtHangingSilhouette:false,denimHangingSilhouette:false,sourceShirtWaistFit:true,clothWaistContact:false});
  try{
   const jeans=candidateJeans(original),s=clothSource();
   const a=before.setOutfit('shirt-pants',s,{reviewed:true,pantsCandidate:jeans,pantsReviewed:true});
   const b=after.setOutfit('shirt-pants',s,{reviewed:true,pantsCandidate:jeans,pantsReviewed:true});
   assert.equal(a.shirt.originalPhotoShirtOverDenim,undefined,'Previous full outfit has no waist relationship');
   assert.equal(b.shirt.originalPhotoShirtOverDenim,true,'Real source-derived waist shaping actually applied');
   assert.equal(b.shirt.outfitPantSourceId,original.id);
   assert.equal(b.pants.sourceId,original.id);
   assert.equal(b.shirt.sourcePanelPixelsUnchanged,true);
   assert.equal(b.shirt.sourcePanelCoordinatesUnchanged,true);
   assert.equal(b.shirt.originalShirtSkinAndOriginalPantUVUnchanged,true);
   assert.ok(b.shirt.shirtHemUniqueMoved>=35);
   assert.ok(b.shirt.shirtHemMaxMove>=.003&&b.shirt.shirtHemMaxMove<=.028001);
   assert.ok(b.shirt.shirtHemMeanMove>.0003);
   assert.ok(b.shirt.shirtHemFlaringVertices>10);
   assert.ok(b.shirt.shirtWaistOrientedRadialGapMinAfter>=b.shirt.shirtWaistOrientedRadialGapMinBefore);
   assert.equal(b.shirt.humanVisualApproval,false);assert.equal(b.shirt.signedCollisionValidated,false);
   assert.equal(b.shirt.releaseAuthorized,false);
   assert.deepEqual(modelBody(beforeRoot),originalBody1);assert.deepEqual(modelBody(afterRoot),originalBody2);
   assert.deepEqual(immutablePants(pants(beforeRoot)),immutablePants(pants(afterRoot)),'Actual original jeans photo/rest/skin attributes equal');
   const first=shirtMeshes(beforeRoot).filter(m=>m.name!=='Work59-source-neutral-collar-band'),
    second=shirtMeshes(afterRoot).filter(m=>m.name!=='Work59-source-neutral-collar-band');
   assert.ok(first.length>0);assert.equal(first.length,second.length);
   let moved=0,max=0;const preserve=[];
   for(let j=0;j<first.length;j++){
    const old=first[j].geometry,newer=second[j].geometry;
    assert.deepEqual(immutableShirt(first[j]),immutableShirt(second[j]),'Original shirt texture projection and bones exact');
    preserve.push(immutableShirt(second[j]));
    assert.equal(old.attributes.position.count,newer.attributes.position.count);
    for(let k=0;k<old.attributes.position.count;k++){
     const p=old.attributes.position,q=newer.attributes.position;
     const d=Math.hypot(p.getX(k)-q.getX(k),p.getY(k)-q.getY(k),p.getZ(k)-q.getZ(k));
     if(d>1e-5)moved++;max=Math.max(max,d);
    }
   }
   assert.ok(moved>40,'Visible physical hem geometry actually moved: '+moved);
   assert.ok(max<.029,'Real garment shift bounded '+max);
   for(const pose of ['relaxed','source','relaxed','source']){
    after.setPose(pose);
    second.forEach((m,i)=>assert.deepEqual(immutableShirt(m),preserve[i]));
    assert.deepEqual(modelBody(afterRoot),originalBody2);
   }
   const plain=after.setOutfit('pants');
   assert.equal(plain.pants.photoApplied,false);
   assert.equal(plain.shirt,null);assert.equal(after.setOutfit('none').garmentMeshes,0);
   console.log('THREE_D38_ACTUAL_FULL_OUTFIT_WAIST',JSON.stringify({model,source:original.id,
    movedVertices:b.shirt.shirtHemUniqueMoved,changed:moved,max:b.shirt.shirtHemMaxMove,mean:b.shirt.shirtHemMeanMove,
    waistY:b.shirt.garmentWaistY,before:b.shirt.shirtWaistOrientedRadialGapMinBefore,
    after:b.shirt.shirtWaistOrientedRadialGapMinAfter,front:b.shirt.shirtHemFrontVertices,
    side:b.shirt.shirtHemSideVertices,back:b.shirt.shirtHemRearVertices}));
  }finally{before.dispose();after.dispose();}
 });
test('Shirt alone, neutral pants and dress do not activate photographed outfit-waist operation',async()=>{
 const root=await person('female'),app=createOutfitController(root,{shirtHangingSilhouette:false,denimHangingSilhouette:false});
 try{
  const top=app.setOutfit('shirt',clothSource(),{reviewed:true});
  assert.equal(top.shirt.originalPhotoShirtOverDenim,undefined);
  const plain=app.setOutfit('pants');assert.equal(plain.pants.photoApplied,false);
  const dress=app.setOutfit('dress',candidate('dress'),{reviewed:true});
  assert.ok(dress.dress);assert.equal(dress.pants,null);
 }finally{app.dispose();}
});
