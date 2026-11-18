import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyP94Failure,classifyP94Done} from '../public/p94-worker-terminal-codes.mjs';

const stages=['validate','model_load','source_decode','model_inference',
 'mask_module_load','mask_postprocess','piece_encoding'];
test('M226 all seven original P94 stage codes preserve legacy reason and bound their output',()=>{
 for(const stage of stages){
  const r=classifyP94Failure(stage,new Error('unclassified'));
  assert.equal(r.reason,'P94_'+stage);
  assert.equal(r.diagnosticCode,'P94_'+stage+'_other');
  assert.equal(r.errorCategory,'other');
  assert.deepEqual(Object.keys(r).sort(),['diagnosticCode','errorCategory','reason']);
  assert.ok(Object.isFrozen(r));
 }
});
test('M226 actual model failure families are distinguishable, NEVER a success override',()=>{
 const cases=[
  ['model_load',new TypeError('Failed to fetch'), 'network'],
  ['model_inference',new Error('WebAssembly memory access out of bounds'),'memory'],
  ['model_inference',new Error('ONNXRuntime WASM backend rejected tensor'),'wasm_runtime'],
  ['source_decode',Object.assign(new Error('The operation was aborted'),{name:'AbortError'}),'aborted'],
  ['mask_module_load',new TypeError('Unable to decode module'),'runtime'],
  ['piece_encoding',new RangeError('Unrecognized crop data'),'runtime'],
  ['mask_postprocess',new Error('Unknown mask'),'other'],
  ['validate',new Error('Invalid outfit photo'),'invalid_input'],
 ];
 for(const [stage,error,category] of cases){
  const got=classifyP94Failure(stage,error);
  assert.equal(got.errorCategory,category);
  assert.equal(got.reason,'P94_'+stage);
  assert.equal(got.diagnosticCode,'P94_'+stage+'_'+category);
 }
});
test('M226 corrupted diagnostic stage never echoes raw strings or arbitrary reason',()=>{
 const out=classifyP94Failure('https://private.example/user?jwt=secret',
  new Error('unexpected'));
 assert.deepEqual(out,{reason:'P94_unknown',diagnosticCode:'P94_unknown_other',
  errorCategory:'other'});
});
test('M226 photo URLs tokens owner metadata and worker stack never leave error classifier',()=>{
 const secrets=['source-private-jpeg-SECRET','Authorization-bearer-SECRET',
  'owner-alice-private-SECRET','https://private.invalid/path?token=SECRET'];
 for(const message of secrets){
  const got=classifyP94Failure('model_inference',new Error('WebAssembly failure '+message));
  assert.equal(got.errorCategory,'wasm_runtime');
  for(const secret of secrets)assert.ok(!JSON.stringify(got).includes(secret));
  assert.doesNotMatch(JSON.stringify(got),/SECRET|token=|private\.invalid/);
 }
});
test('M226 odd and throwing exception getters cannot escape into source review',()=>{
 const inaccessible={get name(){throw Error('private name')},
  get message(){throw Error('private source')}};
 const r=classifyP94Failure('piece_encoding',inaccessible);
 assert.equal(r.diagnosticCode,'P94_piece_encoding_other');
 assert.ok(!JSON.stringify(r).includes('private'));
});
test('M226 terminal separates true no-person-label from zero clothing groups and good proposals',()=>{
 assert.equal(classifyP94Done(false,0,0),'P94_NO_PERSON_LABEL');
 assert.equal(classifyP94Done(true,0,0),'P94_NO_CLOTHING_GROUPS');
 assert.equal(classifyP94Done(true,2,0),'P94_NO_ENCODED_PIECES');
 assert.equal(classifyP94Done(true,2,2),'P94_PIECES_READY');
 assert.equal(classifyP94Done(true,2,1),'P94_PIECES_READY');
});
test('M226 inconsistent Worker replies must not be represented as legitimate model emptiness',()=>{
 const cases=[[true,0,1],[false,1,0],[false,0,1],[true,1,2],
  [true,-1,0],[true,0,-1],[true,NaN,0],[true,1,1.5],
  [undefined,0,0],[true,Number.MAX_SAFE_INTEGER+1,0]];
 for(const args of cases)
  assert.equal(classifyP94Done(...args),'P94_INCONSISTENT_TERMINAL');
});
test('M226 original Worker keeps genuine model source, mask path, raw JPEG and fail-closed status',()=>{
 const raw=readFileSync('public/outfit-worker-p94.mjs','utf8');
 assert.match(raw,/Xenova\/segformer_b0_clothes/);
 assert.match(raw,/revision='a2489ea8e7ec1ee912190546bad31a4906ccca76'/);
 assert.match(raw,/await model\(await processor\(image\)\)/);
 assert.match(raw,/clothingMaskGroups\(map\)/);
 assert.match(raw,/self\.postMessage\(\{type:'piece',id:request\.id,piece\}\);count\+\+/);
 assert.match(raw,/classification|classifyP94Failure/);
 assert.match(raw,/outcomeCode:classifyP94Done/);
 assert.match(raw,/This outfit could not be separated on this device/);
 assert.doesNotMatch(raw,/error\.message\s*[,}]/);
 assert.doesNotMatch(raw,/error\.stack\s*[,}]/);
});
