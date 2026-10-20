// Technical integration gate: green app tests permit DRAFT/PILOT QA only.
// A successful Chromium/WebKit run never proves independent human, rights,
// physical-phone, live provider, or production-launch acceptance.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const mask=read('benchmark/local-fitting-real-photo-manifest.json');
const figure=read('benchmark/figure-readiness/asset-evidence.json');
const policy=read('benchmark/figure-readiness/production-policy.json');
const edge=fs.readFileSync('supabase/functions/ai-try-on/index.ts','utf8');
const source=fs.readFileSync('public/app.js','utf8');
const recognizer=fs.readFileSync('public/recognition-engine.mjs','utf8');
const parser=fs.readFileSync('public/photo-check.js','utf8');
const renderer=fs.readFileSync('public/reusable-figure-preview.js','utf8');
assert.equal(mask.independentlyApprovedMasks,0,'human approvals must be collected independently');
assert.ok(mask.cases.length>=12&&mask.cases.every(c=>c.independentReferenceMask==null&&c.review==null));
assert.equal(policy.status,'proposed-not-production-approved','do not silently authorize production figures');
assert.equal(figure.figures.length,2);
assert.ok(figure.figures.every(f=>f.masterPath===null&&f.rights.commercialUse===null),
 'evidence for production art rights/master source is not approved');
for(const gate of ['RESERVED_PAID_INFERENCE_APPROVED=false','CHAINED_PAID_INFERENCE_APPROVED=false'])
 assert.ok(edge.includes(gate),'Paid inference must remain disabled: '+gate);
assert.ok(source.includes('function recognitionSourcePhoto(')&&source.includes('const sourcePhoto=recognitionSourcePhoto(item)'),
 'capture must preserve the original RGB photo for classification');
assert.ok(recognizer.includes('requiresDressComparison')&&
 recognizer.includes("localCandidates.filter(x=>['Bottoms','Dresses','Uncategorized'].includes(x.category))"),
 'never auto-recover a skirt from a Bottoms-only vocabulary');
assert.ok(parser.includes('white-foreground-unverified'),'white backdrops must require confirmation');
assert.ok(renderer.includes('ClosetFigurePreviewCache')||
 renderer.includes('figurePreviewCache'),'offline figure preview cache must remain integrated');
const result={
 customerIntegration:'tech-verified-only',
 productionReleaseApproved:false,physicalPhonePhotosValidated:false,
 independentlyApprovedHumanMasks:0,
 originalRgbCategoryBeforeClip:true,
 skirtDressCompetitionGuard:true,
 uncertainWhiteBackdropHeld:true,
 paidInferenceApproved:false,
 originalFigureCommercialRightsApproved:false,
 licensedOriginalFixtureCount:mask.cases.length,
 currentBranchPolicy:'draft PR only; no merge/deploy',
 browserEmulationCannotProvePhysicalPhones:true
};
console.log(JSON.stringify(result));
