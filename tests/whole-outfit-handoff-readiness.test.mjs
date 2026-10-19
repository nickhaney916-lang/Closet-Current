import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateWholeOutfitHandoff} from '../benchmark/whole-outfit-handoff-readiness.mjs';
const sourceSha256='0e145aa5432df3457521200d1e1bb896f66abd66fb041d31ed0db591e00e2fdc';
const base=()=>({sourceId:'validation-0031',sourceSha256,actualSegmentationWorker:true,actualRecognitionWorker:true,
 status:'complete',splitFailed:false,pageErrors:[],expectedLabelsFromSourceDescription:true,
 expectedSupportedCategories:['Tops','Outerwear','Bottoms','Shoes'],automaticSaved:[],pendingReview:[],
 automaticSaveCount:0,reviewPendingCount:0,emittedPieceCount:0});
const piece=(category,extra={})=>({category,color:'Black',originalPreserved:true,recognitionCropPresent:true,...extra});
const reportWith=(r,saved,pending=[])=>({...r,automaticSaved:saved,pendingReview:pending,
 automaticSaveCount:saved.length,reviewPendingCount:pending.length,emittedPieceCount:saved.length+pending.length});
test('actual layered-outfit blocked baseline cannot be called accuracy or production readiness',()=>{
 const input=reportWith(base(),[],[piece('Uncategorized',{segmentHint:{displayFallback:'original-crop',displayFallbackReason:'fragmented-mask'}}),piece('Uncategorized',{segmentHint:{displayFallback:'original-crop',displayFallbackReason:'fragmented-mask'}})]);
 const result=evaluateWholeOutfitHandoff(input);
 assert.equal(result.status,'blocked');
 assert.equal(result.automaticSavedCount,0);
 assert.equal(result.reviewPendingCount,2);
 assert.deepEqual(result.referenceMissingAutomaticCategories,['Tops','Outerwear','Bottoms','Shoes']);
 assert.ok(result.blockers.includes('zero-automatic-garments'));
 assert.equal(result.measuredMaskRecall,null);
 assert.equal(result.measuredCategoryCorrectGarmentRecall,null);
 assert.equal(result.productionReady,false);
 assert.equal(result.referenceLabelStatus,'source-description-not-independent-ground-truth');
});
test('even all reference categories automatically saved is NOT independent photo accuracy',()=>{
 const r=reportWith(base(),['Tops','Outerwear','Bottoms','Shoes'].map(piece));
 const result=evaluateWholeOutfitHandoff(r);
 assert.equal(result.referenceHandoffComplete,true);
 assert.equal(result.status,'reference-category-handoff-complete-not-accuracy');
 assert.equal(result.independentHumanGroundTruthVerified,false);
 assert.equal(result.physicalPhoneVerified,false);
 assert.equal(result.measuredPhysicalGarmentCountRecall,null);
 assert.equal(result.productionReady,false);
});
test('fabricated dress and saved original-crop fragments must not be considered complete',()=>{
 const r=reportWith(base(),[piece('Dresses',{segmentHint:{displayFallback:'original-crop'}}),piece('Shoes')]);
 const result=evaluateWholeOutfitHandoff(r);
 assert.equal(result.unapprovedAutomaticSaves,1);
 assert.ok(result.referenceUnexpectedAutomaticCategories.includes('Dresses'));
 assert.ok(result.blockers.includes('unsafe-automatic-saves'));
 assert.equal(result.referenceHandoffComplete,false);
});
test('missing source pixels, mismatch of counts, untrusted report or categories are rejected/blocked',()=>{
 const lost=reportWith(base(),[piece('Tops',{originalPreserved:false})]);
 assert.equal(evaluateWholeOutfitHandoff(lost).sourcePreserved,false);
 assert.ok(evaluateWholeOutfitHandoff(lost).blockers.includes('original-or-recognition-crop-not-preserved'));
 assert.throws(()=>evaluateWholeOutfitHandoff({...lost,automaticSaveCount:99}),/Inconsistent/);
 assert.throws(()=>evaluateWholeOutfitHandoff({...lost,actualSegmentationWorker:false}),/real-model/);
 assert.throws(()=>evaluateWholeOutfitHandoff({...lost,sourceSha256:'none'}),/source ID/);
 assert.throws(()=>evaluateWholeOutfitHandoff({...lost,expectedSupportedCategories:['Tops','Tops']}),/reference set/);
});
