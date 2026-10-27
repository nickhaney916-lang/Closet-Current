import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {patchCameraApp,assert43HOLD,OUTPUT} from '../../scripts/build-family-alpha-43-still-source-hold.mjs';
test('source-pinned full protected preview retains only genuine still resolution and size changes',async()=>{
 const m=await assert43HOLD();
 assert.equal(m.releaseGate,'HOLD');assert.equal(m.manualStillMaxAxis,4096);
 assert.equal(m.autoFrameMaxAxis,2048);assert.equal(m.physicalCameraValidated,false);
 const s=await readFile(OUTPUT+'/app.js','utf8');
 assert.match(s,/for\(const target of \[4096,3072,2560,2048,1536,1024\]\)/);
 assert.match(s,/if\(jpeg.length<=5_600_000\)return jpeg/);
 assert.match(s,/if\(jpeg.length<=2850000\)return jpeg/);
 assert.match(s,/4000\);\}\)/);
 assert.match(s,/createImageBitmap\(blob,\{imageOrientation:'from-image',colorSpaceConversion:'default'\}\)/);
 assert.match(s,/bitmap\.close\?\.\(\)/);
 assert.match(s,/candidate\(snap\(\)\);cadence\.captured\(now\)/);
});
test('malformed original photo camera or automatic cadence source fails closed',()=>{
 assert.throws(()=>patchCameraApp('invalid'),/source changed/);
});
test('false deployment, saved-user photographs, or EXIF bypass must not pass',async()=>{
 const file=OUTPUT+'/alpha43-high-detail-still-HOLD-manifest.json';
 const original=await readFile(file,'utf8');
 try{
  for(const [key,value]of [
   ['releaseGate','READY'],['physicalCameraValidated',true],
   ['deployAuthorized',true],['rawExifPassedThrough',true],
   ['ownerVisualApproved',true],['savedRealFamilyPhotographs',true],
   ['manualStillMaxAxis',8192],['manualStillMaxDataUriLength',30_000_000],
   ['autoFrameMaxAxis',4096]
  ]){
   const m=JSON.parse(original);m[key]=value;
   await writeFile(file,JSON.stringify(m));
   await assert.rejects(()=>assert43HOLD());
  }
 }finally{await writeFile(file,original);}
 await assert43HOLD();
});
