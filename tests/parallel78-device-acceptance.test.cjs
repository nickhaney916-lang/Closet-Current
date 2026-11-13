'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
globalThis.crypto ||= require('node:crypto').webcrypto;
const P=require('../public/device-acceptance-78.js');
const SHA='b'.repeat(64);
function start(overrides={}){return P.create({platform:'ANDROID_CHROME',modelFamily:'Google Pixel',
 osVersion:'17',browserVersion:'130',operatorDeclaredPhysical:true,viewportWidth:390,
 pixelRatio:2.75,sourceCommit:P.SOURCE_PARENT,...overrides});}
test('research device QA defaults to no witnessed measurements and release BLOCKED',()=>{
 const s=P.create();const p=P.privateReport(s),shared=P.publicReport(s);
 assert.equal(p.operatorDeclaredPhysical,false);assert.equal(p.cases.length,23);
 assert.equal(p.cases.every(c=>c.status==='NOT_RUN'),true);
 assert.equal(shared.counts.NOT_RUN,23);assert.equal(shared.independentlyVerifiedPhysicalRuns,0);
 assert.equal(shared.releaseStatus,'BLOCKED');assert.equal(P.releaseGate([shared]).status,'BLOCKED');
 assert.equal(P.validatePublic(shared),true);
});
test('claimed success without operator physical declaration or private proof is rejected',()=>{
 for(const option of [{operatorDeclaredPhysical:false},{platform:'OTHER_UNVERIFIED'}]){
  const s=start(option);
  assert.throws(()=>P.record(s,{caseId:'gallery_import',status:'PASS',evidenceSha256:SHA}),/UNVERIFIED_DEVICE_EVIDENCE/);
 }
 const s=start();
 assert.throws(()=>P.record(s,{caseId:'gallery_import',status:'PASS'}),/UNVERIFIED_DEVICE_EVIDENCE/);
 assert.throws(()=>P.record(s,{caseId:'gallery_import',status:'FAIL',evidenceSha256:'fake'}),/INVALID_DIGEST/);
 assert.equal(P.publicReport(s).counts.NOT_RUN,23);
});
test('operator claims are recorded as UNVERIFIED; public export drops all source and proof digests',()=>{
 const s=start();
 P.record(s,{caseId:'source_sha',status:'PASS',evidenceSha256:SHA,originalSha256:'a'.repeat(64),
  durationMs:1333,itemCountBefore:1,itemCountAfter:2,sourcePreserved:true,ownerGate:true,
  accessToken:'DO-NOT-LEAK',image:'DATA-IMAGE-SHOULD-NOT-LEAK'});
 const privateEvidence=P.privateReport(s),shared=P.publicReport(s),serialized=JSON.stringify(shared);
 assert.equal(privateEvidence.cases.find(x=>x.caseId==='source_sha').originalSha256,'a'.repeat(64));
 assert.equal(privateEvidence.cases.find(x=>x.caseId==='source_sha').durationMs,1333);
 assert.equal(privateEvidence.evidenceClassification,'UNVERIFIED_OPERATOR_CLAIMS_NOT_INDEPENDENT_DEVICE_PROOF');
 assert.equal(shared.counts.PASS,1);assert.equal(shared.releaseStatus,'BLOCKED');
 assert.equal(serialized.includes(SHA),false);assert.equal(serialized.includes('DATA-IMAGE'),false);
 assert.equal(serialized.includes('DO-NOT-LEAK'),false);assert.equal(serialized.includes('Galaxy'),false);
 assert.equal(P.validatePublic(shared),true);
});
test('malformed or forged public phone reports cannot lift HOLD or impersonate another device',()=>{
 const report=P.publicReport(start());
 for(const edited of [
  {...report,releaseStatus:'PASS'},
  {...report,independentlyVerifiedPhysicalRuns:2},
  {...report,counts:{...report.counts,PASS:23}},
  {...report,cases:report.cases.slice(1)},
  {...report,secretOwner:'owner@example.com'},
  {...report,cases:report.cases.map((c,i)=>i?c:{...c,image:'private.jpeg'})}
 ])assert.throws(()=>P.validatePublic(edited),/P78_/);
 assert.throws(()=>P.releaseGate([{...report,releaseStatus:'PASS'}]),/P78_/);
});
test('case status cannot be invented and time/range errors fail closed',()=>{
 const s=start();
 assert.throws(()=>P.record(s,{caseId:'unknown',status:'PASS',evidenceSha256:SHA}),/INVALID_CASE/);
 assert.throws(()=>P.record(s,{caseId:'capture_camera',status:'FORGED',evidenceSha256:SHA}),/INVALID_CASE/);
 assert.throws(()=>P.record(s,{caseId:'capture_camera',status:'PASS',evidenceSha256:SHA,
   observedAt:'1999-01-01T00:00:00Z'}),/DATE_OUT_OF_RANGE/);
 const x=P.record(s,{caseId:'capture_camera',status:'PASS',evidenceSha256:SHA,
   originalSha256:'a'.repeat(64),sourcePreserved:true,durationMs:9999999,itemCountAfter:Infinity});
 assert.equal(x.durationMs,null);assert.equal(x.itemCountAfter,null);
});
test('live session isolates photo bytes, EXIF and filename; hashing is explicit opt-in',async()=>{
 const bytes=Uint8Array.from([255,216,255,224,0,5,0,0,255,217]);
 const fakeFile={name:'home-address-and-secret.jpg',size:bytes.length,type:'image/jpeg',
  arrayBuffer:async()=>bytes.buffer};
 const receipt=await P.hashPrivateFile(fakeFile,{jpegOnly:true});
 assert.match(receipt.sha256,/^[a-f0-9]{64}$/);
 assert.equal(receipt.bytes,bytes.length);assert.equal(JSON.stringify(receipt).includes('home-address'),false);
 assert.equal(Object.hasOwn(receipt,'image'),false);
 const bad=Uint8Array.from([1,2,3,4,5,6,7]);
 await assert.rejects(P.hashPrivateFile({size:bad.length,arrayBuffer:async()=>bad.buffer},{jpegOnly:true}),/ORIGINAL_JPEG_REQUIRED/);
 await assert.rejects(P.hashPrivateFile({size:21*1024*1024,arrayBuffer:async()=>bytes.buffer}),/FILE_UNAVAILABLE_OR_TOO_LARGE/);
});
test('version, device metadata and input fields are bounded to safe categorical values',()=>{
 assert.throws(()=>P.create({sourceCommit:'not-a-commit'}),/COMMIT_REQUIRED/);
 const s=start({modelFamily:'hidden-email@example.com',osVersion:'secret',browserVersion:'secret',
  network:'home wifi name',cache:'unknown',pixelRatio:100,viewportWidth:99999});
 assert.equal(s.modelFamily,'Unknown');assert.equal(s.osVersion,'unknown');
 assert.equal(s.browserVersion,'unknown');assert.equal(s.pixelRatio,null);
 assert.equal(s.viewportWidth,null);assert.equal(s.network,'unknown');
 const p=P.publicReport(s);assert.equal(JSON.stringify(p).includes('hidden-email'),false);
});
test('baseline and P843–P850 tests are scenario-separated and all classifications remain NOT_RUN without hardware',()=>{
 const ids=P.CASES.map(c=>c[0]);assert.equal(new Set(ids).size,ids.length);
 for(const id of ['source_sha','owner_review_843','repeat_save_844','photo_advice_845','shoe_pair_846',
  'learning_847','color_848','duplicate_849','review_queue_850','private_owner','quota_recovery'])
  assert.ok(ids.includes(id),id);
 const s=start();P.record(s,{caseId:'background_resume',status:'BLOCKED'});
 assert.equal(P.publicReport(s).counts.BLOCKED,1);
 assert.equal(P.publicReport(s).counts.NOT_RUN,ids.length-1);
 assert.equal(P.releaseGate([P.publicReport(s)],{independentlyReviewedPairs:0,cloudOwnerIsolationVerified:false}).status,'BLOCKED');
});

test('PASS claims reject severity contradictions, missing source proof, and missing owner approval',()=>{
 const s=start();
 assert.throws(()=>P.record(s,{caseId:'gallery_import',status:'PASS',evidenceSha256:SHA}),/SOURCE_VERIFICATION_REQUIRED/);
 assert.throws(()=>P.record(s,{caseId:'owner_review_843',status:'PASS',evidenceSha256:SHA}),/OWNER_GATE_REQUIRED/);
 assert.throws(()=>P.record(s,{caseId:'owner_review_843',status:'PASS',evidenceSha256:SHA,ownerGate:false}),/CONTRADICTORY_PASS/);
 assert.throws(()=>P.record(s,{caseId:'gallery_import',status:'PASS',evidenceSha256:SHA,
  sourcePreserved:true,originalSha256:'a'.repeat(64),severity:'P0'}),/CONTRADICTORY_PASS/);
 assert.throws(()=>P.record(s,{caseId:'capture_camera',status:'BLOCKED',severity:'DO-NOT-INJECT'}),/INVALID_SEVERITY/);
 assert.equal(P.publicReport(s).counts.NOT_RUN,23);
 const approved=P.record(s,{caseId:'owner_review_843',status:'PASS',ownerGate:true,
  severity:'NONE',evidenceSha256:SHA,itemCountBefore:2,itemCountAfter:3});
 assert.equal(approved.severity,'NONE');assert.equal(approved.itemCountAfter,3);
 assert.equal(P.publicReport(s).counts.PASS,1);
 assert.equal(P.publicReport(s).releaseStatus,'BLOCKED');
});
test('battery, charging, model cache and network remain private categorical metadata',()=>{
 const s=start({battery:'21-50',charging:'not-charging',memoryTier:'low',network:'limited',cache:'cold'});
 const p=P.privateReport(s);
 assert.deepEqual([p.device.battery,p.device.charging,p.device.memoryTier,p.device.network,p.device.cache],
  ['21-50','not-charging','low','limited','cold']);
 const share=JSON.stringify(P.publicReport(s));
 assert.ok(!share.includes('21-50'));assert.ok(!share.includes('not-charging'));
 assert.ok(!share.includes('"limited"'));assert.ok(!share.includes('"cold"'));
});
