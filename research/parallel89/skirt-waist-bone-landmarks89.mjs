/**
 * Independent P89 original 163-bone public anatomical joint/waist source
 * evidence. The source original MakeHuman GLB has no bone literally called
 * pelvis; P541 dress fallback and original P89 skirt bind to spine04. This
 * research derives public rig source joint vertical landmarks only and NEVER
 * manufactures a pelvis or asserts physical waist fit. No raw avatar vertices,
 * owner data, original source RGB, reverse cloth or joint x/z exported.
 */
import * as THREE from 'three';
const code=reason=>Object.freeze({
 schema:'P89-public-anatomical-waist-bone-attachment-audit/v1',
 status:'ORIGINAL_RIG_WAIST_SOURCE_NOT_VERIFIED',reason,
 originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,releaseAuthorized:false,
 familyAlpha:'HOLD'
});
const finite=n=>Number.isFinite(n);
const round=n=>Math.round(n*10000)/10000;
export function auditOriginalSkirtWaistBoneAttachment89({root,skirt,avatar}={}){
 if(!root?.isObject3D||!skirt?.isSkinnedMesh||
  skirt.skeleton?.bones.length!==163||!['female','male'].includes(avatar))
  return code('actual-source-163bone-skirt-required');
 const position=skirt.geometry?.getAttribute('sourceSkirt89Rest'),
  original=skirt.geometry?.getAttribute('position');
 if(position?.count!==343||original?.count!==343)
  return code('original-public-skirt-photo-source-343-rest-required');
 try{
  root.updateWorldMatrix(true,true);
  const indexed=skirt.skeleton.bones.map((bone,i)=>({
    sourceBoneIndex:i,name:bone.name.replaceAll('.',''),
    y:bone.getWorldPosition(new THREE.Vector3()).y
  }));
  if(indexed.length!==163||indexed.some(v=>!finite(v.y)||v.y<-.5||v.y>3.5))
   throw Error('original-source-joint-heights-outside-real-body-range');
  const candidates=indexed.filter(x=>
   /^(spine\d{1,2}|pelvis|hips?|root|upperleg[\da-z]*|thigh[\da-z]*)$/i.test(x.name));
  const spine04=indexed.find(x=>x.name==='spine04');
  if(!spine04||candidates.length<3||candidates.length>48||
    candidates.filter(x=>/^spine\d/i.test(x.name)).length<2)
   throw Error('original-public-bone-waist-anchor-not-supported');
  const upperRimY=Array.from({length:49},(_,i)=>position.getY(i));
  const max=Math.max(...upperRimY),min=Math.min(...upperRimY);
  if(!finite(max)||!finite(min)||max-min>.015||max<.5||max>2.3)
   throw Error('original-photo-skirt-waist-rim-height-not-consistent');
  const waistY=upperRimY.reduce((a,b)=>a+b,0)/49;
  const ordered=candidates.map(c=>Object.freeze({
   sourceOriginalBoneName:c.name,sourceOriginalBoneIndex:c.sourceBoneIndex,
   sourceVerticalHeightMeters:round(c.y),
   differenceBelowOriginalPhotoSkirtTopMeters:round(waistY-c.y)
  })).sort((a,b)=>b.sourceVerticalHeightMeters-a.sourceVerticalHeightMeters);
  const nearest=ordered.slice().sort((a,b)=>
   Math.abs(a.differenceBelowOriginalPhotoSkirtTopMeters)-
   Math.abs(b.differenceBelowOriginalPhotoSkirtTopMeters)).slice(0,5);
  return Object.freeze({
   schema:'P89-public-anatomical-waist-bone-attachment-audit/v1',
   status:'ORIGINAL_SOURCE_RIG_WAIST_ANCHOR_VERTICAL_LANDMARKS_MEASURED_NOT_FIT',
   avatar,sourceId:'commons-0043',boneCount:163,
   actualOriginalWaistBinding:'spine04',trueNamedPelvisExists:indexed.some(x=>x.name==='pelvis'),
   originalSourceWaistRimVerticalHeightMeters:round(waistY),
   originalSourceSpine04VerticalHeightMeters:round(spine04.y),
   originalWaistRimAndSpine04HeightMismatchMeters:round(waistY-spine04.y),
   originalPublicBodyJointHeightCandidates:ordered,
   nearestObservedNamedOriginalRigLandmarks:nearest,
   originalRootXAndZAndVerticesNotExported:true,
   independentPhysicalWaistMeasurementExists:false,
   sourcePhotoBackSideObserved:false,
   relativeJointVerticalHeightIsNotAClothingFitApproval:true,
   originalSourceGarmentUVAndRigUnmodified:true,
   originalPhoto2DFallbackRequired:true,
   continuousBodyContactSafe:false,
   ownerApproved:false,consumer3DAdmitted:false,releaseAuthorized:false,
   familyAlpha:'HOLD'
  });
 }catch(e){
  const errs=new Set(['original-source-joint-heights-outside-real-body-range',
   'original-public-bone-waist-anchor-not-supported',
   'original-photo-skirt-waist-rim-height-not-consistent']);
  return code(errs.has(e.message)?e.message:
   'original-skeletal-waist-landmarks-not-reproducible');
 }
}
