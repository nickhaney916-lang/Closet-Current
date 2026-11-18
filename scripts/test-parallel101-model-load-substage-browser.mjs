/**
 * Parallel #101 WebKit model-init substage experiment (RESEARCH ONLY / HOLD).
 * Runs the actual pinned SegFormer/ONNX/WASM and unchanged P94 full owner
 * source-to-2D/v4 acceptance; instruments ONLY a disposable HTTP-served copy
 * of the exact original P94 Worker with private-data-free stage progress.
 * This is NOT byte-identical Worker evidence and does NOT claim root repair.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const gitBlob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const browserFile='scripts/test-parallel94-native-p88-browser.mjs';
const workerFile='public/outfit-worker-p94.mjs';
const original=await readFile(browserFile,'utf8');
const worker=await readFile(workerFile,'utf8');
const originalSHA='4f75a40cf153fa4b4d139d782b202dbe7bc55e41';
const workerSHA='d66651b616de54c51eb7ef986324b30f1580888f';
assert.equal(gitBlob(Buffer.from(original)),originalSHA,'Original genuine browser journey changed');
assert.equal(gitBlob(Buffer.from(worker)),workerSHA,'Original real model Worker changed');
const inserts=[];
let instrumented=worker;
function instrumentOnce(anchor,insert,label){
 assert.equal(instrumented.split(anchor).length,2,'P101 Worker anchor changed: '+label);
 instrumented=instrumented.replace(anchor,insert+anchor);
 inserts.push(insert);
}
function stage(phase){
 return "  self.postMessage({type:'progress',id:requestId,phase:'"+phase+"'});\n";
}
instrumentOnce("  const {AutoModelForSemanticSegmentation,AutoProcessor,RawImage,env}=await import(",
 stage('p101_library_begin'),'library start');
instrumentOnce("  env.allowLocalModels=false;",stage('p101_library_ready'),'library ready');
instrumentOnce("  const processor=await AutoProcessor.from_pretrained(",stage('p101_processor_begin'),'processor start');
instrumentOnce("  const model=await AutoModelForSemanticSegmentation.from_pretrained(",
 stage('p101_processor_ready')+stage('p101_model_begin'),'processor finish, model start');
instrumentOnce("  return {model,processor,RawImage};",stage('p101_model_ready'),'model ready');
let restored=instrumented;
for(const added of inserts) {
 assert.equal(restored.split(added).length,2,'P101 duplicate progress probe');
 restored=restored.replace(added,'');
}
assert.equal(restored,worker,'Instrumentation altered actual model/processor/worker logic');
// P101 controlled test-only variable. With cache=on the real model's cache
// policy remains original. With cache=off ONLY this disposable Worker line is
// changed; product Worker, model revision, positive assertions are immutable.
const browserCacheMode=process.env.P101_BROWSER_CACHE||'on';
assert.ok(['on','off'].includes(browserCacheMode),'P101 comparison accepts only cache on/off');
assert.equal(instrumented.split('env.useBrowserCache=true;').length,2,'P101 original cache switch moved');
if(browserCacheMode==='off'){
 instrumented=instrumented.replace('env.useBrowserCache=true;','env.useBrowserCache=false;');
 let cacheRestored=instrumented;
 for(const added of inserts)cacheRestored=cacheRestored.replace(added,'');
 assert.equal(cacheRestored,worker.replace('env.useBrowserCache=true;','env.useBrowserCache=false;'),
  'Cache-off disposable Worker changed more than the one declared env flag');
}

assert.ok(worker.includes("await model(await processor(image))"));
assert.ok(worker.includes("const modelId='Xenova/segformer_b0_clothes'"));
assert.ok(worker.includes("revision='a2489ea8e7ec1ee912190546bad31a4906ccca76'"));

let script=original;
function patchOnce(anchor,replacement,label){
 assert.equal(script.split(anchor).length,2,'Original browser anchor changed: '+label);
 script=script.replace(anchor,replacement);
}
const loadAnchor="const file=await readFile('benchmark/fixtures/commons-0003.jpg');";
patchOnce(loadAnchor,
 "const p101TemporaryWorker="+JSON.stringify(instrumented)+";\n"+loadAnchor,
 'private-only local test worker declaration');
const routeAnchor="  if(url.href===origin+'/public/cloud-backup.js')";
patchOnce(routeAnchor,
 "   // P101: disposable Worker copy differs ONLY by bounded progress stage tags.\n"+
 "   if(url.href===origin+'/public/outfit-worker-p94.mjs')\n"+
 "    return route.fulfill({status:200,contentType:'text/javascript',body:p101TemporaryWorker});\n"+
 routeAnchor,
 'local original Worker route');
const listenerAnchor=" await context.route('**/*',route=>{";
const prelude=[
 "  await context.addInitScript(() => {",
 "   window.__p101WorkerEvents=[];",
 "   const ActualWorker=window.Worker;",
 "   window.Worker=class extends ActualWorker {",
 "    constructor(url,options){",
 "     super(url,options);",
 "     let path='';try{path=new URL(String(url),location.href).pathname;}catch{}",
 "     if(path!=='/public/outfit-worker-p94.mjs')return;",
 "     const record=(type,v)=>{",
 "      const d=v&&typeof v==='object'?v:{};",
 "      const phase=typeof d.phase==='string'?d.phase.slice(0,35):null;",
 "      const reason=typeof d.reason==='string'?d.reason.slice(0,35):null;",
 "      const o={type,phase,reason,count:Number.isSafeInteger(d.count)?d.count:null};",
 "      const arr=window.__p101WorkerEvents;",
 "      if(type==='progress'&&arr.at(-1)?.type===type&&arr.at(-1)?.phase===phase)return;",
 "      if(arr.length<80)arr.push(o);",
 "     };",
 "     this.addEventListener('message',e=>{",
 "      const d=e.data||{};",
 "      if(['progress','error','done','piece'].includes(d.type))record(d.type,d);",
 "     });",
 "     this.addEventListener('error',()=>record('worker-error',null));",
 "     this.addEventListener('messageerror',()=>record('messageerror',null));",
 "    }",
 "   };",
 "  });"
].join('\n')+'\n';
patchOnce(listenerAnchor,prelude+listenerAnchor,'passive Worker scalar listener');
const assertionAnchor=" assert.ok(state.cards>0&&state.cards<=12,\n";
const evidence=[
 "  // P101 emit this even on a genuine failure; do not substitute a green.",
 "  const p101=await page.evaluate(()=>window.__p101WorkerEvents||[]);",
 "  const p101Stages=p101.filter(x=>x.phase?.startsWith('p101_')).map(x=>x.phase);",
 "  const p101Terminal=p101.filter(x=>['error','done','worker-error','messageerror'].includes(x.type));",
 "  console.log('P101_REAL_MODEL_LOAD_STAGE',JSON.stringify({",
 "   engine,width,attempt:process.env.P101_ATTEMPT||'one',",
 "   originalBrowserBlob:'"+originalSHA+"',actualSourceWorkerBlob:'"+workerSHA+"',",
 "   disposableStageOnlyWorker:true,genuineModelAndWasm:true,",
 "   browserCacheMode:process.env.P101_BROWSER_CACHE||'on',",
 "   stagePath:p101Stages,terminals:p101Terminal,realReviewCards:state.cards,",
 "   responseStatuses:modelResponses.map(x=>x.status).sort(),",
 "   blockedRequests:rejected.length,pageErrors:issues.length,",
 "   sourcePositiveAssertionStillRequired:true,ownerPrivateDataLogged:false,",
 "   physicalDevice:false,hostedRLS:false,releaseAllowed:false",
 "  }));"
].join('\n')+'\n';
patchOnce(assertionAnchor,evidence+assertionAnchor,'unchanged strict original positive assertion');
const receipt="actualWorkerSourceBlob:'ab7d3837139c5b7d693383f9d6617e199ec8de4f'";
patchOnce(receipt,"actualWorkerSourceBlob:'p101-disposable-stage-only-from-"+workerSHA+"'",
 'honest original worker source receipt');
assert.ok(script.includes("assert.ok(state.cards>0&&state.cards<=12,"));
assert.ok(script.includes("assert.equal(await countRows(page),0,"));
assert.ok(script.includes("assert.deepEqual(rejected,[]"));
assert.ok(script.includes("assert.deepEqual(issues,[]"));
assert.ok(script.includes("actual model proposal"));
const temp=resolve('scripts/.parallel101-actual-real-model-native-browser.mjs');
const engine=process.env.M58_ENGINE||'webkit';
const width=process.env.P94_WIDTH||'430';
assert.ok(['webkit','chromium'].includes(engine));
assert.ok(['320','390','430'].includes(width));
try{
 await writeFile(temp,script,{flag:'wx'});
 const check=spawnSync(process.execPath,['--check',temp],{encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);
 const proc=spawnSync(process.execPath,[temp],{
  stdio:'inherit',timeout:19*60*1000,
  env:{...process.env,M58_ENGINE:engine,P94_WIDTH:width}
 });
 if(proc.error)throw proc.error;
 assert.equal(proc.status,0,'Genuine original P94 browser acceptance failed; no retry or success override');
}finally{await rm(temp,{force:true});}
