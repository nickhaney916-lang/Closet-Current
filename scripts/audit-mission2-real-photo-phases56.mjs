/**
 * Actual original licensed 163-bone P61/P175 FIVE-phase no-deploy receipt.
 * Invocation:
 *   PHOTO_DRESS_MOTION_PHASE36=.25 node scripts/audit-mission2-real-photo-phases56.mjs snapshot
 *   node scripts/audit-mission2-real-photo-phases56.mjs finalize
 * Always writes only source-deidentified counts and WebGL screenshot SHA256.
 * Never calls an external service or modifies owner/photo source.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {
 PHASES56,summarizeActualOriginalDressPhase56,
 summarizeAllOriginalDressPhases56
} from '../research/mission2-source-length/real-photo-contact-phases56.mjs';
const folder='benchmark/mission2-real-photo-phases56';
const mode=process.argv[2];
assert.ok(mode==='snapshot'||mode==='finalize',
 'C56 explicitly requires snapshot or finalize and never deploys');
await mkdir(folder,{recursive:true});
if(mode==='snapshot'){
 const phase=Number(process.env.PHOTO_DRESS_MOTION_PHASE36);
 assert.ok(PHASES56.includes(phase),'C56 source pose must be an allowed motion phase');
 const json=JSON.parse(await readFile('benchmark/native-3d-05/results.json','utf8'));
 const summary=summarizeActualOriginalDressPhase56(json,phase);
 const name=folder+'/phase-'+String(phase).replace('.','_')+'.json';
 await writeFile(name,JSON.stringify(summary,null,2)+'\n');
 console.log('M2_C56_ORIGINAL_LICENSED_163BONE_PHASE_SNAPSHOT',JSON.stringify({
  phase,viewports:summary.actualNativeWebGLWidths,
  sourceFaces:summary.sourceGeometryReceipts[0].sourceFaces,
  posedStrictCrossings:summary.sourceGeometryReceipts[0].posedStrictCrossings,
  sourceIndependentZeroDistance:summary.sourceGeometryReceipts[0].sourceIndependentZeroDistance,
  posedIndependentZeroDistance:summary.sourceGeometryReceipts[0].posedIndependentZeroDistance,
  releaseAuthorized:false
 }));
}else{
 const reports=await Promise.all(PHASES56.map(async phase=>
  JSON.parse(await readFile(folder+'/phase-'+String(phase).replace('.','_')+'.json','utf8'))));
 const summary=summarizeAllOriginalDressPhases56(reports);
 await writeFile(folder+'/five-phase-summary.json',
  JSON.stringify(summary,null,2)+'\n');
 console.log('M2_C56_ORIGINAL_LICENSED_163BONE_MULTIPHASE_RESULT',JSON.stringify(summary));
 assert.equal(summary.sampledPoseGuardPassed56,true,
  'C56 real photographed dress sampled phases expose a measured geometry/contact/visual blocker; must remain HOLD');
}
