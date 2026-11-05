#!/usr/bin/env node
/** MODEL52: independent browser evidence, not estimated model accuracy. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const base='benchmark/model-asset-reliability-52/';
const probe=JSON.parse(await readFile(base+'probe.json','utf8'));
const dir='benchmark/recognition-to-closet-42/';
const app=JSON.parse(await readFile(dir+'acceptance.json','utf8'));
const revision='0f99955d944c39bfd9d035a02ac273c7a44a406b';
assert.equal(probe.photoUploadCount,0);
assert.equal(probe.cases.length,2);
assert.equal(probe.sourceSHA256,'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64');

for(const engine of ['chromium','webkit']){
 const c=probe.cases.find(x=>x.engine===engine&&x.width===390);
 assert.ok(c);
 assert.equal(c.modelKey,'fashion-clip/whole-v1/'+revision);
 assert.equal(c.visualEncoderDimension,512);
 assert.ok(c.embeddingL2Norm>.98&&c.embeddingL2Norm<1.02);
 assert.ok(c.choiceCount>0,'Real original JPEG must yield candidate predictions');
}
assert.deepEqual(probe.errors,[]);
assert.deepEqual(probe.blocked,[]);
assert.deepEqual(probe.failures,[]);
assert.equal(app.cases.length,6);
assert.deepEqual(app.errors,[]);
assert.deepEqual(app.unexpectedUploads,[]);
assert.equal(app.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
let browserCases=0;
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 const c=app.cases.find(x=>x.engine===engine&&x.width===width);
 assert.ok(c,'Missing actual browser '+engine+'/'+width);
 assert.ok(c.ownerPrivate&&c.outfitSaved&&c.v4Backup&&c.v4Restore&&c.reimportDuplicateBlocked);
 assert.equal(c.sourceSHA256,app.source.sha256);
 assert.equal(c.recognitionEvidence?.source,'local-fashionclip');
 assert.equal(c.recognitionEvidence?.inputBinding49?.sourceSHA256,app.source.sha256);
 assert.match(c.recognitionEvidence?.inputBinding49?.cropSHA256,/^[0-9a-f]{64}$/);
 browserCases++;
}
let audited=0;
for(const file of app.screenshots){
 const bytes=await readFile(dir+file.file),meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
 assert.equal(meta.format,'png');assert.equal(meta.width,file.width);
 assert.ok(stats.channels.some(x=>x.stdev>6));
 audited++;
}
assert.ok(audited>=73,'Require real original, correction, saved outfits, privacy and detailed screenshots');
for(const record of [...app.modelRequestTrace52.blocked,...app.modelRequestFailures,...app.modelRequestTrace52.responses]){
 assert.equal(record.method,'GET','Never transmit a user photo in an external POST/PUT');
 assert.ok(!/data:image|Bearer|token=|signature=|access_token/i.test(record.path));
 assert.ok(record.path.length<1024);
}
const output={
 schema:'model-asset-reliability-52/v1',
 actualFeatureEncoder:{engines:['chromium','webkit'],width:390,featureDimensions:512,
  sourceSHA256:probe.sourceSHA256,realPredictions:probe.cases.map(x=>({engine:x.engine,category:x.topCategory,strong:x.strong,choiceCount:x.choiceCount}))},
 fullReviewSave:{browserCases,engines:['chromium','webkit'],widths:[320,390,430],
  photosSentToExternalServices:0,realScreenshotsSHAudited:audited,
  realLocalSuggestionEvidenced:true,modelRequestFailures:app.modelRequestFailures.length,
  browserHarnessBlockedRequests:app.modelRequestTrace52.blocked.length,
  failures:app.modelRequestFailures,blocked:app.modelRequestTrace52.blocked,
  responses:app.modelRequestTrace52.responses},
 caveat:'A model result may safely abstain; this is not a 95% garment category/type/color benchmark. Browser viewport emulation is not physical-phone acceptance; worker evidence does not cryptographically attest model weights.'
};
await writeFile(base+'acceptance.json',JSON.stringify(output,null,2)+'\n');
console.log('MODEL52 original-photo actual vision worker and full private mobile UX audit: '+JSON.stringify({
 workerContexts:2,fullNativeContexts:browserCases,verifiedScreenshots:audited,
 failures:output.fullReviewSave.modelRequestFailures,blocked:output.fullReviewSave.browserHarnessBlockedRequests,
 failurePaths:[...new Set(output.fullReviewSave.failures.map(x=>x.path))],
 blockedPaths:[...new Set(output.fullReviewSave.blocked.map(x=>x.path))]
}));
