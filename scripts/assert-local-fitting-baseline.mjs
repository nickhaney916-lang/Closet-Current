// Engineering regression assertions; successful holds are not fidelity scores.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=process.argv[2]||'artifacts/real-photo-quality';
const report=JSON.parse(await readFile(root+'/results.json'));
const reviews=JSON.parse(await readFile(root+'/review-results.json'));
assert.equal(report.summary.realPhotosScreened,12);
assert.equal(report.summary.pixelGateEligible,0);
assert.equal(report.summary.heldForIndependentReview,12);
assert.equal(report.summary.independentlyApprovedComposites,0);
assert.equal(report.summary.fidelityPercent,null);
assert.equal(report.summary.actualPhoneRuns,0);
assert.equal(report.decoder.browserPixelEquivalenceVerified,false);
assert.equal(report.decoder.version,'11.3.0');
for(const row of report.cases){
 assert.equal(row.sourceBytesUnchanged,true);assert.equal(row.originalUnchanged,true);
 assert.equal(row.independentReferenceMask,null);
 assert.ok(Object.values(row.featureScores).every(x=>x===null));
 assert.equal(row.reason,row.id==='commons-0053'?'ambiguous-neck-or-pale-collar':'nonwhite-or-translucent-photo-border');
}
assert.equal(report.figureReadiness.pairReady,false);
for(const asset of report.figureReadiness.figures){
 assert.equal(asset.previewWidth,160);assert.equal(asset.previewHeight,297);
 assert.equal(asset.masterPresent,false);
 assert.ok(asset.blockers.includes('rights-documentation-missing'));
}
assert.equal(reviews.summary.targets,24);
assert.equal(reviews.summary.documentedFeaturePasses,0);
assert.equal(reviews.summary.approvedComposites,0);
assert.ok(reviews.results.every(x=>x.compositingDecision==='hold'&&x.featureReview.decision==='hold'));
console.log('Real-photo rejection baseline and missing-asset evidence verified; fidelity unscored.');
