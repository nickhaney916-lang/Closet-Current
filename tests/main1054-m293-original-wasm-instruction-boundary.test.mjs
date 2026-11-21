import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {branch,parent,additions,sourceGate,verifyOriginalBytes,
 createScanner,adjudicate}
 from '../research/main1054/m293-original-wasm-instruction-boundary.mjs';
import {originalBinary,originalFailure,mapModule}
 from '../research/main1054/m280-original-jsep-function-map.mjs';

const fakeSHA='a'.repeat(40),evt={name:'push',ref:branch,sha:fakeSHA,attempt:'1'};
const pins={
 'public/outfit-worker-p94.mjs':'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
 'research/main1054/m280-original-jsep-function-map.mjs':'c52b967bc80ce8ba4c2c69bc2ea09c70e50bb332',
 'research/main1054/m291-loaded-wpe-elf-closure.mjs':'1ff7f5553b2cadbc43bea6118df40e1125c021c4',
 'research/main1054/m292-original-native-pc-evidence-handoff.mjs':'f6756739021e8074954c9cdf890b79ab176e7b6b'
};
function git(op,...args){
 if(op==='rev-parse')return args[0]==='HEAD'?fakeSHA:pins[args[0].slice(fakeSHA.length+1)]||'WRONG';
 if(op==='merge-base')return '';
 if(op==='diff-tree')return additions.map(x=>'A\u0000'+x+'\u0000').join('');
 if(op==='ls-tree')return '100644 blob '+'b'.repeat(40);
 throw Error('unexpected git');
}
const frames=originalFailure.indices.map((index,i)=>({
 index,start:100+i*200,end:190+i*200
}));
function fixture(){
 const bytes=Buffer.alloc(1000,0);
 const lines=[];
 for(const f of frames){
  bytes[f.start+1]=0x41; bytes[f.start+2]=0x28;
  bytes[f.start+5]=0x28;bytes[f.start+6]=0x02;bytes[f.start+7]=0;
  lines.push(f.start.toString(16).padStart(6,'0')+' func['+f.index+']:');
  lines.push(' '+(f.start+1).toString(16).padStart(6,'0')+
   ': 41 28       | i32.const 40');
  lines.push(' '+(f.start+5).toString(16).padStart(6,'0')+
   ': 28 02 00    | i32.load offset=0');
 }
 const scanner=createScanner(frames,bytes);
 for(const line of lines)scanner.accept(line);
 return {scanner,bytes,lines};
}
test('pin exact historical M279 real original WebKit frame and M292 parent',()=>{
 assert.equal(parent,'badea9e4e9f59edbbf6c1b0ba18e36cfffe9af5d');
 assert.deepEqual(originalFailure.indices,[4846,1384,11276,7427]);
 assert.equal(originalFailure.runId,44640727828);
 assert.equal(originalBinary.bytes,21596019);
 assert.equal(originalBinary.sha256,
  'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');
});
test('enforce exact source, first-attempt branch, no original JSEP/Worker modifications',()=>{
 assert.deepEqual(sourceGate(git,evt),{
  originalWorkerAndJsepUnmodified:true,historicalM279RedPreserved:true,
  actualOriginalWebkitTrapPC:null,causalRepairProven:false,familyAlpha:'HOLD'
 });
 for(const patch of [{name:'pull_request_target'},{ref:'refs/heads/main'},
  {attempt:'2'},{sha:''},{sha:'f'.repeat(40)}])
  assert.throws(()=>sourceGate(git,{...evt,...patch}),/M293 FAIL-CLOSED/);
 assert.throws(()=>sourceGate((...a)=>a[0]==='diff-tree'?
  'M\u0000public/outfit-worker-p94.mjs\u0000':git(...a),evt),/unexpected or modified/);
 assert.throws(()=>sourceGate((...a)=>a[0]==='ls-tree'?
  '120000 blob bad':git(...a),evt),/nonordinary/);
 assert.throws(()=>sourceGate((...a)=>a[0]==='rev-parse'&&
  a[1]===fakeSHA+':public/outfit-worker-p94.mjs'?'0'.repeat(40):
  git(...a),evt),/protected native/);
});
test('reject invented original model binary hash and truncated synthetic source',()=>{
 assert.throws(()=>verifyOriginalBytes(Buffer.alloc(40)),/M293 FAIL-CLOSED/);
 assert.throws(()=>verifyOriginalBytes(Buffer.alloc(21596019)),/M293 FAIL-CLOSED/);
});
test('synthetic WABT controls confirm genuine instruction start vs operand byte 0x28',()=>{
 const {scanner}=fixture(),r=scanner.finish('wabt 1.0.36');
 assert.equal(r.counts.length,4);
 assert.equal(r.counts[0].verifiedScalarMemoryOpcodeBoundaries,1);
 assert.equal(r.counts[0].totalDisassembledInstructions,2);
 assert.equal(scanner.lookup(4846,105).kind,'STATIC_SCALAR_OPCODE_BOUNDARY');
 assert.equal(scanner.lookup(4846,106).kind,'NOT_VERIFIED_SCALAR_OPCODE_BOUNDARY');
 assert.equal(scanner.lookup(4846,102).kind,'NOT_VERIFIED_SCALAR_OPCODE_BOUNDARY');
 assert.equal(scanner.lookup(4846,102).nativeWebkitFailureInstructionProven,false);
 assert.equal(scanner.lookup(4846,105).originalOrtCreateSessionBadAccessProven,false);
 assert.equal(adjudicate(r).actualOriginalWebkitTrapPc,null);
});
test('wrong function, invalid offset or unsupported coordinates fail closed',()=>{
 const {scanner}=fixture();
 for(const [index,offset] of [[4847,105],[4846,-1],
  [4846,1000],[4846,1.1],[9999,105]])
  assert.throws(()=>scanner.lookup(index,offset),/M293 FAIL-CLOSED/);
});
test('in-body false scalar memory opcode mismatch fails, no ambiguous attribution',()=>{
 const {bytes}=fixture();
 bytes[105]=0x29;
 const s=createScanner(frames,bytes);
 s.accept('000064 func[4846]:');
 assert.throws(()=>s.accept(' 000069: 28 02 00 | i32.load'),
  /static scalar instruction mismatch/);
});
test('reject duplicate original function headers, overlapping offsets and out-of-body',()=>{
 const {bytes}=fixture();
 const a=createScanner(frames,bytes);
 a.accept('000064 func[4846]:');
 assert.throws(()=>a.accept('000064 func[4846]:'),/duplicate/);
 const b=createScanner(frames,bytes);
 b.accept('000064 func[4846]:');
 b.accept(' 000069: 28 02 00 | i32.load');
 assert.throws(()=>b.accept(' 000069: 28 02 00 | i32.load'),/overlapping/);
 const c=createScanner(frames,bytes);
 c.accept('000064 func[4846]:');
 assert.throws(()=>c.accept(' 000999: 28 02 00 | i32.load'),/out-of-function/);
});
test('unsupported prefix never claims scalar memory instruction',()=>{
 const {bytes}=fixture();
 const s=createScanner(frames,bytes);
 for(const f of frames){
  s.accept(f.start.toString(16).padStart(6,'0')+' func['+f.index+']:');
  s.accept(' '+(f.start+1).toString(16).padStart(6,'0')+
   ': 41 28 | i32.const 40');
 }
 assert.throws(()=>s.finish('wabt 1.0.36'),/incomplete exact original/);
});
test('static proof cannot be changed into original trapped PC, C++ defect or family release',()=>{
 const r=fixture().scanner.finish('wabt 1.0.36');
 for(const patch of [
  {actualOriginalWebkitTrapPc:105},{causalRepairProven:true},
  {releaseAuthorized:true},{familyAlpha:'RELEASED'},
  {originalCxxFaultStatement:'ORT:100'},
  {originalWasmSHA256:'0'.repeat(64)},
  {historicalGenuineWebkitRed:{...r.historicalGenuineWebkitRed,actualInstructionOffset:105}}
 ])assert.throws(()=>adjudicate({...r,...patch}),/M293 FAIL-CLOSED/);
});
if(process.env.M293_ORIGINAL_WASM_PATH){
 test('true CDN original WASM exact SHA, actual original frame spans and not a native PC',()=>{
  const bytes=readFileSync(process.env.M293_ORIGINAL_WASM_PATH);
  const spans=verifyOriginalBytes(bytes);
  assert.deepEqual(spans.map(x=>x.index),originalFailure.indices);
  assert.ok(spans[0].start>0&&spans[0].end>spans[0].start);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
   originalBinary.sha256);
 });
}
