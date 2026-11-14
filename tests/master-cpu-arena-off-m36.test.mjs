import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {auditArenaOffWebkit36} from '../research/master-consolidation-1054/cpu-arena-off-gate-m36.mjs';
const commit='a'.repeat(40);
function fixture(){
 return {schema:'main1054-cpu-arena-off-m36-v1',
  sourceCommit:commit,repeatsTarget:3,runtimeCandidate:'m36-cpu-arena-off',
  diagnostics:Array.from({length:3},(_,i)=>({
   repeat:i+1,result:'SUCCESS',checkpoint:'AFTER_WORKER_LIFECYCLE_GATE',
   lastTypedFailureMark:'NONE',typedFailureEvents:0,
   completedPhotos:16,ownerCancelLockCases:2,workerErrorCode:'NONE',
   workerCreated:18,workerClosed:18,pageCrashes:0,
   modelStageCounts:{verifying:18,first:18,second:16,onnxInvoked:2},
   lastModelStage:'onnxInvoked',maxSampledProcessTreePSSBytes:1250000000,
   sampleCount:70,requestFailures:0,consoleErrors:0,device:'DESKTOP_WEBKIT_ONLY'
  })),
  verifiedPhysicalDevices:0,actualIPhoneSafari:false,actualAndroidChrome:false,
  familyAlpha:'HOLD',releaseAuthorized:false};
}
test('all source-confirmed synthetic model trials only mark research, not model parity/release',()=>{
 const verdict=auditArenaOffWebkit36(fixture(),{commit});
 assert.equal(verdict.status,'THREE_ARENA_OFF_CPU_WEBKIT_OWNER_SESSIONS_OBSERVED_NOT_RELEASE');
 assert.equal(verdict.realModelScoreParityWithBaselineMeasured,false);
 assert.equal(verdict.releaseAuthorized,false);
 assert.equal(verdict.physicalMobileTests,0);
});
for(const [name,change]of Object.entries({
 'wrong CPU research variant':x=>x.runtimeCandidate='jsep',
 'wrong underlying source':x=>x.sourceCommit='f'.repeat(40),
 'missing one case':x=>x.diagnostics.pop(),
 'false browser worker closure':x=>x.diagnostics[1].workerClosed=17,
 'fake physical test':x=>x.actualIPhoneSafari=true,
 'false release':x=>x.familyAlpha='READY',
 'hidden memory signal':x=>{x.diagnostics[2].typedFailureEvents=1;
  x.diagnostics[2].lastTypedFailureMark='M35_FAILURE_CLIP_SESSION_MEMORY_SIGNAL';},
 'private source metadata':x=>x.ownerCredentials='DO_NOT_EXPORT',
 'missing abort':x=>x.diagnostics[0].ownerCancelLockCases=1,
 'unverified photo':x=>x.diagnostics[0].completedPhotos=15
 }))test('reject '+name,()=>{
  const r=fixture();change(r);
  assert.equal(auditArenaOffWebkit36(r,{commit}).status,'BLOCKED');
 });
test('M36 differs from M35 CPU model only by documented WASM session options and variant identity',async()=>{
 const [baseline,candidate,host,adapter,client]=await Promise.all([
  readFile('research/master-consolidation-1054/cpu-wasm-review-worker-m35.mjs','utf8'),
  readFile('research/master-consolidation-1054/cpu-wasm-review-worker-m36.mjs','utf8'),
  readFile('scripts/serve-webkit-arena-m36.mjs','utf8'),
  readFile('research/master-consolidation-1054/cpu-browser-request-m36.mjs','utf8'),
  readFile('research/master-consolidation-1054/physical-device-m36-client.mjs','utf8')
 ]);
 const original=baseline.split('\n'),newLines=new Set(candidate.split('\n'));
 const missing=original.filter(line=>!newLines.has(line));
 assert.deepEqual(missing,[
  "    intraOpNumThreads:1,graphOptimizationLevel:'all'});",
  "   researchRuntime:'m25-cpu-only-wasm',runtimeVersion,"
 ]);
 assert.match(candidate,/enableCpuMemArena:false,enableMemPattern:false/);
 assert.match(candidate,/researchRuntime:'m36-cpu-arena-off'/);
 assert.match(host,/\/m36\/cpu-browser-request-m36\.mjs/);
 assert.match(adapter,/researchRuntime!=='m36-cpu-arena-off'/);
 assert.match(client,/output\?\.researchRuntime!=='m36-cpu-arena-off'/);
});
