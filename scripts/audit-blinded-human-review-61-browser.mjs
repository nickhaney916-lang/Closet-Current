#!/usr/bin/env node
/**
 * BLIND61 independently check generated native Playwright screenshots.
 * A successful browser screenshot of simulated annotation controls is NOT
 * evidence that an independent human labeled a photograph.
 */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const dir='benchmark/independent-annotation-61/browser-evidence';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.failure,undefined);
assert.equal(report.humanReviewPerformed,false);
assert.equal(report.scientificHumanAnnotations,0);
assert.equal(report.modelAccuracyEvidence,false);
assert.equal(report.qaClickedControlsOnly,true);
assert.deepEqual(report.unexpectedNetwork,[]);
assert.deepEqual(report.errors,[]);
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,18);
const keys=new Set(),files=new Set();
for(const c of report.cases){
 keys.add(c.engine+'/'+c.width);
 assert.equal(c.oneSimulatedRowExportedAndSourceSHAMatched,true);
 assert.equal(c.packetBNoPeerAnswers,true);
 assert.equal(c.noOriginalPhotosUploaded,true);
}
assert.deepEqual([...keys].sort(),[
 'chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430'
].sort());
for(const shot of report.screenshots){
 assert.equal(files.has(shot.file),false);files.add(shot.file);
 const data=await readFile(dir+'/'+shot.file);
 assert.equal(createHash('sha256').update(data).digest('hex'),shot.sha256);
 assert.equal(data.length,shot.bytes);
 const m=await sharp(data).metadata();
 assert.equal(m.format,'png');assert.equal(m.width,shot.width);
 assert.equal(m.height,shot.height);assert.ok(m.height>650);assert.ok(shot.bytes>7000);
 const stats=await sharp(data).stats();
 assert.ok(stats.entropy>1,'Screenshot unexpectedly blank or uniform');
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 for(const stage of [
  '01-original-blank-visual-review',
  '02-synthetic-click-only-annotated',
  '03-other-reviewer-isolated-no-peer-label'
 ])assert.ok(files.has(engine+'-'+width+'-'+stage+'.png'));
}
console.log('BLIND61 REAL BROWSER SOURCE-IMAGE/REVIEWER ISOLATION AND 18 SHA-256 SCREENSHOTS AUDITED: '+
 JSON.stringify({cases:report.cases.length,screenshots:report.screenshots.length,
  actualHumanLabels:0,claimsOfModelImprovement:false}));
