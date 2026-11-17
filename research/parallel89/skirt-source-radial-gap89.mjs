/**
 * P89: original public Commons-0043 photographed skirt, genuine CC0 163-bone
 * posed-body *radial cross-section* gap witness. Research-only. A positive
 * radial gap is NOT signed closed-mesh containment, a measured real garment
 * size, 360-degree source photography, continuous cloth motion or wearable fit.
 *
 * All sampled body/garment buffers are only used in-process. No coordinates,
 * pixels, wearer geometry or privately captured photo are exported.
 *
 * To prevent 0 BVH transverse crossings from silently becoming a wearable
 * claim, unobserved anatomical angular sectors remain UNKNOWN. Source-image
 * authored/derived 7 x 49 skirt ring topology and original body face weights
 * are mandatory. The original full-body BVH crossing veto is separate.
 */
const SHA='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const RINGS=7,SECTORS=48,N=RINGS*(SECTORS+1);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const safe=x=>Number.isSafeInteger(x)&&x>=0;
const round=x=>Math.round(x*1e5)/1e5;
const fail=reason=>Object.freeze({
 schema:'P89-actual-original-163bone-source-radial-body-gap/v1',
 status:'ORIGINAL_SOURCE_RADIAL_BODY_GAP_NOT_VERIFIABLE',reason,
 physicalSourceGarmentSizeKnown:false,closedVolumeContainmentCertified:false,
 complete360OriginalPhotoVerified:false,sweptClothPhysicsCertified:false,
 originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
/**
 * Inputs: actual posed THREE source-index-preserved world-space geometry
 * buffers, original source body/limb skin-weight provenance classification.
 * No caller-created scalar clearance/approval is accepted as an input.
 */
export function auditSelectedOriginalSkirtRadialGap89({
 skirtPositions,skirtIndices,bodyPositions,bodyIndices,coreBodyFaceMask,
 avatar,pose,sourcePhotoSHA256,originalRig163Bones=false,
 selectedMeasuredFivePoseBvh=false,selectedActualWebGLPreview=false
}={}){
 if(!['female','male'].includes(avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==SHA||originalRig163Bones!==true||
  selectedMeasuredFivePoseBvh!==true||selectedActualWebGLPreview!==true)
  return fail('actual-attested-public-source-and-selected-original-163bone-preview-required');
 const idx=bodyIndices,si=skirtIndices,body=bodyPositions,cloth=skirtPositions;
 if(!(cloth instanceof Float32Array)||cloth.length!==N*3||
  !(si instanceof Uint16Array||si instanceof Uint32Array)||
  si.length!==(RINGS-1)*SECTORS*6||
  !(body instanceof Float32Array)||body.length<900||
  body.length>2_100_000||body.length%3!==0||
  !(idx instanceof Uint16Array||idx instanceof Uint32Array)||
  idx.length<300||idx.length>3_000_000||idx.length%3!==0||
  !(coreBodyFaceMask instanceof Uint8Array)||
  coreBodyFaceMask.length!==idx.length/3||
  !coreBodyFaceMask.some(x=>x===1)||
  !coreBodyFaceMask.some(x=>x===0)||
  coreBodyFaceMask.some(x=>x!==0&&x!==1))
  return fail('original-343-source-skirt-and-bone-classified-skinned-body-indices-required');
 for(const v of cloth)if(!finite(v))return fail('nonfinite-posed-source-skirt-world-vertex');
 for(const v of body)if(!finite(v))return fail('nonfinite-original-anatomical-source-world-vertex');
 for(const v of idx)if(!safe(v)||v>=body.length/3)
  return fail('out-of-range-original-body-face-index');
 for(const v of si)if(!safe(v)||v>=N)
  return fail('out-of-range-original-skirt-face-index');
 let candidateRadialInward=0,observedSectors=0,unknownSectors=0,
  bodyPlaneSegmentsTotal=0,mostInward=null,smallestObservedGap=null;
 // Exact original indexed-face segment/ray cross-sections are a separate
 // conservative source-contour measurement. They do not inherit the adjacent
 // angular-bin dilation used in the older quick radial guard.
 let rayInward=0,rayNear=0,rayOutward=0,rayUnknown=0,
  rayAmbiguous=0,rayMinGap=null,rayMaxInward=0,rayContours=0;
 const rows=[];
 const faceCount=idx.length/3;
 for(let row=0;row<RINGS;row++){
  const off=row*(SECTORS+1)*3,pair=(row*(SECTORS+1)+SECTORS/2)*3,
   x=(cloth[off]+cloth[pair])/2,
   z=(cloth[off+2]+cloth[pair+2])/2,
   y=(cloth[off+1]+cloth[pair+1])/2;
  if(!finite(y)||y<.15||y>2.6||
   Math.abs(cloth[off+1]-cloth[pair+1])>.025)
   return fail('original-photo-source-skirt-ring-level-inconsistent');
  const rimR=Math.hypot(cloth[off]-x,cloth[off+2]-z);
  if(rimR<.075||rimR>.95)return fail('original-photo-rim-radius-not-anatomically-bounded');
  const maxRadius=new Float64Array(SECTORS),witness=new Uint8Array(SECTORS);
  const trueBodyContourSegments=[];
  let cutSegments=0,observedPoints=0;
  const push=(wx,wz)=>{
   const dx=wx-x,dz=wz-z,r=Math.hypot(dx,dz);
   if(!finite(r)||r<.015||r>.75)return;
   const angle=(Math.atan2(dx,dz)+2*Math.PI)%(2*Math.PI);
   const bin=Math.round(angle*SECTORS/(2*Math.PI))%SECTORS;
   // Neighbor sectors are enlarged conservatively, never interpolated
   // across an anatomically unobserved sector into fictitious clearance.
   for(const shift of [-1,0,1]){
    const at=(bin+shift+SECTORS)%SECTORS;
    if(r>maxRadius[at])maxRadius[at]=r;
    witness[at]=1;
   }
   observedPoints++;
  };
  for(let t=0;t<faceCount;t++){
   if(coreBodyFaceMask[t]===0)continue;
   const v=[];
   for(let j=0;j<3;j++){
    const k=idx[t*3+j]*3;
    v.push([body[k],body[k+1],body[k+2]]);
   }
   const cuts=[];
   for(const [a,b] of [[0,1],[1,2],[2,0]]){
    const d=v[a][1]-y,e=v[b][1]-y;
    if(d*e>=0)continue;
    const u=-d/(e-d);
    cuts.push([v[a][0]+(v[b][0]-v[a][0])*u,
     v[a][2]+(v[b][2]-v[a][2])*u]);
   }
   if(cuts.length!==2)continue;
   const length=Math.hypot(cuts[0][0]-cuts[1][0],cuts[0][1]-cuts[1][1]);
   if(length<1e-7)continue;
   cutSegments++;
   // Do not use the widened angular-bin approximation as evidence for
   // an exact spoke crossing. Keep only the genuine source triangle-plane
   // intersection endpoints; body vertices are never serialized.
   trueBodyContourSegments.push([
    cuts[0][0],cuts[0][1],cuts[1][0],cuts[1][1]
   ]);
   const steps=Math.max(2,Math.min(32,Math.ceil(length/.005)));
   for(let j=0;j<=steps;j++){
    const t=j/steps;
    push(cuts[0][0]*(1-t)+cuts[1][0]*t,
     cuts[0][1]*(1-t)+cuts[1][1]*t);
   }
  }
  let visible=0,unknown=0,negative=0,near=0,positive=0,
   minGap=null,maximumInward=0;
  let rayRowInward=0,rayRowNear=0,rayRowOutward=0,rayRowUnknown=0,
   rayRowAmbiguous=0,rayRowMinimum=null,rayRowMaximumInward=0;
  for(let j=0;j<SECTORS;j++){
   const k=(row*(SECTORS+1)+j)*3,dx=cloth[k]-x,dz=cloth[k+2]-z,
    radius=Math.hypot(dx,dz);
   if(!finite(radius)||radius<.075||radius>.95)
    return fail('nonphysical-skinned-photographed-garment-ring');

   // A ray in X/Z from the observed skirt ring center to its original
   // photographed garment vertex. Compare with genuine body-face plane
   // segments at the SAME original skinned rig height. This avoids the
   // coarse ±one-bin dilation overstating neighbor-body clearance.
   // It is not raycast volume/inside classification or a watertight body.
   let rayMax=-1,ambiguous=false;
   const ux=dx/radius,uz=dz/radius;
   for(const segment of trueBodyContourSegments){
    const [ax,az,bx,bz]=segment,ex=bx-ax,ez=bz-az,
     px=ax-x,pz=az-z,det=ux*ez-uz*ex;
    if(Math.abs(det)<1e-11){
     // Source contour edge exactly along this radial ray is geometrically
     // ambiguous for an exteriorness decision; do not invent clearance.
     if(Math.abs(px*uz-pz*ux)<1e-9)ambiguous=true;
     continue;
    }
    const t=(px*ez-pz*ex)/det,u=(px*uz-pz*ux)/det;
    if(t>=0&&u>=-1e-9&&u<=1+1e-9&&t<=.75)
     rayMax=Math.max(rayMax,t);
   }
   if(cutSegments<2||ambiguous||rayMax<0){
    rayRowUnknown++;if(ambiguous)rayRowAmbiguous++;
   }else{
    const signedRadialGap=radius-rayMax;
    rayRowMinimum=rayRowMinimum===null?signedRadialGap:
     Math.min(rayRowMinimum,signedRadialGap);
    if(signedRadialGap<-.002){
     rayRowInward++;
     rayRowMaximumInward=Math.max(rayRowMaximumInward,-signedRadialGap);
    }else if(signedRadialGap<=.002)rayRowNear++;
    else rayRowOutward++;
   }

   const angle=(Math.atan2(dx,dz)+2*Math.PI)%(2*Math.PI);
   const bin=Math.round(angle*SECTORS/(2*Math.PI))%SECTORS;
   if(!witness[bin]){unknown++;continue;}
   const gap=radius-maxRadius[bin];
   visible++;
   minGap=minGap===null?gap:Math.min(minGap,gap);
   if(gap<-.002){negative++;maximumInward=Math.max(maximumInward,-gap);}
   else if(gap<=.002)near++;
   else positive++;
  }
  // Source-plane evidence can legitimately be missing for ankle/hem and
  // disconnected leg cavities. Return numbers with UNKNOWN, never fill them.
  if(cutSegments<2||observedPoints<5){
   unknown+=visible;visible=0;negative=0;near=0;positive=0;
   minGap=null;maximumInward=0;
  }
  const stat=Object.freeze({
   sourcePhotoBand:row+1,originalSkirtRingWorldHeightInPublicRigMeters:round(y),
   actualBodyTrianglePlaneCutSegments:cutSegments,
   actualBodyTrianglePlaneObservedPoints:observedPoints,
   observedAngularSectors:visible,unknownAngularSectors:unknown,
   sampledRadialGapInwardBeyond2mm:negative,
   sampledRadialGapWithin2mm:near,
   sampledRadialGapOutwardOver2mm:positive,
   minimumObservedSkirtMinusBodyRadialGapMeters:minGap===null?null:round(minGap),
   maximumObservedRadialInwardDistanceMeters:round(maximumInward),
   exactOriginalIndexedBodyFaceRayContours:true,
   exactRayObservedOutwardSectors:rayRowOutward,
   exactRayObservedNearZeroSectors:rayRowNear,
   exactRayObservedInwardSectors:rayRowInward,
   exactRayUnknownSectors:rayRowUnknown,
   exactRayCollinearAmbiguousSectors:rayRowAmbiguous,
   exactRayMinimumObservedRadialGapMeters:
    rayRowMinimum===null?null:round(rayRowMinimum),
   exactRayMaximumObservedInwardMeters:round(rayRowMaximumInward),
   waistOrHemGarmentPhysicalSizeCalibrated:false
  });
  rows.push(stat);
  candidateRadialInward+=negative;
  observedSectors+=visible;unknownSectors+=unknown;
  bodyPlaneSegmentsTotal+=cutSegments;
  rayInward+=rayRowInward;rayNear+=rayRowNear;
  rayOutward+=rayRowOutward;rayUnknown+=rayRowUnknown;
  rayAmbiguous+=rayRowAmbiguous;rayContours+=trueBodyContourSegments.length;
  if(rayRowMinimum!==null){
   rayMinGap=rayMinGap===null?rayRowMinimum:
    Math.min(rayMinGap,rayRowMinimum);
   rayMaxInward=Math.max(rayMaxInward,rayRowMaximumInward);
  }
  if(minGap!==null){
   smallestObservedGap=smallestObservedGap===null?minGap:Math.min(smallestObservedGap,minGap);
   mostInward=Math.max(mostInward??0,maximumInward);
  }
 }
 if(rows.length!==7||rows.some(x=>
  x.observedAngularSectors+x.unknownAngularSectors!==SECTORS||
  x.exactRayObservedOutwardSectors+x.exactRayObservedNearZeroSectors+
   x.exactRayObservedInwardSectors+x.exactRayUnknownSectors!==SECTORS)||
  rayInward+rayNear+rayOutward+rayUnknown!==RINGS*SECTORS||
  rayAmbiguous>rayUnknown)
  return fail('original-photographed-source-coverage-bookkeeping-invalid');
 return Object.freeze({
  schema:'P89-actual-original-163bone-source-radial-body-gap/v1',
  status:unknownSectors>0&&candidateRadialInward>0?
   'SAMPLED_SOURCE_RADIAL_INWARD_AND_MISSING_BODY_SECTORS_NOT_WEARABLE':
   unknownSectors>0?
    'SAMPLED_SOURCE_RADIAL_BODY_COVERAGE_INCOMPLETE_NOT_WEARABLE':
    candidateRadialInward>0?
     'SAMPLED_SOURCE_RADIAL_INWARD_BODY_OVERLAP_WITNESSED_NOT_WEARABLE':
     'SAMPLED_SOURCE_RADIAL_GAP_OBSERVED_NOT_CLOSED_VOLUME_FIT',
  avatar,pose,sourceId:'commons-0043',originalPhotoSHA256:sourcePhotoSHA256,
  genuineSourceSkinnedPublicModel:true,source163BoneRig:true,
  actualIndexedOriginalBodyFaceCutUsed:true,
  originalTorsoLegSkinWeightedFaceClassificationUsed:true,
  fullUnfilteredOriginalBodyStillRequiresIndependentBVHCheck:true,
  sourceGarmentSevenMeasuredPhotoAlphaBands:true,
  originalSourceGarmentRingAngularSamples:RINGS*SECTORS,
  sampledOutwardBodyGapAngularSectors:observedSectors-candidateRadialInward-
   rows.reduce((n,x)=>n+x.sampledRadialGapWithin2mm,0),
  sampledInwardBodyGapAngularSectors:candidateRadialInward,
  actualModelBasedRadialInwardWitness: candidateRadialInward>0,
  originalBodyAngularSectorEvidenceMissing:unknownSectors>0,
  sampledUnknownBodyGapAngularSectors:unknownSectors,
  originalBodySourcePlaneCutSegmentCount:bodyPlaneSegmentsTotal,
  minimumObservedRadialGapMeters:smallestObservedGap===null?null:round(smallestObservedGap),
  largestObservedRadialInwardDistanceMeters:mostInward===null?null:round(mostInward),
  sevenOriginalSourceSkirtBands:rows,
  // Independent exact horizontal face/plane-ray signals are kept separate
  // from older approximate dilated angular bins. No exact ray intersections
  // is a negative evidence gap, NOT proof that the ray exits the body.
  exactRaySourceFitDisposition:rayInward>0&&rayUnknown>0?
   'EXACT_ORIGINAL_BODY_RAY_INWARD_AND_UNOBSERVED_BLOCKED':
   rayInward>0?'EXACT_ORIGINAL_BODY_RAY_INWARD_BLOCKED':
   rayUnknown>0?'EXACT_ORIGINAL_BODY_RAY_UNOBSERVED_BLOCKED':
   'EXACT_ORIGINAL_BODY_RADIAL_GAP_SAMPLED_NOT_WEARABLE',
  exactRayBodyContourSourceTopology:'ORIGINAL_INDEXED_FACE_HORIZONTAL_PLANE_RAY_INTERSECTION',
  exactRaySampledAngularPositions:RINGS*SECTORS,
  exactRayOriginalBodyContourSegments:rayContours,
  exactRayOutwardSourceSectors:rayOutward,
  exactRayNearSourceSectors:rayNear,
  exactRayInwardSourceSectors:rayInward,
  exactRayUnknownSourceSectors:rayUnknown,
  exactRayCollinearAmbiguousSourceSectors:rayAmbiguous,
  exactRayMinimumObservedSkirtMinusBodyMeters:
   rayMinGap===null?null:round(rayMinGap),
  exactRayMaximumObservedInwardMeters:round(rayMaxInward),
  originalDilationBasedRadialOverlapIsNotExactIntersection:true,
  exactRayWithoutOriginalBodyContourIsUnknownNotSafe:true,
  exactRayCannotCertifyWatertightVolume:true,
  radialWitnessIsNotSignedClosedMeshContainment:true,
  photographicOriginalFrontRGBAndUVUnmodified:true,
  garmentSourceAbsoluteSizeInferredNotMeasured:true,
  originalPhotographedRearAbsent:true,sourceMaskReviewOnly:true,
  humanAppearanceFitApproved:false,continuousMotionSafe:false,
  originalSource2DFallbackRequired:true,originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
