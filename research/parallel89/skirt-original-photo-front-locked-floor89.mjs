/**
 * P89: prove the immutable photographed FRONT's exact indexed-body crossing
 * floor on the real Commons-0043 provisional source skirt and original CC0
 * 163-bone avatar. Rear-only trials cannot remove intersections of triangles
 * whose THREE vertices all belong to the unaltered photographed front.
 *
 * NOT a sewn-fabric reconstruction, closed mesh, physical fit, source-camera
 * calibration, or swept motion proof. All 576 original indexed skirt faces
 * and the FULL original body BVH, including hands, remain in the evidence.
 *
 * This module exports only five-pose aggregate counters; original source
 * body vertices, pair IDs, garment positions or photo data are never returned.
 */
import {snapshotOriginalSkirtBvhContact89}
 from './source-contact-snapshot89.mjs';

const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=Object.freeze(['source','blend-25','blend-50','blend-75','relaxed']);
const fail=reason=>Object.freeze({
 schema:'P89-original-photographed-front-locked-anatomy-contact-floor/v1',
 status:'SOURCE_FRONT_LOCKED_ORIGINAL_CONTACT_PROOF_UNVERIFIABLE',reason,
 originalPhoto2DFallbackRequired:true,originalBodySignedExteriorProven:false,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const same=(a,b)=>a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
const photographedFrontSpoke=j=>j<=12||j>=36;
const rearOnlySpoke=j=>j>=13&&j<=35;
/**
 * Exactly 6 source-alpha vertical bands × 48 ring sectors × 2 triangles.
 * Both triangle variants have the same j,j+1 spoke classification.
 * This function MUST NOT infer observed backs from closed provisional mesh.
 */
export function classifySourcePhotoSkirtIndexedFace89(face){
 if(!Number.isSafeInteger(face)||face<0||face>=576)
  throw Error('original-licensed-skirt-face-identity-out-of-range');
 const band=Math.floor(face/96),spoke=Math.floor((face%96)/2);
 const a=spoke,b=spoke+1;
 return Object.freeze({
  band,
  photoRegion:photographedFrontSpoke(a)&&photographedFrontSpoke(b)?
   'PHOTOGRAPH_FRONT_LOCKED':
   rearOnlySpoke(a)&&rearOnlySpoke(b)?
    'UNPHOTOGRAPHED_REAR_PROVISIONAL':'SOURCE_PHOTO_REAR_TRANSITION'
 });
}
function preservedSource(mesh){
 const g=mesh?.geometry,position=g?.getAttribute('position'),
  rest=g?.getAttribute('sourceSkirt89Rest'),
  uv=g?.getAttribute('uv'),skin=g?.getAttribute('skinIndex'),
  weights=g?.getAttribute('skinWeight'),index=g?.index;
 if(position?.count!==343||rest?.count!==343||uv?.count!==343||
  skin?.count!==343||weights?.count!==343||index?.count!==1728)
  throw Error('authentic-7-band-skirt-indexed-source-required');
 const watched=[position,rest,uv,skin,weights,index].map(a=>[a,a.array.slice()]);
 const si=index.array;
 for(let band=0;band<6;band++)for(let j=0;j<48;j++){
  const p=band*49+j,q=p+49,k=(band*48+j)*6;
  if(si[k]!==p||si[k+1]!==p+1||si[k+2]!==q||
   si[k+3]!==p+1||si[k+4]!==q+1||si[k+5]!==q)
   throw Error('actual-photo-front-source-triangle-identity-mismatch');
 }
 for(let band=0;band<7;band++){
  const i=band*49*3,k=(band*49+48)*3,a=rest.array;
  if(Math.hypot(a[i]-a[k],a[i+1]-a[k+1],a[i+2]-a[k+2])>1e-4)
   throw Error('original-photograph-proposal-front-seam-not-closed');
 }
 return watched;
}
/**
 * Only actual BODY's source-preserving triangle IDs and the genuine 163-bone
 * original pose callback may be supplied by the authenticated native browser.
 * A caller-issued consent, a synthetic source ring, or no-hit ray does not
 * prove a signed fit. A zero original front-floor is NOT consumer approval.
 */
export function auditOriginalPhotoFrontLockedCollisionFloor89({
 mesh,avatar,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
 sourcePhotoCenterlineVerified,originalBodyFaceCount,applyPose,sampleContact
}={}){
 if(!Object.hasOwn(RIG,avatar)||sourcePhotoSHA256!==PHOTO||
  sourceAnatomyGLBSHA256!==RIG[avatar]||
  sourcePhotoCenterlineVerified!==true||
  !mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163||
  !Number.isSafeInteger(originalBodyFaceCount)||
  originalBodyFaceCount<1000||originalBodyFaceCount>500000||
  typeof applyPose!=='function'||typeof sampleContact!=='function')
  return fail('real-source-front-pixel-centerline-rig-and-whole-body-BVH-required');
 const original=mesh.geometry;
 let watched;
 try{
  watched=preservedSource(mesh);
  const zones=Array.from({length:3},()=>0);
  for(let f=0;f<576;f++){
   const zone=classifySourcePhotoSkirtIndexedFace89(f).photoRegion;
   zones[zone==='PHOTOGRAPH_FRONT_LOCKED'?0:
    zone==='UNPHOTOGRAPHED_REAR_PROVISIONAL'?1:2]++;
  }
  if(zones[0]!==288||zones[1]!==264||zones[2]!==24)
   throw Error('original-photo-front-index-partition-mismatched');
  const rows=[];
  let front=0,rear=0,transition=0,all=0;
  for(const pose of POSES){
   applyPose(pose);
   const snapshot=snapshotOriginalSkirtBvhContact89(sampleContact(pose),
    {bodyFaceCount:originalBodyFaceCount});
   if(!snapshot||snapshot.trueOriginalBodyTriangleIndexStable!==true||
    snapshot.trueOriginalSkirtTriangleIndexStable!==true)
    throw Error('true-original-source-body-indexed-pair-receipt-missing');
   let f=0,r=0,t=0;
   for(const key of snapshot.pairs){
    const skirtFace=Number(key.split('|')[0]);
    const zone=classifySourcePhotoSkirtIndexedFace89(skirtFace).photoRegion;
    if(zone==='PHOTOGRAPH_FRONT_LOCKED')f++;
    else if(zone==='UNPHOTOGRAPHED_REAR_PROVISIONAL')r++;
    else t++;
   }
   if(f+r+t!==snapshot.count)throw Error('real-original-contact-pair-zone-count-mismatch');
   for(const [attr,copy] of watched)if(!same(attr.array,copy))
    throw Error('original-source-photo-UV-face-or-rig-buffer-mutated');
   if(mesh.geometry!==original)throw Error('original-source-skirt-geometry-replaced');
   rows.push(Object.freeze({
    pose,originalFull163BoneBodySourceCrossingPairs:snapshot.count,
    photographFrontLockedTriangleCrossings:f,
    unphotographedNeutralRearHypothesisCrossings:r,
    sourceFrontRearTransitionTriangleCrossings:t,
    minimalCrossingsFromUnmodifiedPhotographFront:f,
    sourcePoseBVHIndexedFaceIDsValidated:true
   }));
   front+=f;rear+=r;transition+=t;all+=snapshot.count;
  }
  return Object.freeze({
   schema:'P89-original-photographed-front-locked-anatomy-contact-floor/v1',
   status:front>0?'ORIGINAL_PHOTO_FRONT_LOCKED_COLLISIONS_PREVENT_REAR_ONLY_CLEARANCE':
    'NO_LOCKED_SOURCE_FRONT_COLLISIONS_WITNESSED_NOT_SIGNED_FIT',
   avatar,sourceId:'commons-0043',originalSource163BoneRig:true,
   exactOriginalBodyAllFacesRetainedInBVH:true,
   measuredPhotographFrontCenterlineKeptFixed:true,
   originalSkirtTriangleCount:576,
   photographFrontLockedIndexedFaces:zones[0],
   neutralUnphotographedRearIndexedFaces:zones[1],
   frontRearBoundaryTransitionIndexedFaces:zones[2],
   originalFivePoseNames:POSES,
   originalWholeBodyStrictCrossingsAcrossFivePoses:all,
   immutablePhotographFrontCollisionFloorAcrossFivePoses:front,
   originalNeutralRearHypothesisCrossingsAcrossFivePoses:rear,
   originalSourceTransitionCrossingsAcrossFivePoses:transition,
   rearOnlyFitCannotEliminatePhotographFrontContact:front>0,
   staticOriginalPoseSamples:Object.freeze(rows),
   sourceMaskAndOriginalRGBUntouched:true,originalSourceSkirtAndRigBuffersRestored:true,
   sourceBodyAndSkirtCoordinatesNotExported:true,
   physicalOriginalGarmentDimensionsUnmeasured:true,
   originalBodySignedExteriorProven:false,
   frontPhotographFitAndCameraAngleNotHumanApproved:true,
   rearStillProvisionalNotPhotographed:true,
   noSweptClothOrInterlayerCollisionProven:true,
   originalPhoto2DFallbackRequired:true,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const known=new Set(['authentic-7-band-skirt-indexed-source-required',
   'actual-photo-front-source-triangle-identity-mismatch',
   'original-photograph-proposal-front-seam-not-closed',
   'original-photo-front-index-partition-mismatched',
   'true-original-source-body-indexed-pair-receipt-missing',
   'real-original-contact-pair-zone-count-mismatch',
   'original-source-photo-UV-face-or-rig-buffer-mutated',
   'original-source-skirt-geometry-replaced']);
  return fail(known.has(e?.message)?e.message:
   'original-photo-front-contact-source-evidence-unverifiable');
 }finally{
  try{applyPose('source');}catch{}
 }
}
