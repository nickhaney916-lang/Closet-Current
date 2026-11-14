// Synthetic structure only: no actual model/phone/memory inference evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyRealModelMemory} from '../research/master-consolidation-1054/real-model-memory-gate.mjs';

const commit='a'.repeat(40),hash='b'.repeat(64),worker='c'.repeat(64);
function setup(){
  const target=2,engine='webkit';
  const r={codeCommit:commit,engine,photoAttemptsTarget:target,completedPhotos:target,
    status:'COMPLETE_OBSERVED',failures:[],session:'one-continuous-browser-one-page-sequential-disposable-workers',
    sourceHashesVerified:true,originalPhotoModified:false,autoAdmissions:0,persistedPrivateWardrobeWrites:0,
    ownerSessionIdentityChanged:false,authorizedHostedCloud:false,ownerAccount:'synthetic-only',
    blindAccuracy:null,independentHumanPhotoLabels:0,physicalMobileDevices:0,officialSafariOnIPhone:false,
    acceptanceForRelease:false,familyAlpha:'HOLD',networkBlocked:0,pageErrors:[],
    pageEvents:{pageCrash:0,pageClosed:0,browserDisconnected:0,workerCreated:2},
    workerSourceCodeSha256:worker,uniquePublicPhotoSources:2,
    gateCounts:Object.fromEntries([2,4,8,16].map(n=>[n,{requested:n<=target,met:n<=target}])),
    resourceMeasurements:{
      browserProcessRSSBytes:70*1048576,peakBrowserProcessRSSBytes:90*1048576,
      browserTreeSummedRSSBytes:400*1048576,maxSampledBrowserTreeRSSBytes:500*1048576,
      browserTreePSSBytes:250*1048576,maxSampledBrowserTreePSSBytes:300*1048576,
      processCount:4,maxObservedBrowserProcessCount:5,sampleCount:5,sampleIntervalMs:2000,
      measuredMemory:true,rssComplete:true,pssComplete:true,
      source:'Linux /proc status and smaps_rollup, original browser PID descendants only',
      caveat:'RSS sum double-counts shared memory; PSS can be unavailable. Maxima are sampled, not continuous peaks or OOM proof.'
    },
    rows:Array.from({length:target},(_,i)=>({
      iteration:i+1,id:i===0?'commons-0035':'commons-0062',
      sourceSHA256:hash,observedOriginalSHA256:hash,sourceValid:true,
      workerSourceCodeSha256:worker,realModelFamilies:['fashionclip','fashionSiglip'],
      verifiedAssets:12,elapsedInferenceMs:1200,privateWrites:0,automaticAdmissions:0,
      processRSSBytes:70*1048576,browserTreeSummedRSSBytes:400*1048576,browserTreePSSBytes:250*1048576
    }))
  };
  return {r,expected:{engine,target,commit,sourceHashes:{'commons-0035':hash,'commons-0062':hash}}};
}
test('source-pinned complete memory evidence is measured, never released',()=>{
  const {r,expected}=setup();const outcome=verifyRealModelMemory(r,expected);
  assert.equal(outcome.status,'MEASURED_REAL_MODEL_DESKTOP_ONLY_NOT_RELEASE');
  assert.equal(outcome.releaseAuthorized,false);assert.equal(outcome.familyAlpha,'HOLD');
});
test('unavailable PSS stays explicitly null without falsifying RSS',()=>{
  const {r,expected}=setup();const m=r.resourceMeasurements;
  m.pssComplete=false;m.browserTreePSSBytes=null;m.maxSampledBrowserTreePSSBytes=null;
  for(const row of r.rows)row.browserTreePSSBytes=null;
  assert.equal(verifyRealModelMemory(r,expected).status,'MEASURED_REAL_MODEL_DESKTOP_ONLY_NOT_RELEASE');
});
const cases={
  'missing memory data':r=>delete r.resourceMeasurements,
  'faked source SHA':r=>r.rows[0].observedOriginalSHA256='0'.repeat(64),
  'model did not finish':r=>r.completedPhotos=1,
  'automatic owner save':r=>r.persistedPrivateWardrobeWrites=1,
  'browser crashed':r=>r.pageEvents.pageCrash=1,
  'false release acceptance':r=>r.acceptanceForRelease=true,
  'unmeasured root':r=>r.resourceMeasurements.browserProcessRSSBytes=null,
  'wrong memory process type':r=>r.resourceMeasurements.source='unscoped host RSS',
  'missing sampling':r=>r.resourceMeasurements.sampleCount=0,
  'false process count':r=>r.resourceMeasurements.processCount=0,
  'incomplete RSS':r=>r.resourceMeasurements.rssComplete=false,
  'unavailable summed tree':r=>r.resourceMeasurements.browserTreeSummedRSSBytes=null,
  'invalid PSS':r=>r.resourceMeasurements.browserTreePSSBytes=NaN,
  'PSS completeness lied':r=>{r.resourceMeasurements.pssComplete=false;r.resourceMeasurements.browserTreePSSBytes=200},
  'row did not sample':r=>r.rows[1].processRSSBytes=null,
  'root exceeds summed tree':r=>r.rows[0].browserTreeSummedRSSBytes=1,
  'missing sampled caveat':r=>r.resourceMeasurements.caveat='exact OOM proof',
  'impossible RSS':r=>r.resourceMeasurements.maxSampledBrowserTreeRSSBytes=Infinity,
  'memory source overwritten':r=>r.resourceMeasurements.source='performance.memory',
  'source changed':r=>r.rows[0].sourceValid=false
};
for(const [name,mutation] of Object.entries(cases)){
 test('blocks '+name,()=>{const {r,expected}=setup();mutation(r);
  assert.equal(verifyRealModelMemory(r,expected).status,'BLOCKED');
 });
}
test('null receipt is blocked, never observed',()=>{
 const {expected}=setup();assert.equal(verifyRealModelMemory(null,expected).status,'BLOCKED');
});
