import test from 'node:test';
import assert from 'node:assert/strict';
import {safeFailureMark35,failurePhases35,failureClasses35} from '../research/master-consolidation-1054/webkit-phase-classifier-m35.mjs';
const messages=[
 ['CLIP_SESSION',Error('WebAssembly.Memory(): could not allocate 1234 private tokens'),'MEMORY_SIGNAL'],
 ['CLIP_MODEL_BYTES',TypeError('Failed to fetch https://private.example/secret?jwt=a'),'FETCH_SIGNAL'],
 ['CLIP_INFERENCE',Error('OrtValue tensor shape mismatch PRIVATE'), 'TENSOR_SIGNAL'],
 ['SIGLIP_SESSION',Error('WebAssembly.instantiate error PRIVATE'), 'WASM_SIGNAL'],
 ['SIGLIP_PREPROCESSOR',Error('the request timed out PRIVATE'), 'TIMEOUT_SIGNAL'],
 ['IMAGE_PREPROCESS',TypeError('secret user address 12 Main Street'), 'JS_RUNTIME_SIGNAL'],
 ['OUTPUT_VALIDATE',Error('P82_BINDING'), 'P82_GUARD'],
 ['CLIP_RELEASE',Error('some unrecognized arbitrary private thing'), 'OTHER_SIGNAL']
];
test('M35 whitelist never exposes source error, account or address contents',()=>{
 for(const [phase,error,expected]of messages){
  const result=safeFailureMark35(phase,error);
  assert.equal(result.phase,phase);
  assert.equal(result.signal,expected);
  assert.equal(result.mark,'M35_FAILURE_'+phase+'_'+expected);
  const body=JSON.stringify(result);
  assert.ok(!body.includes('PRIVATE')&&!body.includes('private.example'));
  assert.equal(result.rawExceptionExposed,false);
  assert.equal(result.causalDiagnosis,false);
 }
});
test('M35 unknown failure stage cannot inject a malicious string into visible progress',()=>{
 for(const bad of ['https://private/photo.jpeg','OWNER_A','source: SECRET','../../private']){
  const m=safeFailureMark35(bad,Error('secret https://example.com?token=abc'));
  assert.equal(m.phase,'REQUEST_VALIDATE');
  assert.ok(failurePhases35.includes(m.phase)&&failureClasses35.includes(m.signal));
  assert.ok(!JSON.stringify(m).includes('secret'));
 }
});
test('bounded closed stage/class list is explicit and stable',()=>{
 assert.ok(failurePhases35.length>10&&failurePhases35.length<30);
 assert.deepEqual(new Set(failureClasses35).size,failureClasses35.length);
 assert.equal(failurePhases35.includes('CLIP_INFERENCE'),true);
 assert.equal(failurePhases35.includes('SIGLIP_RELEASE'),true);
});
