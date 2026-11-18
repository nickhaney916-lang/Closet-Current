/**
 * Closet Current Mission 2 P89: ORIGINAL source-skinned-body NO-HIT
 * geometry discriminator for source photo skirt 7x48 ring rays.
 *
 * Analyze the 95%-named core skin-weight sensitivity scenario ONLY as a
 * research hypothesis, preserving immutable original 50%-dominant source
 * core. Cross-check all rays against independent authentic donor report.
 *
 * For each remaining NO-HIT 95% ray distinguish an original core segment
 * behind the ring center, an original core hit beyond a 3-source-unit
 * finite research cutoff, an original excluded-body source forward hit,
 * and original 2D anatomical slice hull-center coverage. No hull proves
 * closure of the actual non-watertight indexed original body, no exact
 * distance physically calibrates the photographed source garment.
 *
 * No original GLB/photo/skin positions or index arrays modified, no
 * original source mesh welded, no consumer 3D admitted, #255 HOLD.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const finite=x=>Number.isFinite(x);
const validIndex=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const ascii=x=>typeof x==='string'&&x.length>0&&x.length<=96&&
 /^[\x20-\x7e]+$/.test(x);
const sum=x=>x.reduce((a,b)=>a+b,0);
const round=x=>Math.round(x*100000)/100000;
const refused=reason=>Object.freeze({
 schema:'P89-original-photo-95percent-core-nohit-source-geometry/v1',
 status:'ORIGINAL_BODY_NOHIT_SOURCE_GEOMETRY_NOT_VERIFIED',reason,
 originalPhoto2DFallbackRequired:true,
 actualBodyClosedSignedVolumeCertified:false,
 originalGarmentPhysicalSizeCalibrated:false,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
function groupBone(s){
 const l=s.toLowerCase();
 if(/hand|finger|thumb|arm|forearm|shoulder|clavic|elbow|wrist|head|neck|eye|ear|face|jaw/.test(l))
  return 'EXCLUDED_HEAD_ARMS';
 if(/foot|toe|ankle|knee|calf|shin|thigh|upleg|lowleg|leg|heel/.test(l))
  return 'CORE_LEGS';
 if(/pelv|hip|spine|chest|torso|abdomen|back|waist|butt|root/.test(l))
  return 'CORE_TORSO_HIPS';
 return 'UNKNOWN_ORIGINAL_BONE';
}
function cutAtY(p,a,b,c,y){
 const v=[a,b,c],hits=[];
 for(let j=0;j<3;j++){
  const x=v[j],z=v[(j+1)%3],y0=p[x*3+1],y1=p[z*3+1];
  if(Math.abs(y1-y0)<1e-10)continue;
  const u=(y-y0)/(y1-y0);
  if(u<0||u>1)continue;
  const vx=p[x*3]+u*(p[z*3]-p[x*3]),
   vz=p[x*3+2]+u*(p[z*3+2]-p[x*3+2]);
  if(!hits.some(t=>Math.hypot(vx-t[0],vz-t[1])<1e-7))
   hits.push([vx,vz]);
 }
 return hits.length===2?
  [hits[0][0],hits[0][1],hits[1][0],hits[1][1]]:null;
}
function rayTest(segments,cx,cz,ux,uz,radius){
 let forwardFinite=-1,farBeyond=0,backward=0,collinear=false,
  anyForward=0;
 for(const [ax,az,bx,bz] of segments){
  const ex=bx-ax,ez=bz-az,px=ax-cx,pz=az-cz,
   det=ux*ez-uz*ex;
  if(Math.abs(det)<1e-11){
   if(Math.abs(px*uz-pz*ux)<1e-9)collinear=true;
   continue;
  }
  const t=(px*ez-pz*ex)/det,
   u=(px*uz-pz*ux)/det;
  if(u< -1e-9||u>1+1e-9)continue;
  if(t<0){backward++;continue;}
  anyForward++;
  if(t>3){farBeyond++;continue;}
  forwardFinite=Math.max(forwardFinite,t);
 }
 const status=!(radius>.005&&radius<3)?'unknown':
  collinear||forwardFinite<0?'unknown':
  radius-forwardFinite<-.002?'inward':
  radius-forwardFinite<=.002?'near':'outward';
 return {status,hasFinite:forwardFinite>=0,farBeyond,
  backward,collinear,anyForward};
}
function cross(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-
 (b[1]-a[1])*(c[0]-a[0]);}
function sliceHull(points){
 if(points.length<3)return [];
 const v=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const p=v.filter((x,i)=>i===0||Math.hypot(x[0]-v[i-1][0],
  x[1]-v[i-1][1])>1e-8);
 if(p.length<3)return [];
 const lower=[],upper=[];
 for(const x of p){
  while(lower.length>1&&cross(lower[lower.length-2],
   lower[lower.length-1],x)<=0)lower.pop();
  lower.push(x);
 }
 for(let i=p.length-1;i>=0;i--){
  const x=p[i];
  while(upper.length>1&&cross(upper[upper.length-2],
   upper[upper.length-1],x)<=0)upper.pop();
  upper.push(x);
 }
 return lower.slice(0,-1).concat(upper.slice(0,-1));
}
function inHull(poly,cx,cz){
 if(poly.length<3)return false;
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length];
  if(cross(a,b,[cx,cz])< -1e-8)return false;
 }
 return true;
}
const emptyClass=()=>({
 INFINITE_OR_UNBOUNDED_ORIGINAL_SKIRT_RADIUS:0,
 ORIGINAL_CORE_FARTHER_THAN_FINITE_RAY_3_UNIT_CAP:0,
 ORIGINAL_EXCLUDED_SOURCE_BODY_FORWARD_INTERSECTION:0,
 ORIGINAL_CORE_BACKWARD_INTERSECTION_ONLY:0,
 SOURCE_RING_CENTER_OUTSIDE_CORE_CONVEX_HULL:0,
 SOURCE_RING_CENTER_INSIDE_CORE_CONVEX_HULL_BUT_NO_FORWARD_HIT:0,
 ORIGINAL_CORE_NO_PLANE_CONTOUR:0
});
function primaryCause({invalid,core,beyond,excluded,hullInside,coreHas}){
 if(invalid)return 'INFINITE_OR_UNBOUNDED_ORIGINAL_SKIRT_RADIUS';
 if(beyond)return 'ORIGINAL_CORE_FARTHER_THAN_FINITE_RAY_3_UNIT_CAP';
 if(excluded)return 'ORIGINAL_EXCLUDED_SOURCE_BODY_FORWARD_INTERSECTION';
 if(core.backward>0)return 'ORIGINAL_CORE_BACKWARD_INTERSECTION_ONLY';
 if(!coreHas)return 'ORIGINAL_CORE_NO_PLANE_CONTOUR';
 if(!hullInside)return 'SOURCE_RING_CENTER_OUTSIDE_CORE_CONVEX_HULL';
 return 'SOURCE_RING_CENTER_INSIDE_CORE_CONVEX_HULL_BUT_NO_FORWARD_HIT';
}
/** Pure source triangle/weight geometry analysis, synthetic testable,
 * NEVER an authentic original GLB receipt by itself. */
export function summarizeOriginalCoreNoHitGeometry89({
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
  !Array.isArray(sourceMeshNames)||sourceMeshNames.length<1||
  sourceMeshNames.length>256||sourceMeshNames.some(x=>!ascii(x))||
  !Array.isArray(sourceBoneNamesByMesh)||
  sourceBoneNamesByMesh.length!==sourceMeshNames.length||
  sourceBoneNamesByMesh.some(x=>!Array.isArray(x)||x.length!==163||
   x.some(y=>!ascii(y))))
  throw Error('immutable-original-source-body-skirt-bone-arrays-required');
 const nv=bodyPositions.length/3,nf=bodyIndices.length/3;
 for(const v of bodyPositions)if(!finite(v))
  throw Error('nonfinite-original-source-body-coordinate');
 for(const v of skirtPositions)if(!finite(v))
  throw Error('nonfinite-original-source-skirt-coordinate');
 for(const v of bodyIndices)if(v>=nv)
  throw Error('original-source-anatomy-index-out-of-range');
 for(const v of skirtIndices)if(v>=343)
  throw Error('original-source-photographed-skirt-index-out-of-range');
 if(coreBodyFaceMask.some(x=>x!==0&&x!==1))
  throw Error('original-source-core-face-mask-corrupt');
 const skin=[];
 for(let v=0;v<nv;v++){
  const mesh=sourceMeshIds[v];
  if(mesh>=sourceMeshNames.length)
   throw Error('original-source-mesh-identity-invalid');
  let total=0,max=-1,best=0,coreMass=0,
   banned=0,unknown=0,coreInfluences=0;
  for(let k=0;k<4;k++){
   const ix=v*4+k,w=skinWeights[ix],joint=skinIndices[ix];
   if(!finite(w)||w<0||w>1||joint>=163)
    throw Error('original-source-skin-bone-influence-invalid');
   total+=w;
   if(w>max){max=w;best=joint;}
   if(w<=1e-7)continue;
   const label=groupBone(sourceBoneNamesByMesh[mesh][joint]);
   if(label==='EXCLUDED_HEAD_ARMS')banned+=w;
   else if(label==='UNKNOWN_ORIGINAL_BONE')unknown+=w;
   else{coreMass+=w;coreInfluences++;}
  }
  if(Math.abs(total-1)>.003)
   throw Error('original-source-skin-weight-sum-invalid');
  skin.push({mesh,strict:max<.5?'UNKNOWN_ORIGINAL_BONE':
   groupBone(sourceBoneNamesByMesh[mesh][best]),
   coreMass,banned,unknown,coreInfluences});
 }
 const core95=[],fullBody=[];
 let strictFaces=0,extra95=0;
 for(let f=0;f<nf;f++){
  const v=[bodyIndices[3*f],bodyIndices[3*f+1],bodyIndices[3*f+2]],
   vs=v.map(x=>skin[x]),originalMeshSame=
    vs.every(x=>x.mesh===vs[0].mesh),
   hasHead=vs.some(x=>x.strict==='EXCLUDED_HEAD_ARMS'),
   allCore=vs.every(x=>x.strict==='CORE_TORSO_HIPS'||
    x.strict==='CORE_LEGS'),
   uncertain=vs.some(x=>x.strict==='UNKNOWN_ORIGINAL_BONE');
  fullBody.push(v);
  if(!originalMeshSame||hasHead||coreBodyFaceMask[f]!==1)continue;
  if(allCore){core95.push(v);strictFaces++;continue;}
  if(!uncertain)continue;
  if(vs.every(x=>x.coreMass>=.95-1e-7&&
   x.banned<=.05+1e-7&&x.unknown<=.05+1e-7&&
   (x.strict!=='UNKNOWN_ORIGINAL_BONE'||x.coreInfluences>=2))){
   core95.push(v);extra95++;
  }
 }
 const totals=emptyClass(),bands=[],axis=Object.seal({
  SOURCE_PLUS_X:0,SOURCE_MINUS_X:0,SOURCE_PLUS_Z:0,SOURCE_MINUS_Z:0
 });
 let observations={inward:0,outward:0,near:0,unknown:0},missing=0,
  coreBeyond=0,coreBackward=0,excludedForward=0,originOutside=0,
  originInside=0,ambiguous=0;
 for(let row=0;row<7;row++){
  let cx=0,cz=0,y=0;
  for(let j=0;j<48;j++){
   const k=3*(row*49+j);
   cx+=skirtPositions[k];cz+=skirtPositions[k+2];
   y+=skirtPositions[k+1];
  }
  cx/=48;cz/=48;y/=48;
  const map=tris=>{
   const segments=[];
   for(const [a,b,c] of tris){
    const s=cutAtY(bodyPositions,a,b,c,y);
    if(s)segments.push(s);
   }
   return segments;
  };
  const core=map(core95),all=map(fullBody),hull=sliceHull(
   core.flatMap(([a,b,c,d])=>[[a,b],[c,d]])),
   hullContainsCenter=inHull(hull,cx,cz),originalSourceHullExists=hull.length>=3,
   rowCases=emptyClass();
  let unknown=0,withExcluded=0,withBackward=0,withBeyond=0,
   collinearUnknown=0;
  for(let j=0;j<48;j++){
   const p=3*(row*49+j),dx=skirtPositions[p]-cx,
    dz=skirtPositions[p+2]-cz,rad=Math.hypot(dx,dz),
    ux=rad>0?dx/rad:0,uz=rad>0?dz/rad:0,
    coreHit=rayTest(core,cx,cz,ux,uz,rad),
    fullHit=rayTest(all,cx,cz,ux,uz,rad);
   observations[coreHit.status]++;
   if(coreHit.status!=='unknown')continue;
   unknown++;missing++;
   const badRadius=!(rad>.005&&rad<3);
   const beyond=coreHit.farBeyond>0,backward=coreHit.backward>0,
    excluded=fullHit.hasFinite&&!coreHit.hasFinite;
   if(beyond){withBeyond++;coreBeyond++;}
   if(backward){withBackward++;coreBackward++;}
   if(excluded){withExcluded++;excludedForward++;}
   if(coreHit.collinear){collinearUnknown++;ambiguous++;}
   if(hullContainsCenter)originInside++;
   else originOutside++;
   const direction=Math.abs(dx)>=Math.abs(dz)?
    dx>=0?'SOURCE_PLUS_X':'SOURCE_MINUS_X':
    dz>=0?'SOURCE_PLUS_Z':'SOURCE_MINUS_Z';
   axis[direction]++;
   const key=primaryCause({invalid:badRadius,core:coreHit,beyond,
    excluded,hullInside:hullContainsCenter,coreHas:core.length>0});
   totals[key]++;rowCases[key]++;
  }
  if(sum(Object.values(rowCases))!==unknown)
   throw Error('source-ring-nohit-primary-cause-count-contradiction');
  bands.push({
   originalSourceSkirtRing:row,
   originalSource95CorePlaneCutSegments:core.length,
   originalAllIndexedBodyPlaneCutSegments:all.length,
   original95CoreConvexEnvelopeVertices:hull.length,
   originalSource95CoreEnvelopeContainsSkirtRingCenter:
    originalSourceHullExists?hullContainsCenter:null,
   noHitRays:unknown,primarySourceNoHitCauses:rowCases,
   sourceNoHitForwardBodyWitnesses:withExcluded,
   sourceNoHitBackwardCoreLineHits:withBackward,
   sourceNoHitForwardCoreBeyond3UnitLimit:withBeyond,
   collinearOriginalCoreUnknownDirections:collinearUnknown,
   angularEnvelopeOnlyNotCertifiedBodyVolume:true
  });
 }
 if(sum(Object.values(totals))!==missing||
  missing!==observations.unknown||
  sum(Object.values(observations))!==336||
  sum(Object.values(axis))!==missing||
  originInside+originOutside!==missing)
  throw Error('source-original-nohit-geometry-accounting-failed');
 return Object.freeze({
  schema:'P89-original-95percent-skin-core-nohit-plane-ray-geometry/v1',
  originalIndexedBodyTriangleCount:nf,
  originalSkirtIndexedTriangleCount:skirtIndices.length/3,
  originalSkirtSampledRays:336,
  originalStrictCoreFaceCount:strictFaces,
  original95PercentHypotheticalAddedFaces:extra95,
  original95PercentHypotheticalObservedRays:observations,
  original95PercentHypotheticalUnknownRays:missing,
  causePriorityDisjointOriginalBodyRayOutcomes:totals,
  sourceUnknownRayDirectionsBySourceAxes:axis,
  sourceNoHitRaysWithExcludedOriginalBodyForwardWitness:excludedForward,
  sourceNoHitRaysWithOriginalCoreBackwardLineIntersection:coreBackward,
  sourceNoHitRaysBeyond3OriginalModelUnitRadialLimit:coreBeyond,
  sourceNoHitRaysWhoseOriginInsideCoreConvexEnvelope:originInside,
  sourceNoHitRaysWhoseOriginOutsideCoreConvexEnvelope:originOutside,
  sourceNoHitRaysWithCollinearAmbiguity:ambiguous,
  originalSourceSevenSkirtRingNoHitGeometry:bands,
  original95PercentSkinnedCoreFaceSetResearchOnly:true,
  oldOriginalHalfDominantCoreRuleStillAuthoritative:true,
  noOriginalSourceGeometryOrSkinWeightsMutated:true,
  originalSourceSkirtRearUnobserved:true,
  convex2DEnvelopeIsNotAClosedBodySignedVolume:true,
  2DSourceAngularSliceIsNotPhysicalGarmentClearance:true,
  consumer3DAdmitted:false,releaseAuthorized:false,
  originalPhoto2DFallbackRequired:true
 });
}
export function auditActualOriginalCoreNoHitGeometry89(args={}){
 const {avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  originalRig163Bones,selectedMeasuredFivePoseBvh,
  selectedActualWebGLPreview,
  independentOriginalSkinWeightSensitivityReceipt}=args;
 if(!Object.hasOwn(RIG,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO||
  sourceAnatomyGLBSHA256!==RIG[avatar]||
  originalRig163Bones!==true||selectedMeasuredFivePoseBvh!==true||
  selectedActualWebGLPreview!==true||
  independentOriginalSkinWeightSensitivityReceipt?.schema!==
   'P89-original-skinweighted-core-counterfactual-sensitivity/v1'||
  independentOriginalSkinWeightSensitivityReceipt?.originalPhotoSkirtSourceRays!==336||
  independentOriginalSkinWeightSensitivityReceipt?.originalStrictCoreMaskAndHalfWeightThresholdRetained!==true)
  return refused('genuine-original-photo-163bone-and-independent-95percent-core-receipt-required');
 try{
  const proof=summarizeOriginalCoreNoHitGeometry89(args),
   prev=independentOriginalSkinWeightSensitivityReceipt;
  if(proof.originalIndexedBodyTriangleCount!==prev.originalIndexedSourceBodyTriangleCount||
   proof.original95PercentHypotheticalAddedFaces!==
    prev.hypothetical95SourceBoneCoreWeightFaces||
   proof.originalStrictCoreFaceCount!==
    prev.actualStrictSourceEligibleCoreFaces||
   Object.entries(proof.original95PercentHypotheticalObservedRays)
    .some(([k,v])=>v!==prev.hypothetical95SourceRays[k])||
   proof.originalSourceSevenSkirtRingNoHitGeometry.some((band,i)=>
    band.noHitRays!==prev.originalSkirtBandSourceCounterfactuals[i]?.hypothetical95.unknown||
    band.originalSource95CorePlaneCutSegments!==
     prev.originalSkirtBandSourceCounterfactuals[i]?.genuineStrictBodyFacePlaneCuts+
     prev.originalSkirtBandSourceCounterfactuals[i]?.additional95BoneAttestedFacePlaneCuts))
   return refused('original-indexed-95percent-sensitivity-receipts-disagree');
  return Object.freeze({
   schema:'P89-original-photo-95percent-core-nohit-source-geometry/v1',
   status:'ORIGINAL_SOURCE_95_CORE_NOHIT_CAUSES_LOCALIZED_NOT_FIT',
   avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
   originalSourceRayEvidence:proof,
   independentlySourceLockedOriginalRays336:true,
   sourcePhoto2DFallbackRequired:true,originalPhoto2DFallbackRequired:true,
   originalSignedBodyVolumeCertified:false,
   originalPhysicalGarmentSizeVerified:false,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const allowed=['immutable-original-source-body-skirt-bone-arrays-required',
   'nonfinite-original-source-body-coordinate',
   'nonfinite-original-source-skirt-coordinate',
   'original-source-anatomy-index-out-of-range',
   'original-source-photographed-skirt-index-out-of-range',
   'original-source-core-face-mask-corrupt','original-source-mesh-identity-invalid',
   'original-source-skin-bone-influence-invalid',
   'original-source-skin-weight-sum-invalid',
   'source-ring-nohit-primary-cause-count-contradiction',
   'source-original-nohit-geometry-accounting-failed'];
  return refused(allowed.includes(e.message)?e.message:
   'original-source-nohit-cause-cannot-be-proven');
 }
}
