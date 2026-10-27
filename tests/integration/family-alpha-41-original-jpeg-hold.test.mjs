import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {OUTPUT,assert41HOLD}
 from '../../scripts/build-family-alpha-41-original-jpeg-hold.mjs';
test('existing complete owner-scoped style preview preserves ONLY replaced JPEG importer',async()=>{
 const report=await assert41HOLD();
 assert.equal(report.releaseGate,'HOLD');
 assert.equal(report.changedAsset,'photo-import.js');
 assert.equal(report.originalJpegPreservedOnlyIfMetadataFree,true);
 assert.equal(report.metadataBearingOriginalIsReencoded,true);
 assert.equal(report.deployed,false);
 assert.equal(report.ownerVisualApproved,false);
 const s=await readFile(OUTPUT+'/photo-import.js','utf8');
 assert.match(s,/plainOriginalJPEG/);
 assert.match(s,/file.size<=4\*1024\*1024/);
 assert.match(s,/const scale=Math.min\(1,maxDimension/);
 assert.match(s,/marker===0xfe/);
});
test('no claim of staging activation, accepting EXIF or owner visual approval',async()=>{
 const path=OUTPUT+'/alpha41-original-jpeg-HOLD-manifest.json';
 const raw=await readFile(path,'utf8');
 try{
  for(const [key,value]of [
   ['releaseGate','READY'],['deployed',true],['ownerVisualApproved',true],
   ['originalExifMayPassThrough',true],['familyPrivacyVerified',true],
   ['liveCameraVerified',true],['automaticRetakeDeletion',true]
  ]){
   const modified=JSON.parse(raw);modified[key]=value;
   await writeFile(path,JSON.stringify(modified));
   await assert.rejects(()=>assert41HOLD());
  }
 }finally{await writeFile(path,raw);}
 await assert41HOLD();
});
