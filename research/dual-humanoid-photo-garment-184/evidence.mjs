/**
 * MAIN P184 — independently audit REAL Chromium/WebKit original-photo blouse
 * screenshots. Only checks the source-bound browser evidence's integrity:
 * it does NOT certify human photorealism, an owner-approved cutout, physical
 * phones, non-photographed rear texture or release suitability.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

export const P184_WIDTHS=Object.freeze([320,390,430]);
export const P184_STAGES=Object.freeze([
 '01-original-native-builder',
 '01-female-front-provisional-blouse',
 '02-female-side-provisional-blouse',
 '03-female-inferred-rear-provisional-blouse',
 '04-male-front-provisional-blouse',
 '05-male-side-provisional-blouse',
 '06-male-inferred-rear-provisional-blouse'
]);
const sha=b=>createHash('sha256').update(b).digest('hex');
const HEX=/^[a-f0-9]{64}$/;
const PNG=Buffer.from([137,80,78,71,13,10,26,10]);
const SAME_SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
export function verifyDualGarmentScreens184(record,{root,engine,readBytes=readFileSync}={}){
 assert.ok(['chromium','webkit'].includes(engine),'P184 a genuine pinned browser engine required');
 assert.equal(record?.priority,'USER-PHOTO-TO-ANATOMICAL-3D-62');
 assert.equal(record?.browser,engine);
 assert.equal(record?.realWebGL,true);
 assert.equal(record?.realSignedRLS,false);
 assert.equal(record?.releaseAuthorized,false);
 assert.equal(record?.familyAlpha,'HOLD');
 assert.equal(record?.physicalPhone,'NOT TESTED');
 assert.equal(record?.cases,3);
 assert.deepEqual(record?.widths,P184_WIDTHS);
 assert.equal(record?.screenshots,21);
 assert.equal(record?.screens?.length,21);
 assert.equal(record?.evidence?.length,3);
 assert.deepEqual(record?.errors,[]);
 assert.deepEqual(record?.crashes,[]);
 assert.equal(typeof root,'string');
 assert.ok(root.length>1);
 const all=new Set(),digests=new Set(),byWidth=new Map();
 for(const entry of record.screens){
  const width=entry?.width,stage=entry?.stage;
  assert.ok(P184_WIDTHS.includes(width),'P184 known phone CSS width required');
  assert.ok(P184_STAGES.includes(stage),'P184 only actual approved screenshot stages');
  const expected=engine+'-'+width+'-'+stage+'.png';
  assert.equal(entry.name,expected,'P184 exact browser/width/stage screenshot identity');
  assert.match(entry.sha256||'',HEX);
  assert.equal(all.has(expected),false,'P184 screenshot stage replay/duplicate');
  all.add(expected);
  const bytes=readBytes(join(root,expected));
  assert.ok(Buffer.isBuffer(bytes)&&bytes.length>4500);
  assert.ok(bytes.subarray(0,8).equals(PNG),'P184 real PNG signature required');
  assert.equal(bytes.readUInt32BE(16),width,'P184 real encoded screenshot width');
  assert.ok(bytes.readUInt32BE(20)>=880,'P184 real phone viewport height');
  assert.equal(sha(bytes),entry.sha256,'P184 screenshot actual bytes SHA mismatch');
  assert.equal(digests.has(entry.sha256),false,'P184 repeated image is not independent');
  digests.add(entry.sha256);
  if(!byWidth.has(width))byWidth.set(width,new Set());
  byWidth.get(width).add(stage);
 }
 for(const width of P184_WIDTHS){
  const stageSet=byWidth.get(width);
  assert.equal(stageSet?.size,P184_STAGES.length,'P184 all male/female views required at every width');
  for(const stage of P184_STAGES)assert.ok(stageSet.has(stage),stage);
 }
 for(const [i,width] of P184_WIDTHS.entries()){
  const e=record.evidence[i];
  assert.equal(e?.width,width);
  assert.equal(e?.source,'commons-0016');
  assert.equal(e?.sourceSHA256,SAME_SOURCE);
  assert.equal(e?.authenticOwnerSavedOutfit,true);
  assert.equal(e?.actualOriginalPhotoNative163BoneWebGL,true);
  assert.equal(e?.femaleAndMaleRendered,true);
  assert.equal(e?.bothHumanoidFrontSideRearCaptured,true);
  assert.equal(e?.bothRearViewsInferredNotPhotographed,true);
  assert.equal(e?.physicalMaskDerivedDeformation,true);
  assert.ok(Number.isInteger(e.physicalPhotoSilhouetteVertices62)&&
   e.physicalPhotoSilhouetteVertices62>=20);
  assert.ok(Number.isFinite(e.physicalPhotoSilhouetteMaxMeters62)&&
   e.physicalPhotoSilhouetteMaxMeters62>=0.001&&
   e.physicalPhotoSilhouetteMaxMeters62<=0.0251);
  assert.equal(e?.originalPhotoFallbackRetained,true);
  assert.equal(e?.inferredRearDisclosed,true);
  assert.equal(e?.outfitUnmodified,true);
  assert.equal(e?.provisionalCutoutNeedsHumanReview,true);
  assert.equal(e?.ownerApprovalForArbitraryPhotos,false);
  assert.equal(e?.photorealismAccepted,false);
  assert.equal(e?.physicalPhoneVerified,false);
  assert.equal(e?.familyAlpha,'HOLD');
 }
 return Object.freeze({verified:true,engine,widths:3,
  originalBuilderScreens:3,realGarment3DScreens:18,
  bothHumanoidsFrontSideInferredRear:true,verifiedSHAImages:21,
  humanPhotoRealismApproved:false,ownerCutoutReviewCompleted:false,
  physicalDeviceApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
