/**
 * P89 original Commons-0043 mamianqun-class OPEN-PANEL research hypothesis.
 * Original photo + alpha provide a FRONT SILHOUETTE ONLY. Neither the exact
 * museum artifact's back, inner overlap, pleat count nor closure is observed.
 *
 * Two topologically DETACHED 7-row panels are carved without changing ANY
 * original 343-vertex source shell position, rest, UV or 163-bone weights.
 * The 3/48-segment geometric overlap is a clearly labeled *arbitrary test
 * parameter*, not a measured seam or historical garment claim.
 *
 * A closed cylinder must never be silently promoted to a specimen-faithful
 * wrapped physical garment. Never consumer-render, save to a wardrobe, or
 * treat this proposal as fit, provenance for an unobserved surface, or approval.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const WIDTH=49,ROWS=7,SEGS=48;
const PARTS=Object.freeze([
 Object.freeze({id:'provisional-front-half',first:0,last:26}),
 Object.freeze({id:'provisional-back-half',first:23,last:48})
]);
const EXPECTED_TRIANGLES=6*SEGS*2;
const finite=Number.isFinite;
const refusal=reason=>Object.freeze({
 schema:'P89-commons-0043-open-panel-163bone-provisional/v1',
 status:'ORIGINAL_WRAP_PANEL_HYPOTHESIS_REFUSED',reason,
 originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 actualHistoricalPanelCountVerified:false,fasteningGeometryVerified:false,
 actualPhotoRearObserved:false,realGarmentPhysicalFitCertified:false,
 familyAlpha:'HOLD',releaseAuthorized:false
});
const isIndex=a=>a instanceof Uint16Array||a instanceof Uint32Array;
const isSkinIndex=a=>a instanceof Uint16Array||a instanceof Uint32Array;
function copyStride(to,arr,src,n){for(let k=0;k<n;k++)to.push(arr[n*src+k]);}
function expectedIndex(row,col){
 const a=row*WIDTH+col,b=a+WIDTH;
 return [a,a+1,b,a+1,b+1,b];
}
function validateSource(v){
 const {positions,restPositions,uv,skinIndices,skinWeights,indices}=v;
 if(!(positions instanceof Float32Array)||positions.length!==ROWS*WIDTH*3||
  !(restPositions instanceof Float32Array)||restPositions.length!==positions.length||
  !(uv instanceof Float32Array)||uv.length!==ROWS*WIDTH*2||
  !isSkinIndex(skinIndices)||skinIndices.length!==ROWS*WIDTH*4||
  !(skinWeights instanceof Float32Array)||skinWeights.length!==skinIndices.length||
  !isIndex(indices)||indices.length!==EXPECTED_TRIANGLES*3)return 'exact-original-skinned-7-by-49-grid-required';
 if(positions.some(n=>!finite(n)||Math.abs(n)>10)||
   restPositions.some(n=>!finite(n)||Math.abs(n)>10)||
   uv.some(n=>!finite(n)||n<-.001||n>1.001)||
   skinWeights.some(n=>!finite(n)||n<-.000001||n>1.000001)||
   skinIndices.some(n=>n>=163))return 'invalid-original-source-position-uv-or-163bone-skin';
 for(let i=0;i<ROWS*WIDTH;i++){
  let weights=0;
  for(let k=0;k<4;k++)weights+=skinWeights[4*i+k];
  if(Math.abs(weights-1)>1e-4)return 'original-skin-weights-not-normalized';
 }
 // Never accept an indexing donor that silently rewrote original triangles.
 for(let r=0;r<ROWS-1;r++)for(let c=0;c<SEGS;c++){
  const exp=expectedIndex(r,c),k=(r*SEGS+c)*6;
  for(let i=0;i<6;i++)if(indices[k+i]!==exp[i])
   return 'original-source-triangle-face-order-mismatch';
 }
 // P89's closing column is a geometric coincidence, NOT actual sewn closure.
 for(let r=0;r<ROWS;r++){
  const a=3*(r*WIDTH),b=a+3*SEGS;
  if(Math.hypot(positions[a]-positions[b],positions[a+1]-positions[b+1],
    positions[a+2]-positions[b+2])>1e-5)
   return 'original-source-cylindrical-proxy-cut-not-coincident';
 }
 return null;
}
export function deriveTwoDetachedPanelHypothesis89({
 sourceId,originalPhotoSHA256,originalSourceAttested=false,avatar,pose,
 rigBoneCount,positions,restPositions,uv,skinIndices,skinWeights,indices
}={}){
 if(sourceId!=='commons-0043'||originalPhotoSHA256!==PHOTO||
  originalSourceAttested!==true||!['female','male'].includes(avatar)||
  !POSES.has(pose)||rigBoneCount!==163)
  return refusal('original-photo-identity-and-authentic-163bone-context-required');
 const err=validateSource({positions,restPositions,uv,skinIndices,skinWeights,indices});
 if(err)return refusal(err);
 const snaps=[positions,restPositions,uv,skinIndices,skinWeights,indices].map(a=>a.slice());
 const panels=PARTS.map(part=>{
  const cols=part.last-part.first+1,segments=cols-1;
  const pos=[],rest=[],tex=[],bones=[],weight=[],srcIds=[],faces=[];
  for(let row=0;row<ROWS;row++)for(let col=part.first;col<=part.last;col++){
   const old=row*WIDTH+col;
   srcIds.push(old);
   copyStride(pos,positions,old,3);
   copyStride(rest,restPositions,old,3);
   copyStride(tex,uv,old,2);
   copyStride(bones,skinIndices,old,4);
   copyStride(weight,skinWeights,old,4);
  }
  for(let row=0;row<ROWS-1;row++)for(let c=0;c<segments;c++){
   const a=row*cols+c,b=a+cols;
   faces.push(a,a+1,b,a+1,b+1,b);
  }
  return {
   id:part.id,sourceAngularColumns:[part.first,part.last],
   sourceVertexIds:Uint16Array.from(srcIds),
   positions:Float32Array.from(pos),restPositions:Float32Array.from(rest),
   uv:Float32Array.from(tex),skinIndices:Uint16Array.from(bones),
   skinWeights:Float32Array.from(weight),indices:Uint16Array.from(faces),
   originalSourceSkinnedCoordinatesOnly:true,
   originalPhotographedGarmentPanelEdgesVerified:false,
   originalPhotographedRearUnobserved:true
  };
 });
 if(snaps.some((a,i)=>a.some((n,j)=>!Object.is(n,
  [positions,restPositions,uv,skinIndices,skinWeights,indices][i][j]))))
  return refusal('original-source-geometry-or-skin-mutated');
 const coverage=new Uint8Array(SEGS);
 for(const p of PARTS)for(let col=p.first;col<p.last;col++)coverage[col]++;
 const single=Array.from(coverage).filter(n=>n===1).length,
  double=Array.from(coverage).filter(n=>n===2).length;
 if(single!==45||double!==3||
  panels.reduce((n,p)=>n+p.indices.length/3,0)!==EXPECTED_TRIANGLES+double*12)
  return refusal('provisional-panel-angular-coverage-failed');
 const metrics=Object.freeze({
  schema:'P89-commons-0043-open-panel-163bone-provisional/v1',
  status:'TWO_DISCONNECTED_PROVISIONAL_PANELS_NO_SOURCE_CLOSURE_PROOF',
  avatar,pose,sourceId,originalPhotoSHA256:PHOTO,actual163BoneSourceRig:true,
  sourceOriginalShellVertices:ROWS*WIDTH,sourceOriginalShellTriangles:EXPECTED_TRIANGLES,
  separateHypotheticalPanelCount:2,
  separatePanelVertexCounts:Object.freeze(panels.map(p=>p.positions.length/3)),
  separatePanelTriangleCounts:Object.freeze(panels.map(p=>p.indices.length/3)),
  resultingResearchTriangleCount:EXPECTED_TRIANGLES+double*12,
  originalAngularSectorsCovered:SEGS,
  arbitraryDuplicatedAngularSectors:double,
  overlapWidthMeasuredOnRealGarment:false,overlapHypothesisFractionOfShell:double/SEGS,
  detachedOpenVerticalPanelEdges:4,
  originalHistoricalPanelCountVerified:false,exactSpecimenPleatsAndFastenersVerified:false,
  physicalClothClosureMade:false,photoMeasuredPanelBoundaries:false,
  sourceRestUVAnd163BoneWeightsCopiedUnchanged:true,
  sourceOriginalArraysUnmodified:true,originalPhotoOrMaskBytesModified:false,
  photoVerifiedFromOriginalPublicJpegOnly:true,sourceBacksideObserved:false,
  researchProposalNeverConsumerAdmissible:true,originalPhoto2DFallbackRequired:true,
  dynamicGarmentPhysicsVerified:false,bodyGarmentSignedClearanceVerified:false,
  humanAppearanceReviewed:false,consumer3DAdmitted:false,releaseAuthorized:false,
  familyAlpha:'HOLD'
 });
 return {status:metrics.status,metrics,panels};
}
