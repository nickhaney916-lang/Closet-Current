import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {intakeFashionpedia,FASHIONPEDIA_VAL_SHA256} from '../research/autonomous-recognition-mission/fashionpedia-intake.mjs';
const report=JSON.parse(readFileSync(new URL('../research/autonomous-recognition-mission/fashionpedia-candidates.json',import.meta.url)));
test('public annotation intake does not silently promote license metadata or source labels to accepted photos',()=>{
 assert.equal(report.sourceSHA256,FASHIONPEDIA_VAL_SHA256);
 assert.equal(report.candidateCount,153);assert.equal(report.totalSourceImages,1158);
 assert.equal(report.excludedImageCount,1005);assert.equal(report.acceptedBenchmarkPhotos,0);
 assert.equal(report.primaryColorGroundTruthAvailable,false);assert.equal(report.releaseAuthorized,false);
 assert.equal(report.recognitionAccuracy,null);assert.equal(report.segmentationIoU,null);
 assert.equal(new Set(report.candidates.map(x=>x.datasetImageId)).size,153);
 for(const row of report.candidates){
  assert.equal(row.recordedImageLicense,'https://creativecommons.org/licenses/by/2.0/');
  assert.equal(row.sourceJPEGVerified,false);assert.equal(row.originalRightsVerified,false);
  assert.equal(row.creatorAttributionVerified,false);assert.equal(row.modelExposureAudited,false);
  assert.equal(row.independentHoldoutEligible,false);assert.equal(row.quarantined,true);
 }
});
test('modified or substituted upstream annotation bytes cannot generate a new pinned cohort',()=>{
 for(const value of ['{}','',JSON.stringify(report)])assert.throws(()=>intakeFashionpedia(Buffer.from(value)),/digest mismatch/);
});
