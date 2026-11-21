import test from 'node:test';
import assert from 'node:assert/strict';
import {
 branch,parent,additions,pinned,sourceGate,memoryAccessKind,createCollector,adjudicate
} from '../research/main1054/m288-original-jsep-static-memory-map.mjs';
import {originalBinary,originalFailure} from '../research/main1054/m280-original-jsep-function-map.mjs';
const fakeSHA='a'.repeat(40),e={name:'push',ref:branch,sha:fakeSHA,attempt:'1'};
function git(op,...args){
 if(op==='rev-parse')return args[0]==='HEAD'?fakeSHA:pinned[args[0].slice(fakeSHA.length+1)]||'not-pinned';
 if(op==='merge-base')return '';
 if(op==='diff-tree')return additions.map(p=>'A\0'+p+'\0').join('');
 if(op==='ls-tree')return '100644 blob '+'b'.repeat(40);
 throw Error('unexpected git action');
}
const shift=(predicate,value)=>(...args)=>predicate(...args)?value:git(...args);
const frames=originalFailure.indices.map((index,i)=>({
 index,bodyFileStart:100+i*200,bodyFileEndExclusive:290+i*200,
 bodySHA256:(i+1).toString(16).repeat(64)
}));
function sample({otherMemory=true}={}){
 const r=createCollector(frames);
 for(let i=0;i<4;i++){
  const start=frames[i].bodyFileStart;
  r.acceptLine(start.toString(16).padStart(6,'0')+' func['+frames[i].index+']:');
  r.acceptLine(' '+(start+1).toString(16).padStart(6,'0')+': 00          | local.get 0');
  if(i===0||otherMemory){
   r.acceptLine(' '+(start+2).toString(16).padStart(6,'0')+': 28 02 00    | i32.load offset=0');
   r.acceptLine(' '+(start+5).toString(16).padStart(6,'0')+': 40 00       | memory.grow');
  }
 }
 return r;
}
test('immutable authentic M279 original ONNX and WASM source remains unchanged',()=>{
 assert.deepEqual(sourceGate(git,e),{onlyAddedDiagnosticFiles:true,
  genuineM279FailurePreserved:true,originalTrapPc:null,
  sourceLevelDefectKnown:false,causalRepairProven:false,familyAlpha:'HOLD'});
 assert.equal(originalFailure.runId,44640727828);
 assert.equal(originalFailure.jobId,135971719127);
 assert.equal(originalBinary.sha256,'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39');
 assert.deepEqual(originalFailure.indices,[4846,1384,11276,7427]);
});
test('source guard refuses nonadditive edits, reruns, stale revisions and symlink injections',()=>{
 for(const change of [{name:'pull_request_target'},{ref:'refs/heads/main'},{attempt:'2'},
  {sha:'f'.repeat(40)},{sha:''}])
  assert.throws(()=>sourceGate(git,{...e,...change}),/M288 FAIL-CLOSED/);
 assert.throws(()=>sourceGate(shift(op=>op==='merge-base','bad'),e),/parent/);
 assert.throws(()=>sourceGate(shift(op=>op==='diff-tree','M\0public/outfit-worker-p94.mjs\0'),e),/modified original/);
 assert.throws(()=>sourceGate(shift(op=>op==='ls-tree','120000 blob symlink'),e),/nonregular/);
 assert.throws(()=>sourceGate(shift((op,arg)=>op==='rev-parse'&&arg===fakeSHA+':public/outfit-worker-p94.mjs','0'.repeat(40)),e),/protected file changed/);
});
test('explicitly identify WASM potentially trapping linear-memory opcodes',()=>{
 for(const op of ['i32.load','i64.load32_u','i32.store8','f64.store','v128.load8x8_s','v128.store16_lane','i32.atomic.load','i64.atomic.rmw.add'])
  assert.equal(memoryAccessKind(op),'linear-memory-access',op);
 for(const op of ['memory.copy','memory.fill','memory.init'])
  assert.equal(memoryAccessKind(op),'linear-memory-bulk-access',op);
 for(const op of ['memory.grow','memory.size'])
  assert.equal(memoryAccessKind(op),'memory-management-nontrapping',op);
 for(const op of ['i32.const','call','call_indirect','select','table.grow','table.copy','i32.eq'])
  assert.equal(memoryAccessKind(op),null,op);
 assert.equal(memoryAccessKind('A'.repeat(200)),null);
});
test('known synthetic disassembly yields body-valid exact static offsets but NO true trap PC',()=>{
 const r=sample().finish('wabt 1.0.36');
 const result=adjudicate(r);
 assert.equal(result.rows.length,4);
 assert.deepEqual(result.originalStackIndices,[4846,1384,11276,7427]);
 assert.equal(result.rows[0].memoryPotentiallyTrappingCount,1);
 assert.equal(result.rows[0].memoryManagementCount,1);
 assert.deepEqual(result.rows[0].firstCandidateFileOffsets,[102]);
 assert.equal(result.rows[0].earliestAccessFileByte,102);
 assert.equal(result.rows[0].latestAccessFileByte,102);
 assert.equal(result.rows[0].opcodeCounts['i32.load'],1);
 assert.match(result.rows[0].allCandidateOffsetSequenceSHA256,/^[a-f0-9]{64}$/);
 assert.equal(result.rows[0].trapInstructionFileOffset,null);
 assert.equal(result.actualOriginalMemoryAccessLocated,false);
 assert.equal(result.originalCxxSourceLineKnown,false);
 assert.equal(result.causalRuntimeCorrectionTested,false);
 assert.equal(result.familyAlpha,'HOLD');
});
test('other outer WASM frames may contain calls but no direct memory access',()=>{
 const r=sample({otherMemory:false}).finish('wabt 1.0.36');
 assert.equal(adjudicate(r).rows[1].memoryPotentiallyTrappingCount,0);
});
test('reject duplicate original headers, duplicate instructions and out-of-body file positions',()=>{
 const r=createCollector(frames);
 r.acceptLine('000064 func[4846]:');
 assert.throws(()=>r.acceptLine('000064 func[4846]:'),/duplicate function/);
 const t=createCollector(frames);
 t.acceptLine('000064 func[4846]:');
 t.acceptLine(' 000065: 28 02 00 | i32.load');
 assert.throws(()=>t.acceptLine(' 000065: 28 02 00 | i32.load'),/out of order/);
 const u=createCollector(frames);
 u.acceptLine('000064 func[4846]:');
 assert.throws(()=>u.acceptLine(' 0000fe: 28 02 00 | i32.load'),/offset outside/);
});
test('reject fake WebKit real trap PC, forged root cause and released original model',()=>{
 const valid=sample().finish('wabt 1.0.36');
 for(const mutant of [
  {...valid,genuineWebkitTrapSitePcKnown:true},
  {...valid,originalCxxSourceLineKnown:true},
  {...valid,originalFailingProcessJsepShaWitnessed:true},
  {...valid,consumerReleaseAuthorized:true},
  {...valid,causalRuntimeCorrectionTested:true},
  {...valid,familyAlpha:'OPEN'},
  {...valid,rows:valid.rows.map((x,i)=>i===0?{...x,trapInstructionFileOffset:102}:x)}
 ])assert.throws(()=>adjudicate(mutant),/M288 FAIL-CLOSED/);
});
test('reject wrongly labeled missing function index and missing candidate top frame',()=>{
 assert.throws(()=>createCollector(frames.slice(0,3)),/invalid exact original/);
 assert.throws(()=>createCollector([...frames].reverse()),/stack reordered/);
 const r=createCollector(frames);
 for(const f of frames){r.acceptLine('000064 func['+f.index+']:');}
 assert.throws(()=>r.finish('wabt 1.0.36'),/no disassembled instructions/);
});
