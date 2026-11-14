// Synthetic adversarial fixtures; never count as physical Android phone proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyAndroidEmulated29} from '../research/master-consolidation-1054/android-emulated-cpu16-gate-m29.mjs';
import {CPU25_RUNTIME} from '../research/master-consolidation-1054/native-cpu-review-gate-m25.mjs';
const commit='a'.repeat(40),hash='b'.repeat(64),code='c'.repeat(64),mib=1048576;
const ids=['commons-0035','commons-0062','commons-0078','commons-0059'];
function setup(){
 const expected={engine:'chromium',target:16,commit,sourceHashes:Object.fromEntries(ids.map(id=>[id,hash]))};
 const r={
  schema:'main1054-m29-android-emulated-cpu-owner-review-v1',
  codeCommit:commit,engine:'chromium',photoAttemptsTarget:16,completedPhotos:16,
  status:'COMPLETE_OBSERVED',failures:[],sourceHashesVerified:true,originalPhotoModified:false,
  session:'one-continuous-browser-one-page-sequential-disposable-workers',
  ownerAccount:'synthetic-only',authorizedHostedCloud:false,ownerSessionIdentityChanged:false,
  persistedPrivateWardrobeWrites:0,autoAdmissions:0,blindAccuracy:null,independentHumanPhotoLabels:0,
  physicalMobileDevices:0,physicalDeviceEvidence:false,officialSafariOnIPhone:false,
  acceptanceForRelease:false,familyAlpha:'HOLD',pageErrors:[],networkBlocked:0,
  uniquePublicPhotoSources:4,
  mobileEmulationEvidence:{androidUserAgent:true,touchPoints:5,coarsePointer:true,innerWidth:393,devicePixelRatio:2.625},
  pageEvents:{pageCrash:0,pageClosed:0,browserDisconnected:0,workerCreated:16,workerTerminated:16},
  workerSourceCodeSha256:code,
  gateCounts:Object.fromEntries([2,4,8,16].map(n=>[n,{requested:true,met:true}])),
  resourceMeasurements:{
   browserProcessRSSBytes:60*mib,peakBrowserProcessRSSBytes:90*mib,
   browserTreeSummedRSSBytes:1550*mib,maxSampledBrowserTreeRSSBytes:1800*mib,
   browserTreePSSBytes:1340*mib,maxSampledBrowserTreePSSBytes:1650*mib,
   processCount:5,maxObservedBrowserProcessCount:6,
   sampleCount:65,sampleIntervalMs:2000,measuredMemory:true,rssComplete:true,pssComplete:true,
   source:'Linux /proc status and smaps_rollup, original browser PID descendants only',
   caveat:'RSS sum double-counts shared memory; PSS can be unavailable. Maxima are sampled, not continuous peaks or OOM proof.'},
  rows:Array.from({length:16},(_,i)=>({
   iteration:i+1,id:ids[i%4],sourceSHA256:hash,observedOriginalSHA256:hash,
   sourceValid:true,workerSourceCodeSha256:code,realModelFamilies:['fashionclip','fashionSiglip'],
   verifiedAssets:8,elapsedInferenceMs:6500,privateWrites:0,automaticAdmissions:0,
   researchRuntime:'m25-cpu-only-wasm',runtimeJS_SHA256:CPU25_RUNTIME.jsSha256,
   runtimeWASM_SHA256:CPU25_RUNTIME.wasmSha256,candidateCount:0,decisionStatus:'abstain',
   processRSSBytes:60*mib,browserTreeSummedRSSBytes:1530*mib,browserTreePSSBytes:1300*mib
  }))
 };
 return {r,expected};
}
test('desktop Chromium Android emulation passes only as NOT release',()=>{
 const {r,expected}=setup(),v=verifyAndroidEmulated29(r,expected);
 assert.equal(v.status,'ANDROID_EMULATED_CHROMIUM_NATIVE_CPU16_OBSERVED_NOT_RELEASE');
 assert.equal(v.actualPhysicalAndroidDevice,false);
 assert.equal(v.releaseAuthorized,false);
 assert.equal(v.completed,16);
});
const mutations={
 'desktop user-agent':r=>r.mobileEmulationEvidence.androidUserAgent=false,
 'zero touch points':r=>r.mobileEmulationEvidence.touchPoints=0,
 'fine pointer':r=>r.mobileEmulationEvidence.coarsePointer=false,
 'large desktop viewport':r=>r.mobileEmulationEvidence.innerWidth=1024,
 'wrong pixel density':r=>r.mobileEmulationEvidence.devicePixelRatio=1,
 'falsified physical Android':r=>r.physicalDeviceEvidence=true,
 'fake physical phone':r=>r.physicalMobileDevices=1,
 'wrong browser':r=>r.engine='webkit',
 'wrong source SHA':r=>r.rows[2].observedOriginalSHA256='d'.repeat(64),
 'missing model':r=>r.rows[3].realModelFamilies=['fashionclip'],
 'wrong runtime module':r=>r.rows[8].runtimeJS_SHA256='f'.repeat(64),
 'wrong CPU binary':r=>r.rows[11].runtimeWASM_SHA256='e'.repeat(64),
 'worker not terminated':r=>r.pageEvents.workerTerminated=15,
 'browser crashed':r=>r.pageEvents.pageCrash=1,
 'changed owner':r=>r.ownerSessionIdentityChanged=true,
 'private wardrobe written':r=>r.persistedPrivateWardrobeWrites=1,
 'silent garment save':r=>r.rows[14].automaticAdmissions=1,
 'unauthorized release':r=>r.familyAlpha='READY',
 'missing end inference memory':r=>r.rows[15].browserTreePSSBytes=null,
 'missing one photo':r=>r.rows.pop(),
 'insufficient photos':r=>r.completedPhotos=15,
 'wrong original sequence':r=>r.rows[7].id='commons-0035',
 'unsupported decision':r=>r.rows[10].decisionStatus='certain',
 'missing process sampling':r=>r.resourceMeasurements.sampleCount=0,
 'not same committed code':r=>r.codeCommit='f'.repeat(40),
 'unverified photo corpus':r=>r.sourceHashesVerified=false
};
for(const [name,change] of Object.entries(mutations))
 test('reject '+name,()=>{
  const {r,expected}=setup();change(r);
  assert.equal(verifyAndroidEmulated29(r,expected).status,'BLOCKED');
 });
