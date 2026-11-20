import test from 'node:test';
import assert from 'node:assert/strict';
import {binary,knownProbeLoadFileOffset,parseWasmFrames,classifyProbe,sourceGate,
  parent,branch,added} from '../research/main1054/m281-webkit-offset-capability.mjs';

test('native binary has real 64KiB out-of-bounds load at absolute file byte 44',()=>{
  assert.equal(binary.length,48);
  assert.equal(WebAssembly.validate(binary),true);
  assert.equal(binary[knownProbeLoadFileOffset],0x28);
  const instance=new WebAssembly.Instance(new WebAssembly.Module(binary));
  assert.throws(()=>instance.exports.probe(),WebAssembly.RuntimeError);
});
test('Chrome-style native stack includes absolute module byte position',()=>{
  assert.deepEqual(parseWasmFrames('RuntimeError at wasm-function[0]:0x2c'),[
    {functionIndex:0,absoluteModuleOffset:44}
  ]);
  const result=classifyProbe('chromium',{name:'RuntimeError',
    message:'memory access out of bounds',stack:'at wasm-function[0]:0x2c'});
  assert.equal(result.exactFileOffsetConfirmed,true);
  assert.equal(result.originalWebKitTrapOffset,null);
  assert.equal(result.permanentRepairProven,false);
});
test('WebKit-style real native stack without offset NEVER implies exact trap',()=>{
  const result=classifyProbe('webkit',{name:'RuntimeError',
    message:'Out of bounds memory access',stack:'wasm-function[0]@[wasm code]'});
  assert.equal(result.stackHasOffset,false);
  assert.equal(result.reportedOffset,null);
  assert.equal(result.exactFileOffsetConfirmed,false);
  assert.equal(result.originalCxxFaultLine,null);
});
test('wrong byte offset is not falsely called a verified file offset',()=>{
  const result=classifyProbe('webkit',{name:'RuntimeError',
    message:'memory access out of bounds',stack:'wasm-function[0]:0x1'});
  assert.equal(result.stackHasOffset,true);
  assert.equal(result.exactFileOffsetConfirmed,false);
});
test('function index alone is not a bytecode location',()=>{
  assert.deepEqual(parseWasmFrames('wasm-function[4846]@[wasm code]'),
    [{functionIndex:4846,absoluteModuleOffset:null}]);
});
test('fake native success is not a genuine bounds trap',()=>{
  assert.throws(()=>classifyProbe('webkit',{name:'no-trap',message:'',stack:''}),/RuntimeError absent/);
});
test('wrong exception, fake function index, or unknown engine rejected',()=>{
  assert.throws(()=>classifyProbe('webkit',{name:'TypeError',message:'memory access out of bounds',
    stack:'wasm-function[0]'}),/RuntimeError absent/);
  assert.throws(()=>classifyProbe('webkit',{name:'RuntimeError',message:'memory access out of bounds',
    stack:'wasm-function[3]'}),/function 0/);
  assert.throws(()=>classifyProbe('firefox',{name:'RuntimeError',message:'memory access out of bounds',
    stack:'wasm-function[0]'}),/unsupported engine/);
});
test('exact SOURCE gate rejects wrong branch, new unreviewed code, rerun',()=>{
  const files=new Map([
    [parent+':research/main1054/m280-original-jsep-function-map.mjs','sourcehash'],
    [parent+':research/main1054/m279-original-model-pointer-bounds.mjs','parenthash'],
    [parent+':public/outfit-worker-p94.mjs','workerhash']
  ]);
  const sha='a'.repeat(40);
  for(const p of [
    'research/main1054/m280-original-jsep-function-map.mjs',
    'research/main1054/m279-original-model-pointer-bounds.mjs',
    'public/outfit-worker-p94.mjs'
  ])files.set(sha+':'+p,files.get(parent+':'+p));
  const git=(cmd,...args)=>{
    if(cmd==='rev-parse')return args[0]==='HEAD'?sha:files.get(args[0])||'';
    if(cmd==='merge-base')return '';
    if(cmd==='diff-tree')return added.map(p=>'A\\0'+p+'\\0').join('').replaceAll('\\0','\0');
    if(cmd==='ls-tree')return '100644 blob test';
    throw Error('unexpected mock git');
  };
  const e={name:'push',ref:branch,attempt:'1',sha};
  assert.equal(sourceGate(git,e).originalSourcePreserved,true);
  assert.throws(()=>sourceGate(git,{...e,ref:'refs/heads/main'}),/wrong branch/);
  assert.throws(()=>sourceGate(git,{...e,attempt:'2'}),/attempt/);
  assert.throws(()=>sourceGate((cmd,...args)=>cmd==='diff-tree'?'A\0public\/outfit-worker-p94.mjs\0':git(cmd,...args),e),
    /protected source modified/);
});
