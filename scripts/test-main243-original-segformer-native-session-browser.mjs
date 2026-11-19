/**
 * M243 original public pinned SegFormer ONNX model graph native session witness.
 * The consumer P94 Worker and original photo/owner journey are NOT replaced.
 * No successful segmentation, garment proposal, or WebKit repair is inferred
 * from model SESSION creation alone.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {auditCurrentOriginal,downloadAttestedModel,MODEL_REVISION} from './main243-original-segformer-native-abi.mjs';

const engine=process.env.M243_ENGINE||'webkit';
const arm=process.env.M243_PATTERN_ARM||'baseline';
assert.ok(['webkit','chromium'].includes(engine),'Only real native browser engines');
assert.ok(['baseline','pattern_off'].includes(arm),'Only original options versus one supported pattern-off arm');
const ROOT=process.cwd(),DIST=resolve(ROOT,'node_modules/onnxruntime-web/dist');
const TEMP=join(DIST,'ort.m243.original-graph.wasm.mjs');
const {source,derived}=await auditCurrentOriginal();
assert.equal(derived.audit.CAllocatorStateObserved,false);
console.log('M243_EXACT_SOURCE',JSON.stringify({...derived.audit,engine,arm,
 fullOriginalOwnerJourney:false,originalSegFormerGraph:true}));
if(process.env.M243_SOURCE_ONLY==='1')process.exit(0);
const model=await downloadAttestedModel();
console.log('M243_PINNED_PUBLIC_GRAPH',JSON.stringify(model.source));

async function serveLocal(){
 const srv=createServer(async(req,res)=>{
  try{
   const requested=decodeURIComponent((req.url||'/').split('?')[0]);
   res.setHeader('Cross-Origin-Opener-Policy','same-origin');
   res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
   if(requested==='/'){
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end('<!doctype html><title>M243 public ONNX session only</title>');return;
   }
   if(requested==='/pinned-public-onnx'){
    res.setHeader('Content-Type','application/octet-stream');res.end(model.bytes);return;
   }
   if(!requested.startsWith('/ort/')){res.statusCode=404;res.end();return;}
   const path=resolve(DIST,requested.slice(5));
   if(!path.startsWith(DIST+sep)){res.statusCode=403;res.end();return;}
   res.setHeader('Content-Type',path.endsWith('.wasm')?'application/wasm':'text/javascript; charset=utf-8');
   res.end(await readFile(path));
  }catch{res.statusCode=404;res.end();}
 });
 await new Promise((ok,reject)=>srv.once('error',reject).listen(0,'127.0.0.1',ok));
 return {srv,url:'http://127.0.0.1:'+srv.address().port};
}
let srv;
try{
 await writeFile(TEMP,derived.content,{flag:'wx'});
 const served=await serveLocal();srv=served.srv;
 const {chromium,webkit}=await import('playwright');
 const browser=await ({chromium,webkit}[engine]).launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:800}});
  try{
   const page=await context.newPage();
   await page.goto(served.url,{waitUntil:'load',timeout:30000});
   const collect=page.evaluate(async desired=>{
    globalThis.__m243MemoryTargets=[];
    globalThis.__m243GrowCalls=0;
    globalThis.__m242OrtAbiCalls=[];
    globalThis.__m243SessionCalls=[];
    const original=WebAssembly.Memory.prototype.grow;
    WebAssembly.Memory.prototype.grow=function(...args){
     try{
      if(this instanceof WebAssembly.Memory){
       let item=globalThis.__m243MemoryTargets.find(x=>x.memory===this);
       if(!item&&globalThis.__m243MemoryTargets.length<16){
        item={memory:this,first:Math.floor(this.buffer.byteLength/65536)};
        globalThis.__m243MemoryTargets.push(item);
       }
      }
     }catch{}
     globalThis.__m243GrowCalls=Math.min(100000,globalThis.__m243GrowCalls+1);
     return Reflect.apply(original,this,args);
    };
    let session=null,success=false,stage='import',errorClass=null;
    try{
     const ort=await import('/ort/ort.m243.original-graph.wasm.mjs');
     ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;ort.env.wasm.wasmPaths='/ort/';
     stage='native_model_session';
     session=await ort.InferenceSession.create('/pinned-public-onnx',{
      executionProviders:['wasm'],enableMemPattern:desired,
      enableCpuMemArena:true,graphOptimizationLevel:'basic'});
     success=session.inputNames.length>0&&session.outputNames.length>0;
     if(!success)throw new Error('original graph did not create input/output bindings');
     stage='model_session_complete';
    }catch(error){
     errorClass=['RuntimeError','RangeError','TypeError','Error','CompileError','LinkError'].includes(error?.name)?error.name:'other';
    }finally{
     if(session)await session.release();
     WebAssembly.Memory.prototype.grow=original;
    }
    const refs=globalThis.__m243MemoryTargets;
    let heapPages=0;
    for(const x of refs)try{heapPages=Math.max(heapPages,Math.floor(x.memory.buffer.byteLength/65536));}catch{}
    return {
     success,stage,errorClass,apiCalls:globalThis.__m242OrtAbiCalls.map(x=>({
      memPatternFlag:x.memPatternFlag,arenaFlag:x.arenaFlag,actualCall:x.actualCall,
      handleReturned:x.handleReturned,argCount:x.argCount})),
     nativeCalls:globalThis.__m243SessionCalls.map(x=>({...x})),
     grownMemoryTargetCount:refs.length,firstHeapPages:refs.length?refs[0].first:null,
     finalHeapPages:heapPages,jsGrowCalls:globalThis.__m243GrowCalls
    };
   },arm!=='pattern_off');
   // Browser could hard-lock its JS thread while WASM is synchronous. A Node
   // guard is independent and must leave the real original session RED.
   const data=await Promise.race([collect,new Promise((_,reject)=>setTimeout(
    ()=>reject(new Error('M243 ORIGINAL MODEL SESSION TIMEOUT / preserve RED')),300000))]);
   const receipt={engine,arm,modelRevision:MODEL_REVISION,
    originalGraphSha256:model.source.sha256,originalModelBytes:model.source.bytes,
    ...data,originalPublicGraph:true,installedConsumerWorkerUnchanged:true,
    originalOwnerPhotoJourneyNotRun:true,CAllocatorStateObserved:false,
    permanentWebkitFixClaim:false,releaseAuthorized:false,familyAlphaHold:true};
   console.log('M243_REAL_ORIGINAL_SEGFORMER_NATIVE_SESSION',JSON.stringify(receipt));
   assert.equal(data.success,true,'Original pinned SegFormer WASM model session failed, preserve genuine RED');
   assert.equal(data.apiCalls.length,1,'Original SegFormer option native export missing');
   assert.equal(data.apiCalls[0].memPatternFlag,arm!=='pattern_off','Actual pinned ABI pattern value does not match desired');
   assert.equal(data.apiCalls[0].arenaFlag,true,'Original CPU arena changed');
   assert.equal(data.apiCalls[0].handleReturned,true,'Original options handle missing');
   assert.equal(data.nativeCalls.length,1,'Original pinned native model-session creation call absent');
   assert.equal(data.nativeCalls[0].actualNativeExportCalled,true);
   assert.ok(data.nativeCalls[0].returnedHandle,'Original native model session failed to return handle');
   assert.ok(data.grownMemoryTargetCount>0&&data.jsGrowCalls>0,
    'Original real ORT linear-memory JS grow target was not observed');
  }finally{await context.close();}
 }finally{await browser.close();}
}finally{
 if(srv)await new Promise(ok=>srv.close(ok));
 await rm(TEMP,{force:true});
}
