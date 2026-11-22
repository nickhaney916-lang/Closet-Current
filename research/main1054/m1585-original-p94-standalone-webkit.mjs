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
const branch = 'research/main1054-m1585-original-worker-evidence-contract-HOLD';
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
 originalWorkerExpectedBlob:'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 sourceJpegSha256:locked.sha256,sourceJpegBytes:img.length,
 originalModelId:'Xenova/segformer_b0_clothes',
 originalModelRevision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',
 workerSourceIsOriginalP94:true,inspectorFrontendCount:1,
 nativeDebuggerAttached:false,originalModelWeightsShaVerified:false,
 sameProcessOriginalJsepShaVerified:false,
 originalModelExecutedAndVerified:false,originalModelRedObserved:false,
 nativeTrapPc:null,wasmFileOffset:null,originalCxxStatement:null,
 causalFixProven:false,releaseAllowed:false,familyAlpha:'HOLD',
 webkitInspectorOpen:false,pageTargetDiscovered:false,
 originalWorkerCreated:false,workerDebuggerReady:false,
 workerRuntimeReady:false,workerBreakpointsActive:false,
 workerInitialized:false,workerIdDigestPresent:false,workerIdDigest:null,
 workerExceptionPauses:0,workerResumeAcknowledgements:0,
 workerResumedEvents:0,
 workerMessageTypes:[],workerTerminal:null,
 browserExitObserved:false,sourceVerifiedInServer:false,
 outcome:'BLOCKED',blockedReason:null
};
let server,child,socket,target,workerId,workerDigest,wsseq=0;
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
   if(Number.isSafeInteger(w.id))workerReplies.set(w.id,w);
   if(w.method==='Debugger.paused'){
    receipt.workerExceptionPauses += w.params?.reason==='exception'?1:0;
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
 child=spawn(exe,['--headless',base+'/m1585-page'],{
  env:{...process.env,WEBKIT_INSPECTOR_HTTP_SERVER:'127.0.0.1:17659'},
  stdio:['ignore','ignore','pipe']
 });
 child.on('exit',()=>{receipt.browserExitObserved=true});
 child.stderr?.on('data',()=>{});
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
 await getPage(103,'Worker.initialized',{workerId});
 receipt.workerInitialized=true;

 const startWork="(async()=>{const r=await fetch("+JSON.stringify(base+'/benchmark/fixtures/commons-0003.jpg')+
  ",{cache:'no-store'});if(!r.ok)throw Error('public JPEG missing');"+
  "const bytes=new Uint8Array(await r.arrayBuffer());let text='';"+
  "for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));"+
  "window.__p94.postMessage({id:'m1585-original-probe',image:'data:image/jpeg;base64,'+btoa(text)});"+
  "return {submitted:true,jpegByteLength:bytes.length}})()";
 const started=await getPage(104,'Runtime.evaluate',{expression:startWork,awaitPromise:true,returnByValue:true});
 if(!started?.result?.value?.submitted||started.result.value.jpegByteLength!==img.length)
  throw Error('unchanged public JPEG was not submitted to original P94');
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
 if(!receipt.sourceVerifiedInServer||!receipt.originalWorkerCreated||
    !receipt.workerInitialized)throw Error('original worker source / inspector provenance incomplete');
 if(!receipt.workerTerminal)throw Error('original Worker did not finish within bounded time');
 if(outerErrors.length)throw Error('Inspector outer protocol errors');
 // A success only means P94 executed; a generic Worker error cannot establish
 // original OrtCreateSession RED. No M279/M283 same-session receipts are here.
 if(receipt.workerTerminal==='error') {
  receipt.outcome='ORIGINAL_WORKER_REPORTED_ERROR_UNATTRIBUTED';
  receipt.blockedReason='ORIGINAL_P94_GENERIC_ERROR_NATIVE_SITE_NOT_PROVEN';
  process.exitCode=1; // Never paint an original Worker error green.
 } else {
  receipt.outcome='ORIGINAL_WORKER_DONE_MODEL_ATTESTATION_BLOCKED';
  receipt.blockedReason='EXACT_MODEL_JSEP_SAME_PROCESS_AND_NATIVE_ERROR_NOT_PROVEN';
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
