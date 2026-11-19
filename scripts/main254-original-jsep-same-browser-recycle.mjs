/**
 * M254: reuse ONE actual WebKit/Chromium browser process across TWO separate,
 * original, full P94/JSEP Worker-to-owner private flows in new browser contexts.
 * Experimental harness only. No modifications to consumer Worker/model/WASM.
 * Distinct from M253's independent new-browser-per-attempt cohort.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const M254_DONOR='2ee136d3ee78f5a57554a022efb8ce943b8edf5c';
export const M254_M251_BLOB='887e1e8fa6cc24919450f53612dc6b35b3a1aefe';
export const M254_ORIGINAL_BROWSER_BLOB='4f75a40cf153fa4b4d139d782b202dbe7bc55e41';
export const M254_ORIGINAL_WORKER_BLOB='d66651b616de54c51eb7ef986324b30f1580888f';
export const M254_JSEP_SHA='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const gitBlob=value=>{
 const b=Buffer.isBuffer(value)?value:Buffer.from(value,'utf8');
 return createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
};
const unique=(src,needle,replacement,label)=>{
 assert.equal(src.split(needle).length,2,'M254 original pinned source moved or duplicated: '+label);
 return src.replace(needle,replacement);
};
export function deriveM254SameBrowserFixture(source){
 assert.equal(typeof source,'string');
 assert.ok(source.includes("M251_REAL_ORIGINAL_JSEP_NATIVE_ABI"),'Missing real native export evidence');
 assert.ok(source.includes("M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS"),'Missing owner/private v4 gate');
 assert.ok(source.includes("M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY"),'Missing original JSEP source gate');
 // Original product Worker Git blob is attested by the OUTER M251 runner and CI;
 // the inner original browser source carries only the derived Worker bytes.
 assert.ok(source.includes('const m247ObservedWorker='),'Original source-derived Worker body missing');
 assert.ok(source.includes("browser=await browserType.launch("));
 assert.equal(source.split("browser=await browserType.launch(").length,2,
  'Exactly one actual original native browser launch allowed');
 let s=unique(source,
  " const context=await browser.newContext({",
  [
   " const m254BrowserIdentity=browser;",
   " for(let m254Cycle=1;m254Cycle<=2;m254Cycle++){",
   "  assert.equal(browser,m254BrowserIdentity,'M254 browser process secretly replaced');",
   "  assert.ok(browser.isConnected(),'M254 original browser disconnected');",
   "  // Clear only disposable diagnostic/auth-fixture state between isolated",
   "  // contexts. Do NOT modify the original Worker, model, WASM or credentials.",
   "  for(const a of [external,rejected,issues,modelResponses,",
   "   navigationReasonsM69,mainFrameNavigationsM69,documentLifecycle91,",
   "   m247PublicAssets,m247PublicPending])a.length=0;",
   "  issuedSyntheticRefreshM72.clear();",
   "  stage='m254-original-context-'+m254Cycle;",
   "  console.log('M254_ORIGINAL_BROWSER_CYCLE_START '+JSON.stringify({",
   "   engine,width,cycle:m254Cycle,sameBrowserProcess:true,",
   "   originalWorkerAltered:false,releaseAuthorized:false,familyAlphaHold:true}));",
   " const context=await browser.newContext({"
  ].join('\n'),
  'start new isolated same-process original context');
 s=unique(s,
  " await context.close();\n}catch(e){",
  [
   " await context.close();",
   " console.log('M254_ORIGINAL_BROWSER_CYCLE_PASS '+JSON.stringify({",
   "  engine,width,cycle:m254Cycle,sameBrowserProcess:browser===m254BrowserIdentity,",
   "  originalOwnerV4Reached:true,contextClosedAfterRealOwnerJourney:true,",
   "  releaseAuthorized:false,familyAlphaHold:true}));",
   " }",
   "}catch(e){"
  ].join('\n'),
  'original full owner completion and context cleanup');
 assert.ok(s.includes("M58_REAL_P88_WORKER_FAIL"),'Original failure exit path removed');
 assert.ok(s.includes("await browser?.close();"),'Original browser final cleanup removed');
 assert.equal(s.split("browser=await browserType.launch(").length,2);
 assert.equal(s.split('M254_ORIGINAL_BROWSER_CYCLE_START').length,2);
 assert.equal(s.split('M254_ORIGINAL_BROWSER_CYCLE_PASS').length,2);
 return s;
}
export function deriveM254PinnedM251Runner(original){
 assert.equal(gitBlob(original),M254_M251_BLOB,'M251 actual native WebKit original runner modified');
 let s=unique(original,
  "import {spawnSync} from 'node:child_process';",
  "import {spawnSync} from 'node:child_process';\nimport {deriveM254SameBrowserFixture} from './main254-original-jsep-same-browser-recycle.mjs';",
  'real M251 research import');
 s=unique(s,
  "const temporary=resolve('scripts/.m251-original-jsep-native-option-browser.mjs');",
  "source=deriveM254SameBrowserFixture(source);\nconst temporary=resolve('scripts/.m254-original-jsep-same-browser-fixture.mjs');",
  'original M251 source derivation');
 assert.ok(s.includes("deriveOriginalP94JsepObserver"));
 assert.ok(s.includes("M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY"));
 assert.ok(s.includes('instrumentM251OriginalJsepGlue'));
 assert.ok(s.includes("assert.equal(gitBlob(originalWorker),ORIGINAL_WORKER_BLOB"));
 return s;
}
function one(stdout,marker){
 assert.equal(typeof stdout,'string');
 assert.ok(stdout.length<=24*1024*1024,'Unbounded original output');
 const lines=stdout.split(/\r?\n/).filter(x=>x.startsWith(marker+' '));
 assert.ok(lines.length<=2,'Duplicated/replayed '+marker);
 return lines.map(line=>{
  const payload=line.slice(marker.length+1);
  assert.ok(payload.length<=4800,'Original source/owner receipt exceeds bound');
  const obj=JSON.parse(payload);
  assert.ok(obj&&typeof obj==='object'&&!Array.isArray(obj),'Malformed original browser receipt');
  return obj;
 });
}
export function classifyM254SameBrowser({engine,width,status,signal=null,stdout}){
 assert.ok(['webkit','chromium'].includes(engine),'Actual browser engine required');
 assert.ok([320,390].includes(width),'Only precommitted native viewports');
 assert.ok(status===null||Number.isInteger(status),'Native child exit status required');
 const starts=one(stdout,'M254_ORIGINAL_BROWSER_CYCLE_START');
 const cycles=one(stdout,'M254_ORIGINAL_BROWSER_CYCLE_PASS');
 const abi=one(stdout,'M251_REAL_ORIGINAL_JSEP_NATIVE_ABI');
 const jsep=one(stdout,'M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY');
 const owners=one(stdout,'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS');
 const privateOwner=one(stdout,'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY');
 const sourceValid=starts.length===2&&starts.every((s,i)=>s.engine===engine&&
  s.width===width&&s.cycle===i+1&&s.sameBrowserProcess===true&&
  s.originalWorkerAltered===false&&s.releaseAuthorized===false&&s.familyAlphaHold===true);
 const cyclesValid=cycles.length===2&&cycles.every((c,i)=>c.engine===engine&&
  c.width===width&&c.cycle===i+1&&c.sameBrowserProcess===true&&
  c.originalOwnerV4Reached===true&&c.contextClosedAfterRealOwnerJourney===true&&
  c.releaseAuthorized===false&&c.familyAlphaHold===true);
 const nativeValid=abi.length===2&&abi.every(a=>a.engine===engine&&
  a.arm==='baseline'&&a.realWasmExportInvoked===true&&a.nativeMemPatternFlag===false&&
  a.genuineReturnedOptionsHandle===true&&a.actualNativeCppMemoryPolicyObserved===false&&
  a.originalJsepMemoryFailureFixed===false&&a.releaseAuthorized===false&&
  a.familyAlphaHold===true);
 const jsepValid=jsep.length===2&&jsep.every(j=>j.originalJsepWasmSha256===M254_JSEP_SHA&&
  j.originalModelSessionReady===true&&(engine!=='webkit'||j.actualOriginalBrowserJsepBodyHash===true));
 const ownerValid=owners.length===2&&owners.every(o=>o.engine===engine&&o.modelExecuted===true&&
  o.manualSyntheticOwnerConfirmed===true&&o.ownerPrivateSaved===1&&o.otherOwnerDenied===true&&
  o.tamperDenied===true&&o.atomicRestore===true&&o.hostedRLS===false&&o.releaseAuthorized===false);
 const isolationValid=privateOwner.length===2&&privateOwner.every(p=>p.engine===engine&&
  p.ownerBPrivateRows===0&&p.ownerAOriginalNotVisibleToB===true&&
  p.ownerAOutfitNotVisibleToB===true&&p.hostedRLS===false&&p.releaseAllowed===false);
 const pass=status===0&&!signal&&sourceValid&&cyclesValid&&nativeValid&&
  jsepValid&&ownerValid&&isolationValid;
 return Object.freeze({
  schema:'M254_REAL_ORIGINAL_JSEP_SAME_BROWSER_CONTEXT_RECYCLE/v1',
  engine,width,independentBrowserProcesses:1,originalFullOwnerContextsRequired:2,
  originalCycleStarts:starts.length,originalCyclePasses:cycles.length,
  originalNativeExportReceipts:abi.length,originalModelJsepReceipts:jsep.length,
  originalPrivateV4OwnerReceipts:owners.length,
  originalPrivateOwnerIsolationReceipts:privateOwner.length,
  singleBrowserProcessReuseVerified:sourceValid&&cyclesValid,
  originalJsepWasmAndSameBrowserIdentityVerified:jsepValid,
  originalWasmNativeDefaultFalseVerified:nativeValid,
  originalOwnerAndPrivacyVerified:ownerValid&&isolationValid,
  fullOriginalSameProcessRecreationPass:!!pass,
  originalNonzeroOrTimeout:status!==0||!!signal,
  category:pass?'genuine_same_browser_two_original_owner_journeys_pass':
    status===null||signal?'original_browser_terminated_or_timed_out':
    'original_model_native_owner_or_session_recycle_red',
  originalCppAllocatorStateRead:false,naturalIntermittentWebkitRootCauseFixed:false,
  noRetries:true,originalShippedWorkerUnchanged:true,
  releaseAuthorized:false,familyAlphaHold:true
 });
}
