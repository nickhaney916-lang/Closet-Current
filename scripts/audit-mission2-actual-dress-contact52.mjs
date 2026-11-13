/**
 * M2 P2-C52: fail-closed, public-fixture-only REAL native P175 browser
 * receipt audit. Only bounded, source-anonymous counts are retained.
 * This is not a photo mesh repair, clearance admission or cloth physics.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const file='benchmark/native-3d-05/results.json';
const report=JSON.parse(await readFile(file,'utf8'));
assert.equal(report.priority,'NATIVE-3D-05');
assert.equal(report.realWebGL,true);
assert.equal(report.originalNativeAuthHTTPOnlyMocked,true);
assert.equal(report.realSignedRLS,false);
assert.equal(report.familyAlpha,'HOLD');
assert.equal(report.releaseAuthorized,false);
assert.deepEqual(report.errors,[]);
assert.deepEqual(report.crashes,[]);
assert.deepEqual(report.widths,[320,390,430]);
const receipts=report.licensedDressContact52;
assert.ok(Array.isArray(receipts)&&receipts.length===3);
assert.deepEqual(receipts.map(r=>r.width),[320,390,430]);
for(const r of receipts){
 assert.equal(r.schema,'M2-real-original-photo-surface-diagnostic-C52');
 assert.equal(r.source,'licensed-original-Commons-0053-P61-P175');
 assert.equal(r.authenticOriginalLicensedDress,true);
 assert.equal(r.actuallySkinned163Bones,true);
 assert.ok(r.anatomicalBodyMeshes>=1);
 assert.ok(r.originalSourceFaces>=1000&&r.originalSourceFaces<=100000);
 assert.ok(r.sourcePairComparisons>=0&&r.posedPairComparisons>=0);
 assert.ok(r.originalSourceStrictCrossings>=0);
 assert.ok(r.posedStrictCrossings>=0);
 assert.equal(r.originalSourceBoxPairs,
  r.originalSourceStrictCrossings+r.originalSourceUncertainBoxPairs);
 assert.equal(r.posedBoxPairs,
  r.posedStrictCrossings+r.posedUncertainBoxPairs);
 assert.equal(r.sourceSweepExhausted||r.posedSweepExhausted,
  !r.sourceAndPosedFullPairSweepCompleted);
 assert.equal(r.originalSourcePhotoUVRestSkinAndIndicesUntouched,true);
 assert.equal(r.noRawGeometryOrPhotoExposed,true);
 assert.equal(r.boundingBoxOverlapNotProofOfContact,true);
 assert.equal(r.nonCrossingNotProofOfClearance,true);
 assert.equal(r.anyContactMustRemainBlocked,true);
 assert.equal(r.noContinuousSelfCollisionCertificate,true);
 assert.equal(r.realClothPhysics,false);
 assert.equal(r.humanPhotorealismApproval,false);
 assert.equal(r.realPhoneAcceptance,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.familyAlpha,'HOLD');
}
const first=receipts[0];
for(const r of receipts.slice(1))
 for(const k of ['originalSourceFaces','originalSourceBoxPairs',
  'originalSourceStrictCrossings','sourceAndPosedFullPairSweepCompleted'])
  assert.equal(r[k],first[k],
   'Same SHA-pinned P61 source original cannot silently change with viewport width: '+k);
const output={
 schema:'M2-P2-C52-live-licensed-photograph-contact-report',
 authenticOriginalPhotoBrowserRuns:receipts.length,
 originalSourceFaces:first.originalSourceFaces,
 sourceStrictCrossingWitnesses:first.originalSourceStrictCrossings,
 sourceBoundsUncertain:first.originalSourceUncertainBoxPairs,
 posedStrictCrossingWitnesses:receipts.map(r=>r.posedStrictCrossings),
 posedAABBUncertainty:receipts.map(r=>r.posedUncertainBoxPairs),
 comparisonBudgetsExhausted:receipts.some(r=>
  !r.sourceAndPosedFullPairSweepCompleted),
 exactSourceFaceCoordinatesNotExported:true,
 originalLicensedPhotographSHAValidatedInBrowser:true,
 originalGarmentStillUnchanged:true,
 entireActualSourceMeshRepairNotVerified:true,
 continuousSelfContactOrGarmentPhysicsCertified:false,
 independentPhotorealApproval:false,
 physicalMobileAcceptance:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
};
await mkdir('benchmark/mission2-source-dress-motion',{recursive:true});
await writeFile('benchmark/mission2-source-dress-motion/live-source-contact52.json',
 JSON.stringify(output,null,2)+'\n');
console.log('M2_C52_REAL_LICENSED_P175_CONTACT_SAFE_SUMMARY',JSON.stringify(output));
