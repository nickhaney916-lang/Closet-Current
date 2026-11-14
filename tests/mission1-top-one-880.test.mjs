/** P880: conservative top-one review policy only. Synthetic test, not accuracy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {observation81,arbitrate81} from '../public/model-arbitration-81.mjs';
import {sharedRankChoices82} from '../public/dual-panel-82.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
import {frozenPreviousChoices879} from '../scripts/p880-exact-top-risk-audit.mjs';
const hash='a'.repeat(64),binding={sourceSha256:hash,inputSha256:hash,ownerSession:'synthetic-owner',
 photoRevision:'r1',cropRevision:'c1',maskRevision:'m1',unitRevision:'one-garment',instanceId:'item-1'};
function build(first,second,{firstOther='Skirt',secondOther='Skirt',firstTopScore=10,secondTopScore=10}={}){
 const score=(a,b,top)=>localCandidates.map((x,i)=>({label:x.label,
  score:x.itemType===a?top:x.itemType===b?top-.1:.0001/(i+1)}));
 const observations=['fashionclip','fashionSiglip'].map((modelKey,i)=>observation81({modelKey,
  scores:score(i?second:first,i?secondOther:firstOther,i?secondTopScore:firstTopScore),
  binding,vectorSha256:hash,workerSourceSha256:hash,latencyMs:1}));
 return {observations,decision:arbitrate81({binding,observations})};
}
test('P880 two model families agreeing on Shorts cannot offer runner-up Skirt',()=>{
 const {observations,decision}=build('Shorts','Shorts');
 const second=observations.every(o=>o.ranking[1].itemType==='Skirt');
 assert.equal(second,true);
 assert.deepEqual(sharedRankChoices82(decision,observations).map(x=>x.itemType),['Shorts']);
 assert.equal(decision.admissionAllowed,false);
});
test('P880 models agreeing on a known risky top Ankle boots cannot offer Sneakers second',()=>{
 const {observations,decision}=build('Ankle boots','Ankle boots',{firstOther:'Sneakers',secondOther:'Sneakers'});
 assert.equal(decision.status,'cross_family_hypothesis');
 assert.equal(observations[0].ranking[1].itemType,'Sneakers');
 assert.deepEqual(sharedRankChoices82(decision,observations),[]);
});
test('P880 same top but distinct lower-rank suggestions produce one exact option',()=>{
 const {observations,decision}=build('Shorts','Shorts',{firstOther:'Jeans',secondOther:'Skirt'});
 const shown=sharedRankChoices82(decision,observations);
 assert.equal(shown.length,1);
 assert.equal(shown[0].label,observations[0].ranking[0].label);
 assert.equal(shown[0].label,observations[1].ranking[0].label);
});
test('P880 same-category subtype disagreement yields zero options',()=>{
 const {observations,decision}=build('Shorts','Skirt',{firstOther:'Skirt',secondOther:'Shorts'});
 assert.ok(decision.reasons.includes('subtype_disagreement'));
 assert.deepEqual(sharedRankChoices82(decision,observations),[]);
});
test('P880 category disagreement yields zero options, no automatic saves',()=>{
 const {observations,decision}=build('Shorts','Casual dress',{secondOther:'Shorts'});
 assert.ok(decision.reasons.includes('category_disagreement'));
 assert.deepEqual(sharedRankChoices82(decision,observations),[]);
 assert.equal(decision.admissionAllowed,false);
});

test('P880 frozen P879 baseline offers multiple supported ranks but new policy only exact joint top',()=>{
 const {observations,decision}=build('Shorts','Shorts');
 const old=frozenPreviousChoices879(decision,observations);
 const updated=sharedRankChoices82(decision,observations);
 assert.ok(old.some(h=>h.itemType==='Shorts'));
 assert.ok(old.some(h=>h.itemType==='Skirt'));
 assert.deepEqual(updated.map(h=>h.itemType),['Shorts']);
 assert.ok(updated.every(h=>old.some(x=>x.label===h.label)));
});
