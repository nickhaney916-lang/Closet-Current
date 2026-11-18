/**
 * Mission 2 P89: real original GLB provenance of the excluded original
 * anatomical faces behind missing photographed-skirt core ray directions.
 *
 * Read-only on original male/female 163-bone P541 public GLB; no seam
 * welding, source model edits, synthetic body closure or consumer approval.
 * Classify 7 x 48 ORIGINAL photographed source skirt spokes; for core
 * UNKNOWNs, identify actual SOURCE bone names + SOURCE mesh identities
 * associated with excluded face hits, versus angular-only witness of
 * directions with no original source-plane ray hit whatsoever.
 *
 * Source-mesh/bone outputs are bounded aggregate histograms of public
 * licensed source model; no original vertex XYZ, indices or private
 * owner photos exported. Bone names are not automatically relabeled.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const isIndex=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const printable=x=>typeof x==='string'&&x.length>0&&x.length<=96&&
 /^[\x20-\x7e]+$/.test(x);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const sum=v=>v.reduce((n,x)=>n+x,0);
const refusal=reason=>Object.freeze({
 schema:'P89-source-locked-original-core-nohit-bone-provenance/v1',
 status:'SOURCE_BONE_OR_RAY_PROVENANCE_UNVERIFIABLE',
 reason,originalPhoto2DFallbackRequired:true,
 originalSourceAnatomyNeverEdited:true,
 signedExteriorContainmentCertified:false,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const classes=Object.freeze(['CORE_TORSO_HIPS_LEGS','EXCLUDED_HEAD_ARMS',
 'UNKNOWN_ORIGINAL_DOMINANT_BONE','EXCLUDED_ORIGINAL_CORE_FACE_MASK',
 'CROSS_ORIGINAL_SOURCE_MESH']);
const emptyClass=()=>Object.fromEntries(classes.slice(1).map(x=>[x,0]));
const emptyAxis=()=>({SOURCE_PLUS_X:0,SOURCE_MINUS_X:0,SOURCE_PLUS_Z:0,SOURCE_MINUS_Z:0});
const rayAxis=(x,z)=>Math.abs(x)>=Math.abs(z)?
 x>=0?'SOURCE_PLUS_X':'SOURCE_MINUS_X':
 z>=0?'SOURCE_PLUS_Z':'SOURCE_MINUS_Z';
const emptyAngle=()=>({
 ANGLE_0_TO_5_DEG:0,ANGLE_5_TO_15_DEG:0,
 ANGLE_15_TO_45_DEG:0,ANGLE_45_TO_180_DEG:0,
 NO_ORIGINAL_BODY_PLANE_SEGMENT_AT_RING:0
});
const angleBin=n=>n<=5?'ANGLE_0_TO_5_DEG':
 n<=15?'ANGLE_5_TO_15_DEG':
 n<=45?'ANGLE_15_TO_45_DEG':'ANGLE_45_TO_180_DEG';
const sorted=(hist,n=32)=>Object.entries(hist)
 .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
 .slice(0,n).map(([label,rays])=>({label,rays}));
function originalBoneKind(name){
 const x=name.toLowerCase();
 if(/hand|finger|thumb|arm|forearm|shoulder|clavic|elbow|wrist|head|neck|eye|ear|face|jaw/.test(x))
  return 'EXCLUDED_HEAD_ARMS';
 if(/foot|toe|ankle|knee|calf|shin|thigh|upleg|lowleg|leg|heel/.test(x))
  return 'CORE_LEGS';
 if(/pelv|hip|spine|chest|torso|abdomen|back|waist|butt|root/.test(x))
  return 'CORE_TORSO_HIPS';
 return 'UNKNOWN_ORIGINAL_BONE';
}
function cutOriginalTriangle(p,a,b,c,y){
 const indices=[a,b,c],points=[];
 for(let i=0;i<3;i++){
  const s=indices[i],t=indices[(i+1)%3],
   y0=p[s*3+1],y1=p[t*3+1];
  if(Math.abs(y1-y0)<1e-10)continue;
  const u=(y-y0)/(y1-y0);
  if(u<0||u>1)continue;
  const x=p[s*3]+u*(p[t*3]-p[s*3]),
   z=p[s*3+2]+u*(p[t*3+2]-p[s*3+2]);
  if(!points.some(q=>Math.hypot(x-q[0],z-q[1])<1e-7))
   points.push([x,z]);
 }
 return points.length===2?
  [points[0][0],points[0][1],points[1][0],points[1][1]]:null;
}
function castOriginalSegments(segs,cx,cz,ux,uz){
 let farthest=-1,collinear=false,selected=null;
 for(const s of segs){
  const [ax,az,bx,bz]=s.xy,
   ex=bx-ax,ez=bz-az,px=ax-cx,pz=az-cz,
   det=ux*ez-uz*ex;
  if(Math.abs(det)<1e-11){
   if(Math.abs(px*uz-pz*ux)<1e-9)collinear=true;
   continue;
  }
  const t=(px*ez-pz*ex)/det,
   v=(px*uz-pz*ux)/det;
  if(t>=0&&t<=3&&v>=-1e-9&&v<=1+1e-9&&t>farthest){
   farthest=t;selected=s;
  }
 }
 return {farthest,collinear,selected,hasHit:farthest>=0};
}
function nearestEndpointAngularBin(segs,cx,cz,ux,uz){
 if(segs.length===0)return 'NO_ORIGINAL_BODY_PLANE_SEGMENT_AT_RING';
 let best=Infinity;
 for(const s of segs){
  const [ax,az,bx,bz]=s.xy;
  for(const [x,z] of [[ax,az],[bx,bz]]){
   const dx=x-cx,dz=z-cz,r=Math.hypot(dx,dz);
   if(r<1e-9)continue;
   const dot=Math.max(-1,Math.min(1,(ux*dx+uz*dz)/r));
   const angle=Math.acos(dot)*180/Math.PI;
   best=Math.min(best,angle);
  }
 }
 return Number.isFinite(best)?angleBin(best):
  'NO_ORIGINAL_BODY_PLANE_SEGMENT_AT_RING';
}
/**
 * Pure typed-buffer source analysis. Synthetic test fixtures are NEVER
 * genuine 163-bone photo/GLB acceptance receipts. No source mutation.
 */
export function summarizeOriginalMissingRayBoneNames89({
 bodyPositions,bodyIndices,skirtPositions,skirtIndices,
 coreBodyFaceMask,skinIndices,skinWeights,sourceMeshIds,
 sourceMeshNames,sourceBoneNamesByMesh
}={}){
 if(!(bodyPositions instanceof Float32Array)||
  bodyPositions.length<12||bodyPositions.length%3!==0||
  bodyPositions.length>2_100_000||
  !isIndex(bodyIndices)||bodyIndices.length<6||
  bodyIndices.length%3!==0||bodyIndices.length>3_000_000||
  !(skirtPositions instanceof Float32Array)||
  skirtPositions.length!==343*3||
  !isIndex(skirtIndices)||skirtIndices.length!==576*3||
  !(coreBodyFaceMask instanceof Uint8Array)||
  coreBodyFaceMask.length!==bodyIndices.length/3||
  !(skinIndices instanceof Uint16Array)||
  skinIndices.length!==bodyPositions.length/3*4||
  !(skinWeights instanceof Float32Array)||
  skinWeights.length!==skinIndices.length||
  !(sourceMeshIds instanceof Uint16Array)||
  sourceMeshIds.length!==bodyPositions.length/3||
  !Array.isArray(sourceMeshNames)||sourceMeshNames.length<1||
  sourceMeshNames.length>256||sourceMeshNames.some(x=>!printable(x))||
  !Array.isArray(sourceBoneNamesByMesh)||
  sourceBoneNamesByMesh.length!==sourceMeshNames.length||
  sourceBoneNamesByMesh.some(a=>!Array.isArray(a)||a.length!==163||
   a.some(x=>!printable(x))))
  throw Error('original-source-skinned-face-bone-identity-required');
 const vertices=bodyPositions.length/3,faceCount=bodyIndices.length/3;
 for(const x of bodyPositions)if(!finite(x))
  throw Error('original-source-body-positions-nonfinite');
 for(const x of skirtPositions)if(!finite(x))
  throw Error('original-photo-skirt-positions-nonfinite');
 for(const id of bodyIndices)if(id>=vertices)
  throw Error('original-source-body-face-index-invalid');
 for(const id of skirtIndices)if(id>=343)
  throw Error('original-photographed-skirt-index-invalid');
 if(coreBodyFaceMask.some(x=>x!==0&&x!==1))
  throw Error('original-body-eligible-core-mask-corrupt');
 const vertexKind=new Array(vertices),dominantName=new Array(vertices);
 for(let i=0;i<vertices;i++){
  const mesh=sourceMeshIds[i];
  if(mesh>=sourceMeshNames.length)
   throw Error('original-source-mesh-index-invalid');
  let weight=0,best=-1,bone=0;
  for(let k=0;k<4;k++){
   const index=i*4+k,w=skinWeights[index],joint=skinIndices[index];
   if(!finite(w)||w<0||w>1||joint>=163)
    throw Error('original-source-163-bone-skin-invalid');
   weight+=w;
   if(w>best){best=w;bone=joint;}
  }
  if(Math.abs(weight-1)>.003)
   throw Error('original-source-skin-weight-not-normalized');
  const name=sourceBoneNamesByMesh[mesh][bone];
  dominantName[i]=best<.5?'ORIGINAL_UNRESOLVED_DOMINANT_WEIGHT':name;
  vertexKind[i]=best<.5?'UNKNOWN_ORIGINAL_BONE':originalBoneKind(name);
 }
 const faces=[];
 for(let f=0;f<faceCount;f++){
  const a=bodyIndices[f*3],b=bodyIndices[f*3+1],c=bodyIndices[f*3+2],
   ids=[a,b,c],mesh=sourceMeshIds[a],kinds=ids.map(i=>vertexKind[i]);
  const kind=ids.some(i=>sourceMeshIds[i]!==mesh)?
   'CROSS_ORIGINAL_SOURCE_MESH':
   kinds.includes('EXCLUDED_HEAD_ARMS')?'EXCLUDED_HEAD_ARMS':
   kinds.includes('UNKNOWN_ORIGINAL_BONE')?'UNKNOWN_ORIGINAL_DOMINANT_BONE':
   coreBodyFaceMask[f]!==1?'EXCLUDED_ORIGINAL_CORE_FACE_MASK':
   'CORE_TORSO_HIPS_LEGS';
  // Choose a stable source name from original affected vertices, without
  // calling any unknown anatomical label a new core part. A face may have
  // different dominant names; report the most frequent excluded one.
  const names=ids.map(i=>dominantName[i]);
  const relevant=kind==='UNKNOWN_ORIGINAL_DOMINANT_BONE'?
   ids.filter(i=>vertexKind[i]==='UNKNOWN_ORIGINAL_BONE').map(i=>dominantName[i]):
   kind==='EXCLUDED_HEAD_ARMS'?
    ids.filter(i=>vertexKind[i]==='EXCLUDED_HEAD_ARMS').map(i=>dominantName[i]):
    names;
  const sortedNames=Array.from(new Set(relevant)).sort();
  const dominant=sortedNames.map(n=>({name:n,
   count:relevant.filter(v=>v===n).length})).sort((x,y)=>
    y.count-x.count||x.name.localeCompare(y.name))[0]?.name||
   'ORIGINAL_UNRESOLVED_FACE_SOURCE_NAME';
  // Where no original joint exceeds 50% at the contributing vertices,
  // retain the TOP ORIGINAL SKIN INFLUENCE NAMES as evidence. Do NOT
  // reclassify a blended vertex as abdomen/legs merely because one of
  // its source bones has a familiar anatomical name.
  const uncertainVertices=ids.filter(i=>
   vertexKind[i]==='UNKNOWN_ORIGINAL_BONE');
  const originalInfluence=Object.create(null);
  for(const i of uncertainVertices){
   const faceMesh=sourceMeshIds[i];
   for(let k=0;k<4;k++){
    const weight=skinWeights[i*4+k];
    if(weight<=1e-7)continue;
    const sourceName=sourceBoneNamesByMesh[faceMesh][skinIndices[i*4+k]];
    originalInfluence[sourceName]=(originalInfluence[sourceName]||0)+weight;
   }
  }
  const sourceBlendTop3=Object.entries(originalInfluence)
   .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
   .slice(0,3).map(x=>x[0]).join(' + ');
  faces.push({a,b,c,kind,meshName:mesh+':'+sourceMeshNames[mesh],
   originalBoneName:dominant,originalBlendInfluenceTop3Names:sourceBlendTop3,
   minY:Math.min(bodyPositions[a*3+1],bodyPositions[b*3+1],
    bodyPositions[c*3+1]),
   maxY:Math.max(bodyPositions[a*3+1],bodyPositions[b*3+1],
    bodyPositions[c*3+1])});
 }
 let unknown=0,withOther=0,noHit=0,inward=0,outward=0,near=0,
  unknownBone=0,headArm=0,maskExcluded=0,crossMesh=0;
 const byMesh=Object.create(null),byBone=Object.create(null),
  byBoneMesh=Object.create(null),
  byUnresolvedBlendJointNames=Object.create(null),
  noHitAxis=emptyAxis(),
  noHitAngle=emptyAngle(),noHitBands=Array(7).fill(0),
  excludedByBand=Array(7).fill(0),perBand=[];
 const aggregate=(hist,key)=>{hist[key]=(hist[key]||0)+1;};
 for(let row=0;row<7;row++){
  let cx=0,cz=0,y=0;
  for(let j=0;j<48;j++){
   const p=(row*49+j)*3;
   cx+=skirtPositions[p];cz+=skirtPositions[p+2];y+=skirtPositions[p+1];
  }
  cx/=48;cz/=48;y/=48;
  const byKind=Object.fromEntries(classes.map(k=>[k,[]]));
  for(const f of faces){
   if(f.minY>y||f.maxY<y)continue;
   const xy=cutOriginalTriangle(bodyPositions,f.a,f.b,f.c,y);
   if(xy)byKind[f.kind].push({...f,xy});
  }
  const all=classes.flatMap(k=>byKind[k]);
  const core=byKind.CORE_TORSO_HIPS_LEGS;
  let rowUnknown=0,rowOther=0,rowNoHit=0,rowCoreSegments=core.length;
  for(let j=0;j<48;j++){
   const a=(row*49+j)*3,dx=skirtPositions[a]-cx,
    dz=skirtPositions[a+2]-cz,radius=Math.hypot(dx,dz);
   if(!(radius>.005&&radius<3)){
    unknown++;rowUnknown++;noHit++;rowNoHit++;
    aggregate(noHitAxis,rayAxis(dx,dz));
    aggregate(noHitAngle,'NO_ORIGINAL_BODY_PLANE_SEGMENT_AT_RING');
    continue;
   }
   const ux=dx/radius,uz=dz/radius,hit=castOriginalSegments(core,cx,cz,ux,uz);
   if(!hit.collinear&&core.length>0&&hit.hasHit){
    const gap=radius-hit.farthest;
    if(gap<-.002)inward++;
    else if(gap<=.002)near++;
    else outward++;
    continue;
   }
   unknown++;rowUnknown++;
   let any=false;
   const observed=[];
   for(const kind of classes.slice(1)){
    const check=castOriginalSegments(byKind[kind],cx,cz,ux,uz);
    if(check.hasHit&&check.selected){
     any=true;observed.push({...check.selected,t:check.farthest});
     if(kind==='UNKNOWN_ORIGINAL_DOMINANT_BONE')unknownBone++;
     if(kind==='EXCLUDED_HEAD_ARMS')headArm++;
     if(kind==='EXCLUDED_ORIGINAL_CORE_FACE_MASK')maskExcluded++;
     if(kind==='CROSS_ORIGINAL_SOURCE_MESH')crossMesh++;
    }
   }
   if(any){
    withOther++;rowOther++;
    // A single stable primary excluded witness per unknown spoke:
    // most distant observed original source plane cut along this ray,
    // with deterministic original mesh+bone tie-break. Additional
    // categories may overlap in same unknown ray and are NOT added to
    // a single exclusive class based on ambiguous human semantics.
    observed.sort((a,b)=>b.t-a.t||
     a.meshName.localeCompare(b.meshName)||
     a.originalBoneName.localeCompare(b.originalBoneName));
    const chosen=observed[0];
    aggregate(byMesh,chosen.meshName);
    aggregate(byBone,chosen.originalBoneName);
    aggregate(byBoneMesh,chosen.meshName+' | '+chosen.originalBoneName);
    if(chosen.originalBoneName==='ORIGINAL_UNRESOLVED_DOMINANT_WEIGHT'){
     if(!chosen.originalBlendInfluenceTop3Names)
      throw Error('original-source-blended-influence-bone-names-missing');
     aggregate(byUnresolvedBlendJointNames,
      chosen.originalBlendInfluenceTop3Names);
    }
    excludedByBand[row]++;
   }else{
    noHit++;rowNoHit++;noHitBands[row]++;
    aggregate(noHitAxis,rayAxis(dx,dz));
    aggregate(noHitAngle,nearestEndpointAngularBin(all,cx,cz,ux,uz));
   }
  }
  if(rowUnknown!==rowOther+rowNoHit)
   throw Error('original-source-unknown-band-provenance-count-disagrees');
  perBand.push({band:row,unknown:rowUnknown,excludedSourceHit:rowOther,
   noSourceRayHit:rowNoHit,originalCoreSegments:rowCoreSegments,
   allOriginalAnatomicalSegments:all.length});
 }
 if(inward+outward+near+unknown!==336||
  unknown!==withOther+noHit||
  sum(Object.values(byMesh))!==withOther||
  sum(Object.values(byBone))!==withOther||
  sum(Object.values(byBoneMesh))!==withOther||
  sum(Object.values(byUnresolvedBlendJointNames))!==
   (byBone.ORIGINAL_UNRESOLVED_DOMINANT_WEIGHT||0)||
  sum(Object.values(noHitAxis))!==noHit||
  sum(Object.values(noHitAngle))!==noHit||
  sum(noHitBands)!==noHit||
  sum(excludedByBand)!==withOther)
  throw Error('actual-source-original-bones-and-nohit-ray-accounting-failed');
 return Object.freeze({
  schema:'P89-pure-original-core-unknown-bone-name-nohit-spokes/v1',
  sourceIndexedOriginalBodyTriangleCount:faceCount,
  originalPhotographedSkirtIndexedTriangleCount:skirtIndices.length/3,
  actualOriginalSkirtSourceSpokes:336,
  originalCoreInward:inward,originalCoreOutward:outward,
  originalCoreNear:near,originalCoreUnknown:unknown,
  unknownSpokesWithAnyExcludedSourceFaceHit:withOther,
  unknownSpokesWithNoActualSourceFaceRayHit:noHit,
  originalUnknownCoreRaySourcePrimaryMeshNames:sorted(byMesh,256),
  originalUnknownCoreRaySourcePrimaryBoneNames:sorted(byBone,163),
  originalUnknownCoreRaySourcePrimaryMeshBonePairs:sorted(byBoneMesh,256),
  originalUnknownCoreLowDominanceSourceSkinTop3JointNames:
   sorted(byUnresolvedBlendJointNames,163),
  originalUnknownCoreLowDominanceSourceSkinRayCount:
   byBone.ORIGINAL_UNRESOLVED_DOMINANT_WEIGHT||0,
  unverifiedJointBlendNamesAreSourceEvidenceNotTrustedCoreLabel:true,
  originalUnknownCoreExcludedUnclassifiedBoneHitSpokes:unknownBone,
  originalUnknownCoreExcludedHeadArmHitSpokes:headArm,
  originalUnknownCoreExcludedOriginalMaskHitSpokes:maskExcluded,
  originalUnknownCoreExcludedCrossMeshHitSpokes:crossMesh,
  noOriginalBodyFaceHitAxisGroups:noHitAxis,
  noOriginalBodyFaceHitByOriginalSkirtBand:noHitBands,
  noBodyRayHitNearestSegmentEndpointAngularProxyBins:noHitAngle,
  unknownExcludedFaceHitByOriginalSkirtBand:excludedByBand,
  originalSourceSevenBandProvenanceReceipts:perBand,
  angleToOriginalPlaneCutEndpointIsOnlyAProxyNotGapOrClearance:true,
  originalSourceBoneLabelsNeverAutomaticallyReclassified:true,
  someExcludedCategoriesCanOverlapSameOriginalRay:true,
  sourceOriginalPhotoAndGLBBuffersReadOnly:true,
  originalBodyCannotCertifyClosedSignedVolume:true,
  garmentRealWorldWaistAndHemMeasurementsMissing:true,
  unphotographedGarmentRearNotInferred:true,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false
 });
}
export function auditOriginalSkirtCoreBoneNamesAndNoHits89(args={}){
 const {avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  originalRig163Bones,selectedMeasuredFivePoseBvh,selectedActualWebGLPreview,
  independentlyVerifiedMissingCoreCauseReport}=args;
 if(!Object.hasOwn(RIG,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO||
  sourceAnatomyGLBSHA256!==RIG[avatar]||
  originalRig163Bones!==true||
  selectedMeasuredFivePoseBvh!==true||
  selectedActualWebGLPreview!==true||
  independentlyVerifiedMissingCoreCauseReport?.schema!==
   'P89-pure-original-skirt-core-ray-missing-contour-causes/v1'||
  independentlyVerifiedMissingCoreCauseReport?.trueOriginalSourceRingRayCount!==336||
  independentlyVerifiedMissingCoreCauseReport?.independentRayCauseCountsReconcile!==true)
  return refusal('verified-original-photo-skeleton-and-unknown-cause-receipt-required');
 try{
  const details=summarizeOriginalMissingRayBoneNames89(args),
   prior=independentlyVerifiedMissingCoreCauseReport;
  if(details.sourceIndexedOriginalBodyTriangleCount!==
   prior.originalBodyFullIndexedTriangleCount||
   details.originalCoreInward!==prior.strictCoreInwardRays||
   details.originalCoreOutward!==prior.strictCoreOutwardRays||
   details.originalCoreNear!==prior.strictCoreNearRays||
   details.originalCoreUnknown!==prior.strictCoreUnknownRays||
   details.unknownSpokesWithAnyExcludedSourceFaceHit!==
    prior.unknownRaysWithExcludedSourceFaceWitness||
   details.unknownSpokesWithNoActualSourceFaceRayHit!==
    prior.unknownRaysWithNoObservedOriginalBodyFaceWitness||
   details.originalUnknownCoreExcludedUnclassifiedBoneHitSpokes!==
    prior.strictCoreUnknownExcludedSourceFaceHitCounts.UNKNOWN_ORIGINAL_DOMINANT_BONE||
   details.originalUnknownCoreExcludedHeadArmHitSpokes!==
    prior.strictCoreUnknownExcludedSourceFaceHitCounts.EXCLUDED_HEAD_ARMS||
   details.originalSourceSevenBandProvenanceReceipts.some((x,i)=>
    x.unknown!==prior.sourceSevenSkirtBandCauseBreakdown[i]?.originalCoreUnknown||
    x.excludedSourceHit!==prior.sourceSevenSkirtBandCauseBreakdown[i]?.unknownRaysWithAnyExcludedAnatomyRayHit||
    x.noSourceRayHit!==prior.sourceSevenSkirtBandCauseBreakdown[i]?.unknownRaysWithoutAnyBodyFaceRayHit))
   return refusal('genuine-independent-previous-unknown-core-ray-evidence-counts-disagree');
  return Object.freeze({
   schema:'P89-source-locked-original-core-nohit-bone-provenance/v1',
   status:'ORIGINAL_SOURCE_BONE_NAMES_AND_NOHIT_DIRECTIONS_EVIDENCED_NOT_FIT',
   avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
   originalPhotoSkirtSourceBoneNoHitEvidence:details,
   original336SourceSpokesIndependentlyVerified:true,
   originalSourceAnatomyNeverEdited:true,
   originalPhoto2DFallbackRequired:true,
   closedBodyVolumeCertified:false,signedExteriorContainmentCertified:false,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const allowed=[
   'original-source-skinned-face-bone-identity-required',
   'original-source-body-positions-nonfinite',
   'original-photo-skirt-positions-nonfinite',
   'original-source-body-face-index-invalid',
   'original-photographed-skirt-index-invalid',
   'original-body-eligible-core-mask-corrupt',
   'original-source-mesh-index-invalid',
   'original-source-163-bone-skin-invalid',
   'original-source-skin-weight-not-normalized',
   'original-source-unknown-band-provenance-count-disagrees',
   'actual-source-original-bones-and-nohit-ray-accounting-failed'
  ];
  return refusal(allowed.includes(e.message)?e.message:
   'original-bone-name-and-ray-identity-not-verifiable');
 }
}
