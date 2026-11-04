// Independent, human-reviewed quality gate for garment-only clipping.
// This never operates on a customer photo or changes model output. A green
// test/workflow is NOT evidence of accepted pixel-level garment accuracy.
import {scoreApprovedPredictionAtReferenceResolution,scoreApprovedGarmentEdgeRetention}
 from './garment-mask-metrics.mjs';

export const clippingPolicy=Object.freeze({
 minimumApprovedPhotos:6,
 minimumIoU:0.95,
 minimumGarmentRecall:0.98,
 minimumBoundaryRecall:0.98,
 minimumLowerBoundaryRecall:0.98
});
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&a>=b-1e-12;
const gain=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&a>b+1e-12;

export function evaluateClippingAcceptance(manifest,evidence){
 if(manifest?.schemaVersion!==1||!Array.isArray(manifest.cases)||
    !(evidence instanceof Map))throw Error('Invalid garment acceptance inputs');
 const ids=new Set(),cases=[];
 for(const entry of manifest.cases){
  if(!/^commons-[0-9]{4}$/.test(entry?.id)||ids.has(entry.id)||
     entry.image!==entry.id+'.jpg'||!/^[a-f0-9]{64}$/.test(entry.sourceSha256))
   throw Error('Invalid or repeated locked garment source');
  ids.add(entry.id);
  const item=evidence.get(entry.id);
  if(entry.reviewStatus!=='approved'||!entry.referenceMask||!item?.reference){
   cases.push({id:entry.id,status:'blocked-unapproved-reference',reasons:['No independently approved original-photo outline']});
   continue;
  }
  if(!item.baseline||!item.candidate){
   cases.push({id:entry.id,status:'blocked-missing-model-pair',
    reasons:['Baseline and candidate predictions are both required']});
   continue;
  }
  try{
   const original=scoreApprovedPredictionAtReferenceResolution(item.reference,entry,item.baseline);
   const proposed=scoreApprovedPredictionAtReferenceResolution(item.reference,entry,item.candidate);
   const beforeEdges=scoreApprovedGarmentEdgeRetention(item.reference,entry,item.baseline);
   const afterEdges=scoreApprovedGarmentEdgeRetention(item.reference,entry,item.candidate);
   const errors=[];
   if(proposed.garmentRecall===null||proposed.intersectionOverUnion===null||
      afterEdges.boundaryPixelRecall===null||afterEdges.lowerBoundaryRecall===null)
    errors.push('Candidate has no scorable foreground or garment boundary');
   if(!near(proposed.garmentRecall,original.garmentRecall)||
      proposed.falsePositive>original.falsePositive||
      !near(proposed.intersectionOverUnion,original.intersectionOverUnion)||
      !near(afterEdges.boundaryPixelRecall,beforeEdges.boundaryPixelRecall)||
      !near(afterEdges.lowerBoundaryRecall,beforeEdges.lowerBoundaryRecall)||
      !near(afterEdges.lowerGarmentRecall,beforeEdges.lowerGarmentRecall))
    errors.push('Candidate removes real fabric, loses edge detail or increases background leakage');
   if(!(proposed.intersectionOverUnion>=clippingPolicy.minimumIoU&&
      proposed.garmentRecall>=clippingPolicy.minimumGarmentRecall&&
      afterEdges.boundaryPixelRecall>=clippingPolicy.minimumBoundaryRecall&&
      afterEdges.lowerBoundaryRecall>=clippingPolicy.minimumLowerBoundaryRecall))
    errors.push('Candidate falls below the conservative reviewed-photo quality thresholds');
   const improves=gain(proposed.intersectionOverUnion,original.intersectionOverUnion)||
     gain(proposed.garmentRecall,original.garmentRecall)||
     gain(afterEdges.boundaryPixelRecall,beforeEdges.boundaryPixelRecall)||
     gain(afterEdges.lowerBoundaryRecall,beforeEdges.lowerBoundaryRecall)||
     proposed.falsePositive<original.falsePositive;
   cases.push({id:entry.id,status:errors.length?'blocked-quality-regression':'scored-reviewed',
    reasons:errors,improves,
    baseline:{intersectionOverUnion:original.intersectionOverUnion,
      garmentRecall:original.garmentRecall,falsePositive:original.falsePositive,
      boundaryRecall:beforeEdges.boundaryPixelRecall,
      lowerBoundaryRecall:beforeEdges.lowerBoundaryRecall},
    candidate:{intersectionOverUnion:proposed.intersectionOverUnion,
      garmentRecall:proposed.garmentRecall,falsePositive:proposed.falsePositive,
      boundaryRecall:afterEdges.boundaryPixelRecall,
      lowerBoundaryRecall:afterEdges.lowerBoundaryRecall},
    verifiedHemOrSolePreservation:false});
  }catch(err){
   cases.push({id:entry.id,status:'blocked-invalid-source-or-annotation',
    reasons:[String(err?.message||'Invalid evidence')]});
  }
 }
 const scored=cases.filter(c=>c.status==='scored-reviewed').length;
 const improvements=cases.filter(c=>c.status==='scored-reviewed'&&c.improves).length;
 const everyCaseScored=cases.length>=clippingPolicy.minimumApprovedPhotos&&scored===cases.length;
 const eligible=everyCaseScored&&improvements>=1;
 return {
  status:eligible?'eligible-for-independent-mobile-review':'blocked-clipping-evidence',
  policy:clippingPolicy,photos:cases.length,reviewedPassingPhotos:scored,
  pendingOrFailedPhotos:cases.length-scored,improvedPhotos:improvements,
  allLockedCasesMeetReviewedThresholds:everyCaseScored,
  eligibleForIndependentMobileReview:eligible,
  // Even a perfect reviewed benchmark cannot validate garment color or the
  // performance and memory impact of real phone captures and multi-layer wear.
  recognitionAccuracyMeasured:false,originalImageModified:false,
  actualPhoneClippingVerified:false,wholeOutfitAccuracyVerified:false,
  productionAuthorized:false,automaticDeploymentEnabled:false,cases
 };
}
