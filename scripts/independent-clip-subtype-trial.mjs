// Research-only independent pretrained encoder comparison, never customer inference.
// Frozen manifests and SHA-256 originals; compare against independently captured
// production FashionCLIP results without changing either model or source labels.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {localCandidates} from '../public/local-catalog.mjs';

export const MODEL='Xenova/clip-vit-base-patch32';
export const MODEL_REVISION='d15189d';
const official=['reviewed-32','holdout-16','fresh-11'];
const labels=localCandidates.map(x=>x.label);
const catalog=new Map(localCandidates.map(x=>[x.label,x]));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function validateOriginal(row,source,bytes){
 if(!row?.verified||!row.conditions?.includes('visual-review')||!source?.verified
   ||!row.id||row.id!==source.id||row.image!==source.image
   ||!/^[a-f0-9]{64}$/.test(source.sha256)||sha(bytes)!==source.sha256)
  throw Error('Hash-verified ORIGINAL photo source mismatch: '+(row?.id||'<unknown>'));
 return true;
}
export function classifyIndependent(ranking){
 if(!Array.isArray(ranking)||ranking.length<2||ranking.some(x=>!catalog.has(x.label)||!Number.isFinite(x.score)))
  throw Error('Invalid independent CLIP scores');
 const top=ranking[0],second=ranking[1],first=catalog.get(top.label);
 return {category:first.category,type:first.itemType,
  score:top.score,margin:top.score-second.score,
  top3:ranking.slice(0,3).map(x=>({category:catalog.get(x.label).category,
   type:catalog.get(x.label).itemType,label:x.label,score:x.score}))};
}
const correct=(result,truth)=>{
 const types=truth.acceptedTypes||[truth.expectedType];
 return result.prediction?.category===truth.expectedCategory&&types.includes(result.prediction?.type);
};
export function evaluateIndependentModel(manifests,baseline,independent){
 const results=[];
 for(const set of official){
  const rows=manifests[set],old=baseline[set],fresh=independent[set];
  if(!Array.isArray(rows)||!Array.isArray(old)||!Array.isArray(fresh)
    ||rows.length!==old.length||old.length!==fresh.length)throw Error('Incomplete set: '+set);
  const maps=[old,fresh].map(input=>{
   const map=new Map();
   for(const r of input){if(!r?.id||map.has(r.id))throw Error('Duplicate or missing predictions in '+set);map.set(r.id,r);}
   return map;
  });
  let wrongAutos=0,blockedWrong=0,blockedCorrect=0,unchangedWrong=0,correctAutos=0;
  let independentCorrectAmongOriginalWrong=0,independentWrongAmongOriginalCorrect=0;
  const cases=[];
  for(const truth of rows){
   const first=maps[0].get(truth.id),second=maps[1].get(truth.id);
   if(!first||!second||first.error||second.error||!first.prediction||!second.prediction)
    throw Error('Missing or failed independent inference: '+truth.id);
   // A different pretrained model is evidence, not necessarily a truth oracle.
   const agree=first.prediction.category===second.prediction.category
     &&first.prediction.type===second.prediction.type;
   if(first.strong){
    const safe=correct(first,truth);
    if(safe)correctAutos++;else wrongAutos++;
    if(!agree){if(safe)blockedCorrect++;else blockedWrong++;}
    else if(!safe)unchangedWrong++;
    if(safe&&!correct(second,truth))independentWrongAmongOriginalCorrect++;
    if(!safe&&correct(second,truth))independentCorrectAmongOriginalWrong++;
   }
   cases.push({id:truth.id,baseline:first.prediction,
    originalStrong:first.strong,expectedCategory:truth.expectedCategory,
    independent:second.prediction,independentScore:second.score,
    independentMargin:second.margin,modelAgreement:agree,
    baselineSafeStrong:first.strong?correct(first,truth):null});
  }
  results.push({set,photos:rows.length,originalCorrectAutos:correctAutos,
   originalWrongAutos:wrongAutos,proposedAgreementFilterPreventedWrongAutos:blockedWrong,
   proposedAgreementFilterRejectedCorrectAutos:blockedCorrect,
   wrongAutosStillAcceptedByAgreement:unchangedWrong,
   independentCorrectWhenBaselineWrong:independentCorrectAmongOriginalWrong,
   independentWrongWhenBaselineCorrect:independentWrongAmongOriginalCorrect,
   perPhoto:cases});
 }
 return {model:MODEL,revision:MODEL_REVISION,
  referenceModel:'original unchanged pinned FashionCLIP',
  isActuallyIndependentPretraining:true,
  predictionSource:'hash-verified untouched original RGB photographs',
  sets:results,noAutomaticReplacementMade:true,productionReleaseApproved:false,
  newUnseenHoldoutValidated:false};
}
async function run(){
 const manifests={},baseline={},independent={};
 const sourceRecords=JSON.parse(fs.readFileSync('benchmark/locked-photo-sources.json','utf8'));
 const fresh=JSON.parse(fs.readFileSync('benchmark/manifest-fresh-11.json','utf8'));
 const sources=new Map([...sourceRecords,...fresh].map(x=>[x.id,x]));
 for(const set of official){
  manifests[set]=JSON.parse(fs.readFileSync('benchmark/manifest-'+set+'.json','utf8'));
  baseline[set]=JSON.parse(fs.readFileSync('benchmark/independent-clip-baseline/'+set+'/results.json','utf8'));
 }
 const {pipeline,RawImage}=await import('@huggingface/transformers');
 const model=await pipeline('zero-shot-image-classification',MODEL,{
  revision:MODEL_REVISION,device:'cpu',dtype:'q8'});
 const memo=new Map();
 for(const set of official){
  independent[set]=[];
  for(const row of manifests[set]){
   const source=sources.get(row.id);
   if(!source)throw Error('Unregistered source '+row.id);
   const path='benchmark/photos/'+row.image,bytes=fs.readFileSync(path);
   validateOriginal(row,source,bytes);
   let pred=memo.get(source.sha256);
   if(!pred){
    const image=await RawImage.read(path);
    const scores=await model(image,labels,{hypothesis_template:'A photo of {}.'});
    pred=classifyIndependent(scores);
    memo.set(source.sha256,pred);
   }
   independent[set].push({id:row.id,prediction:{category:pred.category,type:pred.type},
    score:pred.score,margin:pred.margin,top3:pred.top3});
   console.log('INDEPENDENT_SUBTYPE_CASE '+JSON.stringify({
    set,id:row.id,independent:pred.type,category:pred.category,margin:pred.margin}));
  }
 }
 const report=evaluateIndependentModel(manifests,baseline,independent);
 fs.mkdirSync('benchmark/independent-clip-trial',{recursive:true});
 fs.writeFileSync('benchmark/independent-clip-trial/report.json',JSON.stringify(report,null,2));
 for(const set of official)fs.writeFileSync('benchmark/independent-clip-trial/'+set+'.json',JSON.stringify(independent[set],null,2));
 console.log('INDEPENDENT_CLIP_TRIAL '+JSON.stringify({model:report.model,
  revision:report.revision,sets:report.sets.map(({perPhoto,...row})=>row),
  modelNotAdopted:true,releaseApproved:false}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 await run();
