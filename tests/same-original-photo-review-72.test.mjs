import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {keepHumanReviewOnSameSource72} from '../research/same-original-photo-review-72/repeat-source-guard.mjs';
const A='a'.repeat(64),B='b'.repeat(64);
const manual={manual:true,confirmed:true,cropReviewed:true,category:'Tops',itemType:'T-shirt',color:'Blue'};
const base={currentSHA256:A,nextSHA256:A,currentOwner:'user-A',reviewOwner:'user-A',pieces:[manual]};
test('SOURCE72: exact original SHA from same owner preserves an unsaved human-reviewed garment',()=>{
 assert.equal(keepHumanReviewOnSameSource72(base),true);
 assert.equal(keepHumanReviewOnSameSource72({...base,nextSHA256:A.toUpperCase()}),true);
});
test('SOURCE72: different genuine original never bypasses explicit discard consent',()=>{
 assert.equal(keepHumanReviewOnSameSource72({...base,nextSHA256:B}),false);
});
test('SOURCE72: no human work, no pieces, or after-save empty review still allows reimport',()=>{
 for(const pieces of [[],null,[{manual:false,confirmed:false,cropReviewed:false,category:'Uncategorized',itemType:'Unknown',color:''}]])
  assert.equal(keepHumanReviewOnSameSource72({...base,pieces}),false);
});
test('SOURCE72: cross-owner, logged-out, active save and malformed SHA cannot preserve sensitive review',()=>{
 for(const options of [
  {currentOwner:'user-B'},{currentOwner:null},{reviewOwner:'user-B'},
  {submitting:true},{currentSHA256:undefined},{nextSHA256:''},
  {nextSHA256:'jpg-file-name'},{nextSHA256:'z'.repeat(64)}
 ])assert.equal(keepHumanReviewOnSameSource72({...base,...options}),false);
});
test('SOURCE72: human-touched unconfirmed crop or corrected category is still protected',()=>{
 assert.equal(keepHumanReviewOnSameSource72({...base,pieces:[{manual:true,confirmed:false}]}),true);
 assert.equal(keepHumanReviewOnSameSource72({...base,pieces:[{category:'Shoes',confirmed:false}]}),true);
});
test('SOURCE72: SHA check runs after valid original proof/decode but before dialog and destructive revoke',()=>{
 const s=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 const start=s.slice(s.indexOf('async function startFile(file)'),s.indexOf('async function commit()'));
 const hash=start.indexOf('const proof=await makeProof(file,owner);');
 const decode=start.indexOf('const decoded=await ensureImage(proof.image);');
 const same=start.indexOf('if(keepHumanReviewOnSameSource72({');
 const prompt=start.indexOf('if(shouldAskBeforePhotoSwitch68({');
 const revoke=start.indexOf('revoke();canceled=false;');
 assert.ok(hash>=0&&hash<decode&&decode<same&&same<prompt&&prompt<revoke);
 assert.match(start.slice(same,prompt),/currentSHA256:state\?\.proof\?\.sourceSHA256/);
 assert.match(start.slice(same,prompt),/currentOwner:owner,reviewOwner:state\?\.owner/);
 assert.doesNotMatch(start.slice(same,prompt),/revoke\(|state=null|grid\.replaceChildren/);
});
test('SOURCE72: six genuine native Chromium and WebKit same-original preserved-review cases are mandatory',()=>{
 const b=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
 for(const marker of [
  "const source72=process.env.SOURCE72==='1'",
  'same-original-three-confirmed-garments.jpg',
  'Same verified original photograph selected',
  'sameOriginalReviewPreserved72:source72',
  '02e-same-original-preserves-three-reviewed-all'
 ])assert.ok(b.includes(marker),'Missing browser regression: '+marker);
});
