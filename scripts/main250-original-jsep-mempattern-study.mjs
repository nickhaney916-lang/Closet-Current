/**
 * M250 research-only test of a single documented Transformers.js ONNX
 * session_options request on the true original P94 JSEP WebKit model path.
 * It does not assume the request reaches a native ORT C++ allocator export,
 * and a green process is not a permanent WebKit repair.
 */
import assert from 'node:assert/strict';
export const ORIGINAL_JSEP_SHA250='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
export const ORIGINAL_PHOTO_SHA250='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
export const M250_OPTION_ANCHOR="from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',progress_callback:";
export const M250_OPTION_OFF="from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',session_options:{enableMemPattern:false},progress_callback:";
export const M249_ORIGINAL_WORKER_GENERATOR='replaceOne(worker,"const observedWorker=addM249OriginalErrorWitness(deriveOriginalP94JsepObserver(originalWorker.toString(\'utf8\')));");';
const KINDS=new Set(['RuntimeError','TypeError','Error','RangeError','NetworkError','AbortError','CompileError','LinkError','UNKNOWN']);
const CATEGORY=new Set(['wasm_memory_access','memory_allocation','wasm_compile','wasm_link','session','network_abort','network','other','UNKNOWN']);
export function requireArm(arm){assert.ok(['baseline','pattern_off'].includes(arm),'Unsupported model session arm');return arm;}
export function configuredOriginalWorker(original,arm){
 requireArm(arm);
 assert.equal(typeof original,'string');
 assert.equal(original.split(M250_OPTION_ANCHOR).length,2,'Original pinned P94 model session call moved');
 assert.equal(original.includes('session_options:{enableMemPattern:false}'),false,'Original caller already modified');
 assert.ok(original.includes("device:'wasm',dtype:'fp32'"),'Original SegFormer WASM fp32 changed');
 if(arm==='baseline')return original;
 const modified=original.replace(M250_OPTION_ANCHOR,M250_OPTION_OFF);
 assert.equal(modified.split(M250_OPTION_OFF).length,2,'Exactly one option request required');
 assert.ok(modified.includes("from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32'"));
 return modified;
}
/** A snippet runs only in a disposable copy of verified M247's test harness,
 * on a source-derived P94 Worker with the M249 error observer. */
export function disposableM247WorkerReplacement(){
 return [
  "let observedWorker=addM249OriginalErrorWitness(deriveOriginalP94JsepObserver(originalWorker.toString('utf8')));",
  "const m250Anchor="+JSON.stringify(M250_OPTION_ANCHOR)+";",
  "const m250Opt="+JSON.stringify(M250_OPTION_OFF)+";",
  "assert.equal(observedWorker.split(m250Anchor).length,2,'M250 original model-options call drift');",
  "assert.equal(observedWorker.includes('session_options:{enableMemPattern:false}'),false,'M250 original source already changed');",
  "if(process.env.M250_ARM==='pattern_off')observedWorker=observedWorker.replace(m250Anchor,m250Opt);",
  "else assert.equal(process.env.M250_ARM,'baseline','M250 real browser arm changed');",
  "assert.ok(observedWorker.includes(\"device:'wasm',dtype:'fp32'\"),'Original model changed');"
 ].join('\n');
}
export function injectOriginalResearchArm(m249Source){
 assert.equal(typeof m249Source,'string');
 assert.equal(m249Source.split(M249_ORIGINAL_WORKER_GENERATOR).length,2,'M249 preserved original worker generator changed');
 const changed=m249Source.replace(
  M249_ORIGINAL_WORKER_GENERATOR,
  'replaceOne(worker,'+JSON.stringify(disposableM247WorkerReplacement())+');'
 );
 const widthAnchor="P94_WIDTH:'390'";
 // Original M247 source exists inside the original M249 disposable runner,
 // not in the M249 outer driver. Insert an exact-source substitution after
 // M249's original Worker substitution to exercise real 320 or 390 px.
 const extra=[
  "const m250WidthAnchor="+JSON.stringify(widthAnchor)+";",
  "assert.equal(source.split(m250WidthAnchor).length,2,'M250 pinned M247 real browser width moved');",
  "source=source.replace(m250WidthAnchor,\"P94_WIDTH:String(process.env.M249_WIDTH||'390')\");",
  "assert.ok(source.includes('M250 original model-options call drift'));"
 ].join('\n');
 const needle='const oldListener=';
 assert.equal(changed.split(needle).length,2,'M249 original source insert anchor changed');
 return changed.replace(needle,extra+'\n'+needle);
}
export function extractBoundedReceipt(stdout,marker){
 assert.ok(typeof stdout==='string'&&stdout.length<=16*1024*1024,'Unbounded child process output');
 assert.match(marker,/^M(?:58|61|247|249)_[A-Z0-9_]{10,90}$/);
 const found=stdout.split(/\r?\n/).filter(x=>x.startsWith(marker+' '));
 assert.ok(found.length<=1,'Duplicate original evidence: '+marker);
 if(!found.length)return null;
 const json=found[0].slice(marker.length+1);
 assert.ok(json.length<=4000,'Truncated/oversized original receipt');
 const obj=JSON.parse(json);
 assert.ok(obj&&typeof obj==='object'&&!Array.isArray(obj),'Original evidence cannot be null or scalar');
 return obj;
}
export function m250ClassifyOriginal({arm,engine,width,attempt,status,signal,stdout}){
 requireArm(arm);
 assert.ok(['webkit','chromium'].includes(engine));
 assert.ok([320,390].includes(width));
 assert.ok(Number.isInteger(attempt)&&attempt>=1&&attempt<=4);
 assert.ok(status===null||Number.isInteger(status));
 const owners=extractBoundedReceipt(stdout,'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS');
 const privacy=extractBoundedReceipt(stdout,'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY');
 const boundary=extractBoundedReceipt(stdout,'M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY');
 const loaded=extractBoundedReceipt(stdout,'M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT');
 const success=extractBoundedReceipt(stdout,'M249_GENUINE_SOURCE_OWNER_PASS');
 const failed=extractBoundedReceipt(stdout,'M249_ORIGINAL_FAILED_ATTEMPT_JSEP_EVIDENCE');
 const bytes=boundary?.originalJsepWasmSha256===ORIGINAL_JSEP_SHA250&&
  boundary?.originalModelSessionReady===true;
 const browserDirect=boundary?.actualOriginalBrowserJsepBodyHash===true;
 const model=loaded?.outcome==='ready'&&loaded?.growErrors===0&&
  Number.isInteger(loaded?.growCalls)&&loaded.growCalls>0&&
  Number.isInteger(loaded?.terminalPages)&&loaded.terminalPages>=256;
 const owner=owners?.engine===engine&&owners?.modelExecuted===true&&
  owners?.manualSyntheticOwnerConfirmed===true&&owners?.ownerPrivateSaved===1&&
  owners?.exactOriginalSHA256===ORIGINAL_PHOTO_SHA250&&
  owners?.tamperDenied===true&&owners?.otherOwnerDenied===true&&
  owners?.atomicRestore===true&&owners?.actualV4BrowserDownload===true&&
  owners?.hostedRLS===false&&owners?.releaseAuthorized===false;
 const isolated=privacy?.engine===engine&&privacy?.realWorkerFirst===true&&
  privacy?.ownerBPrivateRows===0&&
  privacy?.ownerAOriginalNotVisibleToB===true&&
  privacy?.ownerAOutfitNotVisibleToB===true&&
  privacy?.hostedRLS===false&&privacy?.releaseAllowed===false;
 const direct=engine==='webkit'?browserDirect:true;
 const pass=status===0&&!signal&&success?.engine===engine&&success?.width===String(width)&&
  success?.trueNativeJsepWorker===true&&model&&bytes&&direct&&owner&&isolated&&!failed;
 const cls=failed?.modelExceptionCategory;
 const name=failed?.modelExceptionName;
 return {
  schema:'M250_ORIGINAL_MODEL_SESSION_OPTION_AB/v1',
  arm,engine,width,attempt,
  freshRealBrowserAndNodeProcess:true,
  positive:!!pass,
  category:pass?'genuine_original_jsep_model_owner_positive':
   failed?'real_original_model_red_preserved':
   signal?'original_worker_hung_or_terminated':'original_model_owner_or_identity_incomplete',
  originalChildExitCode:status===0?0:status===null?null:1,
  originalChildSignalPresent:!!signal,
  originalJsepModelReady:!!model,
  actualOriginalJsepSameRunIdentity:!!bytes,
  actualOriginalBrowserResponseShaVerified:engine==='webkit'&&!!browserDirect,
  chromiumBrowserShaNotAsserted:engine==='chromium',
  originalPhotoAndPrivate2DV4:!!owner,
  originalSeparateOwnerIsolation:!!isolated,
  modelCaughtExceptionName:KINDS.has(name)?name:'UNKNOWN',
  modelCaughtExceptionCategory:CATEGORY.has(cls)?cls:'UNKNOWN',
  directlyVerifiedFailedBrowserJsepSha:failed?.directOriginalJsepBrowserBodySHAProven===true,
  modelMemoryGrowCalls:Number.isInteger(loaded?.growCalls)?loaded.growCalls:null,
  modelMemoryTerminalPages:Number.isInteger(loaded?.terminalPages)?loaded.terminalPages:null,
  optionRequestOnly:arm==='pattern_off'?'enableMemPattern:false':'original_default',
  optionReachedNativeCAbiProven:false,
  allocatorRootCauseProven:false,
  permanentRepairProven:false,
  familyAlphaHold:true,releaseAuthorized:false
 };
}
export function m250Summarize(results,{arm,engine,width,expected}){
 requireArm(arm);
 assert.ok(['webkit','chromium'].includes(engine));
 assert.ok([320,390].includes(width));
 assert.ok(Number.isInteger(expected)&&expected>=1&&expected<=4);
 assert.equal(results.length,expected,'Precommitted genuine original processes missing');
 for(let i=0;i<results.length;i++){
  const x=results[i];
  assert.ok(x?.schema==='M250_ORIGINAL_MODEL_SESSION_OPTION_AB/v1'&&
   x.arm===arm&&x.engine===engine&&x.width===width&&x.attempt===i+1,
   'Wrong model arm/engine/attempt count or sequence');
 }
 const pass=results.filter(x=>x.positive).length;
 return {
  schema:'M250_FIXED_ORIGINAL_JSEP_OPTION_ARM_SAMPLE/v1',arm,engine,width,
  freshOriginalProcesses:expected,genuinePositiveModelOwnerJourneys:pass,
  naturalOrDiagnosticRed:expected-pass,
  allPass:pass===expected,
  optionReachedNativeCAbiProven:false,
  causalRedBeforeGreenAfterProven:false,
  historicalWebkitMemoryFailureUnresolved:true,
  noRetriesNoModelSubstitution:true,
  familyAlphaHold:true,releaseAuthorized:false
 };
}
