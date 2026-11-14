/** Mission 1 P879: synthetic two-family conflict gating, NOT photo accuracy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {observation81,arbitrate81} from '../public/model-arbitration-81.mjs';
import {sharedRankChoices82} from '../public/dual-panel-82.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
const h='a'.repeat(64),binding={sourceSha256:h,inputSha256:h,
 ownerSession:'synthetic-owner',photoRevision:'synthetic-revision',cropRevision:'synthetic-crop',
 maskRevision:'synthetic-mask',unitRevision:'single-photo-owner-reviewed',instanceId:'synthetic-item'};
function scores(top,other,{tied=false}={}){
 return localCandidates.map((c,i)=>({label:c.label,score:
  c.itemType===top?10:c.itemType===other?(tied?10:9):1/(i+100)}));
}
function pair(clipTop,sigTop,{clipSecond='Skirt',sigSecond='Shorts',clipTie=false,sigTie=false}={}){
 const observations=['fashionclip','fashionSiglip'].map((modelKey,i)=>observation81({
  modelKey,binding,scores:scores(i?sigTop:clipTop,i?sigSecond:clipSecond,{tied:i?sigTie:clipTie}),
  workerSourceSha256:h,vectorSha256:h,latencyMs:1
 }));
 return {observations,decision:arbitrate81({binding,observations})};
}
test('P879 true same-category top-subtype disagreement remains ABSTAIN with no Use choices',()=>{
 const {observations,decision}=pair('Shorts','Skirt');
 assert.equal(decision.status,'abstain');
 assert.ok(decision.reasons.includes('subtype_disagreement'));
 assert.ok(decision.hypotheses.some(x=>x.itemType==='Shorts'));
 assert.ok(decision.hypotheses.some(x=>x.itemType==='Skirt'));
 assert.deepEqual(sharedRankChoices82(decision,observations),[]);
 assert.equal(decision.admissionAllowed,false);
 assert.equal(decision.requiresOwnerConfirmation,true);
});
test('P879 same-family-independent exact top subtype may remain a reviewed suggestion, never a save',()=>{
 const {observations,decision}=pair('Shorts','Shorts');
 assert.equal(decision.status,'cross_family_hypothesis');
 assert.deepEqual(decision.reasons,[]);
 assert.ok(sharedRankChoices82(decision,observations).some(x=>x.itemType==='Shorts'));
 assert.equal(decision.automaticallyCertified,false);
 assert.equal(decision.admissionAllowed,false);
});
test('P879 cross-category model conflict cannot show candidate even if top-five lists overlap',()=>{
 const {observations,decision}=pair('Shorts','Casual dress');
 assert.ok(decision.reasons.includes('category_disagreement'));
 assert.deepEqual(sharedRankChoices82(decision,observations),[]);
});
test('P879 top rank tied within one model never becomes a shortcut',()=>{
 const {observations,decision}=pair('Shorts','Shorts',{clipTie:true});
 assert.equal(decision.status,'abstain');
 assert.ok(decision.reasons.includes('top_rank_tied'));
 assert.deepEqual(sharedRankChoices82(decision,observations),[]);
});
test('P879 empirical Ankle boots confusion veto persists even when two families agree',()=>{
 const {observations,decision}=pair('Ankle boots','Ankle boots',{clipSecond:'Sneakers',sigSecond:'Sneakers'});
 assert.equal(decision.status,'cross_family_hypothesis');
 const choices=sharedRankChoices82(decision,observations);
 assert.ok(!choices.some(x=>x.itemType==='Ankle boots'));
 assert.deepEqual(choices,[],'P880 risk veto must not promote runner-up Sneakers into agreed subtype');
});
test('P879 forged decision status cannot override actual observed top-label disagreement',()=>{
 const {observations,decision}=pair('Shorts','Skirt');
 const forged={...decision,status:'cross_family_hypothesis',reasons:[]};
 assert.deepEqual(sharedRankChoices82(forged,observations),[]);
});
test('P879 a synthetic consent indicator alone cannot promote an abstention into a saving action',()=>{
 const {observations,decision}=pair('Shorts','Skirt');
 const edited={...decision,requiresOwnerConfirmation:true,admissionAllowed:false,
  independentFamilies:2,hypotheses:[...decision.hypotheses]};
 assert.deepEqual(sharedRankChoices82(edited,observations),[]);
});
