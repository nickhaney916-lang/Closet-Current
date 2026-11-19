/**
 * M242 real local Playwright browser: test-only pinned onnxruntime-web WASM.
 * A byte-attested disposable ESM copy records the JS→WASM ABI argument to
 * _OrtCreateSessionOptions; the real export is called exactly once and the
 * original return or thrown error preserved. This does NOT read C heap state.
 * Minimal original generated Identity ONNX graph only, not original SegFormer.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {instrumentExactPinnedModule,verifyPinnedSources} from './main242-ort-session-abi-trace.mjs';

const ROOT=process.cwd();
const DIST=resolve(ROOT,'node_modules/onnxruntime-web/dist');
const TEMP=join(DIST,'ort.m242.source-attested.wasm.mjs');
const vec=n=>{const out=[];do{let b=n&127;n=Math.floor(n/128);if(n)b|=128;out.push(b);}while(n);return out};
const utf8=new TextEncoder();
const scalar=(tag,n)=>[...vec(tag*8),...vec(n)];
const message=(tag,v)=>[...vec(tag*8+2),...vec(v.length),...v];
const str=(tag,t)=>message(tag,[...utf8.encode(t)]);
function tinyIdentityModel(){
 const shape=message(1,scalar(1,1)); // ONNX TensorShapeProto.dim[0].dim_value = 1
 const tensor=[...scalar(1,1),...message(2,shape)]; // TensorProto type = float32, shape
 const type=message(1,tensor);
 const value=name=>[...str(1,name),...message(2,type)];
 const node=[...str(1,'x'),...str(2,'y'),...str(4,'Identity')];
 const graph=[...message(1,node),...str(2,'M242PublicIdentity'),
  ...message(11,value('x')),...message(12,value('y'))];
 return new Uint8Array([...scalar(1,8),...str(2,'M242LocalModel'),
  ...message(7,graph),...message(8,scalar(2,13))]);
}
async function serverForLocalRuntime(){
 const server=createServer(async(req,res)=>{
  try{
   const path=decodeURIComponent((req.url||'/').split('?')[0]);
   res.setHeader('Cross-Origin-Opener-Policy','same-origin');
   res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
   if(path==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><title>M242 native-only source audit</title>');return;}
   if(!path.startsWith('/ort/')){res.statusCode=404;res.end();return;}
   const file=resolve(DIST,path.slice(5));
   if(!file.startsWith(DIST+sep)){res.statusCode=403;res.end();return;}
   const data=await readFile(file);
   res.setHeader('Content-Type',file.endsWith('.wasm')?'application/wasm':'text/javascript; charset=utf-8');
   res.end(data);
  }catch{res.statusCode=404;res.end();}
 });
 await new Promise((ok,fail)=>server.once('error',fail).listen(0,'127.0.0.1',ok));
 return {server,url:'http://127.0.0.1:'+server.address().port};
}
async function testNative(engine,baseUrl,modelBytes){
 const {webkit,chromium}=await import('playwright');
 const browserType={webkit,chromium}[engine];
 assert.ok(browserType,'Only genuine native browsers are supported');
 const results=[];
 for(const desired of [true,false]){
  const browser=await browserType.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:800}});
   const page=await context.newPage();
   page.setDefaultTimeout(180000);
   await page.goto(baseUrl,{waitUntil:'load',timeout:30000});
   const result=await page.evaluate(async({model,desired})=>{
    const ort=await import('/ort/ort.m242.source-attested.wasm.mjs');
    ort.env.wasm.numThreads=1;
    ort.env.wasm.proxy=false;
    ort.env.wasm.wasmPaths='/ort/';
    globalThis.__m242OrtAbiCalls=[];
    const session=await ort.InferenceSession.create(
     new Uint8Array(model),{executionProviders:['wasm'],
      enableMemPattern:desired,enableCpuMemArena:true,graphOptimizationLevel:'basic'});
    try{
     const prediction=await session.run({x:new ort.Tensor('float32',new Float32Array([7]),[1])});
     return {desired,realPrediction:Number(prediction.y?.data?.[0]),
      nativeCalls:globalThis.__m242OrtAbiCalls};
    }finally{await session.release();}
   },{model:[...modelBytes],desired});
   assert.equal(result.realPrediction,7,'Real ONNX WASM Identity output invalid');
   assert.equal(result.nativeCalls.length,1,'Native session-options ABI was not invoked exactly once');
   const observed=result.nativeCalls[0];
   assert.equal(observed.memPatternFlag,desired,'Actual exported ABI Boolean differs from requested setting');
   assert.equal(observed.arenaFlag,true,'CPU arena flag unexpectedly changed');
   assert.equal(observed.actualCall,true);
   assert.equal(observed.handleReturned,true,'Native options handle was not returned');
   assert.ok(observed.argCount>=3,'Native call truncated');
   const receipt={engine,requestedPattern:desired,
    nativeAbiMemPattern:observed.memPatternFlag,nativeAbiArena:observed.arenaFlag,
    nativeExportInvoked:true,nativeHandleReturned:true,
    tinyLocalGeneratedOnnxIdentity:true,inferenceMatched:true,
    originalP94SegFormerNotRun:true,CAllocatorStateObserved:false,
    webkitPermanentFixClaim:false,releaseAuthorized:false};
   console.log('M242_REAL_NATIVE_WASM_ABI_RECEIPT',JSON.stringify(receipt));
   results.push(receipt);
   await context.close();
  }finally{await browser.close();}
 }
 assert.equal(results.length,2);
 assert.deepEqual(results.map(x=>x.nativeAbiMemPattern),[true,false]);
 return results;
}

const pinned=await verifyPinnedSources(ROOT);
const instrumented=instrumentExactPinnedModule(pinned.source);
console.log('M242_NATIVE_SOURCE_GUARD',JSON.stringify(instrumented.audit));
if(process.env.M242_SOURCE_ONLY==='1')process.exit(0);
const engine=process.env.M242_ENGINE||'webkit';
assert.ok(['webkit','chromium'].includes(engine));
const model=tinyIdentityModel();
assert.ok(model.length>60&&model.length<256,'Tiny identity graph malformed size');
let server;
try{
 await writeFile(TEMP,instrumented.content,{flag:'wx'});
 const local=await serverForLocalRuntime();
 server=local.server;
 const results=await testNative(engine,local.url,model);
 console.log('M242_ACTUAL_NATIVE_ABI_PASS',JSON.stringify({
  engine,realNativeCalls:results.length,originalP94WorkerUnmodified:true,
  originalModelPrivateOwnerNotUsed:true,realCAllocatorStateObserved:false,
  permanentWebkitFix:false,familyAlphaHold:true,releaseAuthorized:false}));
}finally{
 if(server)await new Promise(ok=>server.close(ok));
 await rm(TEMP,{force:true});
}
