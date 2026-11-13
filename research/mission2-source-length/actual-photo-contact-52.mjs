/**
 * M2 P2-C52: exact licensed, photographed P61 / P175 163-bone fabric
 * contact DIAGNOSTIC, read-only and research-only.
 *
 * Only source-verified original Commons 0053 may run. This module is
 * installed exclusively in a detached P541 browser donor. It never
 * constructs clothing from a photo, edits any mesh attribute, claims
 * full real-world drape, or exports owner, RGB, XYZ, indices or UV.
 *
 * A 3D sweep-and-prune AABB pass finds posed source face candidates.
 * A strictly interior edge-plane hit proves a transverse 3D crossing
 * for one nonadjacent original face pair. All other close AABB pairs are
 * UNCERTAIN, not certified contacts. Independent full C44/C40 tests
 * remain the authoritative fail-closed research admission checks.
 */
import * as THREE from 'three';
const SOURCE_ID='commons-0053';
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const fail=msg=>{throw Error('M2 C52 original-photo diagnostic '+msg);};
const finite=a=>a.every(Number.isFinite);
function strictFaceCrossing52(A,B,eps){
 const n=t=>new THREE.Vector3().subVectors(t[1],t[0])
  .cross(new THREE.Vector3().subVectors(t[2],t[0]));
 const plane=(p,t)=>{
  const normal=n(t),len=normal.length();
  if(!(len>1e-10))return null;
  return normal.dot(new THREE.Vector3().subVectors(p,t[0]))/len;
 };
 const test=(a,b,t)=>{
  const d0=plane(a,t),d1=plane(b,t);
  if(d0===null||d1===null||
    !((d0>eps&&d1< -eps)||(d0< -eps&&d1>eps)))return false;
  const k=d0/(d0-d1);
  if(!(k>eps&&k<1-eps))return false;
  const point=a.clone().lerp(b,k),u=t[1].clone().sub(t[0]),
   v=t[2].clone().sub(t[0]),w=point.sub(t[0]);
  const uu=u.dot(u),uv=u.dot(v),vv=v.dot(v),
   wu=w.dot(u),wv=w.dot(v),den=uu*vv-uv*uv;
  if(!(den>1e-22))return false;
  const x=(vv*wu-uv*wv)/den,y=(uu*wv-uv*wu)/den;
  return x>1e-5&&y>1e-5&&x+y<1-1e-5;
 };
 for(const [a,b] of [[A,B],[B,A]])
  for(const [i,j] of [[0,1],[1,2],[2,0]])
   if(test(a[i],a[j],b))return true;
 return false;
}

/**
 * P2-C53 — independent triangle/triangle minimum Euclidean separation.
 * AABB intersection is not contact: check all 6 point-to-face distances,
 * all 9 finite edge/edge distances and 6 segment-plane interior crossings.
 * Coplanar containment is handled by point/face, coplanar crossing by
 * edge/edge. Exact-zero, near-distance and positive gap are NEVER
 * treated as permission to sew source UV seams or release a garment.
 */
const clamp53=x=>Math.max(0,Math.min(1,x));
function segmentSegmentSquared53(a,b,c,d){
 const u=b.clone().sub(a),v=d.clone().sub(c),w=a.clone().sub(c);
 const A=u.lengthSq(),E=v.lengthSq(),F=v.dot(w),EPS=1e-18;
 let S=0,T=0;
 if(A<=EPS&&E<=EPS)return a.distanceToSquared(c);
 if(A<=EPS)T=clamp53(F/E);
 else{
  const C=u.dot(w);
  if(E<=EPS)S=clamp53(-C/A);
  else{
   const B=u.dot(v),D=A*E-B*B;
   if(D>EPS)S=clamp53((B*F-C*E)/D);
   T=(B*S+F)/E;
   if(T<0){T=0;S=clamp53(-C/A);}
   else if(T>1){T=1;S=clamp53((B-C)/A);}
  }
 }
 const p=a.clone().addScaledVector(u,S),q=c.clone().addScaledVector(v,T);
 return p.distanceToSquared(q);
}
function segmentFaceCrosses53(a,b,face){
 const normal=new THREE.Vector3().subVectors(face[1],face[0])
  .cross(new THREE.Vector3().subVectors(face[2],face[0]));
 const length=normal.length();
 if(length<1e-12)return false;
 const d0=normal.dot(a.clone().sub(face[0]))/length,
  d1=normal.dot(b.clone().sub(face[0]))/length;
 if(!Number.isFinite(d0)||!Number.isFinite(d1))fail('C53 nonfinite source face plane');
 // Coplanar triangles are checked separately by vertex-to-triangle and
 // all edge-edge distances; do not invent an interior piercing witness.
 if(Math.abs(d0-d1)<=1e-12)return false;
 const t=d0/(d0-d1);
 if(t<0||t>1)return false;
 const hit=a.clone().lerp(b,t);
 return new THREE.Triangle(...face).containsPoint(hit);
}
function triangleDistance53(A,B){
 const TA=new THREE.Triangle(...A),TB=new THREE.Triangle(...B),
  closest=new THREE.Vector3();
 let dSq=Infinity;
 for(const v of A){
  TB.closestPointToPoint(v,closest);
  dSq=Math.min(dSq,v.distanceToSquared(closest));
 }
 for(const v of B){
  TA.closestPointToPoint(v,closest);
  dSq=Math.min(dSq,v.distanceToSquared(closest));
 }
 const edges=[[0,1],[1,2],[2,0]];
 for(const [i,j] of edges){
  if(segmentFaceCrosses53(A[i],A[j],B)||
     segmentFaceCrosses53(B[i],B[j],A))return 0;
  for(const [k,l] of edges)
   dSq=Math.min(dSq,segmentSegmentSquared53(A[i],A[j],B[k],B[l]));
 }
 if(!Number.isFinite(dSq)||dSq<0)fail('C53 invalid genuine cloth triangle separation');
 return Math.sqrt(dSq);
}
function refinedDistanceReceipt53(state,complete){
 return Object.freeze({
  schema:'M2-source-posed-triangle-separation-C53',
  triangleCandidatePairsMeasured:state.distancePairsMeasured,
  geometricZeroOrOverlapUnresolved:state.geometricZeroOrOverlapUnresolved,
  positiveGapWithinToleranceUnresolved:state.positiveGapWithinToleranceUnresolved,
  positiveGapBeyondToleranceAtThisPose:state.positiveGapBeyondToleranceAtThisPose,
  distanceRefinementComplete:complete,
  originalPhotoVertexCoordinatesExposed:false,
  exactSourceFaceIndicesExposed:false,
  zeroGapNotCertifiedAsPenetration:true,
  positiveGapNotContinuousClothClearance:true,
  noSourceRepairAuthorized:true,
  familyAlpha:'HOLD'
 });
}


/**
 * P2-C54: classify geometrically zero-distance ORIGINAL-source triangle
 * pairs by immutable source vertex correspondence. The 163-bone skinned
 * pose and the shader dressRest/skin weights must AGREE with any repeated
 * coordinate; positional coincidence alone is never a sewn seam.
 *
 * No raw face IDs, source XYZ, photo pixels, garment images or per-owner
 * vertex identifiers appear in public receipts. Source-index-sharing
 * pairs were already excluded upstream; count those exclusions separately.
 */
const SOURCE_TWIN_EPS54=2e-6;
const C54_KEYS=Object.freeze([
 'sourceCoincidentFaceCandidates',
 'sourceCoincidentEdgeCandidates',
 'sourceCoincidentSinglePointCandidates',
 'sourceCoincidentButUnsafeSkinRestOrPose',
 'sourceIndependentZeroDistancePairs'
]);
function zeroSourceTopologyClass54(a,b,context){
 const {source,skinned,rest,skinIndex,skinWeight}=context;
 const matches=[],used=new Set();
 const nearSource=(i,j)=>{
  const ia=3*i,ib=3*j;
  return Math.hypot(source[ia]-source[ib],
   source[ia+1]-source[ib+1],
   source[ia+2]-source[ib+2])<=SOURCE_TWIN_EPS54;
 };
 // The original triangles are nondegenerate. Match unique IDs 1:1 and
 // refuse ambiguous correspondences when endpoints are near-coincident.
 for(const i of a.ids){
  const possible=b.ids.filter(j=>nearSource(i,j));
  if(possible.length>1)
   return 'sourceCoincidentButUnsafeSkinRestOrPose';
  if(possible.length){
   const j=possible[0];
   if(used.has(j))
    return 'sourceCoincidentButUnsafeSkinRestOrPose';
   used.add(j);matches.push([i,j]);
  }
 }
 if(!matches.length)return 'sourceIndependentZeroDistancePairs';
 const safe=matches.every(([i,j])=>{
  const ai=3*i,aj=3*j;
  if(Math.hypot(skinned[ai]-skinned[aj],
   skinned[ai+1]-skinned[aj+1],
   skinned[ai+2]-skinned[aj+2])>SOURCE_TWIN_EPS54)return false;
  for(let k=0;k<3;k++)
   if(Math.abs(rest.getComponent(i,k)-rest.getComponent(j,k))>
      SOURCE_TWIN_EPS54)return false;
  for(let k=0;k<4;k++)
   if(skinIndex.getComponent(i,k)!==skinIndex.getComponent(j,k)||
      Math.abs(skinWeight.getComponent(i,k)-
       skinWeight.getComponent(j,k))>1e-6)return false;
  return true;
 });
 if(!safe)return 'sourceCoincidentButUnsafeSkinRestOrPose';
 return matches.length===3?'sourceCoincidentFaceCandidates':
  matches.length===2?'sourceCoincidentEdgeCandidates':
  'sourceCoincidentSinglePointCandidates';
}
function topologyReceipt54(state,complete,sharedIndexExcluded){
 const classified=C54_KEYS.reduce((n,key)=>n+state[key],0);
 if(classified!==state.zeroDistancePairsClassified)
  fail('C54 invalid zero-distance pair topology classification accounting');
 return Object.freeze({
  schema:'M2-original-source-zero-contact-topology-C54',
  zeroDistancePairsClassified:state.zeroDistancePairsClassified,
  sourceCoincidentFaceCandidates:state.sourceCoincidentFaceCandidates,
  sourceCoincidentEdgeCandidates:state.sourceCoincidentEdgeCandidates,
  sourceCoincidentSinglePointCandidates:
   state.sourceCoincidentSinglePointCandidates,
  sourceCoincidentButUnsafeSkinRestOrPose:
   state.sourceCoincidentButUnsafeSkinRestOrPose,
  sourceIndependentZeroDistancePairs:state.sourceIndependentZeroDistancePairs,
  sourceIndexSharedPairsExcludedBeforeDistance:sharedIndexExcluded,
  classificationComplete:complete,
  allSourceCorrespondencesCheckedAgainst163BonePose:true,
  sourceCoincidenceNotAHumanVerifiedSewingSeam:true,
  sourceDisconnectedFacesNotAutomaticallySeparated:true,
  sourceCoordinateDuplicateNotPermissionToWeld:true,
  realFabricPhysicsUnverified:true,
  originalPhotoVertexCoordinatesExposed:false,
  originalSourceFaceIdsExposed:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}


/**
 * P2-C55 — inspect the ORIGINAL photographer-source edge graph independently
 * of triangle-to-triangle proximity. Two duplicated XYZ endpoints do not by
 * themselves prove a sewn boundary. This source-coordinate edge index is
 * private to the browser audit, and NEVER exports vertex groups/IDs/positions.
 *
 * Discrete source vertices are clustered with a bounded 2 micron tolerance,
 * validating the source shader-rest/skin and true 163-bone posed positions.
 * A non-transitive/ambiguous coordinate grouping is always unsafe; it cannot
 * be treated as a physical edge or a collision exemption.
 */
const C55_KEYS=Object.freeze([
 'sourceTwoFaceOppositeWindingCandidates',
 'sourceTwoFaceSameWindingCandidates',
 'sourceThreePlusIncidentFaceNonmanifoldCandidates',
 'sourceUnsafeOrAmbiguousCoordinateGroupCandidates',
 'sourceEdgeUnpairedOrUnresolvedCandidates'
]);
function sourceEdgeGraph55(context,indices,faceCount){
 const {source,skinned,rest,skinIndex,skinWeight}=context;
 const n=source.length/3,cell=SOURCE_TWIN_EPS54;
 const bins=new Map(),reps=[],vertexGroup=new Int32Array(n),
  groupGood=[],groupAmbiguous=[];
 const sourceDistance=(i,j)=>Math.hypot(
  source[3*i]-source[3*j],source[3*i+1]-source[3*j+1],
  source[3*i+2]-source[3*j+2]);
 const consistent=(i,j)=>{
  if(Math.hypot(skinned[3*i]-skinned[3*j],
   skinned[3*i+1]-skinned[3*j+1],
   skinned[3*i+2]-skinned[3*j+2])>SOURCE_TWIN_EPS54)return false;
  for(let k=0;k<3;k++)
   if(Math.abs(rest.getComponent(i,k)-rest.getComponent(j,k))>
      SOURCE_TWIN_EPS54)return false;
  for(let k=0;k<4;k++)
   if(skinIndex.getComponent(i,k)!==skinIndex.getComponent(j,k)||
      Math.abs(skinWeight.getComponent(i,k)-
       skinWeight.getComponent(j,k))>1e-6)return false;
  return true;
 };
 const bin=(x,y,z)=>x+':'+y+':'+z;
 for(let i=0;i<n;i++){
  const x=Math.floor(source[3*i]/cell),
   y=Math.floor(source[3*i+1]/cell),
   z=Math.floor(source[3*i+2]/cell);
  const matches=[];
  for(let dx=-1;dx<=1;dx++)
   for(let dy=-1;dy<=1;dy++)
    for(let dz=-1;dz<=1;dz++)
     for(const g of bins.get(bin(x+dx,y+dy,z+dz))??[])
      if(sourceDistance(i,reps[g])<=cell)matches.push(g);
  if(!matches.length){
   const g=reps.length;reps.push(i);
   vertexGroup[i]=g;groupGood.push(true);groupAmbiguous.push(false);
   const k=bin(x,y,z),list=bins.get(k)??[];
   list.push(g);bins.set(k,list);
  }else{
   const group=matches[0];vertexGroup[i]=group;
   if(matches.length!==1){
    for(const g of matches){groupAmbiguous[g]=true;groupGood[g]=false;}
   }
   if(!consistent(i,reps[group]))groupGood[group]=false;
  }
 }
 const edgeUses=new Map(),faceGroup=new Array(faceCount);
 const key=(a,b)=>a<b?a+':'+b:b+':'+a;
 for(let f=0;f<faceCount;f++){
  const ids=[0,1,2].map(c=>indices?indices[3*f+c]:3*f+c);
  const groups=ids.map(i=>vertexGroup[i]);faceGroup[f]=groups;
  for(let k=0;k<3;k++){
   const a=groups[k],b=groups[(k+1)%3];
   const ek=key(a,b),list=edgeUses.get(ek)??[];
   list.push({f,from:a,to:b});
   edgeUses.set(ek,list);
  }
 }
 let single=0,two=0,multiple=0;
 for(const list of edgeUses.values()){
  if(list.length===1)single++;
  else if(list.length===2)two++;
  else multiple++;
 }
 return {source,skinned,rest,skinIndex,skinWeight,reps,
  vertexGroup,groupGood,groupAmbiguous,
  faceGroup,edgeUses,key,uniqueOriginalSourceEdgeGroups:edgeUses.size,
  originalSingleIncidentEdgeGroups:single,
  originalTwoIncidentEdgeGroups:two,
  originalThreePlusIncidentEdgeGroups:multiple,
  originalCoordinateGroups:reps.length,
  originalAmbiguousOrSkinMismatchedGroups:
   groupGood.filter(x=>!x).length};
}
function sourceMatchingEdgeWinding55(a,b,graph){
 const near=(i,j)=>Math.hypot(
  graph.source[3*i]-graph.source[3*j],
  graph.source[3*i+1]-graph.source[3*j+1],
  graph.source[3*i+2]-graph.source[3*j+2])<=SOURCE_TWIN_EPS54;
 const matches=[],seen=new Set();
 for(const i of a.ids){
  const twins=b.ids.filter(j=>near(i,j));
  if(twins.length>1)return C55_KEYS[3];
  if(twins.length){
   if(seen.has(twins[0]))return C55_KEYS[3];
   seen.add(twins[0]);matches.push([i,twins[0]]);
  }
 }
 if(matches.length!==2)return C55_KEYS[4];
 const [i,j]=matches.map(p=>graph.vertexGroup[p[0]]);
 if(i===j||matches.some(([x,y])=>
  graph.vertexGroup[x]!==graph.vertexGroup[y]||
  !graph.groupGood[graph.vertexGroup[x]]||
  graph.groupAmbiguous[graph.vertexGroup[x]]))
  return C55_KEYS[3];
 const edge=graph.edgeUses.get(graph.key(i,j));
 if(!edge||edge.length<2||
    !edge.some(use=>use.f===a.f)||
    !edge.some(use=>use.f===b.f))
  return C55_KEYS[4];
 if(edge.length>2)return C55_KEYS[2];
 const winding=t=>{
  const groups=graph.faceGroup[t.f];
  for(let k=0;k<3;k++){
   if(groups[k]===i&&groups[(k+1)%3]===j)return 1;
   if(groups[k]===j&&groups[(k+1)%3]===i)return -1;
  }
  return 0;
 };
 const wa=winding(a),wb=winding(b);
 if(!wa||!wb)return C55_KEYS[3];
 return wa===wb?C55_KEYS[1]:C55_KEYS[0];
}
function edgeWindingReceipt55(state,graph,complete){
 const count=C55_KEYS.reduce((n,key)=>n+state[key],0);
 if(count!==state.sourceEdgePairsClassified)
  fail('C55 source edge winding / incident face classification count inconsistent');
 return Object.freeze({
  schema:'M2-original-photograph-source-edge-winding-C55',
  sourceEdgePairsClassified:state.sourceEdgePairsClassified,
  sourceTwoFaceOppositeWindingCandidates:
   state.sourceTwoFaceOppositeWindingCandidates,
  sourceTwoFaceSameWindingCandidates:
   state.sourceTwoFaceSameWindingCandidates,
  sourceThreePlusIncidentFaceNonmanifoldCandidates:
   state.sourceThreePlusIncidentFaceNonmanifoldCandidates,
  sourceUnsafeOrAmbiguousCoordinateGroupCandidates:
   state.sourceUnsafeOrAmbiguousCoordinateGroupCandidates,
  sourceEdgeUnpairedOrUnresolvedCandidates:
   state.sourceEdgeUnpairedOrUnresolvedCandidates,
  originalSourceEdgeGroupCount:graph.uniqueOriginalSourceEdgeGroups,
  originalBoundarySingleIncidentEdgeGroups:
   graph.originalSingleIncidentEdgeGroups,
  originalTwoIncidentEdgeGroups:graph.originalTwoIncidentEdgeGroups,
  originalNonmanifoldThreePlusIncidentEdgeGroups:
   graph.originalThreePlusIncidentEdgeGroups,
  originalCoordinateGroups:graph.originalCoordinateGroups,
  originalAmbiguousOrSkinMismatchedGroups:
   graph.originalAmbiguousOrSkinMismatchedGroups,
  sourceEdgeAuditComplete:complete,
  sourceEdgeWindingOnlyCandidateNotSewnSeam:true,
  oppositeWindingCannotAuthorizeWelding:true,
  sourceManifoldEstimateNotPhysicalFabricCertificate:true,
  changingPoseAndContinuousClothNotCertified:true,
  ownerPhotoOrVertexLocationsExposed:false,
  originalSourceFaceIdsExposed:false,
  photoUVSkinAndSourceMeshUnchanged:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}


/**
 * P2-C56: read-only connected-component analysis of ORIGINAL photographed
 * garment boundary edge groups. A single-incident source edge is a surface
 * boundary, NOT an independently identified hem, collar or sleeve opening.
 * Never mutate UVs, source coordinates, skin weights, geometry, or the
 * authentic licensed JPEG. No index, coordinate or vertex group is emitted.
 */
function sourceBoundaryComponents56(graph,{maxBoundaryEdges56,
 maxBoundaryVertexGroups56}){
 const boundaries=[];
 for(const list of graph.edgeUses.values())
  if(list.length===1)boundaries.push(list[0]);
 const blank={
  totalOriginalSingleIncidentEdgeGroups:boundaries.length,
  boundariesActuallyVisited:0,connectedBoundaryComponents:0,
  closedDirectedLoopComponents:0,openDirectedChainComponents:0,
  windingConflictComponents:0,branchedOrNonmanifoldComponents:0,
  unsafeSourceSkinOrPoseComponents:0,
  edgesInClosedDirectedLoops:0,edgesInOpenDirectedChains:0,
  edgesInWindingConflictComponents:0,
  edgesInBranchedOrNonmanifoldComponents:0,
  edgesInUnsafeSourceSkinOrPoseComponents:0,
  boundaryVertexGroups:0,boundaryVerticesDegreeOne:0,
  boundaryVerticesDegreeTwo:0,boundaryVerticesDegreeThreePlus:0,
  actualSkinnedPoseEdgesWithOverTenPercentLengthChange:0,
  budgetExhausted:false
 };
 const receipt=(state,complete)=>Object.freeze({
  schema:'M2-original-photograph-boundary-components-C56',
  ...state,
  boundaryComponentAuditComplete:complete,
  sourceCoordinateGroupsComparedAgainstOriginalPhotoRestAndSkin:true,
  actual163BonePoseBoundaryLengthsChecked:complete,
  sourceBoundaryNotAnAnatomicallyApprovedHemOrOpening:true,
  closedGeometricLoopNotProofOfSeamQuality:true,
  openBoundaryDoesNotAuthorizeAutomaticHoleRepair:true,
  originalSourceVertexOrFaceIdentifiersExposed:false,
  originalPhotoCoordinatesOrPixelsExposed:false,
  bodyClearanceAndContinuousMotionNotCertified:true,
  noUVOrGeometryEditsPermitted:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
 if(boundaries.length>maxBoundaryEdges56)
  return receipt({...blank,budgetExhausted:true},false);
 const neighbors=new Map();
 for(let e=0;e<boundaries.length;e++){
  const {from,to}=boundaries[e];
  for(const v of [from,to]){
   const list=neighbors.get(v)??[];
   list.push(e);neighbors.set(v,list);
  }
 }
 if(neighbors.size>maxBoundaryVertexGroups56)
  return receipt({...blank,budgetExhausted:true},false);
 const state={...blank,boundaryVertexGroups:neighbors.size};
 const members=new Map();
 for(let i=0;i<graph.vertexGroup.length;i++){
  const g=graph.vertexGroup[i];
  if(!neighbors.has(g))continue;
  const list=members.get(g)??[];
  list.push(i);members.set(g,list);
 }
 // A tolerated spatial cluster is not an equivalence relation in general.
 // Check EVERY endpoint pair against every member, not just C55's first
 // representative; any non-transitive or inconsistent group stays unsafe.
 const unsafe=new Set();
 for(const [g,list] of members){
  if(!graph.groupGood[g]||graph.groupAmbiguous[g])unsafe.add(g);
  for(let i=0;i<list.length;i++)
   for(let j=i+1;j<list.length;j++){
    const a=list[i],b=list[j],d=3*a,k=3*b;
    if(Math.hypot(graph.source[d]-graph.source[k],
      graph.source[d+1]-graph.source[k+1],
      graph.source[d+2]-graph.source[k+2])>SOURCE_TWIN_EPS54||
      Math.hypot(graph.skinned[d]-graph.skinned[k],
      graph.skinned[d+1]-graph.skinned[k+1],
      graph.skinned[d+2]-graph.skinned[k+2])>SOURCE_TWIN_EPS54){
     unsafe.add(g);continue;
    }
    for(let t=0;t<3;t++)
     if(Math.abs(graph.rest.getComponent(a,t)-
      graph.rest.getComponent(b,t))>SOURCE_TWIN_EPS54)
      unsafe.add(g);
    for(let t=0;t<4;t++)
     if(graph.skinIndex.getComponent(a,t)!==
         graph.skinIndex.getComponent(b,t)||
        Math.abs(graph.skinWeight.getComponent(a,t)-
          graph.skinWeight.getComponent(b,t))>1e-6)unsafe.add(g);
   }
 }
 const move=graph.skinned,orig=graph.source;
 for(const edge of boundaries){
  const a=graph.reps[edge.from],b=graph.reps[edge.to];
  if(a===undefined||b===undefined){unsafe.add(edge.from);unsafe.add(edge.to);continue;}
  const start=3*a,end=3*b,
   oldLength=Math.hypot(orig[start]-orig[end],
    orig[start+1]-orig[end+1],orig[start+2]-orig[end+2]),
   newLength=Math.hypot(move[start]-move[end],
    move[start+1]-move[end+1],move[start+2]-move[end+2]);
  if(!Number.isFinite(oldLength)||!Number.isFinite(newLength)||
     oldLength<1e-8||newLength<1e-8){
   unsafe.add(edge.from);unsafe.add(edge.to);continue;
  }
  if(Math.abs(newLength/oldLength-1)>.1)
   state.actualSkinnedPoseEdgesWithOverTenPercentLengthChange++;
 }
 for(const edges of neighbors.values()){
  if(edges.length===1)state.boundaryVerticesDegreeOne++;
  else if(edges.length===2)state.boundaryVerticesDegreeTwo++;
  else state.boundaryVerticesDegreeThreePlus++;
 }
 const visited=new Uint8Array(boundaries.length);
 for(let e=0;e<boundaries.length;e++){
  if(visited[e])continue;
  const queue=[e],compEdges=[],compVertices=new Set();
  visited[e]=1;
  for(let head=0;head<queue.length;head++){
   const id=queue[head],edge=boundaries[id];
   compEdges.push(id);
   for(const v of [edge.from,edge.to]){
    if(compVertices.has(v))continue;
    compVertices.add(v);
    for(const adjacent of neighbors.get(v)??[])
     if(!visited[adjacent]){
      visited[adjacent]=1;queue.push(adjacent);
     }
   }
  }
  let degOne=0,allTwo=true,wellWound=true,branch=false,
   endpointsStart=0,endpointsEnd=0,hasUnsafe=false;
  for(const v of compVertices){
   const count=neighbors.get(v).length;
   let incoming=0,outgoing=0;
   for(const idx of neighbors.get(v)){
    const ed=boundaries[idx];
    if(ed.to===v)incoming++;
    if(ed.from===v)outgoing++;
    if(ed.to===ed.from)hasUnsafe=true;
   }
   if(count===1){
    degOne++;allTwo=false;
    if(incoming===0&&outgoing===1)endpointsStart++;
    else if(incoming===1&&outgoing===0)endpointsEnd++;
    else wellWound=false;
   }else if(count===2){
    if(incoming!==1||outgoing!==1)wellWound=false;
   }else{
    allTwo=false;
    if(count>2)branch=true;
    else hasUnsafe=true;
   }
   if(unsafe.has(v))hasUnsafe=true;
  }
  const size=compEdges.length;
  state.boundariesActuallyVisited+=size;
  state.connectedBoundaryComponents++;
  if(hasUnsafe){
   state.unsafeSourceSkinOrPoseComponents++;
   state.edgesInUnsafeSourceSkinOrPoseComponents+=size;
  }else if(branch){
   state.branchedOrNonmanifoldComponents++;
   state.edgesInBranchedOrNonmanifoldComponents+=size;
  }else if(wellWound&&allTwo&&size===compVertices.size){
   state.closedDirectedLoopComponents++;
   state.edgesInClosedDirectedLoops+=size;
  }else if(wellWound&&degOne===2&&endpointsStart===1&&
     endpointsEnd===1&&size===compVertices.size-1){
   state.openDirectedChainComponents++;
   state.edgesInOpenDirectedChains+=size;
  }else{
   state.windingConflictComponents++;
   state.edgesInWindingConflictComponents+=size;
  }
 }
 if(state.boundariesActuallyVisited!==boundaries.length||
    state.connectedBoundaryComponents!==
     state.closedDirectedLoopComponents+
     state.openDirectedChainComponents+
     state.windingConflictComponents+
     state.branchedOrNonmanifoldComponents+
     state.unsafeSourceSkinOrPoseComponents||
    boundaries.length!==
     state.edgesInClosedDirectedLoops+
     state.edgesInOpenDirectedChains+
     state.edgesInWindingConflictComponents+
     state.edgesInBranchedOrNonmanifoldComponents+
     state.edgesInUnsafeSourceSkinOrPoseComponents)
  fail('C56 original photographed boundary source component partition mismatch');
 return receipt(state,true);
}

function analyze52(coordinates,indices,faceCount,tolerance,budgets,context=null){
 const list=[];
 const v=(j)=>new THREE.Vector3(
  coordinates[3*j],coordinates[3*j+1],coordinates[3*j+2]);
 for(let f=0;f<faceCount;f++){
  const ids=[0,1,2].map(k=>indices?indices[3*f+k]:3*f+k);
  const tri=ids.map(v);
  if(tri.some(p=>!finite(p.toArray())))fail('nonfinite source triangle');
  const area=tri[1].clone().sub(tri[0]).cross(
   tri[2].clone().sub(tri[0])).length();
  if(area<1e-10)fail('degenerate authentic garment face');
  const box=new THREE.Box3().setFromPoints(tri);
  list.push({f,ids,tri,minX:box.min.x,maxX:box.max.x,
   minY:box.min.y,maxY:box.max.y,minZ:box.min.z,maxZ:box.max.z});
 }
 list.sort((a,b)=>a.minX-b.minX);
 let boundsOverlaps=0,strictCrossings=0,compared=0,
  sharedIndexExcluded=0,firstStrict=false,firstUncertain=false;
 const distance53={distancePairsMeasured:0,
  geometricZeroOrOverlapUnresolved:0,
  positiveGapWithinToleranceUnresolved:0,
  positiveGapBeyondToleranceAtThisPose:0};
 const edge55={
  sourceEdgePairsClassified:0,
  sourceTwoFaceOppositeWindingCandidates:0,
  sourceTwoFaceSameWindingCandidates:0,
  sourceThreePlusIncidentFaceNonmanifoldCandidates:0,
  sourceUnsafeOrAmbiguousCoordinateGroupCandidates:0,
  sourceEdgeUnpairedOrUnresolvedCandidates:0
 };
 const topology54={
  zeroDistancePairsClassified:0,
  sourceCoincidentFaceCandidates:0,
  sourceCoincidentEdgeCandidates:0,
  sourceCoincidentSinglePointCandidates:0,
  sourceCoincidentButUnsafeSkinRestOrPose:0,
  sourceIndependentZeroDistancePairs:0
 };
 let complete=true;const active=[];
 outer:for(const candidate of list){
  for(let i=active.length-1;i>=0;i--)
   if(active[i].maxX+tolerance<candidate.minX)active.splice(i,1);
  for(const other of active){
   if(++compared>budgets.maxComparisons){complete=false;break outer;}
   if(other.maxY+tolerance<candidate.minY||
      candidate.maxY+tolerance<other.minY||
      other.maxZ+tolerance<candidate.minZ||
      candidate.maxZ+tolerance<other.minZ)continue;
   if(other.ids.some(i=>candidate.ids.includes(i))){
    sharedIndexExcluded++;continue;
   }
   if(++boundsOverlaps>budgets.maxCandidatePairs){
    complete=false;break outer;
   }
   const strict=strictFaceCrossing52(other.tri,candidate.tri,1e-7);
   if(budgets.refineTriangleDistances53){
    if(distance53.distancePairsMeasured>=budgets.maxDistanceCandidates53){
     complete=false;break outer;
    }
    const distance=triangleDistance53(other.tri,candidate.tri);
    if(!Number.isFinite(distance)||distance<0)
     fail('C53 invalid original source triangle distance');
    if(strict&&distance>1e-6)
     fail('C53 strict original crossing disagrees with actual triangle distance');
    distance53.distancePairsMeasured++;
    if(distance<=1e-7){
     distance53.geometricZeroOrOverlapUnresolved++;
     if(budgets.refineSourceTopology54){
      if(topology54.zeroDistancePairsClassified>=
         budgets.maxZeroDistanceTopologyPairs54){
       complete=false;break outer;
      }
      const kind=zeroSourceTopologyClass54(other,candidate,context);
      if(!C54_KEYS.includes(kind))fail('C54 unknown original source topology');
      topology54[kind]++;topology54.zeroDistancePairsClassified++;
      if(budgets.refineEdgeWinding55&&
         kind==='sourceCoincidentEdgeCandidates'){
       if(edge55.sourceEdgePairsClassified>=budgets.maxEdgePairs55){
        complete=false;break outer;
       }
       const result55=sourceMatchingEdgeWinding55(
        other,candidate,context.edgeGraph55);
       if(!C55_KEYS.includes(result55))
        fail('C55 original photographed edge category unknown');
       edge55[result55]++;
       edge55.sourceEdgePairsClassified++;
      }
     }
    }else if(distance<=tolerance)
     distance53.positiveGapWithinToleranceUnresolved++;
    else distance53.positiveGapBeyondToleranceAtThisPose++;
   }
   if(strict){strictCrossings++;firstStrict=true;}
   else firstUncertain=true;
   if(strictCrossings>=budgets.maxStrictCrossings){
    complete=false;break outer;
   }
  }
  active.push(candidate);
 }
 return {complete,compared,boundsOverlaps,strictCrossings,
  sharedIndexExcluded,firstStrict,firstUncertain,
  distance53:budgets.refineTriangleDistances53?
   refinedDistanceReceipt53(distance53,complete):null,
  topology54:budgets.refineSourceTopology54?
   topologyReceipt54(topology54,complete,sharedIndexExcluded):null,
  edge55:budgets.refineEdgeWinding55?
   edgeWindingReceipt55(edge55,context.edgeGraph55,complete):null};
}
export function auditActualPhotographedDressSurfaces52({
 root,dress,toleranceMeters=.00002,
 maxSourceFaces=100000,maxComparisons=800000,
 maxCandidatePairs=100000,maxStrictCrossings=64,
 refineTriangleDistances53=false,maxDistanceCandidates53=100000,
 refineSourceTopology54=false,maxZeroDistanceTopologyPairs54=100000,
 refineEdgeWinding55=false,maxEdgePairs55=100000,
 refineBoundaryComponents56=false,maxBoundaryEdges56=20000,
 maxBoundaryVertexGroups56=20000
}={}){
 const mesh=dress?.mesh,g=mesh?.geometry;
 if(!root?.isObject3D||!mesh?.isSkinnedMesh||
    mesh.skeleton?.bones?.length!==163||
    dress?.stats?.sourceId!==SOURCE_ID||
    dress.stats.sourceSHA256!==SHA||
    dress.stats.photographedDressDrape61!==true||
    dress.stats.originalRestPhotoCoordinatesUnchanged61!==true||
    dress.stats.skinIndicesAndWeightsPreserved61!==true||
    dress.stats.sourceTextureAndMaterialPreserved61!==true||
    dress.stats.releaseAuthorized!==false||
    dress.stats.collisionValidated!==false||
    !Number.isFinite(toleranceMeters)||toleranceMeters<0||
    toleranceMeters>.002||
    !Number.isSafeInteger(maxSourceFaces)||maxSourceFaces<1||
    maxSourceFaces>100000||
    !Number.isSafeInteger(maxComparisons)||maxComparisons<1||
    maxComparisons>3000000||
    !Number.isSafeInteger(maxCandidatePairs)||maxCandidatePairs<1||
    maxCandidatePairs>500000||
    !Number.isSafeInteger(maxStrictCrossings)||maxStrictCrossings<1||
    maxStrictCrossings>1024||
    typeof refineTriangleDistances53!=='boolean'||
    !Number.isSafeInteger(maxDistanceCandidates53)||
    maxDistanceCandidates53<1||maxDistanceCandidates53>500000||
    typeof refineSourceTopology54!=='boolean'||
    (refineSourceTopology54&&!refineTriangleDistances53)||
    !Number.isSafeInteger(maxZeroDistanceTopologyPairs54)||
    maxZeroDistanceTopologyPairs54<1||
    maxZeroDistanceTopologyPairs54>200000||
    typeof refineEdgeWinding55!=='boolean'||
    (refineEdgeWinding55&&!refineSourceTopology54)||
    !Number.isSafeInteger(maxEdgePairs55)||maxEdgePairs55<1||
    maxEdgePairs55>200000||
    typeof refineBoundaryComponents56!=='boolean'||
    (refineBoundaryComponents56&&!refineEdgeWinding55)||
    !Number.isSafeInteger(maxBoundaryEdges56)||
    maxBoundaryEdges56<1||maxBoundaryEdges56>200000||
    !Number.isSafeInteger(maxBoundaryVertexGroups56)||
    maxBoundaryVertexGroups56<1||maxBoundaryVertexGroups56>200000)
  fail('real original licensed SHA-pinned 163-bone P61 dress required');
 const p=g?.getAttribute('position'),rest=g?.getAttribute('dressRest'),
  si=g?.getAttribute('skinIndex'),sw=g?.getAttribute('skinWeight');
 if(!p?.isBufferAttribute||p.itemSize!==3||p.count<3||
    !rest||rest.count!==p.count||!si||!sw||
    si.count!==p.count||sw.count!==p.count)
  fail('original full photo dress/UV/rest/skin surface required');
 // P61's original photographic shader projects the authenticated image
 // directly from dressRest; it does NOT require a fabricated UV or custom
 // photoProjection BufferAttribute. Snapshot and verify all actual fields.
 const indices=g.index?.array??null,
  triangles=(indices?.length??p.count)/3;
 if(!Number.isSafeInteger(triangles)||triangles<1||
    triangles>maxSourceFaces||
    indices&&!Array.from(indices).every(i=>i<p.count))
  fail('original photo face budget or indices invalid');
 const immutable=Object.entries(g.attributes).map(([name,attr])=>
  [name,attr,attr.array.slice()]);
 const indexBefore=indices?.slice()??null,
  source=p.array.slice();
 let bodies=0;
 root.updateMatrixWorld(true);
 root.traverse(obj=>{
  if(obj!==mesh&&obj.isSkinnedMesh&&!obj.userData?.work56Garment&&
     obj.skeleton?.bones?.length===163)bodies++;
 });
 if(bodies<1||bodies>16)
  fail('genuine original anatomical model required');
 mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
 const skinned=new Float32Array(source.length),v=new THREE.Vector3();
 for(let i=0;i<p.count;i++){
  v.fromArray(source,3*i);mesh.applyBoneTransform(i,v);
  v.applyMatrix4(mesh.matrixWorld);
  if(!finite(v.toArray()))fail('invalid genuine source-skinned pose');
  skinned[3*i]=v.x;skinned[3*i+1]=v.y;skinned[3*i+2]=v.z;
 }
 const budget={maxComparisons,maxCandidatePairs,maxStrictCrossings,
  refineTriangleDistances53,maxDistanceCandidates53,
  refineSourceTopology54,maxZeroDistanceTopologyPairs54,
  refineEdgeWinding55,maxEdgePairs55};
 const context=refineSourceTopology54?{
  source,skinned,rest,skinIndex:si,skinWeight:sw
 }:null;
 if(refineEdgeWinding55)context.edgeGraph55=
  sourceEdgeGraph55(context,indices,triangles);
 const boundary56=refineBoundaryComponents56?
  sourceBoundaryComponents56(context.edgeGraph55,{
   maxBoundaryEdges56,maxBoundaryVertexGroups56
  }):null;
 const original=analyze52(source,indices,triangles,toleranceMeters,budget,context),
  posed=analyze52(skinned,indices,triangles,toleranceMeters,budget,context);
 for(const [name,attr,bytes] of immutable)
  if(g.getAttribute(name)!==attr||
     attr.array.length!==bytes.length||
     !bytes.every((x,i)=>x===attr.array[i]))
   fail('original source photo, skin or mesh attribute altered: '+name);
 if(indexBefore&&(g.index?.array.length!==indexBefore.length||
    !indexBefore.every((x,i)=>x===g.index.array[i])))
  fail('original photo index buffer changed');
 return Object.freeze({
  schema:'M2-real-original-photo-surface-diagnostic-C52',
  source:'licensed-original-Commons-0053-P61-P175',
  authenticOriginalLicensedDress:true,
  actuallySkinned163Bones:true,
  anatomicalBodyMeshes:bodies,
  originalSourceFaces:triangles,
  sourceFacePairBudget:maxComparisons,
  sourceAndPosedFullPairSweepCompleted:original.complete&&posed.complete,
  originalSourceBoxPairs:original.boundsOverlaps,
  originalSourceStrictCrossings:original.strictCrossings,
  originalSourceUncertainBoxPairs:
   original.boundsOverlaps-original.strictCrossings,
  posedBoxPairs:posed.boundsOverlaps,
  posedStrictCrossings:posed.strictCrossings,
  posedUncertainBoxPairs:posed.boundsOverlaps-posed.strictCrossings,
  sourcePairComparisons:original.compared,
  posedPairComparisons:posed.compared,
  sourceSweepExhausted:!original.complete,
  posedSweepExhausted:!posed.complete,
  ...(refineTriangleDistances53?{
   refinedOriginalDistance53:original.distance53,
   refinedPosedDistance53:posed.distance53,
   sourceAndPosedDistanceRefinementCompleted53:
    original.distance53.distanceRefinementComplete&&
    posed.distance53.distanceRefinementComplete,
   duplicateSourceSewingPermission53:false,
   allCapturedPhotoAttributesUnchanged53:true,
   noRealFabricPhysicsCertified53:true
  }:{}),
  ...(refineSourceTopology54?{
   originalSourceTopology54:original.topology54,
   posedSourceTopology54:posed.topology54,
   fullOriginalSourceTopologyAuditCompleted54:
    original.topology54.classificationComplete&&
    posed.topology54.classificationComplete&&
    original.distance53.distanceRefinementComplete&&
    posed.distance53.distanceRefinementComplete,
   originalPhotoAndSkinnedSkinBindingPreserved54:true,
   allZeroSourcePairsRemainContactUnresolved54:true,
   actualPhysicalSewingSeamsCertified54:false
  }:{}),
  ...(refineEdgeWinding55?{
   originalSourceEdgeWinding55:original.edge55,
   posedSourceEdgeWinding55:posed.edge55,
   fullOriginalSourceEdgeWindingAuditCompleted55:
    original.edge55.sourceEdgeAuditComplete&&
    posed.edge55.sourceEdgeAuditComplete&&
    original.topology54.classificationComplete&&
    posed.topology54.classificationComplete&&
    original.distance53.distanceRefinementComplete&&
    posed.distance53.distanceRefinementComplete,
   noEdgeWindingCollisionExemption55:true,
   trueSourceSeamSewingEvidenceMissing55:true,
   ownerSourceAndShaderPhotoProjectionPreserved55:true
  }:{}),
  ...(refineBoundaryComponents56?{
   originalSourceBoundaryComponents56:boundary56,
   originalAndSkinned163BoneBoundaryAuditComplete56:
    boundary56.boundaryComponentAuditComplete&&
    original.edge55.sourceEdgeAuditComplete&&
    posed.edge55.sourceEdgeAuditComplete,
   allOpenSourceBoundaryCandidatesRemainUnverified56:true,
   noAutomaticSourceBoundaryRepairPermitted56:true
  }:{}),
  anyStrictSourceCrossing:original.firstStrict,
  anyStrictPosedCrossing:posed.firstStrict,
  originalSourcePhotoUVRestSkinAndIndicesUntouched:true,
  noRawGeometryOrPhotoExposed:true,
  boundingBoxOverlapNotProofOfContact:true,
  nonCrossingNotProofOfClearance:true,
  anyContactMustRemainBlocked:true,
  noContinuousSelfCollisionCertificate:true,
  realClothPhysics:false,humanPhotorealismApproval:false,
  realPhoneAcceptance:false,releaseAuthorized:false,
  familyAlpha:'HOLD'
 });
}
