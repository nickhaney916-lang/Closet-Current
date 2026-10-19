import fs from 'node:fs';import assert from 'node:assert/strict';
import {sha} from '../benchmark/figure-readiness/production-figure-metrics.mjs';
const r=JSON.parse(fs.readFileSync('artifacts/production-figures/results.json'));
assert.deepEqual(r,JSON.parse(fs.readFileSync('benchmark/figure-readiness/production-results-20261019.json')),'Figure evidence drift requires investigation');
for(const [p,h]of Object.entries(r.pipelineFiles))assert.equal(sha(fs.readFileSync(p)),h);
assert.deepEqual(r.summary,{assets:2,mastersPresent:0,approvedLicenses:0,reviewedAnchorPairs:0,productionReady:0});
assert.equal(r.productionAuthorized,false);assert.equal(r.pairAlignment,null);assert.equal(r.visualQualityScored,false);
for(const f of r.figures){assert.equal(f.ready,false);assert.equal(f.preview.width,160);assert.equal(f.preview.height,297);assert.equal(f.master,null);assert.equal(f.previewSampling.every(s=>!s.nativeSamplingSufficient),true);}
console.log('PASS two-figure evidence integrity. Both production asset gates remain BLOCKED.');
