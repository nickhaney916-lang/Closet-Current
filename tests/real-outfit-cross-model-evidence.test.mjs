import test from 'node:test';
import assert from 'node:assert/strict';
import {compareRealOutfitModelEvidence} from '../benchmark/real-outfit-cross-model-evidence.mjs';
const hash='0e145aa5432df3457521200d1e1bb896f66abd66fb041d31ed0db591e00e2fdc';
const deep=()=>({status:'complete',modelHashVerified:true,sourceHashesVerified:true,
 independentReferencesAvailable:false,automaticItemsCreated:0,customerModelChanged:false,
 model:'HasanKabir23/Yolov26s-DeepFashion2',
 cases:[{id:'validation-0031',sourceSha256:hash,proposals:[
  {itemType:'long_sleeve_top',confidence:.685,pixelArea:50845},
  {itemType:'skirt',confidence:.238,pixelArea:47200}]}]});
const flow=()=>({status:'complete',sourceId:'validation-0031',sourceSha256:hash,
 actualSegmentationWorker:true,actualRecognitionWorker:true,
 modelRegionDiagnostics:{version:1,sourcePixelsUnchanged:true,realPhotoAccuracy:null,
 regions:[
  {id:4,winningModelPixels:396,trustedMaskPixels:56,emitted:false},
  {id:5,winningModelPixels:0,trustedMaskPixels:0,emitted:false},
  {id:6,winningModelPixels:10,trustedMaskPixels:0,emitted:false},
  {id:7,winningModelPixels:1120,trustedMaskPixels:527,emitted:true},
  {id:9,winningModelPixels:312,trustedMaskPixels:217,emitted:true}
 ]}});
test('actual-run-derived licensed layered outfit reveals skirt disagreement without inventing truth',()=>{
 const r=compareRealOutfitModelEvidence(deep(),flow());
 assert.equal(r.sourceId,'validation-0031');
 assert.equal(r.deepFashionProposals.length,2);
 const skirt=r.deepFashionProposals.find(x=>x.proposedType==='skirt');
 assert.equal(skirt.instanceModelConfidence,.238);
 assert.equal(skirt.proposedCategory,'Bottoms');
 assert.equal(skirt.semanticWinningPixels,0);
 assert.equal(skirt.evidenceRelation,'semantic-class-not-predicted');
 assert.equal(skirt.priority,'inspect-source-for-model-disagreement');
 assert.equal(skirt.canAutoSave,false);
 assert.equal(r.semanticOnlyGroups.find(x=>x.semanticClassId===9).instanceModelHasClass,false);
 assert.equal(r.semanticPixelAccuracy,null);
 assert.equal(r.instancePixelAccuracy,null);
 assert.equal(r.categoryCorrectRecall,null);
 assert.equal(r.productionReady,false);
 assert.equal(r.wardrobeItemsAutoSavedByAudit,0);
});
test('other model top cannot be promoted as an independently detected blazer or shirt',()=>{
 const r=compareRealOutfitModelEvidence(deep(),flow());
 const top=r.deepFashionProposals.find(x=>x.proposedType==='long_sleeve_top');
 assert.equal(top.proposedCategory,'Tops');
 assert.equal(top.evidenceRelation,'semantic-region-suppressed');
 assert.equal(top.reliableInstanceConfidenceEstablished,false);
 assert.equal(top.needsIndependentFullSceneReview,true);
 assert.equal(r.actualPhysicalGarmentCount,null);
});
test('same original SHA, authentic per-model provenance and source ID required',()=>{
 const a=deep(),b=flow();
 assert.throws(()=>compareRealOutfitModelEvidence({...a,modelHashVerified:false},b),/Untrusted/);
 assert.throws(()=>compareRealOutfitModelEvidence({...a,cases:[{...a.cases[0],sourceSha256:'b'.repeat(64)}]},b),/same verified original/);
 assert.throws(()=>compareRealOutfitModelEvidence({...a,automaticItemsCreated:1},b),/Untrusted/);
 assert.throws(()=>compareRealOutfitModelEvidence(a,{...b,actualSegmentationWorker:false}),/Untrusted/);
 assert.throws(()=>compareRealOutfitModelEvidence(a,{...b,sourceId:'commons-0035'}),/same verified original/);
});
test('malformed logits summary, invalid confidence and unknown labels reject audit',()=>{
 const a=deep(),b=flow();
 assert.throws(()=>compareRealOutfitModelEvidence(
  {...a,cases:[{...a.cases[0],proposals:[{itemType:'shoes',confidence:.9,pixelArea:200}]}]},b),/Invalid unapproved/);
 assert.throws(()=>compareRealOutfitModelEvidence(
  {...a,cases:[{...a.cases[0],proposals:[{itemType:'skirt',confidence:2,pixelArea:100}]}]},b),/Invalid unapproved/);
 assert.throws(()=>compareRealOutfitModelEvidence(a,{
  ...b,modelRegionDiagnostics:{...b.modelRegionDiagnostics,regions:b.modelRegionDiagnostics.regions.slice(1)}
 }),/Missing real-model/);
 assert.throws(()=>compareRealOutfitModelEvidence(a,{
  ...b,modelRegionDiagnostics:{...b.modelRegionDiagnostics,regions:b.modelRegionDiagnostics.regions.concat(b.modelRegionDiagnostics.regions[0])}
 }),/Malformed semantic/);
});
test('semantic emitted flag does not imply a complete garment instance',()=>{
 const b=flow();b.modelRegionDiagnostics.regions[0].emitted=true;
 const r=compareRealOutfitModelEvidence(deep(),b);
 assert.equal(r.deepFashionProposals[0].evidenceRelation,'broad-semantic-region-emitted-not-instance-verified');
 assert.equal(r.deepFashionProposals[0].canAutoSave,false);
});
