/**
 * P89: original P541 CC0 skinned source torso/leg separation.
 * Metacarpal and wrist bones are hand/arm anatomy; the earlier research
 * core mask omitted both spellings. Such source-face ray hits are NOT
 * body waist/torso cloth-fit witnesses. Fail closed on original bone names.
 * Original GLB/source photo never altered; original full-body BVH veto remains.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const printable=s=>typeof s==='string'&&s.length>0&&s.length<=96&&/^[\x20-\x7e]+$/.test(s);
export function isOriginalUpperLimbOrHeadBone89(name){
 if(!printable(name))throw Error('original-163bone-name-unverifiable');
 return /upperarm|lowerarm|forearm|shoulder|clavic|scapula|elbow|wrist|metacarp|carpal|palm|hand|finger|thumb|head|neck|eye|ear|face|jaw/i.test(name);
}
const refusal=reason=>Object.freeze({
 schema:'P89-original-source-upper-limb-core-face-veto/v1',
 status:'ORIGINAL_UPPER_LIMB_FACE_MASK_UNVERIFIABLE',reason,
 actualOriginalSourceNeverModified:true,originalPhoto2DFallbackRequired:true,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
export function attestOriginalSourceCoreUpperLimbFaceVeto89({
 bodyIndices,coreBodyFaceMask,skinIndices,skinWeights,sourceMeshIds,
 sourceBoneNamesByMesh,sourceMeshNames,avatar,
 sourcePhotoSHA256,sourceAnatomyGLBSHA256,originalRig163Bones
}={}){
 if(!Object.hasOwn(RIG,avatar)||sourcePhotoSHA256!==PHOTO||
  sourceAnatomyGLBSHA256!==RIG[avatar]||originalRig163Bones!==true)
  return refusal('original-licensed-photo-and-authentic-163bone-glb-required');
 const idx=bodyIndices,mask=coreBodyFaceMask,
  joints=skinIndices,weights=skinWeights,meshes=sourceMeshIds;
 if(!(idx instanceof Uint16Array||idx instanceof Uint32Array)||
  idx.length<300||idx.length>3000000||idx.length%3!==0||
  !(mask instanceof Uint8Array)||mask.length!==idx.length/3||
  !mask.includes(0)||!mask.includes(1)||
  mask.some(x=>x!==0&&x!==1)||
  !(joints instanceof Uint16Array)||joints.length<1200||joints.length%4!==0||
  !(weights instanceof Float32Array)||weights.length!==joints.length||
  !(meshes instanceof Uint16Array)||meshes.length!==joints.length/4||
  !Array.isArray(sourceMeshNames)||sourceMeshNames.length<1||
  sourceMeshNames.length>256||sourceMeshNames.some(x=>!printable(x))||
  !Array.isArray(sourceBoneNamesByMesh)||
  sourceBoneNamesByMesh.length!==sourceMeshNames.length||
  sourceBoneNamesByMesh.some(row=>!Array.isArray(row)||row.length!==163||
   row.some(x=>!printable(x))))
  return refusal('actual-original-source-indexed-face-skin-mesh-names-required');
 const upperWeights=new Float64Array(meshes.length),realUpperNames=new Set();
 for(let v=0;v<meshes.length;v++){
  const m=meshes[v];if(m>=sourceMeshNames.length)
   return refusal('original-source-mesh-identity-out-of-range');
  let total=0,upper=0;
  for(let k=0;k<4;k++){
   const at=4*v+k,b=joints[at],w=weights[at];
   if(b>=163||!Number.isFinite(w)||w<0||w>1)
    return refusal('original-source-upper-limb-skin-index-weight-invalid');
   total+=w;
   if(w<=1e-8)continue;
   const name=sourceBoneNamesByMesh[m][b];
   if(isOriginalUpperLimbOrHeadBone89(name)){
    upper+=w;realUpperNames.add(name);
   }
  }
  if(Math.abs(total-1)>.003)
   return refusal('original-body-source-skin-weights-not-normalized');
  upperWeights[v]=upper;
 }
 let selected=0,excluded=0,upperFaces=0,
  blockedUpperFaces=0,leakedUpperFaces=0;
 for(let f=0;f<mask.length;f++){
  const at=3*f;let upperFace=false;
  for(let k=0;k<3;k++){
   const vertex=idx[at+k];
   if(vertex>=meshes.length)
    return refusal('original-body-source-face-index-out-of-range');
   if(upperWeights[vertex]>=.5)upperFace=true;
  }
  if(upperFace)upperFaces++;
  if(mask[f]){selected++;if(upperFace)leakedUpperFaces++;}
  else{excluded++;if(upperFace)blockedUpperFaces++;}
 }
 if(leakedUpperFaces)
  return refusal('original-source-metacarpal-wrist-or-hand-face-leaked-into-torso-core');
 if(!upperFaces||!blockedUpperFaces||!selected||!excluded)
  return refusal('original-source-upper-limb-veto-unproven');
 return Object.freeze({
  schema:'P89-original-source-upper-limb-core-face-veto/v1',
  status:'TRUE_ORIGINAL_SOURCE_UPPER_EXTREMITY_FACE_VETOED_NOT_WEARABLE',
  avatar,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  actualOriginalBodyIndexedTriangles:mask.length,
  selectedTorsoLegOriginalSourceFaces:selected,
  originalExcludedSourceFaces:excluded,
  actualOriginalUpperLimbHeadWeightedFaces:upperFaces,
  originalUpperLimbHeadFacesConservativelyExcluded:blockedUpperFaces,
  originalUpperLimbHeadFacesLeakedIntoCore:leakedUpperFaces,
  observedRealOriginalExcludedBoneNames:[...realUpperNames].sort(),
  originalMetacarpalAndWristBoneNamesClassifiedAsUpperExtremity:true,
  originalFullBodyIndexedBVHStillRequired:true,
  upperHandRayNotIndependentCoreTorsoClothFit:true,
  originalWholeBodySignedAnatomyNotCertified:true,
  originalBacksideAndPhysicalGarmentSizeUnavailable:true,
  originalPhoto2DFallbackRequired:true,
  actualOriginalSourceNeverModified:true,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
