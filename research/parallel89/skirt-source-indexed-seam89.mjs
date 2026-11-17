/**
 * M2 P89 independently measure virtual source edge matches on the original
 * CC0 public 163-bone body, without welding, re-indexing or modifying it.
 *
 * An indexed open boundary may be an intentional UV/normal seam, but
 * coincidence by position alone cannot prove surface closure. Only exact
 * two-edge, opposing-winding boundary twins with matching ORIGINAL rest
 * coordinates, source mesh identity, skin indices and weights qualify as
 * "source-provenance compatible twins"; these remain research-only virtual
 * evidence. True manifold vertex fans, signed containment, physical cloth
 * and even a true watertight volume remain wholly unproved.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSE=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const validIndex=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const finite=x=>Number.isFinite(x);
const safe=x=>Number.isSafeInteger(x)&&x>=0;
const fail=reason=>Object.freeze({
 schema:'P89-original-163bone-source-indexed-boundary-seam-v1',
 status:'SOURCE_ORIGINAL_BODY_SEAM_PROVENANCE_UNVERIFIABLE',reason,
 sourceIndexedBodyNeverModified:true,sourcePhoto2DFallbackRequired:true,
 signedExteriorContainmentCertified:false,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
const distance=(p,i,j)=>{
 const a=i*3,c=j*3;
 return Math.hypot(p[a]-p[c],p[a+1]-p[c+1],p[a+2]-p[c+2]);
};
const coord=(p,i)=>[p[i*3],p[i*3+1],p[i*3+2]]
 .map(x=>x.toFixed(5)).join('|');
/**
 * Independent bounded source edge grouping. Caller must supply genuine
 * original REST and SKIN provenance in the SAME index order as genuine
 * skinned pose mesh (P84 packs original bodies in source-mesh order).
 * Pure structural fixtures are NOT native source proof.
 */
export function summarizeOriginalBodyIndexedSeams89({
 posedPositions,indices,restPositions,skinIndices,skinWeights,sourceMeshIds
}={}){
 if(!(posedPositions instanceof Float32Array)||
  posedPositions.length<12||posedPositions.length%3!==0||
  posedPositions.length>2_100_000||
  !(restPositions instanceof Float32Array)||
  restPositions.length!==posedPositions.length||
  !validIndex(indices)||indices.length<12||indices.length%3!==0||
  indices.length>3_000_000||
  !(skinIndices instanceof Uint16Array)||
  skinIndices.length!==posedPositions.length/3*4||
  !(skinWeights instanceof Float32Array)||
  skinWeights.length!==skinIndices.length||
  !(sourceMeshIds instanceof Uint16Array)||
  sourceMeshIds.length!==posedPositions.length/3)
  throw Error('source-bounded-original-body-skinned-face-and-rest-provenance-required');
 const vertices=posedPositions.length/3;
 for(let i=0;i<posedPositions.length;i++)if(!finite(posedPositions[i])||
  !finite(restPositions[i]))
  throw Error('original-anatomical-rest-or-skinned-coordinate-nonfinite');
 for(const id of indices)if(!safe(id)||id>=vertices)
  throw Error('original-source-face-vertex-out-of-range');
 for(let i=0;i<vertices;i++){
  let sum=0;
  for(let j=0;j<4;j++){
   const at=i*4+j,w=skinWeights[at];
   if(!finite(w)||w<0||w>1||skinIndices[at]>162)
    throw Error('invalid-original-source-163-bone-skin-provenance');
   sum+=w;
  }
  if(Math.abs(sum-1)>.003)
   throw Error('source-skin-weights-not-normalized');
 }
 // Use raw original vertex indices only. Never weld or mutate GLB topology.
 const raw=new Map();
 for(let t=0;t<indices.length;t+=3){
  const tri=[indices[t],indices[t+1],indices[t+2]];
  for(const [a,b] of [[tri[0],tri[1]],[tri[1],tri[2]],[tri[2],tri[0]]]){
   if(a===b)continue;
   const k=Math.min(a,b)+'|'+Math.max(a,b),prev=raw.get(k);
   if(prev)prev.count++;
   else raw.set(k,{a,b,count:1});
  }
 }
 const groups=new Map(),coordinate=new Array(vertices);
 for(let i=0;i<vertices;i++)coordinate[i]=coord(posedPositions,i);
 let rawBoundary=0,collapsed=0;
 for(const edge of raw.values()){
  if(edge.count!==1)continue;
  rawBoundary++;
  const aa=coordinate[edge.a],bb=coordinate[edge.b];
  if(aa===bb){collapsed++;continue;}
  const key=aa<bb?aa+'@@'+bb:bb+'@@'+aa;
  const dir=aa<bb?1:-1;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push({a:edge.a,b:edge.b,dir});
 }
 const skinCompatible=(i,j)=>{
  if(sourceMeshIds[i]!==sourceMeshIds[j]||
   distance(restPositions,i,j)>1e-6||
   distance(posedPositions,i,j)>1e-5)return false;
  // Compare normalized bone-index/weight pairs independent of four-slot
  // ordering, but disallow different bone influence even with same position.
  const influences=idx=>{
   const a=[];
   for(let k=0;k<4;k++){
    const w=skinWeights[idx*4+k];
    if(w>1e-7)a.push([skinIndices[idx*4+k],w]);
   }
   a.sort((x,y)=>x[0]-y[0]||x[1]-y[1]);
   return a;
  };
  const a=influences(i),b=influences(j);
  if(a.length!==b.length)return false;
  return a.every((x,k)=>x[0]===b[k][0]&&Math.abs(x[1]-b[k][1])<=1e-6);
 };
 let sameSourceProvenancePairs=0,geometryTwinPairs=0,
  provenanceDisagrees=0,windingConflicts=0,ambiguousMulti=0,
  unmatchedOriginalEdges=0;
 for(const list of groups.values()){
  if(list.length===1){unmatchedOriginalEdges++;continue;}
  if(list.length!==2){ambiguousMulti+=list.length;continue;}
  const [a,b]=list;
  if(a.dir===b.dir){windingConflicts+=2;continue;}
  // Require original cross-edge endpoint identities to be separately
  // indexed and geometrically coincident at BOTH ends, with matching
  // true source rest, skin weights, and original mesh membership.
  const endpoints=a.dir===1?
   [a.a,a.b,b.b,b.a]:[a.b,a.a,b.a,b.b];
  const [p,q,s,t]=endpoints;
  if(distance(posedPositions,p,s)>1e-5||
   distance(posedPositions,q,t)>1e-5){
   ambiguousMulti+=2;continue;
  }
  geometryTwinPairs++;
  if(p!==s&&q!==t&&skinCompatible(p,s)&&skinCompatible(q,t))
   sameSourceProvenancePairs++;
  else provenanceDisagrees+=2;
 }
 const pairedEdges=sameSourceProvenancePairs*2;
 const classified=unmatchedOriginalEdges+windingConflicts+
  ambiguousMulti+provenanceDisagrees+pairedEdges+collapsed;
 if(classified!==rawBoundary)
  throw Error('original-source-seam-incidence-not-conserved');
 return Object.freeze({
  schema:'P89-pure-original-source-virtual-boundary-seam-evidence/v1',
  originalSourceBodyIndexedVertices:vertices,
  originalSourceBodyTriangleCount:indices.length/3,
  rawOriginalSourceSingleFaceBoundaryEdges:rawBoundary,
  originalSourceGeometryTwinPairs:geometryTwinPairs,
  compatibleOriginalRestAndSkinTwinEdgePairs:sameSourceProvenancePairs,
  compatibleOriginalRestAndSkinBoundaryEdges:pairedEdges,
  geometryTwinsWithConflictingOriginalProvenanceEdges:provenanceDisagrees,
  geometricTwinWindingConflictEdges:windingConflicts,
  geometricAmbiguousMultiCandidateBoundaryEdges:ambiguousMulti,
  sourceUnmatchedBoundaryEdges:unmatchedOriginalEdges,
  sourceGeometricallyCollapsedBoundaryEdges:collapsed,
  unresolvedOriginalBoundaryEdges:rawBoundary-pairedEdges,
  originalSourceBoundaryEdgeConservationVerified:true,
  originalSourceRestAndSkinAndMeshIdRequired:true,
  noVirtualRestOrSkinnedMeshMutation:true,
  spatialFiveDecimalCandidateNotExactTopologyProof:true,
  originalSourceGeometryOnlyPairedNotWelded:true,
  originalBodyManifoldVertexFansNotChecked:true,
  virtualTwinsNeverProofOfSealedPhysicalAnatomy:true,
  sourceBodyInsideOutsideNotProven:true,
  releaseAuthorized:false
 });
}
/** Accept no unverified user/body coordinates or claims of a "sealed" mesh. */
export function auditRealOriginalBodySeams89(args={}){
 const {avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  originalRig163Bones,selectedMeasuredFivePoseBvh,selectedActualWebGLPreview,
  originalBodyTopologyBoundaryEdges}=args;
 if(!Object.hasOwn(RIG,avatar)||!POSE.has(pose)||
  sourcePhotoSHA256!==PHOTO||
  sourceAnatomyGLBSHA256!==RIG[avatar]||
  originalRig163Bones!==true||
  selectedMeasuredFivePoseBvh!==true||
  selectedActualWebGLPreview!==true||
  !safe(originalBodyTopologyBoundaryEdges)||originalBodyTopologyBoundaryEdges<1)
  return fail('attested-original-public-163-bone-body-and-open-source-topology-required');
 try{
  const result=summarizeOriginalBodyIndexedSeams89(args);
  if(result.rawOriginalSourceSingleFaceBoundaryEdges!==
   originalBodyTopologyBoundaryEdges)
   return fail('original-immutable-indexed-body-boundary-identity-mismatch');
  return Object.freeze({
   schema:'P89-original-163bone-source-indexed-boundary-seam-v1',
   status:result.unresolvedOriginalBoundaryEdges===0?
    'ALL_ORIGINAL_BOUNDARIES_VIRTUALLY_PAIRED_NOT_WATERTIGHT_PROOF':
    'ORIGINAL_INDEXED_BODY_BOUNDARY_REMAINS_UNRESOLVED_FOR_SIGNED_FIT',
   avatar,pose,sourceId:'commons-0043',
   sourcePhotoOriginalSHA256:sourcePhotoSHA256,
   sourceOriginalRigGLBSHA256:sourceAnatomyGLBSHA256,
   originalBodyCompleteSourceFaceTopologyChecked:true,
   originalSourceIndexedSurfaceStillOpen:true,
   virtualSeamEvidence:result,
   independentOriginalGLBIndexedFaceBoundaryCountVerified:true,
   noSourceGeometryWeldOrRepair:true,
   trueClosedBodyVolumeCertified:false,
   signedExteriorContainmentCertified:false,
   actualGarmentRealDimensionsMeasured:false,
   sourceRearPhotoMissing:true,
   sourcePhoto2DFallbackRequired:true,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const known=['source-bounded-original-body-skinned-face-and-rest-provenance-required',
   'original-anatomical-rest-or-skinned-coordinate-nonfinite',
   'original-source-face-vertex-out-of-range',
   'invalid-original-source-163-bone-skin-provenance',
   'source-skin-weights-not-normalized',
   'original-source-seam-incidence-not-conserved'];
  return fail(known.includes(e.message)?e.message:'source-indexed-boundary-seam-analysis-unverifiable');
 }
}
