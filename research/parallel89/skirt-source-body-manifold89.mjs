/**
 * Mission 2 P89 original public 163-bone male/female anatomical GLB:
 * indexed-face closure / consistent orientation witness. A skinned body
 * with open source edges cannot support an unquestioned inside/outside
 * parity test even when body/skirt BVH triangles do not cross.
 *
 * No vertices, private photos, identity, mesh or texture are exported. Never
 * reindex, weld, mutate, fill holes, or fabricate source-anatomy patches.
 * Closure of an indexed shell is a NECESSARY, NOT SUFFICIENT condition:
 * self-intersection, vertex pinches, nested shells, signed ray parity, real
 * garment size, original rear photo, continuous cloth still unproved.
 */
const PHOTO_SHA='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIGS=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const validIndex=a=>a instanceof Uint16Array||a instanceof Uint32Array;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const no=reason=>Object.freeze({
 schema:'P89-source-locked-original-body-indexed-closure/v1',
 status:'ORIGINAL_BODY_CLOSURE_UNVERIFIABLE',reason,
 closedVolumeCertified:false,signedInsideOutsideVerified:false,
 originalGarmentRealWorldScaleMeasured:false,
 originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
/**
 * Pure topology evidence for the EXACT indexed buffer supplied. This
 * function has NO provenance and cannot approve an original 163-bone body.
 * Synthetic fixtures can independently exercise negative closure cases.
 */
export function summarizeIndexedBodyClosure89(positions,indices){
 if(!(positions instanceof Float32Array)||positions.length<12||
  positions.length%3!==0||positions.length>2_100_000||
  !validIndex(indices)||indices.length<12||
  indices.length%3!==0||indices.length>3_000_000)
  throw Error('bounded-original-indexed-surface-required');
 const vertices=positions.length/3,faces=indices.length/3;
 for(const x of positions)if(!finite(x))
  throw Error('nonfinite-source-vertex');
 for(const x of indices)if(!Number.isSafeInteger(x)||x>=vertices)
  throw Error('out-of-range-source-triangle-index');
 const parent=new Int32Array(vertices),rank=new Uint8Array(vertices),
  referenced=new Uint8Array(vertices);
 for(let i=0;i<vertices;i++)parent[i]=i;
 const find=x=>{let p=x;while(parent[p]!==p)p=parent[p];
  while(parent[x]!==p){const next=parent[x];parent[x]=p;x=next;}
  return p;};
 const join=(a,b)=>{let x=find(a),y=find(b);if(x===y)return;
  if(rank[x]<rank[y]){const z=x;x=y;y=z;}
  parent[y]=x;if(rank[x]===rank[y])rank[x]++;};
 const edges=new Map();let degenerateFaces=0,degenerateIndices=0,
  positionCoincidentDistinct=0;
 // Source GLBs sometimes split UV/seam vertices into different indices.
 // Merely coincident positions are NOT welded: they do not create a
 // topologically closed surface from the original indexed mesh.
 const seenCoordinate=new Map();
 for(let i=0;i<vertices;i++){
  const a=i*3,key=positions[a].toFixed(6)+'|'+
   positions[a+1].toFixed(6)+'|'+positions[a+2].toFixed(6);
  if(seenCoordinate.has(key))positionCoincidentDistinct++;
  else seenCoordinate.set(key,i);
 }
 for(let f=0;f<faces;f++){
  const a=indices[f*3],b=indices[f*3+1],c=indices[f*3+2];
  referenced[a]=referenced[b]=referenced[c]=1;
  join(a,b);join(b,c);
  if(a===b||b===c||c===a){degenerateIndices++;degenerateFaces++;continue;}
  const ab=a*3,bb=b*3,cb=c*3,
   ux=positions[bb]-positions[ab],
   uy=positions[bb+1]-positions[ab+1],
   uz=positions[bb+2]-positions[ab+2],
   vx=positions[cb]-positions[ab],
   vy=positions[cb+1]-positions[ab+1],
   vz=positions[cb+2]-positions[ab+2];
  const cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=ux*vy-uy*vx;
  if(cx*cx+cy*cy+cz*cz<1e-18)degenerateFaces++;
  for(const [x,y] of [[a,b],[b,c],[c,a]]){
   const lo=Math.min(x,y),hi=Math.max(x,y),
    key=lo+'|'+hi,dir=x===lo?1:-1;
   const old=edges.get(key);
   if(!old)edges.set(key,{count:1,winding:dir,orientationConflict:false});
   else{old.count++;
    if(old.count===2&&old.winding===dir)old.orientationConflict=true;
   }
  }
 }
 let boundaryEdges=0,nonmanifoldEdges=0,oppositeDirectedPairEdges=0,
  sameDirectedPairEdges=0,maxIncidentFacesPerEdge=0;
 for(const edge of edges.values()){
  maxIncidentFacesPerEdge=Math.max(maxIncidentFacesPerEdge,edge.count);
  if(edge.count===1)boundaryEdges++;
  else if(edge.count>2)nonmanifoldEdges++;
  else if(edge.orientationConflict)sameDirectedPairEdges++;
  else oppositeDirectedPairEdges++;
 }
 let activeVertices=0;const roots=new Set();
 for(let i=0;i<vertices;i++)if(referenced[i]){activeVertices++;roots.add(find(i));}
 const unreferencedVertices=vertices-activeVertices;
 // Edge-pair checks cannot by themselves prove simple manifold vertex fans,
 // globally embedded self-intersection-free body volume or orientation sign.
 const candidate=boundaryEdges===0&&nonmanifoldEdges===0&&
  sameDirectedPairEdges===0&&degenerateFaces===0&&
  roots.size===1&&unreferencedVertices===0;
 return Object.freeze({
  schema:'P89-pure-indexed-source-shell-edge-incidence/v1',
  originalIndexedVertexCount:vertices,originalIndexedTriangleCount:faces,
  actualSourceIndexDistinctEdges:edges.size,
  sourceOpenBoundaryEdgeCount:boundaryEdges,
  sourceNonmanifoldOverTwoFaceEdgeCount:nonmanifoldEdges,
  sourceSameDirectionPairEdgeCount:sameDirectedPairEdges,
  sourceOppositeDirectionPairEdgeCount:oppositeDirectedPairEdges,
  maximumSourceIncidentFacesPerEdge:maxIncidentFacesPerEdge,
  indexedSourceDegenerateTriangleCount:degenerateFaces,
  indexedSourceRepeatedVertexTriangleCount:degenerateIndices,
  sourceDisconnectedVertexIndexedIslands:roots.size,
  unreferencedOriginalSourceVertices:unreferencedVertices,
  independentlyCoincidentButIndexSplitVertices:positionCoincidentDistinct,
  originalSourceIndicesNeverWelded:true,
  originalSourceBuffersNeverModified:true,
  originalIndexedEdgePairCandidateOnly:candidate,
  orientationAndVertexFansProven:false,
  selfIntersectionFreeEmbeddedVolumeProven:false,
  signedInsideOutsideVerified:false,releaseAuthorized:false
 });
}
/**
 * Only the localhost native immutable photo and ORIGINAL CC0 GLB source
 * holder can call this research provenance gate. All classification is
 * recomputed from world-position and index buffers, not client labels.
 */
export function auditActualOriginalBodyClosure89({
 bodyPositions,bodyIndices,skirtPositions,skirtIndices,coreBodyFaceMask,
 avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
 originalRig163Bones=false,selectedMeasuredFivePoseBvh=false,
 selectedActualWebGLPreview=false
}={}){
 if(!Object.hasOwn(RIGS,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO_SHA||
  sourceAnatomyGLBSHA256!==RIGS[avatar]||
  originalRig163Bones!==true||
  selectedMeasuredFivePoseBvh!==true||
  selectedActualWebGLPreview!==true)
  return no('immutable-original-public-licensed-photo-and-anatomical-source-proof-required');
 if(!(skirtPositions instanceof Float32Array)||
  skirtPositions.length!==343*3||
  !validIndex(skirtIndices)||skirtIndices.length!==576*3||
  !(bodyPositions instanceof Float32Array)||
  bodyPositions.length<900||bodyPositions.length>2_100_000||
  !validIndex(bodyIndices)||bodyIndices.length<300||
  bodyIndices.length>3_000_000||bodyIndices.length%3!==0||
  !(coreBodyFaceMask instanceof Uint8Array)||
  coreBodyFaceMask.length!==bodyIndices.length/3||
  !coreBodyFaceMask.some(v=>v===1)||!coreBodyFaceMask.some(v=>v===0)||
  coreBodyFaceMask.some(v=>v!==0&&v!==1))
  return no('actual-343-photographed-source-and-full-163bone-indexed-body-triangle-faces-required');
 for(const v of skirtPositions)if(!finite(v))
  return no('nonfinite-source-skirt-world-vertex');
 for(const id of skirtIndices)if(id>=343)
  return no('invalid-original-photographed-triangle-index');
 try{
  const t=summarizeIndexedBodyClosure89(bodyPositions,bodyIndices);
  return Object.freeze({
   schema:'P89-source-locked-original-body-indexed-closure/v1',
   status:t.originalIndexedEdgePairCandidateOnly?
    'INDEXED_EDGE_PAIR_CANDIDATE_NOT_SIGNED_VOLUME_OR_WEARABLE':
    'ORIGINAL_BODY_OPEN_OR_NONMANIFOLD_CANNOT_PROVE_SIGNED_INSIDE_OUTSIDE',
   avatar,pose,sourceId:'commons-0043',
   originalSourcePhotoSHA256:sourcePhotoSHA256,
   original163BoneGLBSHA256:sourceAnatomyGLBSHA256,
   originalBodyWholeMeshFacesNotCoreFiltered:true,
   sourceWeightedCoreFaceMaskOnlyUsedForProvenance:true,
   originalPhotographed343Vertex576FaceGarmentPreserved:true,
   anatomicalSourceTopology:t,
   indexedPairCandidateForSeparateParityResearch:t.originalIndexedEdgePairCandidateOnly,
   closedVolumeCertified:false,signedInsideOutsideVerified:false,
   clothMayStillBeInsideBodyDespiteNoTransverseBVHPairs:true,
   sourceGarmentAbsoluteSizeUnknown:true,
   originalPhotoRearAbsent:true,humanAppearanceApproved:false,
   originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const known=['bounded-original-indexed-surface-required','nonfinite-source-vertex',
   'out-of-range-source-triangle-index'];
  return no(known.includes(e.message)?e.message:
   'genuine-original-body-source-manifold-proof-failed');
 }
}
