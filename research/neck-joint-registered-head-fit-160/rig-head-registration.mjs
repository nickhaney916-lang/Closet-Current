/**
 * Closet Current P160 — Conservative, reversible P156 MIT licensed head
 * joint registration against original signed-fixture P541 163-bone body.
 *
 * P157 uses whole-skull bounding boxes, including the nose and scalp. P160
 * checks actual source NECK and HEAD bones in real posed skeletons, then
 * applies a bounded world-space <18 mm correction to the LICENSED HEAD GRAFT
 * transform only, not body bones, user photo garment, original skinned mesh,
 * original head/hair source buffers, original JPEG, or original P157 mask.
 *
 * The recorded correction MUST reduce actual 80→163 neck-joint separation,
 * preserve P159 authenticated original-neck skin overlap and allow full
 * restoration when the figure/owner/viewer changes. This is not cross-rig
 * retargeting or a claim that a realistic human neck weld is complete.
 */
import * as THREE from 'three';
export const HEAD_JOINT_FIT_160=Object.freeze({
 priority:160,exactVerifiedP159Parent:'0e6f8db077b3dd2b1650e300df0d2d7244d29ba0',
 originalSource163BoneGeometryModified:false,
 originalMITLicensedHead80BoneGeometryModified:false,
 ownerPhotographedGarmentGeometryModified:false,
 signedOwnerPhotosOrCutoutsModified:false,
 fullAnatomicalSkeletonRetargetComplete:false,
 visualRealism10of10Approved:false,physicalPhoneApproved:false,
 familyAlpha:'HOLD',releaseAuthorized:false
});
const prior=new WeakMap();
const fail=s=>{const e=Error('JOINT160 '+s);e.code='joint160-research-refused';throw e;};
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const xyzw=v=>[v.x,v.y,v.z];
const get=(o)=>o.getWorldPosition(new THREE.Vector3());
function originalBones(root,source){
 if(!source?.headBone?.isBone)fail('true original 163-bone Head bone missing');
 const head=source.headBone;
 let neck=head.parent;
 while(neck?.isBone&&!/neck/i.test(neck.name||''))neck=neck.parent;
 if(!neck?.isBone){
  const all=[];
  root.traverse(o=>{
   if(o.isBone&&!o.userData?.head157OriginalLicensed&&/neck/i.test(o.name||''))all.push(o);
  });
  if(!all.length)fail('actual original donor neck bone absent');
  const headY=get(head).y;
  all.sort((a,b)=>Math.abs(get(a).y-headY)-Math.abs(get(b).y-headY));
  neck=all[0];
 }
 if(head===neck)fail('invalid original neck and head joint identity');
 return {head,neck};
}
function licensedBones(graft,originalNeck,figure){
 const heads=[],necks=[];
 graft.traverse(o=>{
  if(!o.isBone||!o.userData?.head157OriginalLicensed)return;
  if(/neck/i.test(o.name||''))necks.push(o);
  if(/head/i.test(o.name||''))heads.push(o);
 });
 if(!necks.length||!heads.length)
  fail('actual 80-bone original MIT '+figure+' Neck and Head joints missing');
 const target=get(originalNeck);
 necks.sort((a,b)=>get(a).distanceToSquared(target)-get(b).distanceToSquared(target));
 const neck=necks[0];
 heads.sort((a,b)=>get(a).distanceToSquared(get(neck))-get(b).distanceToSquared(get(neck)));
 const head=heads[0];
 if(head===neck)fail('same joint selected as MIT licensed neck and head');
 return {head,neck,sourceHeads:heads.length,sourceNecks:necks.length};
}
function counts(root){
 let source=0,garments=0,bones=0;
 root.traverse(o=>{
  if(!o.isSkinnedMesh||o.userData?.head157OriginalLicensed)return;
  if(o.userData?.work56Garment)garments++;
  else{source++;bones=Math.max(bones,o.skeleton?.bones?.length||0);}
 });
 if(source<1||garments<1||bones!==163)
  fail('original 163-bone donor or authenticated saved-photo outfit missing');
 return {source,garments,bones};
}
export function clearLicensedHeadJointFit160(root){
 const x=prior.get(root);
 if(!x)return false;
 x.graft.matrix.copy(x.originalGraftMatrix);
 x.graft.matrixAutoUpdate=false;
 x.graft.updateMatrixWorld(true);
 prior.delete(root);
 return true;
}
export function applyLicensedHeadJointFit160(root,figure,context){
 const {source,candidate,graft,skinHarmony158,neckTransition159,mask}=context||{};
 if(!root?.traverse||!['female','male'].includes(figure)||
  source?.maxBones!==163||!source?.headBone?.isBone||
  !graft||graft.name!=='research-licensed-source-head-graft-157'||
  graft.parent!==source.headBone||candidate?.figure!==figure||
  candidate.maxBone!==80||!skinHarmony158?.harmonyApplied||
  neckTransition159?.originalMITHeadSHA256!==candidate.sha256||
  !neckTransition159?.noAdditionalGeometryRequired||
  !mask?.originalBodyOnlyRenderMask)
  fail('original accepted P157 + P158 + P159 163/80-bone private outfit required');
 if(prior.has(root))fail('duplicate active head transform correction');
 const before=counts(root);
 root.updateMatrixWorld(true);
 graft.updateMatrixWorld(true);
 const donor=originalBones(root,source),license=licensedBones(graft,donor.neck,figure);
 const donorNeck=get(donor.neck),sourceNeck=get(license.neck),
  donorHead=get(donor.head),sourceHead=get(license.head);
 const beforeOffset=donorNeck.clone().sub(sourceNeck);
 const beforeDist=beforeOffset.length();
 const donorAxis=donorHead.clone().sub(donorNeck),
   sourceAxis=sourceHead.clone().sub(sourceNeck);
 if(![...xyzw(donorNeck),...xyzw(sourceNeck),beforeDist,
  donorAxis.length(),sourceAxis.length()].every(finite)||
  donorAxis.length()<.018||sourceAxis.length()<.018)
  fail('real original neck-to-head joint anatomy dimensions not finite');
 const axisDot=donorAxis.normalize().dot(sourceAxis.normalize());
 // Incorrect axis orientation can mean a bone-name mismatch. Never rotate an
 // arbitrary licensed source face to force a deceptive joint match.
 if(axisDot<.18||beforeDist>.36)
  fail('actual original source neck/head anatomical orientation incompatible '+
    JSON.stringify({figure,axisDot,beforeDist,donorNeck:xyzw(donorNeck),
      sourceNeck:xyzw(sourceNeck)}));
 const delta=new THREE.Vector3(
  clamp(beforeOffset.x*.24,-.008,.008),
  clamp(beforeOffset.y*.24,-.012,.012),
  clamp(beforeOffset.z*.24,-.012,.012));
 const magnitude=delta.length();
 if(!finite(magnitude)||magnitude<.001||magnitude>.019)
  fail('no measurable source-based neck joint correction or unsafe requested displacement '+
    JSON.stringify({figure,beforeDist,delta:xyzw(delta),axisDot}));
 if(neckTransition159.measuredOriginalNeckOverlapMeters-magnitude<.043)
  fail('source P156 real head skin would lift outside original donor collar overlap');
 const originalGraftMatrix=graft.matrix.clone();
 const start=new THREE.Vector3().setFromMatrixPosition(graft.matrixWorld);
 const inverse=source.headBone.matrixWorld.clone().invert();
 const localMove=start.clone().add(delta).applyMatrix4(inverse)
  .sub(start.clone().applyMatrix4(inverse));
 const corrected=originalGraftMatrix.clone();
 corrected.elements[12]+=localMove.x;
 corrected.elements[13]+=localMove.y;
 corrected.elements[14]+=localMove.z;
 graft.matrixAutoUpdate=false;
 graft.matrix.copy(corrected);
 graft.updateMatrixWorld(true);
 const afterDist=get(donor.neck).distanceTo(get(license.neck));
 const after=counts(root);
 if(afterDist>beforeDist-.0007||after.source!==before.source||
  after.garments!==before.garments||after.bones!==163){
  graft.matrix.copy(originalGraftMatrix);
  graft.updateMatrixWorld(true);
  fail('original source neck distance failed improvement, or wardrobe/rig mutated '+
    JSON.stringify({figure,beforeDist,afterDist,after,before}));
 }
 const moved=get(license.neck).distanceTo(sourceNeck);
 if(Math.abs(moved-magnitude)>.0006){
  graft.matrix.copy(originalGraftMatrix);
  graft.updateMatrixWorld(true);
  fail('original head graft transform not moved by actual safe world vector');
 }
 prior.set(root,{graft,originalGraftMatrix});
 console.info('P160_MEASURED_ORIGINAL_NECK_JOINT_REGISTRATION',
  JSON.stringify({figure,beforeMeters:beforeDist,afterMeters:afterDist,
   movedWorldMeters:magnitude,deltaWorldXYZ:xyzw(delta),
   originalLicensedNeckSkinOverlapMeters:neckTransition159.measuredOriginalNeckOverlapMeters,
   protectedOriginalGarments:after.garments}));
 return Object.freeze({
  figure,priority:160,
  sourceOriginal163BoneRig:163,MITLicensedOriginalHeadRig:80,
  originalMITHeadSHA256:candidate.sha256,
  verifiedP158SkinSourceSHA256:skinHarmony158.sourceP156HeadSHA256,
  sourceOriginalNeckBoneName:donor.neck.name,
  sourceOriginalHeadBoneName:donor.head.name,
  MITOriginalNeckBoneName:license.neck.name,
  MITOriginalHeadBoneName:license.head.name,
  actualNeckJointOffsetBeforeMeters:beforeDist,
  actualNeckJointOffsetAfterMeters:afterDist,
  originalNeckToLicensedNeckAlignmentImprovementMeters:beforeDist-afterDist,
  originalNeckAndHeadAxisDot:axisDot,
  licensedHeadWorldDisplacementMeters:magnitude,
  licensedHeadMoveWorldXYZ:Object.freeze(xyzw(delta)),
  originalP159LicensedSkinOverlapMeters:neckTransition159.measuredOriginalNeckOverlapMeters,
  originalSourceSkinnedBodyMeshesBefore:before.source,
  originalSourceSkinnedBodyMeshesAfter:after.source,
  originalOwnedPhotographedGarmentMeshesBefore:before.garments,
  originalOwnedPhotographedGarmentMeshesAfter:after.garments,
  originalLicensedHeadOriginalGeometryModified:false,
  sourceP541BodyBoneTransformsModified:false,
  savedOriginalOwnerPhotoJPEGOrCutoutModified:false,
  measuredTrueSourceJointAlignmentApplied:true,
  independentlyApprovedHumanFaceNeckAnatomy:false,
  physicalAndroidIphoneAccepted:false,
  released:false,familyAlpha:'HOLD'
 });
}
