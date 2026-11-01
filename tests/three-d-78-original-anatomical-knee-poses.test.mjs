import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {setTrueDenimKneePose78,auditSourcePhotoDenimAlternativeKneePose78,
 KNEE_RESEARCH_POSES78} from '../research/three-d-78/genuine-skinned-denim-knee-poses.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';

test('3D78 includes real original source and bounded anatomical left/right/both bent-knee research poses',()=>{
 assert.deepEqual(KNEE_RESEARCH_POSES78,['source','left-12','right-12','both-16']);
 assert.throws(()=>setTrueDenimKneePose78({},null,'left-25'),/only approved/);
 assert.throws(()=>auditSourcePhotoDenimAlternativeKneePose78(null,{}, {pose:'simulated'}),/unsupported/);
 assert.throws(()=>auditSourcePhotoDenimAlternativeKneePose78(null,new T.Group(),{pose:'left-12'}),/verified source 3D77/);
});
test('3D78 must fail closed on unreviewed fake photographic cloth and source rigs',()=>{
 const root=new T.Group();
 const garment={meshes:[{skeleton:{bones:new Array(163)}}],stats:{
  auditedTrueSkinnedBodyToSourcePhotoDenim77:true,
  originalPhotoUVRestFrontSkinPositionsBytePreserved77:true,landmarks:[
   {knee:[.11,.61,0]},{knee:[-.11,.61,0]}
  ]}};
 assert.throws(()=>setTrueDenimKneePose78(root,garment,'left-12'),/no verified lower-leg bones|original 163-bone|original source/);
 assert.throws(()=>createOutfitController({},{
  photoDenimKneePose78:true,photoDenimContactAudit77:false,photoDenimContinuity76:true,
  photoDenimFolds75:true,photoDenimCalfHang74:true,photoDenimRearDrape73:true
 }),/3D78 actual bone-bent denim contact requires/);
});
test('3D78 source/photo and figure pose truth: bone transforms not fake rendered images',()=>{
 const s=readFileSync(new URL('../research/three-d-78/genuine-skinned-denim-knee-poses.mjs',import.meta.url),'utf8');
 for(const key of ['setFashionPose(root,','root.updateMatrixWorld(true)',
  'o.skeleton.update()','auditTrueSkinnedPhotographedDenimContact77',
  'realKneeSkinnedBodyToDenimCrossings78:count',
  'originalPhotoCoordinatesPreserved78:true','poseResearchAssessment78:count?',
  'humanPhotorealismApproved78:false','sweptCollisionCertified78:false',
  'dynamicFabricPhysicsCertified78:false','physicalAndroidIphoneVerified78:false'])
  assert.ok(s.includes(key),key);
 assert.doesNotMatch(s,/toDataURL|Blob|fetch\(|createElement|copyTextureToTexture|upload|localStorage/);
 const c=readFileSync(new URL('../research/three-d-15/outfit-controller.mjs',import.meta.url),'utf8');
 const h=readFileSync(new URL('../research/three-d-15/showroom.mjs',import.meta.url),'utf8');
 const d=readFileSync(new URL('../research/three-d-69/index-to-real-garment-demo.mjs',import.meta.url),'utf8');
 assert.match(c,/photoDenimKneePose78=false/);
 assert.match(c,/auditSourcePhotoDenimAlternativeKneePose78/);
 assert.match(h,/photoDenimKneePose78=false/);
 assert.match(d,/cc78KneePose/);
 assert.match(d,/get\('knee78'\)==='on'/);
});
