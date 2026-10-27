import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {assert42HOLD,OUTPUT,patchApp,patchCheck}
 from '../../scripts/build-family-alpha-42-photo-advice-hold.mjs';
test('full original-photo review and Style New Clothes candidate retains only two scoped advisory assets',async()=>{
 const m=await assert42HOLD();
 assert.equal(m.releaseGate,'HOLD');assert.equal(m.optionalAdviceOnly,true);
 assert.equal(m.originalJpegModified,false);
 assert.equal(m.automaticPhotoDiscard,false);
 assert.equal(m.serverPhotoUpload,false);
 assert.equal(m.autoCaptureCadenceUnchanged,true);
 const a=await readFile(OUTPUT+'/app.js','utf8');
 const check=await readFile(OUTPUT+'/photo-check.js','utf8');
 assert.match(a,/Take a clearer photo/);
 assert.match(a,/retake.onclick=\(\)=>switchView\('scan'\)/);
 assert.match(a,/source:checkedOriginal/);
 assert.match(a,/closet:alpha-session-changed/);
 assert.match(check,/alphaCaptureAdvice\(\{width:decoded.width/);
 assert.match(check,/Optional advice cannot block recognition/);
 assert.match(check,/photoQuality\(pixels\)/);
 assert.match(a,/const quality=await checkPhoto\(checkedOriginal\)/);
});
test('unknown app, photo-check or capture source changes are rejected by source-pinned overlay',async()=>{
 assert.throws(()=>patchApp('foo'),/source drift/i);
 assert.throws(()=>patchCheck('foo','invalid'),/untrusted/i);
});
test('false user release approval, original-photo rewriting or auto-deletion fail closed',async()=>{
 const path=OUTPUT+'/alpha42-photo-advice-HOLD-manifest.json';
 const raw=await readFile(path,'utf8');
 try{
  for(const [field,value]of [
   ['releaseGate','READY'],['optionalAdviceOnly',false],
   ['automaticPhotoDiscard',true],['serverPhotoUpload',true],
   ['originalJpegModified',true],['stagingDeployed',true],
   ['ownerVisualApproved',true],['physicalPhoneApproved',true]
  ]){
   const m=JSON.parse(raw);m[field]=value;
   await writeFile(path,JSON.stringify(m));
   await assert.rejects(()=>assert42HOLD());
  }
 }finally{await writeFile(path,raw);}
 await assert42HOLD();
});
