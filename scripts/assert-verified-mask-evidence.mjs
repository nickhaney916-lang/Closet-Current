import fs from 'node:fs';import assert from 'node:assert/strict';
import {digest,FEATURES} from '../benchmark/verified-mask-quality.mjs';
const report=JSON.parse(fs.readFileSync('artifacts/verified-mask-evidence/results.json'));
const expected=JSON.parse(fs.readFileSync('benchmark/verified-mask-results-20261019.json'));
assert.deepEqual(report,expected,'Real-photo evidence drift; investigate, never auto-update truth');
for(const [path,sha]of Object.entries(report.pipelineFiles))assert.equal(digest(fs.readFileSync(path)),sha);
assert.deepEqual(report.summary,{licensedRealPhotos:12,proposals:1,independentlyVerifiedFullMasks:0,measuredFalseRemovalCases:0,measuredFalseInclusionCases:0,qualityPasses:0,blocked:12,realPhoneRuns:0});
for(const c of report.cases){assert.equal(c.maskQuality.metrics,null);assert.equal(c.maskQuality.passed,false);assert.equal(c.maskQuality.productionAuthorized,false);assert.equal(Object.keys(c.featureEvidence).length,FEATURES.length);}
console.log('PASS evidence honesty/reproducibility checks; garment quality gates remain BLOCKED for all 12 photos.');
