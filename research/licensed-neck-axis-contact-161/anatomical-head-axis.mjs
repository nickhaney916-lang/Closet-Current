/**
 * Closet Current MAIN #161: measured neutral-pose original P541 163-bone
 * body Neck→Head axis versus licensed genuine MIT P156 80-bone face Neck→Head
 * axis. Unlike the parallel Work camera/orbit QA, this modifies only a single
 * reversible 3D research head attachment matrix under an exact-head source
 * contract; it makes no camera / gesture / viewport source change.
 *
 * Rotation is applied around the ACTUAL MIT neck joint pivot, with no
 * translated-neck loss, no new collar mesh, no body skeleton changes, no
 * original user owned-garment changes, and no source GLB texture edits.
 */
import * as THREE from 'three';
export const HEAD_AXIS_161=Object.freeze({
 priority:161,exactVerifiedP160Parent:'76e4a3ca174564f7ca074bc568cdaa806fe11fdb',
 originalSource163BoneRigUnchanged:true,originalSource80BoneMITRigUnchanged:true,
 originalPhotographedGarmentUnchanged:true,originalOwnerPhotoOrCutoutUnchanged:true,
 parallelWorkOrbitViewNotModified:true,
 originalFaceMITTextureOrHairUnchanged:true,rigsFullyRetargeted:false,
 trueAnatomicalSkinWeldApproved:false,photorealism10of10Approved:false,
 realPhysicalAndroidIphoneAcceptance:false,familyAlpha:'HOLD',releaseAuthorized:false
});
const prior=new WeakMap();
const fail=s=>{const e=Error('AXIS161 '+s);e.code='axis161-research-refused';throw e;};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const world=o=>o.getWorldPosition(new THREE.Vector3());
const degrees=r=>r*180/Math.PI;
const rad=d=>d*Math.PI/180;
function sampleRig(root,source,graft,figure){
 if(!source?.headBone?.isBone||source.maxBones!==163||
  graft?.parent!==source.headBone)
  fail('original owned-outfit 163-bone Head attachment changed');
 root.updateMatrixWorld(true);graft.updateMatrixWorld(true);
 const dHead=source.headBone;
 let dNeck=dHead.parent;
 while(dNeck?.isBone&&!/neck/i.test(dNeck.name||''))dNeck=dNeck.parent;
 if(!dNeck?.isBone){
  const all=[];
  root.traverse(o=>{
   if(o.isBone&&!o.userData?.head157OriginalLicensed&&/neck/i.test(o.name||''))
    all.push(o);
  });
  if(!all.length)fail('original P541 source neck bone absent');
  const targetY=world(dHead).y;
  all.sort((a,b)=>Math.abs(world(a).y-targetY)-Math.abs(world(b).y-targetY));
  dNeck=all[0];
 }
 const donorNeck=world(dNeck),licNecks=[],licHeads=[];
 graft.traverse(o=>{
  if(!o.isBone||!o.userData?.head157OriginalLicensed)return;
  if(/neck/i.test(o.name||''))licNecks.push(o);
  if(/head/i.test(o.name||''))licHeads.push(o);
 });
 if(!licNecks.length||!licHeads.length)fail('real MIT 80-bone head/neck joints absent');
 licNecks.sort((a,b)=>world(a).distanceToSquared(donorNeck)-world(b).distanceToSquared(donorNeck));
 const lNeck=licNecks[0];
 licHeads.sort((a,b)=>world(a).distanceToSquared(world(lNeck))-world(b).distanceToSquared(world(lNeck)));
 const lHead=licHeads[0];
 if(lNeck===lHead||dNeck===dHead)fail('invalid original head/neck identity');
 const dn=world(dNeck),dh=world(dHead),ln=world(lNeck),lh=world(lHead);
 const va=dh.sub(dn).normalize(),vb=lh.sub(ln).normalize();
 if(![...va.toArray(),...vb.toArray()].every(finite)||
  va.lengthSq()<.99||vb.lengthSq()<.99)
  fail('original 163-to-80 real bone axis vector invalid');
 return {dNeck,dHead,lNeck,lHead,donorDirection:va,licensedDirection:vb,
  sourceRigBones:163,licensedRigBones:80,figure};
}
function originalLicensedSkinMinimum(graft,figure){
 const face=figure==='female'?'f007_head':'m006_head';
 const pos=new THREE.Vector3();let vertices=0,min=Infinity,max=-Infinity,bones=0;
 graft.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  const materials=Array.isArray(o.material)?o.material:[o.material];
  if(!materials.some(m=>m?.name===face))return;
  if(!o.skeleton||typeof o.applyBoneTransform!=='function'||
   !o.geometry?.attributes?.position)
   fail('exact original MIT face-only skinned source missing');
  o.skeleton.update();o.updateWorldMatrix(true,false);
  bones=Math.max(bones,o.skeleton.bones.length);
  const positions=o.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
   const v=o.applyBoneTransform(i,pos.fromBufferAttribute(positions,i)).applyMatrix4(o.matrixWorld);
   if(!finite(v.y))fail('original licensed head surface became non-finite');
   min=Math.min(min,v.y);max=Math.max(max,v.y);vertices++;
  }
 });
 if(bones!==80||vertices<500||!finite(min)||!finite(max))
  fail('original MIT 80-bone actual skin source not preserved');
 return {min,max,vertices};
}
function originalOutfit(root){
 let garments=0,body=0,max=0;
 root.traverse(o=>{
  if(!o.isSkinnedMesh||o.userData?.head157OriginalLicensed)return;
  if(o.userData?.work56Garment)garments++;
  else{body++;max=Math.max(max,o.skeleton?.bones?.length||0);}
 });
 if(garments<1||body<1||max!==163)fail('original user source clothes/163 body unavailable');
 return {garments,body,max};
}
export function clearOriginalHeadAxisFit161(root){
 const old=prior.get(root);
 if(!old)return false;
 old.graft.matrixAutoUpdate=false;
 old.graft.matrix.copy(old.original);
 old.graft.updateMatrixWorld(true);
 prior.delete(root);
 return true;
}
export function applyOriginalHeadAxisFit161(root,figure,context){
 const {source,candidate,graft,headJointFit160,neckTransition159,skinHarmony158,mask}=context||{};
 if(!root?.traverse||!['female','male'].includes(figure)||
  !source?.headBone?.isBone||source?.maxBones!==163||
  !candidate?.sha256||candidate?.figure!==figure||candidate.maxBone!==80||
  !graft||graft.name!=='research-licensed-source-head-graft-157'||
  !headJointFit160?.measuredTrueSourceJointAlignmentApplied||
  headJointFit160.originalMITHeadSHA256!==candidate.sha256||
  !neckTransition159?.noAdditionalGeometryRequired||
  !skinHarmony158?.harmonyApplied||!mask?.originalBodyOnlyRenderMask)
  fail('original verified P157/P158/P159/P160 head-on-owned-outfit contract missing');
 if(prior.has(root))fail('duplicate active P161 axis adjustment');
 const before=originalOutfit(root),p=sampleRig(root,source,graft,figure);
 const originalMatrix=graft.matrix.clone(),originalSourceSkin=originalLicensedSkinMinimum(graft,figure);
 const beforeAngle=degrees(Math.acos(clamp(
  p.donorDirection.dot(p.licensedDirection),-1,1)));
 if(!finite(beforeAngle)||beforeAngle>89)
  fail('original pose source 80/163 bone axis angle invalid');
 // Correction depends strictly on measured actual orientation and uses the
 // P160 registered licensed Neck joint as pivot, so no fake chin translation.
 // When already naturally aligned to <=0.65 degree, preserve the exact source
 // head/face pixels rather than changing them for a fabricated "improvement".
 const MAX_CORRECTION_DEGREES=3.0;
 const safe=beforeAngle<=38;
 const shouldRotate=beforeAngle>.65&&safe;
 let angleApplied=0,afterAngle=beforeAngle,pivotDisplacement=0,sourceOverlapAfter=0;
 if(shouldRotate){
  const fraction=Math.min(1,MAX_CORRECTION_DEGREES/beforeAngle)*.85;
  const q=new THREE.Quaternion().setFromUnitVectors(
   p.licensedDirection,p.donorDirection);
  const qBounded=new THREE.Quaternion().slerp(q,fraction);
  angleApplied=degrees(2*Math.acos(clamp(qBounded.w,-1,1)));
  if(!(angleApplied>.2&&angleApplied<=MAX_CORRECTION_DEGREES+.001))
   fail('bounded real Neck-to-Head axis rotation did not meaningfully register');
  const originalWorld=graft.matrixWorld.clone(),pivot=world(p.lNeck);
  const startPivot=pivot.clone();
  const newWorld=new THREE.Matrix4()
   .makeTranslation(pivot.x,pivot.y,pivot.z)
   .multiply(new THREE.Matrix4().makeRotationFromQuaternion(qBounded))
   .multiply(new THREE.Matrix4().makeTranslation(-pivot.x,-pivot.y,-pivot.z))
   .multiply(originalWorld);
  const local=source.headBone.matrixWorld.clone().invert().multiply(newWorld);
  if(!local.elements.every(finite))fail('transformed original MIT source matrix not finite');
  graft.matrixAutoUpdate=false;
  graft.matrix.copy(local);
  graft.updateMatrixWorld(true);
  const updated=sampleRig(root,source,graft,figure);
  afterAngle=degrees(Math.acos(clamp(updated.donorDirection.dot(updated.licensedDirection),-1,1)));
  pivotDisplacement=world(updated.lNeck).distanceTo(startPivot);
  const afterSourceSkin=originalLicensedSkinMinimum(graft,figure);
  sourceOverlapAfter=mask.cutoff-afterSourceSkin.min;
  const afterOutfit=originalOutfit(root);
  if(afterAngle>=beforeAngle-.2||beforeAngle-afterAngle>MAX_CORRECTION_DEGREES+.01||
   pivotDisplacement>.00055||sourceOverlapAfter<.042||
   afterOutfit.garments!==before.garments||afterOutfit.body!==before.body||
   afterOutfit.max!==163){
    graft.matrix.copy(originalMatrix);graft.updateMatrixWorld(true);
    fail('source P156 real pose axis correction harmed original neck/collar/wardrobe '+
     JSON.stringify({figure,beforeAngle,afterAngle,pivotDisplacement,sourceOverlapAfter}));
  }
  prior.set(root,{graft,original:originalMatrix});
 }else{
  sourceOverlapAfter=mask.cutoff-originalSourceSkin.min;
  if(sourceOverlapAfter<.042)
   fail('original licensed neck skin no longer safely overlaps original body');
  console.info('P161_ORIGINAL_SOURCE_HEAD_AXIS_PRESERVED',
   JSON.stringify({figure,actualAxisDeg:beforeAngle,
    reason:safe?'ALREADY_AXIS_ALIGNED':'ORIGINAL_SOURCE_AXIS_OUTSIDE_SAFE_38_DEG_ENVELOPE',
    originalLicensedNeckSkinOverlapMeters:sourceOverlapAfter}));
 }
 const after=originalOutfit(root);
 if(before.garments!==after.garments||before.body!==after.body)
  fail('original owner photo wardrobe changed during neck axis evaluation');
 const result=Object.freeze({
  figure,priority:161,originalP156MITHeadSHA256:candidate.sha256,
  originalSourceRigBones:163,actualLicensedMITHeadRigBones:80,
  originalSourceNeckBoneName:p.dNeck.name,originalSourceHeadBoneName:p.dHead.name,
  originalMITNeckBoneName:p.lNeck.name,originalMITHeadBoneName:p.lHead.name,
  originalOriginalNeckToHeadAxisAngleDegrees:beforeAngle,
  measuredFinalNeckToHeadAxisAngleDegrees:afterAngle,
  actualAxisCorrectionDegrees:angleApplied,
  originalLicensedNeckJointMovementMeters:pivotDisplacement,
  originalLicensedNeckSkinOverlapMeters:sourceOverlapAfter,
  realOriginalHeadNeckAxisAligned:shouldRotate&&afterAngle<beforeAngle-.2,
  originalSourceAxisAlreadyAligned:!shouldRotate&&beforeAngle<=.65,
  unsafeOriginalAxisCorrectionAvoided:!shouldRotate&&beforeAngle>38,
  originalPhotographedGarmentMeshesBefore:before.garments,
  originalPhotographedGarmentMeshesAfter:after.garments,
  original163BoneSourceBodyMeshesBefore:before.body,
  original163BoneSourceBodyMeshesAfter:after.body,
  originalHeadAndBodyOrGarmentGeometryModified:false,
  originalOwnerJPEGOrCutoutModified:false,
  originalMITFaceHairTextureModified:false,
  sourcePhotoOnlyFallbackPreserved:true,
  true80To163SkeletonRetargetApproved:false,realPhysicalPhoneApproved:false,
  visualPhotorealism10of10Approved:false,familyAlpha:'HOLD',releaseAuthorized:false
 });
 console.info('P161_AUTHENTIC_80_163_HEAD_AXIS_REGISTRATION_MEASURED',
  JSON.stringify({figure,originalAngleDegrees:beforeAngle,
   finalAngleDegrees:afterAngle,appliedRotationDegrees:angleApplied,
   sourceMITNeckPivotShiftMeters:pivotDisplacement,
   originalRealLicensedSkinOverlapMeters:sourceOverlapAfter,
   ownerGarmentCountPreserved:after.garments,releaseAuthorized:false}));
 return result;
}
