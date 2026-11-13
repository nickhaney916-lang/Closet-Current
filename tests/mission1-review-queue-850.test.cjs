'use strict';
// P850 pure owner-scoped queue safety. Synthetic JPEG references only.
// These tests are not real photo recognition accuracy or physical-phone QA.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {create}=require('../public/review-queue-850.js');
const app=fs.readFileSync('public/app.js','utf8');
const html=fs.readFileSync('public/index.html','utf8');
const css=fs.readFileSync('public/app-theme.css','utf8');
const user={id:'owner-A'};
const photo=(n,extra={})=>({id:'draft-'+n,image:'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64'),category:'Tops',itemType:'T-shirt',color:'Blue',...extra});
const photos=n=>Array.from({length:n},(_,i)=>photo(i+1));
test('P850 opt-in one-photo navigation never changes draft array or saves/approves an item',()=>{
 const q=create(),drafts=photos(25),original=drafts.map(x=>structuredClone(x));
 let status=q.reconcile(drafts,user);
 assert.equal(status.position,1);assert.equal(status.count,25);
 status=q.move(1,drafts,user);assert.equal(status.position,2);
 status=q.keepForLater(drafts,user);
 assert.equal(status.position,3);assert.equal(status.deferredCount,1);
 q.move(-1,drafts,user);
 assert.equal(q.reconcile(drafts,user).isDeferred,true);
 q.move(1,drafts,user);
 assert.equal(q.reconcile(drafts,user).position,3);
 assert.deepEqual(drafts,original,'navigation and keep for later are ephemeral only');
});
test('P850 keeps the draft after skip, and leaving the queue never modifies wardrobe data',()=>{
 const q=create(),drafts=photos(10);
 const st=q.keepForLater(drafts,user);
 assert.equal(st.deferredCount,1);
 assert.equal(drafts.length,10);
 q.clear();
 const reset=q.reconcile(drafts,user);
 assert.equal(reset.deferredCount,0);
 assert.equal(reset.position,1);
 assert.equal(drafts[0].id,'draft-1');
});
test('P850 after one owner-confirmed save, the next queued source is selected; no duplicate unit is introduced',()=>{
 const q=create(),drafts=photos(3);
 q.move(1,drafts,user);
 const removed=drafts.splice(1,1)[0]; // save happens ONLY in protected Adjust, not queue
 const next=q.reconcile(drafts,user);
 assert.equal(next.count,2);assert.equal(next.current.id,'draft-3');
 assert.equal(next.position,2);
 assert.equal(removed.id,'draft-2');
 assert.deepEqual(drafts.map(x=>x.id),['draft-1','draft-3']);
});
test('P850 changed source/crop or replaced same-id item revokes its keep-for-later marker',()=>{
 const q=create(),drafts=photos(3);
 q.keepForLater(drafts,user);assert.equal(q.reconcile(drafts,user).deferredCount,1);
 drafts[0].image='data:image/jpeg;base64,REVG'; // another source, same object
 assert.equal(q.reconcile(drafts,user).deferredCount,0);
 q.focus('draft-1',drafts,user);
 q.keepForLater(drafts,user);assert.equal(q.reconcile(drafts,user).deferredCount,1);
 drafts[0]=photo(1);
 assert.equal(q.reconcile(drafts,user).deferredCount,0);
});
test('P850 owner switch revokes all queued selection/deferred state, including same ID new signed session',()=>{
 const q=create(),drafts=photos(6);
 q.move(2,drafts,user);q.keepForLater(drafts,user);
 const other={id:'owner-B'},s=q.reconcile(photos(4),other);
 assert.equal(s.ownerChanged,true);assert.equal(s.position,1);
 assert.equal(s.deferredCount,0);
 const sameIdNewSession={id:'owner-B'},newSession=q.reconcile(photos(3),sameIdNewSession);
 assert.equal(newSession.ownerChanged,true);
 assert.equal(newSession.position,1);
});
test('P850 filters foreign-owned draft records and handles invalid/missing owner without image disclosure',()=>{
 const q=create(),drafts=[photo(1),photo(2,{ownerId:'owner-B'}),photo(3,{ownerId:'owner-A'})];
 let st=q.reconcile(drafts,user);
 assert.equal(st.count,2);assert.equal(st.current.id,'draft-1');
 st=q.reconcile(drafts,null);
 assert.equal(st.count,0);assert.equal(st.ownerAuthorized,false);
 st=q.reconcile(drafts,user);
 assert.equal(st.count,2);
});
test('P850 1/25/60 source batch navigation is bounded, consistent and does not retain removed photos',()=>{
 for(const n of [1,25,60]){
  const q=create(),drafts=photos(n);
  for(let i=0;i<n*3;i++)q.move(1,drafts,user);
  let s=q.reconcile(drafts,user);
  assert.equal(s.count,n);assert.equal(s.position,1);
  for(let i=0;i<n;i++)q.keepForLater(drafts,user);
  s=q.reconcile(drafts,user);assert.equal(s.count,n);assert.equal(s.deferredCount,n);
  drafts.length=0;
  s=q.reconcile(drafts,user);
  assert.equal(s.count,0);assert.equal(s.deferredCount,0);
 }
});
test('P850 source contains no save, delete, model, forced ownership, learning or network capability',()=>{
 const module=fs.readFileSync('public/review-queue-850.js','utf8');
 assert.doesNotMatch(module,/savePiece\(|writeAll\(|removeItem\(|fetch\(|indexedDB\.|localStorage\.|XMLHttpRequest/);
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/let saveInFlight=false;/);
 assert.match(app,/function unit70OwnerEvidenceValid\(/);
 assert.match(app,/function learningScope72\(/);
 assert.match(app,/P849_CHANGED_CANDIDATE_OR_OWNER/);
 assert.match(app,/reviewQueue850\.keepForLater\(batch,window\.closetAuth\.user\)/);
 assert.match(app,/if\(!renderReviewQueue850\(\)\)renderPhotoResults/);
 assert.match(app,/reviewQueueSelected850\(\)/);
 assert.match(html,/id="reviewQueue850" type="checkbox"/);
 assert.match(html,/id="reviewQueuePanel850"/);
 assert.match(html,/src="review-queue-850\.js"/);
 assert.match(css,/\.review-queue-panel-850\[hidden\]/);
});
