import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FIT_AMPLITUDES62,screenDisposableSourceFitAmplitudes62}
 from '../research/mission2-source-length/upper-torso-fit-pareto62.mjs';
const safeWorld=()=>new Float32Array([
 .2,.5,0,.25,.5,0,.2,.55,0,
 -.2,.5,0,-.25,.5,0,-.2,.55,0
]);
const trial=(world=safeWorld(),evaluateCandidate=()=>({
 bodyComplete:true,selfComplete:true,bodyStrict:0,selfStrict:0
}))=>screenDisposableSourceFitAmplitudes62({
 originalWorld:world,indices:null,neck:[0,1.1,0],
 spine:[0,0,0],baselineBodyStrict:196,baselineSelfStrict:0,
 evaluateCandidate
});
test('C62: six authenticated temporary fit doses get complete face quality and only small source-safe doses get true-body contact evaluations',()=>{
 const world=safeWorld(),copy=world.slice();
 let calls=0;
 const x=trial(world,()=>{calls++;return {
  bodyComplete:true,selfComplete:true,bodyStrict:0,selfStrict:0
 };});
 assert.equal(x.schema,
  'M2-C62-original-licensed-source-body-clearance-vs-strain-amplitude-sweep');
 assert.deepEqual(x.testedConservativeTorsoOutwardAmplitudesMeters,
  FIT_AMPLITUDES62);
 assert.equal(x.sourceGeometryShapeQualityPrechecks,6);
 assert.ok(x.completeBodyAndSelfContactAnalysesPerformed>=1);
 assert.equal(calls,x.completeBodyAndSelfContactAnalysesPerformed);
 assert.equal(x.perCandidate.length,6);
 assert.equal(x.anySampledPoseStrictBodyAndSelfClearanceCandidate,true);
 assert.ok(x.smallestSampledClearanceCandidateMeters<=.006);
 assert.equal(x.originalSourcePhotoWorldBufferUntouched,true);
 assert.deepEqual(world,copy);
 assert.equal(x.sourceCandidateNotRenderedAndNotWearabilityCertified,true);
 assert.equal(x.releaseAuthorized,false);
 assert.equal(x.familyAlpha,'HOLD');
});
test('C62: even a quality-accepted candidate cannot be called body collision-free if source body contact witnesses persist',()=>{
 const x=trial(safeWorld(),()=>({
  bodyComplete:true,selfComplete:true,bodyStrict:12,selfStrict:0
 }));
 assert.equal(x.anySampledPoseStrictBodyAndSelfClearanceCandidate,false);
 assert.equal(x.smallestSampledClearanceCandidateMeters,null);
 assert.ok(x.perCandidate.filter(c=>c.actualBodyContactTestPerformed)
  .every(c=>c.originalBodyAndSelfCrossingsFullyGone===false));
 assert.equal(x.releaseAuthorized,false);
});
test('C62: tiny split source face area rapidly distorts even at 1mm; never spend body-scan budget on shape-failed source cloth',()=>{
 const world=new Float32Array([
  .001,.5,0,-.001,.5,0,0,.51,.001
 ]);
 let calls=0;
 const x=trial(world,()=>{calls++;return{
  bodyComplete:true,selfComplete:true,bodyStrict:0,selfStrict:0
 }});
 assert.equal(calls,0);
 assert.equal(x.completeBodyAndSelfContactAnalysesPerformed,0);
 assert.equal(x.anySampledPoseStrictBodyAndSelfClearanceCandidate,false);
 assert.ok(x.perCandidate.every(r=>r.excludedFromBodyContactIfDistorting));
 assert.equal(x.releaseAuthorized,false);
});
test('C62: an incomplete original-body contact sweep cannot be promoted to wearability clearance',()=>{
 const x=trial(safeWorld(),()=>({
  bodyComplete:false,selfComplete:true,bodyStrict:0,selfStrict:0
 }));
 assert.equal(x.anySampledPoseStrictBodyAndSelfClearanceCandidate,false);
 assert.equal(x.perCandidate.some(x=>x.sourceBodyAndSelfFullyMeasured===false),true);
});
test('C62: a newly caused fabric self intersection blocks a candidate regardless of original body clearance',()=>{
 const x=trial(safeWorld(),()=>({
  bodyComplete:true,selfComplete:true,bodyStrict:0,selfStrict:1
 }));
 assert.equal(x.anySampledPoseStrictBodyAndSelfClearanceCandidate,false);
 assert.equal(x.releaseAuthorized,false);
});
test('C62: malformed source, forged evaluator, illegal original body counts or source write fail closed',()=>{
 const world=safeWorld();
 for(const input of [
  {...{originalWorld:world,neck:[0,1.1,0],spine:[0,0,0]},
   baselineBodyStrict:-1,baselineSelfStrict:0,evaluateCandidate:()=>({})},
  {originalWorld:world,neck:[0,1.1,0],spine:[0,0,0],
   baselineBodyStrict:196,baselineSelfStrict:0,evaluateCandidate:42},
  {originalWorld:world,neck:[0,1.1,0],spine:[0,0,0],
   baselineBodyStrict:196,baselineSelfStrict:0,evaluateCandidate:()=>({
    bodyComplete:'yes',selfComplete:true,bodyStrict:0,selfStrict:0})},
  {originalWorld:world,neck:[0,1.1,0],spine:[0,0,0],
   baselineBodyStrict:196,baselineSelfStrict:0,evaluateCandidate:()=>({
    bodyComplete:true,selfComplete:true,bodyStrict:-1,selfStrict:0})}
 ])assert.throws(()=>screenDisposableSourceFitAmplitudes62(input));
 const changed=safeWorld();
 assert.throws(()=>trial(changed,()=>{
  changed[0]=99;
  return{bodyComplete:true,selfComplete:true,bodyStrict:0,selfStrict:0};
 }),/source mutated/);
});
test('C62: actual photographed-dress Chromium helper has no Node-only runtime and retains original owner privacy',async()=>{
 const s=await readFile('research/mission2-source-length/upper-torso-fit-pareto62.mjs','utf8');
 assert.ok(!s.includes("from 'node:")&&!s.includes('from "node:'));
 assert.ok(!s.includes('require(')&&!s.includes('process.'));
 assert.ok(s.includes('noOriginalPhotoBytesOrSourceVertexCoordinatesExported'));
 assert.ok(s.includes('noProductionStagingSupabaseOrOwnerWardrobeWrite'));
});
