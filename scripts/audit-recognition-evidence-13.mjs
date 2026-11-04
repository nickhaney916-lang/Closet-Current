/**
 * RECOGNITION-EVIDENCE-13 — measured, source-locked single-garment evidence.
 * This only scores real worker outputs; it cannot turn historical fixtures,
 * a mock worker, or review-required guesses into automatic accuracy claims.
 * NO photos, faces, raw bytes, file paths or account data in its output.
 */
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {dirname, resolve} from 'node:path';

const SHA=/^[a-f0-9]{64}$/;
const pct=(n,d)=>d?+(n*100/d).toFixed(2):null;
const validId=x=>typeof x==='string'&&/^(commons|validation)-[0-9]{4}$/.test(x);
const BAD=new Set(['', 'Unknown', 'Uncategorized']);
function requireEvidence(ok,message){if(!ok)throw Error('RECOGNITION13 '+message);}
function unique(rows,label){
 requireEvidence(Array.isArray(rows)&&rows.length>0,label+' must be nonempty');
 const seen=new Set();
 for(const row of rows){
  requireEvidence(row&&validId(row.id)&&!seen.has(row.id),label+' invalid or duplicate ID');
  seen.add(row.id);
 }
 return new Map(rows.map(row=>[row.id,row]));
}

export function scoreRecognitionEvidence13(manifest,results,sources,{sourceMode='historical-baseline'}={}){
 requireEvidence(['historical-baseline','actual-browser-inference'].includes(sourceMode),'unsupported evidence mode');
 const expected=unique(manifest,'expected photos'),observed=unique(results,'model results');
 const lock=unique(sources,'locked original photos');
 requireEvidence(expected.size===16,'expected 16 pre-reviewed holdout photographs, no missing images');
 requireEvidence(observed.size===expected.size,'missing, extra or duplicated worker outcomes');
 for(const id of observed.keys())requireEvidence(expected.has(id),'extra worker result '+id);
 const lines=[],categories={},reasonCounts={};
 const totals={garments:0,negatives:0,correctCategories:0,correctTypes:0,
  autoAccepted:0,autoCorrectCategory:0,autoCorrectType:0,autoWrongCategory:0,
  autoWrongType:0,categoryReview:0,abstained:0,modelErrors:0,
  falsePositiveNegatives:0,correctNegativeRejections:0,untrustedPredictions:0};
 for(const [id,item] of expected){
  const source=lock.get(id),r=observed.get(id);
  requireEvidence(!!source&&source.verified===true&&SHA.test(source.sha256) &&
   typeof source.downloadUrl==='string','missing immutable licensed source for '+id);
  requireEvidence(item.verified===true&&item.mode==='single'&&
   item.image===source.image&&typeof item.expectedCategory==='string'&&
   typeof item.expectedType==='string','unreviewed or inconsistent label for '+id);
  requireEvidence(typeof r.strong==='boolean'&&typeof r.categoryConfirmed==='boolean'&&
   !(r.strong&&r.categoryConfirmed),'invalid acceptance flags for '+id);
  const error=typeof r.error==='string'&&r.error.length>0;
  const category=typeof r.prediction?.category==='string'?r.prediction.category:null;
  const subtype=typeof r.prediction?.type==='string'?r.prediction.type:null;
  const hasCategory=category&&!BAD.has(category);
  const accepted=Array.isArray(item.acceptedTypes)&&item.acceptedTypes.length?
   item.acceptedTypes:[item.expectedType];
  const categoryOK=category===item.expectedCategory;
  const typeOK=categoryOK&&accepted.includes(subtype);
  const negative=item.expectedCategory==='Uncategorized';
  const reason=error?'runtime_error':(r.reason||'not_reported');
  reasonCounts[reason]=(reasonCounts[reason]||0)+1;
  if(error)totals.modelErrors++;
  if(negative){
   totals.negatives++;
   const rejected=!error&&!r.strong&&!r.categoryConfirmed&&!hasCategory;
   if(rejected)totals.correctNegativeRejections++;
   else if(!error)totals.falsePositiveNegatives++;
   lines.push({id,kind:'negative',outcome:error?'model-error':rejected?'correct-reject':'false-positive',
    sourceSha256:source.sha256});
   continue;
  }
  totals.garments++;
  const group=categories[item.expectedCategory]||={garments:0,categoryCorrect:0,
   subtypeCorrect:0,autoAccepted:0,unsafeAuto:0,review:0,abstain:0,errors:0};
  group.garments++;
  if(categoryOK){totals.correctCategories++;group.categoryCorrect++;}
  if(typeOK){totals.correctTypes++;group.subtypeCorrect++;}
  if(error){group.errors++;}
  else if(r.strong){
   totals.autoAccepted++;group.autoAccepted++;
   if(categoryOK)totals.autoCorrectCategory++;
   else totals.autoWrongCategory++;
   if(typeOK)totals.autoCorrectType++;
   else{totals.autoWrongType++;group.unsafeAuto++;}
  }else if(r.categoryConfirmed){
   totals.categoryReview++;group.review++;
  }else{
   totals.abstained++;group.abstain++;
   if(hasCategory)totals.untrustedPredictions++;
  }
  lines.push({id,kind:'garment',expectedCategory:item.expectedCategory,expectedType:item.expectedType,
   predictedCategory:category,predictedType:subtype,
   outcome:error?'model-error':r.strong?(typeOK?'correct-automatic':'unsafe-automatic'):
    r.categoryConfirmed?'category-review':'abstention',
   categoryCorrect:!!categoryOK,typeCorrect:!!typeOK,sourceSha256:source.sha256});
 }
 requireEvidence(totals.garments===13&&totals.negatives===3,'holdout population changed');
 const qualityGate=totals.modelErrors===0&&totals.autoWrongCategory===0&&
  totals.autoWrongType===0&&totals.falsePositiveNegatives===0;
 const colorAnnotated=manifest.filter(x=>x.expectedColorVerified===true).length;
 const report={
  priority:'RECOGNITION-EVIDENCE-13',sourceMode,fixtureCount:expected.size,
  lockedLicensedOriginals:true,originalBytesRetainedByDownloader:true,
  workerMode:sourceMode==='actual-browser-inference'?'unmocked FashionCLIP local-worker.mjs':'recorded historical run; not freshly remeasured',
  totals,categoryAccuracyPercent:pct(totals.correctCategories,totals.garments),
  automaticCategoryCorrectCoveragePercent:pct(totals.autoCorrectCategory,totals.garments),
  automaticSubtypeCorrectCoveragePercent:pct(totals.autoCorrectType,totals.garments),
  automaticSubtypePrecisionPercent:pct(totals.autoCorrectType,totals.autoAccepted),
  negativeRejectionPercent:pct(totals.correctNegativeRejections,totals.negatives),
  categories,reasonCounts,perImage:lines,
  qualityGatePassed:qualityGate,
  qualityGateMeaning:'No incorrect automatic category/type, negative false positives or model errors; not a complete release criterion',
  color:{humanVerifiedPhotoLabels:colorAnnotated,accuracyPercent:null,
   status:colorAnnotated===0?'NOT_MEASURED — independent color labels required':'PENDING_INDEPENDENT_COLOR_SCORING'},
  multiGarment:{automaticSegmentationAccuracyPercent:null,status:'NOT_MEASURED — these 16 originals are single-garment/negative controls'},
  original15PhotoIsolationQA:{status:'NOT_MEASURED — different benchmark; do not substitute this cohort'},
  signedBackendRLS:false,physicalPhonesVerified:false,familyAlpha:'HOLD',
  releaseAuthorized:false,productionModified:false
 };
 return report;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [manifestPath,resultPath,sourcePath,outPath,mode]=process.argv.slice(2);
 requireEvidence(manifestPath&&resultPath&&sourcePath&&outPath&&mode,
  'usage: audit-recognition-13.mjs MANIFEST RESULTS LOCKED_SOURCES OUTPUT MODE');
 const read=async p=>JSON.parse(await readFile(p,'utf8'));
 const raw=await read(resultPath);
 const outcomes=Array.isArray(raw)?raw:raw.results;
 const report=scoreRecognitionEvidence13(await read(manifestPath),outcomes,await read(sourcePath),{sourceMode:mode});
 await mkdir(dirname(outPath),{recursive:true});
 await writeFile(outPath,JSON.stringify(report,null,2));
 console.log('RECOGNITION13 VERIFIED EVALUATION '+JSON.stringify({
  mode,photos:report.fixtureCount,automaticSafe:report.totals.autoCorrectType,
  incorrectAuto:report.totals.autoWrongType,modelErrors:report.totals.modelErrors,
  qualityGatePassed:report.qualityGatePassed,color:report.color.status,multi:report.multiGarment.status,
  familyAlpha:'HOLD'
 }));
 // A poor measured result is a valid scientific finding, not a reason to
 // rewrite labels or fail the measuring infrastructure. The quality gate
 // remains explicitly HOLD and is never described as passing.
}