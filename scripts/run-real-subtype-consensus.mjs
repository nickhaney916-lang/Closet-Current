// Experimental real-photo FashionCLIP subtype agreement, NOT production or mask accuracy.
// Run separate 336px whole vs 320px confirmation views of actual hash-locked RGB sources.
// Semantic class observations were recorded from the independent prior SegFormer benchmark.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {AutoProcessor,CLIPVisionModelWithProjection,RawImage,env} from '@huggingface/transformers';
import {makeVectorScorer,validateVectorBundle} from '../public/vector-scorer.mjs';
import {prepareRecognitionPhoto} from '../public/recognition-photo.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
import {reconcileGarmentSubtype,reconcileOutfitInstances} from '../benchmark/garment-subtype-consensus.mjs';

const output=process.argv[2]||'benchmark/real-subtype-consensus';
const [planned,locked,fresh,observed,meta,bytes]=await Promise.all([
 readFile('benchmark/expanded-outfit-review-manifest.json','utf8').then(JSON.parse),
 readFile('benchmark/locked-photo-sources.json','utf8').then(JSON.parse),
 readFile('benchmark/manifest-fresh-11.json','utf8').then(JSON.parse),
 readFile('benchmark/observed-segmentation-regions-20261017.json','utf8').then(JSON.parse),
 readFile('public/recognition-vectors.json','utf8').then(JSON.parse),
 readFile('public/recognition-vectors.bin')
]);
const vectors=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
validateVectorBundle(meta,vectors);
const all=new Map([...locked,...fresh].map(x=>[x.id,x]));
const observations=new Map(observed.cases.map(x=>[x.id,x]));
if(!observed.classificationNotGroundTruth||planned.length!==8||observations.size!==8)
 throw Error('Incomplete or misleading semantic evidence manifest');
for(const p of planned){
 const x=all.get(p.id),s=observations.get(p.id);
 if(!x||!s||x.verified!==true||!/^[a-f0-9]{64}$/.test(x.sha256)
   ||s.semanticClasses.some(c=>![4,5,6,7,9].includes(c))
   ||new Set(s.semanticClasses).size!==s.semanticClasses.length)
   throw Error('Unverified model evidence for '+p.id);
}
await mkdir(output,{recursive:true});
const summary={status:'running',model:meta.model,revision:meta.revision,
  semanticEvidence:observed.source,sourcePhotosVerified:true,
  twoImageFramingsSameModel:true,independentModelsCompared:false,
  originalPhotosUnmodified:true,accuracyMeasured:false,
  productionAuthorized:false,actualPhoneMeasured:false,cases:[]};
const save=()=>writeFile(join(output,'summary.json'),JSON.stringify(summary,null,2));
await save();
env.allowLocalModels=false;
const start=performance.now();
const processor=await AutoProcessor.from_pretrained(meta.model,{revision:meta.revision});
const model=await CLIPVisionModelWithProjection.from_pretrained(meta.model,{
 revision:meta.revision,device:'cpu',dtype:'q8'
});
summary.modelLoadMs=Math.round(performance.now()-start);
const score=makeVectorScorer(async image=>{
 const o=await model(await processor(image));
 if(!o.image_embeds?.data)throw Error('No CLIP image embedding');
 return o.image_embeds.data;
},meta,vectors);
try{
 const labels=localCandidates.map(x=>x.label);
 const choices=new Map(localCandidates.map(x=>[x.label,x]));
 for(const p of planned){
  const source=all.get(p.id),obs=observations.get(p.id);
  const path=join('benchmark/photos',source.image),raw=await readFile(path);
  if(createHash('sha256').update(raw).digest('hex')!==source.sha256)
   throw Error('Photo source changed '+p.id);
  const photo=await RawImage.read(path),start=performance.now();
  const whole=await prepareRecognitionPhoto(photo,RawImage,{confirmation:false});
  const center=await prepareRecognitionPhoto(photo,RawImage,{confirmation:true});
  const [a,b]=await Promise.all([score(whole,labels),score(center,labels)]);
  const prediction=list=>{
   const recognized=list.filter(x=>choices.get(x.label)?.category!=='Uncategorized').slice(0,3);
   return recognized.map(x=>({
     category:choices.get(x.label)?.category,itemType:choices.get(x.label)?.itemType,
     score:x.score,label:x.label
   }));
  };
  const byFrame=[prediction(a),prediction(b)];
  const topA=byFrame[0][0],topB=byFrame[1][0];
  const classFor=choice=>choice?.category==='Tops'||choice?.category==='Outerwear'?4:
   choice?.category==='Dresses'?7:choice?.category==='Shoes'?9:
   choice?.category==='Bottoms'?(choice.itemType==='Skirt'?5:6):null;
  const regionClass=classFor(topA);
  let consensus=null,reason='no-compatible-semantic-region';
  if(regionClass&&obs.semanticClasses.includes(regionClass)&&topA&&topB){
   const format=(v,other,frame)=>({category:v.category,itemType:v.itemType,
     score:v.score,secondScore:other?.score??0,frame,sourceSha256:source.sha256});
   // Compare the first and second *whole-label* results, not an expected
   // benchmark category. FashionCLIP probabilities were normalized over
   // the same full catalog in each independently framed view.
   const mainSecond=a.find(x=>x.label!==a[0]?.label)?.score??0;
   const confirmSecond=b.find(x=>x.label!==b[0]?.label)?.score??0;
   consensus=reconcileGarmentSubtype({sourceSha256:source.sha256,
     semanticClass:regionClass,regionId:p.id+':'+regionClass,
     whole:format(topA,{score:mainSecond},'whole-336'),
     confirmation:format(topB,{score:confirmSecond},'center-320')});
   reason=consensus.reason;
  }
  const regionEvidence=obs.semanticClasses.map(c=>({regionId:p.id+':'+c,semanticClass:c}));
  const outfit=reconcileOutfitInstances({sourceSha256:source.sha256,
    regions:regionEvidence,subtypes:consensus?[consensus]:[]});
  const row={id:p.id,sourceSha256:source.sha256,
    expectedBenchmarkCategories:p.expected, // shown after inference ONLY
    semanticClassesFromPriorRun:[...obs.semanticClasses],
    wholeTop3:byFrame[0],confirmationTop3:byFrame[1],
    proposedSemanticClass:regionClass,
    reviewReason:reason,subtypeCandidate:consensus?.catalogType||null,
    candidateCategory:consensus?.category||null,
    crossViewAgreement:topA?.category===topB?.category&&topA?.itemType===topB?.itemType,
    outfitCandidates:outfit.garmentCandidates,duplicateItemsCreated:outfit.unverifiedDuplicatesCreated,
    autoCreatedItems:outfit.autoCreatedItems,
    inferenceAndPreprocessingMs:Math.round(performance.now()-start),
    originalPreserved:true,reviewOnly:true};
  summary.cases.push(row);await save();
  console.log('REAL_SUBTYPE_CASE '+JSON.stringify(row));
 }
 summary.status='complete';
 await save();
}finally{
 await model.dispose();
}
