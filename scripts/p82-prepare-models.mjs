/** Materialize PUBLIC pretrained assets locally. No photo inference/training or deployment.
 * Reuses exact #67 precomputed text builder, not new model research.
 */
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {p67PackageTextEmbeddings} from './parallel67-precompute-fashion-text-03.mjs';
import {MODELS81} from '../public/model-arbitration-81.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
const root=resolve('benchmark/p82-model-assets'),files={};
const {AutoProcessor,CLIPVisionModelWithProjection,SiglipVisionModel}=await import('@huggingface/transformers');
for(const [key,pin] of Object.entries(MODELS81)){
 await AutoProcessor.from_pretrained(pin.id,{revision:pin.revision});
 const model=await (key==='fashionclip'?CLIPVisionModelWithProjection:SiglipVisionModel).from_pretrained(pin.id,{revision:pin.revision,dtype:'q8',device:'cpu',session_options:{intraOpNumThreads:2}});await model.dispose();
 for(const name of ['config.json','preprocessor_config.json','onnx/vision_model_quantized.onnx']){
  const path=join(pin.id,name),src=join('node_modules/@huggingface/transformers/.cache',pin.id,pin.revision,name);
  const bytes=await readFile(src);
  if(name.endsWith('.onnx')&&digest(bytes)!==({fashionclip:'c6d61df38ae56329347400dc42a285a4233d0c681744fb37f52129b5fe248952',fashionSiglip:'f1009cfce0eedd409f601e8351eedab72e8529641105eee6517821a9a634a2f4'})[key])throw Error('P82 wrong vision weights');
  await mkdir(join(root,'models',pin.id,'onnx'),{recursive:true});await writeFile(join(root,'models',path),bytes);files['models/'+path]={sha256:digest(bytes),bytes:bytes.length};
 }
}
if(process.argv.includes('--rebuild-text')){execFileSync(process.execPath,['scripts/parallel67-precompute-fashion-text-03.mjs',join(root,'siglip-text')],{stdio:'inherit'});}else{
 const frozen=JSON.parse(await readFile('research/parallel82/frozen-text-82.json','utf8')),b=Buffer.from(frozen.base64,'base64'),packed=p67PackageTextEmbeddings(new Float32Array(Uint8Array.from(b).buffer));
 if(frozen.schema!=='p82-frozen-public-text-encoding-v1'||JSON.stringify(packed.metadata)!==JSON.stringify(frozen.metadata)||packed.metadata.sha256!=='2b9b4a71177238e0ca5e94ff2bc69748e9291a4726e108ef89774451f40c224f')throw Error('P82 frozen text integrity');
 await mkdir(join(root,'siglip-text'),{recursive:true});await writeFile(join(root,'siglip-text/fashion-text-vectors.bin'),b);await writeFile(join(root,'siglip-text/fashion-text-manifest.json'),JSON.stringify(frozen.metadata,null,2)+'\n');
}
for(const path of ['siglip-text/fashion-text-vectors.bin','siglip-text/fashion-text-manifest.json']){const bytes=await readFile(join(root,path));files[path]={sha256:digest(bytes),bytes:bytes.length};}
await mkdir(join(root,'runtime'),{recursive:true});
for(const file of ['transformers.min.js','ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm']){
 const bytes=await readFile(join('node_modules/@huggingface/transformers/dist',file));await writeFile(join(root,'runtime',file),bytes);files['runtime/'+file]={sha256:digest(bytes),bytes:bytes.length};
}
await mkdir(join(root,'native'),{recursive:true});
for(const name of ['recognition-vectors.json','recognition-vectors.bin']){const b=await readFile(join('public',name));await writeFile(join(root,'native',name),b);files['native/'+name]={sha256:digest(b),bytes:b.length};}
const lock={schema:'p82-local-assets-v1',runtime:'@huggingface/transformers@3.8.1',models:MODELS81,files};
const path='public/dual-model-lock-82.mjs',content='// Generated from pinned public pretrained assets; no images or training.\nexport const ASSETS82 = '+JSON.stringify(lock,null,2)+';\n';
if(process.argv.includes('--check')){if(await readFile(path,'utf8')!==content)throw Error('P82 asset lock not reproducible');}else await writeFile(path,content);
console.log('P82_LOCAL_PUBLIC_ASSETS',Object.keys(files).length,Object.values(files).reduce((n,f)=>n+f.bytes,0));
