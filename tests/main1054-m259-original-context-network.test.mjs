import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveM259,classifyM259} from '../research/main1054/m259-original-context-network.mjs';

const sha='c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39';
const data=(over={})=>({
 schema:'M259_CONTEXT_NETWORK_V1',engine:'webkit',width:390,
 rows:[{kind:'jsep-wasm',status:'body-observed',sha256:sha,size:21596019},
       {kind:'model-onnx',status:'body-observed',sha256:'a'.repeat(64),size:12000000}],
 wasmNetworkMatch:true,modelNetworkObserved:true,
 compiledWasmAttested:false,loadedModelAttested:false,
 sameNativeProcessProven:false,sourceEvidenceGate:'BLOCKED',familyAlpha:'HOLD',...over
});
const log=x=>'M259_CONTEXT_NETWORK_WITNESS '+JSON.stringify(x);
test('derives a disposable copy from the authentic original P94 browser script',()=>{
 const source=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
 const derived=deriveM259(source);
 assert.ok(source.length>40000);
 assert.ok(derived.length>source.length);
 assert.match(derived,/M259_CONTEXT_NETWORK_WITNESS/);
 assert.match(derived,/M58_REAL_P88_WORKER_FAIL/);
 assert.match(derived,/await browser\?\.close\(\)/);
 assert.doesNotMatch(source,/M259_CONTEXT_NETWORK_WITNESS/);
});
test('rejects edited or ambiguous source anchors rather than instrumenting another runner',()=>{
 assert.throws(()=>deriveM259('fake'),/Original/);
 const source=readFileSync('scripts/test-parallel94-native-p88-browser.mjs','utf8');
 assert.throws(()=>deriveM259(source.replace(" stage='sign-in';"," stage='something-else';")),/anchor/);
});
test('valid same-context network bodies are NOT promoted into compiled ONNX or JSEP proof',()=>{
 const result=classifyM259(log(data()),'webkit',390);
 assert.equal(result.status,'OBSERVED_NETWORK_BODIES');
 assert.equal(result.wasm,true);
 assert.equal(result.model,true);
 assert.equal(result.nativeRuntimeIdentity,'NOT_ATTESTED');
 assert.equal(result.sourceEvidenceGate,'BLOCKED');
});
test('missing or duplicate browser observations are rejected',()=>{
 assert.throws(()=>classifyM259('','webkit',390),/Missing/);
 assert.throws(()=>classifyM259(log(data())+'\n'+log(data()),'webkit',390),/duplicate/);
});
test('forged promotion, wrong engine and source result cannot pass',()=>{
 for(const corrupt of [
  {sourceEvidenceGate:'PASS'},{compiledWasmAttested:true},
  {loadedModelAttested:true},{sameNativeProcessProven:true},
  {familyAlpha:'GO'},{width:430},{engine:'chromium'}
 ]){
  assert.throws(()=>classifyM259(log(data(corrupt)),'webkit',390));
 }
});
test('mismatched actual network wasm is a real failure, never reclassified as model success',()=>{
 const bad=data({rows:[{kind:'jsep-wasm',status:'body-observed',sha256:'b'.repeat(64),size:21596019}],wasmNetworkMatch:false,modelNetworkObserved:false});
 assert.throws(()=>classifyM259(log(bad),'webkit',390),/mismatch/);
});
test('unavailable browser response bytes remain blocked and explicit',()=>{
 const partial=data({rows:[{kind:'jsep-wasm',status:'body-unavailable'}],wasmNetworkMatch:false,modelNetworkObserved:false});
 const result=classifyM259(log(partial),'webkit',390);
 assert.equal(result.status,'PARTIAL_OR_UNAVAILABLE');
 assert.equal(result.sourceEvidenceGate,'BLOCKED');
});
test('raw stdout and private-looking substrings are never returned',()=>{
 const result=classifyM259(log(data())+'\nSECRET_AUTH_TOKEN_ABC','webkit',390);
 assert.doesNotMatch(JSON.stringify(result),/SECRET_AUTH_TOKEN_ABC/);
});
test('oversized and malformed network evidence are rejected',()=>{
 assert.throws(()=>classifyM259('x'.repeat(8*1024*1024+1),'webkit',390));
 assert.throws(()=>classifyM259('M259_CONTEXT_NETWORK_WITNESS {bad','webkit',390));
 assert.throws(()=>classifyM259(log(data({rows:Array.from({length:33},()=>({kind:'jsep-wasm',status:'body-unavailable'}))})),'webkit',390));
});
