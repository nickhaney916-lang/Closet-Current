import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {originalBinary,originalFailure} from '../research/main1054/m280-original-jsep-function-map.mjs';
import {parent,branch,additions,sourceGate,originalVerifiedCounts,
 familyOfMnemonic,createPrefixedScanner,adjudicate}
 from '../research/main1054/m294-prefixed-original-memory-opcode-boundaries.mjs';
const fakeSHA='a'.repeat(40),event={name:'push',ref:branch,sha:fakeSHA,attempt:'1'};
const frozen={
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
 'research/main1054/m292-original-native-pc-evidence-handoff.mjs':'f6756739021e8074954c9cdf890b79ab176e7b6b',
 'research/main1054/m293-original-wasm-instruction-boundary.mjs':'03bc9a5bb01657378a386bcb51125c16bcc8e731'
};
function git(cmd,...args){
 if(cmd==='rev-parse')return args[0]==='HEAD'?fakeSHA:
  frozen[args[0].slice(fakeSHA.length+1)]||'NOT_PINNED';
 if(cmd==='merge-base')return '';
 if(cmd==='diff-tree')return additions.map(p=>'A\u0000'+p+'\u0000').join('');
 if(cmd==='ls-tree')return '100644 blob '+'b'.repeat(40);
 throw Error('unexpected git action');
}
const spans=originalFailure.indices.map((index,i)=>({
 index,start:100+i*180,end:245+i*180
}));
function fixture(){
 const bytes=Buffer.alloc(1100);
 const lines=[];
 for(const span of spans){
  const start=span.start;
  // 4 separate synthetic WABT-like instructions and an unrelated immediate
  // 0x28 (i32.load's opcode) inside an i32.const.
  const items=[
   [1,[0x28,0x02,0x00],'i32.load offset=0'],
   [5,[0xfd,0x0b,0x02,0x00],'v128.store offset=0'],
   [10,[0xfe,0x1e,0x02,0x00],'i32.atomic.rmw.add'],
   [15,[0xfc,0x0a,0x00,0x00],'memory.copy 0 0'],
   [20,[0x41,0x28],'i32.const 40']
  ];
  lines.push(start.toString(16).padStart(6,'0')+' func['+span.index+']:');
  for(const [relative,arr,op] of items){
   Buffer.from(arr).copy(bytes,start+relative);
   lines.push(' '+(start+relative).toString(16).padStart(6,'0')+': '+
    arr.map(x=>x.toString(16).padStart(2,'0')).join(' ')+' | '+op);
  }
 }
 const scanner=createPrefixedScanner(spans,bytes);
 for(const line of lines)scanner.accept(line);
 return {scanner,bytes,lines};
}
test('immutable historical real RED and correct M293 parent',()=>{
 assert.equal(parent,'2af7ea8dbc7d21b1cacc8aa48dd3347fd8d40e7a');
 assert.equal(originalFailure.runId,44640727828);
 assert.equal(originalFailure.jobId,135971719127);
 assert.deepEqual(originalFailure.indices,[4846,1384,11276,7427]);
 assert.equal(originalBinary.bytes,21596019);
 assert.equal(originalBinary.sha256,
  'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');
});
test('M288 and M293 known independent corpus count reconciliation is exact',()=>{
 const expected=originalVerifiedCounts;
 assert.deepEqual(expected.map(x=>x.scalar),[5528,5794,33,35]);
 assert.deepEqual(expected.map(x=>x.all),[5769,6046,33,35]);
 assert.deepEqual(expected.map(x=>x.simd+x.atomic+x.bulk),[241,252,0,0]);
 assert.equal(expected.reduce((n,x)=>n+x.all,0),11883);
 assert.equal(expected.reduce((n,x)=>n+x.simd+x.atomic+x.bulk,0),493);
});
test('CI fails closed on wrong branch, rerun, protected worker edit or symlink',()=>{
 assert.deepEqual(sourceGate(git,event),{
  originalRuntimeAndJsepUnmodified:true,originalRealM279RedPreserved:true,
  nativeTrapPc:null,sourceCxxCauseKnown:false,permanentFixProven:false,familyAlpha:'HOLD'
 });
 for(const patch of [{name:'pull_request_target'},{ref:'refs/heads/main'},
  {attempt:'2'},{sha:''},{sha:'f'.repeat(40)}])
  assert.throws(()=>sourceGate(git,{...event,...patch}),/M294 FAIL-CLOSED/);
 assert.throws(()=>sourceGate((...a)=>a[0]==='diff-tree'?
  'M\u0000public/outfit-worker-p94.mjs\u0000':git(...a),event),
  /extra or modified original/);
 assert.throws(()=>sourceGate((...a)=>a[0]==='ls-tree'?
  '120000 blob unsafe':git(...a),event),/nonregular/);
 assert.throws(()=>sourceGate((...a)=>a[0]==='rev-parse'&&
  a[1]===fakeSHA+':public/outfit-worker-p94.mjs'?'0'.repeat(40):
  git(...a),event),/protected original/);
});
test('WABT mnemonic classifier recognizes bounded SIMD atomic and bulk families',()=>{
 for(const op of ['v128.load','v128.store','v128.store32_lane',
  'v128.load8x8_s','v128.load16_lane'])
  assert.equal(familyOfMnemonic(op),'simd',op);
 for(const op of ['i32.atomic.load','i32.atomic.load8_u',
  'i32.atomic.rmw.add','i64.atomic.rmw.xor','memory.atomic.notify'])
  assert.equal(familyOfMnemonic(op),'atomic',op);
 for(const op of ['memory.copy','memory.fill','memory.init'])
  assert.equal(familyOfMnemonic(op),'bulk',op);
 for(const op of ['i32.const','i32.load','i64.store',
  'memory.grow','memory.size','v128.bitselect','table.copy',
  'i32.eq','f32.add','i8x16.shuffle'])
  assert.equal(familyOfMnemonic(op),null,op);
 assert.equal(familyOfMnemonic('x'.repeat(140)),null);
});
test('synthetic WABT prefix starts are distinct from operand bytes and scalar starts',()=>{
 const {scanner}=fixture();
 assert.equal(scanner.lookup(4846,105).kind,'VERIFIED_STATIC_PREFIXED_MEMORY_START');
 assert.equal(scanner.lookup(4846,110).kind,'VERIFIED_STATIC_PREFIXED_MEMORY_START');
 assert.equal(scanner.lookup(4846,115).kind,'VERIFIED_STATIC_PREFIXED_MEMORY_START');
 assert.equal(scanner.lookup(4846,106).kind,'NOT_VERIFIED_PREFIXED_MEMORY_START');
 assert.equal(scanner.lookup(4846,121).kind,'NOT_VERIFIED_PREFIXED_MEMORY_START');
 assert.equal(scanner.lookup(4846,101).kind,'NOT_VERIFIED_PREFIXED_MEMORY_START');
 assert.equal(scanner.lookup(4846,105).genuineWebkitFailingTrapPc,null);
});
test('unsupported offset, function index and incomplete original disassembly fail',()=>{
 const {scanner}=fixture();
 for(const [index,offset] of [[4847,105],[4846,-1],
  [4846,1100],[4846,5.5]])
  assert.throws(()=>scanner.lookup(index,offset),/M294 FAIL-CLOSED/);
 assert.throws(()=>scanner.finish('wabt 1.0.36'),/M294 FAIL-CLOSED/);
});
test('wrong source bytes, wrong prefix, out-of-span and duplicate header fail',()=>{
 const {bytes}=fixture();
 const a=createPrefixedScanner(spans,bytes);
 a.accept('000064 func[4846]:');
 assert.throws(()=>a.accept('000064 func[4846]:'),/duplicate function/);
 assert.throws(()=>a.accept(' 000069: fc 0b 02 00 | v128.store'),/prefixed opcode/);
 const b=createPrefixedScanner(spans,bytes);
 b.accept('000064 func[4846]:');
 assert.throws(()=>b.accept(' 000069: fd 0b 02 01 | v128.store'),/bytes mismatch/);
 const c=createPrefixedScanner(spans,bytes);
 c.accept('000064 func[4846]:');
 assert.throws(()=>c.accept(' 001000: fc 0a 00 00 | memory.copy'),
  /out-of-span/);
});
test('source receipt never becomes genuine original native PC, cause, fix or release',()=>{
 const r={
  schema:'M294_ORIGINAL_PREFIXED_MEMORY_BOUNDARY_RECONCILIATION_V1',
  originalJsepSHA256:originalBinary.sha256,originalJsepBytes:originalBinary.bytes,
  originalRealRedRun:originalFailure.runId,originalRealRedJob:originalFailure.jobId,
  originalRealStack:originalFailure.indices,
  scalarAndPrefixedAgainstM288Reconciled:true,
  rows:originalVerifiedCounts.map(x=>({functionIndex:x.index,
   allOriginalM288StaticMemoryCandidates:x.all,originalWebkitTrapSiteKnown:false})),
  realFailingProcessOpcodeOffset:null,originalCxxRootCause:null,
  nativeRuntimeRepairProven:false,releaseAllowed:false,familyAlpha:'HOLD'
 };
 assert.equal(adjudicate(r),r);
 for(const patch of [{realFailingProcessOpcodeOffset:7022509},
  {originalCxxRootCause:'bad pointer'},{nativeRuntimeRepairProven:true},
  {releaseAllowed:true},{familyAlpha:'RELEASED'},
  {originalJsepSHA256:'f'.repeat(64)},
  {rows:r.rows.slice(0,3)}])
  assert.throws(()=>adjudicate({...r,...patch}),/M294 FAIL-CLOSED/);
});
if(process.env.M294_SANITIZED_RECEIPT){
 test('genuine original WABT static receipt passed from source-pinned CLI',()=>{
  const receipt=JSON.parse(readFileSync(process.env.M294_SANITIZED_RECEIPT,'utf8'));
  adjudicate(receipt);
  assert.deepEqual(receipt.rows.map(x=>x.simdOpcodeBoundaries),[130,146,0,0]);
  assert.deepEqual(receipt.rows.map(x=>x.atomicOpcodeBoundaries),[75,50,0,0]);
  assert.deepEqual(receipt.rows.map(x=>x.bulkOpcodeBoundaries),[36,56,0,0]);
  assert.equal(receipt.realFailingProcessOpcodeOffset,null);
 });
}
