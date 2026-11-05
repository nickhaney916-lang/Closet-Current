import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
const harness=readFileSync('scripts/verify-review-worker-finality-38.mjs','utf8');
const at=(pattern)=>{const m=pattern.exec(ui);assert.ok(m,pattern.source);return m.index;};
test('WORKER38 revokes active worker and clears timeout before first IDB preflight',()=>{
 const lock=at(/submitting=true;redraw\(\);freezeDetector38\(\);/);
 const preflight=at(/const existing=await new Promise\(\(resolve,reject\)=>\{/);
 assert.ok(lock<preflight);
 assert.match(ui,/function freezeDetector38\(\)\{\s*if\(!job\)return false;\s*const running=job;job=null;\s*clearTimeout\(running.timeout\);\s*running.worker\?\.terminate\(\);/);
 assert.match(ui,/const view=state,epoch=renderVersion,owner=view.owner,proof=view.proof/);
 assert.match(ui,/snapshotConfirmations34\(state.pieces,schema\)/);
});
test('WORKER38 late proposals cannot append or redraw reviewed pieces during Save',()=>{
 assert.match(ui,/async function addDetected\(raw,session\)\{\s*if\(submitting\|\|!state\|\|session!==job\|\|!sameOwner\(\)\|\|\s*state\.pieces\.length>=MAX_TOTAL_REGIONS58\)return;/);
 assert.match(ui,/next.worker.onmessage=event=>\{\s*if\(job!==next\|\|submitting\|\|!sameOwner\(\)\)return;/);
 assert.match(ui,/next.timeout=setTimeout\(\(\)=>\{if\(job===next&&!submitting\)/);
 assert.match(ui,/next.worker.onerror=\(\)=>\{if\(job!==next\|\|submitting\)return;/);
});
test('WORKER38 still preserves source proof and atomically commits only confirmed clone',()=>{
 assert.match(ui,/pieces:snapshots,ownerId:owner/);
 assert.match(ui,/currentOwner:\(\)=>currentReview\(view,epoch\)\?getOwner\(\):null/);
 assert.match(ui,/view.pieces=view.pieces.filter\(x=>!savedIds.has\(x.id\)\)/);
 assert.match(ui,/status.textContent=saveReceipt34\(rows.length,notificationFailed,refreshFailed\)/);
 assert.match(ui,/window.addEventListener\('closet:session-locked'/);
});
test('WORKER38 real browser proof requires an active worker, late message injection, and genuine owner IDB',()=>{
 assert.match(harness,/if\(!stale\?\.closed\)throw Error/);
 assert.match(harness,/type:'piece',piece:latePiece/);
 assert.match(harness,/type:'progress',phase:'separating'/);
 assert.match(harness,/type:'done'/);
 assert.match(harness,/stale.onerror\?\./);
 assert.match(harness,/lateWorkerReceiptUnaffected:true/);
 assert.match(harness,/workerTerminatedOnSave:true/);
 assert.match(harness,/realIndexedDBSingleAtomicCommit:true/);
 assert.match(harness,/realSegFormerRun:false/);
 assert.match(harness,/realCustomerData:false/);
 assert.doesNotMatch(harness,/process.env\.(SUPABASE|SERVICE_ROLE|ANON_KEY)/);
});
