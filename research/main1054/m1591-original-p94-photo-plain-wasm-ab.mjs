/*
 * M1591 isolated alternate original-P94 public-photo journey. Derive the
 * original P94 source at runtime, replace ONLY its model initialization
 * expression in the 'plain' arm; 'jsep' arm runs unchanged original Worker.
 * Same public fp32 ONNX & licensed public JPEG, no family data, auth or deploy.
 * Any success is research-only: NOT a proven native causal repair.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const hash=x=>createHash('sha256').update(x).digest('hex');
const mode=process.env.M1591_MODE,engine=process.env.M1591_BROWSER;
if(!['jsep','plain'].includes(mode)||!['webkit','chromium'].includes(engine)||
   process.env.GITHUB_RUN_ATTEMPT!=='1')throw Error('wrong first-attempt mode');
const fixtureId=process.env.M1591_FIXTURE_ID||'commons-0003';
const fixtureAllowlist=new Set(['commons-0003','commons-0001','commons-0014','commons-0021','commons-0049']);
if(!fixtureAllowlist.has(fixtureId))throw Error('M1591 unapproved public fixture');
const lockedSources=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const matches=lockedSources.filter(x=>x.id===fixtureId);
if(matches.length!==1||matches[0].verified!==true||
   matches[0].image!==fixtureId+'.jpg'||
   !/^[a-f0-9]{64}$/.test(matches[0].sha256)||!matches[0].attribution?.license)
 throw Error('M1591 invalid public fixture metadata');
const photoPath='/benchmark/fixtures/'+fixtureId+'.jpg';
const photo=readFileSync('.'+photoPath);
const model=readFileSync('/tmp/m1591-original-fp32.onnx');
const original=readFileSync('public/outfit-worker-p94.mjs','utf8');
const modelSha='02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3';
const photoSha=matches[0].sha256;
if(hash(photo)!==photoSha||photo.length<1024||photo.length>3000000||
   hash(model)!==modelSha||model.length!==15199746||
   Buffer.byteLength(original)!==5778)throw Error('original public fixture identity invalid');
const needle=original.split('\n').filter(x=>
 x.includes('const model=await AutoModelForSemanticSegmentation.from_pretrained('));
if(needle.length!==1)throw Error('original model call anchor missing');
const alternative=[
 "const ort=await import('/dist/ort.wasm.min.mjs');",
 "ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;",
 "ort.env.wasm.wasmPaths={mjs:'/dist/ort-wasm-simd-threaded.mjs',wasm:'/dist/ort-wasm-simd-threaded.wasm'};",
 "const modelResponse=await fetch('/model.onnx',{cache:'no-store'});",
 "if(!modelResponse.ok)throw Error('original-model-unavailable');",
 "const originalModelBytes=new Uint8Array(await modelResponse.arrayBuffer());",
 "const d=await crypto.subtle.digest('SHA-256',originalModelBytes);",
 "const modelDigest=Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join('');",
 "if(modelDigest!=='"+modelSha+"'||originalModelBytes.length!==15199746)throw Error('original-model-sha-mismatch');",
 "const directSession=await ort.InferenceSession.create(originalModelBytes,{executionProviders:['wasm']});",
 "const model=async input=>{",
 "const pixels=input?.pixel_values;",
 "if(!pixels||!Array.isArray(pixels.dims)||!pixels.data)throw Error('original-processor-tensor-missing');",
 "const arr=pixels.data instanceof Float32Array?pixels.data:new Float32Array(pixels.data);",
 "const x=new ort.Tensor('float32',arr,pixels.dims);",
 "const outputs=await directSession.run({pixel_values:x});",
 "if(!outputs.logits)throw Error('missing-original-segformer-logits');",
 "return {logits:outputs.logits};",
 "};"
].join('\n  ');
const adapted=original.replace(needle[0],alternative);
if(adapted===original||adapted.split('const model=async input=>').length!==2)
 throw Error('derived research Worker did not change exactly one anchor');
const wasmHits=new Set();
const fileAllow=new Set([
 '/public/outfit-worker-p94.mjs','/public/outfit-segmentation.mjs',
 '/public/photo-color.js',photoPath,
 '/model.onnx','/dist/ort.wasm.min.mjs',
 '/dist/ort-wasm-simd-threaded.wasm','/dist/ort-wasm-simd-threaded.mjs'
]);
const dist=resolve('node_modules/onnxruntime-web/dist');
const server=createServer((req,res)=>{
 try{
  const u=new URL(req.url,'http://127.0.0.1');
  if(req.method!=='GET')throw Error('not-allowed');
  if(u.pathname==='/'){
   res.setHeader('Content-Type','text/html');
   return res.end('<!doctype html><title>M1591 public photo research only</title>');
  }
  if(!fileAllow.has(u.pathname))throw Error('not-allowed');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Access-Control-Allow-Origin','*');
  if(u.pathname==='/model.onnx'){
   res.setHeader('Content-Type','application/octet-stream');return res.end(model);
  }
  if(u.pathname==='/public/outfit-worker-p94.mjs'){
   res.setHeader('Content-Type','application/javascript');
   return res.end(mode==='plain'?adapted:original);
  }
  if(u.pathname===photoPath){
   res.setHeader('Content-Type','image/jpeg');return res.end(photo);
  }
  if(u.pathname.startsWith('/dist/')){
   const asset=u.pathname.slice(6);
   if(asset.endsWith('.wasm'))wasmHits.add(asset);
   res.setHeader('Content-Type',asset.endsWith('.wasm')?'application/wasm':'application/javascript');
   return res.end(readFileSync(resolve(dist,asset)));
  }
  const file=resolve('.'+u.pathname);
  res.setHeader('Content-Type',extname(file)==='.mjs'?'application/javascript':'text/javascript');
  return res.end(readFileSync(file));
 }catch{res.statusCode=404;res.end('not-found');}
});
let browser=null;
try{
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
 browser=await (engine==='webkit'?webkit:chromium).launch({headless:true});
 const page=await browser.newPage();
 // Same-origin research-only page; Worker retains the original P94 path.
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 const data=await page.evaluate(async id=>{
  const jpeg=await (await fetch('/benchmark/fixtures/'+id+'.jpg',{cache:'no-store'})).arrayBuffer();
  const bytes=new Uint8Array(jpeg);
  let text='';
  for(let i=0;i<bytes.length;i+=32768)
   text+=String.fromCharCode(...bytes.subarray(i,i+32768));
  const uri='data:image/jpeg;base64,'+btoa(text);
  return await new Promise(done=>{
   const w=new Worker('/public/outfit-worker-p94.mjs',{type:'module'});
   let stopped=false,pieces=[],pending=[],progress=0;
   const finish=v=>{if(stopped)return;stopped=true;clearTimeout(clock);w.terminate();done(v)};
   const clock=setTimeout(()=>finish({terminal:'timeout',pieces:[],progress}),220000);
   w.onerror=()=>finish({terminal:'worker-error',pieces:[],progress});
   w.onmessage=e=>{
    const type=e?.data?.type;
    if(type==='progress'){progress++;return;}
    if(type==='piece'){
     const p=e.data.piece;
     const i=pieces.length;pieces.push(null);
     pending.push((async()=>{
      const raw=JSON.stringify({label:p?.label,cropBounds:p?.cropBounds,
       image:p?.image,recognitionPhoto:p?.recognitionPhoto,colorEstimate:p?.colorEstimate});
      const hashed=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
      pieces[i]=Array.from(new Uint8Array(hashed),b=>b.toString(16).padStart(2,'0')).join('');
     })());
     return;
    }
    if(type==='done'||type==='error'){
     Promise.all(pending).then(()=>finish({terminal:type,pieces,progress,
      count:e.data?.count??null}),()=>finish({terminal:'hash-error',pieces:[],progress}));
    }
   };
   w.postMessage({id:'m1591-public-photo',image:uri});
  });
 },fixtureId);
 const safe={schema:'M1591_P94_PUBLIC_PHOTO_ALTERNATE_CPU_WASM_V1',
  fixtureId,fixtureSha256:photoSha,fixtureBytes:photo.length,
  engine,mode,originalWorkerBlob:'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
  sourcePublicPhotoShaVerified:true,originalOnnxShaVerified:true,
  alternativeIsDerivedNotShipped:mode==='plain',originalWorkerUnchanged:true,
  publicPhotoOnly:true,terminal:data?.terminal||null,progressCount:data?.progress||0,
  pieceCount:data?.pieces?.length||0,outputPieceHashes:data?.pieces||[],
  originalDoneCount:data?.count??null,
  plainWasmLoaded:wasmHits.has('ort-wasm-simd-threaded.wasm'),
  nativeTrapPc:null,wasmFileOffset:null,causalFixProven:false,
  releaseAllowed:false,familyAlpha:'HOLD'};
 const good=safe.terminal==='done'&&safe.pieceCount>0&&
  safe.originalDoneCount===safe.pieceCount&&safe.outputPieceHashes.every(x=>/^[a-f0-9]{64}$/.test(x))&&
  (mode==='jsep'||safe.plainWasmLoaded);
 console.log('M1591_P94_PUBLIC_PHOTO_SANITIZED '+JSON.stringify({...safe,
  outcome:good?'PUBLIC_PHOTO_RESEARCH_WORKER_PASS':'FAIL_UNATTRIBUTED_OR_BLOCKED'}));
 if(!good)process.exitCode=1;
}finally{
 await browser?.close().catch(()=>{});
 await new Promise(ok=>server.close(()=>ok()));
}
