/**
 * Genuine ORIGINAL P94 Worker on a genuine WebKit/Chromium browser with
 * original licensed photo→actual fp32 SegFormer JSEP→explicit synthetic local
 * owner/private original-photo 2D→lossless v4 restore→owner B isolation.
 * Only test-derived exact public JSEP JS glue gets read-only native ABI hook;
 * original JSEP WASM/model/Worker in the repository remain unchanged.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {deriveOriginalP94JsepObserver}
 from './main247-original-worker-jsep-heap-observer.mjs';
import {addM249OriginalErrorWitness}
 from './main249-original-failed-jsep-source-witness.mjs';
import {configuredOriginalWorker}
 from './main250-original-jsep-mempattern-study.mjs';
import {auditPinnedOriginalJsepGlue,admitRealNativeSessionTransport,
 JSEP_CDN_URL,JSEP_WASM_URL,ORIGINAL_JSEP_WASM_SHA}
 from './main251-original-product-jsep-native-option-spy.mjs';
const gb=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
assert.equal(gb(await readFile('scripts/test-parallel94-native-p88-browser.mjs')),
 '4f75a40cf153fa4b4d139d782b202dbe7bc55e41','Original real source-to-private 2D/v4 owner browser changed');
const originalWorker=await readFile('public/outfit-worker-p94.mjs');
assert.equal(gb(originalWorker),'d66651b616de54c51eb7ef986324b30f1580888f');
const arm=process.env.M251_ARM||'baseline';
const engine=process.env.M251_ENGINE||'webkit';
const width=Number(process.env.M251_WIDTH||390);
assert.ok(['baseline','pattern_off'].includes(arm));
assert.ok(['webkit','chromium'].includes(engine));
assert.ok([320,390].includes(width));
const {derived:originalGlue,audit}=await auditPinnedOriginalJsepGlue();
let worker=deriveOriginalP94JsepObserver(originalWorker.toString('utf8'));
worker=addM249OriginalErrorWitness(worker);
worker=configuredOriginalWorker(worker,arm);
assert.ok(worker.includes("device:'wasm',dtype:'fp32'"));
const original=await readFile('scripts/test-parallel94-native-p88-browser.mjs','utf8');
let src=original;
function change(needle,to){
 assert.equal(src.split(needle).length,2,'Original true model/private browser source moved: '+needle.slice(0,65));
 src=src.replace(needle,to);
}
change("import assert from 'node:assert/strict';",
 "import assert from 'node:assert/strict';\n"+
 "import {admitRealNativeSessionTransport,JSEP_WASM_URL,ORIGINAL_JSEP_WASM_SHA} from './main251-original-product-jsep-native-option-spy.mjs';");
change("const external=[],rejected=[],issues=[],modelResponses=[];",
 "const external=[],rejected=[],issues=[],modelResponses=[];\n"+
 "const m251ObservedWorker="+JSON.stringify(worker)+";\n"+
 "const m251ObservedGlue="+JSON.stringify(originalGlue)+";\n"+
 "const m251NativeEvents=[];\n"+
 "const m251ActualWasm=[],m251Pending=[];\n"+
 "const m251ExpectedEngine="+JSON.stringify(engine)+";\n"+
 "const m251ExpectedArm="+JSON.stringify(arm)+";");
const originalFirewall="  if(url.origin===origin||url.protocol==='blob:'||url.protocol==='data:')\n   return route.continue();";
const replacedFirewall=[
 "  // ONLY a disposable source-locked test copy of original P94 Worker and",
 "  // original pinned public JSEP JS glue receive a read-only native ABI hook.",
 "  // Original 21.6MB WASM/model/JPEG and source repo bytes remain untouched.",
 "  if(req.method()==='GET'&&url.origin===origin&&url.pathname==='/public/outfit-worker-p94.mjs')",
 "   return route.fulfill({status:200,contentType:'text/javascript',body:m251ObservedWorker});",
 "  if(req.method()==='GET'&&url.href==="+JSON.stringify(JSEP_CDN_URL)+")",
 "   return route.fulfill({status:200,contentType:'text/javascript',body:m251ObservedGlue});",
 originalFirewall
].join('\n');
change(originalFirewall,replacedFirewall);
const browserHook=" await context.addInitScript(()=>{\n  window.__document91=crypto.randomUUID();";
change(browserHook,[
 " await context.addInitScript(()=>{",
 "  const OriginalWorker=window.Worker;",
 "  window.Worker=class extends OriginalWorker{",
 "   constructor(url,opts){",
 "    super(url,opts);",
 "    let path='';try{path=new URL(String(url),location.href).pathname;}catch{}",
 "    if(path!=='/public/outfit-worker-p94.mjs')return;",
 "    this.addEventListener('message',event=>{",
 "     const d=event.data;",
 "     if(d?.type!=='diagnostic'||d?.phase!=='m251_original_jsep_native_abi')return;",
 "     const safe={phase:'m251_original_jsep_native_abi',",
 "      optionsArgumentCount:d.optionsArgumentCount,originalNativeExportCalled:d.originalNativeExportCalled===true,",
 "      arenaFlag:d.arenaFlag,patternFlag:d.patternFlag,",
 "      returnedNativeHandle:d.returnedNativeHandle===true,threw:d.threw===true,",
 "      errorName:['RuntimeError','Error','TypeError','RangeError','LinkError','other'].includes(d.errorName)?d.errorName:null};",
 "     console.log('M251_ACTUAL_NATIVE_OPTIONS '+JSON.stringify(safe));",
 "    });",
 "   }",
 "  };",
 " });",
 browserHook
].join('\n'));
const pageStart=" const page=await context.newPage();";
change(pageStart,[
 " context.on('response',response=>{",
 "  if(response.url()!==JSEP_WASM_URL)return;",
 "  const promise=(async()=>{",
 "   const status=response.status();let length=null,digest=null;",
 "   if(status===200){",
 "    try{await response.finished();const data=await response.body();",
 "     length=data.length;digest=createHash('sha256').update(data).digest('hex');",
 "    }catch{}",
 "   }",
 "   m251ActualWasm.push({status,bytes:length,sha256:digest});",
 "  })();m251Pending.push(promise);",
 " });",
 pageStart,
 " page.on('console',msg=>{",
 "  const text=msg.text(),prefix='M251_ACTUAL_NATIVE_OPTIONS ';",
 "  if(!text.startsWith(prefix))return;",
 "  try{const event=JSON.parse(text.slice(prefix.length));",
 "   if(event?.phase==='m251_original_jsep_native_abi'&&m251NativeEvents.length<8){",
 "    m251NativeEvents.push(event);",
 "    console.log('M251_NATIVE_EXPORT_ACTUAL_EVENT '+JSON.stringify(event));",
 "   }",
 "  }catch{}",
 " });"
].join('\n'));
const originalReceipt=" console.log('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',JSON.stringify({";
assert.equal(src.split(originalReceipt).length,2);
change(originalReceipt,[
 " await Promise.allSettled(m251Pending);",
 " assert.equal(m251ActualWasm.length,1,'Original JSEP WASM browser network response missing/ambiguous');",
 " assert.equal(m251ActualWasm[0].status,200,'Original JSEP public WASM request failed');",
 " if(engine==='webkit'){",
 "  assert.equal(m251ActualWasm[0].sha256,ORIGINAL_JSEP_WASM_SHA,",
 "   'Original genuine WebKit received JSEP WASM body drift');",
 "  assert.equal(m251ActualWasm[0].bytes,21596019);",
 " }",
 " const m251Result=admitRealNativeSessionTransport({",
 "  arm:m251ExpectedArm,engine:m251ExpectedEngine,events:m251NativeEvents,",
 "  identity:{originalP94JsepRealWorker:true,originalModelAndPrivate2DV4Passed:true,",
 "   actualOriginalJsepName:'ort-wasm-simd-threaded.jsep.wasm',",
 "   pinnedLocalJsepBinarySha:ORIGINAL_JSEP_WASM_SHA,",
 "   directBrowserJsepWasmBodyHash:m251ActualWasm[0].sha256===ORIGINAL_JSEP_WASM_SHA}});",
 " console.log('M251_PRODUCT_NATIVE_JSEP_OPTION_ABI',JSON.stringify(m251Result));",
 originalReceipt
].join('\n'));
assert.ok(src.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));
assert.ok(src.includes('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY'));
assert.ok(src.includes('M251_PRODUCT_NATIVE_JSEP_OPTION_ABI'));
const temp=resolve('scripts/.main251-original-jsep-actual-native-option-boundary.mjs');
try{
 await writeFile(temp,src,{flag:'wx'});
 const check=spawnSync(process.execPath,['--check',temp],{
  encoding:'utf8',timeout:30000,maxBuffer:1024*1024
 });
 if(check.error)throw check.error;
 assert.equal(check.status,0,'Original pinned M251 genuine browser syntax invalid '+String(check.stderr).slice(0,900));
 if(process.env.M251_SOURCE_ONLY==='1'){
  console.log('M251_ACTUAL_SOURCE_LOCKED',JSON.stringify({
   arm,engine,width,exactOriginalJsepGluePinned:true,
   originalJsepWasmSha256:ORIGINAL_JSEP_WASM_SHA,
   originalWorkerAndOwnerSourcePinned:true,
   originalModelUnchanged:true,
   actualNativeSessionNotYetExecuted:true,releaseAuthorized:false,hold:true
  }));
 }else{
  const run=spawnSync(process.execPath,[temp],{
   env:{...process.env,M58_ENGINE:engine,P94_WIDTH:String(width)},
   encoding:'utf8',timeout:22*60*1000,maxBuffer:20*1024*1024
  });
  if(run.error)throw run.error;
  const lines=(run.stdout||'').split(/\r?\n/);
  const markers=['M251_PRODUCT_NATIVE_JSEP_OPTION_ABI ',
   'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS ',
   'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY ',
   'M251_NATIVE_EXPORT_ACTUAL_EVENT '];
  for(const line of lines){
   if(markers.some(m=>line.startsWith(m)))console.log(line.slice(0,2200));
  }
  if(run.status!==0){
   // Classify only the ORIGINAL browser's own RED. NEVER output error text,
   // private paths, owner IDs, model URLs, photos or raw stderr.
   const originalErr=(run.stderr||'').split(/\r?\n/).find(x=>x.startsWith('M58_REAL_P88_WORKER_FAIL '));
   let phase='unavailable',kind='unclassified';
   try{
    const e=JSON.parse(originalErr?.slice('M58_REAL_P88_WORKER_FAIL '.length)||'{}');
    const allow=['startup','sign-in','genuine worker original JPEG and live SegFormer'];
    phase=allow.includes(e.stage)?e.stage:'other_after_model_or_owner';
    const msg=typeof e.error==='string'?e.error:'';
    kind=['RuntimeError','ReferenceError','TypeError','SyntaxError','AssertionError','NetworkError']
     .find(name=>msg.includes(name))||'other';
   }catch{}
   const observed=lines.filter(x=>x.startsWith('M251_NATIVE_EXPORT_ACTUAL_EVENT '));
   const positive=lines.filter(x=>x.startsWith('M251_PRODUCT_NATIVE_JSEP_OPTION_ABI '));
   console.log('M251_REAL_ORIGINAL_BROWSER_RED_BOUNDARY',JSON.stringify({
    engine,arm,width,phase,errorKind:kind,originalChildExitCode:run.status,
    nativeSessionOptionsEvents:observed.length,ownerAndOriginalNativePositiveCount:positive.length,
    originalModelRedPreserved:true,originalNativeCAllocatorCauseProven:false,
    productionWorkerUnchanged:true,releaseAuthorized:false,hold:true
   }));
  }
  assert.equal(run.status,0,'Genuine original JSEP native ABI or owner/privacy journey failed; preserve RED');
  const records=lines.filter(x=>x.startsWith(markers[0]));
  assert.equal(records.length,1,'No unique original Worker actual native session option ABI');
  const item=JSON.parse(records[0].slice(markers[0].length));
  assert.equal(item.engine,engine);assert.equal(item.arm,arm);
  console.log('M251_REAL_ORIGINAL_NATIVE_OPTION_RESULT',JSON.stringify(item));
 }
}finally{await rm(temp,{force:true});}
