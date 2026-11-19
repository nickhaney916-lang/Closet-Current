import assert from 'node:assert/strict';
import test from 'node:test';
import {
 numericalContactReason,auditOriginalContactNumerics,
 controlledOriginalNumericReasonFixtures
} from '../research/parallel89/original-contact-numeric-diagnostics89.mjs';

const triangle=[[0,0,0],[1,0,0],[0,1,0]];
const skew=[[.25,.25,-1],[.25,.25,1],[.5,.25,0]];
const small=[[0,0,0],[1e-10,0,0],[0,1e-10,0]];
const parallel=[[0,0,.3],[1,0,.3],[0,1,.3]];
const zero=[[0,0,0],[1,1,1],[2,2,2]];
test('root reason fixtures preserve exact degeneracy, separation and real cross candidates',()=>{
 const f=controlledOriginalNumericReasonFixtures();
 assert.deepEqual(f,{
  realCrossingCandidate:'NONPARALLEL_CANDIDATE',
  parallelOffset:'CLEAR_BY_SEPARATING_FACE_PLANE',
  tinyRealisticFace:'BODY_FACE_DEGENERATE',
  zeroArea:'BODY_FACE_DEGENERATE',
  nonfinite:'NONFINITE_INPUT'
 });
});
test('diagnostic catches degenerate original triangle in finite overlapping boxes',()=>{
 const reason=numericalContactReason(triangle,zero);
 assert.equal(reason.reason,'BODY_FACE_DEGENERATE');
 assert.equal(reason.ambiguous,true);
 assert.equal(reason.bodyDoubleArea,0);
});
test('separated original planes do not create false contact certification',()=>{
 const reason=numericalContactReason(triangle,parallel);
 assert.equal(reason.reason,'CLEAR_BY_SEPARATING_FACE_PLANE');
 assert.equal(reason.ambiguous,false);
});
test('bounded source-front/real-rig geometry profile never authorizes 3D',()=>{
 const diag=auditOriginalContactNumerics([skew,small,parallel],
  [triangle,triangle],{maxObservedPairs:24,prefixFront:2,distributedFront:2});
 assert.equal(diag.originalBodyFaceProfile.actualIndexedFaces,3);
 assert.equal(diag.originalFrontFaceProfile.actualIndexedFaces,2);
 assert.equal(diag.originalBodyFaceProfile.doubleAreaBelowOriginalThreshold,1);
 assert.equal(diag.originalBodyFaceProfile.exactZeroAreaFaces,0);
 assert.ok(diag.actualAABBOverlapPairsProfiled>0);
 assert.ok(diag.auditedReasonCodes.NONPARALLEL_CANDIDATE>=1);
 assert.equal(diag.diagnosticSamplesOnly,true);
 assert.equal(diag.notFullIndexedPairCoverage,true);
 assert.equal(diag.consumer3DAdmitted,false);
 assert.equal(diag.noCertifiedOriginalBodyClothCollisionClearance,true);
 assert.equal(diag.sourceOriginalPhoto2DFallbackRequired,true);
 assert.equal(diag.familyAlpha,'HOLD');
});
test('nonfinite source geometry cannot be taken as a safe zero-contact proof',()=>{
 const bad=[[0,0,0],[Infinity,0,0],[0,1,0]];
 const diag=auditOriginalContactNumerics([bad,skew],[triangle]);
 assert.equal(diag.originalBodyFaceProfile.nonfiniteFaces,1);
 assert.equal(diag.actualAABBOverlapPairsProfiled,0);
 assert.equal(diag.notFullIndexedPairCoverage,true);
 assert.equal(diag.consumer3DAdmitted,false);
});
test('diagnostic limits reject unbounded or nonexistent source arrays',()=>{
 assert.throws(()=>auditOriginalContactNumerics([],[]),/actual-original-faces-required/);
 assert.throws(()=>auditOriginalContactNumerics([triangle],[triangle],
  {maxObservedPairs:0}),/bounded-numerical-diagnostic-required/);
 assert.throws(()=>auditOriginalContactNumerics([triangle],[triangle],
  {maxObservedPairs:8193}),/bounded-numerical-diagnostic-required/);
});
