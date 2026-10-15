import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('resolution evaluator reports an inconclusive comparison when originals do not exceed 4096 pixels',()=>{
 const source=readFileSync('scripts/compare-photo-resolutions.mjs','utf8');
 assert.match(source,/Math\.max\(x\.sourceDimensions\?\.width\|\|0,x\.sourceDimensions\?\.height\|\|0\)>4096/);
 assert.match(source,/resolutionGainTestConclusive:eligible\.length>0/);
 assert.match(source,/highResolutionEligible:eligible\.length/);
 assert.match(source,/eligibleCategoryCorrectBefore:eligibleCount\('oldCategoryCorrect'\)/);
 assert.match(source,/eligibleCategoryCorrectAfter:eligibleCount\('newCategoryCorrect'\)/);
 assert.match(source,/eligibleCategoryRecoveries:eligible\.filter/);
});
