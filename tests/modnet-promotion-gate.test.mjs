import test from 'node:test';import assert from 'node:assert/strict';import {assessPromotionGate} from '../benchmark/modnet-promotion-gate.mjs';
test('does not approve MODNet without independently validated reference outlines and shadow evidence',()=>{
 const manifest={cases:[{id:'shoes',reviewStatus:'pending',referenceMask:null}]};
 const result=assessPromotionGate({manifest,reviewEvidence:{approved:true},qualityEvidence:{shadowVerified:true,backgroundLeakageVerified:true,garmentPreservationVerified:true,mobileClarityVerified:true}});
 assert.equal(result.status,'blocked');assert.deepEqual(result.missingApprovedCases,['shoes']);assert.equal(result.productionChangeAuthorized,false);
});
test('even all checks passing does not authorize a production change',()=>{
 const manifest={cases:Array.from({length:6},(_,i)=>({id:String(i),reviewStatus:'approved',referenceMask:'verified-'+i}))};
 const qualityEvidence={shadowVerified:true,backgroundLeakageVerified:true,garmentPreservationVerified:true,mobileClarityVerified:true};
 const result=assessPromotionGate({manifest,reviewEvidence:{approved:true},qualityEvidence});
 assert.equal(result.status,'eligible-for-manual-rollout-review');assert.equal(result.productionChangeAuthorized,false);
});
