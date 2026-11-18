/**
 * Mission 2 / P89: exact original CC0 163-bone indexed face connectivity
 * across the SEVEN real photographed skirt-height sample planes.
 *
 * Unlike a tally of six independent slab bridges, this constructs one
 * source-indexed multi-slab surface graph. Only genuinely overlapping
 * OPEN-slab face interiors join through original nondegenerate shared edges.
 * Across a height interface, only the SAME indexed original face spanning
 * that plane, or two source faces sharing a nonzero original horizontal
 * indexed edge ON that plane, can join. Vertex-only/UV seam/posed-coordinate
 * coincidences must never close the graph.
 *
 * Even all-seven geometric continuity is NOT a watertight, signed, fitted,
 * measured, rendered, or owner-approved body/cloth certificate. Pure read-only
 * source research; no consumer 3D, no production access, 2D fallback always.
 */
const finite=Number.isFinite;
const validIndices=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const dist3=(p,a,b)=>Math.hypot(
 p[3*a]-p[3*b],p[3*a+1]-p[3*b+1],p[3*a+2]-p[3*b+2]);
const indexEdge=(a,b)=>a<b?a+':'+b:b+':'+a;
function faceAreaNonzero(p,ids){
 const [a,b,c]=ids,ax=p[3*b]-p[3*a],ay=p[3*b+1]-p[3*a+1],
  az=p[3*b+2]-p[3*a+2],bx=p[3*c]-p[3*a],
  by=p[3*c+1]-p[3*a+1],bz=p[3*c+2]-p[3*a+2];
 return Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx)>1e-12;
}
function crossesPlaneWithSegment(p,ids,y){
 const hits=[];
 const add=(x,z)=>{
  if(!hits.some(v=>Math.hypot(v[0]-x,v[1]-z)<=1e-7))hits.push([x,z]);
 };
 for(let k=0;k<3;k++){
  const a=ids[k],b=ids[(k+1)%3],
   y0=p[3*a+1],y1=p[3*b+1];
  if(Math.abs(y0-y)<1e-8)add(p[3*a],p[3*a+2]);
  if(Math.abs(y1-y)<1e-8)add(p[3*b],p[3*b+2]);
  const delta=y1-y0;
  if(Math.abs(delta)<=1e-10)continue;
  const t=(y-y0)/delta;
  if(t>1e-9&&t<1-1e-9)add(
   p[3*a]+t*(p[3*b]-p[3*a]),
   p[3*a+2]+t*(p[3*b+2]-p[3*a+2]));
 }
 for(let i=0;i<hits.length;i++)for(let j=i+1;j<hits.length;j++)
  if(Math.hypot(hits[i][0]-hits[j][0],hits[i][1]-hits[j][1])>1e-7)
   return true;
 return false;
}
function validate({bodyPositions:p,bodyIndices:idx,selectedSourceFaceMask:mask,skirtPositions:s}={}){
 if(!(p instanceof Float32Array)||p.length<12||p.length%3||
  p.length>2100000||!validIndices(idx)||idx.length<3||
  idx.length%3||idx.length>3000000||
  !(mask instanceof Uint8Array)||mask.length!==idx.length/3||
  !(s instanceof Float32Array)||s.length!==1029)
  throw Error('original-sevenheight-indexed-source-input-required');
 for(const v of p)if(!finite(v))throw Error('original-sevenheight-body-nonfinite');
 for(const v of s)if(!finite(v))throw Error('original-sevenheight-skirt-nonfinite');
 for(const i of idx)if(i>=p.length/3)throw Error('original-sevenheight-source-index-out-of-bounds');
 for(const bit of mask)if(bit!==0&&bit!==1)
  throw Error('original-sevenheight-mask-not-binary');
 const height=[];
 for(let k=0;k<7;k++){
  let y=0;for(let j=0;j<48;j++)y+=s[3*(49*k+j)+1];
  height.push(y/48);
 }
 const dir=Math.sign(height[1]-height[0]);
 if(!dir||height.some((y,k)=>k&&(y-height[k-1])*dir<=1e-7))
  throw Error('original-sevenheight-photographed-bands-not-strict');
 return height;
}
export function auditOriginalIndexedSevenHeightComponents89(args={}){
 const p=args.bodyPositions,idx=args.bodyIndices,mask=args.selectedSourceFaceMask;
 const heights=validate(args);
 const sources=[],srcId=[];
 let selectedOriginalFaces=0,geometryDegenerateSelectedFaces=0;
 for(let f=0;f<mask.length;f++){
  if(!mask[f])continue;
  selectedOriginalFaces++;
  const ids=[idx[3*f],idx[3*f+1],idx[3*f+2]];
  if(new Set(ids).size!==3)
   throw Error('original-sevenheight-repeated-source-vertex-index');
  if(!faceAreaNonzero(p,ids)){
   geometryDegenerateSelectedFaces++;continue;
  }
  const ys=ids.map(i=>p[3*i+1]);
  sources.push({f,ids,ymin:Math.min(...ys),ymax:Math.max(...ys)});
  srcId.push(f);
 }
 // A global node represents one original indexed triangle within ONE slab.
 const parent=[],sizes=[],nodes=[],nodeByBand=[],bandStats=[];
 const find=n=>{
  let k=n;while(parent[k]!==k)k=parent[k];
  while(parent[n]!==n){const next=parent[n];parent[n]=k;n=next;}
  return k;
 };
 const join=(a,b)=>{
  a=find(a);b=find(b);if(a===b)return;
  if(sizes[a]<sizes[b])[a,b]=[b,a];
  parent[b]=a;sizes[a]+=sizes[b];
 };
 let genuineWithinBandEdgeUnions=0,boundaryOrOutsideEdgeRejects=0,
  nonmanifoldWithinBandSharedEdges=0;
 for(let band=0;band<6;band++){
  const lo=Math.min(heights[band],heights[band+1]),
   hi=Math.max(heights[band],heights[band+1]),
   eps=Math.min(1e-6,Math.max(1e-9,(hi-lo)*1e-7));
  const current=new Map(),edges=new Map();
  for(const f of sources){
   if(f.ymax<=lo+eps||f.ymin>=hi-eps)continue;
   if(nodes.length>=500000)
    throw Error('original-sevenheight-active-source-graph-unbounded');
   const node=nodes.length;
   parent.push(node);sizes.push(1);
   nodes.push({node,band,sourceFace:f.f,ids:f.ids,
    below:crossesPlaneWithSegment(p,f.ids,heights[band]),
    above:crossesPlaneWithSegment(p,f.ids,heights[band+1])});
   current.set(f.f,node);
   for(let k=0;k<3;k++){
    const a=f.ids[k],b=f.ids[(k+1)%3],key=indexEdge(a,b);
    if(!edges.has(key))edges.set(key,{a,b,list:[]});
    edges.get(key).list.push(node);
   }
  }
  let unions=0,invalid=0,nonmanifold=0;
  for(const edge of edges.values()){
   if(edge.list.length<2)continue;
   const a=edge.a,b=edge.b,ay=p[3*a+1],by=p[3*b+1],
    intersectsOpen=Math.max(ay,by)>lo+eps&&
     Math.min(ay,by)<hi-eps;
   if(edge.list.length>2){nonmanifold++;continue;}
   if(!intersectsOpen||dist3(p,a,b)<=1e-10){
    invalid++;continue;
   }
   join(edge.list[0],edge.list[1]);unions++;
  }
  const all=new Set(),lower=new Set(),upper=new Set();
  for(const node of current.values()){
   const root=find(node),n=nodes[node];
   all.add(root);
   if(n.below)lower.add(root);
   if(n.above)upper.add(root);
  }
  let direct=0;for(const root of lower)if(upper.has(root))direct++;
  bandStats.push(Object.freeze({
   originalPhotoSkirtHeightInterval:[band,band+1],
   originalActiveSourceTriangles:current.size,
   originalIndexedLocalSurfaceComponents:all.size,
   actualSourceOpenSlabIndexedEdgeLinks:unions,
   originalIndexedNonmanifoldLocalEdges:nonmanifold,
   outsideOrDegenerateSourceEdgeLinksRejected:invalid,
   trueSourceIndexedComponentsReachingBothPlanes:direct,
   originalLowerPlaneNonpointComponents:lower.size,
   originalUpperPlaneNonpointComponents:upper.size,
   pointOnlyCutDoesNotCountAsSourceSegment:true
  }));
  genuineWithinBandEdgeUnions+=unions;
  boundaryOrOutsideEdgeRejects+=invalid;
  nonmanifoldWithinBandSharedEdges+=nonmanifold;
  nodeByBand.push(current);
 }
 const originalComponentsWithinBands=bandStats.reduce(
  (n,r)=>n+r.originalIndexedLocalSurfaceComponents,0);
 let acrossSameOriginalFace=0,acrossExactOriginalPlaneEdge=0,
  nonmanifoldPlaneEdgeRejects=0;
 // Link an original source triangle occupying true surface interiors on
 // both sides of an exact observed skirt plane, not point-only contact.
 for(let seam=1;seam<6;seam++){
  const lower=nodeByBand[seam-1],upper=nodeByBand[seam],
   y=heights[seam],eps=1e-7,keys=new Map();
  for(const [fid,node] of lower){
   const counterpart=upper.get(fid);
   if(counterpart!==undefined&&nodes[node].above&&nodes[counterpart].below){
    join(node,counterpart);acrossSameOriginalFace++;
   }
  }
  // A genuinely shared ORIGINAL indexed horizontal source edge on the
  // sampling plane can also attach different faces of either adjacent band.
  for(const [band,map] of [[seam-1,lower],[seam,upper]]){
   for(const [fid,node] of map){
    const ids=nodes[node].ids;
    for(let j=0;j<3;j++){
     const a=ids[j],b=ids[(j+1)%3];
     if(Math.abs(p[3*a+1]-y)>eps||
      Math.abs(p[3*b+1]-y)>eps||dist3(p,a,b)<=1e-7)continue;
     const key=indexEdge(a,b);
     if(!keys.has(key))keys.set(key,{faces:new Set(),lower:[],upper:[]});
     const record=keys.get(key);record.faces.add(fid);
     record[band===seam-1?'lower':'upper'].push({fid,node});
    }
   }
  }
  for(const record of keys.values()){
   if(record.faces.size>2){nonmanifoldPlaneEdgeRejects++;continue;}
   if(record.faces.size!==2)continue;
   for(const a of record.lower)for(const b of record.upper){
    if(a.fid===b.fid)continue;
    if(!nodes[a.node].above||!nodes[b.node].below)continue;
    join(a.node,b.node);acrossExactOriginalPlaneEdge++;
   }
  }
 }
 const coverage=new Map();
 for(const n of nodes){
  const root=find(n.node),mask=coverage.get(root)||0;
  let bits=mask;
  if(n.below)bits|=1<<n.band;
  if(n.above)bits|=1<<(n.band+1);
  coverage.set(root,bits);
 }
 const perHeight=new Array(7).fill(0);
 let allSeven=0,noPlane=0,partial=0;
 for(const bits of coverage.values()){
  if(!bits)noPlane++;
  else if(bits===127)allSeven++;
  else partial++;
  for(let plane=0;plane<7;plane++)if(bits&(1<<plane))perHeight[plane]++;
 }
 const any=coverage.size;
 if(allSeven+noPlane+partial!==any||
  perHeight.some(x=>x>any)||
  acrossSameOriginalFace>nodes.length||
  nodes.length!==bandStats.reduce((n,r)=>n+r.originalActiveSourceTriangles,0))
  throw Error('original-sevenheight-source-component-coverage-not-conservative');
 return Object.freeze({
  schema:'P89-original-163bone-seven-photographed-height-source-component/v1',
  originalPhotographedSkirtHeightCount:7,
  originalPhotographedSkirtSlabCount:6,
  selectedOriginalIndexedFaceCount:selectedOriginalFaces,
  originalSelectedGeometricDegenerateFaceCount:geometryDegenerateSelectedFaces,
  originalSourceSlabFaceOccurrences:nodes.length,
  sourceOriginalIndexedWithinSlabComponents:originalComponentsWithinBands,
  originalIndexedOpenSlabEdgeLinks:genuineWithinBandEdgeUnions,
  originalOutOfSlabOrDegenerateEdgeLinksRejected:boundaryOrOutsideEdgeRejects,
  originalNonmanifoldWithinSlabEdges:nonmanifoldWithinBandSharedEdges,
  authenticOriginalSameFaceCrossPlaneLinks:acrossSameOriginalFace,
  originalIndexedHorizontalPlaneEdgeLinks:acrossExactOriginalPlaneEdge,
  originalNonmanifoldPlaneEdgeLinksRejected:nonmanifoldPlaneEdgeRejects,
  trueSourceConnectedComponentsAcrossSixSlabs:any,
  sourceComponentsCrossingAllSevenHeightPlanes:allSeven,
  sourceComponentsCoveringFewerThanSevenHeightPlanes:partial,
  sourceComponentsTouchingNoMeasuredHeightPlane:noPlane,
  trueOriginalSourceComponentCountPerHeight:perHeight,
  originalSixClippedSourceSlabs:bandStats,
  oneBodyExteriorProven:false,
  sourceShellSignedAndWatertight:false,
  originalPhysicalGarmentFitProven:false,
  sourceOriginalUVSeamNeverWelded:true,
  onlyOriginalIndexedOpenSlabAndOriginalInterfaceEdgesJoined:true,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false
 });
}
