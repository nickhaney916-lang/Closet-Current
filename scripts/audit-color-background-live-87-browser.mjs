/**
 * Independent browser screenshot QA; does not alter fixture code or source.
 * All six actual Playwright renderings are checked after the test completes.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/color-background-live-87';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.schema,'color-background-live-87/v1');
assert.equal(report.actualModelExecuted,false);
assert.equal(report.independentHumanColorLabels,false);
assert.equal(report.physicalPhoneTested,false);
assert.equal(report.sourceNature,'generated synthetic test photos');
assert.equal(report.unexpectedUploads.length,0);
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,30);
const stages=[
 '01-white-background-color-warning-before-human-review',
 '02-human-blue-color-privately-saved',
 '03-solid-blue-pixel-advice-still-unverified',
 '04-two-owner-private-human-confirmed-sources',
 '05-logout-and-owner-B-private-empty'
];
const SHA=/^[a-f0-9]{64}$/;
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 const c=report.cases.find(x=>x.engine===engine&&x.width===width);
 assert.ok(c,'Missing actual browser case '+engine+' '+width);
 for(const k of ['opaqueBackgroundHintSuppressed','solidColorHintUnverified',
  'humanColorNotAutofilled','sourceSHAUnchanged','workerSimulated','ownerIsolation'])
  assert.equal(c[k],true,'Source-dependent browser acceptance missing: '+k);
 assert.equal(c.manualPrivateSaves,2);
 assert.match(c.riskySourceSHA256,SHA);
 assert.match(c.safeSourceSHA256,SHA);
 assert.notEqual(c.riskySourceSHA256,c.safeSourceSHA256);
 for(const stage of stages){
  const file=engine+'-'+width+'-'+stage+'.png';
  const entry=report.screenshots.find(x=>x.file===file);
  assert.ok(entry,'Missing true native screenshot '+file);
  const b=await readFile(dir+'/'+file);
  const sum=createHash('sha256').update(b).digest('hex');
  assert.equal(sum,entry.sha256,'Screenshot bytes changed '+file);
  const m=await sharp(b).metadata(),stats=await sharp(b).stats();
  assert.equal(m.format,'png');assert.equal(m.width,width);
  assert.equal(m.height,entry.height);assert.ok(m.height>=920&&b.length>5000);
  assert.ok(stats.channels.some(x=>x.stdev>6),'Screenshot blank '+file);
 }
}
console.log('COLOR87 6/6 Chromium/WebKit real browser cases and 30/30 original-file screenshot SHA/dimensions/entropy PASS. Synthetic JPEG test source, mocked classifier: NOT AI accuracy.');
