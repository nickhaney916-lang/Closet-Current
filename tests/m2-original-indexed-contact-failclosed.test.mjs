/**
 * Mission 2: pure research-original indexed collision safety inputs.
 * Controlled triangles only; NOT evidence of photo fit, calibrated drape,
 * original reverse, signed owner approval, physical device or alpha release.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
 classifyExactTriangleContact,evaluateFullIndexedContact,
 controlledFullContactFixtures
} from '../research/parallel89/full-indexed-contact-calibration89.mjs';

const finite=[[0,0,0],[1,0,0],[0,1,0]];
const separated=[[10,10,10],[11,10,10],[10,11,10]];

test('reject nonfinite/malformed original body AND front geometry before BVH',()=>{
 for(const invalid of [
  [[0,0,0],[Infinity,0,0],[0,1,0]],
  [[0,0,0],[NaN,0,0],[0,1,0]],
  [[0,0,0],[0,1],[0,1,0]],
  [[0,0,0],[0,1,0],null]
 ]){
  assert.throws(()=>evaluateFullIndexedContact([invalid],[finite]),
   /full-indexed-contact-original-face-nonfinite/);
  assert.throws(()=>evaluateFullIndexedContact([finite],[invalid]),
   /full-indexed-contact-original-face-nonfinite/);
 }
});

test('reject maxPairs that could disable or break a finite safety limit',()=>{
 for(const invalid of [NaN,Infinity,-Infinity,0,-1,1.2,
  Number.MAX_SAFE_INTEGER+1,'10',null]){
  assert.throws(()=>evaluateFullIndexedContact([finite],[finite],
   {maxPairs:invalid}),/full-indexed-contact-invalid-resource-budget/);
 }
});

test('enforce an actual positive finite limit: no partial original scope PASS',()=>{
 assert.throws(()=>evaluateFullIndexedContact([finite,finite],[finite],
  {maxPairs:1}),/original-full-indexed-audit-resource-bound-reached/);
});

test('original exact triangle categories and separated complete audit survive guard',()=>{
 const original=controlledFullContactFixtures();
 assert.equal(original.cases.crossing,'CROSSING');
 assert.equal(original.cases.separated,'NONE');
 assert.equal(original.cases.identicalCoplanar,'COPLANAR_OVERLAP');
 assert.equal(original.cases.sharedCoplanarEdge,'TOUCHING');
 assert.equal(original.cases.endpoint,'TOUCHING');
 assert.equal(original.cases.degenerate,'INDETERMINATE');
 assert.equal(classifyExactTriangleContact(finite,separated),'NONE');
 const clean=evaluateFullIndexedContact([finite],[separated]);
 assert.equal(clean.fullOriginalIndexedScopeEvaluated,true);
 assert.equal(clean.definitiveCollisionRejection,false);
 assert.equal(clean.garmentPhysicalFitCertified,false);
 assert.equal(clean.familyAlpha,'HOLD');
});

test('one genuine triangle contact means early rejection, NOT complete audit',()=>{
 const found=evaluateFullIndexedContact([finite,finite],[finite],
  {stopAtFirstVerifiedContact:true});
 assert.equal(found.definitiveCollisionRejection,true);
 assert.equal(found.fullOriginalIndexedScopeEvaluated,false);
 assert.equal(found.pairEnumerationStoppedAfterRealContact,true);
 assert.equal(found.contactDecision,'BLOCKED_ACTUAL_ORIGINAL_FRONT_BODY_CONTACT');
 assert.equal(found.garmentPhysicalFitCertified,false);
 assert.equal(found.familyAlpha,'HOLD');
});
