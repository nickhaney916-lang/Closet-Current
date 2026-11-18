/**
 * M214: run the ORIGINAL P94 genuine browser acceptance with read-only
 * worker-message metadata probes. Do not replace Worker, WASM, model, image,
 * inference, normal UI or the original assertion that cards must be > 0.
 * This script reads the immutable source, instruments only scalar observations,
 * and still exits nonzero when actual recognition fails.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

/** Assignment #101: disposable real P94 model-init stages, NO product Worker mutation. */
const originalPath='scripts/test-parallel94-native-p88-browser.mjs';
const original=await readFile(originalPath,'utf8');
const expectedSource='4f75a40cf153fa4b4d139d782b202dbe7bc55e41';
const cacheMode=process.env.P101_CACHE_MODE||'baseline';
assert.ok(['baseline','browser_off'].includes(cacheMode),'P101 only two v3.8.1-supported browser-cache modes');
const faultMode=process.env.P101_TEST_FAULT||'none';
assert.ok(['none','model_weights_abort'].includes(faultMode),'P101 fail-closed controlled model negative mode');
// M216: original test script's static M58 receipt names the OLD P94 worker.
// Assert exact real source Git blobs and correct only that diagnostic receipt in
// a disposable copy. All original substantive assertions remain unchanged.
const gitBlobSHA=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const originalBytes=Buffer.from(original,'utf8');
const workerBytes=await readFile('public/outfit-worker-p94.mjs');
assert.equal(gitBlobSHA(originalBytes),expectedSource,'original P94 browser test changed');
const testedWorkerSHA='d66651b616de54c51eb7ef986324b30f1580888f';
assert.equal(gitBlobSHA(workerBytes),testedWorkerSHA,'M216 tested P94 worker source changed');
const oldWorkerLabel="actualWorkerSourceBlob:'ab7d3837139c5b7d693383f9d6617e199ec8de4f'";
const currentWorkerLabel="actualWorkerSourceBlob:'parallel101-init-stage-instrumented-from-"+testedWorkerSHA+"'";
assert.equal(original.split(oldWorkerLabel).length,2,'original source receipt changed');
const stageInstall=" await context.route('**/*',route=>{";
const probeBefore=" assert.ok(state.cards>0&&state.cards<=12,\n";
assert.equal(original.split(stageInstall).length,2,'original browser route prelude changed');
assert.equal(original.split(probeBefore).length,2,'original fail-closed P94 assertion changed');

const init=[
 "  // M214: attach a passive metadata-only listener to the REAL P94 Worker.",
 "  await context.addInitScript(() => {",
 "   window.__m214WorkerMessages=[];",
 "   const NativeWorker=window.Worker;",
 "   window.Worker=class extends NativeWorker {",
 "    constructor(url,opts) {",
 "     super(url,opts);",
 "     let path='';",
 "     try {path=new URL(String(url),location.href).pathname;} catch {}",
 "     if(path!=='/public/outfit-worker-p94.mjs')return;",
 "     const record=(type,data)=>{",
 "      const safe=data&&typeof data==='object'?data:{};",
 "      const events=window.__m214WorkerMessages;",
 "      if(type==='progress'&&events.at(-1)?.type==='progress'&&events.at(-1)?.phase===safe.phase)return;",
 "      if(events.length>=40)events.shift();",
 "      events.push({",
 "       type,phase:typeof safe.phase==='string'?safe.phase.slice(0,32):null,",
 "       reason:typeof safe.reason==='string'?safe.reason.slice(0,40):null,",
 "       count:Number.isInteger(safe.count)?safe.count:null,",
 "       groups:Number.isInteger(safe.segmentationGroups)?safe.segmentationGroups:null,",
 "       personDetected:typeof safe.personDetected==='boolean'?safe.personDetected:null,",
 "       outcome:['start','ok','error'].includes(safe.outcome)?safe.outcome:null,",
 "       elapsedMs:Number.isFinite(safe.elapsedMs)?Math.max(0,Math.min(600000,Math.round(safe.elapsedMs))):null,",
 "       errorCategory:['abort','network','memory','wasm_or_session','type','other'].includes(safe.errorCategory)?safe.errorCategory:null,",
 "       errorName:['Error','TypeError','RangeError','RuntimeError','AbortError','NetworkError','CompileError','LinkError','AggregateError','other'].includes(safe.errorName)?safe.errorName:null,",
 "       messageCode:['memory_allocation','wasm_compile','wasm_link','ort_session','cache_storage','network_stream','wasm_runtime','model_graph','resource','other'].includes(safe.messageCode)?safe.messageCode:null,",
 "       hasCause:safe.hasCause===true,",
 "       errorType:['string','object','undefined','number','boolean','null','other'].includes(safe.errorType)?safe.errorType:null,",
 "       errorTag:['Error','DOMException','TypeError','Event','String','Object','Undefined','Null','other'].includes(safe.errorTag)?safe.errorTag:null,",
 "       hookCount:Number.isInteger(safe.hookCount)&&safe.hookCount>=0&&safe.hookCount<=4?safe.hookCount:null,",
 "       stageOnly:true,",
 "      });",
 "     };",
 "     this.addEventListener('message',event=>{",
 "      const d=event.data||{};",
 "      if(['progress','piece','done','error','diagnostic'].includes(d.type))record(d.type,d);",
 "     });",
 "     this.addEventListener('error',()=>record('worker-error',null));",
 "     this.addEventListener('messageerror',()=>record('message-error',null));",
 "    }",
 "   };",
 "  });",
].join('\n')+'\n';
const output=[
 "  // M214: this is native original model evidence, not a success override.",
 "  // Never persist Worker piece buffers, photos, mask pixels, owner tokens or URLs.",
 "  const m214=await page.evaluate(()=>({",
 "   messages:window.__m214WorkerMessages||[],",
 "   status:document.getElementById('multi24Status')?.textContent||'',",
 "   cards:document.querySelectorAll('#multi24Grid .multi24-card').length,",
 "   active:window.multi24Research?.active===true,",
 "   working:!!window.multi24Research?.debug()?.working",
 "  }));",
 "  const evidence={",
 "   schema:'M214_P94_REAL_WEBKIT_REASON/v1',engine,width,attempt:process.env.M214_ATTEMPT||'one',",
 "   originalScriptBlob:process.env.M214_ORIGINAL_SCRIPT_BLOB||'4f75a40cf153fa4b4d139d782b202dbe7bc55e41',",
 "   realWorkerSource:'/public/outfit-worker-p94.mjs',",
 "   realModelAttempted:external.some(x=>x.type==='pinned-model-hub'),",
 "   networkStatusCounts:Object.fromEntries([...new Set(modelResponses.map(x=>x.status))]",
 "    .map(code=>[code,modelResponses.filter(x=>x.status===code).length])),",
 "   rejectedRequestCount:rejected.length,pageErrorCount:issues.length,",
 "   status:m214.status,cards:m214.cards,workerEvents:m214.messages,",
 "   actualWorkerSeen:actualWorkerPaths94.includes('/public/outfit-worker-p94.mjs'),",
 "   success:m214.cards>0&&m214.cards<=12,",
 "   releaseAuthorized:false,physicalPhone:false,hostedRLS:false",
 "  };",
 "  await writeFile(join(out,'M214-P94-BOUNDED-WORKER-OUTCOME-'+(process.env.M214_ATTEMPT||'one')+'.json'),",
 "   JSON.stringify(evidence,null,2)+'\\n');",
 "  console.log('M214_REAL_P94_WORKER_OUTCOME',JSON.stringify({...evidence,probeOnly:true,modelOriginal:true,workerInitializationInstrumented:true,cacheMode:process.env.P101_CACHE_MODE||'baseline'}));",
 "  assert.ok(evidence.workerEvents.some(e=>e.type==='diagnostic'),'P101 missing genuine Worker model-init stage messages; no genuine model evidence');",
"  // DETERMINISTIC NEGATIVE ONLY: real public ONNX download is actively aborted.",
"  // This is NEVER counted as a positive model/owner success or a product fix.",
"  if(process.env.P101_TEST_FAULT==='model_weights_abort'){",
"   assert.ok(p101BlockedModelWeightRequests>=1&&p101BlockedModelWeightRequests<=3,'P101 public ONNX abort was never exercised');",
"   assert.equal(state.cards,0,'P101 negative must not invent positive review cards');",
"   assert.equal(state.debug.sourceSHA256,sha,'P101 abort must preserve original owner photo proof');",
"   assert.equal(state.debug.working,false,'P101 aborted model did not settle');",
"   assert.match(state.status,/Automatic extraction unavailable/,'P101 must show explicit manual fallback');",
"   assert.ok(evidence.workerEvents.some(e=>e.type==='error'&&e.reason==='P94_model_load'),'P101 aborted model did not fail in genuine model load');",
"   assert.equal(await countRows(page),0,'P101 aborted model silently saved a garment');",
"   assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isDisabled(),true,'P101 abort must disable confirmation save');",
"   assert.ok(evidence.actualWorkerSeen,'P101 negative bypassed the real P94 native Worker');",
"   console.log('P101_CONTROLLED_PUBLIC_ONNX_ABORT_FALLBACK_PASS',JSON.stringify({engine,width,abortCount:p101BlockedModelWeightRequests,cards:state.cards,modelFailed:true,originalSHAUnchanged:true,manualOnly:true,privateSaved:0,notPositiveAcceptance:true}));",
"   await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));process.exit(0);",
"  }",
].join('\n')+'\n';
// #101 only: instrument real pinned ONNX pipeline in local disposable Worker.
// No model, mask, source, owner, auth or saved data is substituted.
const originalRead="  const body=await readFile(absolute);";
const originalNetworkCounters="const external=[],rejected=[],issues=[],modelResponses=[];";
assert.equal(original.split(originalNetworkCounters).length,2,'original network counter prelude moved');
const negativeNetworkCounters=originalNetworkCounters+'\nlet p101BlockedModelWeightRequests=0;';
const originalModelAllowed="  if(req.method()==='GET'&&(lib||hub||weights)){";
assert.equal(original.split(originalModelAllowed).length,2,'pinned original model asset policy moved');
const negativeRouteAllowed=originalModelAllowed+
 "\n    if(process.env.P101_TEST_FAULT==='model_weights_abort'&&hub&&url.pathname.endsWith('.onnx')){"+
 "\n     p101BlockedModelWeightRequests++;return route.abort();"+
 "\n    }";

assert.equal(original.split(originalRead).length,2,'original fixture route moved');
const workerSource=workerBytes.toString('utf8');
let diagWorker="const p101Classify=error=>{\n const name=typeof error?.name==='string'?error.name:'';\n const msg=p101ExceptionText(error).toLowerCase();\n if(name==='AbortError'||/abort|cancelled/.test(msg))return 'abort';\n if(/out of memory|memory access|allocation failed/.test(msg))return 'memory';\n if(/webassembly|wasm|onnx|execution provider|session/.test(msg))return 'wasm_or_session';\n if(name==='NetworkError'||/fetch|network|timeout|failed to load/.test(msg))return 'network';\n if(name==='TypeError')return 'type';\n return 'other';\n};\nconst p101ErrorName=error=>{\n const name=typeof error?.name==='string'?error.name:'';\n return ['Error','TypeError','RangeError','RuntimeError','AbortError','NetworkError','CompileError','LinkError','AggregateError'].includes(name)?name:'other';\n};\nconst p101ErrorCode=error=>{\n const msg=p101ExceptionText(error).toLowerCase();\n if(/out of memory|allocat|memory limit/.test(msg))return 'memory_allocation';\n if(/compile|compilation|unexpected section/.test(msg))return 'wasm_compile';\n if(/linkerror|linking|imported function/.test(msg))return 'wasm_link';\n if(/session|execution provider|ep init|inference session/.test(msg))return 'ort_session';\n if(/cache|quota|indexeddb|storage/.test(msg))return 'cache_storage';\n if(/stream|fetch|network|body|unexpected end|eof/.test(msg))return 'network_stream';\n if(/webassembly|wasm|runtimeerror/.test(msg))return 'wasm_runtime';\n if(/onnx|model graph|tensor|node/.test(msg))return 'model_graph';\n if(/resource|worker|initialize|unavailable|failed to load/.test(msg))return 'resource';\n return 'other';\n};"+'\n'+`const p101CacheMode=${JSON.stringify(cacheMode)};`+'\n'+"const p101ExceptionText=e=>typeof e==='string'?e:(typeof e?.message==='string'?e.message:'');\nconst p101ErrorType=e=>e===null?'null':(['string','object','undefined','number','boolean'].includes(typeof e)?typeof e:'other');\nconst p101ErrorTag=e=>{const t=Object.prototype.toString.call(e);return ['[object Error]','[object DOMException]','[object TypeError]','[object Event]','[object String]','[object Object]','[object Undefined]','[object Null]'].includes(t)?t.slice(8,-1):'other';};\nconst p101WasmProbe=(id)=>{\n const phases=['compile','compileStreaming','instantiate','instantiateStreaming'];\n let installed=0;\n for(const method of phases){\n  const original=WebAssembly[method];\n  if(typeof original!=='function')continue;\n  const phase='wasm_'+method;\n  try{WebAssembly[method]=function(...args){\n   const at=performance.now();\n   const send=(outcome,error)=>self.postMessage({type:'diagnostic',id,phase,outcome,elapsedMs:outcome==='start'?null:Math.max(0,Math.min(600000,Math.round(performance.now()-at))),\n    ...(error?{errorCategory:(p101Classify(error)),errorName:p101ErrorName(error),messageCode:p101ErrorCode(error),errorType:p101ErrorType(error),errorTag:p101ErrorTag(error)}:{})});\n   send('start');\n   try{const result=Reflect.apply(original,WebAssembly,args);\n    if(result&&typeof result.then==='function'){result.then(()=>{send('ok');},error=>{send('error',error);});return result;}\n    send('ok');return result;\n   }catch(error){send('error',error);throw error;}\n  };installed++;}catch{}\n }\n self.postMessage({type:'diagnostic',id,phase:'wasm_hook_install',outcome:'ok',hookCount:installed});\n};"+'\n'+workerSource;
const p101Patches=[["  const {AutoModelForSemanticSegmentation,AutoProcessor,RawImage,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');","  let imported;\n  {const at=performance.now();\n   self.postMessage({type:'diagnostic',id:requestId,phase:'module_import',outcome:'start'});\n   try { imported=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js'); self.postMessage({type:'diagnostic',id:requestId,phase:'module_import',outcome:'ok',elapsedMs:Math.max(0,Math.min(600000,Math.round(performance.now()-at)))}); }\n   catch(error) { self.postMessage({type:'diagnostic',id:requestId,phase:'module_import',outcome:'error',elapsedMs:Math.max(0,Math.min(600000,Math.round(performance.now()-at))),errorCategory:p101Classify(error)}); throw error; }\n  }\n  const {AutoModelForSemanticSegmentation,AutoProcessor,RawImage,env}=imported;"],["  const processor=await AutoProcessor.from_pretrained(modelId,{revision});","  let processor;\n  { const at=performance.now();\n   self.postMessage({type:'diagnostic',id:requestId,phase:'processor_load',outcome:'start'});\n   try {   processor=await AutoProcessor.from_pretrained(modelId,{revision}); self.postMessage({type:'diagnostic',id:requestId,phase:'processor_load',outcome:'ok',elapsedMs:Math.max(0,Math.min(600000,Math.round(performance.now()-at)))}); }\n   catch(error) { self.postMessage({type:'diagnostic',id:requestId,phase:'processor_load',outcome:'error',elapsedMs:Math.max(0,Math.min(600000,Math.round(performance.now()-at))),errorCategory:p101Classify(error)}); throw error; }\n  }"],["  const model=await AutoModelForSemanticSegmentation.from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',progress_callback:event=>self.postMessage({type:'progress',id:requestId,phase:'loading',percent:String(event.file||'').endsWith('.onnx')&&Number.isFinite(event.progress)?Math.round(event.progress):null})});","  let model;\n  { const at=performance.now();\n   self.postMessage({type:'diagnostic',id:requestId,phase:'model_session_load',outcome:'start'});\n   try {   model=await AutoModelForSemanticSegmentation.from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',progress_callback:event=>self.postMessage({type:'progress',id:requestId,phase:'loading',percent:String(event.file||'').endsWith('.onnx')&&Number.isFinite(event.progress)?Math.round(event.progress):null})}); self.postMessage({type:'diagnostic',id:requestId,phase:'model_session_load',outcome:'ok',elapsedMs:Math.max(0,Math.min(600000,Math.round(performance.now()-at)))}); }\n   catch(error) { self.postMessage({type:'diagnostic',id:requestId,phase:'model_session_load',outcome:'error',elapsedMs:Math.max(0,Math.min(600000,Math.round(performance.now()-at))),errorCategory:p101Classify(error)}); throw error; }\n  }"],["  const output=await model(await processor(image));","  let output;\n  { const at=performance.now();\n   self.postMessage({type:'diagnostic',id:request.id,phase:'first_inference',outcome:'start'});\n   try {   output=await model(await processor(image)); self.postMessage({type:'diagnostic',id:request.id,phase:'first_inference',outcome:'ok',elapsedMs:Math.max(0,Math.min(600000,Math.round(performance.now()-at)))}); }\n   catch(error) { self.postMessage({type:'diagnostic',id:request.id,phase:'first_inference',outcome:'error',elapsedMs:Math.max(0,Math.min(600000,Math.round(performance.now()-at))),errorCategory:p101Classify(error)}); throw error; }\n  }"]];
// Cache controls alter only the disposable worker setup, not the model/source/owner journey.
const cacheConfig="env.allowLocalModels=false;env.useBrowserCache=true;env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;";
assert.equal(diagWorker.split(cacheConfig).length,2,'original cache/worker setup moved');
diagWorker=diagWorker.replace(cacheConfig,"env.allowLocalModels=false;env.useBrowserCache=p101CacheMode!=='browser_off';env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;");
for(const [needle,replacement] of p101Patches){
 assert.equal(diagWorker.split(needle).length,2,'P101 pinned model stage source moved');
 diagWorker=diagWorker.replace(needle,replacement);
}
// Install native, pass-through WebAssembly API probes only around the real
// underlying model/session creation. Never read WASM buffers or ONNX weights.
const p101ModelAnchor="  { const at=performance.now();\n   self.postMessage({type:'diagnostic',id:requestId,phase:'model_session_load',outcome:'start'});";
assert.equal(diagWorker.split(p101ModelAnchor).length,2,'model start stage moved');
diagWorker=diagWorker.replace(p101ModelAnchor, '  p101WasmProbe(requestId);\n'+p101ModelAnchor);
// Error diagnostics are allowlisted scalar classes only, never exception text or source paths.
const originalErrorSnippet='errorCategory:p101Classify(error)';
assert.equal(diagWorker.split(originalErrorSnippet).length,5,'four native stage catches moved');
diagWorker=diagWorker.replaceAll(originalErrorSnippet,
 'errorCategory:p101Classify(error),errorName:p101ErrorName(error),messageCode:p101ErrorCode(error),errorType:p101ErrorType(error),errorTag:p101ErrorTag(error),hasCause:!!error?.cause');
const overrideRead="  const body=path==='/public/outfit-worker-p94.mjs'?Buffer.from("+JSON.stringify(diagWorker)+",'utf8'):await readFile(absolute);";
const originalZero='(/unverified region|Automatic extraction unavailable|could not start|timed out/i.test(';
assert.equal(original.split(originalZero).length,2,'original wait moved');
const zeroAwareOriginal=original.replace(originalZero,'(/unverified (?:garment )?region|Automatic extraction unavailable|could not start|timed out/i.test(');
const originalWithNegative=zeroAwareOriginal.replace(originalNetworkCounters,negativeNetworkCounters)
 .replace(originalModelAllowed,negativeRouteAllowed);
const adapted=originalWithNegative.replace(originalRead,overrideRead)
 .replace(stageInstall,init+stageInstall).replace(probeBefore,output+probeBefore)
 .replace(oldWorkerLabel,currentWorkerLabel);
assert.ok(adapted.includes('Genuine P88 browser worker did not produce a bounded actual model proposal'));
assert.equal(adapted.split('M214_REAL_P94_WORKER_OUTCOME').length,2);
assert.ok(adapted.includes('Genuine P88 browser worker did not produce a bounded actual model proposal'));
assert.equal(adapted.split('M214_REAL_P94_WORKER_OUTCOME').length,2);
const temp=resolve('scripts/.parallel101-real-model-stage-probe.mjs');
const engine=process.env.M58_ENGINE||'webkit';
const width=process.env.P94_WIDTH||'430';
assert.ok(['chromium','webkit'].includes(engine));
assert.ok(['320','390','430'].includes(width));
try {
 await writeFile(temp,adapted,{flag:'wx'});
 const run=spawnSync(process.execPath,[temp],{
  env:{...process.env,M58_ENGINE:engine,P94_WIDTH:width,M214_ORIGINAL_SCRIPT_BLOB:expectedSource},
  stdio:'inherit',timeout:18*60*1000
 });
 if(run.error)throw run.error;
 assert.equal(run.status,0,
  'P101 true P94 model/owner failure; preserve RED and bounded stage metadata');
} finally {await rm(temp,{force:true});}
