import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {needsCancelReviewConsent74,CANCEL_REVIEW_PROMPT74} from '../research/cancel-reviewed-capture-74/cancel-review-guard.mjs';
const owner='fixture-A';
const base={currentOwner:owner,reviewOwner:owner,dbName:'closet-current-user-'+owner,submitting:false};
test('CANCEL74 any human crop, manual mark, subtype or color review prompts before destruction',()=>{
 for(const pieces of [
  [{manual:true,confirmed:false}], [{cropReviewed:true}],
  [{confirmed:true}], [{category:'Tops'}], [{itemType:'Jeans'}],
  [{color:'Blue'}], [{userAdjusted:true}]
 ])assert.equal(needsCancelReviewConsent74({...base,pieces}),true,JSON.stringify(pieces));
 assert.match(CANCEL_REVIEW_PROMPT74,/Discard this unfinished review.*Choose Cancel to keep/);
});
test('CANCEL74 first photo, model-only unreviewed regions and after-save empty review cancel without intrusive prompt',()=>{
 for(const pieces of [[],null,[{manual:false,cropReviewed:false,confirmed:false,category:'Uncategorized',itemType:'Unknown',color:''}]])
  assert.equal(needsCancelReviewConsent74({...base,pieces}),false,JSON.stringify(pieces));
});
test('CANCEL74 owner, authenticated database and in-progress save fail closed',()=>{
 for(const args of [
  {currentOwner:undefined},{currentOwner:'fixture-B'},{reviewOwner:'fixture-B'},
  {dbName:'closet-current-user-fixture-B'}, {dbName:null},{submitting:true}
 ])assert.equal(needsCancelReviewConsent74({...base,pieces:[{confirmed:true}],...args}),false);
});
test('CANCEL74 native review handler asks prior to revoke and dismiss preserves real source/crops',()=>{
 const source=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 const start=source.indexOf("const cancel=button('Cancel extraction'");
 const finish=source.indexOf("const add=button('Add missed piece'",start);
 assert.ok(start>=0&&finish>start);
 const body=source.slice(start,finish);
 const guard=body.indexOf('needsCancelReviewConsent74({');
 const dialog=body.indexOf('window.confirm(CANCEL_REVIEW_PROMPT74)');
 const decline=body.indexOf('if(!approved){');
 const reset=body.lastIndexOf("reset('Unfinished extraction canceled");
 assert.ok(guard>=0&&guard<dialog&&dialog<decline&&decline<reset);
 assert.match(body,/state&&!sameOwner\(\)/);
 assert.match(body,/Extraction cancellation dismissed/);
 assert.doesNotMatch(body.slice(decline,reset),/revoke\(\)/);
 assert.match(body,/if\(submitting\)/);
});
test('CANCEL74 session lock and pagehide still synchronously revoke images without user prompt',()=>{
 const s=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(s, /addEventListener\('closet:alpha-session-changed',\(\)=>reset\(/);
 assert.match(s, /addEventListener\('closet:session-locked',\(\)=>reset\(/);
 assert.match(s, /addEventListener\('pagehide',\(\)=>revoke\(\)\)/);
});
test('CANCEL74 six real native original-JPEG cancel dismiss/approve browser paths required',()=>{
 const s=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
 for(const mark of [
  "const cancel74=process.env.CANCEL74==='1'",
  '02a-dismiss-cancel-keeps-three-human-reviewed-source-all',
  '03c-accept-cancel-revokes-unsaved-keeps-three-private-all',
  "cancellationPreservesHumanReview74:cancel74",
  "await page.getByRole('button',{name:'Cancel extraction'}).click()"
 ])assert.ok(s.includes(mark),'Missing genuine-browser cancel evidence '+mark);
});
