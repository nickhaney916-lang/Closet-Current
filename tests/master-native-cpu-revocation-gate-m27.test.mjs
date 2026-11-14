// Synthetic contract mutation tests only: never real source/model, real phone or release evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyNativeCPURevocation27} from '../research/master-consolidation-1054/native-cpu-revocation-gate-m27.mjs';
import {CPU25_RUNTIME} from '../research/master-consolidation-1054/native-cpu-review-gate-m25.mjs';
const commit='a'.repeat(40),hash='b'.repeat(64),code='c'.repeat(64),MiB=1048576;
const ids=['commons-0035','commons-0062'],cases=['cancel','owner','lock','source'];
function fixture(){
 const expected={engine:'webkit',target:2,commit,sourceHashes:Object.fromEntries(ids.map(id=>[id,hash]))};
 const r={
  schema:'main1054-m25-native-owner-review-cpu-only-wasm-v1',
  revocationMode:'m27-native-inflight-revocation',
  codeCommit:commit,engine:'webkit',photoAttemptsTarget:2,completedPhotos:2,
  status:'COMPLETE_OBSERVED',failures:[],
  session:'one-continuous-browser-one-page-sequential-disposable-workers',
  sourceHashesVerified:true,originalPhotoModified:false,autoAdmissions:0,
  persistedPrivateWardrobeWrites:0,ownerSessionIdentityChanged:false,
  authorizedHostedCloud:false,ownerAccount:'synthetic-only',blindAccuracy:null,
  independentHumanPhotoLabels:0,physicalMobileDevices:0,officialSafariOnIPhone:false,
  acceptanceForRelease:false,familyAlpha:'HOLD',networkBlocked:0,pageErrors:[],
  pageEvents:{pageCrash:0,pageClosed:0,browserDisconnected:0,workerCreated:6,workerTerminated:6},
  workerSourceCodeSha256:code,uniquePublicPhotoSources:2,
  gateCounts:Object.fromEntries([2,4,8,16].map(n=>[n,{requested:n<=2,met:n<=2}])),
  resourceMeasurements:{
   browserProcessRSSBytes:80*MiB,peakBrowserProcessRSSBytes:90*MiB,
   browserTreeSummedRSSBytes:1200*MiB,maxSampledBrowserTreeRSSBytes:1350*MiB,
   browserTreePSSBytes:1080*MiB,maxSampledBrowserTreePSSBytes:1190*MiB,
   processCount:4,maxObservedBrowserProcessCount:4,sampleCount:10,sampleIntervalMs:2000,
   measuredMemory:true,rssComplete:true,pssComplete:true,
   source:'Linux /proc status and smaps_rollup, original browser PID descendants only',
   caveat:'RSS sum double-counts shared memory; PSS can be unavailable. Maxima are sampled, not continuous peaks or OOM proof.'},
  rows:ids.map((id,i)=>({
   iteration:i+1,id,sourceSHA256:hash,observedOriginalSHA256:hash,
   sourceValid:true,workerSourceCodeSha256:code,
   realModelFamilies:['fashionclip','fashionSiglip'],verifiedAssets:8,elapsedInferenceMs:6000,
   privateWrites:0,automaticAdmissions:0,researchRuntime:'m25-cpu-only-wasm',
   runtimeJS_SHA256:CPU25_RUNTIME.jsSha256,runtimeWASM_SHA256:CPU25_RUNTIME.wasmSha256,
   candidateCount:0,decisionStatus:'abstain',
   processRSSBytes:80*MiB,browserTreeSummedRSSBytes:1200*MiB,browserTreePSSBytes:1080*MiB
  })),
  revocationCases:cases.map((kind,i)=>({
   kind,id:ids[i%2],firstModelProgressObserved:true,
   workerCreatedDelta:1,workerTerminatedDelta:1,observedCancelError:'P82_CANCELLED',
   observedOriginalSHA256:hash,lateModelResultApplied:false,
   itemSavedType:'Unknown',draftTypeBefore:'Unknown',draftTypeAfter:'Unknown',
   ownerApprovalChecked:false,privateWrites:0,automaticAdmissions:0,
   comparisonPanelPresent:kind==='cancel'
  }))
 };
 return {r,expected};
}
test('four native mid-model revocations accepted as desktop research only',()=>{
 const {r,expected}=fixture(),z=verifyNativeCPURevocation27(r,expected);
 assert.equal(z.status,'NATIVE_OWNER_CPU_INFLIGHT_REVOCATION_DESKTOP_ONLY_NOT_RELEASE');
 assert.equal(z.completedRevocations,4);assert.equal(z.releaseAuthorized,false);
});
const bad={
 'missing experiment':r=>delete r.revocationMode,
 'target changed':r=>r.photoAttemptsTarget=16,
 'not all cases':r=>r.revocationCases.pop(),
 'wrong case order':r=>r.revocationCases[1].kind='source',
 'different photo':r=>r.revocationCases[2].id='commons-0078',
 'no first-model progress':r=>r.revocationCases[1].firstModelProgressObserved=false,
 'not one actual worker':r=>r.revocationCases[0].workerCreatedDelta=0,
 'worker not terminated':r=>r.revocationCases[2].workerTerminatedDelta=0,
 'global leaked worker':r=>r.pageEvents.workerTerminated=5,
 'cancel error fabricated':r=>r.revocationCases[0].observedCancelError='P82_TIMEOUT',
 'mutated JPEG':r=>r.revocationCases[3].observedOriginalSHA256='f'.repeat(64),
 'stale result displayed':r=>r.revocationCases[2].lateModelResultApplied=true,
 'stale category applied':r=>r.revocationCases[1].draftTypeAfter='T-shirt',
 'saved subtype changed':r=>r.revocationCases[1].itemSavedType='Sneakers',
 'owner approval checked':r=>r.revocationCases[0].ownerApprovalChecked=true,
 'private save':r=>r.revocationCases[1].privateWrites=1,
 'silent classification save':r=>r.revocationCases[3].automaticAdmissions=1,
 'owner invalidation panel remains':r=>r.revocationCases[1].comparisonPanelPresent=true,
 'manual cancel removes editor':r=>r.revocationCases[0].comparisonPanelPresent=false,
 'missing baseline inference':r=>r.rows.pop(),
 'model source changed':r=>r.rows[0].runtimeJS_SHA256='d'.repeat(64),
 'browser crash':r=>r.pageEvents.pageCrash=1,
 'no process memory':r=>r.resourceMeasurements.sampleCount=0,
 'release hold disabled':r=>r.familyAlpha='OPEN',
 'fake phone claim':r=>r.physicalMobileDevices=1
};
for(const [name,mutate] of Object.entries(bad))test('blocks '+name,()=>{
 const {r,expected}=fixture();mutate(r);
 assert.equal(verifyNativeCPURevocation27(r,expected).status,'BLOCKED');
});
