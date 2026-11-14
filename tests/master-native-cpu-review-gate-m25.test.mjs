// Synthetic numeric/owner contracts ONLY. Not independently witnessed hardware or model.
import test from 'node:test';
import assert from 'node:assert/strict';
import {CPU25_RUNTIME,verifyNativeCPU25} from '../research/master-consolidation-1054/native-cpu-review-gate-m25.mjs';
const commit='a'.repeat(40),h='b'.repeat(64),w='c'.repeat(64),MiB=1048576;
const names=['commons-0035','commons-0062'];
function fixture(){
 const expected={engine:'webkit',target:2,commit,
  sourceHashes:Object.fromEntries(names.map(id=>[id,h]))};
 const r={schema:'main1054-m25-native-owner-review-cpu-only-wasm-v1',
  codeCommit:commit,engine:'webkit',photoAttemptsTarget:2,completedPhotos:2,
  status:'COMPLETE_OBSERVED',failures:[],
  session:'one-continuous-browser-one-page-sequential-disposable-workers',
  sourceHashesVerified:true,originalPhotoModified:false,autoAdmissions:0,
  persistedPrivateWardrobeWrites:0,ownerSessionIdentityChanged:false,
  authorizedHostedCloud:false,ownerAccount:'synthetic-only',
  blindAccuracy:null,independentHumanPhotoLabels:0,physicalMobileDevices:0,
  officialSafariOnIPhone:false,acceptanceForRelease:false,familyAlpha:'HOLD',
  networkBlocked:0,pageErrors:[],
  pageEvents:{pageCrash:0,pageClosed:0,browserDisconnected:0,
   workerCreated:2,workerTerminated:2},
  workerSourceCodeSha256:w,uniquePublicPhotoSources:2,
  gateCounts:Object.fromEntries([2,4,8,16].map(n=>[n,{requested:n<=2,met:n<=2}])),
  resourceMeasurements:{
   browserProcessRSSBytes:80*MiB,peakBrowserProcessRSSBytes:80*MiB,
   browserTreeSummedRSSBytes:1200*MiB,maxSampledBrowserTreeRSSBytes:1350*MiB,
   browserTreePSSBytes:1080*MiB,maxSampledBrowserTreePSSBytes:1190*MiB,
   processCount:4,maxObservedBrowserProcessCount:4,
   sampleCount:10,sampleIntervalMs:2000,measuredMemory:true,rssComplete:true,
   pssComplete:true,source:'Linux /proc status and smaps_rollup, original browser PID descendants only',
   caveat:'RSS sum double-counts shared memory; PSS can be unavailable. Maxima are sampled, not continuous peaks or OOM proof.'},
  rows:names.map((id,i)=>({
   iteration:i+1,id,sourceSHA256:h,observedOriginalSHA256:h,sourceValid:true,
   workerSourceCodeSha256:w,realModelFamilies:['fashionclip','fashionSiglip'],
   verifiedAssets:8,elapsedInferenceMs:10000,privateWrites:0,automaticAdmissions:0,
   researchRuntime:'m25-cpu-only-wasm',
   runtimeJS_SHA256:CPU25_RUNTIME.jsSha256,
   runtimeWASM_SHA256:CPU25_RUNTIME.wasmSha256,
   candidateCount:0,decisionStatus:'abstain',
   processRSSBytes:80*MiB,browserTreeSummedRSSBytes:1200*MiB,browserTreePSSBytes:1080*MiB
  }))
 };
 return {r,expected};
}
test('complete source-bound owner-safe CPU review is research only',()=>{
 const {r,expected}=fixture(),a=verifyNativeCPU25(r,expected);
 assert.equal(a.status,'NATIVE_OWNER_CPU_WASM_OBSERVED_NOT_RELEASE');
 assert.equal(a.releaseAuthorized,false);assert.equal(a.ownerReviewRequired,true);
});
const changes={
 'JSEP masquerading as CPU':r=>r.rows[0].runtimeJS_SHA256='e'.repeat(64),
 'wrong CPU WASM weight':r=>r.rows[0].runtimeWASM_SHA256='f'.repeat(64),
 'wrong research worker':r=>r.rows[0].researchRuntime='jsep-production',
 'false full runtime integration':r=>r.schema='unverified',
 'original JPEG modified':r=>r.rows[0].observedOriginalSHA256='0'.repeat(64),
 'source identity changed':r=>r.codeCommit='e'.repeat(40),
 'one photo missing':r=>r.rows.pop(),
 'one model missing':r=>r.rows[0].realModelFamilies=['fashionclip'],
 'worker not cleaned up':r=>r.pageEvents.workerTerminated=0,
 'page crash':r=>r.pageEvents.pageCrash=1,
 'owner private write':r=>r.persistedPrivateWardrobeWrites=1,
 'automatically admitted subtype':r=>r.autoAdmissions=1,
 'bad model decision':r=>r.rows[0].decisionStatus='certain',
 'negative suggested count':r=>r.rows[1].candidateCount=-1,
 'no real memory':r=>r.resourceMeasurements.sampleCount=0,
 'missing PSS':r=>r.resourceMeasurements.pssComplete=false,
 'network leakage':r=>r.networkBlocked=1,
 'real owner account asserted':r=>r.ownerAccount='production',
 'fake iPhone':r=>r.physicalMobileDevices=1,
 'release hold removed':r=>r.familyAlpha='OPEN'
};
for(const [name,mutation] of Object.entries(changes))
 test('blocks '+name,()=>{
  const {r,expected}=fixture();mutation(r);
  assert.equal(verifyNativeCPU25(r,expected).status,'BLOCKED');
 });
test('null receipt fails closed',()=>{
 const {expected}=fixture();assert.equal(verifyNativeCPU25(null,expected).status,'BLOCKED');
});
