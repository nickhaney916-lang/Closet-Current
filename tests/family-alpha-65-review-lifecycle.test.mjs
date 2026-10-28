import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {patchReview,verify,CONFIRM,PARENT,OUTPUT}
 from '../scripts/build-family-alpha-65-review-lifecycle-hold.mjs';

test('one audited photo review module gets cancellable scoped lifecycle, not any source/photo/owner logic',async()=>{
 const source=await readFile(PARENT+'/'+CONFIRM,'utf8');
 const changed=patchReview(source);
 assert.equal(changed.includes('activeReviews=new WeakMap()'),true);
 assert.equal(changed.includes('activeReviews.get(container)?.()'),true);
 assert.match(changed,/if\(activeReviews\.get\(container\)===cancelReview\)/);
 assert.match(changed,/if\(container\.contains\(panel\)\)container\.replaceChildren\(\)/);
 assert.match(changed,/!event\.isTrusted/);
 assert.match(changed,/done\(isActive\(\)\)/);
 assert.match(changed,/signal\?\.removeEventListener\('abort',onAbort\)/);
 assert.match(changed,/removeEventListener\?\.\('pagehide',onAbort\)/);
 assert.match(changed,/function onRetake\(\)\{done\(false\);\}/);
 assert.match(changed,/activeReviews\.delete\(container\)/);
 assert.equal(changed.split('activeReviews.set(container,cancelReview)').length,2);
 assert.doesNotMatch(changed,/fetch\(|localStorage|indexedDB|sendBeacon|innerHTML|crypto\.|approved-for-staging-preview/);
 assert.throws(()=>patchReview(changed),/source changed/,'Double-patch should fail closed');
});
test('verified original-byte source pin: all compiled photos, fit, masks, auth and wardrobe assets unchanged',async()=>{
 const r=await verify();
 assert.equal(r.decision,'HOLD');
 assert.equal(r.onlyReviewLifecycleChanged,true);
 assert.equal(r.automaticApproved,false);
 assert.equal(r.visualOwnerApproved,false);
 assert.equal(r.deploymentAuthorized,false);
 const before=await readFile(PARENT+'/'+CONFIRM,'utf8');
 const after=await readFile(OUTPUT+'/'+CONFIRM,'utf8');
 assert.equal(after,patchReview(before));
});
test('only safe lifecycle keying by actual DOM element; no global account or history data persists',async()=>{
 const after=await readFile(OUTPUT+'/'+CONFIRM,'utf8');
 assert.match(after,/const activeReviews=new WeakMap\(\)/);
 assert.match(after,/activeReviews\.get\(container\)/);
 assert.match(after,/activeReviews\.set\(container,cancelReview\)/);
 assert.doesNotMatch(after,/\.set\(ownerId|\.set\(itemId|\.set\(sourceVersion|new Map\(/);
 assert.match(after,/confirm\.removeEventListener\('click',onConfirm\)/);
 assert.match(after,/retake\.removeEventListener\('click',onRetake\)/);
});
