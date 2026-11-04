import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assessFootwearModelReadiness} from '../benchmark/footwear-readiness.mjs';
const lip=JSON.parse(await readFile('benchmark/LIP-SOCKS-REAL-REVIEW-20261017.json','utf8'));
const suite=JSON.parse(await readFile('benchmark/deepfashion-real-photo-suite.json','utf8'));
const SHA='a'.repeat(64);
function fakeDeepFashion(){
 return {
  status:'complete',model:'pinned-experimental',modelHashVerified:true,
  sourceHashesVerified:true,originalPhotosPreserved:true,customerModelChanged:false,
  automaticItemsCreated:0,
  cases:suite.cases.map(c=>({
   id:c.id,sourceSha256:SHA,originalPreserved:true,automaticItemsSaved:0,
   instanceMasksVerified:0,proposedMasks:0,proposals:[],
   categoryCoverageReview:{
    negativeFootwearControl:c.expectedCategory==='Shoes',
    categorySupportedByThisModel:c.expectedCategory==='Shoes'?false:true,
    contextCategoryIsNotGroundTruth:true,
    instancePrecisionRecallMeasured:false
   },
   manualReviewRisk:{manualReviewFlags:c.expectedCategory==='Shoes'?
    ['unsupported-footwear-taxonomy','no-model-proposals']:['no-model-proposals']}
  }))
 };
}
test('no shoe category is not declared correctly isolated footwear',()=>{
 const audit=assessFootwearModelReadiness(fakeDeepFashion(),lip,suite);
 assert.equal(audit.negativeFootwearControls.length,2);
 assert.equal(audit.negativeFootwearControls.every(x=>x.actualDeepFashionProposals===0),true);
 assert.equal(audit.measuredFootwearRecall,null);
 assert.equal(audit.comparableModelAccuracyImprovement,null);
 assert.equal(audit.lipBootShaftContaminationObserved,true);
 assert.equal(audit.lipTightsMissObserved,true);
 assert.equal(audit.canPromoteModel,false);
 assert.equal(audit.autoSavedCustomerItems,0);
 assert.equal(audit.samePhotoPairedPixelEvaluationAvailable,false);
 assert.equal(audit.humanApprovedPixelOutlinesAvailable,false);
});
test('unapproved LIP shoe pixels cannot masquerade as independent accuracy',()=>{
 const sample=fakeDeepFashion();
 for(const altered of [
  {...lip,accuracyPercentage:100},
  {...lip,groundTruthPixelMasksAvailable:true},
  {...lip,modelSha256:'b'.repeat(64)},
  {...lip,automaticHosieryCatalogApproved:true},
  {...lip,findings:lip.findings.map(x=>({...x,clothingSeparatedCorrectly:true}))},
  {...lip,findings:lip.findings.map(x=>({...x,perPixelAccuracyMeasured:true}))}
 ])assert.throws(()=>assessFootwearModelReadiness(sample,altered,suite));
});
test('footwear negative controls cannot silently become false success claims',()=>{
 const x=fakeDeepFashion();
 const originals=x.cases.find(c=>c.id==='commons-0079');
 for(const alternate of [
  {...originals,proposedMasks:1,proposals:[{itemType:'Sneakers'}]},
  {...originals,categoryCoverageReview:{...originals.categoryCoverageReview,categorySupportedByThisModel:true}},
  {...originals,sourceSha256:'bad'},
  {...originals,instanceMasksVerified:1}
 ]){
  const changed=structuredClone(x);changed.cases[changed.cases.findIndex(c=>c.id==='commons-0079')]=alternate;
  assert.throws(()=>assessFootwearModelReadiness(changed,lip,suite));
 }
 const incomplete=structuredClone(x);incomplete.cases.pop();
 assert.throws(()=>assessFootwearModelReadiness(incomplete,lip,suite));
});
