// Compare each fresh prediction to the exact #226 artifact; no aggregate gains
// may hide a regression. This is not independent human ground truth.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {auditRecognitionAdmission} from './audit-recognition-admission.mjs';
import {checkRecognitionRegressions} from './check-recognition-regressions.mjs';
const directory=process.argv[2];
if(!directory)throw Error('Usage: node scripts/check-assignment233-recognition.mjs OUTPUT_DIRECTORY');
const read=p=>JSON.parse(fs.readFileSync(p));
const baseline=read('benchmark/assignment233/baseline-226.json');
const sources=read('benchmark/locked-photo-sources.json'),seen=new Set();
for(const row of sources){
 assert.ok(!seen.has(row.id),'Duplicate locked source');seen.add(row.id);
 assert.ok(row.attribution?.license,'Licensed fixture required');
 const bytes=fs.readFileSync('benchmark/fixtures/'+row.image);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256,'Original fixture bytes changed: '+row.id);
}
assert.equal(seen.size,59);
const cohorts=['reviewed-32','holdout-16','fresh-11'],sets={},comparisons=[];
for(const k of cohorts){
 const manifest=read('benchmark/manifest-'+k+'.json'),results=read(directory+'/candidate-'+k+'.json');
 const comparison=checkRecognitionRegressions(manifest,results,{results:baseline.cohorts[k]});
 assert.equal(comparison.passed,true,JSON.stringify(comparison.failures));
 assert.deepEqual(results,baseline.cohorts[k],'Unhinted decisions must stay identical to verified #226');
 comparisons.push(comparison);sets[k]={manifest,results};
}
const source=read(directory+'/source-integrity-and-hint-report.json');
assert.equal(source.originalHashMatches,59);assert.equal(source.reencodedSources,0);
assert.equal(source.remoteRequestsAfterWarmup,0);
const admission=auditRecognitionAdmission(sets,{historical:false});
assert.equal(admission.productionReleaseApproved,false,'Inference cannot authorize release');
const report={baselineCommit:baseline.sourceCommit,sourceCount:59,comparisons,admission,
 unchangedUnhintedDecisions:true,independentHumanMasks:0,physicalPhonesTested:0};
fs.writeFileSync(directory+'/assignment233-comparison.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
