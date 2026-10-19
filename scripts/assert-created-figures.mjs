import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {checkCreatedPacket} from '../benchmark/figure-creation/created-figure-gate.mjs';
import {checkProceduralFootwear} from '../benchmark/figure-creation/footwear-contract.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),report=JSON.parse(fs.readFileSync('artifacts/figure-creation/results.json'));
for(const [p,h]of Object.entries(report.pipelineFiles))assert.equal(sha(fs.readFileSync(p)),h);
for(const f of report.figures)for(const [key,suffix]of [['master','-master.png'],['minimum','-1294.png'],['mobile','-mobile.webp']])assert.equal(sha(fs.readFileSync('artifacts/figure-creation/delivery/'+f.id+suffix)),f.variants[key].sha256);
for(const candidate of report.figures)checkProceduralFootwear(candidate);
for(const candidate of report.figures){
 const hem=candidate.derivedClothingHem;
 assert.ok(hem&&hem.hemBoundaryVertices>=8&&hem.hemBoundaryMoved>=8,
  'both new figures require actual generated lower-shell hem edits');
 assert.equal(hem.derivedShellOnly,true);
 assert.equal(hem.bodySourceVerticesChanged,false);
 assert.equal(hem.independentAppearanceApproval,false);
 assert.ok(hem.hemZRangeAfter<hem.hemZRangeBefore,
  'measured generated hem contour must be flatter, not just visually asserted');
}
assert.deepEqual(report.summary,{fixedCharacters:2,native1941x3597Renders:2,minimum1294x2398Derivatives:2,productionApproved:0,independentVisualApprovals:0,physicalPhones:0,customerImagesUsed:0,externalInferenceCalls:0});
console.log('CREATED_FIGURE_GATE '+JSON.stringify(checkCreatedPacket(report)));
