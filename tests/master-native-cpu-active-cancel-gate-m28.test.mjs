// Adversarial synthetic receipts: not proof of actual ONNX execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyActiveONNXCancel28} from '../research/master-consolidation-1054/native-cpu-active-cancel-gate-m28.mjs';
const commit='a'.repeat(40),hash='b'.repeat(64),photos=['commons-0035','commons-0062'];
const marker='M28_CPU_ONNX_RUN_INVOKED_fashionclip';
function setup(){
 const r={
  codeCommit:commit,schema:'main1054-m28-onnx-run-invoked-owner-cancel-lock-no-completed-inference-v1',
  status:'ONNX_RUN_INVOKED_CANCEL_LOCK_NOT_RELEASE',
  engine:'webkit',session:'one-continuous-browser-one-page-sequential-disposable-workers',
  completedPhotos:2,photoAttemptsTarget:2,modelFamilies:[],
  failures:[],pageErrors:[],networkBlocked:0,
  pageEvents:{workerCreated:2,workerTerminated:2,pageCrash:0,pageClosed:0,browserDisconnected:0},
  sourceHashesVerified:true,originalPhotoModified:false,
  ownerAccount:'synthetic-only',authorizedHostedCloud:false,ownerSessionIdentityChanged:false,
  persistedPrivateWardrobeWrites:0,autoAdmissions:0,independentHumanPhotoLabels:0,
  physicalMobileDevices:0,officialSafariOnIPhone:false,
  acceptanceForRelease:false,familyAlpha:'HOLD',
  modelStages:[
   {attempt:1,stage:'Verifying local CPU runtime',elapsedMs:100},
   {attempt:1,stage:marker,elapsedMs:6000},
   {attempt:2,stage:marker,elapsedMs:13000}
  ],
  rows:photos.map((id,i)=>({
   iteration:i+1,id,sourceSHA256:hash,observedOriginalSHA256:hash,sourceValid:true,
   cancelMode:i?'owner-session-locked':'explicit-owner-cancel',
   workerClosed:true,runInvocationObserved:true,runStage:marker,
   noModelResult:true,modelInferenceCompleted:false,
   privateWrites:0,automaticAdmissions:0,ownerApproval:false,
   itemUnchanged:true,draftUnchanged:true,suggestions:0,panelCount:i?0:1
  }))
 };
 return {r,expected:{commit,sourceHashes:Object.fromEntries(photos.map(id=>[id,hash]))}};
}
test('both distinct source models actually invoke ONNX before manual revoke, with zero result',()=>{
 const {r,expected}=setup(),x=verifyActiveONNXCancel28(r,expected);
 assert.equal(x.status,'ONNX_INVOKED_OWNER_CANCEL_LOCK_DESKTOP_ONLY_NOT_RELEASE');
 assert.equal(x.completedModelInferenceCredited,false);
 assert.equal(x.kernelExecutionAtCancellationProven,false);
 assert.equal(x.releaseAuthorized,false);
});
const cases={
 'invocation not observed':r=>r.rows[0].runInvocationObserved=false,
 'fake invocation marker':r=>r.rows[0].runStage='Comparing first model',
 'only one observed stage':r=>r.modelStages.pop(),
 'stage attempted for wrong photo':r=>r.modelStages[2].attempt=1,
 'no actual worker closed':r=>r.rows[1].workerClosed=false,
 'worker still alive':r=>r.pageEvents.workerTerminated=1,
 'first model produced results':r=>r.rows[0].noModelResult=false,
 'falsely credits model inference':r=>r.rows[0].modelInferenceCompleted=true,
 'source hash changed':r=>r.rows[0].observedOriginalSHA256='c'.repeat(64),
 'old source commit':r=>r.codeCommit='d'.repeat(40),
 'wrong owner':r=>r.ownerAccount='real-private',
 'owner identity mutated':r=>r.ownerSessionIdentityChanged=true,
 'silent private save':r=>r.persistedPrivateWardrobeWrites=1,
 'automatic model admission':r=>r.autoAdmissions=1,
 'unauthorized owner approval':r=>r.rows[0].ownerApproval=true,
 'panel survived lock':r=>r.rows[1].panelCount=1,
 'manual Adjust removed on cancel':r=>r.rows[0].panelCount=0,
 'late suggestion shown':r=>r.rows[1].suggestions=1,
 'item changed':r=>r.rows[1].itemUnchanged=false,
 'draft changed':r=>r.rows[0].draftUnchanged=false,
 'false mobile device':r=>r.physicalMobileDevices=1,
 'false release':r=>r.familyAlpha='READY',
 'missing second original':r=>r.rows.pop(),
 'network request escaped':r=>r.networkBlocked=1,
 'browser crash':r=>r.pageEvents.pageCrash=1,
 'pretend pretrained model passed':r=>r.modelFamilies=['fashionclip','fashionSiglip']
};
for(const [name,mutate] of Object.entries(cases))
 test('blocks '+name,()=>{
  const {r,expected}=setup();mutate(r);
  assert.equal(verifyActiveONNXCancel28(r,expected).status,'BLOCKED');
 });
