import test from 'node:test';
import assert from 'node:assert/strict';
import {auditRepeatedWebkitHTTPS34} from '../research/master-consolidation-1054/webkit-https-repeat-gate-m34.mjs';
const commit='a'.repeat(40);
function base(){
 return {schema:'main1054-webkit-https-repeat-m34-v1',
  sourceCommit:commit,repeatsTarget:3,
  diagnostics:Array.from({length:3},(_,i)=>({
   repeat:i+1,result:'SUCCESS',completedPhotos:16,ownerCancelLockCases:2,
   workerErrorCode:'NONE',workerCreated:18,workerClosed:18,
   pageCrashes:0,modelStageCounts:{verifying:18,first:18,second:16,onnxInvoked:2},
   lastModelStage:'onnxInvoked',maxSampledProcessTreePSSBytes:1325000000,
   sampleCount:49,requestFailures:0,consoleErrors:0,device:'DESKTOP_WEBKIT_ONLY'
  })),
  verifiedPhysicalDevices:0,actualIPhoneSafari:false,actualAndroidChrome:false,
  familyAlpha:'HOLD',releaseAuthorized:false};
}
test('three source-verified desktop WebKit browser repetitions never authorize release',()=>{
 const a=auditRepeatedWebkitHTTPS34(base(),{commit});
 assert.equal(a.status,'THREE_DESKTOP_WEBKIT_HTTPS_REPEATS_OBSERVED_NOT_RELEASE');
 assert.equal(a.independentPhysicalDevices,0);
 assert.equal(a.releaseAuthorized,false);
});
const changes={
 'altered exact commit':r=>r.sourceCommit='b'.repeat(40),
 'fake phone':r=>r.verifiedPhysicalDevices=1,
 'fake iPhone Safari':r=>r.actualIPhoneSafari=true,
 'fake Android Chrome':r=>r.actualAndroidChrome=true,
 'family release':r=>r.familyAlpha='READY',
 'unexpected private identity':r=>r.operatorEmail='private@email',
 'one repeat missing':r=>r.diagnostics.pop(),
 'repeat skipped':r=>r.diagnostics[1].repeat=3,
 'wrong browser claim':r=>r.diagnostics[0].device='IPHONE_SAFARI',
 'not full photos':r=>r.diagnostics[0].completedPhotos=15,
 'worker not created':r=>r.diagnostics[1].workerCreated=17,
 'worker leaked':r=>r.diagnostics[2].workerClosed=17,
 'browser crash':r=>r.diagnostics[2].pageCrashes=1,
 'failed network':r=>r.diagnostics[0].requestFailures=1,
 'missing CPU first model':r=>r.diagnostics[1].modelStageCounts.first=15,
 'missing CPU second model':r=>r.diagnostics[2].modelStageCounts.second=15,
 'missing ONNX invocation':r=>r.diagnostics[0].modelStageCounts.onnxInvoked=1,
 'missing memory samples':r=>r.diagnostics[0].sampleCount=0,
 'no sampled PSS':r=>r.diagnostics[1].maxSampledProcessTreePSSBytes=0,
 'malicious original photo base64':r=>r.diagnostics[0].privatePhoto='data:image/jpeg;base64,SECRET',
 'unbounded failure count':r=>r.diagnostics[1].consoleErrors=300,
 'wrong final stage':r=>r.diagnostics[2].lastModelStage='MODEL_COMPLETED_CLAIM',
 'unrecognized worker code':r=>r.diagnostics[0].workerErrorCode='MY_PRIVATE_MESSAGE'
};
for(const [name,mutate] of Object.entries(changes))
 test('fail closed: '+name,()=>{
  const r=base();mutate(r);
  assert.equal(auditRepeatedWebkitHTTPS34(r,{commit}).status,'BLOCKED');
 });
test('record an actual failed repeat without falsely crediting 3/3',()=>{
 const r=base();
 r.diagnostics[1]={
  repeat:2,result:'BLOCKED',failureClass:'MODEL_WORKER_REPORTED_FAILURE',
  completedPhotos:9,lastPhotoId:'commons-0035',browserBlocked:true,
  workerErrorCode:'P82_MODEL_UNAVAILABLE',workerCreated:10,workerClosed:10,
  pageCrashes:0,modelStageCounts:{verifying:10,first:10,second:9,onnxInvoked:0},
  lastModelStage:'first',maxSampledProcessTreePSSBytes:1300000000,
  sampleCount:31,requestFailures:0,consoleErrors:0,device:'DESKTOP_WEBKIT_ONLY'
 };
 const verdict=auditRepeatedWebkitHTTPS34(r,{commit});
 assert.equal(verdict.status,'BLOCKED');
 assert.equal(verdict.failedTrials,1);
 assert.equal(verdict.repetitions[1].errorCode,'P82_MODEL_UNAVAILABLE');
});
