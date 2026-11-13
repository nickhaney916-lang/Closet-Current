/** Real CPU ONNX inference on frozen PUBLIC DEVELOPMENT originals only.
 * No training, new labels, private photos, remote inference, or wardrobe writes.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {localCandidates} from '../public/local-catalog.mjs';
import {MODELS81,observation81,arbitrate81} from '../public/model-arbitration-81.mjs';
import {makeVectorScorer,normalizedVector} from '../public/vector-scorer.mjs';
import {corroborateAmbiguousType} from '../public/recognition-confusion-guard.mjs';
import {fitWholePhoto,prepareRecognitionPhoto} from '../public/recognition-photo.mjs';
import {recognizeWithRecovery} from '../public/recognition-engine.mjs';
const digest=x=>createHash('sha256').update(x).digest('hex');
const out=resolve(process.argv[2]||'benchmark/p81-output');
const manifestFiles=['benchmark/manifest-reviewed-32.json','benchmark/manifest-holdout-16.json'];
const manifests=await Promise.all(manifestFiles.map(async p=>JSON.parse(await readFile(p,'utf8'))));
const index=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const requested=process.env.P81_IDS?.split(',');
const sources=manifests.flat().filter(x=>!requested||requested.includes(x.id));
if(new Set(sources.map(x=>x.id)).size!==sources.length||!sources.length)throw Error('P81 duplicate sources');
const inputs=[];
for(const source of sources){
 const receipt=index.find(x=>x.id===source.id);
 if(!receipt?.verified||!source.verified||source.image!==receipt.image||!['CC0','Public domain','CC BY 2.0','CC BY 4.0','CC BY-SA 2.0','CC BY-SA 3.0','CC BY-SA 4.0'].includes(receipt.attribution?.license))throw Error('P81 source rights/identity');
 const bytes=await readFile(join('benchmark/photos',source.image));
 if(digest(bytes)!==receipt.sha256||bytes[0]!==255||bytes[1]!==216)throw Error('P81 original mismatch');
 inputs.push({source,sha256:receipt.sha256,path:resolve('benchmark/photos',source.image)});
}
const {CLIPVisionModelWithProjection,SiglipTextModel,SiglipVisionModel,AutoProcessor,AutoTokenizer,RawImage,env}=await import('@huggingface/transformers');
env.allowLocalModels=false;env.useFSCache=true;env.backends.onnx.wasm.numThreads=1;
const options={dtype:'q8',device:'cpu',session_options:{intraOpNumThreads:2,interOpNumThreads:1}};
const runHash=digest(await readFile(new URL(import.meta.url)));
const meta=JSON.parse(await readFile('public/recognition-vectors.json','utf8'));
const bytes=await readFile('public/recognition-vectors.bin');
if(digest(bytes)!==meta.sha256||meta.revision!==MODELS81.fashionclip.revision)throw Error('P81 vector integrity');
const vectors=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length));
const labels=localCandidates.map(x=>x.label), results=new Map();
const binding=x=>({sourceSha256:x.sha256,inputSha256:x.sha256,ownerSession:'public-development-no-owner',photoRevision:'frozen-public-original',cropRevision:'whole-original',maskRevision:'none',unitRevision:'unreviewed',instanceId:'whole'});
const start=performance.now(),modelTimings={};
for(const modelKey of ['fashionclip','fashionSiglip']){
 const pin=MODELS81[modelKey],load=performance.now();
 console.log('P81_LOADING',modelKey,pin.revision);
 const processor=await AutoProcessor.from_pretrained(pin.id,{revision:pin.revision});
 const vision=await (modelKey==='fashionclip'?CLIPVisionModelWithProjection:SiglipVisionModel).from_pretrained(pin.id,{...options,revision:pin.revision});
 let textModel,textVectors,textHash;
 if(modelKey==='fashionSiglip'){
  const tokenizer=await AutoTokenizer.from_pretrained(pin.id,{revision:pin.revision});
  textModel=await SiglipTextModel.from_pretrained(pin.id,{...options,revision:pin.revision});
  const tensor=(await textModel(tokenizer(labels.map(x=>'a photo of '+x),{padding:'max_length',truncation:true}))).text_embeds;
  if(tensor.dims[0]!==labels.length||tensor.dims[1]!==768)throw Error('P81 text dimensions');
  textVectors=labels.map((_,i)=>normalizedVector(tensor.data.slice(i*768,(i+1)*768),768));
  textHash=digest(Buffer.concat(textVectors.map(v=>Buffer.from(v.buffer))));
  await textModel.dispose();
 }else textHash=meta.sha256;
 modelTimings[modelKey]={loadMs:Math.round(performance.now()-load),visionWeightSha256:digest(await readFile(join('node_modules/@huggingface/transformers/.cache',pin.id,pin.revision,'onnx/vision_model_quantized.onnx')))};
 try{
  for(const input of inputs){
   const t=performance.now(),image=(await RawImage.read(input.path)).rgb();
   let scores,baseline=null;
   if(modelKey==='fashionclip'){
    const make=(settings={})=>makeVectorScorer(async im=>(await vision(await processor(await prepareRecognitionPhoto(im,RawImage,settings)))).image_embeds.data,meta,vectors);
    const whole=make(),center=make({confirmation:true});
    const recoveryModel=makeVectorScorer(async im=>(await vision(await processor(await fitWholePhoto(im,RawImage)))).image_embeds.data,meta,vectors);
    const recoveryConfirmationModel=makeVectorScorer(async im=>(await vision(await processor(im))).image_embeds.data,meta,vectors);
    scores=await whole(image,labels);
    baseline=await recognizeWithRecovery(whole,image,{confirmationModel:center,skirtPaddingModel:make({contentSizeOverride:288}),coatNearFullModel:make({contentSizeOverride:334}),recoveryModel,recoveryConfirmationModel});
    baseline=await corroborateAmbiguousType(baseline);
   }else{
    const vector=normalizedVector((await vision(await processor(image))).image_embeds.data,768);
    scores=labels.map((label,i)=>({label,score:textVectors[i].reduce((s,x,j)=>s+x*vector[j],0)}));
   }
   const observation=observation81({modelKey,binding:binding(input),scores,workerSourceSha256:runHash,vectorSha256:textHash,latencyMs:Math.round(performance.now()-t)});
   const record=results.get(input.source.id)||{id:input.source.id,sourceSha256:input.sha256,developmentExpectation:{category:input.source.expectedCategory,itemType:input.source.expectedType},observations:[]};
   record.observations.push(observation);if(baseline)record.baseline={strong:baseline.strong,choices:baseline.choices,reason:baseline.reason};
   results.set(record.id,record);
   if(digest(await readFile(input.path))!==input.sha256)throw Error('P81 original changed');
   console.log('P81_INFERENCE',modelKey,record.id,observation.ranking[0].itemType,observation.latencyMs);
  }
 }finally{await vision.dispose();}
}
const rows=[...results.values()].map(r=>({...r,candidate:arbitrate81({binding:r.observations[0].binding,observations:r.observations})}));
const rankMatches=(r,k)=>r.observations.find(o=>o.modelKey===k).ranking[0].itemType===r.developmentExpectation.itemType;
const summary={status:'DEVELOPMENT_DIAGNOSTIC_NOT_BLIND_ACCURACY',independentHumanReviewedCount:0,independentAccuracy:null,promotion:'NO_GO',sourceCount:rows.length,modelTimings,totalMs:Math.round(performance.now()-start),
 baselineStrong:rows.filter(x=>x.baseline.strong).length,crossFamilyHypotheses:rows.filter(x=>x.candidate.status==='cross_family_hypothesis').length,abstentions:rows.filter(x=>x.candidate.status==='abstain').length,
 rawTop1: Object.fromEntries(['fashionclip','fashionSiglip'].map(k=>[k,{categoryMatches:rows.filter(r=>r.observations.find(o=>o.modelKey===k).ranking[0].category===r.developmentExpectation.category).length,exactSubtypeMatches:rows.filter(r=>r.observations.find(o=>o.modelKey===k).ranking[0].itemType===r.developmentExpectation.itemType).length}])),
 fusedFirstHintExactMatches:rows.filter(r=>r.candidate.hypotheses[0]?.itemType===r.developmentExpectation.itemType).length,
 gains:rows.filter(r=>!rankMatches(r,'fashionclip')&&rankMatches(r,'fashionSiglip')).map(r=>r.id),losses:rows.filter(r=>rankMatches(r,'fashionclip')&&!rankMatches(r,'fashionSiglip')).map(r=>r.id),
 historicalOnly:true,automaticAdmissions:0,framing:'FashionCLIP existing whole/center prepared views; FashionSigLIP original processor view. Pipeline comparison, not weights-only experiment.',manifestSha256:await Promise.all(manifestFiles.map(async p=>digest(await readFile(p))))};
await mkdir(out,{recursive:true});await writeFile(join(out,'comparison.json'),JSON.stringify({summary,rows},null,2)+'\n');console.log('P81_SUMMARY',JSON.stringify(summary));
