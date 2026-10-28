import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {verify,patchReviewedEditor,OUTPUT,PARENT,REVIEW,WORK52_PLANNER,FIT_EDITOR,FIT_PORTABLE,MARKER,PINS}
 from '../scripts/build-family-alpha-68-consolidated-hold.mjs';
import {proposeIsolationCleanup} from '../research/work52/propose.mjs';
test('protected no-deploy integration changes only proposal import and new Work52 planner',async()=>{
 const v=await verify();
 assert.equal(v.decision,'HOLD');
 assert.equal(v.automaticApproved,false);
 assert.equal(v.deploymentAuthorized,false);
 const old=await readFile(PARENT+'/'+REVIEW,'utf8');
 const current=await readFile(OUTPUT+'/'+REVIEW,'utf8');
 assert.equal(current,patchReviewedEditor(old));
 assert.match(current,/Find automatic cleanup/);
 assert.match(current,/!event\.isTrusted/);
 assert.match(current,/edits\.length\)return/);
 assert.match(current,/ack\.checked=false;shoes\.checked=false;paint\(\)/);
 assert.throws(()=>patchReviewedEditor(current),/Exact Work51 integration import moved/);
 assert.deepEqual(await readFile(OUTPUT+'/'+WORK52_PLANNER),
  await readFile('research/work52/propose.mjs'));
 const marker=JSON.parse(await readFile(OUTPUT+'/'+MARKER,'utf8'));
 assert.deepEqual(marker.pins,PINS);
 assert.equal(marker.realPhotoVisualPass,undefined,'No synthetic visual PASS promotion');
});
test('reviewed cutout fit export/restore source remains byte-identical; private session and supersession untouched',async()=>{
 for(const [file,source] of [[FIT_EDITOR,'research/work47/editor.mjs'],
  [FIT_PORTABLE,'research/work47/portable-fit.mjs']])
  assert.deepEqual(await readFile(OUTPUT+'/'+file),await readFile(source));
 const confirm=await readFile(OUTPUT+'/__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs','utf8');
 assert.match(confirm,/activeReviews\.get\(container\)===cancelReview/);
 assert.match(confirm,/!event\.isTrusted/);
 const source=await readFile('research/work52/propose.mjs','utf8');
 assert.doesNotMatch(source,/fetch\(|indexedDB|localStorage|sendBeacon|automaticApproval:true|ownerApproved:true/);
 const base={width:32,height:32,rgba:new Uint8ClampedArray(32*32*4)};
 assert.equal(proposeIsolationCleanup(base,{existingEdits:[{action:'remove',x:.5,y:.5,radius:.02}]}).edits.length,0);
});
