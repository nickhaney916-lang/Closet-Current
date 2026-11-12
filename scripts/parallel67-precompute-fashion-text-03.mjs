/**
 * Parallel #67-03: precompute frozen fashion-category text embeddings once.
 * Production never invokes this: it is a research build-time step in GitHub
 * Actions. The resulting 47*768 float32 vectors have a SHA-256 receipt and
 * zero photos or private owner content. No source-specific label tuning.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {P67_FASHION_MODEL,P67_FASHION_REVISION,P67_LABELS} from './parallel67-independent-siglip-scoring.mjs';

export const p67Digest=data=>createHash('sha256').update(data).digest('hex');
export const p67TextLabels=()=>P67_LABELS.map(label=>'a photo of '+label);
export const P67_TEXT_SIZE=P67_LABELS.length*768*4;

export function p67PackageTextEmbeddings(data,{model=P67_FASHION_MODEL,revision=P67_FASHION_REVISION}={}){
 if(!(data instanceof Float32Array)||data.length!==P67_LABELS.length*768||data.some(x=>!Number.isFinite(x)))
  throw Error('P67-03: invalid text encoding vector shape');
 if(model!==P67_FASHION_MODEL||revision!==P67_FASHION_REVISION)throw Error('P67-03: wrong pretrained text origin');
 const bytes=Buffer.from(data.buffer,data.byteOffset,data.byteLength);
 const metadata={schema:'closet-current-p67-fashion-text-q8-frozen-v1',
  model,revision,quantization:'q8',labels:P67_LABELS.length,dimensions:768,
  byteLength:bytes.length,labelSha256:p67Digest(JSON.stringify(p67TextLabels())),
  sha256:p67Digest(bytes),originalPhotoCount:0,ownerPhotoBytes:0,
  accuracyClaim:'none',automaticSaveAllowed:false};
 if(bytes.length!==P67_TEXT_SIZE)throw Error('P67-03: wrong frozen text length');
 return {bytes,metadata};
}
export async function loadP67TextEmbeddings(directory){
 const d=resolve(directory);
 const metadata=JSON.parse(await readFile(join(d,'fashion-text-manifest.json'),'utf8'));
 const bytes=await readFile(join(d,'fashion-text-vectors.bin'));
 if(metadata.schema!=='closet-current-p67-fashion-text-q8-frozen-v1'||
  metadata.model!==P67_FASHION_MODEL||metadata.revision!==P67_FASHION_REVISION||
  metadata.quantization!=='q8'||metadata.labels!==P67_LABELS.length||
  metadata.dimensions!==768||metadata.byteLength!==P67_TEXT_SIZE||
  bytes.length!==P67_TEXT_SIZE||metadata.sha256!==p67Digest(bytes)||
  metadata.labelSha256!==p67Digest(JSON.stringify(p67TextLabels()))||
  metadata.originalPhotoCount!==0||metadata.ownerPhotoBytes!==0||
  metadata.automaticSaveAllowed!==false)
  throw Error('P67-03: text vector provenance or content integrity mismatch');
 const aligned=Uint8Array.from(bytes);
 const vectors=new Float32Array(aligned.buffer);
 if(vectors.some(x=>!Number.isFinite(x)))throw Error('P67-03: invalid numeric embeddings');
 return {vectors,metadata};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const output=resolve(process.argv[2]||'benchmark/p67-fashion-frozen-text');
 const {AutoTokenizer,SiglipTextModel,env}=await import('@huggingface/transformers');
 env.allowLocalModels=false;env.useFSCache=true;
 const tokenizer=await AutoTokenizer.from_pretrained(P67_FASHION_MODEL,{revision:P67_FASHION_REVISION});
 const model=await SiglipTextModel.from_pretrained(P67_FASHION_MODEL,{
  revision:P67_FASHION_REVISION,device:'cpu',dtype:'q8'
 });
 try{
  const input=tokenizer(p67TextLabels(),{padding:'max_length',truncation:true});
  const result=await model(input);
  const tensor=result?.text_embeds;
  if(!(tensor?.data instanceof Float32Array)||
     JSON.stringify(tensor.dims)!==JSON.stringify([P67_LABELS.length,768]))
   throw Error('P67-03: real q8 text encoder did not return the exact 47 x 768 tensor');
  const {bytes,metadata}=p67PackageTextEmbeddings(tensor.data);
  await mkdir(output,{recursive:true});
  await writeFile(join(output,'fashion-text-vectors.bin'),bytes);
  await writeFile(join(output,'fashion-text-manifest.json'),JSON.stringify(metadata,null,2)+'\n');
  const reread=await loadP67TextEmbeddings(output);
  if(reread.metadata.sha256!==metadata.sha256)throw Error('P67-03: write-read mismatch');
  console.log('P67_PRECOMPUTED_TEXT_PROVENANCE',JSON.stringify({
   model:metadata.model,revision:metadata.revision,labels:metadata.labels,
   bytes:metadata.byteLength,sha256:metadata.sha256,automaticSaveAllowed:false
  }));
 }finally{await model.dispose();}
}
