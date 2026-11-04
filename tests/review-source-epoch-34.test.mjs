import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sceneReviewDefaults32,canConfirmScene32}
 from '../research/multi-garment-capture-01/scene-class-guard-32.mjs';
const app=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
const harness=readFileSync('scripts/verify-review-source-epoch-34.mjs','utf8');

test('same owner with a new source uses fresh monotonic review epoch, never shared canceled flag alone',()=>{
 assert.match(app,/renderVersion\+\+;/);
 assert.match(app,/const owner=getOwner\(\),epoch=renderVersion/);
 assert.match(app,/function currentLoading\(epoch,owner\)/);
 assert.match(app,/renderVersion===epoch&&getOwner\(\)===owner/);
 assert.match(app,/if\(!currentLoading\(epoch,owner\)\)return;/);
 assert.match(app,/if\(currentLoading\(epoch,owner\)\)reset\(/);
 assert.match(app,/const view=state,epoch=renderVersion/);
});
test('stale editor save requires the EXACT source epoch, source object and selected crop membership',()=>{
 assert.match(app,/function currentReview\(view,epoch\)/);
 assert.match(app,/renderVersion===epoch&&state===view&&sameOwner\(\)/);
 assert.match(app,/if\(!currentReview\(view,epoch\)\|\|!view\.pieces\.includes\(piece\)\)/);
 assert.match(app,/throw Error\('Source changed; stale crop cannot affect the current photograph'\)/);
 assert.match(app,/if\(currentReview\(view,epoch\)\)/);
});
test('async save acquires lock before IDB preflight and freezes all explicitly selected garments',()=>{
 assert.match(app,/const selected=state\.pieces\.filter\(x=>x\.confirmed\)/);
 assert.match(app,/const chosen=structuredClone\(selected\)/);
 assert.match(app,/submitting=true;redraw\(\);/);
 assert.match(app,/if\(!currentReview\(view,epoch\)\)return;/);
 assert.match(app,/currentOwner:\(\)=>currentReview\(view,epoch\)\?getOwner\(\):null/);
 assert.match(app,/view\.pieces=view\.pieces\.filter\(x=>!savedIds\.has\(x\.id\)\)/);
 assert.match(app,/const db=getDb\(\)/);
 assert.match(app,/save rejected|Save rejected/);
 assert.match(app,/Garments were saved privately, but the wardrobe display could not refresh/);
});
test('editing and proposing while a batch is committing is disallowed',()=>{
 assert.match(app,/if\(!state\|\|submitting\)return;/);
 assert.match(app,/if\(submitting\)return;/);
 assert.match(app,/add\.disabled=submitting;suggest\.disabled=submitting/);
 assert.match(app,/sel\.disabled=submitting/);
 assert.match(app,/colorInput\.disabled=submitting/);
 assert.match(app,/edit\.disabled=submitting;remove\.disabled=submitting/);
});
test('model classification and human authority from 32 remain enforced',()=>{
 const raw={personDetected:false,hint:{categories:['Dresses'],confidence:.99,clipped:false},
  colorEstimate:{color:'Red'}};
 assert.deepEqual(sceneReviewDefaults32(raw).category,'Uncategorized');
 assert.equal(canConfirmScene32({category:'Uncategorized',itemType:'Unknown',color:'',manual:false},
  {types:{Dresses:['Dress']}}),false);
 assert.match(app,/sceneReviewDefaults32\(raw\)/);
 assert.match(app,/canConfirmScene32\(x,schema\)/);
 assert.match(app,/atomicSaveGarments24/);
});
test('real-browser research runner distinguishes synthetic photos/worker proposals from actual SegFormer inference',()=>{
 assert.match(harness,/new Worker|window\.Worker=FixtureWorker/);
 assert.match(harness,/genuineSegFormerInference:false/);
 assert.match(harness,/benchmarkOfSegmentationAccuracy:false/);
 assert.match(harness,/realNativeIndexedDB:true/);
 assert.match(harness,/originalBSourceSHA/);
 assert.match(harness,/staleCropRejected:true/);
 assert.match(harness,/cancelledSaveNoWrites:true/);
 assert.match(harness,/sourcePhotoSHAUnchanged:true/);
 assert.match(harness,/physicalPhoneAcceptance:false/);
 assert.doesNotMatch(harness,/process\.env\.(SUPABASE|SERVICE_ROLE|ANON_KEY)/);
});
