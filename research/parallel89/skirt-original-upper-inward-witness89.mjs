/**
 * Research-only, authentic Commons-0043 photograph + source 163bone GLB.
 * Locate EXACT original upper-waist-ring inward radial rays on original
 * indexed body triangles, preserving original mesh and original bone identity.
 * A far-side ray crossing is not a signed or swept body/garment penetration.
 *
 * The original prior radial and whole-vs-core independent witnesses MUST
 * agree on every one of 48 original upper photo-band spokes. No source
 * vertex coordinates, original face IDs, user photos, or wardrobe leave
 * this pure function. Never weld UV twins, synthesize a source backside,
 * mutate originals or admit the research-only garment for release.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const finite=Number.isFinite;
const validIndex=a=>a instanceof Uint16Array||a instanceof Uint32Array;
const round=x=>Math.round(x*1e5)/1e5;
const ascii=s=>typeof s==='string'&&s.length>0&&s.length<=96&&/^[\x20-\x7e]+$/.test(s);
const fail=reason=>Object.freeze({
 schema:'P89-original-upper-skirt-source-inward-ray-anatomy/v1',
 status:'ORIGINAL_UPPER_SOURCE_INWARD_PROVENANCE_UNVERIFIABLE',reason,
 noFabricOrOriginalAnatomyModified:true,
 originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
const anatomicalRegion=name=>{
 const s=name.toLowerCase();
 if(/hand|finger|thumb|arm|forearm|shoulder|clavic|elbow|wrist|head|neck|eye|ear|face|jaw/.test(s))return 'ORIGINAL_HEAD_ARM';
 if(/foot|toe|ankle|knee|calf|shin|thigh|upleg|lowleg|leg|heel/.test(s))return 'ORIGINAL_LEG';
 if(/pelv|hip|spine|chest|torso|abdomen|back|waist|butt|root/.test(s))return 'ORIGINAL_TORSO_HIP';
 return 'UNKNOWN_ORIGINAL_BONE';
};
function rayHits(segments,x,z,ux,uz){
 const hits=[];let ambiguous=false;
 for(const p of segments){
  const px=p.ax-x,pz=p.az-z,ex=p.bx-p.ax,ez=p.bz-p.az,
   determinant=ux*ez-uz*ex;
  if(Math.abs(determinant)<1e-11){
   if(Math.abs(px*uz-pz*ux)<1e-9)ambiguous=true;
   continue;
  }
  const t=(px*ez-pz*ex)/determinant,u=(px*uz-pz*ux)/determinant;
  if(t>=0&&u>=-1e-9&&u<=1+1e-9&&t<=.75)
   hits.push({t,face:p.face,excluded:p.excluded});
 }
 hits.sort((a,b)=>a.t-b.t||a.face-b.face);
 return {hits,ambiguous};
}
export function auditOriginalUpperSkirtInwardSourceWitness89({
 skirtPositions,skirtIndices,bodyPositions,bodyIndices,
 coreBodyFaceMask,restPositions,skinIndices,skinWeights,sourceMeshIds,
 sourceMeshNames,sourceBoneNamesByMesh,avatar,pose,
 sourcePhotoSHA256,sourceAnatomyGLBSHA256,originalRig163Bones,
 selectedActualWebGLPreview,selectedFivePoseBvhVerified,
 priorExactRadialReceipt,priorWholeVsCoreReceipt
}={}){
 if(!Object.hasOwn(RIG,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO||sourceAnatomyGLBSHA256!==RIG[avatar]||
  originalRig163Bones!==true||selectedActualWebGLPreview!==true||
  selectedFivePoseBvhVerified!==true)
  return fail('true-original-photo-and-163bone-source-model-mandatory');
 const cloth=skirtPositions,body=bodyPositions,ix=bodyIndices,
  si=skirtIndices,mask=coreBodyFaceMask,rest=restPositions,
  boneIDs=skinIndices,weights=skinWeights,meshIDs=sourceMeshIds,
  prior=priorExactRadialReceipt,fullPrior=priorWholeVsCoreReceipt;
 if(!(cloth instanceof Float32Array)||cloth.length!==1029||
  !validIndex(si)||si.length!==1728||
  !(body instanceof Float32Array)||body.length<900||
  body.length>2100000||body.length%3!==0||
  !validIndex(ix)||ix.length<300||ix.length>3000000||
  ix.length%3!==0||
  !(mask instanceof Uint8Array)||mask.length!==ix.length/3||
  !mask.includes(0)||!mask.includes(1)||
  mask.some(v=>v!==0&&v!==1)||
  !(rest instanceof Float32Array)||rest.length!==body.length||
  !(boneIDs instanceof Uint16Array)||boneIDs.length!==body.length/3*4||
  !(weights instanceof Float32Array)||weights.length!==boneIDs.length||
  !(meshIDs instanceof Uint16Array)||meshIDs.length!==body.length/3||
  !Array.isArray(sourceMeshNames)||sourceMeshNames.length<1||
  sourceMeshNames.length>256||sourceMeshNames.some(x=>!ascii(x))||
  !Array.isArray(sourceBoneNamesByMesh)||
  sourceBoneNamesByMesh.length!==sourceMeshNames.length||
  sourceBoneNamesByMesh.some(row=>!Array.isArray(row)||row.length!==163||
   row.some(x=>!ascii(x)))||
  prior?.schema!=='P89-actual-original-163bone-source-radial-body-gap/v1'||
  prior.avatar!==avatar||prior.pose!==pose||
  prior.originalPhotoSHA256!==PHOTO||prior.source163BoneRig!==true||
  prior.consumer3DAdmitted!==false||prior.releaseAuthorized!==false||
  !Array.isArray(prior.sevenOriginalSourceSkirtBands)||
  prior.sevenOriginalSourceSkirtBands.length!==7||
  prior.exactRaySampledAngularPositions!==336||
  fullPrior?.schema!=='P89-original-163bone-whole-vs-core-ray-missing-cause/v1'||
  fullPrior.avatar!==avatar||fullPrior.pose!==pose||
  fullPrior.sourcePhotoSHA256!==PHOTO||
  fullPrior.sourceAnatomyGLBSHA256!==RIG[avatar]||
  fullPrior.independentlyMatchedExactOriginalCoreRayReceipt!==true||
  fullPrior.consumer3DAdmitted!==false||fullPrior.releaseAuthorized!==false||
  !Array.isArray(fullPrior.sevenSourceOriginalBodyRayCauseBands)||
  fullPrior.sevenSourceOriginalBodyRayCauseBands.length!==7||
  fullPrior.originalPhotoSkirtRaySectors!==336)
  return fail('original-indexed-rest-skin-mesh-and-two-independent-ray-receipts-required');
 for(const v of body)if(!finite(v))return fail('nonfinite-original-source-posed-body');
 for(const v of rest)if(!finite(v))return fail('nonfinite-original-source-rest-body');
 for(const v of cloth)if(!finite(v))return fail('nonfinite-original-photographed-skirt');
 for(const v of ix)if(v>=body.length/3)return fail('invalid-original-source-indexed-body-face');
 for(const v of si)if(v>=343)return fail('invalid-original-skirt-source-face');
 for(const m of meshIDs)if(m>=sourceMeshNames.length)
  return fail('source-original-mesh-out-of-range');
 for(const b of boneIDs)if(b>=163)return fail('original-163bone-influence-out-of-range');
 for(const w of weights)if(!finite(w)||w<0||w>1)
  return fail('original-163bone-skin-weight-invalid');
 const x=(cloth[0]+cloth[24*3])/2,
  z=(cloth[2]+cloth[24*3+2])/2,
  y=(cloth[1]+cloth[24*3+1])/2;
 if(!finite(y)||y<.15||y>2.6||Math.abs(cloth[1]-cloth[24*3+1])>.025)
  return fail('original-photographed-top-skirt-plane-invalid');
 const segments=[],core=[];
 for(let face=0;face<ix.length/3;face++){
  const v=[];
  for(let j=0;j<3;j++){
   const k=ix[3*face+j]*3;v.push([body[k],body[k+1],body[k+2]]);
  }
  const pts=[];
  for(const [a,b] of [[0,1],[1,2],[2,0]]){
   const d=v[a][1]-y,e=v[b][1]-y;
   if(d*e>=0)continue;
   const f=-d/(e-d);
   pts.push([v[a][0]+(v[b][0]-v[a][0])*f,
    v[a][2]+(v[b][2]-v[a][2])*f]);
  }
  if(pts.length!==2||Math.hypot(pts[0][0]-pts[1][0],
   pts[0][1]-pts[1][1])<1e-7)continue;
  const record={ax:pts[0][0],az:pts[0][1],
   bx:pts[1][0],bz:pts[1][1],face,excluded:mask[face]===0};
  segments.push(record);if(!record.excluded)core.push(record);
 }
 const q=prior.sevenOriginalSourceSkirtBands[0],
  fullQ=fullPrior.sevenSourceOriginalBodyRayCauseBands[0];
 if(core.length!==q.actualBodyTrianglePlaneCutSegments||
  core.length!==fullQ.actualSourceCoreTrianglePlaneSegments||
  segments.length!==fullQ.actualWholeOriginalBodyTrianglePlaneSegments)
  return fail('original-source-top-ring-indexed-contours-do-not-reconcile');
 const vertexNames=v=>{
  const m=meshIDs[v];let top=-1,bone=0;
  for(let k=0;k<4;k++){
   const w=weights[4*v+k];
   if(w>top){top=w;bone=boneIDs[4*v+k];}
  }
  return {mesh:sourceMeshNames[m],
   bone:sourceBoneNamesByMesh[m][bone]};
 };
 const sourceFaces=ids=>{
  const sourceMeshes=new Set(),bones=new Set(),regions=new Set();
  let excluded=false;
  for(const face of ids){
   excluded ||= mask[face]!==1;
   for(let k=0;k<3;k++){
    const name=vertexNames(ix[3*face+k]);
    sourceMeshes.add(name.mesh);bones.add(name.bone);
    regions.add(anatomicalRegion(name.bone));
   }
  }
  return {
   originalSourceMeshes:[...sourceMeshes].sort(),
   originalDominant163BoneNames:[...bones].sort(),
   originalBoneAnatomicalRegions:[...regions].sort(),
   originalSourceFaceMaskExcluded:excluded
  };
 };
 let inward=0,near=0,outward=0,unknown=0,ambiguous=0,globalExcluded=0,
  nearestBeforeFarthestBeyond=0,nearestAlreadyBeyond=0;
 const inwardRays=[];
 for(let j=0;j<48;j++){
  const i=3*j,dx=cloth[i]-x,dz=cloth[i+2]-z,
   radius=Math.hypot(dx,dz);
  if(!finite(radius)||radius<.075||radius>.95)
   return fail('source-skirt-top-ring-radius-outside-original-bounds');
  const ux=dx/radius,uz=dz/radius,
   coreWitness=rayHits(core,x,z,ux,uz),
   allWitness=rayHits(segments,x,z,ux,uz);
  const valid=core.length>=2&&!coreWitness.ambiguous&&
   coreWitness.hits.length>0;
  if(!valid){
   unknown++;if(coreWitness.ambiguous)ambiguous++;
   continue;
  }
  const far=coreWitness.hits.at(-1).t,gap=radius-far;
  if(gap < -.002){
   inward++;
   const closest=coreWitness.hits[0].t;
   const hitGroup=coreWitness.hits.filter(h=>Math.abs(h.t-far)<=1e-6);
   const allFar=allWitness.ambiguous||!allWitness.hits.length?
    null:allWitness.hits.at(-1).t;
   const farSources=sourceFaces([...new Set(hitGroup.map(h=>h.face))]);
   const farBeyond=closest>radius+.002;
   const between=closest<radius-.002&&far>radius+.002;
   if(farBeyond)nearestAlreadyBeyond++;
   if(between)nearestBeforeFarthestBeyond++;
   if(allFar!==null&&allFar>far+1e-6)globalExcluded++;
   inwardRays.push(Object.freeze({
    originalSourceSkirtTopSectorIndex:j,
    originalSourceRayApproxDirectionDegrees:j*7.5,
    trueOriginalSkirtRayDistanceMeters:round(radius),
    originalNearestSourceBodyRayMeters:round(closest),
    originalFarthestSourceBodyRayMeters:round(far),
    originalRayDistanceBeyondSkirtMeters:round(-gap),
    originalSourceFaceRayIntersectionCount:coreWitness.hits.length,
    independentlyDistinctSourceRayDepthCount:coreWitness.hits.filter(
     (h,i,a)=>i===0||Math.abs(h.t-a[i-1].t)>1e-6).length,
    sourceFacesAtSameFarthestDepth:hitGroup.length,
    farSourceOriginalMeshAndBoneProof:Object.freeze(farSources),
    originalNearAndFarDistancePattern:
     farBeyond?'ORIGINAL_FIRST_FACE_HIT_FARTHER_THAN_PHOTO_SKIRT':
     between?'ORIGINAL_FIRST_HIT_NEARER_BUT_FAR_FACE_BEHIND_SKIRT':
      'ORIGINAL_INWARD_RAY_DEGENERATE_OR_SURFACE_NEAR',
    unfilteredOriginalBodyFarthestDiffersFromCore:
     allFar!==null&&allFar>far+1e-6,
    originalIndexedBoneMeshEvidenceNotSignedHumanExterior:true,
    humanClothFitAndSweptCollisionCertified:false
   }));
  }else if(gap<=.002)near++;
  else outward++;
 }
 if(inward+near+outward+unknown!==48||
  inward!==q.exactRayObservedInwardSectors||
  near!==q.exactRayObservedNearZeroSectors||
  outward!==q.exactRayObservedOutwardSectors||
  unknown!==q.exactRayUnknownSectors||
  ambiguous!==q.exactRayCollinearAmbiguousSectors||
  inward!==fullQ.originalCoreExactInwardSectors||
  unknown!==fullQ.originalCoreExactUnknownSectors||
  inwardRays.length!==inward||
  Math.abs(Math.max(0,...inwardRays.map(v=>
   v.originalRayDistanceBeyondSkirtMeters))-
   q.exactRayMaximumObservedInwardMeters)>1.1e-5)
  return fail('independent-original-upper-ray-to-registered-receipt-mismatch');
 const upperOtherPrior=prior.exactRayInwardSourceSectors-inward,
  upperOtherRoot=fullPrior.originalCoreSourceExactInwardRaySectors-inward;
 if(upperOtherPrior<0||upperOtherRoot!==upperOtherPrior)
  return fail('original-ray-source-inward-witness-unreconciled-across-seven-bands');
 return Object.freeze({
  schema:'P89-original-upper-skirt-source-inward-ray-anatomy/v1',
  status:inward>0?'ORIGINAL_UPPER_INWARD_SOURCE_RAY_BONE_MESH_WITNESSED_NOT_WEARABLE':
   'NO_ORIGINAL_UPPER_INWARD_RAY_OBSERVED_NOT_BODY_FIT',
  avatar,pose,originalSourcePhotoSHA256:PHOTO,
  originalSourceAnatomyGLBSHA256:RIG[avatar],
  originalHuman163BoneRig:true,
  originalTopPhotographedSkirtBand:1,
  topSkirtRaySampleCount:48,
  topSourceIndexOriginalFaceCutCount:core.length,
  originalCoreSourceInwardRayCount:inward,
  originalCoreSourceNearRayCount:near,
  originalCoreSourceOutwardRayCount:outward,
  originalCoreSourceUnknownRayCount:unknown,
  originalCoreSourceCollinearUnknownRayCount:ambiguous,
  originalOtherSixPhotoHeightBandsInwardRayCount:upperOtherPrior,
  originalInwardTopSectorWitnesses:Object.freeze(inwardRays),
  raysWithFarthestOriginalBodyHitBeyondNearerSourceHit:nearestBeforeFarthestBeyond,
  raysWithFirstOriginalBodyHitAlreadyBeyondSkirt:nearestAlreadyBeyond,
  raysWhoseExcludedWholeBodyRayIsFartherThanSelected:globalExcluded,
  exactOriginal163BoneSourceMeshAndTopSkinInfluenceProvenanceUsed:true,
  originalSourceFullMeshUnchanged:true,
  positionalRayHitIsNotSignedExteriorOrActualFabricPenetration:true,
  originalSkirtSourcePhotoFrontAnd2DFallbackUnchanged:true,
  originalBackClothAndRealPhysicalGarmentDimensionsUnavailable:true,
  physicalBodySizingAndOwnerPhotoAcceptanceUnverified:true,
  betweenPoseSweptContactUnverified:true,
  noOriginalFaceIdsOrOriginalSourceBodyCoordinatesReleased:true,
  neverWeldOrFillOriginalHumanSurface:true,
  consumer3DAdmitted:false,releaseAuthorized:false,
  originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD'
 });
}
