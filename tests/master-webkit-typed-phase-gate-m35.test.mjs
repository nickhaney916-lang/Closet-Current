import test from 'node:test';
import assert from 'node:assert/strict';
import {auditTypedWebkit35} from '../research/master-consolidation-1054/webkit-typed-phase-gate-m35.mjs';
const commit='a'.repeat(40);
function fixture(){
 return {schema:'main1054-webkit-typed-phase-m35-v1',
  sourceCommit:commit,repeatsTarget:3,
  diagnostics:Array.from({length:3},(_,i)=>({
   repeat:i+1,result:'SUCCESS',checkpoint:'AFTER_WORKER_LIFECYCLE_GATE',
   lastTypedFailureMark:'NONE',typedFailureEvents:0,
   completedPhotos:16,ownerCancelLockCases:2,workerErrorCode:'NONE',
   workerCreated:18,workerClosed:18,pageCrashes:0,
   modelStageCounts:{verifying:18,first:18,second:16,onnxInvoked:2},
   lastModelStage:'onnxInvoked',maxSampledProcessTreePSSBytes:1365000000,
   sampleCount:65,requestFailures:0,consoleErrors:0,
   device:'DESKTOP_WEBKIT_ONLY'
  })),
  verifiedPhysicalDevices:0,actualIPhoneSafari:false,actualAndroidChrome:false,
  familyAlpha:'HOLD',releaseAuthorized:false};
}
test('three synthetic diagnostic passes can never mean actual phone or released app',()=>{
 const v=auditTypedWebkit35(fixture(),{commit});
 assert.equal(v.status,'THREE_WEBKIT_TYPED_PHASE_OWNER_TRIALS_OBSERVED_NOT_RELEASE');
 assert.equal(v.independentlyVerifiedIPhoneSafari,false);
 assert.equal(v.ownerReleaseAuthorized,false);
});
const changes={
 'private error string':x=>x.diagnostics[0].lastTypedFailureMark='https://person@example.com/secret',
 'fake hardware':x=>x.actualIPhoneSafari=true,
 'fake blind photo accuracy':x=>x.diagnostics[1].blindAccuracy='100%',
 'stale head':x=>x.sourceCommit='f'.repeat(40),
 'worker model unavailable but accepted':x=>{
  x.diagnostics[1].lastTypedFailureMark='M35_FAILURE_CLIP_INFERENCE_WASM_SIGNAL';
  x.diagnostics[1].typedFailureEvents=1;
 },
 'non-final checkpoint':x=>x.diagnostics[2].checkpoint='BEFORE_SESSION_LOCK',
 'missing second model':x=>x.diagnostics[1].modelStageCounts.second=10,
 'hidden worker leak':x=>x.diagnostics[0].workerClosed=17,
 'unknown phase injection':x=>x.diagnostics[0].lastTypedFailureMark='M35_FAILURE_PRIVATE_DATA_OTHER_SIGNAL',
 'unbounded repeated error messages':x=>x.diagnostics[0].typedFailureEvents=100,
 'wrong source photos':x=>x.diagnostics[1].completedPhotos=14,
 'fake unmeasured memory':x=>x.diagnostics[1].sampleCount=0,
 'missing cancellation':x=>x.diagnostics[2].ownerCancelLockCases=1,
 'arbitrary error URLs':x=>x.diagnostics[0].errorUrl='https://company/private',
 'missing last failure code':x=>x.diagnostics[0].lastTypedFailureMark=undefined,
 'missing experiment':x=>x.diagnostics.pop(),
 'page crashed':x=>x.diagnostics[2].pageCrashes=1
};
for(const [name,mutate]of Object.entries(changes))test('blocks '+name,()=>{
 const f=fixture();mutate(f);
 assert.equal(auditTypedWebkit35(f,{commit}).status,'BLOCKED');
});
test('genuine worker model error must remain blocked but retains one typed phase signal',()=>{
 const x=fixture();
 x.diagnostics[1]={
  repeat:2,result:'BLOCKED',checkpoint:'BEFORE_REAL_16_PHOTOS',
  failureClass:'MODEL_WORKER_REPORTED_FAILURE',completedPhotos:9,
  lastPhotoId:'commons-0062',browserBlocked:true,
  workerErrorCode:'P82_MODEL_UNAVAILABLE',workerCreated:10,workerClosed:10,
  pageCrashes:0,modelStageCounts:{verifying:10,first:10,second:9,onnxInvoked:0},
  lastModelStage:'first',maxSampledProcessTreePSSBytes:1400000000,
  sampleCount:35,requestFailures:0,consoleErrors:0,
  lastTypedFailureMark:'M35_FAILURE_CLIP_INFERENCE_WASM_SIGNAL',typedFailureEvents:1,
  device:'DESKTOP_WEBKIT_ONLY'
 };
 const v=auditTypedWebkit35(x,{commit});
 assert.equal(v.status,'BLOCKED');
 assert.equal(v.trials[1].lastTypedFailureMark,'M35_FAILURE_CLIP_INFERENCE_WASM_SIGNAL');
 assert.equal(v.ownerReleaseAuthorized,false);
});
