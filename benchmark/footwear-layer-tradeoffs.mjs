// Counterfactual research on ACTUAL original-photo model output, not a scanner
// policy. Recognizer's model cannot see independently proved physical items.
// Do NOT convert any of these source-ID or manifest-relative results into app
// thresholds, automatic labels, paid inference or claimed garment recall.
const SHA=/^[0-9a-f]{64}$/;
const expectedType=(truth,pred)=>[truth.expectedType,...(truth.acceptedTypes||[])].includes(pred);
const mapUnique=(rows,key,kind)=>{
 if(!Array.isArray(rows))throw Error('Missing '+kind);
 const map=new Map();
 for(const row of rows){
  if(typeof row?.[key]!=='string'||!row[key]||map.has(row[key]))throw Error('Missing or duplicate '+kind+' ID');
  map.set(row[key],row);
 }
 return map;
};
export function evaluateFootwearLayerTradeoffs(
 suites,lockedSources,framingAudit,crossModelEvidence
){
 if(!Array.isArray(suites)||suites.length!==3||!Array.isArray(lockedSources)||
    framingAudit?.sourcePhotos!==16||framingAudit?.observedFrameAgreementProvesPhysicalType!==false||
    framingAudit?.autoSavedGarments!==0||framingAudit?.canPromoteThresholds!==false||
    crossModelEvidence?.status!=='same-source-experimental-model-review-only'||
    crossModelEvidence?.independentHumanOutlinesComplete!==false||
    crossModelEvidence?.autoSavedCustomerItems!==0||
    crossModelEvidence?.canPromoteModel!==false)
  throw Error('Untrusted original-source trial inputs');
 const all=mapUnique(lockedSources,'id','locked-source'),cohortIDs=new Set(),byCohort={},sourceCounts=[];
 for(const {name,manifest,results} of suites){
  if(!['reviewed32','holdout16','fresh11'].includes(name)||byCohort[name]||
     !Array.isArray(manifest)||!Array.isArray(results))
   throw Error('Invalid or repeated cohort');
  const truth=mapUnique(manifest,'id','manifest'),model=mapUnique(results,'id','model');
  if(model.size!==truth.size)throw Error('Incomplete actual model inference for '+name);
  const photos=[],shoes=[];
  for(const m of manifest){
   if(cohortIDs.has(m.id))throw Error('Source leakage across nominally separate cohorts');
   cohortIDs.add(m.id);
   const original=all.get(m.id),r=model.get(m.id);
   if(!r||!original||!SHA.test(original.sha256||'')||original.verified!==true||
      original.image!==m.image||original.attribution?.source!==m.source||
      !original.attribution?.license||!m.verified||m.mode!=='single')
    throw Error('Unverified original RGB/model result: '+m.id);
   photos.push(m.id);
   if(m.expectedCategory!=='Shoes')continue;
   const p=r.prediction||{},shoe=p.category==='Shoes';
   shoes.push({id:m.id,originalSha256:original.sha256,
    manifestType:m.expectedType,manifestAcceptedTypes:[m.expectedType,...m.acceptedTypes||[]],
    predictedCategory:p.category||null,predictedType:p.type||null,
    strong:r.strong===true,shoeCategoryEmitted:shoe,
    manifestRelativeSpecificFormCorrect:shoe&&expectedType(m,p.type),
    proposedBlanketAnkleBootReview:shoe&&p.type==='Ankle boots'&&r.strong===true,
    // Same-model 288/320/336 views cannot independently corroborate a shoe.
    independentlyVerifiedShoeShape:false,physicalItemGroundTruth:null});
  }
  const deferred=shoes.filter(x=>x.proposedBlanketAnkleBootReview);
  byCohort[name]={
   photos:photos.length,garmentShoeReferences:shoes.length,observedShoeCategoryEmissions:shoes.filter(x=>x.shoeCategoryEmitted).length,
   policy:'counterfactual-defer-all-strong-ankle-boots-specific-types',
   wouldDeferIds:deferred.map(x=>x.id),
   wrongSpecificFormDeferredVsUnreviewedManifest:deferred.filter(x=>!x.manifestRelativeSpecificFormCorrect).map(x=>x.id),
   correctSpecificFormDeferredVsUnreviewedManifest:deferred.filter(x=>x.manifestRelativeSpecificFormCorrect).map(x=>x.id),
   sourcePhotosEdited:0,userClosetChanges:0,noPolicyPromotion:true,
   shoes};
  sourceCounts.push(photos.length);
 }
 if(byCohort.reviewed32?.photos!==32||byCohort.holdout16?.photos!==16||
    byCohort.fresh11?.photos!==11||all.size!==cohortIDs.size)
  throw Error('Missing or overlapping 59 original photographs');
 const wrong=new Set(framingAudit.baselineWrongTypeWithFullFrameAgreementIds||[]);
 const persistent=byCohort.holdout16.shoes.filter(x=>wrong.has(x.id)).map(x=>x.id);
 const confirmedCross=[];
 const knownSourceHash=new Set([...all.values()].map(x=>x.sha256));
 for(const r of crossModelEvidence.sourceRows||[]){
  if(!SHA.test(r?.sourceSha256||'')||r.physicalGarmentCount!==null||
     r.matchedInstanceIoU!==null||r.customerClothingItemsCreated!==0||
     !r.possibleMissedItemsNeedIndependentReview||
     !Array.isArray(r.modelDisagreementTypes))
   throw Error('Untrusted original-source layered cross-model evidence');
  confirmedCross.push({originalSourceId:r.id,sha256:r.sourceSha256,
   originalIsAmong59FashionClipSources:knownSourceHash.has(r.sourceSha256),
   semanticPersonGatePassed:r.semanticPersonGatePassed,
   independentModelDisagreements:r.modelDisagreementTypes,
   dressVsLayerModelOnlyFlag:r.semanticDressVsLayersAmbiguity,
   verifiedPhysicalGarmentCount:null,independentMaskIoU:null,
   garmentCountRecalled:null,modelCanAddAutoSave:false});
 }
 if(confirmedCross.length!==2)throw Error('Expected exact pinned two-scene cross-model evidence');
 return {schemaVersion:1,status:'counterfactual-footwear-and-layered-model-tradeoffs-only',
  actualOriginalPhotoCount:sourceCounts.reduce((a,b)=>a+b,0),cohorts:byCohort,
  verifiedShoesTotal:Object.values(byCohort).reduce((n,c)=>n+c.garmentShoeReferences,0),
  wrongFormRemainsUnanimousAcrossSameModelOriginalFrames:persistent,
  wholeOutfitCrossModelReview:confirmedCross,
  shoeActualSpecificFormAccuracy:null,independentlyVerifiedFootwearForms:0,
  independentlyReviewedLayers:0,physicalGarmentRecall:null,
  maskAccuracy:null,modelWeightsChanged:false,productionScannerModified:false,
  recommendedAutomaticSubtypePolicy:null,
  generatedCustomerPieces:0,paidInferenceCalls:0,releaseApproved:false,
  interpretation:'A blanket Ankle boots veto loses correct referenced boots while detecting one disputed sneaker. Three same-model framings agree on its wrong label; neither confidence nor prompt-framing consensus establishes a true sneaker/boot. DeepFashion lacks footwear/hosiery; its low-confidence skirt proposal does not establish a physical item. Do not auto-promote either route.'};
}
