/**
 * RECOVERY65: independent SHA audit of actual native
 * Chromium/WebKit 320/390/430 original-source manual recovery browsers.
 * Synthetic worker faults do not measure real model recognition accuracy.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/detector-recovery-65';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.failure,undefined,'Interrupted worker recovery run cannot pass');
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,66,'Expected 60 native manual flow screenshots plus 6 worker failure state screenshots');
assert.equal(report.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(report.source.sourceHashPinned,true);
assert.deepEqual(report.unexpectedUploads,[]);
assert.deepEqual(report.errors,[]);
const modes={
 'chromium/320':'constructor','chromium/390':'post','chromium/430':'runtime',
 'webkit/320':'messageerror','webkit/390':'timeout','webkit/430':'manualstop'
};
const seen=new Set();
for(const c of report.cases){
 const key=c.engine+'/'+c.width;
 assert.equal(seen.has(key),false);seen.add(key);
 assert.equal(c.detectorFailureRecovery65,true);
 assert.equal(c.detectorFaultMode65,modes[key]);
 assert.equal(c.detectorMessageReplay57,false);
 assert.equal(c.detectorFloodBound58,false);
 assert.equal(c.pieces,3);
 assert.equal(c.sourceSHA256,report.source.sha256);
 assert.equal(c.ownerPrivate,true);
 assert.equal(c.outfitSaved,true);
 assert.equal(c.stylePinnedAndSaved,true);
 assert.equal(c.v4Backup,true);assert.equal(c.v4Restore,true);
 assert.equal(c.reimportDuplicateBlocked,true);
}
assert.deepEqual([...seen].sort(),Object.keys(modes).sort());
const names=new Set();
for(const shot of report.screenshots){
 assert.equal(names.has(shot.file),false,'Screenshot overwritten');
 names.add(shot.file);
 const png=await readFile(dir+'/'+shot.file);
 assert.equal(createHash('sha256').update(png).digest('hex'),shot.sha256);
 const m=await sharp(png).metadata();
 assert.equal(m.format,'png');
 assert.equal(m.width,shot.width);
 assert.ok(m.height>=920,'Native mobile screenshot unexpectedly cropped');
 assert.ok(png.length>4000);
 const stat=await sharp(png).stats();
 assert.ok(stat.entropy>1,'Mobile screenshot too uniform to inspect');
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 for(const name of [
  '01-original-source-all','01b-worker-failed-manual-ready-all',
  '02-three-reviewed-pieces-all','03-owner-private-index-all','04-saved-outfit-all'
 ])assert.ok(names.has(engine+'-'+width+'-'+name+'.png'),
   'Required visible native proof absent '+engine+' '+width+' '+name);
}
console.log('RECOVERY65 6/6 ACTUAL NATIVE ORIGINAL JPEG WORKER-FAULT PRIVATE-REVIEW ACCEPTANCE & 66 SHA-VERIFIED SCREENSHOTS PASS. No model accuracy inference: '+
 JSON.stringify({modes,sourceSHA256:report.source.sha256,screenshots:report.screenshots.length}));
