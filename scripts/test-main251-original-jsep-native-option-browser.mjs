/** M251 ORIGINAL pinned JSEP WASM native ABI research; only an ephemeral 44KB JSEP loader JS shim is modified. No original product change or release approval. */
/**
 * M247 native original source/photo->genuine SegFormer JSEP Worker->private
 * 2D/v4 owner journey. Disposable source-derived Worker adds only numeric
 * Memory.prototype.grow observation at real model-ready or rejected load.
 * Exact original CDN WASM JS/network SHA receipts are collected in SAME run.
 *
 * This does not observe C++ allocator state and cannot declare repaired
 * WebKit memory access without a genuine independent RED-before/GREEN-after.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {deriveOriginalP94JsepObserver,ORIGINAL_BROWSER_BLOB,ORIGINAL_WORKER_BLOB}
 from './main247-original-worker-jsep-heap-observer.mjs';
const gitBlob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const sourcePath='scripts/test-parallel94-native-p88-browser.mjs';
const [original,originalWorker]=await Promise.all([
 readFile(sourcePath),readFile('public/outfit-worker-p94.mjs')
]);
assert.equal(gitBlob(original),ORIGINAL_BROWSER_BLOB,'Pinned P94 genuine browser source changed');
assert.equal(gitBlob(originalWorker),ORIGINAL_WORKER_BLOB,'Shipped original Worker changed');
let observedWorker=deriveOriginalP94JsepObserver(originalWorker.toString('utf8'));
const m251Arm=process.env.M251_ARM||'baseline';
assert.ok(['baseline','pattern_off'].includes(m251Arm),'M251 only default native option or one memory-pattern request');
const m251ModelAnchor="from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',progress_callback:";
assert.equal(observedWorker.split(m251ModelAnchor).length,2,'Original pinned genuine SegFormer loader changed');
if(m251Arm==='pattern_off')observedWorker=observedWorker.replace(m251ModelAnchor,
 "from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',session_options:{enableMemPattern:false},progress_callback:");
assert.ok(observedWorker.includes("device:'wasm',dtype:'fp32'"));
let source=original.toString('utf8');
const once=(anchor,label)=>assert.equal(source.split(anchor).length,2,label+' immutable anchor changed');
const imports="import assert from 'node:assert/strict';";
once(imports,'original import');
source=source.replace(imports,imports+"\n"+
 "import {classifyPinnedPublicRuntime,digestPublicRuntimeResponse,installedOrtWasmFingerprints,attestP94LoadedRuntime,independentlyFetchPinnedWasm} from './main245-original-worker-cdn-wasm-identity.mjs';\n"+
 "import {verifySameOriginalJsepModelBoundary,sanitizeRealWorkerJsepMessage} from './main247-original-worker-jsep-heap-observer.mjs';");

const stats="const external=[],rejected=[],issues=[],modelResponses=[];";
once(stats,'original egress and model responses');
source=source.replace(stats,stats+'\n'+
 'const m247ObservedWorker='+JSON.stringify(observedWorker)+';\n'+
 'const m247PublicAssets=[],m247PublicPending=[];');

const route=" await context.route('**/*',route=>{";
once(route,'original request firewall');
// This observer is installed in browser before any real photo/model is loaded.
// Events carry no id, source, photo, mask, model bytes, owner or auth.
const browserPrelude=[
 " await context.addInitScript(()=>{",
 "  window.__m247JsepEvents=[];",
 "  const OriginalWorker=window.Worker;",
 "  window.Worker=class extends OriginalWorker{",
 "   constructor(url,opts){",
 "    super(url,opts);",
 "    let path='';",
 "    try{path=new URL(String(url),location.href).pathname;}catch{}",
 "    if(path!=='/public/outfit-worker-p94.mjs')return;",
 "    this.addEventListener('message',event=>{",
 "     const d=event.data;",
 "     if(d?.type!=='diagnostic'||d?.phase!=='m247_jsep_memory')return;",
 "     const bounded=(value,limit)=>Number.isInteger(value)&&value>=0&&value<=limit?value:null;",
 "     const safe={phase:'m247_jsep_memory',",
 "      outcome:['ready','error'].includes(d.outcome)?d.outcome:'other',",
 "      hookInstalled:d.hookInstalled===true,",
 "      growCalls:bounded(d.growCalls,100000),growErrors:bounded(d.growErrors,100000),",
 "      targetCount:bounded(d.targetCount,16),validTargets:bounded(d.validTargets,16),",
 "      firstPages:bounded(d.firstPages,65536),terminalPages:bounded(d.terminalPages,65536)};",
 "     if(window.__m247JsepEvents.length>=12)return;",
 "     window.__m247JsepEvents.push(safe);",
 "     console.log('M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT '+JSON.stringify(safe));",
 "    });",
 "   }",
 "  };",
 " });",
 " // Only original public version-pinned library JS and WASM are hashed.",
 " context.on('response',response=>{",
 "  const asset=classifyPinnedPublicRuntime(response.url());",
 "  if(!asset)return;",
 "  const pending=(async()=>{",
 "   const status=response.status();",
 "   let data=null;",
 "   if(status===200)try{await response.finished();data=await response.body();}catch{}",
 "   m247PublicAssets.push(digestPublicRuntimeResponse(asset,status,data));",
 "  })();",
 "  m247PublicPending.push(pending);",
 " });"
].join('\n');
const m251ListenerAnchor="     if(d?.type!=='diagnostic'||d?.phase!=='m247_jsep_memory')return;";
assert.equal(browserPrelude.split(m251ListenerAnchor).length,2,'Original P94 Worker native listener changed');
const m251NativeListener=[
 "     if(d?.type==='diagnostic'&&d?.phase==='m251_native_option'){",
 "      const f=v=>v===true||v===1?true:v===false||v===0?false:null;",
 "      const safe={phase:'m251_native_option',cpuArena:f(d.cpuArena),memPattern:f(d.memPattern),",
 "       argCount:d.argCount,actualExportCalled:d.actualExportCalled===true,handleReturned:d.handleReturned===true};",
 "      console.log('M251_NATIVE_OPTION_MESSAGE '+JSON.stringify(safe));return;",
 "     }"
].join('\n');
const m251Prelude=browserPrelude.replace(m251ListenerAnchor,
 m251NativeListener+'\n'+m251ListenerAnchor);
source=source.replace(route,m251Prelude+'\n'+route);

const routeLocal="  if(url.origin===origin||url.protocol==='blob:'||url.protocol==='data:')\n   return route.continue();";
once(routeLocal,'original same-origin request integrity');
source=source.replace(routeLocal,[
 "  // ONLY the original worker request is fulfilled with immutable original",
 "  // source PLUS numeric-only test probe; WASM/model/photo remain unchanged.",
 "  if(url.origin===origin&&url.pathname==='/public/outfit-worker-p94.mjs'){",
 "   if(req.method()!=='GET')return route.abort();",
 "   return route.fulfill({status:200,contentType:'text/javascript',body:m247ObservedWorker});",
 "  }",
 routeLocal
].join('\n'));

const page=" const page=await context.newPage();";
once(page,'original browser context page');
source=source.replace(page," const m247NativeEvents=[];\n"+page+"\n"+
 " page.on('console',msg=>{const v=msg.text();"+
 "if(v.startsWith('M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT ')){"+
 " console.log(v.slice(0,850));"+
 " try{const parsed=JSON.parse(v.slice('M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT '.length));"+
 " const safe=sanitizeRealWorkerJsepMessage({type:'diagnostic',...parsed});"+
 " if(safe&&m247NativeEvents.length<12)m247NativeEvents.push(safe);}catch{}"+
 " }});");

const stage=" assert.ok(/unverified region/.test(state.status),'Never call the proposals confirmed');";
once(stage,'original genuine model-positive review stage');
const evidence=[
 " await Promise.allSettled(m247PublicPending);",
 " const localOrt=await installedOrtWasmFingerprints(root);",
 " const independent=[];",
 " for(const item of m247PublicAssets.filter(x=>x.kind==='onnx-wasm'&&x.status===200))",
 "  independent.push(await independentlyFetchPinnedWasm(item.name));",
 " const realJsep=attestP94LoadedRuntime(m247PublicAssets,localOrt,independent);",
 " // Node-side original browser console event capture survives app page reloads.",
 " const safeEvents=m247NativeEvents;",
 " const m247Receipt=verifySameOriginalJsepModelBoundary(safeEvents,realJsep,engine);",
 " assert.equal(realJsep.observedPublicResources.filter(x=>x.kind==='onnx-wasm').length,1);",
 " console.log('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY',JSON.stringify({...m247Receipt,",
 "  originalPhotoReviewCardCount:state.cards,originalOwnerPrivacy2DV4MustPassAfterThis:true}));"
].join('\n');
source=source.replace(stage,stage+'\n'+evidence);
assert.ok(source.includes("assert.ok(state.cards>0&&state.cards<=12"));
assert.ok(source.includes("M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY"));
assert.ok(source.includes("M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS"));
assert.ok(source.includes("M58_REAL_P88_WORKER_FAIL"));
// M251: original P94 browser test-only instrumentation; ONLY the exact pinned
// public JSEP loader JS is derived. Same original WASM/network/model/photo,
// unverified proposals, owner A/B and v4 journey remain unmodified.
const originalImports="import {mutateOwnerItem91} from './lib/owner-item-mutation91.mjs';";
assert.equal(source.split(originalImports).length,2,'Original P94 native import drift');
source=source.replace(originalImports,originalImports+
 "\nimport {instrumentM251OriginalJsepGlue,verifyM251OriginalNativeOptionReceipt} from './main251-original-jsep-abi-probe.mjs';"+
 "\nconst m251Arm=process.env.M251_ARM||'baseline';");
const lifecycle=" await context.exposeBinding('__p91Lifecycle'";
assert.equal(source.split(lifecycle).length,2,'Original P94 request/route lifecycle drift');
const route251=[
 " const m251ResearchLoader=await instrumentM251OriginalJsepGlue();",
 " await context.route('**/ort-wasm-simd-threaded.jsep.mjs',route=>{",
 "  const req=route.request(),url=new URL(req.url());",
 "  assert.equal(req.method(),'GET','M251 only original public GET');",
 "  assert.equal(url.hostname,'cdn.jsdelivr.net','M251 original pinned CDN only');",
 "  assert.equal(url.pathname,'/npm/@huggingface/transformers@3.8.1/dist/ort-wasm-simd-threaded.jsep.mjs');",
 "  assert.equal(url.search,'','M251 exact original public runtime path required');",
 "  return route.fulfill({status:200,contentType:'text/javascript',body:m251ResearchLoader,",
 "   headers:{'access-control-allow-origin':'*','cache-control':'no-store'}});",
 " });"
].join('\n');
source=source.replace(lifecycle,route251+'\n'+lifecycle);
const page251=" const page=await context.newPage();";
assert.equal(source.split(page251).length,2,'Original P94 native browser page drift');
source=source.replace(page251,[
 " const m251NativeEvents=[];",
 page251,
 " page.on('console',msg=>{",
 "  const v=msg.text(),prefix='M251_NATIVE_OPTION_MESSAGE ';",
 "  if(!v.startsWith(prefix))return;",
 "  try{const parsed=JSON.parse(v.slice(prefix.length));",
 "   if(parsed?.phase==='m251_native_option'&&m251NativeEvents.length<5)m251NativeEvents.push(parsed);",
 "  }catch{}",
 " });"
].join('\n'));
const review251=" assert.ok(/unverified region/.test(state.status),'Never call the proposals confirmed');";
assert.equal(source.split(review251).length,2,'Original unverified proposal stage changed');
source=source.replace(review251,review251+'\n'+[
 " assert.equal(m251NativeEvents.length,1,'Actual original JSEP native options Wasm export not observed exactly once');",
 " const proof251=verifyM251OriginalNativeOptionReceipt(m251NativeEvents[0],{engine,arm:m251Arm});",
 " console.log('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI',JSON.stringify({...proof251,",
 "  actualOriginalNativeP94ModelAndPrivateOwnerMustPassLater:true}));"
].join('\n'));
assert.ok(source.includes('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI'));
assert.ok(source.includes('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY'));
assert.ok(source.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));
assert.ok(source.includes("outcome:['ready','error'].includes(d.outcome)"));
const temporary=resolve('scripts/.m251-original-jsep-native-option-browser.mjs');
const engine=process.env.M247_ENGINE||'webkit';
assert.ok(['webkit','chromium'].includes(engine));
try{
 await writeFile(temporary,source,{flag:'wx'});
 const lint=spawnSync(process.execPath,['--check',temporary],{encoding:'utf8',timeout:30000});
 if(lint.error)throw lint.error;
 assert.equal(lint.status,0,
  'Derived unchanged original JSEP research harness invalid: '+String(lint.stderr).slice(0,350));
 if(process.env.M247_SOURCE_ONLY==='1'){
  console.log('M247_PINNED_ORIGINAL_JSEP_PROBE_READY',JSON.stringify({
   originalBrowserPinned:true,originalWorkerPinned:true,originalModelUnchanged:true,
   originalJsepWasmUnchanged:true,originalPrivateOwner2DV4Unchanged:true,
   trueOriginalJsepAssetAndMemoryObservationPending:true,noRetries:true,
   releaseAuthorized:false,familyAlphaHold:true
  }));
 }else{
  const run=spawnSync(process.execPath,[temporary],{
   env:{...process.env,M58_ENGINE:engine,P94_WIDTH:'390'},stdio:'inherit',timeout:24*60*1000
  });
  if(run.error)throw run.error;
  assert.equal(run.status,0,'M247 genuine original P94 JSEP model or owner privacy RED; no retry/substitution');
 }
}finally{await rm(temporary,{force:true});}
