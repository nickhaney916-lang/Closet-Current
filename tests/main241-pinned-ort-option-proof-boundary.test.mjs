import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {classifyForwardingEvidence,REQUIRED_TRANSFORMERS,REQUIRED_ORT,
 EXPECTED_ORT_INTEGRITY,SOURCE_P94_BLOB} from '../scripts/main241-pinned-ort-option-path-audit.mjs';

test('M241 package audit is restricted to original P94 and pinned ORT/Transformers',()=>{
 assert.equal(REQUIRED_TRANSFORMERS,'3.8.1');
 assert.equal(REQUIRED_ORT,'1.22.0-dev.20250409-89f8206ba4');
 assert.equal(SOURCE_P94_BLOB,'d66651b616de54c51eb7ef986324b30f1580888f');
 assert.equal(EXPECTED_ORT_INTEGRITY,
 'sha512-0uS76OPgH0hWCPrFKlL8kYVV7ckM7t/36HfbgoFw6Nd0CZVVbQC4PkrR8mBX8LtNUFZO25IQBqV2Hx2ho3FlbQ==');
});
test('M241 never upgrades static option string evidence into native allocator proof',()=>{
 assert.equal(classifyForwardingEvidence({declaredAPI:true,hasNativeSetterName:true}),
  'static-API-only-native-unverified');
 assert.equal(classifyForwardingEvidence({observedNativeCall:true}),
  'native-call-observed-setting-unverified');
 assert.equal(classifyForwardingEvidence({}),
  'no-source-evidence-native-unverified');
 assert.equal(classifyForwardingEvidence({observedNativeCall:true,observedNativeSetting:true}),
  'native-setting-observed');
});
test('M241 has no private source or WebAssembly buffer inspection, and keeps HOLD',async()=>{
 const source=await readFile('scripts/main241-pinned-ort-option-path-audit.mjs','utf8');
 for(const blocked of ['response.text()','memory.buffer','HEAPU8.set','new Uint8Array(','ownerToken','authToken',
    'cloudKey','familyPhoto','writeFile(']) assert.equal(source.includes(blocked),false,blocked);
 assert.ok(source.includes('nativeSettingObserved:false'));
 assert.ok(source.includes('releaseAuthorized:false,familyAlphaHold:true'));
 assert.ok(source.includes("SOURCE_P94_BLOB"));
});
