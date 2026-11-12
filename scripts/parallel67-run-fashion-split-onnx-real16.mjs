/**
 * Parallel #67-02 — genuine Marqo fashion-domain SigLIP source comparison.
 *
 * IMPORTANT: Marqo's ONNX port ships text_model_quantized.onnx and
 * vision_model_quantized.onnx, NOT model_quantized.onnx. Unlike generic
 * SigLIP, pipeline('zero-shot-image-classification') cannot load its combined
 * ONNX graph. Explicitly load the two documented model classes.
 * Local photo bytes only; model artifacts may be downloaded from Hugging Face.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {
 P67_FASHION_MODEL,P67_FASHION_REVISION,P67_LABELS,
 rankSplitFashionEmbeddings67,evaluateIndependentSiglip67
} from './parallel67-independent-siglip-scoring.mjs';

const output=resolve(process.argv[2]||'benchmark/p67-fashion-real16');
const frozen=JSON.parse(await readFile('benchmark/manifest-holdout-16.json','utf8'));
const index=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const sources=new Map(index.map(x=>[x.id,x]));
if(frozen.length!==16||new Set(frozen.map(x=>x.id)).size!==16)throw Error('P67: modified historical source manifest');
for(const label of frozen){
 const source=sources.get(label.id);
 if(!label.verified||label.mode!=='single'||!label.conditions?.includes('visual-review')||
    !label.conditions?.includes('independent-garment-holdout')||!source?.verified||
    source.image!==label.image||!/^[a-f0-9]{64}$/.test(source.sha256))
  throw Error('P67: unverified public original source ID '+label.id);
}
const {SiglipTextModel,SiglipVisionModel,AutoTokenizer,AutoProcessor,RawImage,env}=
 await import('@huggingface/transformers');
env.allowLocalModels=false;
env.useFSCache=true;
const opts={revision:P67_FASHION_REVISION,dtype:'q8',device:'cpu'};
console.log('P67_FASHION_SEPARATE_ONNX_START',P67_FASHION_MODEL,P67_FASHION_REVISION);
const begin=performance.now();
const [tokenizer,processor,textModel,visionModel]=await Promise.all([
 AutoTokenizer.from_pretrained(P67_FASHION_MODEL,{revision:P67_FASHION_REVISION}),
 AutoProcessor.from_pretrained(P67_FASHION_MODEL,{revision:P67_FASHION_REVISION}),
 SiglipTextModel.from_pretrained(P67_FASHION_MODEL,opts),
 SiglipVisionModel.from_pretrained(P67_FASHION_MODEL,opts)
]);
const texts=P67_LABELS.map(label=>'a photo of '+label);
const textInputs=tokenizer(texts,{padding:'max_length',truncation:true});
const outputText=await textModel(textInputs);
const textVectors=outputText.text_embeds?.data;
console.log('P67_TEXT_OUTPUT_SHAPE_DIAGNOSTIC',JSON.stringify({
 labels:P67_LABELS.length,
 keys:Object.keys(outputText),
 tensors:Object.fromEntries(Object.entries(outputText).map(([key,t])=>[key,{
  dims:t?.dims||null,type:t?.type||null,
  elementType:t?.data?.constructor?.name||null,elementCount:t?.data?.length??null
 }])),
 tokenDims:textInputs?.input_ids?.dims||null
}));
if(!(textVectors instanceof Float32Array)||
    outputText.text_embeds?.dims?.[0]!==P67_LABELS.length||
    outputText.text_embeds?.dims?.[1]!==768||
    textVectors.length!==P67_LABELS.length*768)
 throw Error('P67: actual fashion text encoder did not return aligned source-pinned embeddings');
const dimensions=textVectors.length/P67_LABELS.length;
if(dimensions!==768)throw Error('P67: unexpected fashion joint text embedding dimension');
const loadMs=Math.round(performance.now()-begin);
console.log('P67_FASHION_REAL_ONNX_TEXT_AND_VISION_LOADED',JSON.stringify({loadMs,textDim:dimensions,labels:P67_LABELS.length}));
const rows=[];
try{
 for(const label of frozen){
  const file=join('benchmark/photos',label.image),bytes=await readFile(file);
  if(createHash('sha256').update(bytes).digest('hex')!==sources.get(label.id).sha256)
   throw Error('P67: source original SHA mismatch '+label.id);
  const started=performance.now();
  let row;
  try{
   const photo=await RawImage.read(resolve(file));
   const outputImage=await visionModel(await processor(photo));
   const imgVector=outputImage.image_embeds?.data;
   if(!(imgVector instanceof Float32Array)||
      outputImage.image_embeds?.dims?.[0]!==1||
      outputImage.image_embeds?.dims?.[1]!==dimensions)
    throw Error('P67: invalid native vision image_embeds shape');
   const ranked=rankSplitFashionEmbeddings67(imgVector,textVectors,dimensions);
   row={id:label.id,expectedCategory:label.expectedCategory,
    expectedType:label.expectedType,sourceShaVerified:true,...ranked,
    error:null,inferenceMs:Math.round(performance.now()-started)};
  }catch(error){
   console.log('P67_FASHION_SOURCE_FAILED',label.id,String(error?.name||'runtime').slice(0,60));
   row={id:label.id,expectedCategory:label.expectedCategory,
    expectedType:label.expectedType,sourceShaVerified:true,
    top:null,runnerUp:null,scoreGap:null,categoryRank:[],
    admissionAllowed:false,scoreMeaning:'uncalibrated-cosine-ranking-only',
    error:'runtime',inferenceMs:Math.round(performance.now()-started)};
  }
  rows.push(row);
  console.log('P67_FASHION_SOURCE_RANK',JSON.stringify({id:row.id,truth:row.expectedCategory,
   subtype:row.expectedType,top:row.top,runnerUp:row.runnerUp,error:row.error,ms:row.inferenceMs}));
 }
}finally{
 await Promise.allSettled([textModel.dispose(),visionModel.dispose()]);
}
const summary=evaluateIndependentSiglip67(frozen,rows,{
 model:P67_FASHION_MODEL,revision:P67_FASHION_REVISION
});
summary.modelLoadMs=loadMs;
summary.pipeline='@huggingface/transformers@3.8.1/split-text-model-and-vision-model/q8/cpu';
summary.variant='fashion-siglip-split-onnx-cosine';
summary.truthFileSha256=createHash('sha256').update(await readFile('benchmark/manifest-holdout-16.json')).digest('hex');
summary.sourceIndexSha256=createHash('sha256').update(await readFile('benchmark/locked-photo-sources.json')).digest('hex');
summary.missingNoSource=0;
await mkdir(output,{recursive:true});
await writeFile(join(output,'siglip-developer-exposed-real16.json'),JSON.stringify(summary,null,2)+'\n');
console.log('P67_FASHION_REAL_MODEL_SUMMARY',JSON.stringify({
 model:summary.model,loadMs,originals:summary.originalCount,garments:summary.garments,
 categoryTop1:summary.categoryTop1,subtypeTop1:summary.broadSubtypeTop1,
 negativeTop1:summary.negativeTop1,runtimeErrors:summary.runtimeErrors,
 byCategory:summary.byCategory,automaticSaveAdmissionAllowed:false
}));
if(summary.runtimeErrors)throw Error('P67: nonzero real-model source failures: cannot claim accuracy');
