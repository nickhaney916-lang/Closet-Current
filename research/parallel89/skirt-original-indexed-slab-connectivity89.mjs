/**
 * P89 true original 163bone source-index FACE EDGE continuity between seven
 * photographed skirt height sections. This is an independent READ-ONLY
 * topology witness: no coordinate-joined UV twins, no invented back, no
 * signed 3D volume, no physical garment fit or consumer 3D admission.
 */
const finite=Number.isFinite;
const cleanIndex=x=>x instanceof Uint16Array||x instanceof Uint32Array;
function planeCut(p,ids,y){
 const hits=[];
 for(let k=0;k<3;k++){
  const a=ids[k],b=ids[(k+1)%3],ya=p[3*a+1],yb=p[3*b+1];
  if(Math.abs(yb-ya)<1e-10)continue;
  const t=(y-ya)/(yb-ya);
  if(t<0||t>1)continue;
  const x=p[3*a]+t*(p[3*b]-p[3*a]);
  const z=p[3*a+2]+t*(p[3*b+2]-p[3*a+2]);
  if(!hits.some(v=>Math.hypot(x-v[0],z-v[1])<1e-7))
   hits.push([x,z]);
 }
 return hits.length===2;
}
export function auditOriginalIndexedSlabConnectivity89({
 bodyPositions,bodyIndices,selectedSourceFaceMask,skirtPositions
}={}){
 if(!(bodyPositions instanceof Float32Array)||bodyPositions.length<12||
  bodyPositions.length%3||bodyPositions.length>2100000||
  !cleanIndex(bodyIndices)||bodyIndices.length<3||bodyIndices.length%3||
  bodyIndices.length>3000000||
  !(selectedSourceFaceMask instanceof Uint8Array)||
  selectedSourceFaceMask.length!==bodyIndices.length/3||
  !(skirtPositions instanceof Float32Array)||skirtPositions.length!==343*3)
  throw Error('original-indexed-body-slab-input-required');
 for(const v of bodyPositions)if(!finite(v))throw Error('original-slab-body-nonfinite');
 for(const v of skirtPositions)if(!finite(v))throw Error('original-slab-skirt-nonfinite');
 const n=bodyPositions.length/3;
 for(const v of bodyIndices)if(v>=n)throw Error('original-slab-face-index-out-of-bounds');
 for(const v of selectedSourceFaceMask)if(v!==0&&v!==1)
  throw Error('original-slab-face-mask-binary-required');
 const heights=[];
 for(let row=0;row<7;row++){
  let h=0;
  for(let k=0;k<48;k++)h+=skirtPositions[3*(row*49+k)+1];
  heights.push(h/48);
 }
 const direction=Math.sign(heights[1]-heights[0]);
 if(!direction||heights.some((v,i)=>i&&
  (v-heights[i-1])*direction<=1e-7))
  throw Error('original-skirt-seven-rings-not-monotone-distinct');
 const results=[];
 let allSelectedFaces=0;
 for(const bit of selectedSourceFaceMask)allSelectedFaces+=bit;
 for(let band=0;band<6;band++){
  const lo=Math.min(heights[band],heights[band+1]),
   hi=Math.max(heights[band],heights[band+1]),
   lowPlane=heights[band],highPlane=heights[band+1],
   // Strictly inside the open 3D slab: a boundary-only source edge
   // is not a physical connection between cropped face interiors.
   slabEpsilon=Math.min(1e-6,Math.max(1e-9,(hi-lo)*1e-7));
  const faces=[],parent=[],edges=new Map();
  let sourceSlabInteriorFaces=0,sourceBoundaryOnlyFaces=0;
  for(let f=0;f<bodyIndices.length/3;f++){
   if(!selectedSourceFaceMask[f])continue;
   const ids=[bodyIndices[3*f],bodyIndices[3*f+1],bodyIndices[3*f+2]];
   if(new Set(ids).size!==3)throw Error('selected-original-source-degenerate-index-face');
   const ys=ids.map(i=>bodyPositions[3*i+1]);
   if(Math.min(...ys)>hi+1e-10||Math.max(...ys)<lo-1e-10)continue;
   const id=faces.length;
   const inside=Math.max(...ys)>lo+slabEpsilon&&
    Math.min(...ys)<hi-slabEpsilon;
   if(inside)sourceSlabInteriorFaces++;else sourceBoundaryOnlyFaces++;
   faces.push({ids,inside,low:planeCut(bodyPositions,ids,lowPlane),
    high:planeCut(bodyPositions,ids,highPlane)});
   parent.push(id);
   for(let e=0;e<3;e++){
    const a=ids[e],b=ids[(e+1)%3],
     key=a<b?a+':'+b:b+':'+a;
    if(!edges.has(key))edges.set(key,[]);
    edges.get(key).push(id);
   }
  }
  const find=i=>{
   let j=i;while(parent[j]!==j)j=parent[j];
   while(parent[i]!==i){const next=parent[i];parent[i]=j;i=next;}
   return j;
  };
  let originalSourceEdgeAdjacencies=0,nonmanifoldSourceEdges=0,
   originalOpenSlabSourceEdgeAdjacencies=0,
   outsideOrBoundarySlabEdgeRejections=0,degenerateEdgeRejections=0,
   openSlabNonmanifoldEdges=0;
  for(const [key,list] of edges){
   if(list.length<2)continue;
   // Key is from the exact unmodified glTF ORIGINAL source indices.
   // Reconstruct endpoints from those integers, NEVER world coincidence.
   const [aId,bId]=key.split(':').map(Number),
    ay=bodyPositions[3*aId+1],by=bodyPositions[3*bId+1];
   const inside=Math.max(ay,by)>lo+slabEpsilon&&
    Math.min(ay,by)<hi-slabEpsilon;
   if(list.length>2){
    nonmanifoldSourceEdges++;
    if(inside)openSlabNonmanifoldEdges++;
    continue;
   }
   originalSourceEdgeAdjacencies++;
   if(!inside||!faces[list[0]].inside||!faces[list[1]].inside){
    outsideOrBoundarySlabEdgeRejections++;continue;
   }
   const dx=bodyPositions[3*aId]-bodyPositions[3*bId],
    dy=ay-by,dz=bodyPositions[3*aId+2]-bodyPositions[3*bId+2];
   if(Math.hypot(dx,dy,dz)<=1e-10){
    degenerateEdgeRejections++;continue;
   }
   originalOpenSlabSourceEdgeAdjacencies++;
   const a=find(list[0]),b=find(list[1]);
   if(a!==b)parent[b]=a;
  }
  if(originalSourceEdgeAdjacencies!==
    originalOpenSlabSourceEdgeAdjacencies+
    outsideOrBoundarySlabEdgeRejections+degenerateEdgeRejections||
   sourceSlabInteriorFaces+sourceBoundaryOnlyFaces!==faces.length)
   throw Error('original-open-slab-edge-classification-nonconservative');
  const all=new Set(),lower=new Set(),upper=new Set();
  let sourceFacePlaneCutsAtLow=0,sourceFacePlaneCutsAtHigh=0;
  for(let i=0;i<faces.length;i++){
   const root=find(i);all.add(root);
   if(faces[i].low){lower.add(root);sourceFacePlaneCutsAtLow++;}
   if(faces[i].high){upper.add(root);sourceFacePlaneCutsAtHigh++;}
  }
  let bridged=0;
  for(const root of lower)if(upper.has(root))bridged++;
  const onlyLow=lower.size-bridged,onlyHigh=upper.size-bridged;
  if(bridged+onlyLow!==lower.size||bridged+onlyHigh!==upper.size||
   bridged>all.size||all.size>faces.length)
   throw Error('original-source-slab-edge-component-conservation-failed');
  results.push(Object.freeze({
   originalPhotoSkirtAdjacentHeightPair:[band,band+1],
   eligibleOriginalSelectedSourceFaces:faces.length,
   originalIndexedSharedEdgeAdjacencies:originalSourceEdgeAdjacencies,
   originalIndexedSharedEdgesWithOpenSlabInterior:
    originalOpenSlabSourceEdgeAdjacencies,
   originalIndexedSharedEdgesOutsideOrOnSlabBoundary:
    outsideOrBoundarySlabEdgeRejections,
   originalIndexedZeroLengthSourceEdgesRejected:degenerateEdgeRejections,
   originalIndexedNonmanifoldEdges:nonmanifoldSourceEdges,
   originalIndexedNonmanifoldEdgesWithinOpenSlab:openSlabNonmanifoldEdges,
   selectedSourceFacesWithPositiveSlabInterior:sourceSlabInteriorFaces,
   selectedSourceFacesOnlyTouchingSlabBoundary:sourceBoundaryOnlyFaces,
   sourceIndexedFaceEdgeComponents:all.size,
   lowerPlaneCutSelectedFaces:sourceFacePlaneCutsAtLow,
   upperPlaneCutSelectedFaces:sourceFacePlaneCutsAtHigh,
   lowerPlaneIndexedComponents:lower.size,
   upperPlaneIndexedComponents:upper.size,
   sourceIndexedEdgeConnectedBothPlanes:bridged,
   lowerOnlyIndexedComponents:onlyLow,
   upperOnlyIndexedComponents:onlyHigh,
   onlyOriginalVertexIndexSharedEdgesCountAsConnections:true,
   originalSourceSharedEdgeMustIntersectOpenSlabInterior:true,
   boundaryOnlyAndOutsideSharedEdgesNeverJoinSlabFaces:true,
   originalSourceZeroLengthEdgesNeverJoinSlabFaces:true,
   restSkinCompatibleVirtualUVSeamsNeverJoined:true,
   source3DVolumeAndGarmentWearabilityNotCertified:true
  }));
 }
 return Object.freeze({
  schema:'P89-original-selected-body-indexed-edge-slab-bridge/v1',
  originalSkirtPlaneCount:7,
  originalInterHeightSlabCount:6,
  selectedOriginalFaceCount:allSelectedFaces,
  heightOrder:direction>0?'ASCENDING':'DESCENDING',
  originalAdjacentSlabSourceEdgeConnectivity:results,
  allSixSlabsHaveIndexedEdgeBridge:results.every(v=>
   v.sourceIndexedEdgeConnectedBothPlanes>0&&
   v.originalIndexedNonmanifoldEdgesWithinOpenSlab===0),
  sourceIndexedLoopsAndExteriorNotProven:true,
  noInferredOrVirtualSeamBridges:true,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false
 });
}
