/*
 M1591 P0 isolated CPU-WASM vs JSEP ORT research, original SHA-pinned SegFormer
 fp32 ONNX. Does not edit/execute original P94 Worker, or prove a native fix.
 No production, account data, native debugger, privileged runner or deploy.
*/
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {webkit,chromium} from 'playwright';
const originalSha='02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3';
const originalBytes=15199746;
const originalJsep='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const sha=b=>createHash('sha256').update(b).digest('hex');
const mode=process.env.M1591_MODE,engine=process.env.M1591_BROWSER;
if(!['plain','jsep'].includes(mode)||!['webkit','chromium'].includes(engine))
 throw Error('unexpected original-model research arm');
if(process.env.GITHUB_RUN_ATTEMPT!=='1')throw Error('no retries of a natural failure');
const model=readFileSync('/tmp/m1591-original-fp32.onnx');
if(model.length!==originalBytes||sha(model)!==originalSha)throw Error('model identity mismatch');
const dir=resolve('node_modules/onnxruntime-web/dist');
const stem=mode==='plain'?'ort-wasm-simd-threaded':'ort-wasm-simd-threaded.jsep';
const opposite=mode==='plain'?'ort-wasm-simd-threaded.jsep':'ort-wasm-simd-threaded';
const bundle=mode==='plain'?'ort.wasm.min.mjs':'ort.min.mjs';
const allow=new Set(['ort.min.mjs','ort.wasm.min.mjs',
 'ort-wasm-simd-threaded.wasm','ort-wasm-simd-threaded.mjs',
 'ort-wasm-simd-threaded.jsep.wasm','ort-wasm-simd-threaded.jsep.mjs']);
const installedJsepSha=sha(readFileSync(resolve(dir,'ort-wasm-simd-threaded.jsep.wasm')));
const selectedSha=sha(readFileSync(resolve(dir,stem+'.wasm')));
const requested=new Set();
const worker=[
 "self.onmessage=async()=>{let stage='IMPORT';try{",
 "const ort=await import('/dist/"+bundle+"');",
 "ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;",
 "ort.env.wasm.wasmPaths={mjs:'/dist/"+stem+".mjs',wasm:'/dist/"+stem+".wasm'};",
 "stage='MODEL_FETCH';const r=await fetch('/model.onnx');if(!r.ok)throw Error('model-unavailable');",
 "const data=new Uint8Array(await r.arrayBuffer());",
 "const digest=await crypto.subtle.digest('SHA-256',data);",
 "const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');",
 "if(hash!=='"+originalSha+"'||data.length!=="+originalBytes+")throw Error('model-unverified');",
 "stage='SESSION_CREATE';const s=await ort.InferenceSession.create(data,{executionProviders:['wasm']});",
 "const inputs=s.inputNames.slice(0,6);if(inputs[0]!=='pixel_values')throw Error('unexpected-input');",
 "stage='DETERMINISTIC_INFERENCE';",
 "const tensor=new ort.Tensor('float32',new Float32Array(3*512*512),[1,3,512,512]);",
 "const outputs=await s.run({pixel_values:tensor});",
 "const logits=outputs.logits||outputs[Object.keys(outputs)[0]];",
 "const dims=Array.isArray(logits?.dims)?logits.dims.slice(0,6):[];",
 "const values=logits?.data;",
 "const finite=!!values&&values.length>0&&Array.from(values).every(v=>Number.isFinite(Number(v)));",
 "let outputSha=null;",
 "if(finite&&ArrayBuffer.isView(values)){",
 "const raw=new Uint8Array(values.buffer,values.byteOffset,values.byteLength);",
 "const hd=await crypto.subtle.digest('SHA-256',raw);",
 "outputSha=Array.from(new Uint8Array(hd),x=>x.toString(16).padStart(2,'0')).join('');}",
 "stage='RELEASE';await s.release();",
 "self.postMessage({phase:'done',modelAttested:true,inputs,inferenceRan:true,finiteOutput:finite,outputDims:dims,outputSha});",
 "}catch(e){const name=['RuntimeError','Error','TypeError','RangeError'].includes(e?.name)?e.name:'OTHER';",
 "const bounds=typeof e?.message==='string'&&e.message.slice(0,256).includes('memory access out of bounds');",
 "self.postMessage({phase:'error',stage,errorClass:name,boundsMessage:bounds});}};"
].join('\n');
const server=createServer((req,res)=>{
 try{
  const u=new URL(req.url,'http://127.0.0.1');
  if(req.method!=='GET')throw Error('only-get');
  res.setHeader('Cache-Control','no-store');
  if(u.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html>');}
  if(u.pathname==='/worker.mjs'){res.setHeader('Content-Type','application/javascript');return res.end(worker);}
  if(u.pathname==='/model.onnx'){res.setHeader('Content-Type','application/octet-stream');return res.end(model);}
  if(u.pathname.startsWith('/dist/')){
   const asset=u.pathname.slice(6);if(!allow.has(asset))throw Error('asset-not-allowlisted');
   if(asset.endsWith('.wasm'))requested.add(asset);
   res.setHeader('Content-Type',asset.endsWith('.wasm')?'application/wasm':'application/javascript');
   return res.end(readFileSync(resolve(dir,asset)));
  }
  throw Error('not-found');
 }catch{res.statusCode=404;res.end('not-found');}
});
let browser;
try{
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
 browser=await (engine==='webkit'?webkit:chromium).launch({headless:true});
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 const result=await page.evaluate(()=>new Promise(resolve=>{
  const w=new Worker('/worker.mjs',{type:'module'});
  let finished=false;
  const done=r=>{if(finished)return;finished=true;clearTimeout(timer);w.terminate();resolve(r)};
  const timer=setTimeout(()=>done({phase:'timeout'}),220000);
  w.onmessage=e=>done(e.data);w.onerror=()=>done({phase:'worker-error'});
  w.postMessage({start:true});
 }));
 const receipt={schema:'M1591_DIRECT_ORIGINAL_ONNX_CPU_BUNDLE_AB_V1',
  mode,engine,ortVersion:'1.22.0-dev.20250409-89f8206ba4',
  originalModelShaVerified:true,modelBytes:model.length,originalP94WorkerExecuted:false,
  originalJsepNpmShaMatchesHistorical:installedJsepSha===originalJsep,
  selectedWasmSha:selectedSha,
  expectedWasmLoaded:requested.has(stem+'.wasm'),
  oppositeWasmLoaded:requested.has(opposite+'.wasm'),
  workerPhase:result?.phase||null,workerStage:result?.stage||null,
  workerErrorClass:result?.errorClass||null,
  workerWasmBoundsTextObserved:result?.boundsMessage===true,
  sessionInputNames:result?.inputs||[],
  deterministicInferenceRan:result?.inferenceRan===true,
  finiteOutput:result?.finiteOutput===true,outputDims:result?.outputDims||null,
  outputSha:result?.outputSha||null,
  nativeTrapPc:null,wasmFileOffset:null,originalNativeRedObserved:false,
  causalFixProven:false,releaseAllowed:false,familyAlpha:'HOLD'};
 const pass=result?.phase==='done'&&result?.modelAttested===true&&
   receipt.expectedWasmLoaded&&!receipt.oppositeWasmLoaded&&
   receipt.sessionInputNames.includes('pixel_values')&&
   receipt.deterministicInferenceRan&&receipt.finiteOutput&&
   Array.isArray(receipt.outputDims)&&receipt.outputDims.length>=2&&
   /^[0-9a-f]{64}$/.test(receipt.outputSha||'');
 console.log('M1591_SANITIZED_ORIGINAL_ONNX_SESSION '+JSON.stringify({...receipt,
  outcome:pass?'RESEARCH_ONLY_SAME_ORIGINAL_MODEL_SESSION_PASS':'FAIL_NOT_NATIVE_ATTRIBUTED'}));
 if(!pass)process.exitCode=1;
}finally{
 await browser?.close().catch(()=>{});
 await new Promise(done=>server.close(()=>done()));
}
