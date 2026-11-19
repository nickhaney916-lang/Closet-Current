/**
 * M244 independent comparison gate: two genuine but NON-EQUIVALENT paths:
 * 1) installed P94 Worker / original public photo / explicit synthetic owner,
 *    private 2D/v4 restore (M239/P101, original Transformers.js CDN);
 * 2) byte-identical original SegFormer ONNX graph, native local ORT WASM
 *    session WITHOUT the P94 Worker, photo/inference or owner (M243).
 *
 * Neither green alone is the other's success. No runtime is changed, no
 * synthetic model positive, no hidden retry. Real failure remains nonzero.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const ORIGINAL_GRAPH_SHA='02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3';
export const ORIGINAL_MODEL_REVISION='a2489ea8e7ec1ee912190546bad31a4906ccca76';
export const CONSUMER_WORKER_BLOB='d66651b616de54c51eb7ef986324b30f1580888f';
export const ORIGINAL_OWNER_TEST_BLOB='47e24a0a8973465ed6207e5465042d13ed3e988e';
export const ORIGINAL_NATIVE_GRAPH_TEST_BLOB='fdfb979ca3783cb362cb5eb909612902af0c3b70';
const gitBlob=x=>createHash('sha1').update('blob '+x.length+'\0').update(x).digest('hex');

export function extractReceipt(output,marker){
 const lines=String(output).split('\n').filter(line=>line.includes(marker+' '));
 assert.equal(lines.length,1,'Missing or repeated genuine receipt '+marker);
 const tail=lines[0].slice(lines[0].indexOf(marker+' ')+marker.length+1).trim();
 const parsed=JSON.parse(tail);
 assert.ok(parsed&&typeof parsed==='object'&&!Array.isArray(parsed),'Invalid native receipt shape');
 return parsed;
}

export function crossPathGate(owner,native,engine){
 assert.ok(['webkit','chromium'].includes(engine),'Unsupported engine');
 assert.equal(owner.engine,engine,'Original owner browser engine mismatch');
 assert.equal(owner.width,390,'Original owner viewport mismatch');
 assert.equal(owner.realModelAttempted,true,'Original P94 model requests not observed');
 assert.equal(owner.actualWorkerSeen,true,'Original real Worker not observed');
 assert.equal(owner.success,true,'Original genuine model-positive failed');
 assert.ok(Number.isInteger(owner.cards)&&owner.cards>0&&owner.cards<=12,
  'No true SegFormer original garment suggestions; cannot substitute local model');
 const stage=(owner.workerEvents||[]).filter(x=>x.phase==='model_session_load');
 assert.ok(stage.some(x=>x.type==='diagnostic'&&x.outcome==='ok'),
  'Original Worker native session outcome not proven successful');
 assert.equal(native.engine,engine,'Standalone native browser engine mismatch');
 assert.equal(native.arm,'baseline','Cannot compare changed option arm to original baseline');
 assert.equal(native.originalGraphSha256,ORIGINAL_GRAPH_SHA,'Standalone ONNX graph bytes changed');
 assert.equal(native.modelRevision,ORIGINAL_MODEL_REVISION,'Standalone ONNX revision changed');
 assert.equal(native.originalPublicGraph,true);
 assert.equal(native.success,true,'Native original graph session FAILED');
 assert.equal(native.stage,'model_session_complete');
 assert.equal(native.originalOwnerPhotoJourneyNotRun,true,
  'Native graph session must not claim owner/photo acceptance');
 assert.equal(native.apiCalls?.length,1,'Missing genuine native option ABI receipt');
 assert.equal(native.apiCalls[0].actualCall,true);
 assert.equal(native.apiCalls[0].memPatternFlag,true);
 assert.equal(native.apiCalls[0].handleReturned,true);
 assert.equal(native.nativeCalls?.length,1,'Missing original graph native model export');
 assert.equal(native.nativeCalls[0].actualNativeExportCalled,true);
 assert.equal(native.nativeCalls[0].returnedHandle,true);
 assert.ok(native.grownMemoryTargetCount>=1&&native.jsGrowCalls>0);
 return {
  schema:'M244_CROSS_PATH_RESEARCH_ACCEPTANCE/v1',engine,
  ownerRealOriginalModel:true,ownerOriginalProposals:owner.cards,
  ownerExplicitPrivate2DV4Required:true,
  nativePublicOriginalOnnxGraph:true,nativeGraphSha256:ORIGINAL_GRAPH_SHA,
  nativeModelOptionExportActuallyCalled:true,nativeMemPattern:true,
  nativeMemoryPages:native.finalHeapPages,
  differentRuntimePath:true,directRuntimeEquivalenceProven:false,
  nativeCAllocatorPolicyProven:false,originalWebkitFixProven:false,
  sourcePhoto3DFitProven:false,physicalPhonesVerified:false,
  hostedFourAccountRLSVerified:false,
  privateAccountDataAccessed:false,releaseAuthorized:false,familyAlphaHold:true
 };
}

async function checkPinnedSources(){
 const files=[
  ['public/outfit-worker-p94.mjs',CONSUMER_WORKER_BLOB],
  ['scripts/test-main239-original-ort-grow-target-browser.mjs',ORIGINAL_OWNER_TEST_BLOB],
  ['scripts/test-main243-original-segformer-native-session-browser.mjs',ORIGINAL_NATIVE_GRAPH_TEST_BLOB]
 ];
 for(const [path,expected] of files){
  const bytes=await readFile(path);
  assert.equal(gitBlob(bytes),expected,'M244 protected original source changed: '+path);
 }
 return true;
}
function runPinned(name,path,env){
 const run=spawnSync(process.execPath,[path],{
  cwd:process.cwd(),env:{...process.env,...env},
  encoding:'utf8',timeout:21*60*1000,maxBuffer:16*1024*1024
 });
 if(run.error)throw new Error(name+' process unavailable: '+run.error.code);
 if(run.status!==0){
  // Fail closed. Print limited sanitized, pre-allowlisted diagnostic categories
  // only, never the original raw stderr, photo data or access details.
  const tag=name==='original-owner'?'M214_REAL_P94_WORKER_OUTCOME':'M243_REAL_ORIGINAL_SEGFORMER_NATIVE_SESSION';
  let stage='missing-receipt',errorCategory='unknown',cards=0;
  try{
   const receipt=extractReceipt(run.stdout,tag);
   stage=name==='original-owner'?receipt.workerEvents?.filter(x=>x.phase==='model_session_load').at(-1)?.outcome||'unknown':receipt.stage;
   errorCategory=name==='original-owner'?receipt.workerEvents?.filter(x=>x.phase==='model_session_load').at(-1)?.messageCode||'unknown':receipt.errorClass;
   cards=Number.isInteger(receipt.cards)?receipt.cards:0;
  }catch{}
  console.error('M244_GENUINE_MODEL_RED',JSON.stringify({
   path:name,engine:env.M58_ENGINE||env.M243_ENGINE,
   stage:String(stage).slice(0,50),errorCategory:String(errorCategory).slice(0,40),cards,
   originalFailurePreserved:true,notRetried:true,familyAlphaHold:true
  }));
  throw new Error(name+' genuine acceptance RED. No retry, no synthetic substitution.');
 }
 return run.stdout;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 await checkPinnedSources();
 const engine=process.env.M244_ENGINE||'webkit';
 assert.ok(['webkit','chromium'].includes(engine));
 if(process.env.M244_SOURCE_ONLY==='1'){
  console.log('M244_PINNED_DUAL_PATH_SOURCE_GUARD_PASS',
   JSON.stringify({engine,pinnedWorker:true,pinnedOwnerTest:true,pinnedOriginalGraphTest:true,
    noConsumerChanges:true,hold:true}));
 }else{
  const original=runPinned('original-owner',
   'scripts/test-main239-original-ort-grow-target-browser.mjs',{
    M58_ENGINE:engine,P94_WIDTH:'390',P101_CACHE_MODE:'baseline',P101_SESSION_MODE:'baseline',
    M214_ATTEMPT:'M244-ORIGINAL-OWNER-'+engine
   });
  const owner=extractReceipt(original,'M214_REAL_P94_WORKER_OUTCOME');
  assert.ok(original.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'),
   'Actual private owner original→2D/v4 restore success missing');
  assert.ok(original.includes('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY'),
   'Original two-owner privacy journey success missing');
  const nativeOut=runPinned('original-graph',
   'scripts/test-main243-original-segformer-native-session-browser.mjs',{
    M243_ENGINE:engine,M243_PATTERN_ARM:'baseline'
   });
  const native=extractReceipt(nativeOut,'M243_REAL_ORIGINAL_SEGFORMER_NATIVE_SESSION');
  console.log('M244_TRUE_ORIGINAL_OWNER_VS_GRAPH',JSON.stringify(crossPathGate(owner,native,engine)));
 }
}
