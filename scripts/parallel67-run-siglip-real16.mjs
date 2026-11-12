/**
 * Parallel #67 independent zero-shot model — real bytes, no remote photo API.
 * Research-only. Distinct SigLIP pretrained objective from FashionCLIP;
 * no release or photo-to-cloud paths are modified or enabled.
 *
 * Usage: node scripts/parallel67-run-siglip-real16.mjs <outDir>
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {P67_MODEL,P67_REVISION,P67_FASHION_MODEL,P67_FASHION_REVISION,P67_ALLOWED_MODELS,P67_LABELS,rankIndependentSiglip67,evaluateIndependentSiglip67} from './parallel67-independent-siglip-scoring.mjs';

const output=resolve(process.argv[2]||'benchmark/parallel67-siglip-real16');
const selected=process.argv[3]||'base-siglip';
if(!['base-siglip','fashion-siglip'].includes(selected))throw Error('Unrecognized experimental model');
const modelId=selected==='fashion-siglip'?P67_FASHION_MODEL:P67_MODEL;
const modelRevision=selected==='fashion-siglip'?P67_FASHION_REVISION:P67_REVISION;
if(P67_ALLOWED_MODELS[modelId]!==modelRevision)throw Error('Unpinned pretrained source');
const frozen=JSON.parse(await readFile('benchmark/manifest-holdout-16.json','utf8'));
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const lookup=new Map(sources.map(row=>[row.id,row]));
if(frozen.length!==16||new Set(frozen.map(r=>r.id)).size!==16)throw Error('Parallel67 source manifest mutated');
for(const row of frozen)if(!row.verified||row.mode!=='single'||!row.conditions?.includes('visual-review')||
 !row.conditions?.includes('independent-garment-holdout')||!lookup.has(row.id)||
 lookup.get(row.id).image!==row.image||!lookup.get(row.id).verified)
 throw Error('Parallel67 original source labels are not verifiable: '+row.id);

const {pipeline,RawImage,env}=await import('@huggingface/transformers');
env.allowLocalModels=false;
env.useFSCache=true;
// Keep a single pinned model instance and strict offline-image ingestion.
// The library fetches model weights over HTTPS, but the source JPEG is read
// strictly from its SHAs-verified local file (no remote image URL or POST).
const loadStarted=performance.now();
console.log('P67_INDEPENDENT_MODEL_LOADING',modelId,modelRevision);
const classifier=await pipeline('zero-shot-image-classification',modelId,{
 revision:modelRevision,device:'cpu',dtype:'q8',
 progress_callback:progress=>{
  if(progress?.status==='done'&&progress?.file)console.log('P67_MODEL_ASSET_LOADED',String(progress.file).slice(0,100));
 }
});
const loadMs=Math.round(performance.now()-loadStarted);
const results=[];
try{
 for(const original of frozen){
  const file=join('benchmark/photos',original.image);
  const bytes=await readFile(file),sha=createHash('sha256').update(bytes).digest('hex');
  if(sha!==lookup.get(original.id).sha256)throw Error('Original SHA-256 verification failed: '+original.id);
  const start=performance.now();
  let row;
  try{
   // RawImage.read(path) reads a local file. Never send source image URL or
   // bytes to the Hugging Face service; only remote model weights are fetched.
   const image=await RawImage.read(resolve(file));
   const classified=await classifier(image,P67_LABELS,{hypothesis_template:'a photo of {}'});
   const ranking=rankIndependentSiglip67(classified);
   row={
    id:original.id,expectedCategory:original.expectedCategory,expectedType:original.expectedType,
    sourceShaVerified:true,...ranking,error:null,
    inferenceMs:Math.round(performance.now()-start)
   };
  }catch(error){
   console.log('P67_SOURCE_FAILED',original.id,typeof error?.name==='string'?error.name:'runtime');
   row={id:original.id,expectedCategory:original.expectedCategory,
    expectedType:original.expectedType,sourceShaVerified:true,
    top:null,runnerUp:null,scoreGap:null,categoryRank:[],
    admissionAllowed:false,scoreMeaning:'uncalibrated-sigmoid-ranking-only',
    error:'runtime',inferenceMs:Math.round(performance.now()-start)};
  }
  results.push(row);
  console.log('P67_ORIGINAL_RANK',JSON.stringify({
   id:row.id,expectedCategory:row.expectedCategory,expectedType:row.expectedType,
   top:row.top,runnerUp:row.runnerUp,error:row.error,ms:row.inferenceMs
  }));
 }
}finally{await classifier.dispose();}
const summary=evaluateIndependentSiglip67(frozen,results,{model:modelId,revision:modelRevision});
summary.modelLoadMs=loadMs;
summary.pipeline='@huggingface/transformers@3.8.1/q8/cpu';
summary.variant=selected;
summary.truthFileSha256=createHash('sha256').update(await readFile('benchmark/manifest-holdout-16.json')).digest('hex');
summary.sourceIndexSha256=createHash('sha256').update(await readFile('benchmark/locked-photo-sources.json')).digest('hex');
summary.missingNoSource=0;
await mkdir(output,{recursive:true});
await writeFile(join(output,'siglip-developer-exposed-real16.json'),JSON.stringify(summary,null,2)+'\n');
console.log('P67_INDEPENDENT_REAL_MODEL_NUMERIC_SUMMARY',JSON.stringify({
 model:summary.model,loadMs,originals:summary.originalCount,garments:summary.garments,
 categoryTop1:summary.categoryTop1,subtypeTop1:summary.broadSubtypeTop1,
 negativeTop1:summary.negativeTop1,runtimeErrors:summary.runtimeErrors,
 byCategory:summary.byCategory,automaticSaveAdmissionAllowed:false
}));
if(summary.runtimeErrors>0)throw Error('P67: real-model source failures; no accuracy acceptance');
