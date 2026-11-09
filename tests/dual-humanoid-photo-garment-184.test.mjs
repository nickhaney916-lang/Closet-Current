import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {P184_STAGES,P184_WIDTHS,verifyDualGarmentScreens184}
 from '../research/dual-humanoid-photo-garment-184/evidence.mjs';

const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const fixture=engine=>{
 const cache=new Map(),screens=[];
 for(const width of P184_WIDTHS)for(const stage of P184_STAGES){
  const name=engine+'-'+width+'-'+stage+'.png';
  // Synthetic image bytes are ONLY for verifier unit tests; CI audits ACTUAL
  // screenshots captured by the native 163-bone browser, never these bytes.
  const bytes=Buffer.alloc(5000,(screens.length*13+41)%256);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);
  bytes.writeUInt32BE(13,8);bytes.write('IHDR',12);
  bytes.writeUInt32BE(width,16);bytes.writeUInt32BE(920,20);
  const sha256=createHash('sha256').update(bytes).digest('hex');
  cache.set(name,bytes);screens.push({name,stage,width,sha256});
 }
 const evidence=P184_WIDTHS.map(width=>({
  width,source:'commons-0016',sourceSHA256:SOURCE,
  authenticOwnerSavedOutfit:true,actualOriginalPhotoNative163BoneWebGL:true,
  femaleAndMaleRendered:true,bothHumanoidFrontSideRearCaptured:true,
  bothRearViewsInferredNotPhotographed:true,physicalMaskDerivedDeformation:true,
  physicalPhotoSilhouetteVertices62:51881,physicalPhotoSilhouetteMaxMeters62:.0205,
  originalPhotoFallbackRetained:true,inferredRearDisclosed:true,outfitUnmodified:true,
  provisionalCutoutNeedsHumanReview:true,ownerApprovalForArbitraryPhotos:false,
  photorealismAccepted:false,physicalPhoneVerified:false,familyAlpha:'HOLD'
 }));
 const record={priority:'USER-PHOTO-TO-ANATOMICAL-3D-62',
  browser:engine,realWebGL:true,realSignedRLS:false,releaseAuthorized:false,
  familyAlpha:'HOLD',physicalPhone:'NOT TESTED',cases:3,widths:[320,390,430],
  screenshots:21,screens,evidence,errors:[],crashes:[]};
 return {record,cache,opts:{root:'/research-evidence',engine,readBytes:path=>{
  const key=path.split('/').at(-1);
  if(!cache.has(key))throw Error('Missing screenshot '+key);
  return cache.get(key);
 }}};
};
test('P184 accepts exactly 3 baseline plus 18 real-garment angles for EACH browser when independently byte/SHA bound',()=>{
 for(const engine of ['chromium','webkit']){
  const x=fixture(engine);
  const proof=verifyDualGarmentScreens184(x.record,x.opts);
  assert.deepEqual({verified:proof.verified,screens:proof.verifiedSHAImages,
   garmentViews:proof.realGarment3DScreens,release:proof.releaseAuthorized},
  {verified:true,screens:21,garmentViews:18,release:false});
 }
});
test('P184 fails closed on one missing female or male side/rear and on swapped viewport stage',()=>{
 const x=fixture('chromium');
 x.record.screens=x.record.screens.slice(1);
 assert.throws(()=>verifyDualGarmentScreens184(x.record,x.opts));
 const y=fixture('webkit');
 y.record.screens[5]={...y.record.screens[5],stage:'03-female-inferred-rear-provisional-blouse'};
 assert.throws(()=>verifyDualGarmentScreens184(y.record,y.opts));
});
test('P184 fails closed if rendered image bytes or source profile changes',()=>{
 const x=fixture('webkit');
 x.cache.get(x.record.screens[2].name)[54]^=1;
 assert.throws(()=>verifyDualGarmentScreens184(x.record,x.opts),/SHA mismatch/);
 const y=fixture('webkit');
 y.record.evidence[1].sourceSHA256='f'.repeat(64);
 assert.throws(()=>verifyDualGarmentScreens184(y.record,y.opts));
});
test('P184 never accepts an owner approval, 10/10 appearance, real JWT or live release asserted by a fixture',()=>{
 for(const mutate of [
  r=>{r.realSignedRLS=true;},
  r=>{r.releaseAuthorized=true;},
  r=>{r.familyAlpha='PASS';},
  r=>{r.evidence[0].photorealismAccepted=true;},
  r=>{r.evidence[0].provisionalCutoutNeedsHumanReview=false;},
  r=>{r.evidence[1].ownerApprovalForArbitraryPhotos=true;},
  r=>{r.evidence[2].bothRearViewsInferredNotPhotographed=false;},
  r=>{r.evidence[2].physicalPhoneVerified=true;}
 ]){
  const x=fixture('chromium');mutate(x.record);
  assert.throws(()=>verifyDualGarmentScreens184(x.record,x.opts));
 }
});
test('P184 original garment source, rig, real figure and private board checks are present in native browser',()=>{
 const s=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const marker of [
  'window.native3D05Bridge.open()',
  'blouseState.silhouetteVertices62>=20',
  "maleProof.state?.figure==='male'",
  'maleProof.state?.photoSourceSilhouette62===true',
  "'06-male-inferred-rear-provisional-blouse'",
  'bothHumanoidFrontSideRearCaptured:true',
  'bothRearViewsInferredNotPhotographed:true',
  'assert.deepEqual(await readBoard(page),ownerOriginal)',
  'screens.length,photoSilhouette62?21:photoTorso173?24:15',
  "screenshots:photoSilhouette62?21:photoTorso173?24:15"
 ])assert.ok(s.includes(marker),marker);
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.ok(bridge.includes('figure:active&&data.viewerReady===true?data.figure||null:null'));
 assert.ok(bridge.includes('attestOriginalPhotoBytes92'));
});
