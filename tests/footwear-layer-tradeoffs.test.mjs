import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateFootwearLayerTradeoffs} from '../benchmark/footwear-layer-tradeoffs.mjs';
function fixtures(){
 const locked=[],sets=[];
 let n=0;
 for(const [name,count] of [['reviewed32',32],['holdout16',16],['fresh11',11]]){
  const manifest=[],results=[];
  for(let i=0;i<count;i++){
   const num=++n,id='commons-'+String(num).padStart(4,'0'),source='https://commons.wikimedia.org/wiki/File:'+id;
   const bootRight=name==='reviewed32'&&i<5;
   const sneakerWrong=name==='holdout16'&&i===0;
   const shoe=bootRight||sneakerWrong;
   const type=bootRight?'Boots':sneakerWrong?'Sneakers':'T-shirt';
   locked.push({id,image:id+'.jpg',verified:true,sha256:num.toString(16).padStart(64,'0'),
    attribution:{source,license:'CC0'}});
   manifest.push({id,image:id+'.jpg',mode:'single',verified:true,source,
    expectedCategory:shoe?'Shoes':'Tops',expectedType:type,
    ...(bootRight?{acceptedTypes:['Boots','Ankle boots','Tall boots']}:{})});
   results.push({id,prediction:{category:shoe?'Shoes':'Tops',type:shoe?'Ankle boots':'T-shirt'},strong:true});
  }
  sets.push({name,manifest,results});
 }
 const wrong=sets[1].manifest[0].id;
 const framing={sourcePhotos:16,observedFrameAgreementProvesPhysicalType:false,autoSavedGarments:0,
  canPromoteThresholds:false,baselineWrongTypeWithFullFrameAgreementIds:[wrong]};
 const cross={status:'same-source-experimental-model-review-only',independentHumanOutlinesComplete:false,
  autoSavedCustomerItems:0,canPromoteModel:false,sourceRows:[
   {id:'validation-0031',sourceSha256:'a'.repeat(64),physicalGarmentCount:null,
    matchedInstanceIoU:null,customerClothingItemsCreated:0,
    possibleMissedItemsNeedIndependentReview:true,
    semanticPersonGatePassed:true,modelDisagreementTypes:['skirt'],semanticDressVsLayersAmbiguity:true},
   {id:'commons-0059',sourceSha256:'b'.repeat(64),physicalGarmentCount:null,
    matchedInstanceIoU:null,customerClothingItemsCreated:0,
    possibleMissedItemsNeedIndependentReview:true,semanticPersonGatePassed:false,
    modelDisagreementTypes:['long_sleeve_top'],semanticDressVsLayersAmbiguity:false}
  ]};
 return {sets,locked,framing,cross,wrong};
}
test('blanket ankle boot review can stop one apparent wrong form but costs five correct referenced boot saves',()=>{
 const {sets,locked,framing,cross,wrong}=fixtures();
 const r=evaluateFootwearLayerTradeoffs(sets,locked,framing,cross);
 assert.equal(r.actualOriginalPhotoCount,59);
 assert.equal(r.verifiedShoesTotal,6);
 assert.deepEqual(r.cohorts.reviewed32.wrongSpecificFormDeferredVsUnreviewedManifest,[]);
 assert.equal(r.cohorts.reviewed32.correctSpecificFormDeferredVsUnreviewedManifest.length,5);
 assert.deepEqual(r.cohorts.holdout16.wrongSpecificFormDeferredVsUnreviewedManifest,[wrong]);
 assert.deepEqual(r.wrongFormRemainsUnanimousAcrossSameModelOriginalFrames,[wrong]);
 assert.equal(r.physicalGarmentRecall,null);
 assert.equal(r.maskAccuracy,null);
 assert.equal(r.recommendedAutomaticSubtypePolicy,null);
 assert.equal(r.generatedCustomerPieces,0);
 assert.equal(r.paidInferenceCalls,0);
 assert.equal(r.productionScannerModified,false);
 assert.equal(r.wholeOutfitCrossModelReview.length,2);
 assert.ok(r.wholeOutfitCrossModelReview.every(x=>x.modelCanAddAutoSave===false));
});
test('cross-cohort duplicate photos, missing model results and tampered original hashes abort audit',()=>{
 const f=fixtures();
 assert.throws(()=>evaluateFootwearLayerTradeoffs(
  [{...f.sets[0],manifest:[...f.sets[0].manifest,f.sets[0].manifest[0]]},...f.sets.slice(1)],
  f.locked,f.framing,f.cross),/Duplicate|Incomplete/);
 assert.throws(()=>evaluateFootwearLayerTradeoffs(
  [{...f.sets[0],results:f.sets[0].results.slice(1)},...f.sets.slice(1)],
  f.locked,f.framing,f.cross),/Incomplete/);
 assert.throws(()=>evaluateFootwearLayerTradeoffs(
  f.sets,[{...f.locked[0],sha256:'bad'},...f.locked.slice(1)],f.framing,f.cross),/Unverified/);
 assert.throws(()=>evaluateFootwearLayerTradeoffs(f.sets,f.locked,
  {...f.framing,canPromoteThresholds:true},f.cross),/Untrusted/);
 assert.throws(()=>evaluateFootwearLayerTradeoffs(f.sets,f.locked,f.framing,
  {...f.cross,canPromoteModel:true}),/Untrusted/);
});
test('model-only layered disagreement never becomes footwear proof or independent physical piece recall',()=>{
 const f=fixtures();const r=evaluateFootwearLayerTradeoffs(f.sets,f.locked,f.framing,f.cross);
 assert.deepEqual(r.wholeOutfitCrossModelReview.map(x=>x.independentModelDisagreements),[
  ['skirt'],['long_sleeve_top']]);
 assert.ok(r.wholeOutfitCrossModelReview.every(x=>x.verifiedPhysicalGarmentCount===null));
 assert.equal(r.independentlyReviewedLayers,0);
 assert.equal(r.shoeActualSpecificFormAccuracy,null);
 assert.equal(r.releaseApproved,false);
});
