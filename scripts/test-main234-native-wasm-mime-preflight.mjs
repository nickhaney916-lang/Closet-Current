/**
 * M234 — independent original-source pinned WASM streaming MIME preflight.
 * Test-only browser and local HTTP server. NOT a fix for ONNX memory access.
 * Exactly the CPU-only .wasm belonging to the original pinned ORT package.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const engine=process.env.M58_ENGINE||'webkit';
assert.ok(['webkit','chromium'].includes(engine));
const sha1blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const original=await readFile('scripts/test-parallel94-native-p88-browser.mjs');
assert.equal(sha1blob(original),'4f75a40cf153fa4b4d139d782b202dbe7bc55e41',
 'pinned original P94 native server script changed: new source audit required');
const source=original.toString('utf8');
assert.ok(source.includes("'.mjs':'text/javascript'"));
assert.ok(source.includes("mime[extname(absolute)]||'application/octet-stream'"));
assert.ok(!source.includes("'.wasm':'application/wasm'"),
 'source MIME omission was corrected upstream: M234 historic diagnosis must not be reused');

const root=resolve('node_modules/onnxruntime-web');
const pkg=JSON.parse(await readFile(root+'/package.json','utf8'));
assert.equal(pkg.version,'1.22.0-dev.20250409-89f8206ba4',
 'require same exact ORT package pinned by Transformers 3.8.1');
const wasm=await readFile(root+'/dist/ort-wasm-simd-threaded.wasm');
const binding=await readFile(root+'/dist/ort-wasm-simd-threaded.mjs');
const entry=await readFile(root+'/dist/ort.wasm.min.mjs');
assert.ok(wasm.length>10000&&binding.length>1000&&entry.length>1000,
 'CPU-only same-package runtime assets unexpectedly absent');
assert.ok(WebAssembly.validate(wasm),'same-package CPU-only .wasm not valid');
const sha256=createHash('sha256').update(wasm).digest('hex');
let server,browser,context;
const hits=[];
try{
 server=createServer((req,res)=>{
  const path=new URL(req.url,'http://127.0.0.1').pathname;
  if(req.method==='GET'&&path==='/'){
   res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});
   res.end('<!doctype html><title>Public ORT MIME contract</title>');return;
  }
  if(req.method==='GET'&&(path==='/wasm-correct'||path==='/wasm-octet')){
   const mime=path==='/wasm-correct'?'application/wasm':'application/octet-stream';
   hits.push(mime);
   res.writeHead(200,{'content-type':mime,'cache-control':'no-store'});
   res.end(wasm);return;
  }
  res.writeHead(404);res.end('M234 not permitted');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await (engine==='webkit'?webkit:chromium).launch(
  engine==='chromium'?{headless:true,args:['--no-sandbox']}:{headless:true});
 context=await browser.newContext({serviceWorkers:'block'});
 const page=await context.newPage();
 const warnings=[];
 page.on('pageerror',x=>warnings.push(x.name));
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
 const result=await page.evaluate(async()=>{
  const goodResponse=await fetch('/wasm-correct');
  const badResponse=await fetch('/wasm-octet');
  const goodType=goodResponse.headers.get('content-type');
  const badType=badResponse.headers.get('content-type');
  let compiled=false,missingMimeRejected=false,badErrorClass=null;
  try{
   const module=await WebAssembly.compileStreaming(fetch('/wasm-correct'));
   compiled=module instanceof WebAssembly.Module;
  }catch(error){return {compiled:false,missingMimeRejected:false,
   goodType,badType,goodErrorClass:error?.name||'other'};}
  try{await WebAssembly.compileStreaming(fetch('/wasm-octet'));}
  catch(error){missingMimeRejected=true;badErrorClass=error?.name||'other';}
  return {compiled,missingMimeRejected,badErrorClass,goodType,badType};
 });
 assert.equal(result.goodType,'application/wasm');
 assert.equal(result.badType,'application/octet-stream');
 assert.equal(result.compiled,true,'real browser did not compile actual CPU-only ORT .wasm with correct MIME');
 assert.equal(result.missingMimeRejected,true,
  'real browser did not enforce streaming MIME for same bytes');
 assert.ok(['TypeError','CompileError'].includes(result.badErrorClass),
  'unexpected error category from MIME rejection');
 assert.equal(warnings.length,0,'browser page error during MIME contract check');
 assert.ok(hits.includes('application/wasm')&&hits.includes('application/octet-stream'));
 console.log('M234_ORIGINAL_CPU_ORT_STREAMING_MIME_PREFLIGHT_PASS',JSON.stringify({
  engine,browserVersion:browser.version(),sameBuildOrtVersion:pkg.version,
  packageCpuBindingPresent:true,actualCpuWasmSha256:sha256,
  actualCpuWasmLength:wasm.length,sourceOriginalPinned:true,
  legacyFixtureMimeFallback:'application/octet-stream',
  correctedMime:'application/wasm',nativeCompileStreamingSuccess:true,
  legacyMimeRejected:true,errorClass:result.badErrorClass,
  rootWebKitMemoryFixProven:false,
  familyAlpha:'HOLD',releaseAuthorized:false
 }));
}finally{
 try{await context?.close();}catch{}
 try{await browser?.close();}catch{}
 if(server)await new Promise(resolve=>server.close(resolve));
}
