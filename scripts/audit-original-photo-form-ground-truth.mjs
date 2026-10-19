#!/usr/bin/env node
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {originalFormReviewQueue} from '../benchmark/original-photo-form-review.mjs';
const [manifestFile,lockedFile,resultFile,outputFile]=process.argv.slice(2);
if(!manifestFile||!lockedFile||!resultFile||!outputFile)
 throw Error('Usage: node scripts/audit-original-photo-form-ground-truth.mjs manifest.json locked-sources.json original-inference-results.json output.json');
const files=await Promise.all([manifestFile,lockedFile,resultFile].map(x=>readFile(x,'utf8').then(JSON.parse)));
const result=originalFormReviewQueue(...files);
await mkdir(dirname(resolve(outputFile)),{recursive:true});
await writeFile(outputFile,JSON.stringify(result,null,2));
console.log('ORIGINAL_FORM_REVIEW '+JSON.stringify({
 sources:result.originalSourcePhotos,flagged:result.flaggedSourceIds,
 subtypeDisagreement:result.strongWrongTypeVsManifestIds,
 possibleMultipleItemOriginals:result.multipleItemTitleCueIds,
 independentlyReviewed:result.independentHumanRecords,
 categoryAccuracy:result.categoryAccuracyAfterIndependentReview,
 physicalItemRecall:result.physicalItemRecall,
 productionReady:result.productionReady
}));
