/** M23 NO-DEPLOY: same-pinned-model JSEP vs CPU-only ONNX WASM in desktop WebKit.
 * Direct ONNX model-vector parity and sampled browser RSS/PSS. NOT native
 * owner review, blind recognition accuracy, photo-based 3D, or phone results.
 * No output vectors, photographs, paths or PIDs are persisted in evidence. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {webkit} from 'playwright';
import {snapshotBrowserProcessTree} from '../research/master-consolidation-1054/browser-process-memory.mjs';
import {verifyWasmAB} from '../research/master-consolidation-1054/ort-wasm-ab-gate.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const codeCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const wasmVersion='1.22.0-dev.20250409-89f8206ba4';
const packageORT=JSON.parse(await readFile('node_modules/onnxruntime-web/package.json','utf8'));
const packageTF=JSON.parse(await readFile('node_modules/@huggingface/transformers/package.json','utf8'));
assert.equal(packageORT.version,wasmVersion,'JSEP and standard WASM must share identical pinned ONNX Runtime package');
assert.equal(packageTF.version,'3.8.1','preprocessing cannot change from installed Transformers.js');
const root=resolve('benchmark/p82-model-assets');
const lock=(await import('../public/dual-model-lock-82.mjs')).ASSETS82;
assert.equal(lock.runtime,'@huggingface/transformers@3.8.1');
const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const sourceIds=(process.env.MAIN1054_M23_SOURCES||'commons-0035').split(',');
assert.ok(sourceIds.length>=1&&sourceIds.length<=2&&new Set(sourceIds).size===sourceIds.length);
const verifiedSources=Object.fromEntries(manifest.filter(q=>q.verified).map(q=>[q.id,q.sha256]));
const sources=[];
for(const id of sourceIds){
 const m=manifest.find(m=>m.id===id);
 assert.ok(m?.verified&&m.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'));
 assert.ok(['CC0','Public domain','CC BY 2.0','CC BY 4.0','CC BY-SA 2.0','CC BY-SA 3.0','CC BY-SA 4.0'].includes(m.attribution.license));
 const bytes=await readFile('benchmark/photos/'+m.image);
 assert.equal(sha(bytes),m.sha256,'original source bytes mismatch');
 sources.push({id,sha256:m.sha256,jpegBase64:bytes.toString('base64')});
}
const ortRoot=resolve('node_modules/onnxruntime-web/dist');
const modelPins=[
 {modelKey:'fashionclip',id:'ff13/fashion-clip',revision:lock.models.fashionclip.revision},
 {modelKey:'fashionSiglip',id:'Marqo/marqo-fashionSigLIP',revision:lock.models.fashionSiglip.revision}
];
for(const pin of modelPins){
 const file='models/'+pin.id+'/onnx/vision_model_quantized.onnx';
 const bytes=await readFile(join(root,file));
 assert.equal(sha(bytes),lock.files[file].sha256,'pinned q8 model mismatch');
}
const binaries={
 jsep:{js:'ort.min.mjs',wasm:'ort-wasm-simd-threaded.jsep.wasm'},
 wasm:{js:'ort.wasm.min.mjs',wasm:'ort-wasm-simd-threaded.wasm'}
};
const runtimeHashes={};
for(const [mode,b] of Object.entries(binaries)){
 const j=await readFile(join(ortRoot,b.js)),w=await readFile(join(ortRoot,b.wasm));
 assert.ok(j.length>10000&&w.length>1e6);
 runtimeHashes[mode]={jsSha256:sha(j),wasmSha256:sha(w)};
}
assert.notEqual(runtimeHashes.jsep.wasmSha256,runtimeHashes.wasm.wasmSha256,'same binary in both modes');
const served={'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.bin':'application/octet-stream','.onnx':'application/octet-stream','.wasm':'application/wasm'};
const roots={
 '/ort/':ortRoot,
 '/transformers/':resolve(root,'runtime'),
 '/models/':resolve(root,'models'),
 '/source/':resolve('public')
};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  const p=decodeURIComponent(url.pathname);
  if(req.method!=='GET'||p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))throw Error('bad request');
  if(p==='/'){res.writeHead(200,{'content-type':'text/html'});return res.end('<!doctype html><html><title>M23 memory only, family alpha hold</title><body></body></html>');}
  const [prefix,folder]=Object.entries(roots).find(([prefix])=>p.startsWith(prefix))||[];
  if(!folder)throw Error('not allowlisted');
  const file=resolve(folder,p.slice(prefix.length));
  if(!file.startsWith(folder+'/'))throw Error('path escape');
  const data=await readFile(file);
  res.writeHead(200,{'content-type':served[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(data);
 }catch{res.writeHead(404);res.end('unavailable');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const host='http://127.0.0.1:'+server.address().port;
const start=Date.now();
const receipts={},privateVectors={};
const max=(a,b)=>b==null?a:Math.max(a??0,b);
let hardBudget=null;
const outputPath='benchmark/main1054-ort-wasm-ab/m23-diagnostic.json';
await mkdir('benchmark/main1054-ort-wasm-ab',{recursive:true});
const issueList=[];
const emit=async()=>{
 const result={
  schema:'main1054-ort-direct-wasm-ab-m23-v1',
  codeCommit,onnxRuntimeVersion:wasmVersion,transformersVersion:'3.8.1',
  browser:'webkit-desktop-linux',sampledMemoryOnly:true,
  publicSources:sourceIds,models:modelPins.map(m=>({modelKey:m.modelKey,revision:m.revision})),
  variants:receipts,
  familyAlpha:'HOLD',releaseAuthorized:false,physicalIPhone:false,
  hostedCloudWrites:0,ownerAutoSaves:0,
  elapsedMs:Date.now()-start,
  blockedReasons:issueList,
  caveat:'CPU-only direct ONNX image embeddings, NOT the full native owner review or phone release. Each variant uses separate WebKit browser and matched ONNX+preprocessing. Linux /proc RSS sum double-counts; PSS is sampled.'
 };
 // Avoid leaking per-source feature vectors into artifacts. The parity gate
 // sees full vectors in memory, but artifact contains only scalar metrics.
 const gated=verifyWasmAB({...result,variants:privateVectors},verifiedSources);
 result.gate={...gated};
 for(const variant of Object.values(result.variants)){
  for(const row of variant?.modelRuns??[])delete row.values;
 }
 await writeFile(outputPath,JSON.stringify(result,null,2)+'\n');
 console.log('MAIN1054_M23_WASM_AB_EVIDENCE',JSON.stringify({
  commit:codeCommit,gate:gated.status,errors:gated.errors,
  variants:Object.fromEntries(Object.entries(receipts).map(([name,v])=>
   [name,{status:v.status,rss:v.maxSampledTreeRSSBytes,pss:v.maxSampledTreePSSBytes,
    samples:v.samples,actualRuntime:v.actualRuntime,modelRuns:v.modelRuns?.length}])),
  parity:gated.comparisons,
  releaseAuthorized:false,familyAlpha:'HOLD'}));
 if(gated.status!=='SOURCE_MATCHED_ONNX_INFERENCE_PARITY_NOT_RELEASE')process.exitCode=2;
};
hardBudget=setTimeout(async()=>{
 issueList.push('HARNESS_TOTAL_BUDGET_EXPIRED');
 try{await emit();}catch{}
 console.log('MAIN1054_M23_TIMEOUT_BLOCKED',JSON.stringify({completed:Object.keys(receipts),releaseAuthorized:false}));
 process.exit(2);
},1000000);
try{
 for(const flavor of ['jsep','wasm']){
  let serverBrowser,client,context,last=null,memorySamples=0,maximumRSS=null,maximumPSS=null;
  let memoryTimer=null,hasErrors=[],requestPaths=[],rootPid=null,shutdown=false;
  const sample=()=>{
   try{
    const m=snapshotBrowserProcessTree(rootPid);
    if(!m)return;
    last=m;memorySamples++;
    maximumRSS=max(maximumRSS,m.summedTreeRSSBytes);
    maximumPSS=max(maximumPSS,m.proportionalTreePSSBytes);
   }catch{/* telemetry cannot make ONNX inference pass or crash */}
  };
  try{
   serverBrowser=await webkit.launchServer({headless:true});
   rootPid=serverBrowser.process()?.pid;
   sample();memoryTimer=setInterval(sample,2000);memoryTimer.unref();
   client=await webkit.connect(serverBrowser.wsEndpoint());
   context=await client.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
   await context.route('**/*',route=>{
    const u=route.request().url();
    if(route.request().method()==='GET'&&u.startsWith(host+'/')){
     requestPaths.push(new URL(u).pathname);return route.continue();
    }
    hasErrors.push('blocked external network request');return route.abort();
   });
   const page=await context.newPage();page.setDefaultTimeout(900000);
   page.on('pageerror',e=>hasErrors.push(String(e?.message||'pageerror').slice(0,120)));
   page.on('crash',()=>hasErrors.push('observed WebKit page crash'));
   await page.goto(host+'/');
   // Direct same-quantized-ONNX comparison. No app controller is loaded,
   // no private photos, no wardrobe DB, no model training or save path.
   const rows=await page.evaluate(async({mode,sources,modelPins,modelHashes})=>{
    const {env,RawImage,AutoProcessor}=await import('/transformers/transformers.min.js');
    env.allowRemoteModels=false;env.allowLocalModels=true;
    env.localModelPath=location.origin+'/models/';
    env.useBrowserCache=false;env.useFSCache=false;
    const ort=await import(mode==='jsep'?'/ort/ort.min.mjs':'/ort/ort.wasm.min.mjs');
    ort.env.wasm.numThreads=1;ort.env.wasm.simd=true;ort.env.wasm.proxy=false;
    ort.env.wasm.wasmPaths=location.origin+'/ort/';
    const {prepareRecognitionPhoto}=await import('/source/recognition-photo.mjs');
    const hex=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(x=>x.toString(16).padStart(2,'0')).join('');
    const outputs=[];
    for(const source of sources){
     const original=Uint8Array.from(atob(source.jpegBase64),c=>c.charCodeAt(0));
     if(await hex(original)!==source.sha256)throw Error('original photo changed');
     const rgb=(await RawImage.fromBlob(new Blob([original],{type:'image/jpeg'}))).rgb();
     for(const pin of modelPins){
      const framed=pin.modelKey==='fashionclip'?await prepareRecognitionPhoto(rgb,RawImage):rgb;
      const processor=await AutoProcessor.from_pretrained(pin.id,{revision:pin.revision});
      const processed=await processor(framed);
      const pixels=processed.pixel_values;
      if(!pixels?.data||!Array.isArray(pixels.dims)||pixels.data.length<100)
       throw Error('invalid source preprocessing tensor');
      const typed=pixels.data instanceof Float32Array?pixels.data:Float32Array.from(pixels.data);
      const inputSHA256=await hex(new Uint8Array(typed.buffer,typed.byteOffset,typed.byteLength));
      const path='/models/'+pin.id+'/onnx/vision_model_quantized.onnx';
      const modelData=new Uint8Array(await(await fetch(path)).arrayBuffer());
      if(await hex(modelData)!==modelHashes[pin.modelKey])throw Error('pinned q8 model weights changed');
      const start=performance.now();
      const session=await ort.InferenceSession.create(modelData,{
       executionProviders:['wasm'],intraOpNumThreads:1,graphOptimizationLevel:'all'});
      let response,inferenceMs;
      try{
       if(session.inputNames.length!==1||session.inputNames[0]!=='pixel_values')
        throw Error('unsupported ONNX model input signature: '+session.inputNames.join(','));
       const feeds={pixel_values:new ort.Tensor('float32',typed,pixels.dims)};
       const inferred=performance.now();
       response=await session.run(feeds);
       inferenceMs=Math.round(performance.now()-inferred);
       const outName='image_embeds';
       if(!response[outName]?.data)throw Error('required image_embeds output missing');
       const raw=response[outName].data;
       if(raw.length<100||Array.from(raw).some(v=>!Number.isFinite(v)))throw Error('invalid embedding vector');
       outputs.push({sourceId:source.id,sourceSHA256:source.sha256,modelKey:pin.modelKey,
        inputSHA256,modelSHA256:modelHashes[pin.modelKey],
        outputName:outName,outputShape:response[outName].dims,
        outputLength:raw.length,inferenceMs,
        sessionLoadMs:Math.round(inferred-start),
        values:Array.from(raw)});
      }finally{await session.release();}
     }
    }
    return outputs;
   },{mode:flavor,sources,modelPins,modelHashes:Object.fromEntries(modelPins.map(pin=>[pin.modelKey,
    lock.files['models/'+pin.id+'/onnx/vision_model_quantized.onnx'].sha256]))});
   sample();
   const runtimeArtifact='/ort/'+binaries[flavor].wasm;
   const observed=requestPaths.includes(runtimeArtifact);
   if(!observed)hasErrors.push('expected '+flavor+' binary not observed on network');
   if(requestPaths.includes('/ort/'+binaries[flavor==='jsep'?'wasm':'jsep'].wasm))
    hasErrors.push('unexpected cross-variant WASM binary observed');
   receipts[flavor]={
    status:hasErrors.length?'BLOCKED':'COMPLETE_OBSERVED',actualRuntime:flavor,
    wasmArtifact:binaries[flavor].wasm,...runtimeHashes[flavor],
    samples:memorySamples,rssComplete:last?.rssComplete??false,pssComplete:last?.pssComplete??false,
    maxSampledTreeRSSBytes:maximumRSS,maxSampledTreePSSBytes:maximumPSS,
    browserErrors:hasErrors,
    modelRuns:rows.map(({values,...r})=>r),requestedPhotoCount:sourceIds.length,
    observedWasmPath:observed,serverResourceCount:requestPaths.length,
    autoSaves:0,hostedRequests:0,
   };
   privateVectors[flavor]={...receipts[flavor],modelRuns:rows};
   console.log('MAIN1054_M23_VARIANT',JSON.stringify({
    flavor,loadedVariant:observed,rows:rows.length,pssBytes:maximumPSS,
    rssBytes:maximumRSS,modelDurations:rows.map(q=>({model:q.modelKey,ms:q.inferenceMs})),
    originalPhotoSHAValidated:true,ownerAutoSaves:0}));
  }catch(e){
   issueList.push(flavor+':'+String(e?.message||'inference failed').slice(0,300));
   receipts[flavor]={status:'BLOCKED',actualRuntime:flavor,modelRuns:[],
    wasmArtifact:binaries[flavor].wasm,...runtimeHashes[flavor],samples:memorySamples,
    rssComplete:last?.rssComplete??false,pssComplete:last?.pssComplete??false,
    maxSampledTreeRSSBytes:maximumRSS,maxSampledTreePSSBytes:maximumPSS,
    browserErrors:[String(e?.message||e).slice(0,150)]};
   privateVectors[flavor]=receipts[flavor];
  }finally{
   if(memoryTimer)clearInterval(memoryTimer);
   sample();shutdown=true;
   try{await context?.close();}catch{}
   try{await client?.close();}catch{}
   try{await serverBrowser?.close();}catch{}
  }
 }
 await emit();
}finally{
 if(hardBudget)clearTimeout(hardBudget);
 await new Promise(done=>server.close(done));
}
