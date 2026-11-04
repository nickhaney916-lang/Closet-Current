import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='benchmark/auto-multi-15';
const read=async name=>JSON.parse(await readFile(root+'/'+name,'utf8'));
const [report,manifest,execution,screenshots]=await Promise.all([
 read('evaluation.json'),
 JSON.parse(await readFile('research/auto-multi-model-evidence-15/locked-worn-original.json','utf8')),
 read('execution.json'),read('screenshots.json')
]);
assert.equal(report.priority,'AUTO-MULTI-MODEL-EVIDENCE-15');
assert.equal(report.inferenceMode,'live-unmocked-browser-SegFormer');
assert.equal(report.cases.length,2);
assert.equal(report.expectedCoarseRegions,6);
assert.equal(report.fullOutfitScenes,2);
assert.equal(report.allSourcesVerified,true);
assert.equal(report.automaticMaskIoU,null);
assert.equal(report.automaticGarmentTypeAccuracyPercent,null);
assert.equal(report.fullyAutomaticMultiGarmentRecallPercent,null);
assert.equal(report.allProposalsRequireHumanReview,true);
assert.equal(report.productionDeployed,false);assert.equal(report.familyAlpha,'HOLD');
assert.deepEqual(report.cases.map(x=>x.sourceSha256),manifest.map(x=>x.sourceSha256));
assert.equal(execution.noNewImageUpload,true);
assert.equal(execution.actualUnmockedSegFormer,true);
assert.equal(execution.sourceSha256,manifest[0].sourceSha256);
assert.equal(screenshots.length,6,'genuine mobile evidence across 2 engines x 3 widths');
const observed=new Set();
for(const shot of screenshots){
 const key=shot.engine+'-'+shot.width;
 assert.ok(['chromium','webkit'].includes(shot.engine));
 assert.ok([320,390,430].includes(shot.width));
 assert.ok(!observed.has(key));observed.add(key);
 const bytes=await readFile(root+'/'+shot.file);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),shot.sha256);
 const meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(meta.format,'png');assert.equal(meta.width,shot.width);
 assert.ok(meta.height>=650&&bytes.length>10000);
 assert.ok(stats.channels.some(x=>x.stdev>5),'blank screenshot');
}
assert.equal(observed.size,6);
const eligible=report.cases.filter(x=>x.modelExecuted&&!x.modelError);
const verification={finalResearchAudit:true,source:manifest[0].sourceSha256,
 genuineModelEngineRuns:eligible.length,threeExpectedClasses:report.scenesWithThreeExpectedClasses,
 threeProposedClasses:report.scenesWithThreeProposedClasses,observedCoarseMatches:report.matchedCoarseRegions,
 observedCoarseExpected:report.expectedCoarseRegions,unmatched:report.unmatchedCoarseRegions,
 proposalCount:report.modelProposals,modelErrors:report.modelErrors,automaticMaskIoU:null,
 garmentTypeAccuracy:null,screenshots:6,release:'HOLD',photoOnly3D:true};
await writeFile(root+'/audit.json',JSON.stringify(verification,null,2));
console.log('AUTO MULTI EVIDENCE15 AUDIT '+JSON.stringify(verification));
assert.equal(eligible.length,2,'both real Chromium and WebKit model executions must complete before research acceptance');
assert.equal(execution.pageErrors,0,'genuine browser exceptions must be investigated');