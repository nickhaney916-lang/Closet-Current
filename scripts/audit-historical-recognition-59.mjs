// Baseline evidence audit ONLY. Uses locked historical model observations.
// No photo fetching, inference, billable API, customer data, or changes to QA truth.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {auditRecognitionAdmission,REQUIRED_SETS} from './audit-recognition-admission.mjs';
const root='benchmark/';
const sets={};
for(const name of REQUIRED_SETS){
 const manifest=JSON.parse(readFileSync(root+'manifest-'+name+'.json','utf8'));
 const baseline=JSON.parse(readFileSync(root+'regression-'+name+'.json','utf8'));
 sets[name]={manifest,results:Array.isArray(baseline)?baseline:baseline.results};
}
const report=auditRecognitionAdmission(sets,{historical:true});
const total=report.sets.reduce((n,v)=>n+v.measuredPhotos,0);
if(total!==59||report.evidenceType!=='historical-inference-observations')
 throw Error('Locked 59-original baseline source set has changed');
const summary={
 evidence:'HISTORICAL_LOCKED_MODEL_OUTPUTS_ONLY',
 currentInferenceRun:false,
 humanDrawnFullOutfitMasks:false,
 physicalGarmentRecallMeasured:false,
 colorAndCropSourceOriginalsMustBePreserved:true,
 recognitionPromotionDecision:report.recognitionPromotionDecision,
 expectedSources:59,
 categoryBreakdown:report.sets.map(s=>({
  set:s.set,total:s.measuredPhotos,garments:s.garmentPhotos,controls:s.nonGarmentControls,
  categoryCoveragePercent:s.categoryCoveragePercent,
  categoryAccuracyAllGarmentsPercent:s.categoryAccuracyAllGarmentsPercent,
  categoryPrecisionAmongEmittedPercent:s.categoryPrecisionAmongEmittedPercent,
  incorrectAutomaticSubtypes:s.incorrectAutomaticSubtypes,
  unsafeAutomaticSubtypeIds:s.unsafeAutomaticSubtypeIds,
  missedOrAbstainedIds:s.abstentionIds,
  nonGarmentRejectionCount:s.rejectedNonGarment,
  categoryByType:s.byCategory
 })),
 historicalUnsafeAutosaves:report.anyUnsafeAutomaticClassification,
 productionReleaseApproved:false,
 noPaidModelUsed:true,
 experimentalChangesPromoted:false
};
if(report.recognitionPromotionDecision!=='BLOCKED')
 throw Error('Historical input unexpectedly promotes a recognition model');
mkdirSync('artifacts/recognition-baseline',{recursive:true});
writeFileSync('artifacts/recognition-baseline/historical-59-report.json',
 JSON.stringify({summary,fullAudit:report},null,2)+'\n');
console.log('HISTORICAL_RECOGNITION_BASELINE_AUDIT '+JSON.stringify(summary));
