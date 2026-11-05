import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {needsRemoveReviewConsent76,REMOVE_REVIEW_PROMPT76} from '../research/remove-reviewed-garment-76/remove-review-guard.mjs';

const sameOwner={currentOwner:'owner-A',reviewOwner:'owner-A',dbName:'closet-current-user-owner-A',submitting:false};
test('REMOVE76 human-approved crop/individual clothing corrections require consent before per-piece removal',()=>{
 const reviewed=[
  {manual:true}, {cropReviewed:true},{confirmed:true},
  {category:'Tops'},{itemType:'Button-down shirt'},{color:'Blue'},
  {userAdjusted:true}
 ];
 for(const piece of reviewed)
  assert.equal(needsRemoveReviewConsent76({...sameOwner,piece}),true,JSON.stringify(piece));
 assert.match(REMOVE_REVIEW_PROMPT76,/Remove this one garment.*Choose Cancel to keep/);
});
test('REMOVE76 untouched AI suggestions remain removable without intrusive prompt',()=>{
 for(const piece of [null,undefined,{},{
  manual:false,cropReviewed:false,confirmed:false,userAdjusted:false,
  category:'Uncategorized',itemType:'Unknown',color:''
 }])
  assert.equal(needsRemoveReviewConsent76({...sameOwner,piece}),false,JSON.stringify(piece));
});
test('REMOVE76 account/session/saving mismatch cannot authorize private source work',()=>{
 for(const changed of [
  {currentOwner:''},{currentOwner:undefined},{currentOwner:'owner-B'},
  {reviewOwner:'owner-B'},{dbName:'closet-current-user-owner-B'},
  {dbName:undefined},{submitting:true}
 ])assert.equal(needsRemoveReviewConsent76({...sameOwner,piece:{manual:true,confirmed:true},...changed}),false);
});
test('REMOVE76 real native removal UI validates owner and prompts before splice; dismissal preserves unchanged item',()=>{
 const s=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 const start=s.indexOf("const remove=button('Remove detection'");
 const end=s.indexOf("edit.disabled=submitting;remove.disabled=submitting",start);
 assert.ok(start>=0&&end>start);
 const part=s.slice(start,end);
 const owner=part.indexOf('if(!sameOwner())');
 const guard=part.indexOf('needsRemoveReviewConsent76({');
 const prompt=part.indexOf('window.confirm(REMOVE_REVIEW_PROMPT76)');
 const decline=part.indexOf('if(!approved){');
 const splice=part.indexOf('state.pieces.splice(');
 assert.ok(owner>=0&&owner<guard&&guard<prompt&&prompt<decline&&decline<splice);
 assert.doesNotMatch(part.slice(0,prompt),/state.pieces.splice|revoke\(/);
 assert.doesNotMatch(part.slice(decline,splice),/state.pieces.splice/);
 assert.match(part,/Garment removal canceled/);
 assert.match(part,/if\(classification42\?\.piece===p\)cancelClassification42\(\)/);
 assert.match(part,/Other reviewed garments and the original photograph remain unchanged/);
 assert.match(part,/if\(submitting\|\|!state\|\|!state.pieces.includes\(p\)\)return/);
});
test('REMOVE76 all accepted removal mutations are in unsaved state; owner-private committed items are not edited',()=>{
 const s=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 const start=s.indexOf("const remove=button('Remove detection'");
 const end=s.indexOf("edit.disabled=submitting;remove.disabled=submitting",start);
 const part=s.slice(start,end);
 assert.doesNotMatch(part,/db\.transaction|queued\(|atomicSaveGarments24|original\.removeAttribute/);
 assert.match(part,/state.pieces.splice\(state.pieces.indexOf\(p\),1\)/);
 assert.match(s,/addEventListener\('closet:session-locked',\(\)=>reset\(/);
});
test('REMOVE76 genuine native browser original-JPEG independent per-piece deny/accept/re-crop acceptance evidence',()=>{
 const s=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
 for(const item of [
  "const remove76=process.env.REMOVE76==='1'",
  '02a-dismiss-remove-keeps-three-reviewed-garments-all',
  '02b-approve-removes-only-shoe-preserves-other-two-all',
  'individualReviewRemoveSafeguard76:remove76',
  "await realCrop(page,2,cases[2])",
  "await page.locator('#multi24Grid .multi24-card').last().getByRole('button',{name:'Remove detection'}).click()"
 ])assert.ok(s.includes(item),'Missing required real-browser REMOVE76 evidence '+item);
});
