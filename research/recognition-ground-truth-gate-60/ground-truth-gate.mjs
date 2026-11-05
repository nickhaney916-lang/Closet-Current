/**
 * RECOGNITION-GROUND-TRUTH-GATE-60
 * Pure independent-scientific-acceptance policy. Does not alter the app,
 * models, source photos, predictions, private closet or reviewer evidence.
 */
import {validReviewTaxonomy43} from '../multi-garment-capture-01/atomic-group.mjs';
const SHA=/^[a-f0-9]{64}$/;
export const CATEGORIES60=Object.freeze(['Tops','Bottoms','Dresses','Outerwear','Shoes']);
export const COLORS60=Object.freeze(['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor']);
const categorySet=new Set(CATEGORIES60),colorSet=new Set(COLORS60);
const OWN=Object.prototype.hasOwnProperty;
const fail=message=>{throw Error('EVIDENCE60 '+message);};
export function wilsonInterval60(correct,total,z=1.959963984540054){
 if(!Number.isInteger(total)||total<0||!Number.isInteger(correct)||correct<0||correct>total)fail('invalid Wilson fraction');
 if(total===0)return {estimate:null,lower:null,upper:null};
 const p=correct/total,d=1+z*z/total;
 const center=(p+z*z/(2*total))/d;
 const margin=z*Math.sqrt((p*(1-p)+z*z/(4*total))/total)/d;
 return {estimate:p,lower:Math.max(0,center-margin),upper:Math.min(1,center+margin)};
}
function hasCleanHumanIdentity(x){
 return x&&typeof x.reviewerId==='string'&&/^[a-zA-Z0-9._-]{3,80}$/.test(x.reviewerId)&&
  x.independent===true&&x.method==='direct-human-visual-review'&&
  typeof x.reviewedAt==='string'&&!Number.isNaN(Date.parse(x.reviewedAt));
}
function label60(x){
 if(!x||typeof x!=='object'||Array.isArray(x))return null;
 // BLIND61: provisional expectedCategory is NOT independent ground truth.
 // Two human reviewers are allowed to discover a historical mislabel.
 if(x.category==='Uncategorized')return x.itemType==='Unknown'&&x.primaryColor===null&&
  (x.secondaryColor===null||x.secondaryColor===undefined)?
  {category:'Uncategorized',itemType:'Unknown',primaryColor:null,secondaryColor:null}:null;
 if(!validReviewTaxonomy43(x.category,x.itemType)||!colorSet.has(x.primaryColor)||
  (x.secondaryColor!==null&&x.secondaryColor!==undefined&&!colorSet.has(x.secondaryColor)))return null;
 return {category:x.category,itemType:x.itemType,primaryColor:x.primaryColor,secondaryColor:x.secondaryColor||null};
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function resolveIndependentTruth60(row,claim){
 // An existing manifest "verified:true" or filename is never a substitute
 // for two human votes and a separately signed adjudicator when they disagree.
 if(!claim||!SHA.test(row.sha256)||claim.sourceSHA256!==row.sha256||
   !Array.isArray(claim.independentReviews)||claim.independentReviews.length!==2)
  return {accepted:false,reason:'two-source-bound-human-reviews-required'};
 const [one,two]=claim.independentReviews;
 if(!hasCleanHumanIdentity(one)||!hasCleanHumanIdentity(two)||one.reviewerId===two.reviewerId)
  return {accepted:false,reason:'distinct-human-reviewers-required'};
 if(one.sourceSHA256!==row.sha256||two.sourceSHA256!==row.sha256)
  return {accepted:false,reason:'review-source-SHA-mismatch'};
 const a=label60(one),b=label60(two);
 if(!a||!b)return {accepted:false,reason:'invalid-category-subtype-or-color-label'};
 if(same(a,b))return {accepted:true,label:a,method:'two-independent-agree'};
 const arb=claim.adjudication;
 if(!hasCleanHumanIdentity(arb)||[one.reviewerId,two.reviewerId].includes(arb.reviewerId)||
   arb.sourceSHA256!==row.sha256)
  return {accepted:false,reason:'independent-third-human-adjudication-required'};
 const third=label60(arb);
 if(!third)return {accepted:false,reason:'invalid-adjudicator-label'};
 return {accepted:true,label:third,method:'third-human-adjudicated'};
}
export function auditRecognitionEvidence60({sets,sourceRows,adjudications={},predictions=null}){
 if(!sets||!sourceRows||typeof sets!=='object'||!Array.isArray(sourceRows))fail('missing immutable source/partitions');
 const partitions=['development','validation','locked-evaluation'];
 const sourceById=new Map(),uniqueSHA=new Set(),rowIDs=new Set(),rows=[];
 for(const source of sourceRows){
  if(!source||typeof source.id!=='string'||!SHA.test(source.sha256)||sourceById.has(source.id))
   fail('duplicate/malformed source manifest item');
  sourceById.set(source.id,source);
 }
 for(const split of partitions){
  if(!Array.isArray(sets[split]))fail('missing split '+split);
  for(const row of sets[split]){
   if(!row||typeof row.id!=='string'||rowIDs.has(row.id))fail('duplicate partition ID '+row?.id);
   const src=sourceById.get(row.id);
   if(!src||row.image!==src.image||!SHA.test(src.sha256)||
     !src.attribution?.source||!src.attribution?.license||src.verified!==true)
    fail('missing photo provenance or verified image '+row.id);
   if(uniqueSHA.has(src.sha256))fail('duplicate photograph across splits '+row.id);
   rowIDs.add(row.id);uniqueSHA.add(src.sha256);
   const negative=row.expectedCategory==='Uncategorized';
   if(negative){
    if(row.expectedType!=='Unknown')fail('negative control subtype not Unknown '+row.id);
   }else if(typeof row.expectedCategory!=='string'||!row.expectedCategory||
    typeof row.expectedType!=='string'||!row.expectedType)
    fail('missing provisional source class '+row.id);
   // Existing historical review includes validation-0008: Accessories/Scarf.
   // This is NOT a recognized currently saved-closet family. Preserve it as
   // an out-of-scope label, never silently remap/delete the held-out source.
   rows.push({id:row.id,sha256:src.sha256,image:src.image,split,
    expectedCategory:row.expectedCategory,expectedType:row.expectedType,
    preliminaryLabelOnly:true,isNegative:negative,
    outOfScopeProvisional:!negative&&!categorySet.has(row.expectedCategory)});
  }
 }
 // Strict coverage: unknown adjudication IDs are not silently ignored.
 for(const id of Object.keys(adjudications)){
  if(!rowIDs.has(id))fail('adjudication references unknown photo '+id);
 }
 const adjudicated=new Map(),pending=[];
 for(const row of rows){
  const verified=resolveIndependentTruth60(row,adjudications[row.id]);
  if(verified.accepted)adjudicated.set(row.id,verified);
  else pending.push({id:row.id,split:row.split,reason:verified.reason});
 }
 const locked=rows.filter(x=>x.split==='locked-evaluation');
 const lockedGarments=locked.filter(x=>!x.isNegative),lockedNegatives=locked.filter(x=>x.isNegative);
 const lockedGroundTruth=locked.filter(x=>adjudicated.has(x.id));
 const independentlyLabeledLockedGarments=lockedGroundTruth.filter(x=>adjudicated.get(x.id).label.category!=='Uncategorized');
 const independentlyLabeledLockedNegatives=lockedGroundTruth.filter(x=>adjudicated.get(x.id).label.category==='Uncategorized');
 const perClass=Object.fromEntries(CATEGORIES60.map(c=>[c,lockedGarments.filter(x=>x.expectedCategory===c).length]));
 const realPerClass=Object.fromEntries(CATEGORIES60.map(c=>[c,independentlyLabeledLockedGarments.filter(x=>adjudicated.get(x.id).label.category===c).length]));
 let predictionQuality=null;
 if(predictions!==null){
  if(!Array.isArray(predictions))fail('prediction rows not an array');
  const got=new Map();
  for(const p of predictions){
   if(!p||typeof p.id!=='string'||got.has(p.id)||!rowIDs.has(p.id)||
     !SHA.test(p.sourceSHA256))fail('invalid or duplicate measured prediction row');
   const source=rows.find(x=>x.id===p.id);
   if(p.sourceSHA256!==source.sha256)fail('prediction source SHA mismatch '+p.id);
   if(p.split!==source.split)fail('prediction leaked across benchmark partitions '+p.id);
   got.set(p.id,p);
  }
  const missed=locked.filter(x=>!got.has(x.id)).map(x=>x.id);
  const lockedWithTruth=locked.filter(x=>adjudicated.has(x.id)&&got.has(x.id));
  let broad=0,subtype=0,color=0,correctNeg=0,accepted=0,acceptedCorrect=0,garmentN=0,negativeN=0;
  for(const x of lockedWithTruth){
   const p=got.get(x.id),truth=adjudicated.get(x.id).label;
   if(truth.category==='Uncategorized'){negativeN++;if(p.category===null||p.category==='Uncategorized')correctNeg++;continue;}
   garmentN++;
   if(p.category===truth.category)broad++;
   if(p.category===truth.category&&p.itemType===truth.itemType)subtype++;
   if(p.primaryColor===truth.primaryColor)color++;
   if(p.accepted===true){
    accepted++;
    if(p.category===truth.category&&p.itemType===truth.itemType)acceptedCorrect++;
   }
  }
  predictionQuality={lockedRowsExpected:locked.length,lockedRowsSubmitted:locked.length-missed.length,
   missingLockedPredictionIds:missed,measuredIndependentGarments:garmentN,
   measuredIndependentNegatives:negativeN,
   broadCategory:wilsonInterval60(broad,garmentN),
   exactSubtype:wilsonInterval60(subtype,garmentN),
   primaryColor:wilsonInterval60(color,garmentN),
   acceptedSubtypePrecision:wilsonInterval60(acceptedCorrect,accepted),
   acceptedSubtypeCoverage:garmentN?accepted/garmentN:null,
   nonGarmentRejection:wilsonInterval60(correctNeg,negativeN)};
 }
 const failures=[];
 const need=(test,reason)=>{if(!test)failures.push(reason);};
 need(!rows.some(x=>x.outOfScopeProvisional),'unsupported-historical-taxonomy-needs-independent-scope-review');
 need(rows.length>=100,'insufficient-unique-genuine-photo-sources-min-100');
 need(lockedGarments.length>=30,'insufficient-locked-garment-sample-min-30');
 need(lockedNegatives.length>=10,'insufficient-locked-non-garment-controls-min-10');
 need(CATEGORIES60.every(c=>perClass[c]>=5),'insufficient-locked-per-category-representation');
 need(independentlyLabeledLockedGarments.length>=30,'insufficient-independently-labeled-locked-garments-min-30');
 need(independentlyLabeledLockedNegatives.length>=10,'insufficient-independently-labeled-locked-negatives-min-10');
 need(CATEGORIES60.every(c=>realPerClass[c]>=5),'insufficient-independent-locked-per-category-representation');
 need(adjudicated.size===rows.length,'independent-human-ground-truth-or-primary-color-missing');
 need(predictionQuality!==null,'no-complete-per-photo-pinned-model-results');
 if(predictionQuality){
  need(predictionQuality.missingLockedPredictionIds.length===0,'incomplete-locked-predictions');
  need(predictionQuality.measuredIndependentGarments===independentlyLabeledLockedGarments.length,'unscored-locked-garment-truth');
  need(predictionQuality.measuredIndependentNegatives===independentlyLabeledLockedNegatives.length,'unscored-locked-negative-truth');
  for(const [k,min] of [['broadCategory',.95],['exactSubtype',.9],['primaryColor',.9],['acceptedSubtypePrecision',.95],['nonGarmentRejection',.95]]){
   need(predictionQuality[k]?.estimate!==null&&predictionQuality[k]?.estimate>=min,'model-'+k+'-below-minimum');
  }
  need(predictionQuality.acceptedSubtypeCoverage!==null&&predictionQuality.acceptedSubtypeCoverage>=.8,'model-accepted-subtype-coverage-below-80-percent');
 }
 return {schema:'recognition-ground-truth-gate-60/v1',scientificVerdict:failures.length?'NEEDS_REWORK':'PASS',
  releaseAuthorized:false,reason:'Research QA cannot authorize production release or Family Alpha',
  counts:{sourceRows:rows.length,uniqueSHA256:uniqueSHA.size,development:sets.development.length,
   validation:sets.validation.length,lockedEvaluation:locked.length,
   lockedGarments:lockedGarments.length,lockedNegatives:lockedNegatives.length,
   independentlyAdjudicated:adjudicated.size,lockedIndependentlyAdjudicated:lockedGroundTruth.length,
   preliminaryHistoricalColorLabels:rows.filter(x=>OWN.call(sets[x.split].find(z=>z.id===x.id),'expectedPrimaryColor')).length,
   outOfScopeHistoricalLabels:rows.filter(x=>x.outOfScopeProvisional).map(x=>({id:x.id,split:x.split,category:x.expectedCategory,itemType:x.expectedType})),
   independentlyLabeledLockedGarments:independentlyLabeledLockedGarments.length,
   independentlyLabeledLockedNegatives:independentlyLabeledLockedNegatives.length},
  perClassLockedProvisional:perClass,perClassLockedIndependent:realPerClass,failures,pendingHumanReviews:pending,
  measuredIndependentMetrics:predictionQuality};
}
