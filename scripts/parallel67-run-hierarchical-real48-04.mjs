/**
 * Parallel #67 milestone 4:
 * TRAIN an actual hierarchical supervised prototype head on 32 SHA-verified
 * publisher originals and evaluate against 16 disjoint-by-SHA historically
 * reviewed originals using the SAME pretrained q8 Marqo fashion image encoder.
 *
 * This is not a blind new dataset and cannot approve an automatic wardrobe
 * save. All source JPEG bytes remain local and out of CI artifacts.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {
 P67_FASHION_MODEL,P67_FASHION_REVISION
} from './parallel67-independent-siglip-scoring.mjs';
import {
 fitHierarchicalFashion67_04,scoreHierarchicalFashion67_04,P67_04_DIMENSION
} from './parallel67-hierarchical-prototypes-04.mjs';

const output=resolve(process.argv[2]||'benchmark/p67-hierarchy-04');
const trainManifest=JSON.parse(await readFile('benchmark/manifest-reviewed-32.json','utf8'));
const evalManifest=JSON.parse(await readFile('benchmark/manifest-holdout-16.json','utf8'));
const photoSources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const index=new Map(photoSources.map(x=>[x.id,x]));
if(trainManifest.length!==32||evalManifest.length!==16)
 throw Error('P67-04: expected exact 32 training/16 evaluation original labels');
const seen=new Set(),shaSeen=new Set();
for(const [group,items]of [['train',trainManifest],['eval',evalManifest]]){
 for(const row of items){
  const source=index.get(row.id);
  if(!row.verified||row.mode!=='single'||!source?.verified||
     !source.sha256||!/^[a-f0-9]{64}$/.test(source.sha256)||
     source.image!==row.image||seen.has(row.id)||shaSeen.has(source.sha256)||
     (row.sha256&&row.sha256!==source.sha256)||
     typeof row.expectedCategory!=='string'||typeof row.expectedType!=='string')
   throw Error('P67-04: inconsistent/duplicate original source or human label '+group+' '+row.id);
  seen.add(row.id);shaSeen.add(source.sha256);
 }
}
const {SiglipVisionModel,AutoProcessor,RawImage,env}=await import('@huggingface/transformers');
env.allowLocalModels=false;env.useFSCache=true;
const begin=performance.now();
const opts={revision:P67_FASHION_REVISION,dtype:'q8',device:'cpu'};
console.log('P67_04_LOCAL_SUPERVISED_VISION_ENCODER_START',P67_FASHION_MODEL,P67_FASHION_REVISION);
const [processor,model]=await Promise.all([
 AutoProcessor.from_pretrained(P67_FASHION_MODEL,{revision:P67_FASHION_REVISION}),
 SiglipVisionModel.from_pretrained(P67_FASHION_MODEL,opts)
]);
const loadMs=Math.round(performance.now()-begin);
const rawRows=[],perSourceTime=[];
try{
 for(const [split,manifest]of [['train',trainManifest],['eval',evalManifest]]){
  for(const row of manifest){
   const source=index.get(row.id),file=join('benchmark/photos',row.image);
   const bytes=await readFile(file);
   if(createHash('sha256').update(bytes).digest('hex')!==source.sha256)
    throw Error('P67-04: original publisher JPEG bytes changed '+row.id);
   const t=performance.now();
   const photo=await RawImage.read(resolve(file));
   const enc=await model(await processor(photo));
   if(!(enc?.image_embeds?.data instanceof Float32Array)||
      JSON.stringify(enc.image_embeds.dims)!==JSON.stringify([1,P67_04_DIMENSION]))
    throw Error('P67-04: actual q8 model produced unverified image embedding dimensions');
   const elapsed=Math.round(performance.now()-t);
   const embedding=new Float32Array(enc.image_embeds.data);
   if(embedding.some(x=>!Number.isFinite(x)))
    throw Error('P67-04: nonfinite real image encoding');
   rawRows.push({
    id:row.id,split,category:row.expectedCategory,type:row.expectedType,
    acceptedTypes:row.acceptedTypes||[row.expectedType],
    originalSha256:source.sha256,shaVerified:true,embedding
   });
   perSourceTime.push(elapsed);
   console.log('P67_04_LOCAL_SOURCE_EMBEDDED',JSON.stringify({id:row.id,split,ms:elapsed}));
  }
 }
}finally{await model.dispose();}
const train=rawRows.filter(x=>x.split==='train'),evalRows=rawRows.filter(x=>x.split==='eval');
const fit=fitHierarchicalFashion67_04(train);
const result=scoreHierarchicalFashion67_04(fit,evalRows);
const sorted=[...perSourceTime].sort((a,b)=>a-b);
const p95=sorted[Math.ceil(sorted.length*.95)-1];
const report={
 ...result,
 model:P67_FASHION_MODEL,revision:P67_FASHION_REVISION,
 pipeline:'q8-Marqo-fashionSigLIP-image-embedding + supervised normalized per-category/type centroids',
 training:'32 existing reviewed publisher photos (not newly blind)',evaluation:'16 disjoint-by-SHA pre-existing development-exposed publisher photos',
 trainingManifestSha256:createHash('sha256').update(await readFile('benchmark/manifest-reviewed-32.json')).digest('hex'),
 evaluationManifestSha256:createHash('sha256').update(await readFile('benchmark/manifest-holdout-16.json')).digest('hex'),
 sourceIndexSha256:createHash('sha256').update(await readFile('benchmark/locked-photo-sources.json')).digest('hex'),
 trainedCategoryCounts:fit.categoryCounts,
 trainedAvailability:fit.availability,
 trainedSupportedCategories:[...fit.categoryHeads.keys()],
 trainedSubtypeHeads:Object.fromEntries([...fit.subtypeHeads].map(([category,heads])=>[category,[...heads.keys()]])),
 trainedSourceCount:fit.sourceCount,
 trainingAndTestOriginalIDsDisjoint:true,
 trainingAndTestOriginalSHAsDisjoint:true,
 encoderLoadMs:loadMs,
 sourceInferenceMedianMs:sorted[Math.floor(sorted.length/2)],
 sourceInferenceP95Ms:p95,
 sourceEmbeddingsEmittedInArtifact:false,
 disclaimer:'historical development-exposed diagnostic only; no blind new-human accuracy, no auto-admission, no calibrated confidence',
};
await mkdir(output,{recursive:true});
await writeFile(join(output,'hierarchical-supervised-diagnostic.json'),JSON.stringify(report,null,2)+'\n');
console.log('P67_04_REAL_SUPERVISED_HIERARCHICAL_RESULT',JSON.stringify({
 train:fit.sourceCount,eval:result.count,garments:result.garments,negative:result.negatives,
 categoryCorrect:result.categoryTop1,subtypeCorrect:result.subtypeBroadTop1,
 subtypeReviewNeeded:result.subtypeReviewNeeded,exactSubtypeCorrect:result.exactSubtypeTop1,
 supported:report.trainedSubtypeHeads,missingLabels:report.trainedAvailability,
 modelLoadMs:loadMs,medianInferenceMs:report.sourceInferenceMedianMs,
 automaticWardrobeSaved:0
}));
