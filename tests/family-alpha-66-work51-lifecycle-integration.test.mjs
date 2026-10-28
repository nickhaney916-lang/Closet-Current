import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build,verify,patchReviewedEditor,REVIEW,PLANNER,MARKER,PARENT,OUTPUT,WORK51_SHA,WORK65_SHA}
 from '../scripts/build-family-alpha-66-work51-review-lifecycle-hold.mjs';
import {proposeIsolationCleanup} from '../research/work51/propose.mjs';

test('exact full compiled asset identity: change only Work51 review UI and add unchanged source proposal',async()=>{
 const r=await verify();
 assert.equal(r.decision,'HOLD');
 assert.equal(r.parentCommit,WORK65_SHA);
 assert.equal(r.work51SourceCommit,WORK51_SHA);
 assert.equal(r.automaticApproved,false);
 assert.equal(r.visualOwnerApproved,false);
 assert.equal(r.deploymentAuthorized,false);
 const before=await readFile(PARENT+'/'+REVIEW,'utf8');
 const after=await readFile(OUTPUT+'/'+REVIEW,'utf8');
 assert.equal(after,patchReviewedEditor(before));
 assert.deepEqual(await readFile(OUTPUT+'/'+PLANNER),await readFile('research/work51/propose.mjs'));
 assert.equal((JSON.parse(await readFile(OUTPUT+'/'+MARKER,'utf8'))).productionModified,false);
});
test('cannot double-patch, tamper source/photo/provider/approval or replace manually corrected masks',async()=>{
 const base=await readFile(PARENT+'/'+REVIEW,'utf8');
 const modified=patchReviewedEditor(base);
 assert.match(modified,/Find automatic cleanup/);
 assert.match(modified,/edits\.length\)return/);
 assert.match(modified,/ack\.checked=false;shoes\.checked=false;paint\(\)/);
 assert.match(modified,/auto\.disabled=edits\.length>0\|\|outlineMode/);
 assert.match(modified,/if\(!event\.isTrusted\|\|finished\|\|signal\?\.aborted\|\|!isActive\(\)\|\|edits\.length\)return/);
 assert.match(modified,/auto\.onclick=null/);
 assert.throws(()=>patchReviewedEditor(modified),/hook changed/);
 const source=await readFile('research/work51/propose.mjs','utf8');
 assert.doesNotMatch(source,/fetch\(|indexedDB|localStorage|sendBeacon|automaticApproval:true|ownerApproved:true/);
 const f={width:32,height:32,rgba:new Uint8ClampedArray(32*32*4)};
 assert.equal(proposeIsolationCleanup(f,{existingEdits:[{action:'remove',x:.1,y:.1,radius:.03}]}).edits.length,0);
});
test('latest photo review cancellation implementation remains identical on Work51 integration branch',async()=>{
 const path='__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs';
 assert.deepEqual(await readFile(OUTPUT+'/'+path),await readFile(PARENT+'/'+path));
 const m=await readFile(OUTPUT+'/'+path,'utf8');
 assert.match(m,/activeReviews\.get\(container\)\?\.\(\)/);
 assert.match(m,/activeReviews\.get\(container\)===cancelReview/);
 assert.match(m,/!event\.isTrusted/);
 const root=await readFile(OUTPUT+'/__alpha_research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs','utf8');
 assert.match(root,/summarizeIsolationReview/);
});
