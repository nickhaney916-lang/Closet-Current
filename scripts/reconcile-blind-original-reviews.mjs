#!/usr/bin/env node
// Audit-only: no human garment records are manufactured by this command.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {reconcileBlindOriginalSubmissions} from '../benchmark/blind-original-review-submissions.mjs';
const paths=process.argv.slice(2);
if(paths.length!==5)throw Error(
 'Usage: node scripts/reconcile-blind-original-reviews.mjs first-packet.json first-reviewed.json second-packet.json second-reviewed.json disagreements.json');
const [firstPacket,firstSubmission,secondPacket,secondSubmission]=await Promise.all(
 paths.slice(0,4).map(p=>readFile(p,'utf8').then(JSON.parse)));
const report=reconcileBlindOriginalSubmissions(firstPacket,firstSubmission,
 secondPacket,secondSubmission);
await mkdir(dirname(paths[4]),{recursive:true});
await writeFile(paths[4],JSON.stringify(report,null,2));
console.log('TWO_BLIND_REVIEWER_AUDIT '+JSON.stringify({
 sourcePhotos:report.sourcePhotos,
 countDisagreements:report.countsDisagree,
 formDisagreements:report.categoryOrSpecificFormDisagree,
 thirdReviewerQueue:report.photosNeedingThirdReviewer,
 independentPixelMasksApproved:report.independentlyApprovedPhysicalInventories,
 measuredPhysicalRecall:report.physicalGarmentRecall,
 modelAutoPromotionAllowed:report.mayTrainOrAdjustModel,
 releaseAllowed:report.canRelease
}));
