import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessRealHosieryReadiness as assess} from '../benchmark/real-hosiery-readiness.mjs';

const review=JSON.parse(readFileSync('benchmark/LIP-SOCKS-REAL-REVIEW-20261017.json','utf8'));
const summary=()=>({
 modelSha256:review.modelSha256,
 status:'complete',
 sourceImagesHashVerified:true,
 maskGroundTruthAvailable:false,
 modelHasTightsLabel:false,
 realDevicePerformanceMeasured:false,
 productionAuthorized:false,
 wardrobeEntriesAdded:0,
 originalPhotoProtected:true,
 cases:review.findings.map(f=>({
   id:f.id,sourceSha256:'a'.repeat(64),
   evaluation:{sockPixels:f.sockClassPixels,shoePixels:f.shoeClassPixels}
 }))
});
test('real boots and socks plus heels and tights fail visual readiness despite inference success',()=>{
 const r=assess(summary(),review);
 assert.equal(r.status,'research-only-not-ready');
 assert.equal(r.reviewMatchesThisRun,true);
 assert.equal(r.visualReviewStatus,'matched-reviewed-output');
 assert.deepEqual(r.observedVisualFailures,['validation-0030','validation-0031']);
 assert.ok(r.blockers.includes('reviewed-segmentation-failures'));
 assert.ok(r.blockers.includes('no-independent-reference-masks'));
 assert.ok(r.blockers.includes('no-dedicated-tights-label'));
 assert.equal(r.automaticClosetSavesAllowed,false);
 assert.equal(r.productionAuthorized,false);
 assert.equal(r.extraUserPromptsAdded,0);
 assert.equal(r.newCustomerTabsAdded,0);
});
test('changed inference output requires fresh human review instead of reusing verdict',()=>{
 const s=summary();s.cases[0].evaluation.sockPixels++;
 const r=assess(s,review);
 assert.equal(r.reviewMatchesThisRun,false);
 assert.equal(r.visualReviewStatus,'current-output-needs-visual-review');
 assert.deepEqual(r.observedVisualFailures,[]);
 assert.deepEqual(r.previouslyReviewedVisualFailures,['validation-0030','validation-0031']);
 assert.ok(r.blockers.includes('model-or-source-output-requires-fresh-review'));
 assert.ok(r.blockers.includes('previously-reviewed-segmentation-failures'));
 assert.equal(r.automaticClosetSavesAllowed,false);
});
test('model change or missing photographed case invalidates prior review',()=>{
 const s=summary();s.modelSha256='b'.repeat(64);
 assert.equal(assess(s,review).reviewMatchesThisRun,false);
 const t=summary();t.cases.pop();
 assert.equal(assess(t,review).reviewMatchesThisRun,false);
});
test('invented approval or closet writes block release rather than pass',()=>{
 const s=summary();s.productionAuthorized=true;s.wardrobeEntriesAdded=2;
 const r=assess(s,review);
 assert.ok(r.blockers.includes('unsafe-production-or-inventory-claim'));
 assert.equal(r.productionAuthorized,false);
 assert.equal(r.automaticClosetSavesAllowed,false);
});
test('missing evidence and unverified image hashes cannot masquerade as tested',()=>{
 assert.throws(()=>assess(null,review),/Missing/);
 assert.throws(()=>assess(summary(),null),/Missing/);
 const s=summary();s.sourceImagesHashVerified=false;
 assert.equal(assess(s,review).reviewMatchesThisRun,false);
});
