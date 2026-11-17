/**
 * Closet Current M2 / P89: LOCALIZE missing/foreign original anatomical
 * source indexed-body seam edges, without reindexing, virtual welding,
 * modifying, disclosing or exporting original source coordinates.
 *
 * The existing independent original 163-bone GLB seam audit is authoritative
 * for boundary-twin eligibility. This independent region checker classifies
 * only aggregate original source-mesh provenance, dominant source bone
 * regions and normalized vertical areas. No geometry repairs or signed
 * inside/outside interpretation. Research-only, #255 HOLD.
 */
const PHOTO_SHA='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const MODELS=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const canIndex=v=>v instanceof Uint16Array||v instanceof Uint32Array;
const clean=s=>typeof s==='string'&&s.length>0&&s.length<=96&&
 /^[\x20-\x7e]+$/.test(s);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const refusal=reason=>Object.freeze({
 schema:'P89-original-public-anatomy-unresolved-boundary-regions/v1',
 status:'UNVERIFIED_ORIGINAL_ANATOMICAL_BOUNDARY_REGION_SOURCE',
 reason,originalSourceBuffersNeverModified:true,
 originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 signedBodyContainmentCertified:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const sum=arr=>arr.reduce((n,x)=>n+x,0);
const sorted=(obj,max=12)=>Object.entries(obj)
 .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
 .slice(0,max).map(([label,edges])=>({label,edges}));
const coord=(p,i)=>Array.from(p.subarray(i*3,i*3+3),n=>n.toFixed(5)).join('|');
const dist=(p,a,b)=>Math.hypot(p[3*a]-p[3*b],
 p[3*a+1]-p[3*b+1],p[3*a+2]-p[3*b+2]);
const groupFromBone=name=>{
 const l=name.toLowerCase();
 if(/hand|finger|thumb|arm|forearm|wrist|shoulder|clavic|elbow/.test(l))
  return 'ARMS_HANDS';
 if(/foot|toe|ankle|knee|calf|shin|thigh|upleg|lowleg|leg|heel/.test(l))
  return 'LEGS_FEET';
 if(/head|neck|eye|ear|jaw|face|mouth/.test(l))
  return 'HEAD_NECK';
 if(/pelv|hip|spine|chest|torso|abdomen|back|waist|root|butt/.test(l))
  return 'TORSO_PELVIS';
 return 'SOURCE_BONE_REGION_UNCLASSIFIED';
};
/** Pure source-geometry statistics: synthetic fixtures do NOT verify a GLB. */
export function summarizeOriginalBodyBoundaryRegions89({
 posedPositions,indices,restPositions,skinIndices,skinWeights,sourceMeshIds,
 sourceMeshNames,sourceBoneNamesByMesh
}={}){
 if(!(posedPositions instanceof Float32Array)||
  posedPositions.length<18||posedPositions.length%3!==0||
  posedPositions.length>2_100_000||
  !(restPositions instanceof Float32Array)||
  restPositions.length!==posedPositions.length||
  !canIndex(indices)||indices.length<6||indices.length%3!==0||
  indices.length>3_000_000||
  !(skinIndices instanceof Uint16Array)||
  skinIndices.length!==posedPositions.length/3*4||
  !(skinWeights instanceof Float32Array)||
  skinWeights.length!==skinIndices.length||
  !(sourceMeshIds instanceof Uint16Array)||
  sourceMeshIds.length!==posedPositions.length/3||
  !Array.isArray(sourceMeshNames)||sourceMeshNames.length<1||
  !Array.isArray(sourceBoneNamesByMesh)||
  sourceBoneNamesByMesh.length!==sourceMeshNames.length||
  sourceMeshNames.length>256||
  sourceMeshNames.some(x=>!clean(x))||
  sourceBoneNamesByMesh.some(x=>!Array.isArray(x)||x.length!==163||
   x.some(v=>!clean(v))))
  throw Error('original-source-posed-rest-bone-and-mesh-provenance-required');
 const vertices=posedPositions.length/3;
 let lowest=Infinity,highest=-Infinity;
 for(let i=0;i<posedPositions.length;i++){
  const v=posedPositions[i];
  if(!finite(v)||!finite(restPositions[i]))
   throw Error('nonfinite-original-source-geometry');
  if(i%3===1){lowest=Math.min(lowest,v);highest=Math.max(highest,v);}
 }
 if(!(highest-lowest>.05&&highest-lowest<15))
  throw Error('unbounded-source-body-height-range');
 for(const id of indices)if(!Number.isSafeInteger(id)||id>=vertices)
  throw Error('original-indexed-face-out-of-range');
 for(let i=0;i<vertices;i++){
  if(sourceMeshIds[i]>=sourceMeshNames.length)
   throw Error('original-source-mesh-identity-missing');
  let w=0;
  for(let j=0;j<4;j++){
   const k=i*4+j,v=skinWeights[k];
   if(!finite(v)||v<0||v>1||skinIndices[k]>162)
    throw Error('source-bone-weight-provenance-invalid');
   w+=v;
  }
  if(Math.abs(w-1)>.003)throw Error('source-bone-weight-sum-invalid');
 }
 const raw=new Map();
 for(let t=0;t<indices.length;t+=3){
  const a=indices[t],b=indices[t+1],c=indices[t+2];
  if(sourceMeshIds[a]!==sourceMeshIds[b]||
   sourceMeshIds[b]!==sourceMeshIds[c])
   throw Error('original-source-face-spans-foreign-source-mesh');
  for(const [p,q] of [[a,b],[b,c],[c,a]]){
   if(p===q)continue;
   const k=(p<q?p+'|'+q:q+'|'+p),o=raw.get(k);
   if(o)o.count++;
   else raw.set(k,{p,q,count:1});
  }
 }
 const keys=Array.from({length:vertices},(_,i)=>coord(posedPositions,i)),
  twins=new Map();
 let originalBoundary=0,collapsed=0;
 for(const edge of raw.values()){
  if(edge.count!==1)continue;
  originalBoundary++;
  const a=keys[edge.p],b=keys[edge.q];
  if(a===b){collapsed++;continue;}
  const key=a<b?a+'@@'+b:b+'@@'+a,dir=a<b?1:-1;
  if(!twins.has(key))twins.set(key,[]);
  twins.get(key).push({...edge,dir});
 }
 const dominant=v=>{
  let best=0,weight=-1;
  for(let j=0;j<4;j++){
   const w=skinWeights[v*4+j];
   if(w>weight){weight=w;best=skinIndices[v*4+j];}
  }
  const mesh=sourceMeshIds[v],name=sourceBoneNamesByMesh[mesh][best];
  return {name,region:groupFromBone(name)};
 };
 const aggregate=()=>({
  bySourceMesh:Object.create(null),bySourceBone:Object.create(null),
  byAnatomyRegion:Object.create(null),byRelativeHeight:Object.create(null),
  sourceMeshPairs:Object.create(null)
 });
 const unresolved=aggregate(),foreign=aggregate();
 const add=(scope,edge,otherMesh=null)=>{
  const mesh=sourceMeshIds[edge.p],data=dominant(edge.p),
   alt=dominant(edge.q),region=data.region===alt.region?
    data.region:'MIXED_SOURCE_BONE_REGIONS',
   bone=data.name===alt.name?data.name:'MIXED_SOURCE_BONE_NAMES',
   meanY=(posedPositions[edge.p*3+1]+posedPositions[edge.q*3+1])/2,
   bin=Math.min(4,Math.max(0,Math.floor(5*(meanY-lowest)/(highest-lowest)))),
   height='HEIGHT_'+String(bin*20).padStart(2,'0')+'_TO_'+String((bin+1)*20).padStart(2,'0')+'_PCT';
  for(const [hist,key] of [
   [scope.bySourceMesh,mesh+':'+sourceMeshNames[mesh]],
   [scope.bySourceBone,bone],[scope.byAnatomyRegion,region],
   [scope.byRelativeHeight,height]
  ])hist[key]=(hist[key]||0)+1;
  if(otherMesh!==null){
   const pair=[mesh,otherMesh].sort((a,b)=>a-b).join('<->');
   scope.sourceMeshPairs[pair]=(scope.sourceMeshPairs[pair]||0)+1;
  }
 };
 let matchedWithinSource=0,crossSource=0,unmatched=0,ambiguous=collapsed;
 for(const list of twins.values()){
  if(list.length===1){unmatched++;add(unresolved,list[0]);continue;}
  if(list.length!==2||list[0].dir===list[1].dir){
   // Reclassify truly ambiguous source originals but never "repair" them.
   ambiguous+=list.length;
   continue;
  }
  const [a,b]=list;
  const ends=a.dir===1?[a.p,a.q,b.q,b.p]:[a.q,a.p,b.p,b.q];
  if(dist(posedPositions,ends[0],ends[2])>1e-5||
   dist(posedPositions,ends[1],ends[3])>1e-5){
   ambiguous+=2;continue;
  }
  const meshA=sourceMeshIds[a.p],meshB=sourceMeshIds[b.p];
  if(meshA!==meshB){
   crossSource+=2;add(foreign,a,meshB);add(foreign,b,meshA);
  }else matchedWithinSource+=2;
 }
 const accounting=matchedWithinSource+crossSource+unmatched+ambiguous;
 if(accounting!==originalBoundary||
  sum(Object.values(unresolved.bySourceMesh))!==unmatched||
  sum(Object.values(foreign.bySourceMesh))!==crossSource||
  sum(Object.values(unresolved.byAnatomyRegion))!==unmatched||
  sum(Object.values(foreign.byAnatomyRegion))!==crossSource)
  throw Error('source-original-boundary-region-accounting-failed');
 const report=(scope,count)=>Object.freeze({
  originalIndexedBoundaryEdgeCount:count,
  originalSourceMeshBreakdown:sorted(scope.bySourceMesh,256),
  originalSourceDominantBoneNameBreakdown:sorted(scope.bySourceBone,20),
  originalSourceBoneRegionBreakdown:sorted(scope.byAnatomyRegion,10),
  originalBodyRelativeHeightBreakdown:sorted(scope.byRelativeHeight,5),
  sourceMeshPairBreakdown:sorted(scope.sourceMeshPairs,256),
  onlyAggregateOriginalPublicBodyRegions:true,
  originalBodyHeightBandsNormalizedNotMeasuredCentimeters:true
 });
 return Object.freeze({
  schema:'P89-pure-unmodified-anatomical-body-boundary-regions/v1',
  originalBodyIndexedTriangleCount:indices.length/3,
  originalBodyIndexedBoundaryEdgeCount:originalBoundary,
  sourceCompatibleGeometricTwinBoundaryEdges:matchedWithinSource,
  sourceForeignMeshCoincidentTwinBoundaryEdges:crossSource,
  sourceNoGeometricTwinBoundaryEdges:unmatched,
  ambiguousBoundaryEdges:ambiguous,
  unmatchedSourceAnatomicalRegions:report(unresolved,unmatched),
  foreignSourceMeshAnatomicalRegions:report(foreign,crossSource),
  exactSourceMeshIdentityNeverCombined:true,
  originalSourceBoneSkinProvenanceReadOnly:true,
  originalSourceBuffersNeverModified:true,
  realBodySignedExteriorContainmentNotCertified:true,
  consumer3DAdmitted:false,releaseAuthorized:false
 });
}
/** Public original photo, 163bone source provenance and independent seam
 * receipt are mandatory; never accept a caller's wearable-safety claim. */
export function auditActualOriginalBodyBoundaryRegions89(args={}){
 const {avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  originalRig163Bones,selectedMeasuredFivePoseBvh,selectedActualWebGLPreview,
  independentSeamEvidence}=args;
 if(!Object.hasOwn(MODELS,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO_SHA||
  sourceAnatomyGLBSHA256!==MODELS[avatar]||
  originalRig163Bones!==true||
  selectedMeasuredFivePoseBvh!==true||
  selectedActualWebGLPreview!==true||
  independentSeamEvidence?.schema!==
   'P89-pure-original-source-virtual-boundary-seam-evidence/v1'||
  independentSeamEvidence?.originalSourceBoundaryEdgeConservationVerified!==true||
  independentSeamEvidence?.originalSourceRestAndSkinAndMeshIdRequired!==true)
  return refusal('genuine-original-photo-anatomical-rig-seam-evidence-required');
 try{
  const x=summarizeOriginalBodyBoundaryRegions89(args),old=independentSeamEvidence;
  if(x.originalBodyIndexedBoundaryEdgeCount!==
    old.rawOriginalSourceSingleFaceBoundaryEdges||
   x.originalBodyIndexedTriangleCount!==old.originalSourceBodyTriangleCount||
   x.sourceCompatibleGeometricTwinBoundaryEdges!==
    old.compatibleOriginalRestAndSkinBoundaryEdges||
   x.sourceForeignMeshCoincidentTwinBoundaryEdges!==
    old.geometryTwinsDifferentOriginalSourceMeshEdges||
   x.sourceNoGeometricTwinBoundaryEdges!==old.sourceUnmatchedBoundaryEdges||
   x.ambiguousBoundaryEdges!==old.geometricAmbiguousMultiCandidateBoundaryEdges+
    old.geometricTwinWindingConflictEdges+
    old.sourceGeometricallyCollapsedBoundaryEdges)
   return refusal('independent-original-face-and-bone-region-counts-disagree');
  return Object.freeze({
   schema:'P89-original-public-anatomy-unresolved-boundary-regions/v1',
   status:x.sourceNoGeometricTwinBoundaryEdges+x.sourceForeignMeshCoincidentTwinBoundaryEdges>0?
    'SOURCE_ANATOMICAL_GAPS_AND_FOREIGN_MESH_CONTACTS_NOT_SIGNED_VOLUME':
    'UNRESOLVED_ANATOMICAL_SOURCE_BODY_VOLUME_NOT_CERTIFIED',
   avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
   originalFullIndexedSourceBodyAnd163BoneRigUsed:true,
   genuinePhotographedSourceSkirtAttested:true,
   genuineSourceBoneNamesAndMeshIdentityUsed:true,
   sourceAnatomicalRegionEvidence:x,
   originalBodyIndexedGeometryUnchanged:true,
   unresolvedForeignMeshEdgesNeverVirtuallyWelded:true,
   noRealWorldOriginalGarmentSizeKnown:true,
   photoRearUnobserved:true,
   originalPhoto2DFallbackRequired:true,
   closedBodyVolumeCertified:false,signedExteriorContainmentCertified:false,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const known=['original-source-posed-rest-bone-and-mesh-provenance-required',
   'nonfinite-original-source-geometry','unbounded-source-body-height-range',
   'original-indexed-face-out-of-range','original-source-mesh-identity-missing',
   'source-bone-weight-provenance-invalid','source-bone-weight-sum-invalid',
   'original-source-face-spans-foreign-source-mesh',
   'source-original-boundary-region-accounting-failed'];
  return refusal(known.includes(e.message)?e.message:
   'original-boundary-region-classification-unverifiable');
 }
}
