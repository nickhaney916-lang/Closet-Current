import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourcePreflightStillCurrent70,validReplacementFile70} from '../research/verified-photo-switch-70/source-preflight.mjs';

const current={selection:4,currentSelection:4,reviewEpoch:10,currentReviewEpoch:10,
 owner:'fixture-A',currentOwner:'fixture-A',
 dbName:'closet-current-user-fixture-A',submitting:false};
test('RACE71: newer invalid attempt invalidates older valid JPEG proof before it resumes',()=>{
 assert.equal(sourcePreflightStillCurrent70(current),true);
 const newerInvalid={size:8,arrayBuffer:async()=>new ArrayBuffer(8)};
 assert.equal(validReplacementFile70(newerInvalid),false);
 assert.equal(sourcePreflightStillCurrent70({...current,currentSelection:5}),false);
 assert.equal(sourcePreflightStillCurrent70({...current,selection:5,currentSelection:5}),true);
});
test('RACE71: current owner/review and confirmation data are not cleared to reject an invalid selection',()=>{
 const s=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 const start=s.slice(s.indexOf('async function startFile(file)'),s.indexOf('async function commit()'));
 const bump=start.indexOf('const selection=++selectionEpoch70,priorEpoch=epoch;');
 const invalid=start.indexOf('if(!validReplacementFile70(file))');
 const guard=start.indexOf('const pending=()=>sourcePreflightStillCurrent70(');
 assert.ok(bump>=0&&invalid>bump&&guard>invalid,
  'selection epoch MUST increment before the size gate; prior delayed valid proofs cannot win');
 const rejected=start.slice(invalid,guard);
 assert.match(rejected,/reviewed garments remain unchanged/);
 assert.doesNotMatch(rejected,/revoke\(|reset\(|state=null|original\.removeAttribute|grid\.replaceChildren/);
});
test('RACE71: invalid pick shares the same source epoch monotonicity and logout revocation',()=>{
 const s=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(s,/selectionEpoch70\+\+;job\?\.worker\?\.terminate/);
 assert.match(s,/selection,currentSelection:selectionEpoch70/);
 assert.match(s,/currentReviewEpoch:renderVersion/);
 assert.match(s,/getDb\(\)\?\.name,submitting/);
});
test('RACE71: genuine mobile browser race is required in every phone-width scenario',()=>{
 const s=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
 for(const mark of [
  "const source71=process.env.SOURCE71==='1'",
  'older-delayed-real-jpeg.jpg','newer-invalid-eight-bytes.jpg',
  'await window.__race71.finish()',"assert.equal(unexpectedPrompts,0",
  '02d-last-invalid-choice-defeats-older-valid-proof-all',
  'invalidSelectionDefeatsStaleValidProof71:source71'
 ])assert.ok(s.includes(mark),'Missing real-browser source race: '+mark);
});
