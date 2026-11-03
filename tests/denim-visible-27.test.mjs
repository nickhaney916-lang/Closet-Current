import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DENIM_VISUAL27,validateDenimEvidence27,compareVisibleDenim27,
 looksLikeDenimBlue27} from '../research/denim-visible-27/source-honest-visual-gate.mjs';
const shas=['a'.repeat(64),'b'.repeat(64)];
const matrix=()=>({
 genuineBeforeAfterWebGLFrames:96,matchedGenuineOriginalDenimPairs:48,
 authenticPhotographedSources:2,mobileBrowserWidths:[320,390,430],
 anatomical163BoneFigures:['female','male'],angles:[0,90,135,180],
 actualSourceRGBNeverChanged:true,independentRearPhotographAvailable:false,
 rearTextileIsModeled:true,physicalAndroidIPhoneTested:false,
 humanPhotorealismApproved:false,productionModified:false,releaseAuthorized:false,
 familyAlpha:'HOLD',errors:[],external:[],
 results:[320,390,430].flatMap(width=>['female','male'].flatMap(rig=>[0,1].flatMap(
 denimIndex=>[0,90,135,180].map(angle=>({
 width,rig,denimIndex,angle,sourceSHA256:shas[denimIndex],owner:'fixture-account-a',
 bones:163,viewClass:angle===180?'unphotographed-rear':'front-or-mixed',
 P23Compiled:true,P25Compiled:true,P26Fitted:true,
 noNewBVHContacts:true,originalFrontPhotoRGBUntouched:true,
 sourceOriginalSHAUVRestSkinPreserved:true,noFabricatedRearPhoto:true,
 neutralSurfaceExplicitlyModeled:true,physicalPhonesTested:false,
 humanPhotorealismApproved:false,productionModified:false,releaseAuthorized:false,
 beforeVisibleDenimPixels:2000,afterVisibleDenimPixels:1999,
 changedOnRealDenimPixels:30
 })))))
});
test('P27 only accepts a full 96-frame real 3D mobile/source evidence matrix',()=>{
 const q=validateDenimEvidence27(matrix());
 assert.equal(q.frames,96);assert.equal(q.comparisons,48);
 assert.equal(q.visualAestheticVerdict,'REVIEW');
 assert.equal(q.releaseAuthorized,false);
});
test('P27 rejects tampered JPEG provenance, duplicate comparisons, missing cases and invented rear',()=>{
 for(const mutate of [
  m=>m.results.pop(),
  m=>m.results[3].angle=0,
  m=>m.results[3].viewClass='verified-photographed-back',
  m=>m.results[0].sourceSHA256='unverified',
  m=>m.results[0].owner='another-user',
  m=>m.results[0].noNewBVHContacts=false,
  m=>m.actualSourceRGBNeverChanged=false,
  m=>m.humanPhotorealismApproved=true,
  m=>m.external.push('https://example.com'),
  m=>m.results[1].changedOnRealDenimPixels=1,
 ]){const m=matrix();mutate(m);assert.throws(()=>validateDenimEvidence27(m),/DENIM27/);}
});
test('P27 measures genuine RGB before/after denim vs non-denim without changing pixels',()=>{
 const w=24,h=26,a=new Uint8Array(w*h*3).fill(235),b=a.slice();
 for(let y=4;y<23;y++)for(let x=5;x<17;x++){
  const i=(y*w+x)*3;a.set([40,95,170],i);b.set([40,95,170],i);
 }
 for(let y=9;y<17;y++)for(let x=8;x<12;x++)b[(y*w+x)*3+2]=183;
 const prior=a.slice();const current=b.slice();
 const report=compareVisibleDenim27(a,b,w,h);
 assert.equal(report.beforeDenimPixels,228);assert.equal(report.afterDenimPixels,228);
 assert.equal(report.changedCommonDenimPixels,32);
 assert.equal(report.fullyVisible,true);assert.equal(report.aestheticVerdict,'REVIEW');
 assert.deepEqual(a,prior);assert.deepEqual(b,current);
 assert.equal(looksLikeDenimBlue27(40,95,170),true);
 assert.equal(looksLikeDenimBlue27(235,235,235),false);
});
test('P27 refuses missing denim, dimension mismatches and fake pixel arrays',()=>{
 assert.throws(()=>compareVisibleDenim27(new Uint8Array(3),new Uint8Array(3),20,20),/DENIM27/);
 const white=new Uint8Array(12*12*3).fill(255);
 assert.throws(()=>compareVisibleDenim27(white,white,12,12),/DENIM27/);
 assert.equal(DENIM_VISUAL27.syntheticRearIsNotPhotography,true);
 assert.equal(DENIM_VISUAL27.humanPhotorealismApproved,false);
});
test('P27 never alters 163-bone mesh, original JPEG, app, database or production',()=>{
 const mod=readFileSync('research/denim-visible-27/source-honest-visual-gate.mjs','utf8');
 for(const unsafe of ['fetch(', 'indexedDB.', 'canvas.toDataURL(', 'texture2D(', 'new THREE.Mesh('])
  assert.equal(mod.includes(unsafe),false);
});
