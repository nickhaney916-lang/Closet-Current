#!/usr/bin/env node
/**
 * Closet Current MISSION 1 — evidence-first independent photo recognition audit.
 *
 * Does NOT run the classifier: audited predictions MUST be saved by the genuine
 * browser worker runner (or explicitly marked historical replay). Every scored
 * prediction is joined to independently byte-SHA-verified licensed photo bytes.
 *
 * Historically curated category/type annotations are NOT independent human
 * adjudication, and no existing pixel mask/color truth can be invented.
 */
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const SPLITS=[
 ['curated','benchmark/manifest-reviewed-32.json'],
 ['holdout','benchmark/manifest-holdout-16.json'],
 ['fresh','benchmark/manifest-fresh-11.json']
];
const CATEGORIES=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories','Uncategorized']);
const HEX=/^[0-9a-f]{64}$/;
const ALLOWED_LICENSE=/^(?:CC BY(?:-SA)? (?:2\.0|3\.0|4\.0)|CC0|Public domain)$/;
const fail=reason=>{throw Error('MISSION1_EVIDENCE: '+reason);};
const sha=x=>createHash('sha256').update(x).digest('hex');
const pct=(a,b)=>b?+(100*a/b).toFixed(2):null;
const ci=(success,total)=>{
 if(!total)return null;
 const z=1.96,p=success/total,d=1+z*z/total;
 const mid=(p+z*z/(2*total))/d;
 const radius=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/d;
 return [pct(mid-radius,1),pct(mid+radius,1)];
};
const populated=x=>typeof x==='string'&&x.trim().length>0;
const list=x=>Array.isArray(x)?x:x?.results;
const isSafeFile=x=>typeof x==='string'&&/^(?:commons|validation)-\d+\.jpg$/.test(x);
function count(dict,key){dict[key]=(dict[key]||0)+1;}
export function auditMission1RealPhotos({
 locked,manifests,predictions,photoBytes,execution='historical-replay',
 model={},
}={}){
 if(!['historical-replay','live-browser-ci'].includes(execution))
  fail('known explicit inference execution provenance required');
 if(!Array.isArray(locked)||locked.length!==59||
    !manifests||!predictions||typeof photoBytes!=='function')
  fail('exact locked 59-photo source index, three manifests, results and real file reader required');
 const licenseById=new Map(),usedImages=new Map(),usedBytes=new Map();
 for(const l of locked){
  const a=l?.attribution;
  if(!populated(l?.id)||licenseById.has(l.id)||!isSafeFile(l.image)||
    l.image!==l.id+'.jpg'||!HEX.test(l.sha256||'')||
    l.verified!==true||
    !a||!ALLOWED_LICENSE.test(a.license||'')||
    !populated(a.source)||!a.source.startsWith('https://commons.wikimedia.org/wiki/File:')||
    !populated(a.author)&&!populated(a.credit))
   fail('locked source missing independent byte identity or permissible Commons license/attribution: '+l?.id);
  licenseById.set(l.id,l);
 }
 const splitResults={},allScores=[],sourceIds=new Set();
 for(const [name] of SPLITS){
  const manifest=manifests[name],results=list(predictions[name]);
  if(!Array.isArray(manifest)||!Array.isArray(results))
   fail(name+' must contain real annotated manifest and full results');
  const expectedCount={curated:32,holdout:16,fresh:11}[name];
  if(manifest.length!==expectedCount||results.length!==expectedCount)
   fail(name+' must include all '+expectedCount+' photos and predictions, including errors/abstentions');
  const found=new Map();
  for(const r of results){
   if(!populated(r?.id)||found.has(r.id))fail(name+' duplicate/invalid result');
   found.set(r.id,r);
  }
  const counters={photos:0,garments:0,negatives:0,runtimeErrors:0,abstained:0,
   correctTopCategory:0,correctTopType:0,correctAcceptedType:0,autoIndexed:0,
   correctAutomatic:0,unsafeAutomatic:0,reviewSuggested:0,correctReviewCategory:0,
   negativeRejected:0,negativeFalsePositive:0,weakOrUnresolved:0};
  const perCategory={},failures=[],cases=[],latencies=[],confusion={};
  for(const m of manifest){
   const l=licenseById.get(m?.id),r=found.get(m?.id);
   if(!l||!r||sourceIds.has(m.id)||m.mode!=='single'||m.verified!==true||
      !CATEGORIES.has(m.expectedCategory)||!isSafeFile(m.image)||m.image!==l.image||
      (m.source&&m.source!==l.attribution.source))
    fail(name+' missing result, wrong split, invalid label or source: '+m?.id);
   sourceIds.add(m.id);
   if(m.expectedCategory!=='Uncategorized'&&!populated(m.expectedType))
    fail('positive photo has no locked subtype label: '+m.id);
   const accepted=m.acceptedTypes||[m.expectedType];
   if(!Array.isArray(accepted)||!accepted.length||
      accepted.some(v=>!populated(v)))
    fail('invalid accepted subtype list: '+m.id);
   const bytes=photoBytes(m.image);
   if(!(bytes instanceof Uint8Array)||bytes.length<500||bytes.length>8*1024*1024||
      bytes[0]!==255||bytes[1]!==216||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217||
      sha(bytes)!==l.sha256)
    fail('actual licensed JPEG bytes do not match locked SHA-256: '+m.id);
   if(usedImages.has(m.image)||usedBytes.has(l.sha256))
    fail('duplicate image identity across score splits '+m.id);
   usedImages.set(m.image,name);usedBytes.set(l.sha256,name);
   const error=populated(r.error)?'runtime_error':null;
   const prediction=r.prediction||{},cat=prediction.category||null,type=prediction.type||null;
   if(!error&&(typeof r.strong!=='boolean'||typeof r.categoryConfirmed!=='boolean'||
      cat!==null&&!CATEGORIES.has(cat)||type!==null&&typeof type!=='string'||
      r.strong&&(!cat||cat==='Uncategorized')||
      r.categoryConfirmed&&(!cat||cat==='Uncategorized')||
      r.strong&&r.categoryConfirmed))
    fail('malformed or unsafe real classifier output: '+m.id);
   if(r.elapsedMs!=null&&(!Number.isFinite(r.elapsedMs)||r.elapsedMs<0||r.elapsedMs>1800000))
    fail('invalid latency: '+m.id);
   if(Number.isFinite(r.elapsedMs))latencies.push(r.elapsedMs);
   const categoryCorrect=!error&&cat===m.expectedCategory;
   const typeCorrect=categoryCorrect&&type===m.expectedType;
   const acceptedCorrect=categoryCorrect&&accepted.includes(type);
   const automatic=!error&&r.strong===true;
   const review=!error&&r.categoryConfirmed===true&&!automatic;
   const negative=m.expectedCategory==='Uncategorized';
   const negativeRejected=negative&&!error&&!r.strong&&!r.categoryConfirmed&&(!cat||cat==='Uncategorized');
   const badAutomatic=automatic&&!negative&&!acceptedCorrect||automatic&&negative;
   const per=perCategory[m.expectedCategory]||={total:0,automatic:0,correctCategory:0,
     correctAcceptedType:0,errors:0,unsafeAutomatic:0};
   per.total++;counters.photos++;
   if(error){counters.runtimeErrors++;per.errors++;}
   if(negative){
    counters.negatives++;
    if(negativeRejected)counters.negativeRejected++;
    else if(!error){counters.negativeFalsePositive++;failures.push({id:m.id,reason:'negative_false_positive'});}
   }else{
    counters.garments++;
    if(categoryCorrect){counters.correctTopCategory++;per.correctCategory++;}
    if(typeCorrect)counters.correctTopType++;
    if(acceptedCorrect){counters.correctAcceptedType++;per.correctAcceptedType++;}
    if(!error&&!cat)counters.abstained++;
    if(automatic){
     counters.autoIndexed++;per.automatic++;
     if(acceptedCorrect)counters.correctAutomatic++;
     else {counters.unsafeAutomatic++;per.unsafeAutomatic++;}
    }else if(review){
     counters.reviewSuggested++;
     if(categoryCorrect)counters.correctReviewCategory++;
     if(type&&type!=='Unknown')failures.push({id:m.id,reason:'review_claimed_subtype'});
    }else if(!error)counters.weakOrUnresolved++;
    if(!categoryCorrect&&!error)
     failures.push({id:m.id,reason:'category_mismatch_or_abstention',expected:m.expectedCategory,actual:cat});
    if(badAutomatic)failures.push({id:m.id,reason:'incorrect_automatic_index',expected:m.expectedCategory,actual:cat});
    count(confusion,m.expectedCategory+' → '+(error?'ERROR':cat||'ABSTAIN'));
   }
   cases.push({id:m.id,expectedCategory:m.expectedCategory,actualCategory:!error?cat:null,
    expectedType:m.expectedType,actualType:!error?type:null,automatic,
    categoryReview:review,runtimeError:!!error,categoryCorrect,acceptedTypeCorrect:acceptedCorrect,
    sourceSHA256:l.sha256});
  }
  if(counters.photos!==expectedCount)fail('wrong denominator for '+name);
  const read={...counters,
   categoryTopOnePercent:pct(counters.correctTopCategory,counters.garments),
   acceptedTypeTopOnePercent:pct(counters.correctAcceptedType,counters.garments),
   automaticCoveragePercent:pct(counters.autoIndexed,counters.garments),
   automaticCorrectPercent:pct(counters.correctAutomatic,counters.autoIndexed),
   automaticRiskPercent:pct(counters.unsafeAutomatic,counters.autoIndexed),
   categoryConfidence95Percent:ci(counters.correctTopCategory,counters.garments),
   automaticCorrectConfidence95Percent:ci(counters.correctAutomatic,counters.autoIndexed),
   negativeRejectionPercent:pct(counters.negativeRejected,counters.negatives),
   medianLatencyMs:latencies.length?latencies.sort((a,b)=>a-b)[Math.floor(latencies.length/2)]:null};
  splitResults[name]={summary:read,perCategory,confusion,
   // Listed samples are licensed public ids; NO local user filenames or image contents.
   failures,cases};
  allScores.push({...read,split:name});
 }
 if(sourceIds.size!==59||usedBytes.size!==59)fail('all 59 unique real licensed JPEGs required');
 const combine=key=>allScores.reduce((sum,x)=>sum+x[key],0);
 const total={photos:59,garments:combine('garments'),negatives:combine('negatives'),
  runtimeErrors:combine('runtimeErrors'),correctTopCategory:combine('correctTopCategory'),
  correctAcceptedType:combine('correctAcceptedType'),autoIndexed:combine('autoIndexed'),
  correctAutomatic:combine('correctAutomatic'),unsafeAutomatic:combine('unsafeAutomatic'),
  negativeRejected:combine('negativeRejected'),negativeFalsePositive:combine('negativeFalsePositive')};
 total.categoryTopOnePercent=pct(total.correctTopCategory,total.garments);
 total.typeTopOnePercent=pct(total.correctAcceptedType,total.garments);
 total.automaticCoveragePercent=pct(total.autoIndexed,total.garments);
 total.correctAutomaticPercent=pct(total.correctAutomatic,total.autoIndexed);
 total.negativeRejectionPercent=pct(total.negativeRejected,total.negatives);
 total.categoryConfidence95Percent=ci(total.correctTopCategory,total.garments);
 const labelSources={historicalCuratedSourceLabels:59,
  newIndependentHumanAdjudications:0,verifiedIndependentPixelMasks:0,
  independentlyLabeledPrimaryColors:0,annotatedRealMultiGarmentOutfits:0};
 return {mission:'CLOSET-CURRENT-INDEPENDENT-REAL-PHOTO-ACCURACY-1',
  execution,sourceProof:{distinctSourcePhotos:59,completeSha256AndLicenseChecks:59,
   holdoutDisjointFromCurated:true,freshDisjointFromPrevious:true,
   inferenceHashLocked:HEX.test(model.indexSHA256||'')&&HEX.test(model.workerSHA256||''),
   indexSHA256:HEX.test(model.indexSHA256||'')?model.indexSHA256:null,
   workerSHA256:HEX.test(model.workerSHA256||'')?model.workerSHA256:null,
   actualBrowserInferenceIndependentlyObserved:execution==='live-browser-ci'},
  total,splits:splitResults,labels:labelSources,
  segmentationIoUPercent:null,boundaryF1Percent:null,instanceRecallPercent:null,
  colorAccuracyPercent:null,realPhotoTo3DFidelityPercent:null,
  // Research-only state, not approval to release or proceed to 3D mission.
  independentHumanAccuracyCertified:false,missionOneCompleted:false,
  eligibleToAdvanceToMissionTwo:false,
  releaseAuthorized:false,familyAlpha:'HOLD'};
}
export function auditMission1FromFiles(resultPaths,{execution='historical-replay',
 photoDirectory='benchmark/photos'}={}){
 const parse=path=>JSON.parse(readFileSync(path,'utf8'));
 const manifests=Object.fromEntries(SPLITS.map(([name,path])=>[name,parse(path)]));
 const locked=parse('benchmark/locked-photo-sources.json');
 const predictions=Object.fromEntries(SPLITS.map(([name])=>[name,parse(resultPaths[name])]));
 const hashFile=path=>sha(readFileSync(path));
 return auditMission1RealPhotos({
  locked,manifests,predictions,execution,
  photoBytes:image=>readFileSync(join(photoDirectory,image)),
  model:{indexSHA256:hashFile('public/recognition-vectors.bin'),
   workerSHA256:hashFile('public/local-worker.mjs')}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [mode,curated,holdout,fresh]=process.argv.slice(2);
 if(!['historical-replay','live-browser-ci'].includes(mode)||![curated,holdout,fresh].every(populated)){
  console.error('Usage: node scripts/audit-mission1-real-photos.mjs live-browser-ci|historical-replay CURATED_RESULTS HOLDOUT_RESULTS FRESH_RESULTS');
  process.exit(2);
 }
 const result=auditMission1FromFiles({curated,holdout,fresh},{execution:mode});
 console.log(JSON.stringify(result,null,2));
 // Inference failures block acceptance, but ordinary model mistakes remain
 // measured evidence, never suppressed by "pass" labels.
 if(result.total.runtimeErrors)process.exitCode=1;
}
