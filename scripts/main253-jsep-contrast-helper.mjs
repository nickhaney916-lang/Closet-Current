/**
 * M253: disposable ORIGINAL P94/JSEP native memory-pattern ON vs OFF.
 * Builds on exact verified M251 native export witness. No consumer edits,
 * model substitutions, synthetic logits, automatic approvals or retries.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
export const BASE_M251_RUNNER_SHA='887e1e8fa6cc24919450f53612dc6b35b3a1aefe';
export const BASE_M251_NATIVE_PROBE_SHA='c1061567b01ec9f6ceb60c7336d38294d6c3f8a4';
export const ORIGINAL_JSEP_SHA253='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
export const ORIGINAL_PHOTO_SHA253='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const one=(s,needle,label)=>assert.equal(s.split(needle).length,2,label+' exact-original source anchor absent or duplicated');
export function require253Arm(arm){assert.ok(['pattern_off','pattern_on'].includes(arm),'M253 requires genuinely differing explicit memPattern flags');return arm;}
export function deriveM253OriginalRunner(original){
 assert.equal(typeof original,'string');
 assert.equal(blob(Buffer.from(original)),BASE_M251_RUNNER_SHA,'Original successful M251 source changed');
 const oldArm="assert.ok(['baseline','pattern_off'].includes(m251Arm),'M251 only default native option or one memory-pattern request');";
 one(original,oldArm,'genuine M251 option arm');
 let s=original.replace(oldArm,"assert.ok(['pattern_off','pattern_on'].includes(m251Arm),'M253 explicit true/false arms only');");
 const workerGuard='assert.ok(observedWorker.includes("device:\'wasm\',dtype:\'fp32\'"));';
 one(s,workerGuard,'original fp32 SegFormer');
 const addition=[
  "if(m251Arm==='pattern_on')observedWorker=observedWorker.replace(m251ModelAnchor,",
  ' "from_pretrained(modelId,{revision,device:\'wasm\',dtype:\'fp32\',session_options:{enableMemPattern:true},progress_callback:");',
  "assert.equal(observedWorker.includes('session_options:{enableMemPattern:'+(m251Arm==='pattern_on'?'true':'false')+'}'),true,'M253 original Worker explicit native arm missing');",
 ].join('\n');
 s=s.replace(workerGuard,addition+'\n'+workerGuard);
 const target="const review251=\" assert.ok(/unverified region/.test(state.status),'Never call the proposals confirmed');\";";
 one(s,target,'owner unverified-proposal stage');
 const originalImport="import {instrumentM251OriginalJsepGlue,verifyM251OriginalNativeOptionReceipt} from './main251-original-jsep-abi-probe.mjs';";
 const m253Import="import {verifyM253ActualOptionReceipt} from './main253-jsep-contrast-helper.mjs';";
 const insert=[
  'const m253ImportAnchor='+JSON.stringify(originalImport)+';',
  "assert.equal(source.split(m253ImportAnchor).length,2,'Original native JSEP source-only verifier import moved');",
  'source=source.replace(m253ImportAnchor,m253ImportAnchor+"\\n"+'+JSON.stringify(m253Import)+');'
 ].join('\n');
 s=s.replace(target,insert+'\n'+target);
 const oldVerify='verifyM251OriginalNativeOptionReceipt(m251NativeEvents[0],{engine,arm:m251Arm})';
 one(s,oldVerify,'actual native source observer call');
 s=s.replace(oldVerify,'verifyM253ActualOptionReceipt(m251NativeEvents[0],{engine,arm:m251Arm})');
 assert.equal(s.split('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI').length,3,'Actual source marker and guard changed');
 s=s.replaceAll('M251_REAL_ORIGINAL_JSEP_NATIVE_ABI','M253_REAL_ORIGINAL_JSEP_NATIVE_ABI');
 const widthAnchor="P94_WIDTH:'390'";
 one(s,widthAnchor,'original real 390px viewport');
 s=s.replace(widthAnchor,"P94_WIDTH:String(process.env.M253_WIDTH||'390')");
 assert.ok(s.includes('K.Ha')===false,'Do not modify native JSEP WASM in the outer test runner');
 assert.ok(s.includes('M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY'),'Original genuine same-run JSEP source attestation missing');
 assert.ok(s.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'),'Original real private owner v4 acceptance missing');
 return s;
}
export async function verifiedM253OriginalRunner(){
 const [runner,probe,worker]=await Promise.all([
 readFile('scripts/test-main251-original-jsep-native-option-browser.mjs'),
 readFile('scripts/main251-original-jsep-abi-probe.mjs'),
 readFile('public/outfit-worker-p94.mjs')
 ]);
 assert.equal(blob(probe),BASE_M251_NATIVE_PROBE_SHA,'Original native export probe changed');
 assert.equal(blob(worker),'d66651b616de54c51eb7ef986324b30f1580888f','Original consumer Worker changed');
 return deriveM253OriginalRunner(runner.toString('utf8'));
}
export function verifyM253ActualOptionReceipt(record,{engine,arm}){
 require253Arm(arm);
 assert.ok(['webkit','chromium'].includes(engine));
 assert.equal(record?.phase,'m251_native_option','Original compiled JSEP native call missing');
 assert.equal(record.actualExportCalled,true);
 assert.equal(record.argCount,10);
 assert.equal(record.handleReturned,true);
 assert.equal(record.cpuArena,false,'Original JSEP CPU arena native arg drift');
 assert.equal(typeof record.memPattern,'boolean','Native memPattern must be observed, not guessed');
 assert.equal(record.memPattern,arm==='pattern_on','Native ABI actual memory-pattern flag does not match the requested contrast');
 return {
  schema:'M253_GENUINE_ORIGINAL_JSEP_WASM_NATIVE_MEMPATTERN_CONTRAST/v1',
  engine,arm,
  actualCompiledWasmExportInvoked:true,
  nativeMemPatternFlagObserved:record.memPattern,
  nativeCpuArenaFlagObserved:false,
  tenOriginalWasmAbiArgumentsForwarded:true,
  genuineNativeOptionsHandleReturned:true,
  pinnedOriginalJsepWasmUnchanged:true,
  researchOnlyJsepJavascriptLoaderInstrumented:true,
  nativeCppHeapPolicyRead:false,
  naturalRedBeforeGreenAfterProven:false,
  permanentWebkitRepairProven:false,
  releaseAuthorized:false,familyAlphaHold:true
 };
}
function oneReceipt(stdout,label){
 const lines=String(stdout||'').split(/\r?\n/).filter(x=>x.startsWith(label+' '));
 assert.equal(lines.length,1,'Original receipt missing, ambiguous or duplicated: '+label);
 const json=lines[0].slice(label.length+1);
 assert.ok(json.length<6500,'Original bounded source/owner receipt oversize');
 const parsed=JSON.parse(json);
 assert.ok(parsed&&typeof parsed==='object'&&!Array.isArray(parsed));
 return parsed;
}
export function classifyM253NativeAttempt({stdout,status,signal,arm,engine,width,attempt}){
 require253Arm(arm);assert.ok(['webkit','chromium'].includes(engine));
 assert.ok([320,390].includes(width));
 assert.ok(Number.isInteger(attempt)&&attempt>=1&&attempt<=3);
 const result={
  schema:'M253_ACTUAL_ORIGINAL_JSEP_FIRST_ATTEMPT/v1',
  engine,arm,width,attempt,
  firstFreshOriginalProcess:true,originalExitWasZero:status===0&&!signal,
  observedNativeFlag:null,realNativeCallVerified:false,
  actualBrowserJsepBodyShaVerified:false,
  genuineSourcePhotoAndPrivateOwner2DV4:false,
  originalModelPositive:false,
  naturalRuntimeFailureCauseProven:false,
  permanentRepairProven:false,releaseAuthorized:false,familyAlphaHold:true
 };
 try{
  const native=oneReceipt(stdout,'M253_REAL_ORIGINAL_JSEP_NATIVE_ABI');
  const real=oneReceipt(stdout,'M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY');
  const owner=oneReceipt(stdout,'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS');
  const privacy=oneReceipt(stdout,'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY');
  const mem=oneReceipt(stdout,'M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT');
  const proven=verifyM253ActualOptionReceipt({
   ...native,phase:'m251_native_option',
   actualExportCalled:native.actualCompiledWasmExportInvoked,
   argCount:native.tenOriginalWasmAbiArgumentsForwarded?10:0,
   handleReturned:native.genuineNativeOptionsHandleReturned,
   cpuArena:native.nativeCpuArenaFlagObserved,
   memPattern:native.nativeMemPatternFlagObserved
  },{engine,arm});
  result.observedNativeFlag=proven.nativeMemPatternFlagObserved;
  result.realNativeCallVerified=true;
  result.actualBrowserJsepBodyShaVerified=engine==='webkit'&&real.actualOriginalBrowserJsepBodyHash===true;
  const binary=real.originalJsepWasmSha256===ORIGINAL_JSEP_SHA253&&real.originalModelSessionReady===true&&
   (engine!=='webkit'||result.actualBrowserJsepBodyShaVerified);
  const localOwner=owner.engine===engine&&owner.modelExecuted===true&&
   owner.manualSyntheticOwnerConfirmed===true&&owner.ownerPrivateSaved===1&&
   owner.exactOriginalSHA256===ORIGINAL_PHOTO_SHA253&&owner.tamperDenied===true&&
   owner.otherOwnerDenied===true&&owner.atomicRestore===true&&owner.actualV4BrowserDownload===true&&
   owner.hostedRLS===false&&owner.releaseAuthorized===false;
  const isolated=privacy.engine===engine&&privacy.realWorkerFirst===true&&privacy.ownerBPrivateRows===0&&
   privacy.ownerAOriginalNotVisibleToB===true&&privacy.ownerAOutfitNotVisibleToB===true;
  result.genuineSourcePhotoAndPrivateOwner2DV4=localOwner&&isolated;
  result.originalModelPositive=result.originalExitWasZero&&binary&&
   mem.outcome==='ready'&&mem.growCalls>0&&mem.growErrors===0&&
   result.genuineSourcePhotoAndPrivateOwner2DV4;
 }catch{
  result.category='original_failed_or_missing_native_model_owner_evidence';
 }
 result.originalFailurePreserved=!result.originalModelPositive;
 return result;
}
