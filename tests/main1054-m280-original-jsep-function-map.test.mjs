import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {
 sourceGate,branch,parent,added,pinned,originalBinary,originalFailure,
 mapModule,authenticateOriginalRed
} from '../research/main1054/m280-original-jsep-function-map.mjs';

const sha='a'.repeat(40),ev={name:'push',ref:branch,sha,attempt:'1'};
function git(op,...args){
 if(op==='rev-parse')return args[0]==='HEAD'?sha:pinned[args[0].slice(sha.length+1)]??'b'.repeat(40);
 if(op==='merge-base')return '';
 if(op==='diff-tree')return added.map(p=>'A\0'+p+'\0').join('');
 if(op==='ls-tree')return '100644 blob '+'b'.repeat(40);
 throw Error('Unexpected fake git API');
}
const intercept=fn=>(...args)=>fn(...args)??git(...args);
test('immutable unchanged original Worker and native studies remain HOLD',()=>{
 const a=sourceGate(git,ev);
 assert.deepEqual(a,{source:'PASS',originalRuntimeModified:false,
  exactOriginalFailPreserved:true,nativeTrapInstructionKnown:false,
  permanentRepairProven:false,familyAlpha:'HOLD'});
});
test('reject source checkout, branch, rerun, test-only symlink and protected blobs',()=>{
 for(const change of [{name:'pull_request_target'},{ref:'refs/heads/main'},{attempt:'2'},{sha:''}]){
  assert.throws(()=>sourceGate(git,{...ev,...change}),/FAIL-CLOSED/);
 }
 assert.throws(()=>sourceGate(intercept((op,...args)=>op==='rev-parse'&&args[0]==='HEAD'?'f'.repeat(40):null),ev),/checkout/);
 assert.throws(()=>sourceGate(intercept(op=>op==='merge-base'?'bad':null),ev),/ancestor/);
 assert.throws(()=>sourceGate(intercept(op=>op==='diff-tree'?'M\0public\/outfit-worker-p94.mjs\0':null),ev),/modified original/);
 assert.throws(()=>sourceGate(intercept(op=>op==='ls-tree'?'120000 blob xyz':null),ev),/unsafe file mode/);
 assert.throws(()=>sourceGate(intercept((op,arg)=>op==='rev-parse'&&arg===sha+':public/outfit-worker-p94.mjs'?'0'.repeat(40):null),ev),/protected original source drift/);
});
function syntheticWasm({imported=false,named=false,custom=false}={}){
 const hdr=[0,97,115,109,1,0,0,0];
 const type=[1,4,1,0x60,0,0];     // one ()->() function signature
 const imp=imported?[2,7,1,1,109,1,102,0,0]:[];
 const fn=[3,2,1,0];              // one defined function, type index 0
 const exp=[7,5,1,1,102,0,imported?1:0];
 const body=[10,4,1,2,0,0x0b];   // local decl 0, end
 const namePayload=[4,110,97,109,101,1,7,1,imported?1:0,4,111,114,105,103];
 const names=named?[0,namePayload.length,...namePayload]:[];
 const opaque=custom?[0,5,4,116,101,115,116]:[];
 return Buffer.from([...hdr,...type,...imp,...fn,...exp,...body,...names,...opaque]);
}
test('known tiny valid module: no imported functions, exact defined body spans',()=>{
 const input=syntheticWasm();
 const sha=createHash('sha256').update(input).digest('hex');
 const r=mapModule(input,[0],{sha256:sha,expectedSize:input.length});
 assert.equal(r.binarySHA256,sha);
 assert.equal(r.importedFunctionCount,0);
 assert.equal(r.definedFunctionCount,1);
 assert.equal(r.frames.length,1);
 assert.equal(r.frames[0].kind,'defined');
 assert.equal(r.frames[0].name,null);
 assert.deepEqual(r.frames[0].exportNames,['f']);
 assert.equal(r.frames[0].bodySizeBytes,2);
 assert.equal(r.frames[0].bodyFileEndExclusive-r.frames[0].bodyFileStart,2);
 assert.equal(r.frames[0].exactTrapInstructionOffset,null);
 assert.equal(r.nativeTrapInstructionFound,false);
 assert.equal(r.causalFixProven,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('actual WASM function indices include imports and source names are optional',()=>{
 const r=mapModule(syntheticWasm({imported:true,named:true,custom:true}),[0,1]);
 assert.equal(r.importedFunctionCount,1);
 assert.equal(r.definedFunctionCount,1);
 assert.equal(r.namedSectionPresent,true);
 assert.equal(r.frames[0].kind,'imported');
 assert.equal(r.frames[0].bodyFileStart,null);
 assert.equal(r.frames[1].kind,'defined');
 assert.equal(r.frames[1].name,'orig');
});
test('reject incorrect original binary SHA/size before any index mapping',()=>{
 const b=syntheticWasm();
 assert.throws(()=>mapModule(b,[0],{sha256:'0'.repeat(64)}),/SHA256/);
 assert.throws(()=>mapModule(b,[0],{expectedSize:originalBinary.bytes}),/byte length/);
});
test('bad WASM headers, corrupted body lengths and missing indices reject',()=>{
 const b=syntheticWasm();
 assert.throws(()=>mapModule(Buffer.from('NOTWASM'),[0]),/header/);
 assert.throws(()=>mapModule(b,[1]),/outside exact JSEP/);
 assert.throws(()=>mapModule(b,[0,0]),/bad function indices/);
 const broken=Buffer.from(b);broken[broken.length-3]=255;
 assert.throws(()=>mapModule(broken,[0]),/truncated payload|truncated binary|function\/code|overlong/);
});
test('original failing WebKit source job can be independently verified but no raw stack saved',()=>{
 const run={id:44640727828,head_sha:originalFailure.source,run_attempt:1,status:'completed',
  conclusion:'failure',event:'push'};
 const job={id:135971719127,run_id:44640727828,status:'completed',conclusion:'failure',
  name:'m279-actual-untouched-segformer-native-original-cohort (webkit, 430, 2, 8)'};
 const rows=Array.from({length:8},(_,i)=>({
  schema:'MAIN1054_M279_ORIGINAL_NATIVE_POINTER_BOUNDS_V1',engine:'webkit',width:430,shard:2,
  ordinal:i+1,originalExit:i===2?1:0,originalRealRed:i===2,
  originalJourneyPositive:i!==2,originalOrtCreateSessionThrew:i===2,
  nativeErrorClass:i===2?'wasm-bounds':null,
  modelPointer:8933688,modelLength:15199746,modelEnd:24133434,
  heapBytesAtEntry:24182784,heapBytesAtTerminal:50266112,
  entryRangeWithinHeap:true,exitRangeWithinHeap:true,
  nativeFunctionOffsets:i===2?originalFailure.indices.map(functionIndex=>({functionIndex,offset:null})):[]
 }));
 const log=rows.map(r=>'2026-11-20T00:00:00Z M279_NATIVE_MODEL_POINTER_BOUND_RECEIPT '+JSON.stringify(r)).join('\n');
 const verified=authenticateOriginalRed(run,job,log);
 assert.equal(verified.realOriginalWebKitRed,true);
 assert.equal(verified.originalOffsetsAllUnknown,true);
 assert.ok(!JSON.stringify(verified).includes('stack'));
 assert.throws(()=>authenticateOriginalRed({...run,run_attempt:2},job,log),/source\/run/);
 assert.throws(()=>authenticateOriginalRed(run,{...job,conclusion:'success'},log),/job tampered/);
 assert.throws(()=>authenticateOriginalRed(run,job,log.replace('"wasm-bounds"','"other"')),/native bounds/);
 assert.throws(()=>authenticateOriginalRed(run,job,log.replace('"ordinal":3','"ordinal":9')),/ordinals/);
 assert.throws(()=>authenticateOriginalRed(run,job,log.replace('"offset":null','"offset":823')),/native bounds/);
 assert.throws(()=>authenticateOriginalRed(run,job,log.replace('"originalRealRed":true','"originalRealRed":false')),/original real RED/);
});
test('do not confuse exact WASM body file offsets with actual trap instruction location',()=>{
 const r=mapModule(syntheticWasm({named:false}),[0]);
 assert.equal(r.frames[0].bodyFileStart!==null,true);
 assert.equal(r.frames[0].exactTrapInstructionOffset,null);
 assert.equal(r.sourceBuildDebugSymbolsProven,false);
 assert.equal(r.originalFailingProcessBinarySHAProven,false);
 assert.equal(r.nativeTrapInstructionFound,false);
 assert.equal(r.releaseAuthorized,false);
});
