/**
 * Mission 2 P89 original 163-bone GLB: independent source-indexed
 * manifold eligibility of body components that genuinely intersect all
 * seven heights of the ORIGINAL lawful photographed skirt.
 *
 * No coordinate seam welding, inferred rear, altered original mesh, fitted
 * cloth or signed containment. Even a closed indexed surface is NOT wearer
 * body-volume, overlap or photo garment proof. Fail-closed research ONLY.
 */
const finite=Number.isFinite;
const indexArray=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const edgeKey=(a,b)=>a<b?a+':'+b:b+':'+a;
function areaSquared(p,a,b,c){
 const x=p[3*b]-p[3*a],y=p[3*b+1]-p[3*a+1],z=p[3*b+2]-p[3*a+2],
  u=p[3*c]-p[3*a],v=p[3*c+1]-p[3*a+1],w=p[3*c+2]-p[3*a+2];
 const nx=y*w-z*v,ny=z*u-x*w,nz=x*v-y*u;
 return nx*nx+ny*ny+nz*nz;
}
function planeSegment(p,ids,h){
 const points=[];
 const put=(x,z)=>{
  if(!points.some(q=>Math.hypot(x-q[0],z-q[1])<=1e-7))
   points.push([x,z]);
 };
 for(let j=0;j<3;j++){
  const a=ids[j],b=ids[(j+1)%3],
   ya=p[3*a+1],yb=p[3*b+1],dy=yb-ya;
  if(Math.abs(ya-h)<=1e-8)put(p[3*a],p[3*a+2]);
  if(Math.abs(yb-h)<=1e-8)put(p[3*b],p[3*b+2]);
  if(Math.abs(dy)>1e-10){
   const t=(h-ya)/dy;
   if(t>1e-9&&t<1-1e-9)
    put(p[3*a]+t*(p[3*b]-p[3*a]),p[3*a+2]+t*(p[3*b+2]-p[3*a+2]));
  }
 }
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)
  if(Math.hypot(points[i][0]-points[j][0],
   points[i][1]-points[j][1])>1e-7)return true;
 return false;
}
export function auditOriginalSevenHeightIndexedShellEligibility89({
 bodyPositions,bodyIndices,selectedSourceFaceMask,skirtPositions
}={}){
 const p=bodyPositions,idx=bodyIndices,mask=selectedSourceFaceMask,s=skirtPositions;
 if(!(p instanceof Float32Array)||p.length<12||p.length%3||
  p.length>2100000||!indexArray(idx)||idx.length<3||
  idx.length%3||idx.length>3000000||
  !(mask instanceof Uint8Array)||mask.length!==idx.length/3||
  !(s instanceof Float32Array)||s.length!==1029)
  throw Error('original-indexed-sevenheight-shell-source-arrays-required');
 for(const v of p)if(!finite(v))throw Error('original-indexed-shell-body-must-be-finite');
 for(const v of s)if(!finite(v))throw Error('original-indexed-shell-skirt-must-be-finite');
 for(const i of idx)if(i>=p.length/3)throw Error('original-indexed-shell-out-of-bounds-face');
 for(const bit of mask)if(bit!==0&&bit!==1)
  throw Error('original-indexed-shell-selected-face-mask-binary');
 const h=[];
 for(let r=0;r<7;r++){
  let y=0;for(let j=0;j<48;j++)y+=s[3*(r*49+j)+1];
  h.push(y/48);
 }
 const sign=Math.sign(h[1]-h[0]);
 if(sign===0||h.some((y,r)=>r>0&&(y-h[r-1])*sign<=1e-7))
  throw Error('original-indexed-shell-seven-photographed-planes-not-strict');
 const faces=[],edges=new Map(),parent=[],size=[];
 let selectedOriginalFaceCount=0,sourceDegenerateSelectedFaces=0;
 for(let f=0;f<mask.length;f++){
  if(!mask[f])continue;
  selectedOriginalFaceCount++;
  const ids=[idx[3*f],idx[3*f+1],idx[3*f+2]];
  if(new Set(ids).size!==3)
   throw Error('original-indexed-shell-repeated-source-face-index');
  if(areaSquared(p,...ids)<=1e-18){
   sourceDegenerateSelectedFaces++;continue;
  }
  const id=faces.length;
  const support=Array.from({length:7},(_,k)=>planeSegment(p,ids,h[k]));
  faces.push({id,ids,support});
  parent.push(id);size.push(1);
  for(let j=0;j<3;j++){
   const a=ids[j],b=ids[(j+1)%3],key=edgeKey(a,b);
   if(!edges.has(key))edges.set(key,{a,b,incident:[]});
   const dir=a<b?1:-1;
   edges.get(key).incident.push({id,dir});
  }
 }
 const find=i=>{
  let r=i;while(parent[r]!==r)r=parent[r];
  while(parent[i]!==i){const next=parent[i];parent[i]=r;i=next;}
  return r;
 };
 const join=(a,b)=>{
  a=find(a);b=find(b);if(a===b)return;
  if(size[a]<size[b])[a,b]=[b,a];
  parent[b]=a;size[a]+=size[b];
 };
 let sourceUniqueIndexedEdges=edges.size,originalExactlyTwoFaceEdges=0,
  originalSingleFaceBoundaryEdges=0,originalNonmanifoldEdges=0,
  originalSameWindingSharedEdges=0;
 for(const e of edges.values()){
  const n=e.incident.length;
  if(n===1)originalSingleFaceBoundaryEdges++;
  else if(n===2){
   originalExactlyTwoFaceEdges++;
   if(e.incident[0].dir===e.incident[1].dir)
    originalSameWindingSharedEdges++;
   join(e.incident[0].id,e.incident[1].id);
  }else originalNonmanifoldEdges++;
 }
 const summary=new Map();
 for(const face of faces){
  const root=find(face.id);
  if(!summary.has(root))summary.set(root,{
   originalFaces:0,sourceBoundaryEdges:0,
   sourceNonmanifoldEdges:0,windingConflictEdges:0,
   sampledHeightSupportMask:0
  });
  const z=summary.get(root);z.originalFaces++;
  for(let k=0;k<7;k++)if(face.support[k])
   z.sampledHeightSupportMask|=1<<k;
 }
 // A nonmanifold edge is NOT joined. It remains a disqualifier for
 // every ORIGINAL indexed-component touching it, not a pretend stitch.
 for(const e of edges.values()){
  const roots=new Set(e.incident.map(x=>find(x.id)));
  for(const root of roots){
   const r=summary.get(root);
   if(e.incident.length===1)r.sourceBoundaryEdges++;
   if(e.incident.length>2)r.sourceNonmanifoldEdges++;
   if(e.incident.length===2&&
    e.incident[0].dir===e.incident[1].dir)
    r.windingConflictEdges++;
  }
 }
 let allSeven=0,allSevenSourceBoundaryEdges=0,
  allSevenNonmanifoldEdges=0,allSevenWindingConflicts=0,
  allSevenClosedConsistentlyWoundIndexedCandidates=0;
 const perHeight=new Array(7).fill(0),all7Summaries=[];
 for(const z of summary.values()){
  for(let k=0;k<7;k++)
   if(z.sampledHeightSupportMask&(1<<k))perHeight[k]++;
  if(z.sampledHeightSupportMask!==127)continue;
  allSeven++;
  allSevenSourceBoundaryEdges+=z.sourceBoundaryEdges;
  allSevenNonmanifoldEdges+=z.sourceNonmanifoldEdges;
  allSevenWindingConflicts+=z.windingConflictEdges;
  if(z.sourceBoundaryEdges===0&&z.sourceNonmanifoldEdges===0&&
   z.windingConflictEdges===0)allSevenClosedConsistentlyWoundIndexedCandidates++;
  if(all7Summaries.length<32)all7Summaries.push(Object.freeze({
   originalIndexedSourceTriangles:z.originalFaces,
   originalIndexedBoundaryEdges:z.sourceBoundaryEdges,
   originalIndexedNonmanifoldEdges:z.sourceNonmanifoldEdges,
   originalIndexedSameDirectionSharedEdges:z.windingConflictEdges,
   intersectionWithAllSevenOriginalPhotoHeightPlanes:true,
   closedSourceFaceShellEligibleOnly:
    z.sourceBoundaryEdges===0&&z.sourceNonmanifoldEdges===0&&
    z.windingConflictEdges===0,
   original3DSignedBodyAndWearabilityUnproved:true
  }));
 }
 if(all7Summaries.length>allSeven||
  allSevenClosedConsistentlyWoundIndexedCandidates>allSeven||
  allSeven>summary.size||
  sourceDegenerateSelectedFaces+faces.length!==selectedOriginalFaceCount||
  originalSingleFaceBoundaryEdges+originalExactlyTwoFaceEdges+
   originalNonmanifoldEdges!==sourceUniqueIndexedEdges||
  [...summary.values()].reduce((n,z)=>n+z.originalFaces,0)!==faces.length)
  throw Error('original-indexed-sevenheight-shell-accounting-not-conserved');
 return Object.freeze({
  schema:'P89-original-163bone-sevenheight-component-shell-eligibility/v1',
  originalSkirtSampleHeightPlanes:7,
  selectedOriginalSourceTriangleCount:selectedOriginalFaceCount,
  selectedSourceDegenerateTriangles:sourceDegenerateSelectedFaces,
  selectedSourceNondegenerateTriangles:faces.length,
  originalIndexedFaceSurfaceComponents:summary.size,
  sourceOriginalIndexedUniqueEdges:sourceUniqueIndexedEdges,
  sourceExactlyTwoIncidentFaceEdges:originalExactlyTwoFaceEdges,
  sourceSingleIncidentFaceBoundaryEdges:originalSingleFaceBoundaryEdges,
  sourceNonmanifoldIndexedEdges:originalNonmanifoldEdges,
  sourceSameDirectionSharedFaceEdges:originalSameWindingSharedEdges,
  sourceFaceComponentCountAtEachHeight:perHeight,
  sourceComponentsIntersectingEveryOriginalSkirtHeight:allSeven,
  sourceAllSevenHeightComponentBoundaryEdges:allSevenSourceBoundaryEdges,
  sourceAllSevenHeightComponentNonmanifoldEdges:allSevenNonmanifoldEdges,
  sourceAllSevenHeightComponentWindingConflicts:allSevenWindingConflicts,
  allSevenClosedOrientedIndexedShellCandidates:
   allSevenClosedConsistentlyWoundIndexedCandidates,
  allSevenIndexedSourceComponentSummaries:all7Summaries,
  summariesBoundedAt32SourceComponents:true,
  originalSourceUVSeamTwinsNotWelded:true,
  signedOriginalHumanVolumeNotCertified:true,
  originalPhotoGarmentPhysicalDimensionsNotMeasured:true,
  fitted3DClothContactAndHistoricalRearNotVerified:true,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false
 });
}
