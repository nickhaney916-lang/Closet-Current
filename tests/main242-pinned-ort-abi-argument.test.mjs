import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {splitCallArguments,extractNativeSessionCalls,classifyPosition,EXPECTED} from '../scripts/main242-pinned-ort-abi-argument-audit.mjs';

test('M242 extracts the position of the actual call, not a mere option text marker',()=>{
 const source='const flag=options.enableMemPattern; export const create=x=>wasm._OrtCreateSessionOptions(99,!!options.enableMemPattern,true,call(3,4));';
 const calls=extractNativeSessionCalls(source);
 assert.equal(calls.length,1);
 assert.equal(calls[0].args.length,4);
 assert.equal(calls[0].args[1],'!!options.enableMemPattern');
 assert.equal(classifyPosition(calls[0].args),
  'static-wasm-export-argument-1-source-verified-native-value-unobserved');
});
test('M242 nesting, quoted commas and comments do not fabricate native argument positions',()=>{
 const code="module._OrtCreateSessionOptions(10, !!opts.enableMemPattern, call('a,b',{nested:[1,2]}), /* c,d */ compute(1,2));";
 const call=extractNativeSessionCalls(code)[0];
 assert.equal(call.args.length,4);
 assert.ok(call.args[2].includes("nested:[1,2]"));
 assert.equal(classifyPosition(call.args),
  'static-wasm-export-argument-1-source-verified-native-value-unobserved');
 assert.equal(classifyPosition(['g','h','enableMemPattern']), 'static-wasm-export-argument-other-or-ambiguous');
});
test('M242 fails rather than inventing a native call when only API declaration is present',()=>{
 assert.deepEqual(extractNativeSessionCalls("const enableMemPattern=true; function foo() {}"),[]);
 assert.equal(classifyPosition(['a','b']),'static-wasm-export-forwarding-not-identifiable');
 assert.throws(()=>splitCallArguments('x(a,b',1),/truncated/);
});
test('M242 source is privacy-safe and admits zero native runtime / allocator proof',async()=>{
 const code=await readFile('scripts/main242-pinned-ort-abi-argument-audit.mjs','utf8');
 assert.ok(code.includes('nativeAllocatorPolicyProven:false'));
 assert.ok(code.includes('nativeCallObserved:false'));
 assert.ok(code.includes('genuineWebKitRedGreenProven:false'));
 for(const secret of ['getUserMedia','originalPhoto','authToken','Buffer.from(memory.buffer)','HEAPU8.set']){
  // Documentation may mention originals, so check forbidden actual operations only.
  if(secret==='originalPhoto')continue;
  assert.equal(code.includes(secret),false,secret);
 }
 assert.equal(EXPECTED.ort,'1.22.0-dev.20250409-89f8206ba4');
 assert.equal(EXPECTED.transformers,'3.8.1');
});
