import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourcePhotoSignedCalf19} from '../research/denim-fit-06/source-photo-signed-calf-19.mjs';
test('P19 real photo narrow hems pull inward; genuinely flared hems move outward',()=>{
 const narrow=[1,1.02,1.01,1.02,.93];
 const wide=[1,1.03,1.14,1.16,1.19];
 assert.ok(sourcePhotoSignedCalf19(.4,narrow)<-.003);
 assert.ok(sourcePhotoSignedCalf19(.4,wide)>.008);
 assert.equal(sourcePhotoSignedCalf19(0,narrow),0);
 assert.equal(sourcePhotoSignedCalf19(1,wide),0);
 assert.ok(Math.abs(sourcePhotoSignedCalf19(.4,narrow))<=.006);
 assert.ok(sourcePhotoSignedCalf19(.4,wide)<=.0115);
 assert.equal(sourcePhotoSignedCalf19(.4,[1,1,1,1,1]),0);
 for(const bad of [null,[],[1,1,1],[0,1,1,1,1],[1,1,1,1,3],[1,1,NaN,1,1]])
  assert.throws(()=>sourcePhotoSignedCalf19(.4,bad),/P19 requires/);
 for(const phase of [NaN,-.01,1.1])
  assert.throws(()=>sourcePhotoSignedCalf19(phase,[1,1,1,1,1]),/P19 requires/);
});
test('P19 research-only opt-in contract protects P18 heritage and 3D photo source',()=>{
 const src=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 for(const k of ['sourcePhotoSigned19=false','sourcePhotoSigned19&&!sourcePhotoProfile18',
  'sourcePhotoSignedCalf19','sourcePhotoSignedShiftMaxMeters19',
  'originalPhotoFrontUnchanged19:true','unphotographedRearUnchanged19:true'])
  assert.ok(src.includes(k),'missing P19 source guard: '+k);
 const app=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 assert.ok(app.includes("get('denimSigned19')==='after'"));
 assert.ok(app.includes('sourceDenimSigned19Enabled'));
});
