// Synthetic cancellation fixture; NOT actual browser, worker or image evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyNativeCancelLock27} from '../research/master-consolidation-1054/native-cpu-cancel-gate-m27.mjs';
const commit='a'.repeat(40),hash='b'.repeat(64),ids=['commons-0035','commons-0062'];
function sample(){
 const r={
  codeCommit:commit,schema:'main1054-m27-owner-cancel-session-lock-no-inference-v1',
  status:'CANCEL_AND_LOCK_OBSERVED_NOT_RELEASE',engine:'webkit',
  session:'one-continuous-browser-one-page-sequential-disposable-workers',
  completedPhotos:2,photoAttemptsTarget:2,uniquePublicPhotoSources:2,
  modelFamilies:[],failures:[],pageErrors:[],networkBlocked:0,
  pageEvents:{workerCreated:2,workerTerminated:2,pageCrash:0,pageClosed:0,browserDisconnected:0},
  sourceHashesVerified:true,originalPhotoModified:false,
  autoAdmissions:0,persistedPrivateWardrobeWrites:0,ownerSessionIdentityChanged:false,
  ownerAccount:'synthetic-only',authorizedHostedCloud:false,
  physicalMobileDevices:0,officialSafariOnIPhone:false,
  acceptanceForRelease:false,familyAlpha:'HOLD',
  rows:ids.map((id,i)=>({
   iteration:i+1,id,sourceSHA256:hash,observedOriginalSHA256:hash,sourceValid:true,
   cancelMode:i?'owner-session-locked':'explicit-owner-cancel',
   workerClosed:true,noModelResult:true,modelInferenceCompleted:false,
   privateWrites:0,automaticAdmissions:0,ownerApproval:false,
   itemUnchanged:true,draftUnchanged:true,suggestions:0,panelCount:i?0:1
  }))
 };
 return {r,expected:{commit,sourceHashes:Object.fromEntries(ids.map(id=>[id,hash]))}};
}
test('both actual-owner simulated cancel receipts require no model result',()=>{
 const {r,expected}=sample(),a=verifyNativeCancelLock27(r,expected);
 assert.equal(a.status,'NATIVE_CPU_CANCEL_LOCK_OBSERVED_NOT_RELEASE');
 assert.equal(a.genuineInferenceCompleted,false);assert.equal(a.releaseAuthorized,false);
});
const changes={
 'no observed worker termination':r=>r.pageEvents.workerTerminated=1,
 'no worker launch':r=>r.pageEvents.workerCreated=0,
 'stale owner photo':r=>r.rows[0].observedOriginalSHA256='c'.repeat(64),
 'silent classification':r=>r.rows[1].itemUnchanged=false,
 'owner correction leaked':r=>r.rows[0].draftUnchanged=false,
 'cancel emitted result':r=>r.rows[0].noModelResult=false,
 'false genuine inference':r=>r.rows[1].modelInferenceCompleted=true,
 'wrong cancel reason':r=>r.rows[1].cancelMode='explicit-owner-cancel',
 'no owner lock cleanup':r=>r.rows[1].panelCount=1,
 'no manual panel preserved':r=>r.rows[0].panelCount=0,
 'orphaned suggestion':r=>r.rows[0].suggestions=1,
 'silent original save':r=>r.persistedPrivateWardrobeWrites=1,
 'mutated photo source':r=>r.rows[1].sourceValid=false,
 'session identity switched':r=>r.ownerSessionIdentityChanged=true,
 'false allowed release':r=>r.acceptanceForRelease=true,
 'fake mobile':r=>r.physicalMobileDevices=1,
 'one flow missing':r=>r.rows.pop(),
 'browser crash':r=>r.pageEvents.pageCrash=1,
 'misrepresents model success':r=>r.modelFamilies=['FashionCLIP','SigLIP']
};
for(const [name,f] of Object.entries(changes))test('blocks '+name,()=>{
 const {r,expected}=sample();f(r);
 assert.equal(verifyNativeCancelLock27(r,expected).status,'BLOCKED');
});
