import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const evidence=JSON.parse(readFileSync('benchmark/LIP-SOCKS-REAL-REVIEW-20261017.json','utf8'));
test('real-photo LIP result is not a wardrobe release approval',()=>{
 assert.equal(evidence.photosCount,2);
 assert.equal(evidence.groundTruthPixelMasksAvailable,false);
 assert.equal(evidence.accuracyPercentage,null);
 assert.equal(evidence.automaticHosieryCatalogApproved,false);
 assert.equal(evidence.addedClosetEntries,0);
 assert.equal(evidence.recommendation,'do-not-promote-to-live');
 assert.equal(evidence.realPhoneSpeedMeasured,false);
});
test('Socks class pixels on white boot shaft are insufficient evidence of sock separation',()=>{
 const boot=evidence.findings.find(x=>x.id==='validation-0030');
 assert.ok(boot.sockClassPixels>0);
 assert.ok(boot.shoeClassPixels>0);
 assert.equal(boot.sockAndShoeClassesPresent,true);
 assert.equal(boot.clothingSeparatedCorrectly,false);
 assert.equal(boot.perPixelAccuracyMeasured,false);
});
test('No dedicated tights class and no sock detections in tights and heels photo',()=>{
 const tights=evidence.findings.find(x=>x.id==='validation-0031');
 assert.equal(tights.sockClassPixels,0);
 assert.ok(tights.shoeClassPixels>0);
 assert.equal(tights.clothingSeparatedCorrectly,false);
 assert.equal(tights.perPixelAccuracyMeasured,false);
});
test('both images preserve provenance and must not count two items based on labels',()=>{
 assert.deepEqual(evidence.findings.map(x=>x.id),['validation-0030','validation-0031']);
 assert.equal(evidence.findings.every(x=>x.cpuInferenceMs>0),true);
 assert.match(evidence.modelSha256,/^[0-9a-f]{64}$/);
 assert.equal(evidence.addedClosetEntries,0);
});
