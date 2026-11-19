/**
 * Mission 2 P89 -- TRUE institutional photo+conservative mask research FRONT
 * paired with an expressly UNOBSERVED neutral REAR and inferred side walls.
 *
 * The face connectivity comes solely from source-masked original RGB front
 * pixels. 2-centimeter or other real-world depth is NOT claimed: z is a
 * fixed, dimensionless image-space visualization offset.  A closed shell
 * is NOT measured sewn fabric, independent camera calibration, rigging,
 * physical wearability, human/owner approval, drape or collision clearance.
 *
 * RESEARCH-ONLY. Do not import into public consumer app, never promote 3D.
 */
import {buildMetOriginalMaskTexturedFront89 as sourceFront}
 from './met-original-mask-rgb-uv-front89.mjs';
import {createHash} from 'node:crypto';

const digest=x=>createHash('sha256').update(new Uint8Array(x.buffer,x.byteOffset,x.byteLength)).digest('hex');
const refusal=reason=>Object.freeze({
 schema:'M2-P89-original-photo-front-neutral-rear-closed-shell-RESEARCH/v1',
 status:'ORIGINAL_PHOTO_2D_REQUIRED',reason,
 sourcePhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
const edgeKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
const edgePairs=(a,b,c)=>[[a,b],[b,c],[c,a]];
const twoIncidence=indices=>{
 const counts=new Map();
 for(let i=0;i<indices.length;i+=3){
  const a=indices[i],b=indices[i+1],c=indices[i+2];
  if(a===b||b===c||c===a)return false;
  for(const [u,v] of edgePairs(a,b,c)){
   const k=edgeKey(u,v);const next=(counts.get(k)||0)+1;
   if(next>2)return false;
   counts.set(k,next);
  }
 }
 return counts.size>0&&[...counts.values()].every(x=>x===2);
};
/**
 * Real original binary-alpha front quadrilateral pixels can meet diagonally
 * at JUST ONE corner. Shared pixel-grid coordinate means the flat renderer
 * reuses that vertex, but a shell would have four side walls meeting at one
 * vertical edge. Such a vertex is NOT a valid sewn surface manifold.
 *
 * Separate disconnected incident triangle fans into multiple vertex indices
 * with byte-for-byte identical source XYZ and UV. No mask pixel, triangle
 * winding, original RGB or front geometry is changed. Deliberately fail for
 * >2 incident faces on one original edge.
 */
function splitDisconnectedOriginalSourceVertexFans(pos,uv,sourceIndex){
 const originalN=pos.length/3,faceCount=sourceIndex.length/3;
 const incident=Array.from({length:originalN},()=>[]);
 for(let f=0;f<faceCount;f++){
  const k=f*3;
  for(let c=0;c<3;c++){
   const v=sourceIndex[k+c];
   if(v>=originalN||!Number.isSafeInteger(v))return null;
   incident[v].push(f);
  }
 }
 const faces=Array.from(sourceIndex),positions=Array.from(pos),coords=Array.from(uv);
 let added=0,splitOriginalCorners=0,maxFans=1;
 for(let v=0;v<originalN;v++){
  const fan=incident[v];
  if(fan.length<2)continue;
  const parents=fan.map((_,i)=>i);
  const find=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;};
  const unite=(a,b)=>{const x=find(a),y=find(b);if(x!==y)parents[y]=x;};
  const neighbor=new Map();
  for(let j=0;j<fan.length;j++){
   const k=3*fan[j],a=faces[k],b=faces[k+1],c=faces[k+2];
   const triangle=[a,b,c];
   if(triangle.filter(x=>x===v).length!==1)return null;
   for(const x of triangle){
    if(x===v)continue;
    const list=neighbor.get(x)||[];
    list.push(j);neighbor.set(x,list);
   }
  }
  for(const list of neighbor.values()){
   if(list.length>2)return null;
   if(list.length===2)unite(list[0],list[1]);
  }
  const components=new Map();
  for(let j=0;j<fan.length;j++){
   const root=find(j),members=components.get(root)||[];
   members.push(fan[j]);components.set(root,members);
  }
  maxFans=Math.max(maxFans,components.size);
  if(components.size===1)continue;
  splitOriginalCorners++;
  let first=true;
  for(const members of components.values()){
   if(first){first=false;continue;}
   const copyId=positions.length/3;
   positions.push(pos[v*3],pos[v*3+1],pos[v*3+2]);
   coords.push(uv[v*2],uv[v*2+1]);
   for(const f of members){
    for(let c=0;c<3;c++)if(faces[f*3+c]===v)faces[f*3+c]=copyId;
   }
   added++;
  }
 }
 return {
  pos:new Float32Array(positions),uv:new Float32Array(coords),
  index:new Uint32Array(faces),
  duplicatedSourceCornerVertices:added,
  originallyDisconnectedIncidentFanCorners:splitOriginalCorners,
  maxOriginalSourceTriangleFansAtOnePhotoCorner:maxFans
 };
}

/**
 * Creates three separately addressable draw ranges:
 *  - original PHOTO RGB front (the ONLY observed surface)
 *  - neutral unphotographed rear (NEVER sample front photo onto rear)
 *  - neutral inferred side closure (no original source view)
 * All surfaces are topologically closed by indexing the SAME front/back
 * vertices; two triangle edge incidences are checked, not physical topology.
 */
export async function buildMetSourceFrontNeutralBackShell89(input={}){
 const front=await sourceFront(input);
 if(front.status!=='REAL_ORIGINAL_PHOTO_SOURCE_MASK_TEXTURED_FRONT_RESEARCH_UNAPPROVED')
  return refusal('source-front-rejected:'+String(front.reason||front.status||'unknown').slice(0,160));
 if(front.imageId!==2551406||front.institutionallyVerifiedPart!=='a'||
  front.institutionallyVerifiedSide!=='front'||front.museumCaptionVerified!==true)
  return refusal('only-verified-original-museum-a-front-can-be-shell-anchor');
 const originalPos=front.positions,originalUV=front.originalPixelUV,
  originalIndex=front.indices;
 if(!(originalPos instanceof Float32Array)||!(originalUV instanceof Float32Array)||
  !(originalIndex instanceof Uint32Array)||originalPos.length<9||originalPos.length%3||
  originalUV.length!==originalPos.length/3*2||originalIndex.length<3||originalIndex.length%3)
  return refusal('source-front-vertex-layout-not-trustworthy');
 const snapPos=digest(originalPos),snapUV=digest(originalUV),snapIndex=digest(originalIndex);
 const split=splitDisconnectedOriginalSourceVertexFans(originalPos,originalUV,originalIndex);
 if(!split)return refusal('source-mask-corner-incident-fan-topology-unverifiable');
 const {pos,uv,index}=split,vertexCount=pos.length/3;
 if(vertexCount>100000||index.length>350000)return refusal('unbounded-original-photo-geometry');
 const edges=new Map(),triangles=index.length/3;
 for(let i=0;i<index.length;i+=3){
  const a=index[i],b=index[i+1],c=index[i+2];
  if([a,b,c].some(v=>v>=vertexCount||!Number.isSafeInteger(v))||
    a===b||b===c||c===a)
   return refusal('bad-source-front-triangle-index');
  const ax=pos[3*a],ay=pos[3*a+1],
   bx=pos[3*b],by=pos[3*b+1],
   cx=pos[3*c],cy=pos[3*c+1];
  // Original alpha texture mesh has a forward +Z image-space orientation.
  const area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
  if(!(area>0))return refusal('source-original-front-triangle-winding-invalid');
  for(const [u,v] of edgePairs(a,b,c)){
   const key=edgeKey(u,v),previous=edges.get(key);
   if(!previous)edges.set(key,{u,v,count:1});
   else{
    // Opposite directed edges for adjacent front faces; no tear/twist.
    if(previous.count!==1||previous.u!==v||previous.v!==u)
     return refusal('source-original-front-mesh-edge-nonmanifold');
    previous.count=2;
   }
  }
 }
 const boundary=[...edges.values()].filter(e=>e.count===1);
 if(boundary.length<4||boundary.length>80000)
  return refusal('source-mask-contour-boundary-not-observed');
 const depth=.02; // DIMENSIONLESS source image-space trial, NOT meters.
 const points=new Float32Array(pos.length*2),coords=new Float32Array(uv.length*2);
 points.set(pos);coords.set(uv);
 for(let v=0;v<vertexCount;v++){
  points.set([pos[v*3],pos[v*3+1],-depth],(v+vertexCount)*3);
  // The unobserved back has zero texture coordinates. It MUST be rendered
  // with a distinct neutral shader/draw group; never a photo back map.
 }
 const frontLength=index.length,backLength=index.length,sideLength=boundary.length*6;
 const indices=new Uint32Array(frontLength+backLength+sideLength);
 indices.set(index);
 for(let i=0;i<frontLength;i+=3){
  const a=index[i],b=index[i+1],c=index[i+2],offset=frontLength+i;
  indices.set([c+vertexCount,b+vertexCount,a+vertexCount],offset);
 }
 for(let n=0;n<boundary.length;n++){
  const {u,v}=boundary[n],k=frontLength+backLength+n*6;
  indices.set([u,u+vertexCount,v,v,u+vertexCount,v+vertexCount],k);
 }
 if(!twoIncidence(indices))
  return refusal('source-conservative-shell-edge-incidence-not-two');
 if(digest(originalPos)!==snapPos||digest(originalUV)!==snapUV||
    digest(originalIndex)!==snapIndex)
  return refusal('original-photo-front-geometry-was-modified');
 // Split copies share EXACT original front pixel-space position+UV.
 // No authored garment geometry or original photographed silhouette moves.
 for(let i=0;i<index.length;i++){
  const src=originalIndex[i],dst=index[i];
  for(let c=0;c<3;c++)if(pos[dst*3+c]!==originalPos[src*3+c])
   return refusal('source-photo-triangle-geometry-after-corner-split-shifted');
  for(let c=0;c<2;c++)if(uv[dst*2+c]!==originalUV[src*2+c])
   return refusal('source-photo-triangle-original-uv-after-corner-split-changed');
 }
 return {
  schema:'M2-P89-original-photo-front-neutral-rear-closed-shell-RESEARCH/v1',
  status:'EDGE_CLOSED_SOURCE_SILHOUETTE_SHELL_INFERRED_REAR_UNAPPROVED',
  imageId:front.imageId,
  originalMuseumExactCaption:front.museumExactCaption,
  originalDecodedRGBSHA256:front.independentlyValidatedOriginalDecodedRGBSHA256,
  originalJPEGByteSHA256:front.actualOriginalJPEGByteSHA256,
  originalSourceConservativeMaskSHA256:front.originalConservativeMaskRawSHA256,
  originalSourceMaskUncertainPixelsExcluded:front.originalSourceBoundaryUncertaintyExcludedPixels,
  sourceMaskedOriginalRGBTexSHA256:front.originalSourceTextureRGBA_SHA256,
  // Front only: genuine authenticated source pixels. No fabricated back RGB.
  originalRGBAFront:front.textureRGBA,
  photoDimensions:[front.downsampledWidth,front.downsampledHeight],
  positions:points,uv:coords,indices,
  drawRanges:Object.freeze({
   sourcePhotoFront:Object.freeze({start:0,count:frontLength,observed:true}),
   unobservedNeutralBack:Object.freeze({start:frontLength,count:backLength,observed:false}),
   inferredNeutralSideWalls:Object.freeze({start:frontLength+backLength,count:sideLength,observed:false})
  }),
  frontOriginalTriangles:triangles,
  inferredRearTriangles:triangles,
  inferredSideTriangles:sideLength/3,
  sourceDerivedBoundaryEdges:boundary.length,
  originalSourcePinchedBoundaryCornersSplit:split.originallyDisconnectedIncidentFanCorners,
  duplicateVertexIndicesWithExactOriginalPhotoXYZAndUV:split.duplicatedSourceCornerVertices,
  largestDisconnectedOriginalTriangleFansAtOnePhotoCorner:
   split.maxOriginalSourceTriangleFansAtOnePhotoCorner,
  shellIndexedEdgeIncidenceExactlyTwo:true,
  originalVerifiedSourceFrontBuffersUnchanged:true,
  neutralBackHasNoOriginalPhotographRGB:true,
  materialGroupsMustBeDrawnSeparately:true,
  provisionalDepthDimensionlessImageUnits:depth,
  realPhysicalDepthMeasured:false,
  realGarmentBackObserved:false,
  approvedSourceMaskHumanReviewed:false,
  shellNotSewnFabric:true,
  original163BoneSkinningAttached:false,
  actualAnatomicalFitProved:false,
  anySweptCollisionOrDrapeProved:false,
  independentHumanRealismAccepted:false,
  sourcePhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 };
}
