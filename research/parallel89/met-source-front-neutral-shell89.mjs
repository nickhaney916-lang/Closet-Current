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
  return refusal('actual-source-photo-and-original-mask-not-attested');
 if(front.imageId!==2551406||front.institutionallyVerifiedPart!=='a'||
  front.institutionallyVerifiedSide!=='front'||front.museumCaptionVerified!==true)
  return refusal('only-verified-original-museum-a-front-can-be-shell-anchor');
 const pos=front.positions,uv=front.originalPixelUV,index=front.indices;
 if(!(pos instanceof Float32Array)||!(uv instanceof Float32Array)||
  !(index instanceof Uint32Array)||pos.length<9||pos.length%3||
  uv.length!==pos.length/3*2||index.length<3||index.length%3)
  return refusal('source-front-vertex-layout-not-trustworthy');
 const vertexCount=pos.length/3;
 if(vertexCount>100000||index.length>350000)return refusal('unbounded-original-photo-geometry');
 const snapPos=digest(pos),snapUV=digest(uv),snapIndex=digest(index);
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
 if(digest(pos)!==snapPos||digest(uv)!==snapUV||digest(index)!==snapIndex)
  return refusal('original-photo-front-geometry-was-modified');
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
