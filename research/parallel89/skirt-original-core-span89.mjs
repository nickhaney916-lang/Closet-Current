/**
 * Mission 2 P89: original photographed skirt height-constrained anatomy
 * evidence on TRUE posed original 163-bone P541 GLB body indexed faces.
 *
 * An ROI crop introduces NEW open edges: NEVER mistake those for original
 * body defects, and NEVER infer a closed volume from 0 transverse BVH
 * intersections. Original-body index seams are left unmodified. A positive
 * sampled radial gap from the torso/hip/leg source face subset CANNOT prove
 * a garment outside a 3D human body, especially with unobserved angles,
 * excluded hands/other body meshes, unknown rear and unmeasured sizes.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const validIndex=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const sum=a=>a.reduce((n,x)=>n+x,0);
const round=n=>Math.round(n*100000)/100000;
const refuse=reason=>Object.freeze({
 schema:'P89-authentic-source-skirt-span-core-body-contour/v1',
 status:'SOURCE_SKIRT_CORE_BODY_SPAN_UNVERIFIABLE',reason,
 originalPhoto2DFallbackRequired:true,closedBodyVolumeCertified:false,
 sourceGarmentPhysicalSizeMeasured:false,signedExteriorContainmentCertified:false,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
function groupBone(name){
 const l=String(name).toLowerCase();
 if(/hand|finger|thumb|arm|forearm|shoulder|clavic|elbow|wrist|head|neck|eye|ear|face|jaw/.test(l))
  return 'EXCLUDED_HEAD_ARMS';
 if(/foot|toe|ankle|knee|calf|shin|thigh|upleg|lowleg|leg|heel/.test(l))
  return 'CORE_LEGS';
 if(/pelv|hip|spine|chest|torso|abdomen|back|waist|butt|root/.test(l))
  return 'CORE_TORSO_HIPS';
 return 'UNKNOWN_ORIGINAL_BONE';
}
const label=x=>typeof x==='string'&&x.length>=1&&x.length<=96&&
 /^[\x20-\x7e]+$/.test(x);
function cutsAtY(p,a,b,c,height){
 const tri=[a,b,c],pts=[];
 for(let k=0;k<3;k++){
  const v=tri[k],w=tri[(k+1)%3],
   y=p[v*3+1],z=p[w*3+1];
  if(Math.abs(y-z)<1e-10)continue;
  const t=(height-y)/(z-y);
  if(t<0||t>1)continue;
  const point=[p[v*3]+t*(p[w*3]-p[v*3]),
   p[v*3+2]+t*(p[w*3+2]-p[v*3+2])];
  if(!pts.some(q=>Math.hypot(point[0]-q[0],point[1]-q[1])<1e-7))
   pts.push(point);
 }
 return pts.length===2?pts:null;
}
/** Pure synthetic-geometry testable analysis. It NEVER asserts GLB identity. */
export function summarizeActualOriginalSkirtCoreSpan89({
 bodyPositions,bodyIndices,skirtPositions,skirtIndices,
 coreBodyFaceMask,skinIndices,skinWeights,sourceMeshIds,
 sourceBoneNamesByMesh,sourceMeshNames
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
  sourceMeshNames.length>256||sourceMeshNames.some(x=>!label(x))||
  !Array.isArray(sourceBoneNamesByMesh)||
  sourceBoneNamesByMesh.length!==sourceMeshNames.length||
  sourceBoneNamesByMesh.some(x=>!Array.isArray(x)||x.length!==163||
   x.some(n=>!label(n))))
  throw Error('bounded-authentic-source-skirt-and-original-anatomical-face-data-required');
 const n=bodyPositions.length/3,nFace=bodyIndices.length/3;
 for(const p of bodyPositions)if(!finite(p))throw Error('nonfinite-original-body-world-position');
 for(const p of skirtPositions)if(!finite(p))throw Error('nonfinite-original-skirt-world-position');
 for(const id of bodyIndices)if(!Number.isSafeInteger(id)||id>=n)
  throw Error('original-body-index-outside-source');
 for(const id of skirtIndices)if(!Number.isSafeInteger(id)||id>=343)
  throw Error('original-skirt-face-index-outside-source');
 if(coreBodyFaceMask.some(x=>x!==0&&x!==1))
  throw Error('genuine-source-torso-leg-face-mask-required');
 const vertexRegions=new Array(n);
 for(let i=0;i<n;i++){
  const mesh=sourceMeshIds[i];
  if(mesh>=sourceMeshNames.length)
   throw Error('missing-original-source-anatomical-mesh');
  let weightSum=0,best=0,top=-1;
  for(let j=0;j<4;j++){
   const t=i*4+j,w=skinWeights[t],bone=skinIndices[t];
   if(!finite(w)||w<0||w>1||bone>162)
    throw Error('invalid-original-163bone-skin-weight');
   weightSum+=w;
   if(w>top){top=w;best=bone;}
  }
  if(Math.abs(weightSum-1)>.003)
   throw Error('original-anatomical-skin-weights-not-normalized');
  vertexRegions[i]=top<.5?'UNKNOWN_ORIGINAL_BONE':
   groupBone(sourceBoneNamesByMesh[mesh][best]);
 }
 let skirtMin=Infinity,skirtMax=-Infinity;
 for(let k=1;k<skirtPositions.length;k+=3){
  skirtMin=Math.min(skirtMin,skirtPositions[k]);
  skirtMax=Math.max(skirtMax,skirtPositions[k]);
 }
 const height=skirtMax-skirtMin;
 if(height<.06||height>2.5)
  throw Error('source-skirt-original-height-unusable');
 const paddedMin=skirtMin-.05*height,paddedMax=skirtMax+.05*height;
 const selected=new Uint8Array(nFace);
 const selectedFaces=[],eligibleByMesh=Object.create(null),
  regionFaces=Object.seal({CORE_TORSO_HIPS:0,CORE_LEGS:0,CORE_MIXED_TORSO_LEGS:0});
 let intersected=0,excluded=0,unknown=0,coarseMaskExcluded=0,nonOverlaps=0,
  sourceOriginalCrossMeshFaces=0;
 for(let f=0;f<nFace;f++){
  const a=bodyIndices[3*f],b=bodyIndices[3*f+1],c=bodyIndices[3*f+2],
   ymin=Math.min(bodyPositions[3*a+1],bodyPositions[3*b+1],bodyPositions[3*c+1]),
   ymax=Math.max(bodyPositions[3*a+1],bodyPositions[3*b+1],bodyPositions[3*c+1]);
  if(ymax<paddedMin||ymin>paddedMax){nonOverlaps++;continue;}
  intersected++;
  const m=sourceMeshIds[a];
  if(sourceMeshIds[b]!==m||sourceMeshIds[c]!==m){
   sourceOriginalCrossMeshFaces++;continue;
  }
  const groups=[vertexRegions[a],vertexRegions[b],vertexRegions[c]];
  if(groups.includes('EXCLUDED_HEAD_ARMS')){excluded++;continue;}
  if(groups.includes('UNKNOWN_ORIGINAL_BONE')){unknown++;continue;}
  if(coreBodyFaceMask[f]!==1){coarseMaskExcluded++;continue;}
  selected[f]=1;selectedFaces.push(f);
  eligibleByMesh[m+':'+sourceMeshNames[m]]=
   (eligibleByMesh[m+':'+sourceMeshNames[m]]||0)+1;
  const key=groups.every(g=>g==='CORE_TORSO_HIPS')?'CORE_TORSO_HIPS':
   groups.every(g=>g==='CORE_LEGS')?'CORE_LEGS':'CORE_MIXED_TORSO_LEGS';
  regionFaces[key]++;
 }
 if(intersected!==selectedFaces.length+excluded+unknown+
  coarseMaskExcluded+sourceOriginalCrossMeshFaces)
  throw Error('original-core-source-face-classification-lost-count');
 // A height/part ROI can create cut boundaries even when original body
 // source faces are topologically incident 2/2. Inspect the WHOLE original
 // indexed face set and count the selected side of each unchanged edge.
 const edges=new Map();
 for(let f=0;f<nFace;f++){
  const a=bodyIndices[3*f],b=bodyIndices[3*f+1],c=bodyIndices[3*f+2];
  for(const [p,q] of [[a,b],[b,c],[c,a]]){
   if(p===q)continue;
   const key=p<q?p+'|'+q:q+'|'+p,old=edges.get(key);
   if(old){old.all++;old.roi+=selected[f];}
   else edges.set(key,{all:1,roi:selected[f]});
  }
 }
 let artificialCropEdges=0,originalIndexOpenEdges=0,
  nonmanifoldSelectionEdges=0,unresolvedSharedROI=0;
 for(const entry of edges.values()){
  if(entry.roi===1){
   if(entry.all===1)originalIndexOpenEdges++;
   else if(entry.all===2)artificialCropEdges++;
   else nonmanifoldSelectionEdges++;
  }else if(entry.roi>2)unresolvedSharedROI++;
 }
 const originalRoiOneFaceBoundaryEdges=artificialCropEdges+
  originalIndexOpenEdges+nonmanifoldSelectionEdges;
 const bands=[];
 let inward=0,outward=0,near=0,unobserved=0,segmentCount=0,
  minGap=null,mostInward=0;
 for(let row=0;row<7;row++){
  let centerX=0,centerZ=0,avgY=0;
  for(let j=0;j<48;j++){
   const p=(row*49+j)*3;
   centerX+=skirtPositions[p];centerZ+=skirtPositions[p+2];
   avgY+=skirtPositions[p+1];
  }
  centerX/=48;centerZ/=48;avgY/=48;
  const segs=[];
  for(const f of selectedFaces){
   const a=bodyIndices[3*f],b=bodyIndices[3*f+1],c=bodyIndices[3*f+2];
   const p=cutsAtY(bodyPositions,a,b,c,avgY);
   if(p)segs.push([p[0][0],p[0][1],p[1][0],p[1][1]]);
  }
  segmentCount+=segs.length;
  let bandIn=0,bandOut=0,bandNear=0,bandUnknown=0,
   bandMin=null,bandFarthestIn=0;
  for(let j=0;j<48;j++){
   const s=(row*49+j)*3,dx=skirtPositions[s]-centerX,
    dz=skirtPositions[s+2]-centerZ,
    radius=Math.hypot(dx,dz);
   if(!(radius>.005&&radius<3)){
    bandUnknown++;continue;
   }
   const ux=dx/radius,uz=dz/radius;
   let farthest=-1,parallelAmbiguous=false;
   for(const [ax,az,bx,bz] of segs){
    const ex=bx-ax,ez=bz-az,px=ax-centerX,pz=az-centerZ,
     det=ux*ez-uz*ex;
    if(Math.abs(det)<1e-11){
     if(Math.abs(px*uz-pz*ux)<1e-9)parallelAmbiguous=true;
     continue;
    }
    const t=(px*ez-pz*ex)/det,u=(px*uz-pz*ux)/det;
    if(t>=0&&t<=3&&u>=-1e-9&&u<=1+1e-9)
     farthest=Math.max(farthest,t);
   }
   if(parallelAmbiguous||farthest<0){bandUnknown++;continue;}
   const gap=radius-farthest;
   bandMin=bandMin===null?gap:Math.min(bandMin,gap);
   if(gap<-.002){bandIn++;bandFarthestIn=Math.max(bandFarthestIn,-gap);}
   else if(gap<=.002)bandNear++;
   else bandOut++;
  }
  if(bandIn+bandOut+bandNear+bandUnknown!==48)
   throw Error('source-skirt-core-ray-sector-accounting-failed');
  inward+=bandIn;outward+=bandOut;near+=bandNear;
  unobserved+=bandUnknown;
  if(bandMin!==null)minGap=minGap===null?bandMin:Math.min(minGap,bandMin);
  mostInward=Math.max(mostInward,bandFarthestIn);
  bands.push(Object.freeze({
   originalSkirtSourceBand:row,
   actualOriginalCoreSourceContourSegments:segs.length,
   coreSourceInwardRays:bandIn,coreSourceOutwardRays:bandOut,
   coreSourceNearZeroRays:bandNear,coreSourceUnknownRays:bandUnknown,
   minimumOriginalSourceGarmentMinusCoreRadius:
    bandMin===null?null:round(bandMin),
   originalSourceBodyAbsoluteDimensionsUnmeasured:true
  }));
 }
 if(inward+outward+near+unobserved!==336||bands.length!==7)
  throw Error('original-source-core-seven-ring-accounting-failed');
 return Object.freeze({
  schema:'P89-pure-original-skirt-specific-anatomical-core-shell-roi/v1',
  originalBodyFullIndexedTriangleCount:nFace,
  originalSourceSkirtIndexedTriangleCount:skirtIndices.length/3,
  originalSourceSkirtSevenBands:7,
  originalSourceSkirtFaceVertexCount:343,
  originalSkirtHeightSourceUnits:round(height),
  originalSkirtSpanPaddingSourceFraction:.05,
  sourceSkirtPhysicalWaistOrHemSizeCalibrated:false,
  sourceBodyFacesIntersectingActualSkirtHeight:intersected,
  originalTorsoHipLegCoreFacesInSkirtSpan:selectedFaces.length,
  excludedHeadArmCoreRegionFaces:excluded,
  unknownDominantBoneSourceFaces:unknown,
  coarseSourceFaceMaskExcludedCoreCandidates:coarseMaskExcluded,
  originalCrossMeshFaceIdentityViolations:sourceOriginalCrossMeshFaces,
  bodyFacesOutsideOriginalSkirtSpan:nonOverlaps,
  originalSourceCoreFaceRegions:regionFaces,
  originalSourceCoreFaceByImmutableMesh:Object.entries(eligibleByMesh)
   .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
   .map(([label,faces])=>({label,faces})),
  allSourceFaceBandsAccountedFor:true,
  roiArtificialSelectionCutEdges:artificialCropEdges,
  roiUnderlyingOriginalIndexedOneFaceEdges:originalIndexOpenEdges,
  roiNonmanifoldSelectionBoundaryEdges:nonmanifoldSelectionEdges,
  roiNonmanifoldWholeSelectedEdges:unresolvedSharedROI,
  roiOriginalSubsetBoundaryEdges:originalRoiOneFaceBoundaryEdges,
  cropBoundaryIsNotAnOriginalBodyHole:true,
  originalGLBIndexedUVSeamsNotAutomaticallyWelded:true,
  selectedOriginalBodyFacesNotAltered:true,
  actualSourceBodyTrueIndexedFacePlaneSegments:segmentCount,
  originalSourceSkirtCoreTrueRayTests:336,
  originalSourceSkirtCoreInwardRays:inward,
  originalSourceSkirtCoreOutwardRays:outward,
  originalSourceSkirtCoreNearZeroRays:near,
  originalSourceSkirtCoreUnobservedRays:unobserved,
  originalSourceSkirtCoreMinimumObservedRadiusGap:
   minGap===null?null:round(minGap),
  originalSourceSkirtCoreLargestObservedInwardRadiusGap:round(mostInward),
  sourceSkirtCoreSevenBandReceipts:bands,
  originalCoreBodyFaceSetIsNotWatertightClosedVolume:true,
  coreRayGapIsNotFullSignedBodyVolumeContainment:true,
  measuredOriginalSkirtSizeMissing:true,
  originalSourceRearPhotoAbsent:true,
  originalPhoto2DFallbackRequired:true,
  signedExteriorContainmentCertified:false,
  consumer3DAdmitted:false,releaseAuthorized:false
 });
}
/** Attested ORIGINAL public 163bone source only. No synthetic photo gate
 * alone can prove the genuine native browser, so source/pose receipts are
 * additionally bound to authentic P541+P84 original GLB browser test.
 */
export function auditActualOriginalSkirtCoreSpan89(args={}){
 const {avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  originalRig163Bones,selectedMeasuredFivePoseBvh,selectedActualWebGLPreview,
  independentlyVerifiedOriginalSeamBoundaryCount,
  independentlyVerifiedOriginalBodyTriangleCount}=args;
 if(!Object.hasOwn(RIG,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO||
  sourceAnatomyGLBSHA256!==RIG[avatar]||
  originalRig163Bones!==true||
  selectedMeasuredFivePoseBvh!==true||
  selectedActualWebGLPreview!==true||
  !Number.isSafeInteger(independentlyVerifiedOriginalSeamBoundaryCount)||
  independentlyVerifiedOriginalSeamBoundaryCount<1||
  !Number.isSafeInteger(independentlyVerifiedOriginalBodyTriangleCount)||
  independentlyVerifiedOriginalBodyTriangleCount<1)
  return refuse('unverified-original-public-photo-163bone-anatomy-or-genuine-BVH-source');
 try{
  const report=summarizeActualOriginalSkirtCoreSpan89(args);
  if(report.originalBodyFullIndexedTriangleCount!==
    independentlyVerifiedOriginalBodyTriangleCount)
   return refuse('original-anatomical-triangle-count-mismatch');
  return Object.freeze({
   schema:'P89-authentic-source-skirt-span-core-body-contour/v1',
   avatar,pose,originalSourcePhotoSHA256:sourcePhotoSHA256,
   sourceOriginalRigGLBSHA256:sourceAnatomyGLBSHA256,
   status:report.originalTorsoHipLegCoreFacesInSkirtSpan===0?
    'ACTUAL_SKIRT_CORE_FACES_UNOBSERVED_NOT_WEARABLE':
    report.originalSourceSkirtCoreInwardRays>0?
     'ACTUAL_SKIRT_CORE_INWARD_WITNESS_BLOCKED':
     'ACTUAL_SKIRT_CORE_CLEARANCE_UNCERTAIN_NOT_WEARABLE',
   originalSkirtCoreEvidence:report,
   fullOriginalBodyIndexedTopologyIndependentlyVerified:true,
   originalSeamOpenEdgesIndependentlyVerified:
    independentlyVerifiedOriginalSeamBoundaryCount,
   original163BoneSourceFaceProvenanceUsed:true,
   originalSkinnedPhotoMeshSourceProvenanceUsed:true,
   sourceCoreWorldScaleNotPhysicalGarmentMeasured:true,
   originalSkirtRearStillUnobserved:true,
   closedBodyVolumeCertified:false,signedExteriorContainmentCertified:false,
   originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const allowed=['bounded-authentic-source-skirt-and-original-anatomical-face-data-required',
   'nonfinite-original-body-world-position',
   'nonfinite-original-skirt-world-position',
   'original-body-index-outside-source','original-skirt-face-index-outside-source',
   'genuine-source-torso-leg-face-mask-required',
   'original-anatomical-skin-weights-not-normalized',
   'invalid-original-163bone-skin-weight',
   'missing-original-source-anatomical-mesh',
   'source-skirt-original-height-unusable',
   'original-core-source-face-classification-lost-count',
   'source-skirt-core-ray-sector-accounting-failed',
   'original-source-core-seven-ring-accounting-failed'];
  return refuse(allowed.includes(e.message)?e.message:
   'source-body-original-skirt-core-region-unverifiable');
 }
}
