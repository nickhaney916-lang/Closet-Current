/**
 * M248 research-only strict summary of independent original P94 JSEP
 * browser processes. Never counts a replay, injected failure, missing
 * receipt, or green test as a repair. Raw logs stay in the runner process.
 */
import assert from 'node:assert/strict';
export const JSEP_SHA='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const markers={
 memory:'M247_ORIGINAL_JSEP_MODEL_MEMORY_EVENT',
 boundary:'M247_REAL_ORIGINAL_P94_JSEP_BOUNDARY',
 owner:'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',
 restore:'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',
 failure:'M58_REAL_P88_WORKER_FAIL'
};
function extract(log,marker){
 if(typeof log!=='string'||log.length>8*1024*1024)throw Error('Unbounded original process output');
 const lines=log.split(/\r?\n/).filter(s=>s.startsWith(marker+' '));
 if(lines.length===0)return [];
 if(lines.length>2)throw Error('Repeated or ambiguous original receipt: '+marker);
 return lines.map(line=>{
  try{return JSON.parse(line.slice(marker.length+1));}
  catch{throw Error('Malformed original evidence receipt: '+marker);}
 });
}
export function classifyOriginalProcess({engine,width,slot,exitCode,signal,stdout='',stderr='',timedOut=false}){
 assert.ok(['webkit','chromium'].includes(engine));
 assert.ok([320,390,430].includes(width));
 assert.ok(Number.isInteger(slot)&&slot>=1&&slot<=64);
 assert.ok(exitCode===null||Number.isInteger(exitCode));
 // Never forward actual log/error text, source JPEG, owner id, URI or memory.
 const memory=extract(stdout,markers.memory);
 const boundary=extract(stdout,markers.boundary);
 const owner=extract(stdout,markers.owner);
 const restore=extract(stdout,markers.restore);
 const failed=extract(stdout,markers.failure);
 const base={schema:'M248_ORIGINAL_P94_FRESH_PROCESS/v1',engine,width,slot,
  originalTrial:true,independentProcess:true,realNativeSession:true,
  userDataLogged:false,liveFamilyAccount:false,
  sourceOriginalAndRealJsepRequired:true,productRuntimeChanged:false,
  originalCppAllocatorObserved:false,causalRepairProven:false,
  releaseAuthorized:false,hold:true};
 const success=exitCode===0&&!signal&&!timedOut;
 if(!success){
  assert.ok(failed.length<=1&&memory.length<=1&&boundary.length<=1&&owner.length<=1&&restore.length<=1,
   'Ambiguous failed genuine process');
  const m=memory[0]||null;
  const f=failed[0]||null;
  return {...base,status:'RED',exitStatus:exitCode,
   timeout:timedOut,signalTerminated:!!signal,
   stage:typeof f?.stage==='string'&&/^[a-z0-9-]{1,80}$/.test(f.stage)?f.stage:'unknown',
   workerModelTerminal:m?.outcome==='error'?'error':m?.outcome==='ready'?'ready':'unobserved',
   nativeGrowCalls:Number.isInteger(m?.growCalls)?m.growCalls:null,
   firstPages:Number.isInteger(m?.firstPages)?m.firstPages:null,
   terminalPages:Number.isInteger(m?.terminalPages)?m.terminalPages:null,
   originalJsepAttestedOnFailure:boundary.length===1&&boundary[0].originalJsepWasmSha256===JSEP_SHA,
   genuineWebkitMemoryAccessRedProven:false, // classification does not see native C++ error class
   originalOwnerAndRestoreAccepted:false};
 }
 assert.equal(memory.length,1,'Genuine original success missing model memory receipt');
 assert.equal(boundary.length,1,'Genuine original success missing source-bound JSEP receipt');
 assert.equal(owner.length,1,'Genuine original success missing strict owner-B privacy receipt');
 assert.equal(restore.length,1,'Genuine original success missing lossless original v4 receipt');
 assert.equal(failed.length,0,'Genuine original success conflicts with failure');
 const m=memory[0],v=boundary[0],o=owner[0],z=restore[0];
 assert.equal(m.outcome,'ready');assert.equal(m.hookInstalled,true);
 assert.ok(m.growCalls>0&&m.validTargets>0&&m.firstPages>0&&m.terminalPages>=m.firstPages);
 assert.equal(v.schema,'M247_TRUE_ORIGINAL_P94_JSEP_SESSION_HEAP/v1');
 assert.equal(v.engine,engine);
 assert.equal(v.originalModelSessionReady,true);
 assert.equal(v.actualOriginalP94SegFormerModel,true);
 assert.equal(v.originalJsepWasmName,'ort-wasm-simd-threaded.jsep.wasm');
 assert.equal(v.originalJsepWasmSha256,JSEP_SHA);
 assert.equal(v.jsMemoryGrowCalls,m.growCalls);
 assert.equal(v.firstObservedPages,m.firstPages);
 assert.equal(v.terminalPages,m.terminalPages);
 if(engine==='webkit')assert.equal(v.actualOriginalBrowserJsepBodyHash,true);
 assert.equal(v.realRedToGreenFixProven,false);
 assert.equal(v.releaseAuthorized,false);
 assert.ok(v.originalPhotoReviewCardCount>0&&v.originalPhotoReviewCardCount<=12);
 assert.equal(o.engine,engine);assert.equal(o.ownerBPrivateRows,0);
 assert.equal(o.ownerAOriginalNotVisibleToB,true);
 assert.equal(o.ownerAOutfitNotVisibleToB,true);
 assert.equal(o.explicitOwnerASave,1);
 assert.equal(z.engine,engine);assert.equal(z.manualSyntheticOwnerConfirmed,true);
 assert.equal(z.ownerPrivateSaved,1);assert.equal(z.restoredSavedOutfitCount,1);
 assert.equal(z.atomicRestore,true);assert.equal(z.tamperDenied,true);
 return {...base,status:'PASS',originalJsepBrowserHashDirect:!!v.actualOriginalBrowserJsepBodyHash,
  originalJsepSha256:v.originalJsepWasmSha256,realUnverifiedProposalCount:v.originalPhotoReviewCardCount,
  workerModelTerminal:'ready',nativeGrowCalls:m.growCalls,
  firstPages:m.firstPages,terminalPages:m.terminalPages,
  originalOwnerAndRestoreAccepted:true,
  genuineWebkitMemoryAccessRedProven:false};
}
export function summarizeFreshAttempts(attempts,{engine,width,batch,requested}){
 assert.ok(Array.isArray(attempts)&&attempts.length===requested&&requested>=1&&requested<=12);
 assert.ok(['webkit','chromium'].includes(engine)&&[320,390,430].includes(width));
 assert.ok(typeof batch==='string'&&/^[a-zA-Z0-9_-]{1,16}$/.test(batch));
 const slots=new Set();
 for(const a of attempts){
  assert.equal(a.engine,engine);assert.equal(a.width,width);
  assert.ok(!slots.has(a.slot),'Duplicate/replayed process slot');slots.add(a.slot);
 }
 const red=attempts.filter(a=>a.status==='RED'),passed=attempts.filter(a=>a.status==='PASS');
 assert.equal(red.length+passed.length,attempts.length,'Unclassified original attempt');
 return {schema:'M248_ORIGINAL_JSEP_NATURAL_RED_COHORT/v1',engine,width,batch,
  requestedIndependentBrowserProcesses:requested,actualIndependentBrowserProcesses:attempts.length,
  originalModelPasses:passed.length,originalModelReds:red.length,
  realNativeRedObserved:red.length>0,
  nativeMemoryAccessRootCauseProven:false,permanentRepairProven:false,
  fullOriginalPrivacyPasses:passed.length,
  modelChanged:false,workerChanged:false,originalJsepUnchanged:true,
  originalHashAttestedPositiveCount:passed.filter(a=>a.originalJsepBrowserHashDirect).length,
  trials:attempts,releaseAuthorized:false,familyAlphaHold:true};
}
