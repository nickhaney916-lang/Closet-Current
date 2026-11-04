import {scoreApprovedPredictionAtReferenceResolution,scoreApprovedGarmentEdgeRetention} from './garment-mask-metrics.mjs';
import {footwearThresholdEdgeReview} from './footwear-threshold-edge-review.mjs';
export const SNEAKER_HOLDOUT_IDS=Object.freeze(['validation-0019','validation-0023','validation-0024']);
const ids=new Set(SNEAKER_HOLDOUT_IDS);
function metrics(m){return {precision:m.garmentPrecision,recall:m.garmentRecall,iou:m.intersectionOverUnion,missingFabric:m.falseNegative,extraBackground:m.falsePositive};}
export function compareApprovedSneakerThresholds(rows,standard,strict,approved=new Map()){
 if(!Array.isArray(rows)||rows.length!==3||!(standard instanceof Map)||!(strict instanceof Map)||!(approved instanceof Map)||
    standard.size!==3||strict.size!==3||approved.size>3)throw Error('Expected three sneaker photos and prediction maps');
 const seen=new Set(),results=[];
 for(const row of rows){
  if(!row||!ids.has(row.id)||seen.has(row.id)||row.image!==row.id+'.jpg'||
   !/^[a-f0-9]{64}$/.test(row.sha256)||row.expectedCategory!=='Shoes'||row.verified!==true)
   throw Error('Invalid, repeated, or unverified sneaker source');
  seen.add(row.id);
  const a=standard.get(row.id),b=strict.get(row.id);
  if(!a||!b||a.image!==row.image||b.image!==row.image||a.sourceSha256!==row.sha256||b.sourceSha256!==row.sha256)
   throw Error('Unrelated or missing shoe cutout');
  const disagreement=footwearThresholdEdgeReview(a,b);
  const reference=approved.get(row.id);
  if(!reference){
   results.push({id:row.id,status:'awaiting-independent-outline',disagreement,
     standardAccuracy:null,strictAccuracy:null,edgeAccuracy:null,accuracyMeasured:false});
   continue;
  }
  const source={image:row.image,sourceSha256:row.sha256};
  // Enforces matching source and two DIFFERENT human reviewers.
  const first=scoreApprovedPredictionAtReferenceResolution(reference,source,a),
        second=scoreApprovedPredictionAtReferenceResolution(reference,source,b),
        edgeA=scoreApprovedGarmentEdgeRetention(reference,source,a),
        edgeB=scoreApprovedGarmentEdgeRetention(reference,source,b);
  results.push({id:row.id,status:'conditionally-scored-with-approved-outline',
   disagreement,standardAccuracy:metrics(first),strictAccuracy:metrics(second),
   changeStrictMinusStandard:{
    recall:second.garmentRecall-first.garmentRecall,
    iou:second.intersectionOverUnion-first.intersectionOverUnion,
    precision:first.garmentPrecision===null||second.garmentPrecision===null?null:second.garmentPrecision-first.garmentPrecision,
    missingFabric:second.falseNegative-first.falseNegative,
    extraBackground:second.falsePositive-first.falsePositive
   },
   edgeAccuracy:{
    standardBoundaryRecall:edgeA.boundaryPixelRecall,
    strictBoundaryRecall:edgeB.boundaryPixelRecall,
    standardLowerBandRecall:edgeA.lowerGarmentRecall,
    strictLowerBandRecall:edgeB.lowerGarmentRecall,
    lowerBandIsNotSoleOrToeGroundTruth:true
   },
   outlineMayInheritModelSeedBias:Boolean(reference.seedModel),
   accuracyMeasured:true});
 }
 if(seen.size!==ids.size||[...standard.keys(),...strict.keys(),...approved.keys()].some(id=>!ids.has(id)))
  throw Error('Unexpected sneaker photo or reference');
 const scored=results.filter(r=>r.accuracyMeasured),complete=scored.length===3;
 const average=complete?{
  standardIoU:scored.reduce((n,r)=>n+r.standardAccuracy.iou,0)/3,
  strictIoU:scored.reduce((n,r)=>n+r.strictAccuracy.iou,0)/3,
  deltaIoU:scored.reduce((n,r)=>n+r.changeStrictMinusStandard.iou,0)/3
 }:null;
 return {status:complete?'all-conditionally-scored':'awaiting-independent-shoe-outlines',
  sourcePhotos:3,approvedOutlines:scored.length,pendingOutlines:3-scored.length,
  aggregateAccuracy:average,allOutlinesApproved:complete,perPhoto:results,
  specificToeSoleAccuracyMeasured:false,
  thresholdAutomaticallyChosen:false,productionAuthorized:false,
  phonePerformanceMeasured:false,originalSourcePhotosChanged:false};
}
