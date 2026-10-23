// Closet Current: independent offline recognition candidate release veto.
// Deliberately evaluates supplied predictions, never runs a model or accesses images.
// The locked 59 baseline labels are manifest references, NOT reviewed outfit masks.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {auditRecognitionAdmission,REQUIRED_SETS} from './audit-recognition-admission.mjs';
import {checkRecognitionRegressions} from './check-recognition-regressions.mjs';

const ROW_COUNTS=Object.freeze({'reviewed-32':32,'holdout-16':16,'fresh-11':11});
const SUITE_VERSION='cc-recognition-cohort-safety-v1';
const read=(path)=>JSON.parse(readFileSync(path,'utf8'));
const unwrap=x=>Array.isArray(x)?x:x?.results;
export function loadLockedSets(){
 const sets={};
 for(const name of REQUIRED_SETS){
  sets[name]={
   manifest:read('benchmark/manifest-'+name+'.json'),
   historical:unwrap(read('benchmark/regression-'+name+'.json'))
  };
 }
 return sets;
}
const knownIds=(rows,kind)=>{
 if(!Array.isArray(rows))throw Error(kind+' must be an array');
 const ids=new Set();
 for(const x of rows){
  if(!x||typeof x.id!=='string'||!x.id||ids.has(x.id))
   throw Error(kind+' missing or duplicated source ID');
  ids.add(x.id);
 }
 return ids;
};
export function compareRecognitionCandidate(locked,candidate,{syntheticCounterfactual=false}={}){
 const required=[...REQUIRED_SETS].sort();
 if(Object.keys(locked).sort().join('|')!==required.join('|')||
    Object.keys(candidate).sort().join('|')!==required.join('|'))
  throw Error('A recognition candidate must cover all three immutable 32/16/11 cohorts');
 const sets={},comparisons=[],totals={manifestPhotos:0,garments:0,negativeControls:0,
  newAutomaticCategoryErrors:0,newAutomaticSubtypeErrors:0,baselineUnsafeSubtypeTotal:0,
  candidateUnsafeSubtypeTotal:0,candidateUnsafeCategoryTotal:0,sourceRegressions:0,
  candidateCategoryCorrect:0,baselineCategoryCorrect:0};
 for(const cohort of REQUIRED_SETS){
  const {manifest,historical}=locked[cohort]||{},rows=unwrap(candidate[cohort]);
  const ids=knownIds(manifest,cohort+' manifest'),baselineIds=knownIds(historical,cohort+' historical');
  const candidateIds=knownIds(rows,cohort+' candidate');
  if(manifest.length!==ROW_COUNTS[cohort]||ids.size!==baselineIds.size||
     ids.size!==candidateIds.size||[...ids].some(id=>!baselineIds.has(id)||!candidateIds.has(id)))
   throw Error(cohort+' altered immutable source population or omitted observations');
  const regression=checkRecognitionRegressions(manifest,rows,{results:historical});
  sets[cohort]={manifest,results:rows};
  const historicalById=new Map(historical.map(x=>[x.id,x]));
  const candidateById=new Map(rows.map(x=>[x.id,x]));
  const expectedById=new Map(manifest.map(x=>[x.id,x]));
  const outcomes=[];
  for(const [id,item] of expectedById){
   const prev=historicalById.get(id),now=candidateById.get(id);
   const allowed=item.acceptedTypes||[item.expectedType];
   const isClothing=item.expectedCategory!=='Uncategorized';
   const category=r=>r.prediction?.category;
   const correct=r=>isClothing&&category(r)===item.expectedCategory;
   const safe=r=>correct(r)&&allowed.includes(r.prediction.type);
   const oldUnsafe=!!prev.strong&&(!correct(prev)||!safe(prev));
   const newUnsafe=!!now.strong&&(!correct(now)||!safe(now));
   const baselineCorrect=correct(prev),candidateCorrect=correct(now);
   if(baselineCorrect)totals.baselineCategoryCorrect++;
   if(candidateCorrect)totals.candidateCategoryCorrect++;
   if(oldUnsafe&&!correct(prev))totals.newAutomaticCategoryErrors+=0; // counted only from candidate below
   if(newUnsafe&&!correct(now))totals.candidateUnsafeCategoryTotal++;
   if(newUnsafe&&correct(now))totals.candidateUnsafeSubtypeTotal++;
   if(oldUnsafe&&correct(prev))totals.baselineUnsafeSubtypeTotal++;
   if(newUnsafe&&!oldUnsafe&&!correct(now))totals.newAutomaticCategoryErrors++;
   if(newUnsafe&&!oldUnsafe&&correct(now))totals.newAutomaticSubtypeErrors++;
   if(isClothing)totals.garments++;else totals.negativeControls++;
   const changedCategory=category(prev)!==category(now);
   const changedSubtype=prev.prediction?.type!==now.prediction?.type;
   if(changedCategory||changedSubtype||prev.strong!==now.strong){
    outcomes.push({id,categoryBefore:category(prev)??null,categoryAfter:category(now)??null,
     typeBefore:prev.prediction?.type??null,typeAfter:now.prediction?.type??null,
     wasAutomatic:prev.strong,isAutomatic:now.strong,
     independentSourceIdentityVerified:false});
   }
  }
  const prior=auditRecognitionAdmission({[cohort]:sets[cohort],...Object.fromEntries(REQUIRED_SETS.filter(n=>n!==cohort).map(n=>[n,{manifest:locked[n].manifest,results:locked[n].historical}]))},{historical:true})
   .sets.find(s=>s.set===cohort);
  comparisons.push({cohort,manifestPhotos:manifest.length,
   historicalCategoryAccuracyPercent:prior.categoryAccuracyAllGarmentsPercent,
   candidateChangedRows:outcomes,
   categoryOrTypeRegressions:regression.failures,
   previousKnownSubtypeMismatches:regression.knownTypeMismatches,
   unknownPhysicalGarmentMaskIoU:true});
  totals.manifestPhotos+=manifest.length;
  totals.sourceRegressions+=regression.failures.length;
 }
 const assessment=auditRecognitionAdmission(sets,{historical:false});
 const metrics=assessment.sets.map(row=>({
  cohort:row.set,total:row.measuredPhotos,garmentPhotos:row.garmentPhotos,
  categoryAccuracyPercent:row.categoryAccuracyAllGarmentsPercent,
  coveragePercent:row.categoryCoveragePercent,
  subtypeErrors:row.incorrectAutomaticSubtypes,
  autoCategoryErrors:row.incorrectAutomaticCategories,
  reviewAbstentions:row.categoryAbstentions,
  wrongCategoryIds:row.wrongCategoryIds,
  unsafeAutoSubtypeIds:row.unsafeAutomaticSubtypeIds
 }));
 const noRegression=totals.sourceRegressions===0;
 const noUnsafe=assessment.recognitionPromotionDecision!=='BLOCKED';
 const readyForIndependentReview=noRegression&&noUnsafe;
 return {
  suite:SUITE_VERSION,
  evidenceType:syntheticCounterfactual?'SYNTHETIC_COUNTERFACTUAL_DO_NOT_REPORT_AS_MEASURED':
    'PREDICTION_FILES_NOT_INDEPENDENT_NEW_PHOTO_TRUTH',
  cohorts:comparisons,
  candidateMetrics:metrics,
  totals,
  relativeToHistoricalSourceRegressions:noRegression?'NONE':'PRESENT',
  candidateHasNoUnsafeAutoSaves:noUnsafe,
  eligibleForIndependentReview:readyForIndependentReview,
  recognitionPromotionAuthorized:false,
  deploymentAuthorized:false,
  originalSourceImageHashesValidatedHere:false,
  genuineHumanPhysicalGarmentMasksApproved:false,
  physicalCameraColorOrRuntimeMeasured:false,
  avatarGarmentFidelityMeasured:false,
  mustVerifyModelInferenceAndHeldOutSourceBeforeAnyPromotion:true
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2);
 if(args.length!==1&&args.length!==4)
  throw Error('Usage: node ... --historical-smoke | reviewed_candidate.json holdout_candidate.json fresh_candidate.json output.json');
 const locked=loadLockedSets();
 const candidate={};
 if(args[0]==='--historical-smoke'&&args.length===1){
  for(const key of REQUIRED_SETS)candidate[key]=locked[key].historical;
 }else if(args.length===4){
  REQUIRED_SETS.forEach((key,i)=>candidate[key]=read(args[i]));
 }else throw Error('Unknown option; never treat baseline as fresh inferred results');
 const report=compareRecognitionCandidate(locked,candidate);
 const output=args.length===4?args[3]:'artifacts/recognition-guard/historical-negative-control.json';
 mkdirSync(dirname(resolve(output)),{recursive:true});
 writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 if(args.length===1){
  if(report.eligibleForIndependentReview)throw Error('Danger: unsafe historical model accepted');
  console.log('RECOGNITION_HISTORICAL_PROMOTION_VETO_PASS '+JSON.stringify({
   historicalOnly:true,baselineSamples:report.totals.manifestPhotos,
   humanMaskAccuracyVerified:false,reason:report.relativeToHistoricalSourceRegressions,
   noUnsafe:report.candidateHasNoUnsafeAutoSaves,eligible:report.eligibleForIndependentReview,
   unsafeSubtypeCount:report.totals.candidateUnsafeSubtypeTotal
  }));
 }else{
  console.log('RECOGNITION_CANDIDATE_ACCEPTANCE '+JSON.stringify({
   candidateFilesNotProvenNewInference:true,eligible:report.eligibleForIndependentReview,
   unsafeSubtype:report.totals.candidateUnsafeSubtypeTotal,
   sourceRegressions:report.totals.sourceRegressions,
   promotionAuthorized:false
  }));
  if(!report.eligibleForIndependentReview)process.exitCode=1;
 }
}
