/**
 * Synthetic contract tests only. No real garment/photo/native screen or
 * actual human body triangulation is represented by these fake face pairs.
 * Real P89 Chromium/WebKit original-source BVH assertions run separately.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOriginalPhotoSkirtContactTopology89}
 from '../research/parallel89/skirt-contact-topology89.mjs';

const mask=Uint8Array.from({length:1500},(_,i)=>i%3===0?0:1);
const item=ids=>({count:ids.length,pairs:new Set(ids),maxDepth:.002});
const before=[item(['0|20','25|40','96|5']),item(['575|7','100|30']),
 item(['190|200'])];
const after=[item(['0|20','72|40']),item(['100|30','480|30']),
 item(['190|200'])];
const args={baseline:before,trial:after,bodyFaceMask:mask,bodyFaceCount:mask.length,
 avatar:'female',trialName:'front-30mm'};

test('measured original source face IDs produce exact band 0..5, original front/back and new/resolved 3-pose ledger without raw IDs',()=>{
 const r=summarizeOriginalPhotoSkirtContactTopology89(args);
 assert.equal(r.status,'GENUINE_ORIGINAL_FULL_BODY_SOURCE_CONTACT_TURNOVER_MEASURED_NOT_CLEARANCE');
 assert.equal(r.originalStrictCrossingPairSum,6);
 assert.equal(r.trialStrictCrossingPairSum,5);
 assert.equal(r.newlyIntroducedOriginalBodySkirtFacePairSum,2);
 assert.equal(r.resolvedOriginalBodySkirtFacePairSum,3);
 assert.equal(r.persistedOriginalBodySkirtFacePairSum,3);
 assert.deepEqual(r.originalContactBands,[2,3,0,0,0,1]);
 assert.deepEqual(r.trialContactBands,[2,2,0,0,0,1]);
 assert.deepEqual(r.introducedContactBands,[1,0,0,0,0,1]);
 assert.deepEqual(r.resolvedContactBands,[1,1,0,0,0,1]);
 assert.equal(r.originalContactSurfaces.unphotographedBack,1);
 assert.equal(r.originalContactSurfaces.photoFront,5);
 assert.equal(r.newlyIntroducedContactSurfaces.photoFront,2);
 assert.equal(r.trialContactSurfaces.unphotographedBack,0);
 assert.equal(r.poses[0].resolved.pairCount,2);
 assert.equal(r.poses[0].persisted.pairCount,1);
 assert.equal(r.poses.length,3);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.independentHumanFitApproved,false);
 assert.equal(r.continuousSweptContactCertified,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.unphotographedNeutralRearNotTreatedAsReal,true);
 const txt=JSON.stringify(r);
 for(const forbidden of ['0|20','25|40','575|7','190|200']){
  assert.ok(!txt.includes('"'+forbidden+'"'),'raw source face pair cannot escape research process');
 }
});
test('no gross collision count improvement is equivalent to clearance or original photo human approval',()=>{
 const r=summarizeOriginalPhotoSkirtContactTopology89(args);
 assert.ok(r.originalStrictCrossingPairSum>r.trialStrictCrossingPairSum);
 assert.ok(r.newlyIntroducedOriginalBodySkirtFacePairSum>0);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.ownerPrivate3DAdmitted,false);
});
test('forged actual CC0 source-body mask, pose count, or outside-source triangle indices fail closed',()=>{
 for(const bad of [
  {avatar:'owner'},
  {trialName:'../../attack'},
  {bodyFaceCount:0},
  {bodyFaceMask:new Uint8Array(1500).fill(1)},
  {bodyFaceMask:new Uint8Array(1500)},
  {bodyFaceMask:new Uint8Array(1500).fill(2)},
  {bodyFaceMask:new Uint8Array(2)},
  {baseline:[before[0]]},
  {trial:null},
  {trial:[item(['576|20']),after[1],after[2]]},
  {trial:[item(['0|1500']),after[1],after[2]]},
  {trial:[item(['-1|3']),after[1],after[2]]},
  {trial:[item(['01|3']),after[1],after[2]]},
  {trial:[{count:2,pairs:new Set(['0|20']),maxDepth:0},after[1],after[2]]},
  {trial:[{count:0,pairs:new Set(),maxDepth:NaN},after[1],after[2]]}
 ]){
  const r=summarizeOriginalPhotoSkirtContactTopology89({...args,...bad});
  assert.equal(r.status,'REAL_SOURCE_CONTACT_TOPOLOGY_NOT_VERIFIED');
  assert.equal(r.releaseAuthorized,false);
  assert.equal(r.sourceOriginalPhoto2DFallback,true);
 }
});
