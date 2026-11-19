import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {extractReceipt,crossPathGate,ORIGINAL_GRAPH_SHA,ORIGINAL_MODEL_REVISION}
 from '../scripts/test-main244-real-owner-vs-native-graph.mjs';

const owner=()=>({
 engine:'webkit',width:390,realModelAttempted:true,actualWorkerSeen:true,
 success:true,cards:2,workerEvents:[{type:'diagnostic',phase:'model_session_load',outcome:'ok'}]
});
const graph=()=>({
 engine:'webkit',arm:'baseline',originalGraphSha256:ORIGINAL_GRAPH_SHA,
 modelRevision:ORIGINAL_MODEL_REVISION,originalPublicGraph:true,
 success:true,stage:'model_session_complete',originalOwnerPhotoJourneyNotRun:true,
 apiCalls:[{actualCall:true,memPatternFlag:true,handleReturned:true}],
 nativeCalls:[{actualNativeExportCalled:true,returnedHandle:true}],
 grownMemoryTargetCount:1,jsGrowCalls:5,finalHeapPages:756
});

test('M244 requires two genuine separate original source receipts',()=>{
 const o=owner(),g=graph(),v=crossPathGate(o,g,'webkit');
 assert.equal(v.ownerRealOriginalModel,true);
 assert.equal(v.nativePublicOriginalOnnxGraph,true);
 assert.equal(v.differentRuntimePath,true);
 assert.equal(v.directRuntimeEquivalenceProven,false);
 assert.equal(v.originalWebkitFixProven,false);
 assert.equal(v.familyAlphaHold,true);
});
test('M244 never treats standalone graph initialization as genuine owner model success',()=>{
 const o=owner(),g=graph();o.cards=0;o.success=false;
 assert.throws(()=>crossPathGate(o,g,'webkit'),/Original genuine model-positive failed/);
});
test('M244 never treats successful original owner review as a native original graph proof',()=>{
 const o=owner(),g=graph();g.originalGraphSha256='unverified';
 assert.throws(()=>crossPathGate(o,g,'webkit'),/Standalone ONNX graph bytes changed/);
});
test('M244 wrong ABI, option setting, native handle, missing Worker or runtime RED stay RED',()=>{
 const o=owner(),g=graph();
 g.apiCalls[0].memPatternFlag=false;
 assert.throws(()=>crossPathGate(o,g,'webkit'),/false !== true|Expected values to be strictly equal/);
 const o2=owner(),g2=graph();o2.actualWorkerSeen=false;
 assert.throws(()=>crossPathGate(o2,g2,'webkit'),/Original real Worker not observed/);
 const o3=owner(),g3=graph();g3.success=false;
 assert.throws(()=>crossPathGate(o3,g3,'webkit'),/Native original graph session FAILED/);
});
test('M244 refuses to adopt pattern-off original graph as unmodified baseline',()=>{
 const g=graph();g.arm='pattern_off';
 assert.throws(()=>crossPathGate(owner(),g,'webkit'),/Cannot compare changed option arm/);
});
test('M244 receipt parser is strict, no multiple or fabricated positives',()=>{
 assert.deepEqual(extractReceipt('M244_RESEARCH {"ok":true}\n','M244_RESEARCH'),{ok:true});
 assert.throws(()=>extractReceipt('','M214_REAL_P94_WORKER_OUTCOME'),/Missing or repeated/);
 assert.throws(()=>extractReceipt('X {"a":1}\nX {"a":2}\n','X'),/Missing or repeated/);
});
test('M244 output retains no raw errors/private data and never deploys',async()=>{
 const source=await readFile('scripts/test-main244-real-owner-vs-native-graph.mjs','utf8');
 for(const bad of ['console.error(run.stderr)','console.log(run.stdout)','authorization:Bearer',
   'originalPhotoBytes','Uint8Array(memory.buffer)','process.exit(0)']){
  assert.equal(source.includes(bad),false,bad);
 }
 assert.ok(source.includes('originalFailurePreserved:true'));
 assert.ok(source.includes('notRetried:true'));
 assert.ok(source.includes('releaseAuthorized:false,familyAlphaHold:true'));
});
