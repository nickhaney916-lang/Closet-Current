import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/color-confidence-19';
const report=JSON.parse(await readFile(dir+'/report.json','utf8'));
const photos=JSON.parse(await readFile('research/color-confidence-safety-19/sources.json','utf8'));
const registry=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const known=new Map(registry.map(x=>[x.id,x]));
const quarantine=JSON.parse(await readFile(dir+'/source-quarantine.json','utf8'));
assert.equal(quarantine.requiredVerifiedOriginals,6);
assert.equal(quarantine.candidateCount,photos.samples.length);
assert.equal(quarantine.selectedIds.length,6);
assert.equal(new Set(quarantine.selectedIds).size,6);
assert.deepEqual(quarantine.quarantined.map(x=>x.id),quarantine.quarantined.map(x=>x.id).filter((id,i,a)=>a.indexOf(id)===i));
assert.ok(quarantine.quarantined.every(x=>['source-sha-mismatch','source-unavailable'].includes(x.reason)));
assert.equal(report.priority,'COLOR-CONFIDENCE-SAFETY-19');
assert.equal(report.uniqueLicensedOriginalPhotographs,6);
assert.equal(report.originalCandidateCount,photos.candidateCount);
assert.deepEqual(report.quarantinedSourceIds,quarantine.quarantined.map(x=>x.id));
assert.equal(report.originalSha256Verified,true);
assert.equal(report.trueIndependentColorGroundTruthAvailable,false);
assert.equal(report.measuredColorAccuracy,null);
assert.equal(report.releaseColorThreshold95PercentSatisfied,false);
assert.equal(report.familyAlpha,'HOLD');
assert.equal(report.productionDeployed,false);
assert.equal(report.wrongUncertainAutoFills,0);
assert.equal(report.noUnexpectedUploads,true);
assert.equal(report.jsErrors,0);
assert.equal(report.browserCases,12);
assert.equal(report.cases.length,12);
const seen=new Set();
for(const x of report.cases){
 assert.ok(['chromium','webkit'].includes(x.engine));
 assert.ok(quarantine.selectedIds.includes(x.id));
 assert.ok(photos.samples.some(y=>y.id===x.id));
 const key=x.engine+'/'+x.id;
 assert.ok(!seen.has(key),'each real model photo+engine only once');
 seen.add(key);
 assert.equal(x.sha256,known.get(x.id).sha256);
 assert.equal(x.originalSha256,x.sha256);
 assert.equal(x.groundTruthColor,null,'source title hints do not establish human-reviewed primary color');
 assert.equal(x.sourcePage,known.get(x.id).attribution.source);
 assert.equal(x.license,known.get(x.id).attribution.license);
 assert.ok(x.originalBytes>2000);
 if(x.estimate?.needsConfirmation)assert.equal(x.storedColor,null);
 if(x.storedColor!==null){
  assert.equal(x.storedSource,'photo-estimate');
  assert.equal(x.storedColor,x.estimate?.color);
 }
}
assert.equal(seen.size,12);
assert.deepEqual([...new Set(report.cases.map(x=>x.id))].sort(),quarantine.selectedIds.slice().sort());
const screenshots=JSON.parse(await readFile(dir+'/screenshots.json','utf8'));
assert.equal(screenshots.length,6);
const viewports=new Set();
for(const s of screenshots){
 assert.ok(['chromium','webkit'].includes(s.engine));
 assert.ok([320,390,430].includes(s.width));
 const key=s.engine+'/'+s.width;assert.ok(!viewports.has(key));
 viewports.add(key);
 const pixels=await readFile(dir+'/'+s.file);
 assert.equal(createHash('sha256').update(pixels).digest('hex'),s.sha256);
 const metadata=await sharp(pixels).metadata(),stats=await sharp(pixels).stats();
 assert.equal(metadata.width,s.width);assert.equal(metadata.format,'png');
 assert.ok(metadata.height>=500&&pixels.length>8000);
 assert.ok(stats.channels.some(x=>x.stdev>6),'blank screen cannot pass visual proof');
}
assert.equal(viewports.size,6);
const verified={originalPhotos:quarantine.selectedIds.length,
 candidatePhotos:photos.candidateCount,quarantinedSourceIds:quarantine.quarantined.map(x=>x.id),
 realBrowserCases:seen.size,
 jsErrors:0,uncertainAutoSaved:0,originalShaIntegrity:true,
 noOriginalUploads:true,mobileScreenshotShaVerified:6,
 actualColorAccuracy:null,photoTitlesAreNotGroundTruth:true,
 finalVerdict:'RESEARCH-SAFETY-VERIFIED__COLOR-ACCURACY-UNMEASURED',familyAlpha:'HOLD'};
await writeFile(dir+'/independent-audit.json',JSON.stringify(verified,null,2)+'\n');
console.log('COLOR CONFIDENCE 19 INDEPENDENT AUDIT '+JSON.stringify(verified));