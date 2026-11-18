import test from 'node:test';
import assert from 'node:assert/strict';
import {examineNativeOrtRuntime233 as verify} from '../scripts/lib/main233-ort-runtime-identity.mjs';
const jsep=['transformers.min.js','ort-wasm-simd-threaded.jsep.mjs',
 'ort-wasm-simd-threaded.jsep.wasm'];
const cpu=['transformers.min.js','ort-wasm-simd-threaded.mjs',
 'ort-wasm-simd-threaded.wasm'];
const get=(mode,assets,other={})=>verify({
 mode,assets,sourceLocked:true,realPositive:true,...other
});
test('M233 exact P102 true model JSEP baseline is observed, never called a cure',()=>{
 const x=get('baseline',jsep);
 assert.equal(x.status,'observed-not-a-fix');
 assert.equal(x.family,'jsep');
 assert.equal(x.cpuOnlyProven,false);
 assert.equal(x.permanentWebKitRepairProven,false);
});
test('M233 fixed-SIMD with same JSEP asset is not CPU-only',()=>{
 const x=get('fixed-simd',jsep);
 assert.equal(x.status,'observed-not-a-fix');
 assert.equal(x.family,'jsep');
 assert.equal(x.cpuOnlyProven,false);
});
test('M233 falsely claimed CPU-only with real JSEP assets must RED',()=>{
 const x=get('cpu-only-candidate',jsep);
 assert.equal(x.status,'reject');
 assert.equal(x.reason,'candidate-still-loaded-jsep-bundle');
});
test('M233 non-JSEP filenames alone do not attest binary/checksums or real fix',()=>{
 const x=get('cpu-only-candidate',cpu);
 assert.equal(x.status,'unverified');
 assert.equal(x.cpuOnlyProven,false);
 assert.equal(x.permanentWebKitRepairProven,false);
});
test('M233 mismatched JS/WASM names cannot validate the selected runtime',()=>{
 const x=get('baseline',['ort-wasm-simd-threaded.jsep.mjs',
  'ort-wasm-simd-threaded.wasm']);
 assert.equal(x.status,'reject');
 assert.equal(x.reason,'ort-loader-wasm-filename-mismatch');
});
test('M233 no original positive cards or unpinned test source refuses attestation',()=>{
 assert.equal(get('baseline',jsep,{realPositive:false}).status,'reject');
 assert.equal(get('baseline',jsep,{sourceLocked:false}).status,'reject');
});
test('M233 excludes path/URL/owner identifiers from runtime asset evidence',()=>{
 const x=get('baseline',['https://private.example/owner.jpg',...jsep]);
 assert.equal(x.status,'reject');
});
test('M233 refuses duplicate alternate runtime variants and missing binary',()=>{
 assert.equal(get('baseline',[...jsep,'ort-wasm-simd-threaded.mjs']).status,'reject');
 assert.equal(get('baseline',[jsep[0],jsep[1]]).status,'reject');
});
test('M233 no undefined experimental mode can be construed as fixed',()=>{
 assert.equal(get('magic-no-issues',jsep).status,'reject');
});
