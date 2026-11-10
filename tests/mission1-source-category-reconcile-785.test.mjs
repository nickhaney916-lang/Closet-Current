import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reconcileRealSourceRegions785} from '../research/mission1-real-source-review-785/reconcile-regions.mjs';
const sha=n=>n.toString(16).padStart(64,'0');
const fixture=()=>({sourceSHA256:sha(1),modelEvidence:{
 sourceSHA256:sha(1),model:'Xenova/segformer_b0_clothes',
 modelRevision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',
 labelMapSHA256:sha(2),modelMask:[64,64],
 detectedRegions:[
  {semanticRegionId:4,selectedCount:1500,maskSHA256:sha(3),needsReview:true},
  {semanticRegionId:7,selectedCount:400,maskSHA256:sha(4),needsReview:true}
 ]}});
test('real two-class dress source does NOT turn largest upper-garment region into Tops',()=>{
 const r=reconcileRealSourceRegions785(fixture());
 assert.equal(r.automaticCategory,null);
 assert.deepEqual(r.possibleCategories,['Tops','Outerwear','Dresses']);
 assert.deepEqual(r.semanticLabels,['Upper garment (top or outerwear)','Dress']);
 assert.equal(r.mixedOrAmbiguous,true);
 assert.equal(r.needsReview,true);
 assert.equal(r.autoSaveAllowed,false);
 assert.equal(r.ownerReviewed,false);
 assert.equal(r.photographed3DReady,false);
 assert.equal(r.releaseAuthorized,false);
});
test('even a dress-only region never manufactures subtype, human review or owner save',()=>{
 const f=fixture();f.modelEvidence.detectedRegions=f.modelEvidence.detectedRegions.slice(1);
 const r=reconcileRealSourceRegions785(f);
 assert.deepEqual(r.possibleCategories,['Dresses']);
 assert.equal(r.mixedOrAmbiguous,false);
 assert.equal(r.itemType,null);
 assert.equal(r.primaryColor,null);
 assert.equal(r.automaticCategory,null);
 assert.equal(r.verifiedIndependentHumanTruth,false);
});
test('two distinct clothing instances in one class do not claim instance separation',()=>{
 const f=fixture();f.modelEvidence.detectedRegions=[
  {semanticRegionId:6,selectedCount:350,maskSHA256:sha(10),needsReview:true},
  {semanticRegionId:6,selectedCount:600,maskSHA256:sha(11),needsReview:true}];
 const r=reconcileRealSourceRegions785(f);
 assert.deepEqual(r.possibleCategories,['Bottoms']);
 assert.equal(r.predictedGarmentInstancesVerified,false);
 assert.equal(r.observedRegions.length,2);
});
test('source changed after actual inference refuses even valid-looking model receipt',()=>{
 const f=fixture();f.modelEvidence.sourceSHA256=sha(9);
 assert.throws(()=>reconcileRealSourceRegions785(f),/source JPEG/);
});
test('changed model revision, untrusted class or forged human acceptance is rejected',()=>{
 for(const change of [
  f=>f.modelEvidence.modelRevision='wrong',
  f=>f.modelEvidence.detectedRegions[0].semanticRegionId=2,
  f=>f.modelEvidence.detectedRegions[0].needsReview=false,
  f=>f.modelEvidence.detectedRegions[1].maskSHA256=sha(3),
  f=>f.modelEvidence.detectedRegions[0].selectedCount=0,
  f=>f.modelEvidence.detectedRegions[0].selectedCount=99999,
  f=>f.modelEvidence.modelMask=[0,64],
  f=>f.modelEvidence.labelMapSHA256='deadbeef'
 ]){
  const f=fixture();change(f);
  assert.throws(()=>reconcileRealSourceRegions785(f));
 }
});
test('conserves at most source pixel area and retains original per-region mask identity',()=>{
 const f=fixture();
 f.modelEvidence.detectedRegions[0].selectedCount=3500;
 f.modelEvidence.detectedRegions[1].selectedCount=1000;
 assert.throws(()=>reconcileRealSourceRegions785(f),/exceeds source raster/);
 const r=reconcileRealSourceRegions785(fixture());
 assert.equal(r.totalSelectedModelPixels,1900);
 assert.equal(r.observedRegions[1].sourceMaskSHA256,sha(4));
});
