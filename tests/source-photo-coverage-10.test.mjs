import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifySourcePhotoView10,ORIGINAL_PHOTO_COVERAGE10} from '../research/denim-fit-06/source-photo-coverage-10.mjs';

test('F10 a single genuine front JPEG never licenses invented side/rear photographs',()=>{
 assert.equal(ORIGINAL_PHOTO_COVERAGE10.frontPhotoProvided,true);
 assert.equal(ORIGINAL_PHOTO_COVERAGE10.sidePhotoProvided,false);
 assert.equal(ORIGINAL_PHOTO_COVERAGE10.rearPhotoProvided,false);
 assert.equal(ORIGINAL_PHOTO_COVERAGE10.fullyPhotographed360,false);
 for(const angle of [0,5,45,90,135,180,225,270,315,360,-45,720]){
  const p=classifySourcePhotoView10(angle);
  assert.equal(p.rearPhotoProvided,false);
  assert.equal(p.sidePhotoProvided,false);
  assert.equal(p.photorealistic360Certified,false);
  assert.equal(p.releaseAuthorized,false);
  assert.match(p.explanation,/photo|photograph/i);
 }
 assert.equal(classifySourcePhotoView10(0).viewClass,'front-photo');
 assert.equal(classifySourcePhotoView10(360).viewClass,'front-photo');
 assert.equal(classifySourcePhotoView10(45).viewClass,'mixed-photo-and-model');
 assert.equal(classifySourcePhotoView10(90).viewClass,'mixed-photo-and-model');
 assert.equal(classifySourcePhotoView10(135).viewClass,'mixed-photo-and-model');
 assert.equal(classifySourcePhotoView10(180).viewClass,'unphotographed-rear');
 assert.equal(classifySourcePhotoView10(270).viewClass,'mixed-photo-and-model');
 for(const x of [NaN,Infinity,-Infinity])assert.throws(()=>classifySourcePhotoView10(x),/Finite/);
});
test('F10 source provenance must be visible on real 163-bone research camera and wiped on logout/fallback',()=>{
 const ui=readFileSync('research/fabric-sweep-04/index.html','utf8'),
  room=readFileSync('research/fabric-sweep-04/dress-mobile-showroom.mjs','utf8'),
  app=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8'),
  qa=readFileSync('scripts/test-fabric-sweep-04-browser.mjs','utf8');
 for(const str of ['id="photoCoverage"','role="status"','aria-live="polite"','data-visible="false"'])
  assert.ok(ui.includes(str),str);
 for(const str of ['onViewChange=()=>{}',"controls.addEventListener('change'","onViewChange(viewAngleFromCamera(camera,controls.target))"])
  assert.ok(room.includes(str),str);
 for(const str of ['classifySourcePhotoView10(degrees)','sourcePhotoCoverageVisible:',
  'verifiedOriginalRearPhotograph:false',"label.dataset.visible='false'",
  "label.dataset.rearPhotoVerified='false'",'selectedBottom?.sourceSHA256===sha?.bottom',
  'selectedTop?.sourceSHA256===sha?.dress','onViewChange:angle=>updatePhotoCoverage10(angle)',
  'updatePhotoCoverage10(app.getState().viewAngle??angle)'])
  assert.ok(app.includes(str),str);
 for(const str of ["'#photoCoverage'","'unphotographed-rear'","sourcePhotoCoverageVisible,false"])
  assert.ok(qa.includes(str),str);
 assert.doesNotMatch(app,/supabase\.auth|localStorage\.setItem\(/);
});
