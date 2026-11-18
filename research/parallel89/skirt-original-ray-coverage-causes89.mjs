/**
 * P89: independent original full-GLB vs selected-core indexed anatomical
 * ray comparison on the ACTUAL licensed skirt's seven source photo heights.
 *
 * Cross-checks the older 336-spoke EXACT source-core radial witness using
 * genuinely independent triangle-plane segment intersection calculations.
 * Crucial distinction: no selected-core ray may mean an excluded original
 * source face exists, or that even the WHOLE original source has no ray.
 * Neither case is a signed body, garment clearance, physical sizing or fit.
 *
 * Never alter posed original source arrays, indices, UV, skin or 2D original.
 * Never return original wearer/source body vertices, face IDs or photographs.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const finite=Number.isFinite;
const no=reason=>Object.freeze({
 schema:'P89-original-163bone-whole-vs-core-ray-missing-cause/v1',
 status:'ORIGINAL_WHOLE_VS_SELECTED_CORE_RAY_EVIDENCE_UNVERIFIABLE',
 reason,originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
const names=Object.freeze([
 'CORE_SOURCE_ORIGINAL_RAY_KNOWN',
 'ORIGINAL_CORE_CONTOUR_TOO_FEW_SEGMENTS',
 'CORE_SOURCE_CONTOUR_COLLINEAR_AMBIGUOUS',
 'NO_SELECTED_CORE_ORIGINAL_FACE_RAY',
 'EXCLUDED_ORIGINAL_BODY_SOURCE_FACE_RAY_FOUND',
 'WHOLE_ORIGINAL_BODY_SOURCE_RAY_COLLINEAR_AMBIGUOUS',
 'NO_ORIGINAL_FULL_BODY_INDEXED_FACE_RAY',
 'ORIGINAL_SELECTED_CORE_RAY_WITH_INSUFFICIENT_SEGMENT_SUPPORT'
]);
function ray(segments,x,z,ux,uz){
 let far=-1,ambiguous=false,hitCount=0,outerExcluded=false;
 for(const a of segments){
  const px=a.ax-x,pz=a.az-z,ex=a.bx-a.ax,ez=a.bz-a.az,
   det=ux*ez-uz*ex;
  if(Math.abs(det)<1e-11){
   if(Math.abs(px*uz-pz*ux)<1e-9)ambiguous=true;
   continue;
  }
  const t=(px*ez-pz*ex)/det,u=(px*uz-pz*ux)/det;
  if(t>=0&&u>=-1e-9&&u<=1+1e-9&&t<=.75){
   far=Math.max(far,t);hitCount++;
   if(a.excluded)outerExcluded=true;
  }
 }
 return {far,ambiguous,hitCount,outerExcluded};
}
const countMap=()=>Object.fromEntries(names.map(n=>[n,0]));
export function auditOriginalWholeBodyCoreRayCauses89({
 skirtPositions,skirtIndices,bodyPositions,bodyIndices,coreBodyFaceMask,
 avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
 originalRig163Bones,selectedActualWebGLPreview,
 selectedFivePoseBvhVerified,priorExactRadialReceipt
}={}){
 if(!Object.hasOwn(RIG,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO||sourceAnatomyGLBSHA256!==RIG[avatar]||
  originalRig163Bones!==true||selectedActualWebGLPreview!==true||
  selectedFivePoseBvhVerified!==true)
  return no('real-original-source-photo-and-163bone-selected-rig-proof-required');
 const cloth=skirtPositions,body=bodyPositions,si=skirtIndices,
  ix=bodyIndices,mask=coreBodyFaceMask,prior=priorExactRadialReceipt;
 if(!(cloth instanceof Float32Array)||cloth.length!==1029||
  !(si instanceof Uint16Array||si instanceof Uint32Array)||si.length!==1728||
  !(body instanceof Float32Array)||body.length<900||
  body.length>2_100_000||body.length%3!==0||
  !(ix instanceof Uint16Array||ix instanceof Uint32Array)||
  ix.length<300||ix.length>3_000_000||ix.length%3!==0||
  !(mask instanceof Uint8Array)||mask.length!==ix.length/3||
  !mask.includes(0)||!mask.includes(1)||
  mask.some(x=>x!==0&&x!==1)||
  prior?.schema!=='P89-actual-original-163bone-source-radial-body-gap/v1'||
  prior.avatar!==avatar||prior.pose!==pose||
  prior.originalPhotoSHA256!==PHOTO||
  prior.source163BoneRig!==true||
  prior.consumer3DAdmitted!==false||prior.releaseAuthorized!==false||
  !Array.isArray(prior.sevenOriginalSourceSkirtBands)||
  prior.sevenOriginalSourceSkirtBands.length!==7||
  prior.exactRaySampledAngularPositions!==336)
  return no('immutable-original-indexed-face-and-independent-exact-ray-receipt-required');
 for(const v of cloth)if(!finite(v))return no('nonfinite-original-skirt-source-geometry');
 for(const v of body)if(!finite(v))return no('nonfinite-original-163bone-source-body-geometry');
 for(const v of si)if(v>=343)return no('invalid-original-photographed-skirt-index');
 for(const v of ix)if(v>=body.length/3)return no('invalid-original-163bone-source-body-index');
 const totals=countMap(),rows=[];
 let sumCoreIn=0,sumCoreNear=0,sumCoreOut=0,sumCoreUnknown=0,
  sumWholeKnown=0,sumWholeUnknown=0,wholeInward=0;
 for(let band=0;band<7;band++){
  const k=band*49*3,op=(band*49+24)*3,
   x=(cloth[k]+cloth[op])/2,z=(cloth[k+2]+cloth[op+2])/2,
   y=(cloth[k+1]+cloth[op+1])/2;
  if(!finite(y)||y<.15||y>2.6||Math.abs(cloth[k+1]-cloth[op+1])>.025)
   return no('source-photo-7height-plane-invalid');
  // Two opposite source vertices alone do not establish that the other 47
  // skinned skirt ring spokes share the body plane used by every ray.
  // Reject samples exceeding the original 25 mm ring-level tolerance.
  let minRingY=Infinity,maxRingY=-Infinity;
  for(let spoke=0;spoke<=48;spoke++){
   const height=cloth[(band*49+spoke)*3+1];
   minRingY=Math.min(minRingY,height);
   maxRingY=Math.max(maxRingY,height);
  }
  if(maxRingY-minRingY>.025)
   return no('posed-photo-skirt-ring-slice-not-planar');
  const seg=[];
  let coreCuts=0,wholeCuts=0,excludedCuts=0;
  for(let f=0;f<ix.length/3;f++){
   const v=[];
   for(let j=0;j<3;j++){
    const at=3*ix[3*f+j];v.push([body[at],body[at+1],body[at+2]]);
   }
   const pts=[];
   for(const [a,b] of [[0,1],[1,2],[2,0]]){
    const d=v[a][1]-y,e=v[b][1]-y;
    if(d*e>=0)continue;
    const fraction=-d/(e-d);
    pts.push([v[a][0]+(v[b][0]-v[a][0])*fraction,
     v[a][2]+(v[b][2]-v[a][2])*fraction]);
   }
   if(pts.length!==2||Math.hypot(pts[0][0]-pts[1][0],
    pts[0][1]-pts[1][1])<1e-7)continue;
   const excluded=mask[f]===0;
   seg.push({ax:pts[0][0],az:pts[0][1],bx:pts[1][0],bz:pts[1][1],excluded});
   wholeCuts++;if(excluded)excludedCuts++;else coreCuts++;
  }
  const coreSeg=seg.filter(s=>!s.excluded);
  const part=countMap();
  let ri=0,rn=0,ro=0,ru=0,allKnown=0,allUnknown=0,wi=0;
  let maxWholeInward=0,minKnownCoreGap=null,largestCoreInward=0;
  for(let j=0;j<48;j++){
   const at=3*(band*49+j),dx=cloth[at]-x,dz=cloth[at+2]-z,
    rr=Math.hypot(dx,dz);
   if(!finite(rr)||rr<.075||rr>.95)
    return no('unmeasured-real-source-garment-radial-world-geometry-invalid');
   const ux=dx/rr,uz=dz/rr,c=ray(coreSeg,x,z,ux,uz),
    full=ray(seg,x,z,ux,uz);
   const coreEvidence=coreCuts>=2&&!c.ambiguous&&c.far>=0;
   const fullEvidence=wholeCuts>=2&&!full.ambiguous&&full.far>=0;
   if(coreEvidence){
    part.CORE_SOURCE_ORIGINAL_RAY_KNOWN++;
    const gap=rr-c.far;
    minKnownCoreGap=minKnownCoreGap===null?gap:Math.min(minKnownCoreGap,gap);
    if(gap<-.002){ri++;largestCoreInward=Math.max(largestCoreInward,-gap);}
    else if(gap<=.002)rn++;
    else ro++;
   }else{
    ru++;
    if(coreCuts<2)part.ORIGINAL_CORE_CONTOUR_TOO_FEW_SEGMENTS++;
    else if(c.ambiguous)part.CORE_SOURCE_CONTOUR_COLLINEAR_AMBIGUOUS++;
    else part.NO_SELECTED_CORE_ORIGINAL_FACE_RAY++;
    if(fullEvidence){
     // An unfiltered body ray may be arm/head or separate source mesh.
     // Count it as mask-excluded source evidence, NEVER as torso fit.
     if(full.outerExcluded)part.EXCLUDED_ORIGINAL_BODY_SOURCE_FACE_RAY_FOUND++;
     else part.ORIGINAL_SELECTED_CORE_RAY_WITH_INSUFFICIENT_SEGMENT_SUPPORT++;
    }else if(full.ambiguous)
     part.WHOLE_ORIGINAL_BODY_SOURCE_RAY_COLLINEAR_AMBIGUOUS++;
    else part.NO_ORIGINAL_FULL_BODY_INDEXED_FACE_RAY++;
   }
   if(fullEvidence){
    allKnown++;
    if(rr-full.far<-.002){wi++;maxWholeInward=Math.max(maxWholeInward,full.far-rr);}
   }else allUnknown++;
  }
  if(ri+rn+ro+ru!==48||allKnown+allUnknown!==48||
   part.CORE_SOURCE_ORIGINAL_RAY_KNOWN!==ri+rn+ro||
   part.EXCLUDED_ORIGINAL_BODY_SOURCE_FACE_RAY_FOUND+
    part.ORIGINAL_SELECTED_CORE_RAY_WITH_INSUFFICIENT_SEGMENT_SUPPORT+
    part.WHOLE_ORIGINAL_BODY_SOURCE_RAY_COLLINEAR_AMBIGUOUS+
    part.NO_ORIGINAL_FULL_BODY_INDEXED_FACE_RAY!==ru||
   part.ORIGINAL_CORE_CONTOUR_TOO_FEW_SEGMENTS+
    part.CORE_SOURCE_CONTOUR_COLLINEAR_AMBIGUOUS+
    part.NO_SELECTED_CORE_ORIGINAL_FACE_RAY!==ru)
   return no('core-vs-whole-original-indexed-ray-conservation-failed');
  const q=prior.sevenOriginalSourceSkirtBands[band];
  if(q.exactRayObservedInwardSectors!==ri||
   q.exactRayObservedNearZeroSectors!==rn||
   q.exactRayObservedOutwardSectors!==ro||
   q.exactRayUnknownSectors!==ru||
   q.actualBodyTrianglePlaneCutSegments!==coreCuts)
   return no('independent-original-core-exact-ray-evidence-mismatch');
  for(const key of names)totals[key]+=part[key];
  sumCoreIn+=ri;sumCoreNear+=rn;sumCoreOut+=ro;sumCoreUnknown+=ru;
  sumWholeKnown+=allKnown;sumWholeUnknown+=allUnknown;wholeInward+=wi;
  rows.push(Object.freeze({
   originalSkirtPhotoHeightBand:band+1,
   actualSourceCoreTrianglePlaneSegments:coreCuts,
   actualSourceExcludedOriginalFacePlaneSegments:excludedCuts,
   actualWholeOriginalBodyTrianglePlaneSegments:wholeCuts,
   originalCoreExactInwardSectors:ri,originalCoreExactNearSectors:rn,
   originalCoreExactOutwardSectors:ro,originalCoreExactUnknownSectors:ru,
   allIndexedBodyObservedSectors:allKnown,
   allIndexedBodyUnobservedSectors:allUnknown,
   wholeSourceBodyInwardRaySectors:wi,
   maximumWholeSourceBodyInwardRayMeters:Math.round(maxWholeInward*1e5)/1e5,
   sourceCoreMinimumObservedRadialGapMeters:
    minKnownCoreGap===null?null:Math.round(minKnownCoreGap*1e5)/1e5,
   sourceCoreLargestInwardOverlapMeters:
    Math.round(largestCoreInward*1e5)/1e5,
   sourceOriginalRayCauseCounts:Object.freeze(part),
   excludedSourceFaceRaysCannotProveCoreBodyExterior:true
  }));
 }
 if(rows.length!==7||sumCoreIn!==prior.exactRayInwardSourceSectors||
  sumCoreNear!==prior.exactRayNearSourceSectors||
  sumCoreOut!==prior.exactRayOutwardSourceSectors||
  sumCoreUnknown!==prior.exactRayUnknownSourceSectors||
  Object.values(totals).slice(0,1)[0]!==sumCoreIn+sumCoreNear+sumCoreOut||
  sumWholeKnown+sumWholeUnknown!==336||
  totals.EXCLUDED_ORIGINAL_BODY_SOURCE_FACE_RAY_FOUND+
   totals.ORIGINAL_SELECTED_CORE_RAY_WITH_INSUFFICIENT_SEGMENT_SUPPORT+
   totals.WHOLE_ORIGINAL_BODY_SOURCE_RAY_COLLINEAR_AMBIGUOUS+
   totals.NO_ORIGINAL_FULL_BODY_INDEXED_FACE_RAY!==sumCoreUnknown)
  return no('original-source-seven-ring-whole-vs-core-receipts-not-conserved');
 return Object.freeze({
  schema:'P89-original-163bone-whole-vs-core-ray-missing-cause/v1',
  status:'ORIGINAL_SOURCE_BODY_RAY_COVERAGE_CAUSES_MEASURED_NO_FIT_AUTHORIZED',
  avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  actualOriginalModelBoneCount:163,
  sevenActualSourcePhotographedSkirtHeightBands:7,
  originalPhotoSkirtRaySectors:336,
  independentlyMatchedExactOriginalCoreRayReceipt:true,
  actualOriginalWholeBodySourceIndexedFacesIncluded:true,
  coreSelectedOriginalFaceMaskComparedWithoutModifyingIt:true,
  originalCoreSourceExactInwardRaySectors:sumCoreIn,
  originalCoreSourceExactNearRaySectors:sumCoreNear,
  originalCoreSourceExactOutwardRaySectors:sumCoreOut,
  originalCoreSourceExactUnknownRaySectors:sumCoreUnknown,
  originalWholeSourceRayObservedSectors:sumWholeKnown,
  originalWholeSourceRayUnobservedSectors:sumWholeUnknown,
  originalWholeSourceRayInwardSectors:wholeInward,
  sourceCoreRayMissingReasonTotals:Object.freeze(totals),
  sevenSourceOriginalBodyRayCauseBands:Object.freeze(rows),
  unfilteredBodySourceRayMayBeHeadArmOrMultipleSkinMeshes:true,
  originalBodySignedVolumeUnavailable:true,
  originalSourcePhotosDoNotProveGarmentBack:true,
  originalGarmentAbsoluteDimensionsNotMeasured:true,
  observedInwardRayIsGeometricNotSweptOrSignedContainment:true,
  noOriginalFaceIndicesOrVertexCoordinatesReleased:true,
  originalBodiesAndSkirtMeshesRemainImmutable:true,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
