/**
 * P89: original indexed 163bone anatomy contour CONNECTIVITY in each of
 * the seven photographed skirt source rings. Research-only, no 3D release.
 *
 * A plane intersection graph is connected ONLY by common ORIGINAL source
 * indexed edges/vertices. Coincident coordinates with disjoint original
 * indices (UV seams, different original source meshes) are strictly
 * counted as virtual candidates, NEVER joined or welded.
 *
 * Prior original 95%-named-skin-weight scenario is a HYPOTHESIS used only
 * to localize still-UNKNOWN rays; it does not alter the true 50% strict
 * original source body mask or prove closed physical body volume.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const indexed=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const finite=n=>Number.isFinite(n);
const printable=x=>typeof x==='string'&&x.length>0&&x.length<=96&&
 /^[\x20-\x7e]+$/.test(x);
const sum=a=>a.reduce((n,x)=>n+x,0);
const notVerified=reason=>Object.freeze({
 schema:'P89-original-indexed-photo-skirt-contour-connectivity-locked/v1',
 status:'SOURCE_CONTOUR_ORIGINAL_PROVENANCE_UNVERIFIABLE',reason,
 originalPhoto2DFallbackRequired:true,
 sourceBodyWatertightClosedVolumeCertified:false,
 sourceGarmentRealSizeMeasured:false,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
function region(b){
 const l=b.toLowerCase();
 if(/hand|finger|thumb|arm|forearm|shoulder|clavic|elbow|wrist|head|neck|eye|ear|face|jaw/.test(l))
  return 'EXCLUDED_HEAD_ARMS';
 if(/foot|toe|ankle|knee|calf|shin|thigh|upleg|lowleg|leg|heel/.test(l))
  return 'CORE_LEGS';
 if(/pelv|hip|spine|chest|torso|abdomen|back|waist|butt|root/.test(l))
  return 'CORE_TORSO_HIPS';
 return 'UNKNOWN_ORIGINAL_BONE';
}
const round=n=>Math.round(n*1e6)/1e6;
/** Original shared indexed intersection edge key. A cut exactly at an
 * original vertex gets that vertex key rather than its containing edge.
 * No position-based weld of distinct original GLB vertex identities. */
function cutSourceFace(p,a,b,c,y){
 const ids=[a,b,c],found=[];
 for(let i=0;i<3;i++){
  const s=ids[i],t=ids[(i+1)%3],y0=p[s*3+1],y1=p[t*3+1];
  if(Math.abs(y0-y1)<1e-10)continue;
  const f=(y-y0)/(y1-y0);
  if(f<0||f>1)continue;
  const x=p[s*3]+f*(p[t*3]-p[s*3]),
   z=p[s*3+2]+f*(p[t*3+2]-p[s*3+2]),
   key=f<1e-9?'v:'+s:
    f>1-1e-9?'v:'+t:
    s<t?'e:'+s+':'+t:'e:'+t+':'+s;
  if(!found.some(q=>Math.hypot(q.x-x,q.z-z)<1e-7))
   found.push({x,z,key});
 }
 return found.length===2?found:null;
}
function intersectRay(segs,cx,cz,ux,uz,radius){
 if(!(radius>.005&&radius<3))return 'unknown';
 let far=-1,parallelAmbiguous=false;
 for(const s of segs){
  const ax=s[0].x,az=s[0].z,bx=s[1].x,bz=s[1].z,
   ex=bx-ax,ez=bz-az,px=ax-cx,pz=az-cz,
   det=ux*ez-uz*ex;
  if(Math.abs(det)<1e-11){
   if(Math.abs(px*uz-pz*ux)<1e-9)parallelAmbiguous=true;
   continue;
  }
  const t=(px*ez-pz*ex)/det,v=(px*uz-pz*ux)/det;
  if(t>=0&&t<=3&&v>=-1e-9&&v<=1+1e-9)far=Math.max(far,t);
 }
 if(parallelAmbiguous||far<0)return 'unknown';
 const gap=radius-far;
 return gap<-.002?'inward':gap<=.002?'near':'outward';
}
const empty=()=>({inward:0,outward:0,near:0,unknown:0});
function indexTopology(segs){
 const graph=new Map(),edges=[];
 const append=(key,p,mesh)=>{
  if(!graph.has(key))graph.set(key,{
   key,x:p.x,z:p.z,mesh,neighbors:[],degree:0});
  const n=graph.get(key);
  // Exact original source identity should give compatible coordinates.
  if(Math.hypot(n.x-p.x,n.z-p.z)>1e-6)
   throw Error('shared-original-index-edge-has-incompatible-plane-crossing');
  return n;
 };
 for(const s of segs){
  const a=append(s[0].key,s[0],s.mesh),
   b=append(s[1].key,s[1],s.mesh);
  if(a.key===b.key)throw Error('original-indexed-source-cut-segment-zero-topological-span');
  a.neighbors.push(b.key);b.neighbors.push(a.key);
  a.degree++;b.degree++;
  edges.push([a.key,b.key]);
 }
 let open=0,branch=0,regular=0,isolated=0,
  components=0,cycles=0,openChains=0,branched=0,
  largestComponentSegments=0;
 for(const x of graph.values()){
  if(x.degree===1)open++;
  else if(x.degree===2)regular++;
  else if(x.degree>2)branch++;
  else isolated++;
 }
 const seen=new Set();
 for(const seed of graph.keys()){
  if(seen.has(seed))continue;
  components++;
  const queue=[seed];seen.add(seed);
  let degrees=0,endpoints=0,branches=0,nodes=0;
  for(let i=0;i<queue.length;i++){
   const n=graph.get(queue[i]);nodes++;degrees+=n.degree;
   if(n.degree===1)endpoints++;
   else if(n.degree>2)branches++;
   for(const nb of n.neighbors)if(!seen.has(nb)){
    seen.add(nb);queue.push(nb);
   }
  }
  const nEdges=degrees/2;
  largestComponentSegments=Math.max(largestComponentSegments,nEdges);
  if(branches>0)branched++;
  else if(endpoints===0&&nEdges===nodes&&nodes>=3)cycles++;
  else openChains++;
 }
 if(sum([open,branch,regular,isolated])!==graph.size||
  sum([cycles,openChains,branched])!==components||
  edges.length!==segs.length)
  throw Error('source-indexed-plane-contour-topology-count-mismatch');
 // Report source mesh identity and source UV seam positional COINCIDENCE
 // without merging such independent ORIGINAL index-graph nodes.
 let virtualSameMesh=0,virtualCrossMesh=0;
 const buckets=new Map(),q=.0000001;
 for(const n of graph.values()){
  const i=Math.round(n.x/q),j=Math.round(n.z/q),
   key=i+'|'+j;
  if(!buckets.has(key))buckets.set(key,[]);
  buckets.get(key).push(n);
 }
 const visited=new Set();
 for(const [key,arr] of buckets){
  const [i,j]=key.split('|').map(Number);
  for(const n of arr){
   for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){
    for(const other of buckets.get((i+di)+'|'+(j+dj))||[]){
     if(n.key===other.key||
      Math.hypot(n.x-other.x,n.z-other.z)>1e-7)continue;
     const a=n.key<other.key?n.key:other.key,
      b=n.key<other.key?other.key:n.key,
      pair=a+'~'+b;
     if(visited.has(pair))continue;visited.add(pair);
     if(n.mesh===other.mesh)virtualSameMesh++;
     else virtualCrossMesh++;
    }
   }
  }
 }
 return {
  originalIndexedContourSegments:segs.length,
  originalIndexedContourNodes:graph.size,
  genuineIndexedOpenEndpoints:open,
  genuineIndexedRegularDegreeTwoNodes:regular,
  originalIndexedBranchNodes:branch,
  originalIndexedGraphComponents:components,
  originalIndexedClosedGraphCycles:cycles,
  originalIndexedOpenGraphComponents:openChains,
  originalIndexedBranchingGraphComponents:branched,
  largestOriginalIndexedGraphComponentSegments:largestComponentSegments,
  coordinateEquivalentSeparateOriginalIndicesWithinSameMesh:virtualSameMesh,
  coordinateEquivalentSeparateOriginalIndicesAcrossMeshes:virtualCrossMesh,
  coordinateCoincidenceNeverSewn:true
 };
}
export function summarizeOriginalContourConnectivity89({
 bodyPositions,bodyIndices,skirtPositions,skirtIndices,
 coreBodyFaceMask,skinIndices,skinWeights,sourceMeshIds,
 sourceMeshNames,sourceBoneNamesByMesh
}={}){
 if(!(bodyPositions instanceof Float32Array)||
  bodyPositions.length<12||bodyPositions.length%3!==0||
  bodyPositions.length>2_100_000||
  !indexed(bodyIndices)||bodyIndices.length<6||
  bodyIndices.length%3!==0||bodyIndices.length>3_000_000||
  !(skirtPositions instanceof Float32Array)||
  skirtPositions.length!==343*3||
  !indexed(skirtIndices)||skirtIndices.length!==576*3||
  !(coreBodyFaceMask instanceof Uint8Array)||
  coreBodyFaceMask.length!==bodyIndices.length/3||
  !(skinIndices instanceof Uint16Array)||
  skinIndices.length!==bodyPositions.length/3*4||
  !(skinWeights instanceof Float32Array)||
  skinWeights.length!==skinIndices.length||
  !(sourceMeshIds instanceof Uint16Array)||
  sourceMeshIds.length!==bodyPositions.length/3||
  !Array.isArray(sourceMeshNames)||sourceMeshNames.length===0||
  sourceMeshNames.length>256||sourceMeshNames.some(x=>!printable(x))||
  !Array.isArray(sourceBoneNamesByMesh)||
  sourceBoneNamesByMesh.length!==sourceMeshNames.length||
  sourceBoneNamesByMesh.some(a=>!Array.isArray(a)||a.length!==163||
   a.some(x=>!printable(x))))
  throw Error('genuine-original-indexed-163bone-skin-skirt-required');
 const n=bodyPositions.length/3,nf=bodyIndices.length/3;
 for(const x of bodyPositions)if(!finite(x))
  throw Error('original-body-skinned-source-world-coordinate-invalid');
 for(const x of skirtPositions)if(!finite(x))
  throw Error('original-skirt-source-world-coordinate-invalid');
 for(const i of bodyIndices)if(i>=n)
  throw Error('original-body-indexed-face-invalid');
 for(const i of skirtIndices)if(i>=343)
  throw Error('original-skirt-face-index-invalid');
 if(coreBodyFaceMask.some(x=>x!==0&&x!==1))
  throw Error('original-body-source-core-face-mask-invalid');
 const sourceVertex=[];
 for(let v=0;v<n;v++){
  const m=sourceMeshIds[v];if(m>=sourceMeshNames.length)
   throw Error('original-body-source-mesh-identity-invalid');
  let total=0,best=-1,bone=0,core=0,banned=0,unknown=0,coreJoints=0;
  for(let k=0;k<4;k++){
   const i=v*4+k,w=skinWeights[i],joint=skinIndices[i];
   if(!finite(w)||w<0||w>1||joint>=163)
    throw Error('original-body-163bone-source-skin-weights-invalid');
   total+=w;
   if(w>best){best=w;bone=joint;}
   if(w<=1e-7)continue;
   const kind=region(sourceBoneNamesByMesh[m][joint]);
   if(kind==='EXCLUDED_HEAD_ARMS')banned+=w;
   else if(kind==='UNKNOWN_ORIGINAL_BONE')unknown+=w;
   else{core+=w;coreJoints++;}
  }
  if(Math.abs(total-1)>.003)
   throw Error('original-source-bone-skin-sum-incorrect');
  sourceVertex.push({mesh:m,
   strict:best<.5?'UNKNOWN_ORIGINAL_BONE':
    region(sourceBoneNamesByMesh[m][bone]),
   core,banned,unknown,coreJoints});
 }
 const strict=[],additional95=[];let facesStrict=0;
 for(let f=0;f<nf;f++){
  const a=bodyIndices[3*f],b=bodyIndices[3*f+1],c=bodyIndices[3*f+2],
   vs=[sourceVertex[a],sourceVertex[b],sourceVertex[c]],m=vs[0].mesh;
  if(!vs.every(v=>v.mesh===m)||
   vs.some(v=>v.strict==='EXCLUDED_HEAD_ARMS')||
   coreBodyFaceMask[f]!==1)continue;
  const allCore=vs.every(v=>v.strict==='CORE_TORSO_HIPS'||
   v.strict==='CORE_LEGS');
  const entry={a,b,c,mesh:m};
  if(allCore){strict.push(entry);facesStrict++;continue;}
  if(!vs.some(v=>v.strict==='UNKNOWN_ORIGINAL_BONE'))continue;
  if(vs.every(v=>v.core>=.95-1e-7&&
   v.banned<=.05+1e-7&&v.unknown<=.05+1e-7&&
   (v.strict!=='UNKNOWN_ORIGINAL_BONE'||v.coreJoints>=2)))
   additional95.push(entry);
 }
 const selected=strict.concat(additional95),rows=[];
 const tallies={strict:empty(),hypothetical95:empty()};
 let totalOpen=0,totalCycles=0,totalSeparateIndexCoincidences=0,
  totalMissing95=0;
 for(let row=0;row<7;row++){
  let cx=0,cz=0,y=0;
  for(let j=0;j<48;j++){
   const k=3*(row*49+j);
   cx+=skirtPositions[k];cz+=skirtPositions[k+2];y+=skirtPositions[k+1];
  }
  cx/=48;cz/=48;y/=48;
  const cutFaces=faces=>{
   const out=[];
   for(const f of faces){
    const pair=cutSourceFace(bodyPositions,f.a,f.b,f.c,y);
    if(pair)out.push(Object.assign(pair,{mesh:f.mesh}));
   }
   return out;
  };
  const strictCuts=cutFaces(strict),allCuts=strictCuts.concat(cutFaces(additional95));
  const t=indexTopology(allCuts),s=indexTopology(strictCuts);
  const ring={strict:empty(),hypothetical95:empty()};
  const unknownSectors=[];
  for(let j=0;j<48;j++){
   const k=3*(row*49+j),dx=skirtPositions[k]-cx,
    dz=skirtPositions[k+2]-cz,rad=Math.hypot(dx,dz),
    ux=rad>0?dx/rad:0,uz=rad>0?dz/rad:0,
    core=intersectRay(strictCuts,cx,cz,ux,uz,rad),
    hypothetical=intersectRay(allCuts,cx,cz,ux,uz,rad);
   ring.strict[core]++;ring.hypothetical95[hypothetical]++;
   tallies.strict[core]++;tallies.hypothetical95[hypothetical]++;
   if(hypothetical==='unknown')unknownSectors.push(j);
  }
  if(sum(Object.values(ring.strict))!==48||
   sum(Object.values(ring.hypothetical95))!==48)
   throw Error('original-skirt-ray-graph-ring-classification-inconsistent');
  totalMissing95+=unknownSectors.length;
  totalOpen+=t.genuineIndexedOpenEndpoints;
  totalCycles+=t.originalIndexedClosedGraphCycles;
  totalSeparateIndexCoincidences+=
   t.coordinateEquivalentSeparateOriginalIndicesWithinSameMesh+
   t.coordinateEquivalentSeparateOriginalIndicesAcrossMeshes;
  rows.push({
   originalSkirtSourceRing:row,
   originalStrictSourceContourSegments:strictCuts.length,
   original95NamedSourceContourSegments:allCuts.length,
   originalStrictOriginalIndexTopology:s,
   original95OriginalIndexTopology:t,
   originalStrictRingRayStatus:ring.strict,
   original95ResearchRingRayStatus:ring.hypothetical95,
   original95NoHitRayDirectionsCount:unknownSectors.length,
   original95NoHitSectorSequenceRunLengths:groupCircularRuns(unknownSectors,48),
   noOriginalSourceContoursEverBridged:true,
   cannotCertifySignedBodyVolumeOrRealGarmentMeasurements:true
  });
 }
 if(rows.length!==7||
  Object.values(tallies).some(x=>sum(Object.values(x))!==336)||
  tallies.hypothetical95.unknown!==totalMissing95)
  throw Error('original-7ring-source-contour-connectivity-accounting-broken');
 return Object.freeze({
  schema:'P89-original-indexed-skirt-ring-contour-graph-connectivity/v1',
  originalBodyIndexedTriangleCount:nf,
  originalSkirtIndexedTriangleCount:skirtIndices.length/3,
  genuineOriginalStrictCoreSourceFaceCount:facesStrict,
  hypothetical95AddedOriginalSourceFaces:additional95.length,
  originalSourceSkirtSpokeRayCount:336,
  originalStrictSourceRayCounts:tallies.strict,
  hypothetical95SourceRayCounts:tallies.hypothetical95,
  hypothetical95NoHitOriginalSkirtRays:totalMissing95,
  totalOriginalIndexGraphOpenEndpointsAcrossSevenRings:totalOpen,
  totalOriginalIndexClosedGraphCyclesAcrossSevenRings:totalCycles,
  totalGeometricCoordinateMatchesWithDistinctSourceIndices:totalSeparateIndexCoincidences,
  originalSourceSevenRingContourConnectivity:rows,
  virtualIndexTwinCoordinatesNotWelded:true,
  originalBodyNotProvenWatertightSignedVolume:true,
  noSourceOriginalModelMeshPhotoOrSkinMutation:true,
  sourceGarmentPhysicalWaistHemUnmeasured:true,
  originalSourceGarmentRearNotPhotographed:true,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false
 });
}
function groupCircularRuns(indices,total){
 const active=new Set(indices);
 if(active.size===0)return [];
 if(active.size===total)return [total];
 const runs=[];
 for(let i=0;i<total;i++){
  if(!active.has(i)||active.has((i+total-1)%total))continue;
  let n=0;
  while(n<total&&active.has((i+n)%total))n++;
  runs.push(n);
 }
 return runs.sort((a,b)=>b-a);
}
export function auditActualOriginalContourConnectivity89(args={}){
 const {avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  originalRig163Bones,selectedMeasuredFivePoseBvh,
  selectedActualWebGLPreview,
  independentlyVerifiedOriginal95NoHitGeometry}=args;
 if(!Object.hasOwn(RIG,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO||sourceAnatomyGLBSHA256!==RIG[avatar]||
  originalRig163Bones!==true||selectedMeasuredFivePoseBvh!==true||
  selectedActualWebGLPreview!==true||
  independentlyVerifiedOriginal95NoHitGeometry?.schema!==
   'P89-original-95percent-skin-core-nohit-plane-ray-geometry/v1'||
  independentlyVerifiedOriginal95NoHitGeometry?.originalSkirtSampledRays!==336||
  independentlyVerifiedOriginal95NoHitGeometry?.original95PercentSkinnedCoreFaceSetResearchOnly!==true)
  return notVerified('genuine-original-163bone-photo-and-independent-nohit-contour-required');
 try{
  const v=summarizeOriginalContourConnectivity89(args),
   previous=independentlyVerifiedOriginal95NoHitGeometry;
  if(v.originalBodyIndexedTriangleCount!==
   previous.originalIndexedBodyTriangleCount||
   v.genuineOriginalStrictCoreSourceFaceCount!==
    previous.originalStrictCoreFaceCount||
   v.hypothetical95AddedOriginalSourceFaces!==
    previous.original95PercentHypotheticalAddedFaces||
   Object.entries(v.hypothetical95SourceRayCounts).some(([k,n])=>
    n!==previous.original95PercentHypotheticalObservedRays[k])||
   v.hypothetical95NoHitOriginalSkirtRays!==
    previous.original95PercentHypotheticalUnknownRays||
   previous.originalSourceSevenSkirtRingNoHitGeometry?.length!==7||
   v.originalSourceSevenRingContourConnectivity.some((ring,i)=>
    ring.original95NamedSourceContourSegments!==
     previous.originalSourceSevenSkirtRingNoHitGeometry[i]?.originalSource95CorePlaneCutSegments||
    ring.original95NoHitRayDirectionsCount!==
     previous.originalSourceSevenSkirtRingNoHitGeometry[i]?.noHitRays))
   return notVerified('independent-source-index-original-contour-connectivity-and-ray-counts-disagree');
  return Object.freeze({
   schema:'P89-original-indexed-photo-skirt-contour-connectivity-locked/v1',
   status:'ORIGINAL_SOURCE_CONTOUR_CONNECTIVITY_MAPPED_NOT_WEARABLE',
   avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
   sourceOriginalBodyContourGraph:v,
   original7Ring336SourceRayCountsIndependentlyReconciled:true,
   originalBodyWatertightVolumeCertified:false,
   originalPhoto2DFallbackRequired:true,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const allowed=[
   'genuine-original-indexed-163bone-skin-skirt-required',
   'original-body-skinned-source-world-coordinate-invalid',
   'original-skirt-source-world-coordinate-invalid',
   'original-body-indexed-face-invalid','original-skirt-face-index-invalid',
   'original-body-source-core-face-mask-invalid',
   'original-body-source-mesh-identity-invalid',
   'original-body-163bone-source-skin-weights-invalid',
   'original-source-bone-skin-sum-incorrect',
   'shared-original-index-edge-has-incompatible-plane-crossing',
   'original-indexed-source-cut-segment-zero-topological-span',
   'source-indexed-plane-contour-topology-count-mismatch',
   'original-skirt-ray-graph-ring-classification-inconsistent',
   'original-7ring-source-contour-connectivity-accounting-broken'
  ];
  return notVerified(allowed.includes(e.message)?e.message:
   'original-source-contour-graph-not-verifiable');
 }
}
