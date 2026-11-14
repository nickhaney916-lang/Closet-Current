// Synthetic source/owner endurance regression fixtures only, never model proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyNativeCPUEndurance26} from '../research/master-consolidation-1054/native-cpu-16-endurance-gate-m26.mjs';
import {CPU25_RUNTIME} from '../research/master-consolidation-1054/native-cpu-review-gate-m25.mjs';
const commit='a'.repeat(40),hash='b'.repeat(64),code='c'.repeat(64),MiB=1048576;
const ids=['commons-0035','commons-0062','commons-0078','commons-0059'];
function fixture(){
 const r={
  schema:'main1054-m25-native-owner-review-cpu-only-wasm-v1',
  codeCommit:commit,engine:'webkit',photoAttemptsTarget:16,completedPhotos:16,
  status:'COMPLETE_OBSERVED',failures:[],
  session:'one-continuous-browser-one-page-sequential-disposable-workers',
  sourceHashesVerified:true,originalPhotoModified:false,autoAdmissions:0,
  persistedPrivateWardrobeWrites:0,ownerSessionIdentityChanged:false,
  authorizedHostedCloud:false,ownerAccount:'synthetic-only',blindAccuracy:null,
  independentHumanPhotoLabels:0,physicalMobileDevices:0,officialSafariOnIPhone:false,
  acceptanceForRelease:false,familyAlpha:'HOLD',networkBlocked:0,pageErrors:[],
  pageEvents:{pageCrash:0,pageClosed:0,browserDisconnected:0,workerCreated:16,workerTerminated:16},
  workerSourceCodeSha256:code,uniquePublicPhotoSources:4,
  gateCounts:Object.fromEntries([2,4,8,16].map(n=>[n,{requested:true,met:true}])),
  resourceMeasurements:{
   browserProcessRSSBytes:80*MiB,peakBrowserProcessRSSBytes:90*MiB,
   browserTreeSummedRSSBytes:1500*MiB,maxSampledBrowserTreeRSSBytes:1550*MiB,
   browserTreePSSBytes:1300*MiB,maxSampledBrowserTreePSSBytes:1400*MiB,
   processCount:4,maxObservedBrowserProcessCount:4,sampleCount:75,sampleIntervalMs:2000,
   measuredMemory:true,rssComplete:true,pssComplete:true,
   source:'Linux /proc status and smaps_rollup, original browser PID descendants only',
   caveat:'RSS sum double-counts shared memory; PSS can be unavailable. Maxima are sampled, not continuous peaks or OOM proof.'},
  rows:Array.from({length:16},(_,i)=>({
   iteration:i+1,id:ids[i%4],sourceSHA256:hash,observedOriginalSHA256:hash,
   sourceValid:true,workerSourceCodeSha256:code,
   realModelFamilies:['fashionclip','fashionSiglip'],
   verifiedAssets:8,elapsedInferenceMs:6000,
   privateWrites:0,automaticAdmissions:0,
   researchRuntime:'m25-cpu-only-wasm',runtimeJS_SHA256:CPU25_RUNTIME.jsSha256,
   runtimeWASM_SHA256:CPU25_RUNTIME.wasmSha256,
   candidateCount:0,decisionStatus:'abstain',
   processRSSBytes:80*MiB,browserTreeSummedRSSBytes:1500*MiB,
   browserTreePSSBytes:(1250+i*2)*MiB
  }))
 };
 const expected={engine:'webkit',target:16,commit,
  sourceHashes:Object.fromEntries(ids.map(id=>[id,hash]))};
 return {r,expected};
}
test('exact 16-photo numeric owner contract remains strictly no-release',()=>{
 const {r,expected}=fixture(),z=verifyNativeCPUEndurance26(r,expected);
 assert.equal(z.status,'NATIVE_CPU_16_PHOTO_ENDURANCE_DESKTOP_ONLY_NOT_RELEASE');
 assert.equal(z.completed,16);assert.equal(z.releaseAuthorized,false);
});
const bad={
 'partial progress':r=>r.completedPhotos=15,
 'missing row':r=>r.rows.pop(),
 'wrong JPEG source order':r=>r.rows[8].id='commons-0062',
 'original bytes changed':r=>r.rows[9].observedOriginalSHA256='d'.repeat(64),
 'wrong code commit':r=>r.codeCommit='0'.repeat(40),
 'missing worker':r=>r.pageEvents.workerCreated=15,
 'worker leak':r=>r.pageEvents.workerTerminated=15,
 'spurious browser disconnect':r=>r.pageEvents.browserDisconnected=1,
 'silent garment save':r=>r.autoAdmissions=1,
 'original wardrobe touched':r=>r.persistedPrivateWardrobeWrites=1,
 'wrong model family':r=>r.rows[5].realModelFamilies=['fashionclip','fashionclip'],
 'switch runtime without source proof':r=>r.rows[12].runtimeJS_SHA256='a'.repeat(64),
 'incomplete worker runtime evidence':r=>r.rows[0].researchRuntime=null,
 'missing last PSS sample':r=>r.rows[15].browserTreePSSBytes=null,
 'missing sampled process tree':r=>r.resourceMeasurements.rssComplete=false,
 'incomplete 16-checkpoint':r=>r.gateCounts[16].met=false,
 'fake release':r=>r.familyAlpha='READY',
 'fake physical mobile':r=>r.physicalMobileDevices=1,
 'fake blind accuracy':r=>r.blindAccuracy=.95,
 'classification without review':r=>r.rows[11].decisionStatus='certain'
};
for(const [name,mutation] of Object.entries(bad))
 test('blocks '+name,()=>{
  const {r,expected}=fixture();mutation(r);
  assert.equal(verifyNativeCPUEndurance26(r,expected).status,'BLOCKED');
 });
