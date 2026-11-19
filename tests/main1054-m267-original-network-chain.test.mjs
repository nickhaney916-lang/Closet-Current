import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {deriveM267,assessM267,verifyM267} from '../research/main1054/m267-original-network-redirect-chain.mjs';
import {verifyM265} from '../research/main1054/m265-original-jsep-http-truth.mjs';
import {EXPECTED_ONNX_SHA256,EXPECTED_ONNX_BYTES} from '../research/main1054/m262-original-onnx-byte-identity.mjs';
import {JSEP_SHA,JSEP_BYTES} from '../research/main1054/m265-original-jsep-http-truth.mjs';
const jpeg='b'.repeat(64);
const ident=(extra={})=>({
 checkout:'a'.repeat(40),engine:'webkit',width:390,runId:'44597639090',
 runAttempt:1,exitCode:0,job:'original-native',lockedJpegSha:jpeg,...extra
});
const jsep=(chainId=1)=>({kind:'jsep-wasm',status:'body-observed',sha256:JSEP_SHA,size:JSEP_BYTES,chainId});
const model=(chainId=2)=>({kind:'model-onnx',status:'body-observed',sha256:EXPECTED_ONNX_SHA256,size:EXPECTED_ONNX_BYTES,chainId});
const redirect=(kind,chainId,status=307)=>({kind,status:'non-200',httpStatus:status,hasLocation:true,chainId});
const unavailable=(kind,chainId)=>({kind,status:'body-unavailable',chainId});
const receipt=(label,data)=>label+' '+JSON.stringify(data);
function log({engine='webkit',rows=[jsep(),redirect('model-onnx',2),model()],
 positive=true,fail=false,extra='',net={}}={}){
 const lines=[];
 if(positive)lines.push(
  receipt('M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',{
   engine,sourceSHA256:jpeg,realWorker:true,modelRequests:9,saved:0,hold:true
  }),
  receipt('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',{
   engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,ownerPrivateSaved:1,
   exactOriginalSHA256:jpeg,realNativeOutfit:true,savedOutfitOwnerAction:true,
   restoredSavedOutfitCount:1,actualV4BrowserDownload:true,tamperDenied:true,
   otherOwnerDenied:true,cancelledRestoreUnchanged:true,atomicRestore:true,
   threeDAuthorized:false,hostedRLS:false,familyAlpha:'HOLD'
  }),
  receipt('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',{
   engine,realWorkerFirst:true,explicitOwnerASave:1,ownerBPrivateRows:0,
   ownerAOriginalNotVisibleToB:true,ownerAOutfitNotVisibleToB:true,
   localIndexedDBOnly:true,syntheticAuth:true,hostedRLS:false,
   releaseAllowed:false,familyAlpha:'HOLD'
  }),
  receipt('P91_FULL_JOURNEY_PASS',{
   engine,uninterruptedSourceExportRestore:true,writeRetries:0,ownerRecovery:true,
   originalPhotoByteTamperRefused:true,familyAlpha:'HOLD',releaseAuthorized:false
  })
 );
 if(fail)lines.push('M58_REAL_P88_WORKER_FAIL {"reason":"original JSEP model load failed"}');
 lines.push(receipt('M259_CONTEXT_NETWORK_WITNESS',{
  schema:'M259_CONTEXT_NETWORK_V1',engine,width:390,rows,
  wasmNetworkMatch:rows.some(x=>x.kind==='jsep-wasm'&&x.status==='body-observed'&&x.sha256===JSEP_SHA),
  modelNetworkObserved:rows.some(x=>x.kind==='model-onnx'&&x.status==='body-observed'),
  compiledWasmAttested:false,loadedModelAttested:false,sameNativeProcessProven:false,
  sourceEvidenceGate:'BLOCKED',familyAlpha:'HOLD',...net
 }));
 if(extra)lines.push(extra);
 return lines.join('\n');
}
test('derive frozen native source only, preserve original Worker and carry original browser root ID',()=>{
 const original=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
 const derived=deriveM267(original);
 assert.match(derived,/m267RootIds=new WeakMap/);
 assert.match(derived,/root.redirectedFrom\(\)/);
 assert.match(derived,/chainId:m267ChainId\(res.request\(\)\)/);
 assert.doesNotMatch(original,/m267RootIds/);
 assert.doesNotMatch(derived,/m267RootIds.*get.*url\(/);
 assert.throws(()=>deriveM267(original+'\n// changed'),/source hash changed/);
 const folder=mkdtempSync(join(tmpdir(),'m267-source-'));
 try{
  const file=join(folder,'derived.mjs');writeFileSync(file,derived);
  const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  assert.equal(check.status,0,check.stderr);
 }finally{rmSync(folder,{recursive:true,force:true});}
});
test('same actual model 307 root and original model SHA body succeeds but remains PARTIAL network proof',()=>{
 const r=verifyM267(log(),ident());
 assert.equal(r.originalJourneyGate,'PASS');
 assert.equal(r.redirectChainGate,'LINKED');
 assert.equal(r.modelRedirectChains,1);
 assert.equal(r.jsepRedirectChains,0);
 assert.equal(r.modelChains,1);
 assert.equal(r.jsepChains,1);
 assert.equal(r.originalModelNetworkGate,'PARTIAL');
 assert.equal(r.originalJsepNetworkGate,'OBSERVED');
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
 assert.equal(r.nativeLoadedOnnxSHA256,null);
 assert.equal(r.nativeCompiledJsepSHA256,null);
 assert.equal(r.releaseAuthorized,false);
});
test('previous M265 incorrectly accepted correct model+unrelated 307; new root binding refuses',()=>{
 const l=log({rows:[jsep(),redirect('model-onnx',2),model(3)]});
 assert.equal(verifyM265(l,ident()).originalJourneyGate,'PASS');
 const r=assessM267(l,ident());
 assert.equal(r.redirectChainGate,'FAIL');
 assert.equal(r.orphanRedirectChains,1);
 assert.equal(r.originalModelNetworkGate,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
 assert.throws(()=>verifyM267(l,ident()),/redirect-chain provenance/);
});
test('previous M265 accepted JSEP correct SHA from unrelated request while redirect orphaned',()=>{
 const l=log({rows:[redirect('jsep-wasm',1),jsep(4),model()]});
 assert.equal(verifyM265(l,ident()).originalJourneyGate,'PASS');
 const r=assessM267(l,ident());
 assert.equal(r.redirectChainGate,'FAIL');
 assert.equal(r.orphanRedirectChains,1);
 assert.equal(r.sourceEvidenceGate,'FAIL');
 assert.throws(()=>verifyM267(l,ident()),/redirect-chain provenance/);
});
test('real JSEP 307 followed by canonical original JSEP on same root remains PARTIAL',()=>{
 const l=log({rows:[redirect('jsep-wasm',1),jsep(1),model()]});
 const r=verifyM267(l,ident());
 assert.equal(r.originalJsepNetworkGate,'PARTIAL');
 assert.equal(r.jsepRedirectChains,1);
 assert.equal(r.redirectChainGate,'LINKED');
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
});
test('one browser root cannot emit two distinct terminal model responses as one model load',()=>{
 const l=log({rows:[jsep(),model(),model()]});
 const r=assessM267(l,ident());
 assert.equal(r.multipleTerminals,1);
 assert.equal(r.redirectChainGate,'FAIL');
 assert.throws(()=>verifyM267(l,ident()),/redirect-chain provenance/);
});
test('Chromium unreadable JSEP/ONNX bodies and normal model redirect remain PARTIAL',()=>{
 const l=log({engine:'chromium',rows:[
  unavailable('jsep-wasm',1),redirect('model-onnx',2),unavailable('model-onnx',2)
 ]});
 const r=verifyM267(l,ident({engine:'chromium'}));
 assert.equal(r.originalJourneyGate,'PASS');
 assert.equal(r.originalModelNetworkGate,'PARTIAL');
 assert.equal(r.originalJsepNetworkGate,'PARTIAL');
 assert.equal(r.redirectChainGate,'LINKED');
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
});
test('model hard HTTP error mixed with original body never promotes to chain PASS',()=>{
 const bad={kind:'model-onnx',status:'non-200',httpStatus:404,hasLocation:false,chainId:3};
 const l=log({rows:[jsep(),model(),bad]});
 const r=assessM267(l,ident());
 assert.equal(r.originalModelHttpErrors,1);
 assert.equal(r.redirectChainGate,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
 assert.throws(()=>verifyM267(l,ident()));
});
test('JSEP wrong-SHA binary with actual original model is a genuine FAIL, not source attestation',()=>{
 const l=log({rows:[{...jsep(),sha256:'f'.repeat(64)},model()]});
 const r=assessM267(l,ident());
 assert.equal(r.originalJsepNetworkGate,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
 assert.throws(()=>verifyM267(l,ident()));
});
test('missing or forged browser chain ID rejected, never inferred from model URLs',()=>{
 for(const bad of [null,'1',0,-1,65,1.5]){
  const rows=[jsep(),{...model(),chainId:bad}];
  assert.throws(()=>assessM267(log({rows}),ident()),/Missing, invalid, or unbounded/);
 }
 const rows=[jsep(),model()];
 delete rows[1].chainId;
 assert.throws(()=>assessM267(log({rows}),ident()),/Missing, invalid, or unbounded/);
});
test('duplicate HTTP witness, forged native identity, and retried attempt cannot pass',()=>{
 const raw=log();
 assert.throws(()=>assessM267(raw+'\n'+raw.split('\n').at(-1),ident()),/duplicate/i);
 assert.throws(()=>assessM267(log({net:{compiledWasmAttested:true}}),ident()));
 assert.throws(()=>verifyM267(raw,ident({runAttempt:2})),/first-attempt/);
});
test('original Worker failure cannot be washed away by valid linked network digests',()=>{
 const raw=log({fail:true});
 const r=assessM267(raw,ident({exitCode:1}));
 assert.equal(r.originalJourneyGate,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
 assert.throws(()=>verifyM267(raw,ident({exitCode:1})));
});
test('bounded result never echoes raw private-looking request messages or URLs',()=>{
 const r=assessM267(log({extra:'PRIVATE_PASSWORD_MARKER https://example.org?token=SECRET'}),ident());
 assert.doesNotMatch(JSON.stringify(r),/PRIVATE_PASSWORD|SECRET|example.org/);
 assert.equal(r.familyAlpha,'HOLD');
});
