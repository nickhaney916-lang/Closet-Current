import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 hasUnsavedHumanReview68,shouldAskBeforePhotoSwitch68,DISCARD_PROMPT68
} from '../research/photo-switch-guard-68/source-discard-guard.mjs';
const automatic=()=>({
 manual:false,confirmed:false,cropReviewed:false,
 category:'Uncategorized',itemType:'Unknown',color:'',
 instanceKey:'seg-0-50-60-500-600-1',hint:{categories:['Tops'],confidence:1},
 modelColorHint59:'Blue'
});
const review=()=>({...automatic(),manual:true,instanceKey:'manual-380-50-400-350'});
const intent=(pieces,attrs={})=>({currentOwner:'owner-A',reviewOwner:'owner-A',pieces,...attrs});
test('SWITCH68 empty source or no work does not prompt on first camera capture',()=>{
 assert.equal(hasUnsavedHumanReview68(null),false);
 assert.equal(hasUnsavedHumanReview68([]),false);
 assert.equal(shouldAskBeforePhotoSwitch68(intent([])),false);
 assert.equal(shouldAskBeforePhotoSwitch68({}),false);
});
test('SWITCH68 unreviewed model proposals and scores are not falsely represented as a user edit',()=>{
 const p=automatic();
 assert.equal(hasUnsavedHumanReview68([p]),false);
 assert.equal(shouldAskBeforePhotoSwitch68(intent([p])),false);
 assert.equal(hasUnsavedHumanReview68([{...p,modelColorHint59:'Black',
  hint:{categories:['Tops'],types:['T-shirt'],confidence:1,clipped:false}}]),false);
});
test('SWITCH68 manually added garment deserves protection even before adjusting crop',()=>{
 assert.equal(hasUnsavedHumanReview68([review()]),true);
 assert.equal(shouldAskBeforePhotoSwitch68(intent([review()])),true);
});
test('SWITCH68 actual crop editor review is protected even if garment remains unclassified',()=>{
 assert.equal(hasUnsavedHumanReview68([{...automatic(),cropReviewed:true}]),true);
});
test('SWITCH68 changing only category from unverified proposal is human work',()=>{
 assert.equal(hasUnsavedHumanReview68([{...automatic(),category:'Shoes'}]),true);
});
test('SWITCH68 changing only subtype from Unknown is human work',()=>{
 assert.equal(hasUnsavedHumanReview68([{...automatic(),itemType:'Ankle boots'}]),true);
});
test('SWITCH68 typing color is work even without checking the confirmation box',()=>{
 assert.equal(hasUnsavedHumanReview68([{...automatic(),color:'  Black  '}]),true);
 assert.equal(hasUnsavedHumanReview68([{...automatic(),color:'   '}]),false);
});
test('SWITCH68 explicit human confirm and user-adjusted source remain protected',()=>{
 assert.equal(hasUnsavedHumanReview68([{...automatic(),confirmed:true}]),true);
 assert.equal(hasUnsavedHumanReview68([{...automatic(),userAdjusted:true}]),true);
});
test('SWITCH68 mixed model and manual proposals trigger only because the user acted',()=>{
 assert.equal(shouldAskBeforePhotoSwitch68(intent([automatic(),review(),automatic()])),true);
});
test('SWITCH68 source switch across owners does not prompt or preserve former owner private photo',()=>{
 assert.equal(shouldAskBeforePhotoSwitch68(intent([review()],{currentOwner:'owner-B'})),false);
 assert.equal(shouldAskBeforePhotoSwitch68(intent([review()],{currentOwner:null})),false);
 assert.equal(shouldAskBeforePhotoSwitch68(intent([review()],{reviewOwner:'owner-B'})),false);
});
test('SWITCH68 source switch is blocked while atomic commit is submitting',()=>{
 assert.equal(shouldAskBeforePhotoSwitch68(intent([review()],{submitting:true})),false);
});
test('SWITCH68 malformed JSON payloads, fake model confidence and empty color are not proof of manual work',()=>{
 assert.equal(hasUnsavedHumanReview68([null,{},[],'text',12]),false);
 assert.equal(hasUnsavedHumanReview68([{...automatic(),manual:'true',
  confirmed:1,cropReviewed:1,userAdjusted:'yes'}]),false);
});
test('SWITCH68 explicitly describes Cancel and that unsaved work will be discarded if approved',()=>{
 assert.match(DISCARD_PROMPT68,/not saved/);
 assert.match(DISCARD_PROMPT68,/Discard that review/);
 assert.match(DISCARD_PROMPT68,/Choose Cancel to keep/);
});
test('SWITCH68 native photo import guard comes before revoke; cancel returns without resetting original or saving',()=>{
 const ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 const start=ui.indexOf('async function startFile(file)');
 const guard=ui.indexOf('shouldAskBeforePhotoSwitch68({',start);
 const prompt=ui.indexOf('window.confirm(DISCARD_PROMPT68)',guard);
 const canceled=ui.indexOf('Photo switch canceled.',prompt);
 const earlyReturn=ui.indexOf('return;',canceled);
 const revoke=ui.indexOf('revoke();canceled=false;',earlyReturn);
 assert.ok(start>0&&guard>start&&prompt>guard&&canceled>prompt&&
  earlyReturn>canceled&&revoke>earlyReturn);
 assert.match(ui,/const approved=typeof window\.confirm==='function'&&window\.confirm\(DISCARD_PROMPT68\)/);
});
test('SWITCH68 session lock, logout and pagehide ALWAYS revoke immediately without asking',()=>{
 const ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 for(const event of ['closet:alpha-session-changed','closet:session-locked','pagehide'])
  assert.match(ui,new RegExp("addEventListener\\('"+event+"',\\(\\)=>"+(event==='pagehide'?"revoke":"reset")));
 assert.match(ui,/function revoke\(\)\{cancelClassification42\(\);canceled=true;renderVersion\+\+/);
 assert.match(ui,/original\.removeAttribute\('src'\);original\.hidden=true;grid\.replaceChildren\(\)/);
});
test('SWITCH68 genuine native browser proof uses distinct license-backed originals and actual UI dialog actions',()=>{
 const script=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
 assert.match(script,/const switch68=process\.env\.SWITCH68==='1'/);
 assert.match(script,/commons-0046\.jpg/);
 assert.match(script,/7f94b8bc8edc340200f0353968f54868dc72e3180bc191530e19f2a82ce91ead/);
 assert.match(script,/dialog\.dismiss\(\)/);
 assert.match(script,/dialog\.accept\(\)/);
 assert.match(script,/02a-cancel-switch-preserves-three-reviewed-crops-all/);
 assert.match(script,/03b-approved-switch-clears-unsaved-keeps-private-closet-all/);
 assert.match(script,/assert\.deepEqual\(retained,before/);
 assert.match(script,/assert\.equal\(retained\.length,3\)/);
 assert.match(script,/v4Restore:true/);
 assert.match(script,/multi24-B/);
});
