/**
 * M2 P89 — DISENTANGLE missing original skirt→torso/hip/leg ray contours.
 *
 * Independent original indexed-face plane cutter, with disjoint reason
 * codes for each of seven source rings x 48 original photographed skirt
 * spokes. A missing source core ray intersection is UNKNOWN, not an
 * exterior fit. Excluded head/arm, unknown source bones, and bone-mask
 * excluded original triangles are counted as independent *possible*
 * source geometry observations, not secretly treated as valid core.
 *
 * All original CC0 P541 163-bone body/Commons-0043 photo source buffers
 * remain read-only; no triangulation repairs, UV seams welded, invented
 * physical size/back garment or consumer admit/deploy.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const validIndex=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const sum=values=>values.reduce((n,x)=>n+x,0);
const allowedLabel=x=>typeof x==='string'&&x.length>0&&x.length<=96&&
 /^[\x20-\x7e]+$/.test(x);
const reasons=Object.freeze([
 'INVALID_ORIGINAL_SKIRT_RADIUS',
 'COLLINEAR_OR_PARALLEL_CORE_SEGMENT',
 'NO_VERIFIED_CORE_SEGMENT_AT_SKIRT_BAND',
 'NO_CORE_FACE_INTERSECTION_IN_RAY_DIRECTION'
]);
const categories=Object.freeze([
 'CORE_TORSO_HIPS_LEGS','EXCLUDED_HEAD_ARMS',
 'UNKNOWN_ORIGINAL_DOMINANT_BONE','EXCLUDED_ORIGINAL_CORE_FACE_MASK',
 'CROSS_ORIGINAL_SOURCE_MESH'
]);
const fail=reason=>Object.freeze({
 schema:'P89-source-locked-skirt-core-unknown-ray-cause-v1',
 status:'SOURCE_CORE_RAY_CAUSE_OR_PROVENANCE_UNVERIFIABLE',
 reason,originalPhoto2DFallbackRequired:true,
 noOriginalBodyMeshChanged:true,closedBodyVolumeCertified:false,
 signedExteriorContainmentCertified:false,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
function nameRegion(n){
 const l=n.toLowerCase();
 if(/hand|finger|thumb|arm|forearm|shoulder|clavic|elbow|wrist|head|neck|eye|ear|face|jaw/.test(l))
  return 'EXCLUDED_HEAD_ARMS';
 if(/foot|toe|ankle|knee|calf|shin|thigh|upleg|lowleg|leg|heel/.test(l))
  return 'CORE_LEGS';
 if(/pelv|hip|spine|chest|torso|abdomen|back|waist|butt|root/.test(l))
  return 'CORE_TORSO_HIPS';
 return 'UNKNOWN_ORIGINAL_BONE';
}
function planeCuts(p,a,b,c,y){
 const ids=[a,b,c],v=[];
 for(let j=0;j<3;j++){
  const q=ids[j],r=ids[(j+1)%3],y0=p[q*3+1],y1=p[r*3+1];
  if(Math.abs(y1-y0)<1e-10)continue;
  const f=(y-y0)/(y1-y0);
  if(f<0||f>1)continue;
  const x=p[q*3]+f*(p[r*3]-p[q*3]),
   z=p[q*3+2]+f*(p[r*3+2]-p[q*3+2]);
  if(!v.some(t=>Math.hypot(x-t[0],z-t[1])<1e-7))
   v.push([x,z]);
 }
 return v.length===2?[v[0][0],v[0][1],v[1][0],v[1][1]]:null;
}
function cast(segs,cx,cz,ux,uz){
 let far=-1,ambiguous=false;
 for(let k=0;k<segs.length;k++){
  const [ax,az,bx,bz]=segs[k],
   ex=bx-ax,ez=bz-az,px=ax-cx,pz=az-cz,
   det=ux*ez-uz*ex;
  if(Math.abs(det)<1e-11){
   if(Math.abs(px*uz-pz*ux)<1e-9)ambiguous=true;
   continue;
  }
  const t=(px*ez-pz*ex)/det,v=(px*uz-pz*ux)/det;
  if(t>=0&&t<=3&&v>=-1e-9&&v<=1+1e-9)
   far=Math.max(far,t);
 }
 return {farthest:far,parallelAmbiguous:ambiguous,hasHit:far>=0};
}
const emptyReasons=()=>Object.fromEntries(reasons.map(x=>[x,0]));
const emptyCategories=()=>Object.fromEntries(categories.filter(x=>
 x!=='CORE_TORSO_HIPS_LEGS').map(x=>[x,0]));
const axis=(x,z)=>Math.abs(x)>=Math.abs(z)?
 x>=0?'SOURCE_PLUS_X':'SOURCE_MINUS_X':
 z>=0?'SOURCE_PLUS_Z':'SOURCE_MINUS_Z';
const emptyAxis=()=>({
 SOURCE_PLUS_X:0,SOURCE_MINUS_X:0,SOURCE_PLUS_Z:0,SOURCE_MINUS_Z:0
});
/** A pure, synthetic-fixture-testable original source measurement.
 * This is NOT itself an original GLB authenticity certificate. */
export function summarizeOriginalSkirtCoreUnknownCauses89({
 bodyPositions,bodyIndices,skirtPositions,skirtIndices,
 coreBodyFaceMask,skinIndices,skinWeights,sourceMeshIds,
 sourceMeshNames,sourceBoneNamesByMesh
}={}){
 if(!(bodyPositions instanceof Float32Array)||
  bodyPositions.length<12||bodyPositions.length%3!==0||
  bodyPositions.length>2_100_000||
  !validIndex(bodyIndices)||bodyIndices.length<6||
  bodyIndices.length%3!==0||bodyIndices.length>3_000_000||
  !(skirtPositions instanceof Float32Array)||
  skirtPositions.length!==343*3||
  !validIndex(skirtIndices)||skirtIndices.length!==576*3||
  !(coreBodyFaceMask instanceof Uint8Array)||
  coreBodyFaceMask.length!==bodyIndices.length/3||
  !(skinIndices instanceof Uint16Array)||
  skinIndices.length!==bodyPositions.length/3*4||
  !(skinWeights instanceof Float32Array)||
  skinWeights.length!==skinIndices.length||
  !(sourceMeshIds instanceof Uint16Array)||
  sourceMeshIds.length!==bodyPositions.length/3||
  !Array.isArray(sourceMeshNames)||sourceMeshNames.length===0||
  sourceMeshNames.length>256||sourceMeshNames.some(x=>!allowedLabel(x))||
  !Array.isArray(sourceBoneNamesByMesh)||
  sourceBoneNamesByMesh.length!==sourceMeshNames.length||
  sourceBoneNamesByMesh.some(x=>!Array.isArray(x)||x.length!==163||
   x.some(n=>!allowedLabel(n))))
  throw Error('bounded-original-163bone-skirt-core-source-required');
 const vertices=bodyPositions.length/3,faces=bodyIndices.length/3;
 for(const x of bodyPositions)if(!finite(x))throw Error('invalid-original-body-world-coordinates');
 for(const x of skirtPositions)if(!finite(x))throw Error('invalid-original-skirt-world-coordinates');
 for(const i of bodyIndices)if(i>=vertices)throw Error('original-body-index-invalid');
 for(const i of skirtIndices)if(i>=343)throw Error('original-skirt-index-invalid');
 if(coreBodyFaceMask.some(x=>x!==0&&x!==1))
  throw Error('original-anatomy-core-face-mask-invalid');
 const regions=new Array(vertices),dominantNames=new Array(vertices),
  dominantBoneIndices=new Array(vertices);
 for(let v=0;v<vertices;v++){
  const mesh=sourceMeshIds[v];if(mesh>=sourceMeshNames.length)
   throw Error('original-body-mesh-id-out-of-range');
  let total=0,max=-1,dominant=0;
  for(let k=0;k<4;k++){
   const ix=v*4+k,w=skinWeights[ix],bone=skinIndices[ix];
   if(!finite(w)||w<0||w>1||bone>=163)
    throw Error('original-bone-skin-weights-invalid');
   total+=w;if(w>max){max=w;dominant=bone;}
  }
  if(Math.abs(total-1)>.003)
   throw Error('original-bone-weight-sum-not-normalized');
  dominantBoneIndices[v]=dominant;
  dominantNames[v]=max<.5?'AMBIGUOUS_ORIGINAL_SKIN_WEIGHTS':
   sourceBoneNamesByMesh[mesh][dominant];
  regions[v]=max<.5?'UNKNOWN_ORIGINAL_BONE':
   nameRegion(dominantNames[v]);
 }
 const sourceFacets=[];
 for(let f=0;f<faces;f++){
  const a=bodyIndices[3*f],b=bodyIndices[3*f+1],c=bodyIndices[3*f+2];
  let kind='CORE_TORSO_HIPS_LEGS';
  if(sourceMeshIds[a]!==sourceMeshIds[b]||
   sourceMeshIds[b]!==sourceMeshIds[c])kind='CROSS_ORIGINAL_SOURCE_MESH';
  else if([regions[a],regions[b],regions[c]].includes('EXCLUDED_HEAD_ARMS'))
   kind='EXCLUDED_HEAD_ARMS';
  else if([regions[a],regions[b],regions[c]].includes('UNKNOWN_ORIGINAL_BONE'))
   kind='UNKNOWN_ORIGINAL_DOMINANT_BONE';
  else if(coreBodyFaceMask[f]!==1)kind='EXCLUDED_ORIGINAL_CORE_FACE_MASK';
  const ymin=Math.min(bodyPositions[a*3+1],bodyPositions[b*3+1],
   bodyPositions[c*3+1]),
   ymax=Math.max(bodyPositions[a*3+1],bodyPositions[b*3+1],
    bodyPositions[c*3+1]);
  sourceFacets.push({a,b,c,kind,ymin,ymax,
   sourceMeshIds:[sourceMeshIds[a],sourceMeshIds[b],sourceMeshIds[c]],
   sourceDominantBoneNames:[dominantNames[a],dominantNames[b],dominantNames[c]],
   sourceDominantBoneIndices:[dominantBoneIndices[a],
    dominantBoneIndices[b],dominantBoneIndices[c]]});
 }
 const allRows=[],totals=emptyReasons(),axes=emptyAxis(),
  allExcludedHits=emptyCategories(),noSourceHitAxes=emptyAxis(),
  excludedMeshRayWitnesses=new Map(),excludedBoneRayWitnesses=new Map(),
  noSourceHitRuns=[];
 let inward=0,outward=0,near=0,unknown=0,
  unknownWithAnyExcludedBodyHit=0,unknownWithoutAnyBodyContourHit=0,
  totalSourceFaceSegments=0,sourceCoreFaceSegments=0,
  skirtMin=Infinity,skirtMax=-Infinity;
 for(let i=1;i<skirtPositions.length;i+=3){
  skirtMin=Math.min(skirtMin,skirtPositions[i]);
  skirtMax=Math.max(skirtMax,skirtPositions[i]);
 }
 const height=skirtMax-skirtMin;
 if(height<.06||height>2.5)throw Error('original-photographed-skirt-height-unbounded');
 for(let row=0;row<7;row++){
  let cx=0,cz=0,y=0;
  for(let j=0;j<48;j++){
   const p=(row*49+j)*3;
   cx+=skirtPositions[p];cz+=skirtPositions[p+2];y+=skirtPositions[p+1];
  }
  cx/=48;cz/=48;y/=48;
  const byKind=Object.fromEntries(categories.map(t=>[t,[]]));
  const byKindIndexed=Object.fromEntries(categories.map(t=>[t,[]]));
  for(const f of sourceFacets){
   if(f.ymin>y||f.ymax<y)continue;
   const cut=planeCuts(bodyPositions,f.a,f.b,f.c,y);
   if(cut){byKind[f.kind].push(cut);byKindIndexed[f.kind].push({cut,facet:f});}
  }
  let bandIn=0,bandOut=0,bandNear=0,bandUnknown=0,
   bandAnyExcluded=0,bandNone=0;
  const bandReasons=emptyReasons(),bandAxes=emptyAxis(),
   bandExcluded=emptyCategories(),noHitFlags=new Array(48).fill(false);
  const core=byKind.CORE_TORSO_HIPS_LEGS;
  const observedByKind=Object.fromEntries(categories.map(x=>[x,byKind[x].length]));
  sourceCoreFaceSegments+=core.length;
  totalSourceFaceSegments+=Object.values(observedByKind).reduce((a,b)=>a+b,0);
  for(let j=0;j<48;j++){
   const s=(row*49+j)*3,dx=skirtPositions[s]-cx,
    dz=skirtPositions[s+2]-cz,radius=Math.hypot(dx,dz);
   let reason=null,castCore=null,ux=0,uz=0;
   if(!(radius>.005&&radius<3))
    reason='INVALID_ORIGINAL_SKIRT_RADIUS';
   else{
    ux=dx/radius;uz=dz/radius;
    castCore=cast(core,cx,cz,ux,uz);
    if(castCore.parallelAmbiguous)
     reason='COLLINEAR_OR_PARALLEL_CORE_SEGMENT';
    else if(core.length===0)
     reason='NO_VERIFIED_CORE_SEGMENT_AT_SKIRT_BAND';
    else if(!castCore.hasHit)
     reason='NO_CORE_FACE_INTERSECTION_IN_RAY_DIRECTION';
   }
   if(reason!==null){
    bandUnknown++;bandReasons[reason]++;totals[reason]++;
    const direction=axis(dx,dz);bandAxes[direction]++;axes[direction]++;
    // Other anatomical planes can be observed only as independently
    // excluded source triangles; they CANNOT "repair" a missing CORE ray.
    let anyExcluded=false;
    const rayMeshes=new Map(),rayBones=new Map();
    if(radius>.005&&radius<3){
     for(const kind of categories.slice(1)){
      if(cast(byKind[kind],cx,cz,ux,uz).hasHit){
       bandExcluded[kind]++;allExcludedHits[kind]++;anyExcluded=true;
       // Count each exact public mesh/bone label ONCE per ray direction,
       // not once per repeated indexed triangle or UV seam.
       for(const {cut,facet} of byKindIndexed[kind]){
        if(!cast([cut],cx,cz,ux,uz).hasHit)continue;
        for(let v=0;v<3;v++){
         const sourceMeshId=facet.sourceMeshIds[v],
          sourceMeshName=sourceMeshNames[sourceMeshId],
          sourceBoneName=facet.sourceDominantBoneNames[v],
          sourceBoneIndex=facet.sourceDominantBoneIndices[v];
         rayMeshes.set(kind+'|'+sourceMeshId,
          {kind,sourceMeshId,sourceMeshName});
         rayBones.set(kind+'|'+sourceMeshId+'|'+sourceBoneIndex+'|'+sourceBoneName,
          {kind,sourceMeshId,sourceMeshName,sourceBoneIndex,
           sourceBoneName,
           // Original native loader substitutes SOURCE_BONE_n if blank;
           // that is not an independently verified actual GLB bone name.
           sourceNameRequiresReview:/^SOURCE_BONE_[0-9]+$/.test(sourceBoneName)||
            sourceBoneName==='AMBIGUOUS_ORIGINAL_SKIN_WEIGHTS'});
        }
       }
      }
     }
    }
    for(const [key,entry] of rayMeshes){
     const prior=excludedMeshRayWitnesses.get(key);
     excludedMeshRayWitnesses.set(key,{...entry,
      unknownRayDirections:(prior?.unknownRayDirections||0)+1});
    }
    for(const [key,entry] of rayBones){
     const prior=excludedBoneRayWitnesses.get(key);
     excludedBoneRayWitnesses.set(key,{...entry,
      unknownRayDirections:(prior?.unknownRayDirections||0)+1});
    }
    if(anyExcluded){bandAnyExcluded++;unknownWithAnyExcludedBodyHit++;}
    else{
     bandNone++;unknownWithoutAnyBodyContourHit++;
     noHitFlags[j]=true;noSourceHitAxes[axis(dx,dz)]++;
    }
    continue;
   }
   const gap=radius-castCore.farthest;
   if(gap<-.002){bandIn++;inward++;}
   else if(gap<=.002){bandNear++;near++;}
   else{bandOut++;outward++;}
  }
  if(bandIn+bandOut+bandNear+bandUnknown!==48||
   Object.values(bandReasons).reduce((n,x)=>n+x,0)!==bandUnknown||
   Object.values(bandAxes).reduce((n,x)=>n+x,0)!==bandUnknown||
   bandAnyExcluded+bandNone!==bandUnknown)
   throw Error('skirt-source-band-unknown-cause-accounting-failed');
  // Angular gaps are source-model sectors, not photographed front/back.
  let longestNoHit=0,run=0;
  const noHitCount=noHitFlags.filter(Boolean).length;
  for(let j=0;j<(noHitCount===48?48:96);j++){
   run=noHitFlags[j%48]?Math.min(48,run+1):0;
   longestNoHit=Math.max(longestNoHit,run);
  }
  noSourceHitRuns.push(Object.freeze({
   originalSkirtBand:row,noOriginalIndexedBodyFaceHitRays:noHitCount,
   longestCircularConsecutiveNoHitSectors:longestNoHit
  }));
  allRows.push(Object.freeze({
   originalSkirtBand:row,originalOriginalBodyCoreSegments:core.length,
   originalSourceAllAnatomyCutSegments:sum(Object.values(observedByKind)),
   sourceFaceContourSegmentsByProvenance:observedByKind,
   originalCoreInward:bandIn,originalCoreOutward:bandOut,
   originalCoreNear:bandNear,originalCoreUnknown:bandUnknown,
   unknownCausesByOriginalSkirtBand:bandReasons,
   unknownSkirtAxisDirectionGroups:bandAxes,
   otherExcludedSourceFaceRayHitWitnesses:bandExcluded,
   unknownRaysWithAnyExcludedAnatomyRayHit:bandAnyExcluded,
   unknownRaysWithoutAnyBodyFaceRayHit:bandNone,
   signedBodyVolumeNeverCertified:true
  }));
  unknown+=bandUnknown;
 }
 if(inward+outward+near+unknown!==336||allRows.length!==7||
  sum(Object.values(totals))!==unknown||
  sum(Object.values(axes))!==unknown||
  sum(Object.values(noSourceHitAxes))!==unknownWithoutAnyBodyContourHit||
  noSourceHitRuns.reduce((n,x)=>n+x.noOriginalIndexedBodyFaceHitRays,0)!==
   unknownWithoutAnyBodyContourHit||
  [...excludedMeshRayWitnesses.values()].some(x=>
   x.unknownRayDirections>unknownWithAnyExcludedBodyHit)||
  unknownWithAnyExcludedBodyHit+unknownWithoutAnyBodyContourHit!==unknown)
  throw Error('skirt-core-unknown-causes-not-conserved');
 return Object.freeze({
  schema:'P89-pure-original-skirt-core-ray-missing-contour-causes/v1',
  originalBodyFullIndexedTriangleCount:faces,
  originalPhotographedSkirtIndexedTriangleCount:skirtIndices.length/3,
  trueOriginalSourceRingRayCount:336,
  originalSkirtSourceBandCount:7,
  strictCoreInwardRays:inward,strictCoreOutwardRays:outward,
  strictCoreNearRays:near,strictCoreUnknownRays:unknown,
  strictCoreUnknownCauseTotals:totals,
  strictCoreUnknownBySourceAxes:axes,
  strictCoreUnknownExcludedSourceFaceHitCounts:allExcludedHits,
  originalSourceCorePlaneCutSegments:sourceCoreFaceSegments,
  allOriginalAnatomyPlaneCutSegments:totalSourceFaceSegments,
  unknownRaysWithExcludedSourceFaceWitness:unknownWithAnyExcludedBodyHit,
  unknownRaysWithNoObservedOriginalBodyFaceWitness:unknownWithoutAnyBodyContourHit,
  unknownWithNoOriginalIndexedFaceByModelAxes:noSourceHitAxes,
  unknownWithNoOriginalIndexedFaceCircularRunsByBand:noSourceHitRuns,
  // Original public source GLB names only. Multiple bones/meshes may be
  // witnessed on ONE direction: individual name tallies do NOT add up to
  // the 69/75 rays, nor certify anatomy, garment clearance or fitted 3D.
  originalExcludedSourceMeshRayNames:[...excludedMeshRayWitnesses.values()].sort(
   (a,b)=>b.unknownRayDirections-a.unknownRayDirections||
    a.kind.localeCompare(b.kind)||a.sourceMeshId-b.sourceMeshId),
  originalExcludedSourceBoneRayNames:[...excludedBoneRayWitnesses.values()].sort(
   (a,b)=>b.unknownRayDirections-a.unknownRayDirections||
    a.kind.localeCompare(b.kind)||a.sourceBoneName.localeCompare(b.sourceBoneName)),
  sourceDominantBoneNamesAreHeuristicNotVerifiedAnatomicalRegions:true,
  sourceSevenSkirtBandCauseBreakdown:allRows,
  independentRayCauseCountsReconcile:true,
  originalAnatomyExclusionIsNotAValidCoreFitRepair:true,
  sourceBodyAllIndexedFacesNeverModified:true,
  sourceBodyNotProvenClosedSignedVolume:true,
  originalGarmentPhysicalSizeNotMeasured:true,
  sourceGarmentRearPhotoUnobserved:true,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false
 });
}
export function auditOriginalSkirtCoreRayUnknownCauses89(args={}){
 const {avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  originalRig163Bones,selectedMeasuredFivePoseBvh,selectedActualWebGLPreview,
  independentlyVerifiedCoreSpanReport}=args;
 if(!Object.hasOwn(RIG,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO||sourceAnatomyGLBSHA256!==RIG[avatar]||
  originalRig163Bones!==true||selectedMeasuredFivePoseBvh!==true||
  selectedActualWebGLPreview!==true||
  independentlyVerifiedCoreSpanReport?.schema!==
   'P89-pure-original-skirt-specific-anatomical-core-shell-roi/v1'||
  independentlyVerifiedCoreSpanReport?.originalSourceSkirtCoreTrueRayTests!==336||
  independentlyVerifiedCoreSpanReport?.originalCoreBodyFaceSetIsNotWatertightClosedVolume!==true)
  return fail('verified-original-skirt-body-and-actual-core-span-receipt-required');
 try{
  const detail=summarizeOriginalSkirtCoreUnknownCauses89(args);
  const prev=independentlyVerifiedCoreSpanReport;
  if(detail.originalBodyFullIndexedTriangleCount!==
   prev.originalBodyFullIndexedTriangleCount||
   detail.strictCoreUnknownRays!==prev.originalSourceSkirtCoreUnobservedRays||
   detail.strictCoreInwardRays!==prev.originalSourceSkirtCoreInwardRays||
   detail.strictCoreOutwardRays!==prev.originalSourceSkirtCoreOutwardRays||
   detail.strictCoreNearRays!==prev.originalSourceSkirtCoreNearZeroRays||
   detail.sourceSevenSkirtBandCauseBreakdown.some((row,i)=>
    row.originalCoreUnknown!==prev.sourceSkirtCoreSevenBandReceipts[i]?.coreSourceUnknownRays||
    row.originalCoreInward!==prev.sourceSkirtCoreSevenBandReceipts[i]?.coreSourceInwardRays||
    row.originalCoreOutward!==prev.sourceSkirtCoreSevenBandReceipts[i]?.coreSourceOutwardRays||
    row.originalCoreNear!==prev.sourceSkirtCoreSevenBandReceipts[i]?.coreSourceNearZeroRays))
   return fail('original-core-source-ray-causes-do-not-agree-with-independent-previous-core-measurement');
  return Object.freeze({
   schema:'P89-source-locked-skirt-core-unknown-ray-cause/v1',
   status:detail.strictCoreUnknownRays>0?
    'ORIGINAL_CORE_UNOBSERVED_DIRECTION_CAUSES_IDENTIFIED_NOT_FIT':
    'SAMPLED_ORIGINAL_CORE_RAYS_OBSERVED_STILL_NOT_SIGNED_VOLUME',
   avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
   originalSkirtCoreUnknownCauseEvidence:detail,
   independentlyCrossCheckedEachOf336SourceRays:true,
   noOriginalSourceGeometryModified:true,
   originalPhoto2DFallbackRequired:true,
   closedBodyVolumeCertified:false,signedExteriorContainmentCertified:false,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const expected=[
   'bounded-original-163bone-skirt-core-source-required',
   'invalid-original-body-world-coordinates','invalid-original-skirt-world-coordinates',
   'original-body-index-invalid','original-skirt-index-invalid',
   'original-anatomy-core-face-mask-invalid',
   'original-body-mesh-id-out-of-range','original-bone-skin-weights-invalid',
   'original-bone-weight-sum-not-normalized',
   'original-photographed-skirt-height-unbounded',
   'skirt-source-band-unknown-cause-accounting-failed',
   'skirt-core-unknown-causes-not-conserved'
  ];
  return fail(expected.includes(e.message)?e.message:
   'original-source-skirt-core-unknown-ray-cause-analysis-unverifiable');
 }
}
