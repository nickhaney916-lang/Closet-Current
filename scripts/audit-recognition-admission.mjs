// Independently score measured recognition outputs against locked photo labels.
// No inference, model tuning, photos, customer data, or deployment occurs here.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

export const REQUIRED_SETS=Object.freeze(['reviewed-32','holdout-16','fresh-11']);
const requiredCounts={'reviewed-32':32,'holdout-16':16,'fresh-11':11};
const wantedCategories=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories']);
const pct=(a,b)=>b?+(100*a/b).toFixed(2):null;
const idValid=s=>typeof s==='string'&&/^(?:commons|validation)-\d{4}$/.test(s);
function index(rows,kind){
 if(!Array.isArray(rows))throw Error(kind+' is not an array');
 const map=new Map();
 for(const item of rows){
  if(!item||!idValid(item.id)||map.has(item.id))
   throw Error(kind+' contains missing, invalid or duplicate photo ID');
  map.set(item.id,item);
 }
 return map;
}
function validRow(r){
 return r&&typeof r.strong==='boolean'&&typeof r.categoryConfirmed==='boolean'&&
  r.prediction&&typeof r.prediction==='object'&&!Array.isArray(r.prediction)&&
  (r.prediction.category==null||typeof r.prediction.category==='string')&&
  (r.prediction.type==null||typeof r.prediction.type==='string');
}
const compactIds=(ids)=>ids.sort();
export function auditRecognitionSet(name,manifest,results,{historical=false}={}){
 if(!Object.hasOwn(requiredCounts,name))throw Error('Unknown benchmark set');
 const gt=index(manifest,name+' manifest'),observed=index(results,name+' predictions');
 if(gt.size!==requiredCounts[name])throw Error(name+' must retain '+requiredCounts[name]+' locked source entries');
 if(observed.size!==gt.size)throw Error(name+' has missing or unexpected predictions');
 const errors=[],critical=[],byCategory={};let positives=0,negatives=0,negativeRejected=0;
 let predicted=0,correctPredicted=0,categoryCorrect=0,abstained=0,strong=0,correctStrong=0;
 let safeType=0,unsafeType=0,unsafeCategory=0,categoryOnly=0;
 const wrongCategoryIds=[],unsafeAutoTypeIds=[],unsafeAutoCategoryIds=[],abstentionIds=[],badNegativeIds=[];
 for(const [id,item] of gt){
  if(!item.verified||!Array.isArray(item.conditions)||!item.conditions.includes('visual-review')||
     item.mode!=='single'||!item.expectedCategory||
     (item.expectedCategory!=='Uncategorized'&&!wantedCategories.has(item.expectedCategory)))
   throw Error(name+' has unverified or malformed source label: '+id);
  const accepted=item.acceptedTypes||[item.expectedType];
  if(item.expectedCategory!=='Uncategorized'&&
   (!Array.isArray(accepted)||!accepted.length||accepted.some(x=>typeof x!=='string'||!x||x==='Unknown')))
   throw Error(name+' missing explicit accepted garment types: '+id);
  const r=observed.get(id);
  if(!validRow(r))throw Error(name+' invalid result schema for '+id);
  if(r.error){errors.push(id);continue;}
  const category=r.prediction.category;
  const emitted=typeof category==='string'&&category!==''&&category!=='Uncategorized';
  if(r.strong&&(!emitted||!r.prediction.type||r.prediction.type==='Unknown'||r.categoryConfirmed))
   throw Error(name+' falsely claims automatic save without specific type: '+id);
  if(r.categoryConfirmed&&(r.strong||!emitted||r.prediction.type!=='Unknown'))
   throw Error(name+' malformed category-only review: '+id);
  if(item.expectedCategory==='Uncategorized'){
   negatives++;
   if(!r.strong&&!r.categoryConfirmed&&!emitted)negativeRejected++;
   else badNegativeIds.push(id);
   continue;
  }
  positives++;
  const correct=emitted&&category===item.expectedCategory;
  if(emitted){predicted++;if(correct)correctPredicted++;else wrongCategoryIds.push(id);}
  else {abstained++;abstentionIds.push(id);}
  if(correct)categoryCorrect++;
  if(r.categoryConfirmed)categoryOnly++;
  if(r.strong){
   strong++;
   if(!correct){unsafeCategory++;unsafeAutoCategoryIds.push(id);}
   else if(!accepted.includes(r.prediction.type)){unsafeType++;unsafeAutoTypeIds.push(id);}
   else{correctStrong++;safeType++;}
  }
  const row=byCategory[item.expectedCategory]||{total:0,emitted:0,correct:0,strong:0,unsafeAutosaves:0};
  row.total++;if(emitted)row.emitted++;if(correct)row.correct++;
  if(r.strong){row.strong++;if(!correct||!accepted.includes(r.prediction.type))row.unsafeAutosaves++;}
  byCategory[item.expectedCategory]=row;
 }
 const isComplete=errors.length===0&&observed.size===gt.size;
 const allowed= isComplete&&!badNegativeIds.length&&!wrongCategoryIds.length&&
  !unsafeAutoCategoryIds.length&&!unsafeAutoTypeIds.length;
 const metrics={set:name,sourceType:historical?'locked-historical-observations':'new-real-inference',
  measuredPhotos:gt.size,garmentPhotos:positives,nonGarmentControls:negatives,
  categoryCoveragePercent:pct(predicted,positives),
  categoryPrecisionAmongEmittedPercent:pct(correctPredicted,predicted),
  categoryAccuracyAllGarmentsPercent:pct(categoryCorrect,positives),
  categoryAbstentions:abstained,categoryOnlyReviews:categoryOnly,
  automaticDecisions:strong,correctAutomaticSubtypes:safeType,
  incorrectAutomaticCategories:unsafeCategory,incorrectAutomaticSubtypes:unsafeType,
  rejectedNonGarment:negativeRejected,byCategory,
  wrongCategoryIds:compactIds(wrongCategoryIds),
  unsafeAutomaticCategoryIds:compactIds(unsafeAutoCategoryIds),
  unsafeAutomaticSubtypeIds:compactIds(unsafeAutoTypeIds),
  rejectedControlFailures:compactIds(badNegativeIds),
  abstentionIds:compactIds(abstentionIds),
  runtimeErrorIds:compactIds(errors),
  safeToConsiderForRecognitionPromotion:allowed};
 return metrics;
}
export function auditRecognitionAdmission(sets,{historical=false}={}){
 if(Object.keys(sets).sort().join('|')!==[...REQUIRED_SETS].sort().join('|'))
  throw Error('All 3 benchmark sets must be present, with no replacement sets');
 const reports=REQUIRED_SETS.map(set=>{
  const bundle=sets[set];if(!bundle||!bundle.manifest||!bundle.results)
   throw Error('Missing evidence for '+set);
  return auditRecognitionSet(set,bundle.manifest,bundle.results,{historical});
 });
 const blocked=reports.some(x=>!x.safeToConsiderForRecognitionPromotion);
 const anyUnsafe=reports.some(x=>x.incorrectAutomaticSubtypes||x.incorrectAutomaticCategories||x.rejectedControlFailures.length);
 return {evidenceType:historical?'historical-inference-observations':'fresh-model-inference',
  sets:reports,wrongAutoSubtypesTotal:reports.reduce((n,x)=>n+x.incorrectAutomaticSubtypes,0),
  unsafeAutoCategoriesTotal:reports.reduce((n,x)=>n+x.incorrectAutomaticCategories,0),
  anyUnsafeAutomaticClassification:Boolean(anyUnsafe),
  recognitionPromotionDecision:blocked?'BLOCKED':'REVIEW_REQUIRED',
  independentPhysicalGarmentLabelsVerified:false,
  productionReleaseApproved:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2);
 if(!['--historical','--fresh'].includes(args[0]))throw Error('Specify --historical or --fresh');
 const historical=args[0]==='--historical';
 if(args.length!==7)throw Error('Usage: --historical|--fresh 32_manifest 32_results 16_manifest 16_results 11_manifest 11_results');
 const sets={};
 for(let i=0;i<3;i++){
  const name=REQUIRED_SETS[i],manifest=JSON.parse(fs.readFileSync(args[1+i*2],'utf8'));
  const raw=JSON.parse(fs.readFileSync(args[2+i*2],'utf8'));
  sets[name]={manifest,results:Array.isArray(raw)?raw:raw.results};
 }
 const report=auditRecognitionAdmission(sets,{historical});
 console.log('REAL_PHOTO_RECOGNITION_ADMISSION '+JSON.stringify(report));
 // Historical results are a baseline characterization, not a fresh passing model promotion.
 // Reject only corrupt evidence here. An unsafe model prediction MUST block
 // release in the report but not hide the measured observations via CI retries.
}
