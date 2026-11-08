/**
 * Closet Current P159 — physically present, source-registered neck transition
 * on authenticated ORIGINAL 163-bone owned-photo outfit figures.
 *
 * The measured P156 MIT head/neck and actual posed P541 original body provide
 * two cross-sections. A small, reversible tapered surface bridges the true
 * old-manikin head-mask plane. It inherits original P158 source-verified skin
 * color rather than an invented plastic collar or a customer portrait.
 *
 * This is an *additional independently owned surface*, NOT a topological weld
 * between the unrelated 80 and 163-bone rigs. It is not dynamic cloth fitting,
 * an approved real person, production/staging, a genuine device trial or release.
 * No source mesh, source texture, original JPEG, user garment, wardrobe or
 * shared owner/face geometry is ever written to.
 */
import * as THREE from 'three';
export const NECK159=Object.freeze({
 priority:159,exactParentP158:'4b7815760104ca4201b59210466cf43d2fd9f8be',
 originalSourceBodyRigBones:163,originalMITHeadRigBones:80,
 originalUserPhotoBytesAltered:false,originalGarmentGeometryAltered:false,
 originalHeadTextureAltered:false,originalSourceBodyGeometryAltered:false,
 physicalNeckSkeletonWeldCompleted:false,unverifiedPoseRetargetAccepted:false,
 photorealism10of10Accepted:false,physicalAndroidIphoneAccepted:false,
 familyAlpha:'HOLD',releaseAuthorized:false
});
const NAME='research-measured-source-neck-transition-159';
const fail=s=>{const e=Error('NECK159 '+s);e.code='neck159-research-refused';throw e;};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const quantile=(values,q)=>{
 const v=values.slice().sort((a,b)=>a-b);
 if(!v.length)fail('missing original head/torso source points');
 return v[Math.floor((v.length-1)*q)];
};
const hasLicensedFace=(o,figure)=>{
 const name=figure==='female'?'f007_head':'m006_head';
 return (Array.isArray(o.material)?o.material:[o.material]).some(m=>m?.name===name);
};
function poseRing(root,source,targetY,figure,licensed){
 if(!root?.traverse)fail('exact posed original source required');
 root.updateMatrixWorld(true);
 const points=[],tmp=new THREE.Vector3();
 let meshes=0,skelBones=0;
 const band=licensed?.047:.060;
 root.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  if(licensed?!hasLicensedFace(o,figure):
     (o.userData?.work56Garment||o.userData?.head157OriginalLicensed))return;
  if(!o.skeleton?.bones||typeof o.applyBoneTransform!=='function'||
     !o.geometry?.attributes?.position)fail('original posed surface unavailable');
  skelBones=Math.max(skelBones,o.skeleton.bones.length);
  o.skeleton.update();o.updateWorldMatrix(true,false);meshes++;
  const attr=o.geometry.attributes.position;
  for(let i=0;i<attr.count;i++){
   const v=o.applyBoneTransform(i,tmp.fromBufferAttribute(attr,i))
    .applyMatrix4(o.matrixWorld);
   if(![v.x,v.y,v.z].every(finite))fail('nonfinite original skinned vertex');
   if(Math.abs(v.y-targetY)>band||
      Math.abs(v.x-source.cx)>source.w*.65||
      Math.abs(v.z-source.cz)>source.z*.72)continue;
   points.push([v.x,v.y,v.z]);
  }
 });
 if(meshes<1||skelBones!==(licensed?80:163))
  fail('expected precise original '+(licensed?'MIT head80':'body163')+' surface not present');
 if(points.length<6)fail('no measured original collar/neck ring at '+targetY.toFixed(5)+' ('+
  (licensed?'MIT head':'original body')+' sampled='+points.length+')');
 const xs=points.map(p=>p[0]),zs=points.map(p=>p[2]);
 const midX=quantile(xs,.5),midZ=quantile(zs,.5);
 const xRadius=(quantile(xs,.91)-quantile(xs,.09))*.5;
 const zRadius=(quantile(zs,.91)-quantile(zs,.09))*.5;
 if(![midX,midZ,xRadius,zRadius].every(finite))
  fail('original source collar radii not finite');
 if(Math.abs(midX-source.cx)>source.w*.43||
    Math.abs(midZ-source.cz)>source.z*.53)
  fail('real original head/torso neck-center alignment not anatomically plausible');
 const width=clamp(xRadius,source.w*.135,source.w*.43),
  depth=clamp(zRadius,source.z*.16,source.z*.45);
 return Object.freeze({x:midX,z:midZ,rx:width,rz:depth,
  sampledOriginalSkinnedVertices:points.length,originalRigBones:skelBones,
  sourceY:targetY});
}
function sourceGarments(root){
 let body=0,garments=0,bones=0;
 root.traverse(o=>{
  if(!o.isSkinnedMesh||o.userData?.head157OriginalLicensed)return;
  if(o.userData?.work56Garment)garments++;
  else{body++;bones=Math.max(bones,o.skeleton?.bones?.length||0);}
 });
 if(body<1||bones!==163||garments<1)
  fail('signed saved outfit and original mannequin body required');
 return {body,garments,bones};
}
export function clearSourceMeasuredNeck159(root){
 if(!root?.getObjectByName)return false;
 const mesh=root.getObjectByName(NAME);
 if(!mesh)return false;
 mesh.parent?.remove(mesh);
 mesh.geometry?.dispose();
 if(Array.isArray(mesh.material))mesh.material.forEach(m=>m?.dispose());
 else mesh.material?.dispose();
 return true;
}
export function applySourceMeasuredNeck159(root,figure,context){
 const {source,mask,afterBox,candidate,skinHarmony158,graft}=context||{};
 if(!root?.traverse||!['female','male'].includes(figure)||
    !source?.headBone||source.maxBones!==163||!mask?.originalBodyOnlyRenderMask||
    !graft||graft.name!=='research-licensed-source-head-graft-157'||
    candidate?.figure!==figure||candidate.maxBone!==80||
    !afterBox||afterBox.isEmpty()||!skinHarmony158?.harmonyApplied)
  fail('P157 real licensed head + original P158 matched skin + measured body required');
 if(root.getObjectByName(NAME))fail('duplicate neck transition must not accumulate');
 if(skinHarmony158.sourceP156HeadSHA256!==candidate.sha256)
  fail('unverified P156 real face palette in anatomy bridge');
 const before=sourceGarments(root);
 const cutoff=mask.cutoff;
 const topY=cutoff+Math.min(.038,source.h*.125),
  bottomY=cutoff-Math.min(.034,source.h*.12);
 if(![cutoff,topY,bottomY].every(finite)||topY-bottomY<.045||
    topY-bottomY>.11||topY>=afterBox.max.y-.11||
    bottomY<=afterBox.min.y-.04)
  fail('real source head to collar junction height outside safe anatomical envelope');
 const upper=poseRing(graft,source,topY,figure,true);
 const lower=poseRing(root,source,bottomY,figure,false);
 if(upper.originalRigBones!==80||lower.originalRigBones!==163)
  fail('original cross-skeleton source dimensions changed');
 // 9 cross-section rings; source-measured axes at either end, gently bowed
 // at the center to preserve neck curvature instead of a hard tubular collar.
 const radial=24,rings=9,pos=[],colors=[],idx=[];
 const faceRGB=skinHarmony158.sourceFaceAlbedoSRGB;
 const linear=skinHarmony158.measuredSourceFaceLinearBodyTone;
 if(!Array.isArray(faceRGB)||!Array.isArray(linear)||faceRGB.length!==3||
    linear.length!==3||![...faceRGB,...linear].every(finite))
  fail('original MIT albedo / matched P158 exposed-skin color unavailable');
 const upperTone=new THREE.Color().setRGB(faceRGB[0]/255,faceRGB[1]/255,
  faceRGB[2]/255,THREE.SRGBColorSpace);
 const lowerTone=new THREE.Color().setRGB(...linear,THREE.LinearSRGBColorSpace);
 for(let row=0;row<rings;row++){
  const t=row/(rings-1),s=t*t*(3-2*t);
  const y=bottomY+(topY-bottomY)*t;
  const cx=lower.x+(upper.x-lower.x)*s;
  const cz=lower.z+(upper.z-lower.z)*s;
  const rX=lower.rx+(upper.rx-lower.rx)*s+Math.sin(t*Math.PI)*.0018;
  const rZ=lower.rz+(upper.rz-lower.rz)*s+Math.sin(t*Math.PI)*.0018;
  // Parent sample surfaces overlap by ~2mm so the bridge has no floating edge.
  const tone=lowerTone.clone().lerp(upperTone,s*.75);
  for(let col=0;col<=radial;col++){
   const angle=col/radial*Math.PI*2;
   pos.push(cx+Math.cos(angle)*rX,y,cz+Math.sin(angle)*rZ);
   colors.push(tone.r,tone.g,tone.b);
  }
 }
 for(let row=0;row<rings-1;row++)for(let col=0;col<radial;col++){
  const a=row*(radial+1)+col,b=a+radial+1;
  idx.push(a,b,a+1,b,b+1,a+1);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setIndex(idx);geometry.computeVertexNormals();
 geometry.computeBoundingBox();
 if(!geometry.boundingBox||geometry.boundingBox.isEmpty()||
    geometry.boundingBox.max.y-geometry.boundingBox.min.y>.12){
  geometry.dispose();fail('source bridge geometry outside collar');
 }
 const material=new THREE.MeshStandardMaterial({
  vertexColors:true,roughness:.77,metalness:0,
  side:THREE.DoubleSide,depthWrite:true,transparent:false
 });
 const mesh=new THREE.Mesh(geometry,material);
 mesh.name=NAME;mesh.userData.neck159Owned=true;
 mesh.castShadow=false;mesh.receiveShadow=true;
 // Geometry is defined in real world units. attach() registers the bridge to
 // the ORIGINAL head bone, maintaining world pose at installation. It follows
 // head movement; this does NOT assert full two-rig dynamic neck skinning.
 root.updateMatrixWorld(true);
 source.headBone.updateWorldMatrix(true,false);
 source.headBone.attach(mesh);
 mesh.updateMatrixWorld(true);
 const after=sourceGarments(root);
 if(after.body!==before.body||after.garments!==before.garments||
    after.bones!==163){
  clearSourceMeasuredNeck159(root);
  fail('original owner wardrobe or body source changed');
 }
 const result=Object.freeze({
  figure,sourceHeadRigBones:80,originalBodyRigBones:163,
  originalMITHeadSHA256:candidate.sha256,
  sourceVerifiedAlbedoPNG_SHA256:skinHarmony158.sourceP156HeadSHA256,
  upperSourceSkinnedVertices:upper.sampledOriginalSkinnedVertices,
  lowerSourceSkinnedVertices:lower.sampledOriginalSkinnedVertices,
  upperNeckRadiusX:upper.rx,lowerCollarRadiusX:lower.rx,
  upperNeckRadiusZ:upper.rz,lowerCollarRadiusZ:lower.rz,
  measuredUpperWorldY:topY,measuredLowerWorldY:bottomY,
  originalHeadMaskWorldY:cutoff,
  gapSpannedMeters:topY-bottomY,
  bridgeSkinnedHeadAttached:true,bridgeSurfaceSegments:radial,
  bridgeSurfaceRings:rings,bridgeTriangles:idx.length/3,
  originalSourceSkinnedBodyMeshesBefore:before.body,
  originalSourceSkinnedBodyMeshesAfter:after.body,
  originalOwnerPhotographedGarmentMeshesBefore:before.garments,
  originalOwnerPhotographedGarmentMeshesAfter:after.garments,
  sourceMannequinMeshIndicesReplaced:false,
  originalLicensedHeadMeshModified:false,
  originalGarmentOrSourceJPEGPixelsModified:false,
  physicalNeckTopologyWelded:false,
  userDynamicClothRetargetApproved:false,
  physicalPhoneApproval:false,releaseAuthorized:false,
  familyAlpha:'HOLD'
 });
 return result;
}
