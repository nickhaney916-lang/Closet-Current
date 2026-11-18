/** P89 metric-registration tests are SYNTHETIC, not real tape evidence.
 * Browser source checks separately attest true Commons-0043 + 163-bone rigs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {auditOriginalSkirtPhysicalRegistration89 as audit}
 from '../research/parallel89/skirt-physical-registration89.mjs';
const SHA='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
function shell(){
 const p=new Float32Array(343*3);
 for(let row=0;row<7;row++)for(let col=0;col<49;col++){
  const a=2*Math.PI*col/48,i=3*(row*49+col);
  const r=.21+row*.02;
  p[i]=r*Math.cos(a);p[i+1]=1.4-row*.10;p[i+2]=r*Math.sin(a);
 }
 return p;
}
const sample=(opts={})=>audit({
 sourceId:'commons-0043',sourceSHA256:SHA,originalSourceAttested:true,
 avatar:'female',pose:'source',originalSkirtRestPositions:shell(),
 rigBoneCount:163,...opts
});
test('genuine-identity-shaped research original 343x3 shell with no actual tape is BLOCKED',()=>{
 const r=sample();
 assert.equal(r.status,'ORIGINAL_PHYSICAL_GARMENT_DIMENSIONS_MISSING');
 assert.equal(r.originalGarmentPhysicalDimensionsVerified,false);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.sourceRingCount,7);
 assert.equal(r.ringSamples,49);
 assert.ok(r.uncalibratedSourceWaistPerimeterModelUnits>1);
 assert.ok(r.uncalibratedSourceTopToHemDropModelUnits>.5);
 assert.equal(r.hypotheticalUniformScale,null);
 assert.ok(r.missingIndependentEvidence.length>=4);
});
test('actual research positions are not mutated by measurement or missing-evidence branch',()=>{
 const pos=shell(),before=pos.slice();
 sample({originalSkirtRestPositions:pos});
 assert.deepEqual(pos,before);
 const waist=2*Math.PI*.21*.8*1000;
 const r=sample({originalSkirtRestPositions:pos,physicalTape:{
  waistCircumferenceMm:waist,waistToHemLengthMm:480}});
 assert.deepEqual(pos,before);
 assert.equal(r.originalSourceRestGeometryUnchanged,true);
 assert.equal(r.status,'UNREVIEWED_EXTERNAL_TAPE_UNIFORM_SCALE_HYPOTHESIS_ONLY');
 assert.ok(Math.abs(r.hypotheticalUniformScale-.8)<.001);
 assert.ok(r.fractionalTwoMeasureScaleDisagreement<.01);
 assert.equal(r.independentHumanTapePhotoReviewed,false);
 assert.equal(r.originalGarmentPhysicalDimensionsVerified,false);
 assert.equal(r.actualSignedBodyContainmentCertified,false);
 assert.equal(r.releaseAuthorized,false);
});
test('two plausible but physically inconsistent measurements reject scaling',()=>{
 assert.match(sample({physicalTape:{waistCircumferenceMm:1000,
  waistToHemLengthMm:1100}}).reason,/inconsistent/);
});
test('missing, impossible, fabricated or malformed measurements cannot pass',()=>{
 for(const physicalTape of [
  {},{waistCircumferenceMm:NaN,waistToHemLengthMm:500},
  {waistCircumferenceMm:Infinity,waistToHemLengthMm:500},
  {waistCircumferenceMm:0,waistToHemLengthMm:500},
  {waistCircumferenceMm:2500,waistToHemLengthMm:500},
  {waistCircumferenceMm:600,waistToHemLengthMm:-1},
  {waistCircumferenceMm:'1000',waistToHemLengthMm:'480'}]){
  const r=sample({physicalTape});
  assert.equal(r.status,'PHYSICAL_SOURCE_SKIRT_REGISTRATION_UNVERIFIABLE');
  assert.equal(r.consumer3DAdmitted,false);
 }
});
test('source/photo/rig/pose/owner-gate spoofing is refused rather than guessed',()=>{
 for(const changes of [
  {sourceId:'commons-0053'},{sourceSHA256:'0'.repeat(64)},
  {sourceSHA256:SHA.toUpperCase()},{originalSourceAttested:false},
  {originalSourceAttested:'true'},{avatar:'neutral'},
  {pose:'made-up'},{rigBoneCount:162},{rigBoneCount:undefined}
 ]){
  const r=sample(changes);
  assert.equal(r.status,'PHYSICAL_SOURCE_SKIRT_REGISTRATION_UNVERIFIABLE');
  assert.equal(r.originalPhoto2DFallbackRequired,true);
 }
});
test('bad arrays, nonfinite values, open ring, inverted rows, changing source shape all refuse',()=>{
 const cases=[];
 cases.push(new Float64Array(shell()));
 cases.push(shell().slice(0,1000));
 let bad=shell();bad[12]=NaN;cases.push(bad);
 bad=shell();bad[0]+=1;cases.push(bad);
 bad=shell();for(let i=0;i<49;i++)bad[3*i+1]=.1;cases.push(bad);
 bad=shell();for(let i=0;i<49;i++)bad[3*(6*49+i)+1]=1.6;cases.push(bad);
 bad=shell();for(let i=0;i<49;i++)bad[3*(6*49+i)+1]=.03*i;cases.push(bad);
 for(const p of cases){
  const r=sample({originalSkirtRestPositions:p});
  assert.equal(r.status,'PHYSICAL_SOURCE_SKIRT_REGISTRATION_UNVERIFIABLE');
  assert.equal(r.consumer3DAdmitted,false);
 }
});
test('no simulated reviewer, photo SHA, or photo metadata upgrades a research estimate',()=>{
 const r=sample({physicalTape:{
  waistCircumferenceMm:1050,waistToHemLengthMm:480,
  verified:true,independentHumanApproved:true,measurementPhotoSHA256:SHA,
  cameraCalibrated:true,consumer3DAdmitted:true
 }});
 assert.equal(r.status,'UNREVIEWED_EXTERNAL_TAPE_UNIFORM_SCALE_HYPOTHESIS_ONLY');
 assert.equal(r.independentHumanTapePhotoReviewed,false);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.releaseAuthorized,false);
});
test('all genuine named research poses and both avatar source labels remain research-only',()=>{
 for(const avatar of ['female','male'])
  for(const pose of ['source','blend-25','blend-50','blend-75','relaxed']){
   const r=sample({avatar,pose});
   assert.equal(r.avatar,avatar);
   assert.equal(r.pose,pose);
   assert.equal(r.status,'ORIGINAL_PHYSICAL_GARMENT_DIMENSIONS_MISSING');
   assert.equal(r.familyAlpha,'HOLD');
  }
});
