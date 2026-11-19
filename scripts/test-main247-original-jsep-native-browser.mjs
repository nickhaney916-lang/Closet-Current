/**
 * M247: generate a disposable SAME-original-graph JSEP module variant of the
 * immutable M243 native browser harness. The shipped P94 Worker is never edited.
 * Original 15.2MB ONNX source/real native ABI and all errors remain fail-closed.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const sourcePath='scripts/test-main243-original-segformer-native-session-browser.mjs';
const bytes=await readFile(sourcePath);
const gitBlob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
assert.equal(gitBlob(bytes),'fdfb979ca3783cb362cb5eb909612902af0c3b70',
 'M243 genuine original-model native source changed');
assert.equal(gitBlob(await readFile('public/outfit-worker-p94.mjs')),
 'd66651b616de54c51eb7ef986324b30f1580888f','Consumer original Worker drift');
let src=bytes.toString('utf8');
const once=(needle)=>assert.equal(src.split(needle).length,2,'Original source anchor drift: '+needle.slice(0,72));
const replace=(needle,replacement)=>{once(needle);src=src.replace(needle,replacement);};
replace("import {auditCurrentOriginal,downloadAttestedModel,MODEL_REVISION} from './main243-original-segformer-native-abi.mjs';",
 "import {downloadAttestedModel,MODEL_REVISION} from './main243-original-segformer-native-abi.mjs';\n"+
 "import {auditOriginalJsep,attestJsepOriginalGraph} from './main247-original-jsep-native-contract.mjs';\n"+
 "import {summarizeLocalPublicWasm,classifyLocalRuntimeResponse,attestM246NativeVariant} from './main246-local-ort-wasm-identity.mjs';\n"+
 "import {installedOrtWasmFingerprints} from './main245-original-worker-cdn-wasm-identity.mjs';");
replace("const TEMP=join(DIST,'ort.m243.original-graph.wasm.mjs');",
 "const TEMP=join(DIST,'ort.m247.original-jsep-graph.mjs');");
replace("const {source,derived}=await auditCurrentOriginal();",
 "const {source,derived}=await auditOriginalJsep();\n"+
 "console.log('M247_JSEP_ESM_SOURCE',JSON.stringify({name:source.name,sha256:source.sha256,bytes:source.bytes,packagePinned:true,workerUnchanged:true}));");
replace("const ort=await import('/ort/ort.m243.original-graph.wasm.mjs');",
 "const ort=await import('/ort/ort.m247.original-jsep-graph.mjs');");
replace("async function serveLocal(){",
 "const m247Served=[];\nasync function serveLocal(){");
replace("res.end(await readFile(path));",
 "const body=await readFile(path);\n"+
 "if(path.endsWith('.wasm'))m247Served.push(summarizeLocalPublicWasm(path.split(sep).at(-1),body));\n"+
 "res.end(body);");
replace("const page=await context.newPage();",[
 "const m247Network=[],m247Pending=[];",
 "context.on('response',response=>{",
 " const name=classifyLocalRuntimeResponse(response.url(),served.url);if(!name)return;",
 " const pending=(async()=>{",
 "  const status=response.status();let body=null;",
 "  if(status===200){try{await response.finished();body=await response.body();}catch{}}",
 "  const summary=body?.length>=100000?summarizeLocalPublicWasm(name,body):null;",
 "  m247Network.push({name,status,bodyAvailable:!!summary,sha256:summary?.sha256??null,bytes:summary?.bytes??null});",
 " })();m247Pending.push(pending);",
 "});",
 "const page=await context.newPage();"
].join('\n'));
const receipt="console.log('M243_REAL_ORIGINAL_SEGFORMER_NATIVE_SESSION',JSON.stringify(receipt));";
replace(receipt,receipt+'\n'+[
 "await Promise.allSettled(m247Pending);",
 "const m247Identity=attestM246NativeVariant({server:m247Served,network:m247Network,",
 " installed:await installedOrtWasmFingerprints(ROOT),engine,arm});",
 "const m247JsepReceipt=attestJsepOriginalGraph({engine,arm,model:model.source,",
 " identity:m247Identity,session:data,esmSha256:source.sha256});",
 "console.log('M247_GENUINE_ORIGINAL_JSEP_NATIVE_GRAPH',JSON.stringify(m247JsepReceipt));"
].join('\n'));
assert.ok(src.includes("assert.equal(data.success,true,'Original pinned SegFormer WASM model session failed"));
assert.ok(src.includes("assert.equal(data.nativeCalls.length,1"));
assert.ok(src.includes("M247_GENUINE_ORIGINAL_JSEP_NATIVE_GRAPH"));
assert.ok(src.includes("originalOwnerPhotoJourneyNotRun:true"));
const temp=resolve('scripts/.m247-disposable-original-native-jsep-browser.mjs');
const engine=process.env.M247_ENGINE||'webkit';
const arm=process.env.M247_ARM||'baseline';
assert.ok(['webkit','chromium'].includes(engine),'Invalid native browser');
assert.ok(['baseline','pattern_off'].includes(arm),'Invalid single-variable arm');
try{
 await writeFile(temp,src,{flag:'wx'});
 const checked=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(checked.error)throw checked.error;
 assert.equal(checked.status,0,'JSEP original source transform syntax RED: '+(checked.stderr||'').slice(0,300));
 if(process.env.M247_SOURCE_ONLY==='1'){
  console.log('M247_DISPOSABLE_JSEP_SOURCE_READY',JSON.stringify({
   engine,arm,originalM243SourceBlobPinned:true,shippedP94WorkerUnchanged:true,
   originalRealModelAssertionPreserved:true,actualJsepAssetNotYetTested:true,
   permanentRepairProven:false,releaseAuthorized:false,hold:true}));
 }else{
  const run=spawnSync(process.execPath,[temp],{
   env:{...process.env,M243_ENGINE:engine,M243_PATTERN_ARM:arm},
   stdio:'inherit',timeout:21*60*1000});
  if(run.error)throw run.error;
  assert.equal(run.status,0,'Original JSEP SegFormer native model is RED; do not treat non-JSEP green as repair');
 }
}finally{await rm(temp,{force:true});}
