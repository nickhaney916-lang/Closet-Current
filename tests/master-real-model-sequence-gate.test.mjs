// Synthetic structural tests only, never real model/human/device evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyRealModelSequence} from '../research/master-consolidation-1054/real-model-sequence-gate.mjs';
const commit='a'.repeat(40),hash='b'.repeat(64),code='c'.repeat(64);
function fixture(){
 const r={codeCommit:commit,engine:'webkit',photoAttemptsTarget:4,completedPhotos:4,
  status:'COMPLETE_OBSERVED',failures:[],session:'one-continuous-browser-one-page-sequential-disposable-workers',
  sourceHashesVerified:true,originalPhotoModified:false,autoAdmissions:0,persistedPrivateWardrobeWrites:0,
  ownerSessionIdentityChanged:false,authorizedHostedCloud:false,ownerAccount:'synthetic-only',
  blindAccuracy:null,independentHumanPhotoLabels:0,physicalMobileDevices:0,officialSafariOnIPhone:false,
  acceptanceForRelease:false,familyAlpha:'HOLD',networkBlocked:0,pageErrors:[],
  pageEvents:{pageCrash:0,pageClosed:0,browserDisconnected:0,workerCreated:4},
  workerSourceCodeSha256:code,uniquePublicPhotoSources:2,
  gateCounts:Object.fromEntries([2,4,8,16].map(n=>[n,{requested:n<=4,met:n<=4}])),
  rows:Array.from({length:4},(_,i)=>({iteration:i+1,id:i%2?'photo-b':'photo-a',sourceSHA256:hash,
   observedOriginalSHA256:hash,sourceValid:true,workerSourceCodeSha256:code,
   realModelFamilies:['fashionclip','fashionSiglip'],verifiedAssets:12,elapsedInferenceMs:1200,
   privateWrites:0,automaticAdmissions:0}))};
 return {r,expected:{engine:'webkit',target:4,commit,sourceHashes:{'photo-a':hash,'photo-b':hash}}};
}
test('complete structural receipt only means observed, never release',()=>{
 const {r,expected}=fixture(),out=verifyRealModelSequence(r,expected);
 assert.equal(out.status,'COMPLETE_OBSERVED_NOT_RELEASE');assert.equal(out.releaseAuthorized,false);
});
const changes={
 'partial sequence':r=>r.completedPhotos=2,
 'false success after crash':r=>r.pageEvents.pageCrash=1,
 'browser disconnect':r=>r.pageEvents.browserDisconnected=1,
 'failure hidden by summary':r=>r.failures.push({category:'TIMEOUT'}),
 'missing rows':r=>r.rows.pop(),
 'duplicate row order':r=>r.rows[1].iteration=1,
 'tampered original bytes':r=>r.rows[0].observedOriginalSHA256='d'.repeat(64),
 'unregistered source':r=>r.rows[0].id='owner-photo',
 'different worker source':r=>r.rows[0].workerSourceCodeSha256='d'.repeat(64),
 'only same model twice':r=>r.rows[0].realModelFamilies=['fashionclip','fashionclip'],
 'wrong commit':r=>r.codeCommit='d'.repeat(40),
 'browser mismatch':r=>r.engine='chromium',
 'automatic save':r=>r.rows[0].automaticAdmissions=1,
 'private write':r=>r.persistedPrivateWardrobeWrites=1,
 'false physical phone':r=>r.physicalMobileDevices=1,
 'false blind accuracy':r=>r.blindAccuracy=1,
 'false release':r=>r.acceptanceForRelease=true,
 'missing worker events':r=>r.pageEvents.workerCreated=0,
 'NaN latency':r=>r.rows[0].elapsedInferenceMs=NaN,
 'network leakage':r=>r.networkBlocked=1,
 'faked checkpoint':r=>r.gateCounts[16].met=true,
 'one source repeated':r=>{r.uniquePublicPhotoSources=1;for(const row of r.rows)row.id='photo-a'},
};
for(const [name,change] of Object.entries(changes))test('blocks '+name,()=>{
 const {r,expected}=fixture();change(r);assert.equal(verifyRealModelSequence(r,expected).status,'BLOCKED');
});
test('missing diagnostic cannot be silently accepted',()=>{
 const {expected}=fixture();assert.equal(verifyRealModelSequence(null,expected).status,'BLOCKED');
});
