/**
 * M1585 first-attempt original P94 Worker, single-Inspector-frontend browser.
 * Genuine WebKit 26.0 and original, SHA-pinned module Worker + licensed
 * repository JPEG. Unlike M1541 this executes NO synthetic WASM probe.
 *
 * It is a first-step interface smoke: absence of independent pinned model
 * weights/native ABI receipt means neither a Worker exception nor success can
 * be labeled a genuine original OrtCreateSession RED or a native causal fix.
 * No Playwright-controlled page, credentials, private images, or app edits.
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve,extname } from 'node:path';
import { spawn } from 'node:child_process';
import { webkit } from 'playwright';
import { classifyPinnedWorkerExceptionPause, classifyPinnedJscFastMemoryDump } from './m1585-original-worker-evidence-contract.mjs';
// Keep the M289 Inspector helper owner untouched: this branch is stacked on
// M287 (which does NOT contain M289). Use its source-verified, small grammar.
function parseLocalInspectorPaths(markup) {
 if(typeof markup!=='string'||markup.length>65536)throw Error('invalid inspector listing');
 const matches=[...markup.matchAll(/['"](\/socket\/([0-9]{1,18})\/([0-9]{1,18})\/([a-zA-Z][a-zA-Z0-9_-]{0,47}))['"]/g)];
 const out=[];
 for(const m of matches){
  const left=Number(m[2]),right=Number(m[3]);
  if(!Number.isSafeInteger(left)||left<1||!Number.isSafeInteger(right)||right<1)continue;
  if(!out.includes(m[1]))out.push(m[1]);
  if(out.length===10)break;
 }
 return out;
}

const bounded = (v, max=128) => typeof v==='string'&&v.length>0&&v.length<=max &&
  ![...v].some(c=>c.charCodeAt(0)<32||c.charCodeAt(0)===127);
const sha256 = v => createHash('sha256').update(v).digest('hex');
const wait = ms=>new Promise(r=>setTimeout(r,ms));
// Research-only instrumentation executed in the paused dedicated Worker before
// initialization; preserves native return values but perturbs timing.
const workerAttestationPrelude="(()=>{\n const g=globalThis;\n if(g.__ccM1585Attestation)return 'ALREADY_ARMED';\n const expectedWasm=21596019, expectedModel=15199746;\n const p={wasm:{count:0,sha256:null,bytes:null,instantiated:false,errors:0},\n   model:{copyCount:0,sha256:null,bytes:null,copyOffset:null,hashErrors:0}};\n const hash=async bytes=>{\n   const digest=await crypto.subtle.digest('SHA-256',bytes);\n   return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');\n };\n const proof=(bytes,kind,operation)=>{\n   if(bytes?.byteLength!==(kind==='wasm'?expectedWasm:expectedModel))return;\n   try{\n     const copy=new Uint8Array(bytes);\n     if(kind==='wasm'){\n       p.wasm.count++;p.wasm.bytes=copy.byteLength;\n       hash(copy).then(s=>{p.wasm.sha256=s;p.wasm.instantiated=true;},\n         ()=>{p.wasm.errors++});\n     }else{\n       p.model.bytes=copy.byteLength;\n       hash(copy).then(s=>{p.model.sha256=s;},()=>{p.model.hashErrors++});\n     }\n   }catch{if(kind==='wasm')p.wasm.errors++;else p.model.hashErrors++}\n };\n const W=WebAssembly, inst=W.instantiate, stream=W.instantiateStreaming;\n W.instantiate=function(input,...rest){\n   const result=Reflect.apply(inst,W,[input,...rest]);\n   if(input instanceof ArrayBuffer||ArrayBuffer.isView(input)){\n     Promise.resolve(result).then(()=>proof(input,'wasm','instantiate'),()=>{});\n   }\n   return result;\n };\n if(typeof stream==='function')W.instantiateStreaming=function(input,...rest){\n   let captured;\n   const forwarded=Promise.resolve(input).then(response=>{\n     try{captured=response.clone().arrayBuffer()}catch{}\n     return response;\n   });\n   const native=Reflect.apply(stream,W,[forwarded,...rest]);\n   forwarded.then(()=>Promise.resolve(native).then(()=>\n     captured?.then(bytes=>proof(bytes,'wasm','instantiateStreaming')).catch(()=>{}),()=>{})).catch(()=>{});\n   return native;\n };\n const set=Uint8Array.prototype.set;\n Uint8Array.prototype.set=function(...args){\n   const source=args[0],offset=args[1]===undefined?0:args[1];\n   const interested=source?.byteLength===expectedModel&&this instanceof Uint8Array;\n   let copy;\n   if(interested&&p.model.copyCount<3)try{copy=new Uint8Array(source)}catch{}\n   const result=Reflect.apply(set,this,args);\n   if(interested){\n     p.model.copyCount++;\n     if(Number.isSafeInteger(offset)&&offset>=0)p.model.copyOffset=offset;\n     if(copy)proof(copy,'model','Uint8Array.set');\n   }\n   return result;\n };\n g.__ccM1585Attestation={snapshot:()=>({\n   wasm:{...p.wasm},model:{...p.model},expectedWasm,expectedModel,\n   instrumentation:'research-JS-proxy-not-native-proof'\n })};\n return 'M1585_ATTESTATION_ARMED';\n})()";
const branch = 'research/main1054-m1585-original-worker-evidence-contract-HOLD';
// Both profiles use a genuine single-front-end Inspector; only the JS proxy differs.
const workerProfile=process.env.M1585_WORKER_PROFILE||'instrumented';
// Source: WebKit r2215 OptionsList.h / Options.cpp. This changes only the
// original browser process' documented WASM fast-memory strategy, not a
// security or sandbox setting, not the shipped Worker/ONNX/JSEP.
const jscMemoryMode=process.env.M1585_JSC_MEMORY_MODE||'default';
const source = readFileSync('public/outfit-worker-p94.mjs');
const img = readFileSync('benchmark/fixtures/commons-0003.jpg');
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
if (source.length!==5778 || source.toString('utf8').includes('M1585') ||
    !locked?.verified || locked.sha256!==sha256(img) ||
    img[0]!==255 || img[1]!==216) throw Error('original P94 source or public JPEG differs');
const receipt={
 schema:'M1585_ORIGINAL_P94_SINGLE_FRONTEND_WEBKIT_V1',
 branch,engine:'webkit',browserBuild:'Playwright-1.56.1-WebKit-26.0',
 cohortOrdinal:Number(process.env.M1585_COHORT_ORDINAL||1),workerProfile,jscMemoryMode,
 jscOptionDumpObserved:false,jscFastMemoryOption:null,
 jscModeSource:'WEBKIT_R2215_OPTION_DUMP',jscNativeAllocationModeProven:false,
 jscWasmJitCodeOriginProven:false,
 originalFirstAttempt:true,
 originalWorkerExpectedBlob:'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 sourceJpegSha256:locked.sha256,sourceJpegBytes:img.length,
 originalModelId:'Xenova/segformer_b0_clothes',
 originalModelRevision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',
 workerSourceIsOriginalP94:true,inspectorFrontendCount:1,
 nativeDebuggerAttached:false,originalModelWeightsShaVerified:false,
 sameProcessOriginalJsepShaVerified:false,
 originalModelExecutedAndVerified:false,originalModelRedObserved:false,
 instrumentedWorkerForAttribution:workerProfile==='instrumented',workerAttestationProbeArmed:false,
 expectedPinnedModelOnnxSha256:'02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3',
 sameWorkerModelCopySha256:null,sameWorkerModelCopyBytes:null,
 sameWorkerModelCopyCount:0,sameWorkerModelCopyOffset:null,
 sameWorkerJsepInstantiatedSha256:null,sameWorkerJsepInstantiatedBytes:null,
 sameWorkerJsepShaMatchesPin:false,attestationObservationComplete:false,
 nativeTrapPc:null,wasmFileOffset:null,originalCxxStatement:null,
 causalFixProven:false,releaseAllowed:false,familyAlpha:'HOLD',
 webkitInspectorOpen:false,pageTargetDiscovered:false,
 originalWorkerCreated:false,workerDebuggerReady:false,
 workerRuntimeReady:false,workerBreakpointsActive:false,
 workerInitialized:false,workerIdDigestPresent:false,workerIdDigest:null,
 workerExceptionPauses:0,workerResumeAcknowledgements:0,
 workerResumedEvents:0,workerPauseReasons:[],workerInspectorJsLocations:[],
 workerPauseEventWorkerDigest:null,
 workerThrownObjectCategories:[],workerNativeBoundsTextPauseCount:0,
 workerRuntimeErrorTextPauseCount:0,workerThrownValueIsNativePc:false,
 workerInspectorJsLocationIsNativePc:false,
 workerMessageTypes:[],workerTerminal:null,
 browserExitObserved:false,sourceVerifiedInServer:false,publicJpegSubmitted:false,
 outcome:'BLOCKED',blockedReason:null
};
let server,child,socket,target,workerId,workerDigest,wsseq=0;
// Captured transiently ONLY for a strict allowlisted boolean classification;
// never log/store raw stderr, which may contain unrelated process diagnostics.
let jscOptionDump='';
const pageReplies=new Map(), workerReplies=new Map();
let pagePendingSeq=0,workerResumeId=800;
const workerIds=new Map(),outerErrors=[];
const until=async(pred,reason,attempts=48,ms=250)=>{
 for(let i=0;i<attempts;i++){if(pred())return;if(receipt.browserExitObserved)break;await wait(ms)}
 throw Error(reason);
};
const remotePage=(id,method,params={})=>{
 if(!target)throw Error('page target unknown');
 socket.send(JSON.stringify({id:++wsseq,method:'Target.sendMessageToTarget',params:{
  targetId:target,message:JSON.stringify({id,method,params})}}));
};
const remoteWorker=(id,method,params={})=>{
 if(!workerId)throw Error('Worker target unknown');
 remotePage(id+10000,'Worker.sendMessageToWorker',{workerId,
   message:JSON.stringify({id,method,params})});
};
const onMessage=e=>{
 try{
  const msg=JSON.parse(String(e.data).slice(0,32768));
  if(msg.error?.code!==undefined&&outerErrors.length<10)outerErrors.push(msg.error.code);
  if(msg.method==='Target.targetCreated'&&msg.params?.targetInfo?.type==='page'){
   const t=msg.params.targetInfo.targetId;
   if(bounded(t)) {target=t;receipt.pageTargetDiscovered=true}
  }
  if(msg.method!=='Target.dispatchMessageFromTarget')return;
  const p=JSON.parse(String(msg.params?.message||'').slice(0,32768));
  if(Number.isSafeInteger(p.id))pageReplies.set(p.id,p);
  if(p.method==='Worker.workerCreated'){
   const id=p.params?.workerId;
   if(bounded(id,256)){
    if(workerId && workerId!==id)throw Error('more than one Worker observed');
    workerId=id;workerDigest=sha256(id);
    receipt.workerIdDigestPresent=true;receipt.workerIdDigest=workerDigest;receipt.originalWorkerCreated=true;
   }
  }
  if(p.method==='Worker.dispatchMessageFromWorker'&&p.params?.workerId===workerId &&
     typeof p.params.message==='string'){
   const w=JSON.parse(p.params.message.slice(0,32768));
   if(Number.isSafeInteger(w.id)) {
    workerReplies.set(w.id,w);
    if(w.id>800&&w.id<=848&&!w.error)
      receipt.workerResumeAcknowledgements++;
   }
   if(w.method==='Debugger.paused'){
    const reason=w.params?.reason;
    if(['exception','other','debuggerStatement','assert'].includes(reason)&&
       receipt.workerPauseReasons.length<5)receipt.workerPauseReasons.push(reason);
    if(reason==='exception'){
     receipt.workerExceptionPauses++;
     receipt.workerPauseEventWorkerDigest=workerDigest;
     // Source-backed: WebKit Debugger.paused.params.data wraps its actual
     // thrown JS value as Runtime.RemoteObject. This never reveals a native PC.
     const classified=classifyPinnedWorkerExceptionPause(w);
     if(receipt.workerThrownObjectCategories.length<5)
      receipt.workerThrownObjectCategories.push(classified.state);
     if(classified.observedWebAssemblyRuntimeError)
      receipt.workerRuntimeErrorTextPauseCount++;
     if(classified.wasmBoundsMessageObserved)
      receipt.workerNativeBoundsTextPauseCount++;
    }
    // Inspector's top location is Javascript-script metadata, NOT native
    // instruction PC or original WASM file offset (M1541 44/45 control).
    const loc=w.params?.callFrames?.[0]?.location;
    if(receipt.workerInspectorJsLocations.length<5)
     receipt.workerInspectorJsLocations.push({
      line:Number.isSafeInteger(loc?.lineNumber)?loc.lineNumber:null,
      column:Number.isSafeInteger(loc?.columnNumber)?loc.columnNumber:null,
      nativePc:false,wasmFileOffset:null
     });
    if(receipt.workerResumeAcknowledgements<48)
     remoteWorker(++workerResumeId,'Debugger.resume');
   }
   if(w.method==='Debugger.resumed')receipt.workerResumedEvents++;
  }
 }catch{ /* fail closed below: missing required confirmations => BLOCKED */ }
};
const getPage=async(id,method,params={})=>{
 remotePage(id,method,params);
 await until(()=>pageReplies.has(id), 'missing '+method+' page reply');
 if(pageReplies.get(id).error)throw Error(method+' page rejected');
 return pageReplies.get(id).result;
};
const getWorker=async(id,method,params={})=>{
 remoteWorker(id,method,params);
 await until(()=>pageReplies.has(id+10000)&&workerReplies.has(id),
  'missing '+method+' Worker/page dual reply');
 if(pageReplies.get(id+10000).error||workerReplies.get(id).error)
  throw Error(method+' Worker rejected');
 return workerReplies.get(id).result;
};
try {
 if(!['instrumented','no-js-proxy'].includes(workerProfile))
  throw Error('unknown original Worker observation profile');
 if(!['default','explicit-bounds'].includes(jscMemoryMode))
  throw Error('unrecognized JSC bounds mode');
 if(!Number.isSafeInteger(receipt.cohortOrdinal)||receipt.cohortOrdinal<1||receipt.cohortOrdinal>4)
  throw Error('invalid bounded original cohort ordinal');
 const root=resolve('.');
 const allow=new Set([
  '/public/outfit-worker-p94.mjs',
  '/public/outfit-segmentation.mjs',
  '/public/photo-color.js',
  '/benchmark/fixtures/commons-0003.jpg'
 ]);
 server=createServer((req,res)=>{
  try{
   const u=new URL(req.url,'http://localhost');
   if(req.method!=='GET')throw Error('GET only');
   if(u.pathname==='/m1585-page') {
    res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});
    res.end('<!doctype html><html><head><title>M1585 original P94</title></head><body>Public original-model test only</body></html>');
    return;
   }
   if(!allow.has(u.pathname)||u.pathname.includes('..'))throw Error('not an allowed asset');
   const file=resolve(root,'.'+u.pathname);
   if(!file.startsWith(root+'/'))throw Error('outside repository');
   const b=readFileSync(file);
   if(u.pathname==='/public/outfit-worker-p94.mjs' &&
      sha256(b)!==sha256(source))throw Error('P94 byte drift');
   receipt.sourceVerifiedInServer=true;
   res.writeHead(200,{'content-type':extname(file)==='.jpg'?'image/jpeg':'text/javascript',
    'cache-control':'no-store','access-control-allow-origin':'*'});
   res.end(b);
  }catch{
   res.writeHead(404);res.end('not found');
  }
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const exe=webkit.executablePath();
 if(!exe||!exe.startsWith('/'))throw Error('missing pinned WebKit executable');
 // A/B one source-supported JSC engine setting only. The normal default
 // uses upstream compiled defaults; explicit-bounds turns off signal-backed
 // fast WASM memory so JSC must use explicit bounds checks (Options.cpp).
 // Strip inherited JSC_* overrides from the child for a clean baseline.
 const jscEnv={...process.env};
 for(const key of Object.keys(jscEnv))if(key.startsWith('JSC_'))delete jscEnv[key];
 jscEnv.WEBKIT_INSPECTOR_HTTP_SERVER='127.0.0.1:17659';
 jscEnv.JSC_dumpOptions='2'; // observe source-exposed effective options
 if(jscMemoryMode==='explicit-bounds')
  jscEnv.JSC_useWasmFastMemory='false';
 child=spawn(exe,['--headless',base+'/m1585-page'],{
  env:jscEnv,stdio:['ignore','ignore','pipe']
 });
 child.on('exit',()=>{receipt.browserExitObserved=true});
 child.stderr?.on('data',data=>{
  if(jscOptionDump.length<512000)
   jscOptionDump+=String(data).slice(0,512000-jscOptionDump.length);
 });
 let path=null;
 for(let i=0;i<48&&!path&&!receipt.browserExitObserved;i++){
  try{
   const response=await fetch('http://127.0.0.1:17659/',{
    signal:AbortSignal.timeout(350),redirect:'error'});
   if(response.ok)path=parseLocalInspectorPaths(await response.text())
    .find(x=>x.endsWith('/WebPage'));
  }catch{}
  if(!path)await wait(250);
 }
 if(!path||!/^\/socket\/[0-9]{1,18}\/[0-9]{1,18}\/WebPage$/.test(path))
  throw Error('pinned standalone Inspector page path not found');
 socket=new WebSocket('ws://127.0.0.1:17659'+path);
 socket.addEventListener('message',onMessage);
 await new Promise((ok,bad)=>{
  const timeout=setTimeout(()=>bad(Error('Inspector handshake timed out')),5000);
  socket.addEventListener('open',()=>{clearTimeout(timeout);ok()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timeout);bad(Error('Inspector handshake failed'))},{once:true});
 });
 receipt.webkitInspectorOpen=true;
 await until(()=>!!target,'Target.targetCreated page absent');
 await getPage(100,'Runtime.enable');
 await getPage(101,'Worker.enable');
 const arm="(()=>{const w=new Worker("+JSON.stringify(base+'/public/outfit-worker-p94.mjs')+
  ",{type:'module'});window.__p94=w;window.__p94State={ready:true,types:[],terminal:null};"+
  "w.onmessage=e=>{const type=e?.data?.type;const s=window.__p94State;"+
  "if(typeof type==='string'&&s.types.length<32)s.types.push(type);"+
  "if(type==='done'||type==='error')s.terminal=type;};return 'ARMED'})()";
 const start=await getPage(102,'Runtime.evaluate',{expression:arm,returnByValue:true});
 if(start?.result?.value!=='ARMED')throw Error('P94 original Worker did not arm');
 await until(()=>!!workerId,'Worker.workerCreated missing');
 await getWorker(201,'Debugger.enable');
 receipt.workerDebuggerReady=true;
 await getWorker(202,'Runtime.enable');
 receipt.workerRuntimeReady=true;
 await getWorker(203,'Debugger.setPauseOnExceptions',{state:'all'});
 await getWorker(204,'Debugger.setBreakpointsActive',{active:true});
 receipt.workerBreakpointsActive=true;
 // No-JS-proxy controls never evaluate JS in the dedicated original Worker.
 // Inspector itself may still perturb execution timing: not unobserved native proof.
 if(workerProfile==='instrumented'){
  const installed=await getWorker(205,'Runtime.evaluate',{
   expression:workerAttestationPrelude,returnByValue:true});
  if(installed?.result?.value!=='M1585_ATTESTATION_ARMED')
   throw Error('Worker attestation instrumentation not confirmed');
  receipt.workerAttestationProbeArmed=true;
 }
 await getPage(103,'Worker.initialized',{workerId});
 receipt.workerInitialized=true;

 const startWork="(()=>{window.__p94Submission='PENDING';(async()=>{"+
  "const r=await fetch("+JSON.stringify(base+'/benchmark/fixtures/commons-0003.jpg')+
  ",{cache:'no-store'});if(!r.ok)throw Error('public JPEG missing');"+
  "const bytes=new Uint8Array(await r.arrayBuffer());let text='';"+
  "for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));"+
  "window.__p94.postMessage({id:'m1585-original-probe',image:'data:image/jpeg;base64,'+btoa(text)});"+
  "window.__p94Submission=bytes.length===803511?'SUBMITTED':'WRONG_BYTES';"+
  "})().catch(()=>window.__p94Submission='FETCH_FAILED');return 'SCHEDULED'})()";
 const scheduled=await getPage(104,'Runtime.evaluate',{expression:startWork,returnByValue:true});
 if(scheduled?.result?.value!=='SCHEDULED')
  throw Error('original public JPEG submission not scheduled');
 for(let i=0;i<28;i++){
  const state=await getPage(130+i,'Runtime.evaluate',{
    expression:'window.__p94Submission',returnByValue:true});
  if(state?.result?.value==='SUBMITTED'){receipt.publicJpegSubmitted=true;break}
  if(state?.result?.value==='WRONG_BYTES'||state?.result?.value==='FETCH_FAILED')
   throw Error('original public JPEG rejected by fixture submission');
  await wait(250);
 }
 if(!receipt.publicJpegSubmitted)throw Error('original public JPEG submission not confirmed');
 let observed;
 for(let i=0;i<150;i++){
  const r=await getPage(500+i,'Runtime.evaluate',{
   expression:"JSON.stringify(window.__p94State)",returnByValue:true});
  try{observed=JSON.parse(r?.result?.value||'{}')}catch{}
  if(observed?.terminal)break;
  if(receipt.browserExitObserved)break;
  await wait(2000);
 }
 receipt.workerMessageTypes=(observed?.types||[]).filter(x=>
  ['progress','piece','done','error'].includes(x)).slice(0,32);
 receipt.workerTerminal=['done','error'].includes(observed?.terminal)?observed.terminal:null;
 // Read sanitised SHA+byte-count receipts from the SAME dedicated Worker Inspector;
 // no model weights, worker identifier, pixel bytes or stack dump are emitted.
 let attested=null;
 if(workerProfile==='instrumented'){
  for(let i=0;i<36;i++){
   const r=await getWorker(900+i,'Runtime.evaluate',{
    expression:"JSON.stringify(globalThis.__ccM1585Attestation?.snapshot()??null)",
    returnByValue:true});
   try{attested=JSON.parse(r?.result?.value||'null')}catch{}
   if(attested?.wasm?.instantiated===true&&
      /^[0-9a-f]{64}$/.test(attested?.model?.sha256||''))break;
   await wait(250);
  }
 }
 const expectedJsep='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
 receipt.sameWorkerJsepInstantiatedSha256=attested?.wasm?.sha256||null;
 receipt.sameWorkerJsepInstantiatedBytes=attested?.wasm?.bytes??null;
 receipt.sameWorkerJsepShaMatchesPin=Boolean(attested?.wasm?.instantiated&&
   attested?.wasm?.bytes===21596019&&attested?.wasm?.sha256===expectedJsep);
 receipt.sameWorkerModelCopySha256=attested?.model?.sha256||null;
 receipt.sameWorkerModelCopyBytes=attested?.model?.bytes??null;
 receipt.sameWorkerModelCopyCount=attested?.model?.copyCount??0;
 receipt.sameWorkerModelCopyOffset=attested?.model?.copyOffset??null;
 receipt.attestationObservationComplete=Boolean(receipt.sameWorkerJsepShaMatchesPin&&
   receipt.sameWorkerModelCopyBytes===15199746&&
   /^[0-9a-f]{64}$/.test(receipt.sameWorkerModelCopySha256||''));
 receipt.sameProcessOriginalJsepShaVerified=receipt.sameWorkerJsepShaMatchesPin;
 // Pinned fp32 model ONNX digest independently sourced from the immutable
 // Hugging Face Xenova/segformer_b0_clothes revision a2489ea8... blob
 // onnx/model.onnx. Comparing a model-copy hash does not prove native PC.
 receipt.originalModelWeightsShaVerified=Boolean(
   receipt.sameWorkerModelCopySha256==='02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3');
 receipt.originalModelExecutedAndVerified=Boolean(
   receipt.attestationObservationComplete&&receipt.originalModelWeightsShaVerified&&
   receipt.workerTerminal==='done');
 // Process-family option dump is an independently observed configuration
 // receipt, NOT proof of the actual memory allocation mode of that Worker.
 const optionProof=classifyPinnedJscFastMemoryDump(jscOptionDump);
 receipt.jscOptionDumpObserved=optionProof.observed;
 receipt.jscFastMemoryOption=optionProof.option;
 jscOptionDump=''; // never preserve untrusted stderr in reported evidence
 if(optionProof.ambiguous)throw Error('JSC option logs inconsistent or oversized');
 if(receipt.jscFastMemoryOption!==(jscMemoryMode==='explicit-bounds'?'false':'true'))
  throw Error('effective JSC WASM fast-memory option not attested for target arm');
 if(!receipt.sourceVerifiedInServer||!receipt.originalWorkerCreated||
    !receipt.workerInitialized)throw Error('original worker source / inspector provenance incomplete');
 if(!receipt.workerTerminal)throw Error('original Worker did not finish within bounded time');
 if(outerErrors.length)throw Error('Inspector outer protocol errors');
 if(receipt.workerThrownValueIsNativePc!==false||
    receipt.workerNativeBoundsTextPauseCount>receipt.workerExceptionPauses||
    receipt.workerRuntimeErrorTextPauseCount>receipt.workerExceptionPauses)
  throw Error('thrown remote-object candidate cannot be a native PC or exceed actual exception pauses');
 if(receipt.workerPauseEventWorkerDigest!==null&&
    receipt.workerPauseEventWorkerDigest!==receipt.workerIdDigest)
  throw Error('Worker Inspector event does not match original worker digest');
 if(workerProfile==='instrumented'&&!receipt.attestationObservationComplete)
  throw Error('same Worker JSEP/model native-copy identity attestation incomplete');
 if(workerProfile==='instrumented'&&!receipt.originalModelWeightsShaVerified)
  throw Error('original model native-copy SHA does not match pinned Hugging Face ONNX blob');
 if(workerProfile==='no-js-proxy'&&(receipt.workerAttestationProbeArmed||
    receipt.attestationObservationComplete||receipt.originalModelWeightsShaVerified||
    receipt.sameProcessOriginalJsepShaVerified||receipt.originalModelExecutedAndVerified))
  throw Error('no-JS-proxy control falsely claimed in-process model/WASM attestation');
 // A success only means P94 executed; a generic Worker error cannot establish
 // original OrtCreateSession RED. No M279/M283 same-session receipts are here.
 if(receipt.workerTerminal==='error') {
  receipt.outcome='ORIGINAL_WORKER_REPORTED_ERROR_UNATTRIBUTED';
  receipt.blockedReason='ORIGINAL_P94_GENERIC_ERROR_NATIVE_SITE_NOT_PROVEN';
  process.exitCode=1; // Never paint an original Worker error green.
 } else if(workerProfile==='instrumented') {
  receipt.outcome='ORIGINAL_WORKER_DONE_SAME_WORKER_JSEP_AND_MODEL_COPY_ATTESTED';
  receipt.blockedReason='ORIGINAL_WASM_ERROR_NOT_REPRODUCED_NATIVE_TRAP_PC_UNKNOWN';
 } else {
  receipt.outcome='ORIGINAL_WORKER_DONE_NO_JS_PROXY_UNATTESTED';
  receipt.blockedReason='NO_INPROCESS_JSEP_OR_MODEL_SHA_WITHOUT_RESEARCH_PROXIES';
 }
} catch(err) {
 receipt.outcome='BLOCKED';
 receipt.blockedReason=String(err?.message||err).slice(0,160);
 process.exitCode=1;
} finally {
 if(socket){try{socket.close()}catch{}}
 if(child&&!receipt.browserExitObserved){
  try{child.kill('SIGTERM')}catch{}
  for(let i=0;i<8&&!receipt.browserExitObserved;i++)await wait(250);
  if(!receipt.browserExitObserved){try{child.kill('SIGKILL')}catch{}}
 }
 child?.stderr?.destroy();child?.unref();
 if(server) await new Promise(r=>server.close(()=>r()));
 // Assert that a clean test result is not a claim that the genuine native
 // model loaded or a historical crash has been repaired.
 process.stdout.write('M1585_GENUINE_P94_WORKER_SANITIZED '+JSON.stringify(receipt)+'\n',()=>{
  process.exit(process.exitCode??0);
 });
}
