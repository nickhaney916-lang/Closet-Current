import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {deriveM269,classifyM269,summarizeM269} from
 '../research/main1054/m269-webkit-graph-optimization-runtime-ab.mjs';

const original=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
const worker=readFileSync('public/outfit-worker-p94.mjs','utf8');
const pin='ab7d3837139c5b7d693383f9d6617e199ec8de4f';
const wasm='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const onnx='02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3';
const jpeg='1'.repeat(64);
const signal=(label,data)=>label+' '+JSON.stringify(data);
const id=(x={})=>({checkout:'a'.repeat(40),engine:'webkit',width:390,
 runId:'44602213150',job:'m269-graph-ab',runAttempt:1,exitCode:0,
 lockedJpegSha:jpeg,...x});
function log({
 arm='baseline',nativeRed=false,orphan=false,hardHttp=false,
 unreadable=false,otherSource=false,skipOwner=false
}={}){
 const lines=[
  signal('M269_RUNTIME_SOURCE_ARM',{
   schema:'MAIN1054_M269_ORIGINAL_P94_GRAPH_OPTIMIZATION_AB_V1',
   arm,originalWorkerGitBlob:pin,
   modifiedOriginalWorkerOnlyInDisposableBrowser:arm==='graph_opt_disabled',
   option:arm==='graph_opt_disabled'?'graphOptimizationLevel:disabled':'original-no-session-options',
   model:'Xenova/segformer_b0_clothes',
   revision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',
   inferenceProvider:'wasm-fp32',originalModelPreserved:true,
   originalPositiveAssertionUnchanged:true,sourceEvidenceGate:'BLOCKED',
   permanentWebKitFixProven:false,releaseAuthorized:false,familyAlpha:'HOLD'
  })
 ];
 if(!skipOwner)lines.push(
  signal('M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',{
   engine:'webkit',sourceSHA256:jpeg,realWorker:true,modelRequests:8,
   saved:0,hold:true}),
  signal('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',{
   engine:'webkit',modelExecuted:true,
   manualSyntheticOwnerConfirmed:true,ownerPrivateSaved:1,
   exactOriginalSHA256:jpeg,realNativeOutfit:true,
   savedOutfitOwnerAction:true,restoredSavedOutfitCount:1,
   actualV4BrowserDownload:true,tamperDenied:true,otherOwnerDenied:true,
   cancelledRestoreUnchanged:true,atomicRestore:true,threeDAuthorized:false,
   hostedRLS:false,familyAlpha:'HOLD'}),
  signal('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',{
   engine:'webkit',realWorkerFirst:true,explicitOwnerASave:1,
   ownerBPrivateRows:0,ownerAOriginalNotVisibleToB:true,
   ownerAOutfitNotVisibleToB:true,localIndexedDBOnly:true,
   syntheticAuth:true,hostedRLS:false,
   releaseAllowed:false,familyAlpha:'HOLD'}),
  signal('P91_FULL_JOURNEY_PASS',{
   engine:'webkit',uninterruptedSourceExportRestore:true,
   writeRetries:0,ownerRecovery:true,originalPhotoByteTamperRefused:true,
   familyAlpha:'HOLD',releaseAuthorized:false})
 );
 if(nativeRed)lines.push('M58_REAL_P88_WORKER_FAIL {"stage":"model_session_load"}');
 const rows=[
  unreadable?{kind:'jsep-wasm',status:'body-unavailable',chainId:1}:
  {kind:'jsep-wasm',status:'body-observed',sha256:wasm,size:21596019,chainId:1},
  {kind:'model-onnx',status:'non-200',httpStatus:307,hasLocation:true,chainId:2},
  unreadable?{kind:'model-onnx',status:'body-unavailable',chainId:orphan?3:2}:
  {kind:'model-onnx',status:'body-observed',sha256:onnx,size:15199746,chainId:orphan?3:2}
 ];
 if(hardHttp)rows.push({kind:'jsep-wasm',status:'non-200',
  httpStatus:404,hasLocation:false,chainId:4});
 lines.push(signal('M259_CONTEXT_NETWORK_WITNESS',{
  schema:'M259_CONTEXT_NETWORK_V1',
  engine:'webkit',width:390,rows,
  wasmNetworkMatch:!unreadable,modelNetworkObserved:!unreadable,
  compiledWasmAttested:false,loadedModelAttested:false,
  sameNativeProcessProven:false,sourceEvidenceGate:'BLOCKED',
  familyAlpha:'HOLD'
 }));
 return lines.join('\n');
}
test('baseline derived runner uses unchanged original Worker: no ORT option injection',()=>{
 const b=deriveM269(original,worker,'baseline');
 assert.match(b,/M269_RUNTIME_SOURCE_ARM/);
 assert.ok(b.includes("const body=await readFile(absolute);"));
 assert.ok(!b.includes("session_options:{graphOptimizationLevel:'disabled'}"));
 assert.ok(b.includes("actualWorkerSourceBlob:'"+pin+"'"));
 assert.ok(b.includes("Genuine P88 browser worker did not produce a bounded actual model proposal"));
});
test('candidate changes only disposable original worker ONNX graph optimization, never source model/owner assertions',()=>{
 const b=deriveM269(original,worker,'baseline');
 const c=deriveM269(original,worker,'graph_opt_disabled');
 assert.ok(c.includes("session_options:{graphOptimizationLevel:'disabled'}"));
 assert.equal(c.split("session_options:{graphOptimizationLevel:'disabled'}").length,2);
 assert.ok(c.includes("actualWorkerSourceBlob:'m269-disposable-graph-optimization-disabled-not-shipped'"));
 assert.ok(c.includes("const body=path==='/public/outfit-worker-p94.mjs'?Buffer.from("));
 assert.ok(c.includes("Xenova/segformer_b0_clothes"));
 assert.ok(c.includes("a2489ea8e7ec1ee912190546bad31a4906ccca76"));
 assert.ok(c.includes("device:'wasm',dtype:'fp32'"));
 assert.ok(c.includes("Genuine P88 browser worker did not produce a bounded actual model proposal"));
 assert.ok(c.includes("sourceSHA256"));
 assert.ok(c.includes("native owner saved outfit uses photo-only 2D fallback"));
 assert.notEqual(b,c);
 assert.equal(worker.includes("session_options:{graphOptimizationLevel:'disabled'}"),false);
});
test('both disposable derived browser ESM programs pass Node syntax check',()=>{
 const dir=mkdtempSync(join(tmpdir(),'m269-'));
 try{
  for(const arm of ['baseline','graph_opt_disabled']){
   const file=join(dir,arm+'.mjs');
   writeFileSync(file,deriveM269(original,worker,arm));
   const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
   assert.equal(result.status,0,result.stderr);
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('original source drift, altered Worker, unknown arm prohibited',()=>{
 assert.throws(()=>deriveM269(original+'x',worker,'baseline'));
 assert.throws(()=>deriveM269(original,worker+'x','baseline'));
 assert.throws(()=>deriveM269(original,worker,'fixed_forever'));
});
test('unmodified original runtime healthy source/owner PASS stays unproven',()=>{
 const x=classifyM269(log(),id(),1,'baseline');
 assert.equal(x.originalResult,'PASS');
 assert.equal(x.originalRuntimeUnmodified,true);
 assert.equal(x.graphOptimizationDisabledInDisposableWorker,false);
 assert.equal(x.graphOptimizationCausalRepairProven,false);
 assert.equal(x.permanentWebKitFixProven,false);
 assert.equal(x.sourceEvidenceGate,'BLOCKED');
});
test('experimental candidate healthy original model still DOES NOT prove permanent fix',()=>{
 const x=classifyM269(log({arm:'graph_opt_disabled'}),id(),1,'graph_opt_disabled');
 assert.equal(x.originalResult,'PASS');
 assert.equal(x.originalRuntimeUnmodified,false);
 assert.equal(x.graphOptimizationDisabledInDisposableWorker,true);
 assert.equal(x.optimizerNativeEffectConfirmed,false);
 assert.equal(x.permanentWebKitFixProven,false);
 assert.equal(x.nativeCompiledJsepSHA256,null);
 assert.equal(x.originalOnnxNetworkSHA256,onnx);
});
test('original Worker RED is preserved exactly in both arms despite correct network hashes',()=>{
 for(const arm of ['baseline','graph_opt_disabled']){
  const x=classifyM269(log({arm,nativeRed:true}),id({exitCode:1}),1,arm);
  assert.equal(x.originalResult,'FAIL');
  assert.equal(x.sourceEvidenceGate,'FAIL');
  assert.equal(x.naturalOriginalWorkerRedCandidate,true);
  assert.equal(x.originalOnnxNetworkSHA256,null);
  assert.equal(x.permanentWebKitFixProven,false);
 }
});
test('native child hang timeout classified FAIL without invented allocator cause',()=>{
 const x=classifyM269(log(),id({exitCode:124}),1,'baseline');
 assert.equal(x.originalResult,'FAIL');
 assert.equal(x.naturalOriginalWorkerRedCandidate,false);
 assert.equal(x.causalPermanentWebKitFixProven,false);
});
test('contradictory arm marker or injection marker cannot produce PASS',()=>{
 assert.throws(()=>classifyM269(log({arm:'graph_opt_disabled'}),id(),1,'baseline'));
 assert.throws(()=>classifyM269(log().replace('graphOptimizationLevel:disabled','graphOptimizationLevel:all'),id(),1,'not_an_arm'));
 const bad=log().replace('"originalPositiveAssertionUnchanged":true','"originalPositiveAssertionUnchanged":false');
 assert.throws(()=>classifyM269(bad,id(),1,'baseline'));
});
test('orphan redirected model and original JSEP 404 remain FAIL in both arms',()=>{
 for(const arm of ['baseline','graph_opt_disabled']){
  const orphan=classifyM269(log({arm,orphan:true}),id(),1,arm);
  const bad=classifyM269(log({arm,hardHttp:true}),id(),1,arm);
  assert.equal(orphan.originalResult,'FAIL');
  assert.equal(bad.originalResult,'FAIL');
 }
});
test('missing owner evidence remains BLOCKED even with canonical original network bytes',()=>{
 assert.equal(classifyM269(log({skipOwner:true}),id(),1,'baseline').originalResult,'BLOCKED');
});
test('all good finite experimental samples cannot certify a permanent fix',()=>{
 const cfg={checkout:'a'.repeat(40),runId:'44602213150',
  engine:'webkit',width:390,count:2,arm:'graph_opt_disabled'};
 const one=classifyM269(log({arm:'graph_opt_disabled'}),id(),1,'graph_opt_disabled');
 const two=classifyM269(log({arm:'graph_opt_disabled'}),id(),2,'graph_opt_disabled');
 const x=summarizeM269([one,two],cfg);
 assert.equal(x.outcome,'PASS');
 assert.equal(x.trueOriginalModelAndOwnerPositiveJourneys,2);
 assert.equal(x.permanentWebKitFixProven,false);
 assert.equal(x.optimizerNativeEffectConfirmed,false);
 assert.equal(x.releaseAuthorized,false);
});
test('genuine single native memory/red original Worker failure poisons entire predeclared cohort',()=>{
 const cfg={checkout:'a'.repeat(40),runId:'44602213150',
  engine:'webkit',width:390,count:2,arm:'baseline'};
 const a=classifyM269(log(),id(),1,'baseline');
 const b=classifyM269(log({nativeRed:true}),id({exitCode:1}),2,'baseline');
 const x=summarizeM269([a,b],cfg);
 assert.equal(x.outcome,'FAIL');
 assert.equal(x.genuineOriginalFailedJourneys,1);
 assert.equal(x.naturalWorkerReds,1);
});
test('missing, duplicate, different-arm, retry, source SHA and forged release admission refused',()=>{
 const cfg={checkout:'a'.repeat(40),runId:'44602213150',
  engine:'webkit',width:390,count:2,arm:'baseline'};
 const a=classifyM269(log(),id(),1,'baseline');
 const b=classifyM269(log(),id(),2,'baseline');
 assert.throws(()=>summarizeM269([a],cfg));
 assert.throws(()=>summarizeM269([a,a],cfg));
 assert.throws(()=>summarizeM269([a,{...b,arm:'graph_opt_disabled'}],cfg));
 assert.throws(()=>summarizeM269([a,{...b,runAttempt:2}],cfg));
 assert.throws(()=>summarizeM269([a,{...b,nativeCompiledJsepSHA256:wasm}],cfg));
 assert.throws(()=>summarizeM269([a,{...b,releaseAuthorized:true}],cfg));
});
