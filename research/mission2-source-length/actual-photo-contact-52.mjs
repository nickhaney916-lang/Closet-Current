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
import {createDisposableUpperTorsoWorldTrial60,UPPER_TORSO_TRIAL_OUTWARD60}
 from './upper-torso-clearance-trial60.mjs';
import {measureDisposableSourceSurfaceStrain61}
 from './upper-torso-surface-quality61.mjs';
import {createDisposableClothAlternatives85,createDisposableWitnessLocalized85}
 from './alternative-photo-clearance85.mjs';
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
   // The original source is mesh-local, but the actual 163-bone pose was
   // captured in WORLD coordinates. Apply the unchanged mesh world-linear
   // transform to the original edge; otherwise an ordinary avatar scale
   // is falsely diagnosed as fabric stretch on every boundary edge.
   sourceWorldEdge=new THREE.Vector3(
    orig[start]-orig[end],
    orig[start+1]-orig[end+1],
    orig[start+2]-orig[end+2]).applyMatrix3(graph.sourceWorldLinear56),
   oldLength=sourceWorldEdge.length(),
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


/**
 * P2-C57: compare original SHA-pinned source boundary loops with actual
 * anatomical 163-bone landmarks already used in P61 (neck01, spine04,
 * upperarm01L/R). This is geometric research, NOT independently reviewed
 * garment opening labels. The only returned information is aggregate loop
 * positions and anonymous candidate counts, never owner photograph, source
 * XYZ, face IDs, vertex groups, or skeleton pose matrices.
 *
 * Two separately articulated REAL 163-bone temporary research poses are
 * sampled in try/finally and every joint quaternion is restored before
 * returning. No original source garment mesh, UV, rest, skin, or JPEG edits.
 */
function anatomicalSourceLoops57(graph,root,mesh,boundary56,{
 maxLoopVertices57,maxPoseSamples57
}){
 const edges=[];
 for(const list of graph.edgeUses.values())
  if(list.length===1)edges.push(list[0]);
 const adjacent=new Map();
 for(let i=0;i<edges.length;i++)
  for(const v of [edges[i].from,edges[i].to]){
   const a=adjacent.get(v)??[];
   a.push(i);adjacent.set(v,a);
  }
 const blocked=(reason)=>Object.freeze({
  schema:'M2-original-photograph-anatomical-loop-landmarks-C57',
  sourceOpenBoundaryEdges:edges.length,
  trueOriginalBoundaryLoopCount:boundary56.closedDirectedLoopComponents,
  landmarkBoneNamesFound:0,
  anatomicalCandidateMappingPossible:false,
  landmarkMissingOrBoundaryAmbiguous:true,
  sourceLoopComponentVerticesChecked:0,
  originalLoopHeightOrderComparisons:0,
  candidateLowestGeometricOpening:0,
  candidateNeckProximityOpening:0,
  candidateLeftUpperArmProximityOpening:0,
  candidateRightUpperArmProximityOpening:0,
  twoDistinct163BonePoseSamplesCompleted:0,
  boneSamplesWithActualBoundaryDisplacement:0,
  sampledLoopBoundaryVerticesChanged:0,
  sampledBoundaryLoopsMoved:0,
  posedOriginalLoopConnectivityRetained:false,
  poseRestorationVerified:false,
  sourceReadOnlyAuditRefusedReason:reason,
  noHumanPhotoOpeningsAnnotated:true,
  noSemanticCollarSleeveHemCertification:true,
  noPoseCollisionOrContinuousPhysicsCertificate:true,
  noBoneUVSkinRestOrOriginalPhotoMutated:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
 if(!boundary56.boundaryComponentAuditComplete||
    boundary56.connectedBoundaryComponents!==
     boundary56.closedDirectedLoopComponents||
    boundary56.closedDirectedLoopComponents!==4)
  return blocked('not-four-original-consistent-closed-loops');
 if(adjacent.size>maxLoopVertices57)
  return blocked('original-source-vertex-budget-exceeded');
 const visited=new Uint8Array(edges.length),components=[];
 for(let i=0;i<edges.length;i++){
  if(visited[i])continue;
  const q=[i],verts=new Set();visited[i]=1;
  for(let head=0;head<q.length;head++){
   const e=edges[q[head]];
   for(const v of [e.from,e.to]){
    if(verts.has(v))continue;
    verts.add(v);
    for(const next of adjacent.get(v)??[])
     if(!visited[next]){visited[next]=1;q.push(next);}
   }
  }
  if(verts.size!==q.length||
     [...verts].some(v=>adjacent.get(v).length!==2))
   return blocked('non-simple-boundary-component');
  components.push([...verts]);
 }
 if(components.length!==4||
    components.reduce((n,a)=>n+a.length,0)!==edges.length)
  return blocked('source-boundary-component-accounting-refused');
 // Use exact anatomical names already verified in P61, taken from the
 // photograph-fitting garment's own actual 163-bone skeleton.
 const landmarkNames=['neck01','spine04','upperarm01L','upperarm01R'];
 const byName=new Map(mesh.skeleton.bones.map(b=>[b.name,b]));
 if(landmarkNames.some(name=>!byName.get(name)?.isBone))
  return blocked('source-163-bone-anatomical-names-unavailable');
 root.updateMatrixWorld(true);
 const worldNames=Object.fromEntries(landmarkNames.map(name=>
  [name,byName.get(name).getWorldPosition(new THREE.Vector3())]));
 if(Object.values(worldNames).some(p=>!finite(p.toArray())))
  return blocked('nonfinite-original-anatomical-source-landmark');
 const p=mesh.geometry.getAttribute('position'),point=new THREE.Vector3();
 const sample=(g)=>{
  const idx=graph.reps[g];
  if(idx===undefined)fail('C57 genuine source original vertex representative missing');
  point.fromBufferAttribute(p,idx);
  mesh.applyBoneTransform(idx,point);
  point.applyMatrix4(mesh.matrixWorld);
  if(!finite(point.toArray()))fail('C57 skinned licensed source vertex not finite');
  return point.clone();
 };
 const basePoints=components.map(ids=>ids.map(sample));
 const centers=basePoints.map(points=>
  points.reduce((sum,v)=>sum.add(v),new THREE.Vector3())
   .multiplyScalar(1/points.length));
 if(centers.some(v=>!finite(v.toArray())))
  fail('C57 invalid original photographed garment geometric loop centroid');
 // Anonymous geometric associations: lowest opening is hem-LIKE only.
 // No confidence score, sew/neckline semantics or human annotation.
 const lowest=centers.map((p,i)=>({i,y:p.y})).sort((a,b)=>a.y-b.y)[0].i;
 const others=[0,1,2,3].filter(i=>i!==lowest);
 const nearest=(candidates,landmark)=>
  candidates.map(i=>({i,d:centers[i].distanceTo(worldNames[landmark])}))
   .sort((a,b)=>a.d-b.d)[0].i;
 const neck=nearest(others,'neck01');
 const arms=others.filter(i=>i!==neck);
 const l=nearest(arms,'upperarm01L'),rt=arms.find(i=>i!==l);
 const candidates=[lowest,neck,l,rt];
 if(new Set(candidates).size!==4)
  fail('C57 source anatomical loop candidate rank assignment duplicated');
 const bones=['upperarm01L','upperarm01R'].map(n=>byName.get(n));
 const offsets=[.12,-.12];
 let completed=0,samplesWithMotion=0,changed=0,movedLoops=0;
 const savedBones=bones.map(b=>b.quaternion.clone());
 const sampleSourcePosition=(comp,i)=>basePoints[comp][i];
 try{
  for(let t=0;t<maxPoseSamples57;t++){
   const bone=bones[t],old=bone.quaternion.clone();
   const axis=t===0?new THREE.Vector3(0,0,1):
    new THREE.Vector3(1,0,0);
   const delta=new THREE.Quaternion().setFromAxisAngle(axis,offsets[t]);
   try{
    bone.quaternion.multiply(delta);
    root.updateMatrixWorld(true);
    mesh.skeleton.update();
    let moved=0,movedParts=0;
    for(let ci=0;ci<components.length;ci++){
     let any=false;
     for(let k=0;k<components[ci].length;k++){
      const pos=sample(components[ci][k]);
      if(pos.distanceTo(sampleSourcePosition(ci,k))>1e-5){
       moved++;any=true;
      }
     }
     if(any)movedParts++;
    }
    changed+=moved;movedLoops+=movedParts;
    if(moved>0)samplesWithMotion++;
    completed++;
   }finally{
    bone.quaternion.copy(old);
    root.updateMatrixWorld(true);
    mesh.skeleton.update();
   }
  }
 }finally{
  for(let i=0;i<bones.length;i++)
   bones[i].quaternion.copy(savedBones[i]);
  root.updateMatrixWorld(true);
  mesh.skeleton.update();
 }
 const restored=bones.every((b,i)=>b.quaternion.equals(savedBones[i]))&&
  components.every((ids,c)=>ids.every((id,k)=>
   sample(id).distanceTo(basePoints[c][k])<=1e-6));
 if(!restored)fail('C57 failed to restore real 163-bone source pose');
 return Object.freeze({
  schema:'M2-original-photograph-anatomical-loop-landmarks-C57',
  sourceOpenBoundaryEdges:edges.length,
  trueOriginalBoundaryLoopCount:components.length,
  landmarkBoneNamesFound:4,
  anatomicalCandidateMappingPossible:true,
  landmarkMissingOrBoundaryAmbiguous:false,
  sourceLoopComponentVerticesChecked:
   components.reduce((n,v)=>n+v.length,0),
  originalLoopHeightOrderComparisons:4,
  candidateLowestGeometricOpening:1,
  candidateNeckProximityOpening:1,
  candidateLeftUpperArmProximityOpening:1,
  candidateRightUpperArmProximityOpening:1,
  twoDistinct163BonePoseSamplesCompleted:completed,
  boneSamplesWithActualBoundaryDisplacement:samplesWithMotion,
  sampledLoopBoundaryVerticesChanged:changed,
  sampledBoundaryLoopsMoved:movedLoops,
  posedOriginalLoopConnectivityRetained:true,
  poseRestorationVerified:restored,
  sourceReadOnlyAuditRefusedReason:null,
  noHumanPhotoOpeningsAnnotated:true,
  noSemanticCollarSleeveHemCertification:true,
  noPoseCollisionOrContinuousPhysicsCertificate:true,
  noBoneUVSkinRestOrOriginalPhotoMutated:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}


/**
 * P2-C58: genuinely articulated 163-bone photographic source garment
 * versus itself AND original skinned anatomical body surfaces.
 *
 * Each temporary arm pose is independently sampled; the original photo
 * mesh XYZ, UV/rest, skin weights/indexes and all bone quaternions are
 * restored, and the old fitted neutral pose is checked byte-for-byte.
 * Body AABB pairs and strict transverse crossings are NOT body fit
 * certification, and C53 geometric-zero source pairs stay unresolved.
 */
function skinnedWorldBuffer58(mesh){
 const positions=mesh.geometry.getAttribute('position');
 const output=new Float32Array(positions.count*3),v=new THREE.Vector3();
 mesh.updateWorldMatrix(true,false);
 mesh.skeleton.update();
 for(let i=0;i<positions.count;i++){
  v.fromBufferAttribute(positions,i);
  mesh.applyBoneTransform(i,v);
  v.applyMatrix4(mesh.matrixWorld);
  if(!finite(v.toArray()))
   fail('C58 nonfinite original licensed skinned mesh pose');
  output[3*i]=v.x;output[3*i+1]=v.y;output[3*i+2]=v.z;
 }
 return output;
}
function bodyFaces58(root,cloth,maxBodyFaces){
 let faces=0,invalid=0,bodyMeshes=0;
 const out=[];
 root.updateMatrixWorld(true);
 root.traverse(m=>{
  if(m===cloth||!m.isSkinnedMesh||
     m.userData?.work56Garment||m.skeleton?.bones?.length!==163)return;
  bodyMeshes++;
  const p=m.geometry?.getAttribute('position');
  if(!p?.isBufferAttribute||p.itemSize!==3){
   invalid++;return;
  }
  const n=m.geometry.index?.count??p.count;
  if(n%3!==0){invalid++;return;}
  faces+=n/3;
  if(faces>maxBodyFaces)return;
  const world=skinnedWorldBuffer58(m),indices=m.geometry.index?.array;
  for(let j=0;j<n;j+=3){
   const tri=[0,1,2].map(k=>{
    const v=indices?indices[j+k]:j+k;
    if(!Number.isSafeInteger(v)||v>=p.count||v<0)
     fail('C58 malformed 163-bone anatomical body triangle source');
    return new THREE.Vector3().fromArray(world,3*v);
   });
   if(tri.some(v=>!finite(v.toArray()))){
    invalid++;continue;
   }
   const box=new THREE.Box3().setFromPoints(tri);
   const area=tri[1].clone().sub(tri[0])
    .cross(tri[2].clone().sub(tri[0])).length();
   if(area<=1e-12){invalid++;continue;}
   out.push({tri,minX:box.min.x,maxX:box.max.x,
    minY:box.min.y,maxY:box.max.y,
    minZ:box.min.z,maxZ:box.max.z});
  }
 });
 if(bodyMeshes<1||bodyMeshes>16||invalid>0||
    faces>maxBodyFaces)
  return {complete:false,bodyMeshes,faces,invalid,
   candidates:0,strict:0,near:0,positive:0,compared:0};
 out.sort((a,b)=>a.minX-b.minX);
 return {complete:true,bodyMeshes,faces,invalid,out};
}

/**
 * P2-C59: classify only actual C58 strict body/fabric triangle-crossing
 * witnesses by the licensed source garment TRIANGLE CENTROID relative to
 * original neck01 / spine04 world-height landmarks.
 *
 * These are COARSE HEIGHT BANDS, not measured crossing coordinates,
 * penetrating volumes, skeletal anatomical diagnoses or verified sewing.
 * No raw world positions, face IDs, bone matrices, owner photos or vertices
 * enter the returned summary. The original 163-bone model must be upright.
 */
const SOURCE_BODY_BANDS59=Object.freeze([
 'atOrAboveNeckAnchorHeight',
 'betweenNeckAndSpineAnchorHeights',
 'belowSpineAnchorHeight'
]);
function sourceBodyBandClassifier59(root,mesh){
 const named=new Map(mesh.skeleton.bones.map(b=>[b.name,b]));
 const neck=named.get('neck01'),spine=named.get('spine04');
 if(!neck?.isBone||!spine?.isBone||neck===spine)
  fail('C59 original 163-bone neck/spine source landmarks required');
 root.updateMatrixWorld(true);
 const ny=neck.getWorldPosition(new THREE.Vector3()).y,
  sy=spine.getWorldPosition(new THREE.Vector3()).y;
 if(!Number.isFinite(ny)||!Number.isFinite(sy)||ny<=sy+.001)
  fail('C59 upright original source anatomical height anchors required');
 return tri=>{
  const y=(tri[0].y+tri[1].y+tri[2].y)/3;
  if(!Number.isFinite(y))fail('C59 nonfinite original cloth triangle centroid');
  return y>=ny?SOURCE_BODY_BANDS59[0]:
   y>=sy?SOURCE_BODY_BANDS59[1]:SOURCE_BODY_BANDS59[2];
 };
}
function sourceBodyBandReceipt59(count,strict,complete){
 if(!count)return null;
 const total=SOURCE_BODY_BANDS59.reduce((n,k)=>n+count[k],0);
 if(total!==strict)fail('C59 strict body contact witness bands do not sum exactly');
 return Object.freeze({
  schema:'M2-original-source-body-crossing-centroid-height-bands-C59',
  atOrAboveNeckAnchorHeight:count.atOrAboveNeckAnchorHeight,
  betweenNeckAndSpineAnchorHeights:count.betweenNeckAndSpineAnchorHeights,
  belowSpineAnchorHeight:count.belowSpineAnchorHeight,
  strictlyCrossingBodyTrianglePairWitnesses:strict,
  allObservedStrictCrossingsAccountedFor:total===strict,
  geometricSourceTriangleCentroidNotActualIntersectionPoint:true,
  noValidatedAnatomicalDefectLocalization:true,
  noContactSeverityOrPhysicalPenetrationDepthMeasured:true,
  noOwnerOrOriginalPhotoCoordinatesOrFacesExported:true,
  fullyAuditedAtThisOnePose:complete,
  anyStrictBodyCrossingBlocksGarmentRelease:true,
  collisionExceptionGranted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
function bodyClothContact58(body,clothWorld,indices,tolerance,{
 maxBodyComparisons58,maxBodyCandidatePairs58,
 bodyTriangleBandClassifier59=null,
 captureStrictOriginalClothFaces85=null
}){
 if(captureStrictOriginalClothFaces85!==null&&
  !(captureStrictOriginalClothFaces85 instanceof Set))
  fail('P85 original strict body witness collector must be in-memory Set');
 if(!body.complete)return {...body};
 const clothes=[];
 for(let i=0;i<(indices?.length??clothWorld.length/3);i+=3){
  const tri=[0,1,2].map(j=>{
   const id=indices?indices[i+j]:i+j;
   return new THREE.Vector3().fromArray(clothWorld,3*id);
  });
  const box=new THREE.Box3().setFromPoints(tri);
  clothes.push({tri,faceIndex:i/3,minX:box.min.x,maxX:box.max.x,
   minY:box.min.y,maxY:box.max.y,
   minZ:box.min.z,maxZ:box.max.z});
 }
 // The real 163-bone body contains >100,000 source triangles. Scanning
 // them for each dress face is unnecessarily quadratic. Spatially index
 // body face AABBs in source-WORLD Y/Z cells before the exact three-axis
 // overlap test. A large face enters the global fallback set rather than
 // being dropped; every possible original source hit is still considered.
 const CELL=.06,buckets=new Map(),overflow=[],faces=body.out;
 const span=b=>({
  y0:Math.floor((b.minY-tolerance)/CELL),
  y1:Math.floor((b.maxY+tolerance)/CELL),
  z0:Math.floor((b.minZ-tolerance)/CELL),
  z1:Math.floor((b.maxZ+tolerance)/CELL)
 });
 const bin=(y,z)=>y+':'+z;
 let memberships=0;
 for(let j=0;j<faces.length;j++){
  const t=span(faces[j]),
   n=(t.y1-t.y0+1)*(t.z1-t.z0+1);
  if(!Number.isSafeInteger(n)||n<1)
   fail('C58 nonfinite original skinned body grid cell membership');
  if(n>256){overflow.push(j);continue;}
  memberships+=n;
  if(memberships>2500000)
   return {complete:false,bodyMeshes:body.bodyMeshes,faces:body.faces,
    invalid:body.invalid,compared:0,candidates:0,
    strict:0,near:0,positive:0};
  for(let y=t.y0;y<=t.y1;y++)
   for(let z=t.z0;z<=t.z1;z++){
    const key=bin(y,z),ids=buckets.get(key)??[];
    ids.push(j);buckets.set(key,ids);
   }
 }
 let compared=0,candidates=0,strict=0,near=0,positive=0,
  complete=true;
 const regionCounts59=bodyTriangleBandClassifier59?
  Object.fromEntries(SOURCE_BODY_BANDS59.map(k=>[k,0])):null;
 outer:for(const c of clothes){
  const t=span(c),
   n=(t.y1-t.y0+1)*(t.z1-t.z0+1);
  if(!Number.isSafeInteger(n)||n<1||n>4096){
   complete=false;break;
  }
  const candidatesByYZ=new Set(overflow);
  for(let y=t.y0;y<=t.y1;y++)
   for(let z=t.z0;z<=t.z1;z++)
    for(const i of buckets.get(bin(y,z))??[])
     candidatesByYZ.add(i);
  for(const j of candidatesByYZ){
   if(++compared>maxBodyComparisons58){
    complete=false;break outer;
   }
   const b=faces[j];
   if(b.maxX+tolerance<c.minX||c.maxX+tolerance<b.minX||
      b.maxY+tolerance<c.minY||c.maxY+tolerance<b.minY||
      b.maxZ+tolerance<c.minZ||c.maxZ+tolerance<b.minZ)
    continue;
   if(++candidates>maxBodyCandidatePairs58){
    complete=false;break outer;
   }
   if(strictFaceCrossing52(c.tri,b.tri,1e-7)){
    strict++;
    // Existing C58 definition is unchanged. Capture original cloth FACE
    // IDs in a private Set only; never publish raw geometry or IDs.
    captureStrictOriginalClothFaces85?.add(c.faceIndex);
    if(regionCounts59){
     const region=bodyTriangleBandClassifier59(c.tri);
     if(!SOURCE_BODY_BANDS59.includes(region))
      fail('C59 unknown original source height band');
     regionCounts59[region]++;
    }
   }
   const d=triangleDistance53(c.tri,b.tri);
   if(!Number.isFinite(d)||d<0)
    fail('C58 invalid original photograph garment-body separation');
   if(d<=tolerance)near++;else positive++;
  }
 }
 return {complete,bodyMeshes:body.bodyMeshes,faces:body.faces,
  invalid:body.invalid,compared,candidates,strict,near,positive,
  sourceBodyHeightBandReceipt59:
   sourceBodyBandReceipt59(regionCounts59,strict,complete)};
}

/**
 * C60: the ONLY fabric change is to a disposable Float32Array of measured
 * SOURCE-skinned world positions. The original photographed SkinnedMesh,
 * 163-bone rig, UV/photo texture/skin and wardrobe remain byte-identical.
 * Compare both body and self-contacts on the very same real source poses;
 * never infer contact-free clearance from a reduced witness count.
 */
function measureDisposableTorsoTrial60(root,mesh,body,world,
 indices,triangles,tolerance,poseBudget,bodyBudget,baselineBodyStrict,
 baselineSelfStrict,refineSurfaceStrain61=false){
 const named=new Map(mesh.skeleton.bones.map(b=>[b.name,b]));
 const get=(name)=>{
  const bone=named.get(name);
  if(!bone?.isBone)fail('C60 original neck/spine anatomical rig missing');
  return bone.getWorldPosition(new THREE.Vector3()).toArray();
 };
 const untouchedWorld=world.slice();
 const proposal=createDisposableUpperTorsoWorldTrial60(world,{
  neck:get('neck01'),spine:get('spine04'),
  outwardMeters:UPPER_TORSO_TRIAL_OUTWARD60
 });
 const trialSelf=analyze52(proposal.world,indices,triangles,tolerance,
  poseBudget);
 const trialBody=bodyClothContact58(body,proposal.world,indices,tolerance,
  bodyBudget);
 const sourceUntouched=world.length===untouchedWorld.length&&
  world.every((x,i)=>x===untouchedWorld[i]);
 // The *original* supplied buffer is never passed to any mutator;
 // a fresh clone is allocated even if no vertices moved.
 if(!sourceUntouched||proposal.world===world)
  fail('C60 genuine photographed source buffer integrity violated');
 const full=trialSelf.complete&&
  trialSelf.distance53.distanceRefinementComplete&&trialBody.complete;
 return Object.freeze({
  schema:'M2-original-licensed-disposable-upper-torso-clearance-trial-C60',
  outwardTrialMeters:UPPER_TORSO_TRIAL_OUTWARD60,
  actual163BoneSourceVertexCount:world.length/3,
  trialVerticesMoved:proposal.movedVertices,
  maxTrialWorldDisplacementMeters:proposal.maxAppliedMeters,
  baselineOriginalBodyStrictCrossings:baselineBodyStrict,
  trialOriginalBodyStrictCrossings:trialBody.strict,
  baselineOriginalSelfStrictCrossings:baselineSelfStrict,
  trialOriginalSelfStrictCrossings:trialSelf.strictCrossings,
  trialSourceBodyNearOrZeroPairs:trialBody.near,
  completeOriginalBodyAndSelfAudit:full,
  trialBodyStrictCrossingReduction:
   full?baselineBodyStrict-trialBody.strict:null,
  noNewBodyStrictCrossings:full&&trialBody.strict<=baselineBodyStrict,
  noNewSelfStrictCrossings:full&&
   trialSelf.strictCrossings<=baselineSelfStrict,
  allOriginalBodyCrossingsActuallyGone:full&&trialBody.strict===0,
  noGarmentSafetyOrContinuousMotionCertificate:true,
  physicalFabricMotionOrPhotorealismUnverified:true,
  originalPhotoMeshUVSkinMaterialsAndBoneMatricesUnmodified:true,
  allTrialVerticesRetainedInMemoryOnly:true,
  ...(refineSurfaceStrain61?{
   sourceOriginalPhotoSurfaceStrain61:
    measureDisposableSourceSurfaceStrain61(world,proposal.world,indices)
  }:{}),
  researchCandidateNotApprovedForConsumer3D:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
/**
 * P85: compare two genuinely different disposable alternatives against
 * unchanged C58 strict body and C52/C53 self contact plus unchanged C61
 * surface-quality guard. Original 163-bone skinned dress/texture are NEVER
 * edited. No raw source positions, per-face IDs or private RGB in receipts.
 */
function compareAlternative85(root,mesh,body,world,indices,triangles,
 tolerance,poseBudget,bodyBudget,baselineBodyStrict,baselineSelfStrict,
 originalClothWitnessFaces85){
 if(!(originalClothWitnessFaces85 instanceof Set)||
  (baselineBodyStrict>0&&originalClothWitnessFaces85.size===0)||
  originalClothWitnessFaces85.size>baselineBodyStrict)
  fail('P85 incomplete real original strict body-cloth witness source');
 const byName=new Map(mesh.skeleton.bones.map(b=>[b.name,b]));
 const pos=name=>{
  const bone=byName.get(name);
  if(!bone?.isBone)fail('P85 authentic 163-bone landmark missing');
  return bone.getWorldPosition(new THREE.Vector3()).toArray();
 };
 const before=world.slice(),at=Date.now();
 const neck=pos('neck01'),spine=pos('spine04');
 const candidates=createDisposableClothAlternatives85(world,indices,{
  neck,spine});
 const localCandidates=createDisposableWitnessLocalized85(world,indices,{
  neck,spine,
  strictClothFaceIndices:[...originalClothWitnessFaces85].sort((a,b)=>a-b)
 });
 const evaluate=({world:trial,...recipe})=>{
  const self=analyze52(trial,indices,triangles,tolerance,poseBudget);
  const bodyCheck=bodyClothContact58(body,trial,indices,tolerance,bodyBudget);
  const strain=measureDisposableSourceSurfaceStrain61(world,trial,indices);
  const complete=self.complete&&
   self.distance53.distanceRefinementComplete&&bodyCheck.complete&&
   strain.signedOriginalSourceFacesAnalyzed===triangles;
  return Object.freeze({
   ...recipe,
   baselineBodyStrictCrossings:baselineBodyStrict,
   baselineSelfStrictCrossings:baselineSelfStrict,
   strictBodyCrossings:bodyCheck.strict,
   strictSelfCrossings:self.strictCrossings,
   unresolvedBodyNearOrZeroPairs:bodyCheck.near,
   sourceFaceStrain61:strain,
   fullOriginalContactAndQualitySweepCompleted:complete,
   bodyClearanceSampled:complete&&bodyCheck.strict===0,
   noIntroducedSelfCrossing:complete&&
    self.strictCrossings<=baselineSelfStrict,
   provisionalGeometryGuard:complete&&strain.provisionalMeshDistortionGuardPassed&&
    (recipe.maxCoincidentSeamDeltaMeters??0)<.000002,
   candidateAcceptedForWearable3D:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 };
 const rows=candidates.map(evaluate),localRows=localCandidates.map(evaluate);
 if(!world.every((v,i)=>v===before[i]))
  fail('P85 original original-photo skinned world geometry modified');
 return Object.freeze({
  schema:'M2-P85-source-pinned-alternative-world-clearance-Pareto',
  licensedSourceTriangleCount:triangles,
  actualSkinned163BoneSource:true,
  elapsedDesktopOrBrowserMilliseconds:Date.now()-at,
  originalPhotoUVRestSkinAnd163BonesUnchanged:true,
  realSourceContactAndQualityGatesUnchanged:true,
  candidates:rows,
  // Only anonymous counts escape. Raw witness face IDs are never emitted.
  privateOriginalStrictClothWitnessFaceCount85:
   originalClothWitnessFaces85.size,
  witnessLocalizedCandidates85:localRows,
  allSixteenWitnessLocalizedSweepsCompleted85:
   localRows.length===16&&localRows.every(x=>
    x.fullOriginalContactAndQualitySweepCompleted),
  originalContactWitnessIdsNeverExported85:true,
  allFourSourceContactSweepsCompleted:rows.every(x=>
   x.fullOriginalContactAndQualitySweepCompleted),
  noContinuousCollisionOrHumanVisualAcceptance:true,
  noPhotoPixelsOrSourceCoordinatesExported:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
function articulatedContact58(root,mesh,source,indices,triangles,
 neutralWorld,neutral,anatomical57,tolerance,{
 maxComparisons58,maxCandidatePairs58,maxDistancePairs58,
 maxBodyFaces58,maxBodyComparisons58,maxBodyCandidatePairs58,
 maxPoseSamples58,refineBodyHeightWitnessBands59=false,
 refineUpperTorsoFitTrial60=false,
 refineSurfaceStrain61=false,refineAlternative85=false
}){
 const refused=(reason)=>Object.freeze({
  schema:'M2-licensed-original-163bone-articulated-contact-C58',
  sourceFaceCount:triangles,
  originalNeutralSelfBoxPairs:neutral.boundsOverlaps,
  originalNeutralSelfStrictCrossings:neutral.strictCrossings,
  originalNeutralBodyAuditComplete:false,
  originalNeutralBodyMeshes:0,
  originalNeutralBodyInvalidFaces:0,
  originalNeutralBodyComparisons:0,
  originalNeutralBodyTriangleCount:0,
  originalNeutralBodyBoxPairs:0,
  originalNeutralBodyNearOrZeroUnresolved:0,
  originalNeutralBodyStrictCrossings:0,
  poseSampleCount:0,completeSelfPoseSweeps:0,
  completeBodyPoseSweeps:0,actuallyDisplacedClothVerticesAcrossSamples:0,
  originalSelfBoxPairsAcrossSamples:0,
  originalSelfGeometricZeroUnresolvedAcrossSamples:0,
  originalSelfPositiveGapAtSampledPoseAcrossSamples:0,
  originalSelfStrictTransverseCrossingsAcrossSamples:0,
  originalSelfPairSampleBudgetExhausted:true,
  originalBodyTrianglesInspectedAcrossSamples:0,
  originalBodyComparisonsAcrossSamples:0,
  originalBodyBoxPairsAcrossSamples:0,
  originalBodyNearOrZeroUnresolvedAcrossSamples:0,
  originalBodyStrictTransverseCrossingsAcrossSamples:0,
  originalBodyPairSampleBudgetExhausted:true,
  originalBodyIndependentClothFitCertified:false,
  allTemporaryBoneQuaternionsRestored:false,
  exactNeutralWorldSkinnedDressRestored:false,
  sourceReadOnlySampleRefusedReason:reason,
  allGeometricZerosStillUnresolved:true,
  sampledPoseIntersectionNotContinuousPhysics:true,
  noSkinOrOriginalPhotoOrOwnerFieldsExposed:true,
  noSourceGeometryEdited:true,
  sampledPoseContactNotReleaseApproval:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
 if(!anatomical57?.anatomicalCandidateMappingPossible||
    !anatomical57.poseRestorationVerified||
    anatomical57.twoDistinct163BonePoseSamplesCompleted!==2)
  return refused('C57-anatomical-source-pose-evidence-incomplete');
 const byName=new Map(mesh.skeleton.bones.map(b=>[b.name,b]));
 const arms=['upperarm01L','upperarm01R'].map(name=>byName.get(name));
 if(arms.some(b=>!b?.isBone))
  return refused('original-163-bone-anatomical-arms-not-found');
 const quaternions=mesh.skeleton.bones.map(b=>b.quaternion.clone());
 const signedPositions=mesh.geometry.getAttribute('position').array.slice();
 const poseBudget={maxComparisons:maxComparisons58,
  maxCandidatePairs:maxCandidatePairs58,
  maxStrictCrossings:1024,
  refineTriangleDistances53:true,maxDistanceCandidates53:maxDistancePairs58,
  refineSourceTopology54:false,refineEdgeWinding55:false};
 const neutralPrivateWitness85=refineAlternative85?new Set():null;
 const neutralBody=bodyClothContact58(
  bodyFaces58(root,mesh,maxBodyFaces58),neutralWorld,indices,tolerance,{
   maxBodyComparisons58,maxBodyCandidatePairs58,
   bodyTriangleBandClassifier59:refineBodyHeightWitnessBands59?
    sourceBodyBandClassifier59(root,mesh):null,
   captureStrictOriginalClothFaces85:neutralPrivateWitness85
  });
 const sampledBodyHeightBands59=[];
 const trialBodyBudget60={maxBodyComparisons58,maxBodyCandidatePairs58};
 const neutralTrial60=refineUpperTorsoFitTrial60?
  measureDisposableTorsoTrial60(root,mesh,
   bodyFaces58(root,mesh,maxBodyFaces58),neutralWorld,indices,
   triangles,tolerance,poseBudget,trialBodyBudget60,
   neutralBody.strict,neutral.strictCrossings,refineSurfaceStrain61):null;
 const trialPoseResults60=[];
 const alternativesPose85=[];
 const neutralAlternatives85=refineAlternative85?
  compareAlternative85(root,mesh,bodyFaces58(root,mesh,maxBodyFaces58),
   neutralWorld,indices,triangles,tolerance,poseBudget,trialBodyBudget60,
   neutralBody.strict,neutral.strictCrossings,
   neutralPrivateWitness85):null;
 let samples=0,selfComplete=0,bodyComplete=0,displacements=0,
  selfBoxPairs=0,selfZeros=0,selfSeparated=0,selfStrict=0,
  bodyFacesCount=0,bodyCompared=0,bodyPairs=0,bodyNear=0,bodyStrict=0;
 try{
  for(let pose=0;pose<maxPoseSamples58;pose++){
   const arm=arms[pose],original=arm.quaternion.clone();
   const axis=pose===0?new THREE.Vector3(0,0,1):
    new THREE.Vector3(1,0,0);
   const rotation=new THREE.Quaternion()
    .setFromAxisAngle(axis,pose===0?.12:-.12);
   try{
    arm.quaternion.multiply(rotation);
    root.updateMatrixWorld(true);
    mesh.skeleton.update();
    const world=skinnedWorldBuffer58(mesh);
    const changed=world.reduce((n,val,i)=>
     n+(i%3===0&&Math.hypot(
       world[i]-neutralWorld[i],
       world[i+1]-neutralWorld[i+1],
       world[i+2]-neutralWorld[i+2])>1e-5?1:0),0);
    displacements+=changed;
    // Use the very same proven C52 strict face witness and C53 exact
    // triangle distance path, not a new synthetic 3D collision solver.
    const self=analyze52(world,indices,triangles,tolerance,
     poseBudget);
    selfBoxPairs+=self.boundsOverlaps;
    selfStrict+=self.strictCrossings;
    selfZeros+=self.distance53.geometricZeroOrOverlapUnresolved;
    selfSeparated+=self.distance53.positiveGapBeyondToleranceAtThisPose;
    if(self.complete&&self.distance53.distanceRefinementComplete)
     selfComplete++;
    const body=bodyFaces58(root,mesh,maxBodyFaces58);
    const armPrivateWitness85=refineAlternative85?new Set():null;
    const bodyCheck=bodyClothContact58(body,world,indices,tolerance,{
     maxBodyComparisons58,maxBodyCandidatePairs58,
     bodyTriangleBandClassifier59:refineBodyHeightWitnessBands59?
      sourceBodyBandClassifier59(root,mesh):null,
     captureStrictOriginalClothFaces85:armPrivateWitness85
    });
    if(refineBodyHeightWitnessBands59)
     sampledBodyHeightBands59.push(bodyCheck.sourceBodyHeightBandReceipt59??null);
    if(refineUpperTorsoFitTrial60)
     trialPoseResults60.push(measureDisposableTorsoTrial60(root,mesh,
      body,world,indices,triangles,tolerance,poseBudget,
      trialBodyBudget60,bodyCheck.strict,self.strictCrossings,
      refineSurfaceStrain61));
    if(refineAlternative85)
     alternativesPose85.push(compareAlternative85(root,mesh,body,
      world,indices,triangles,tolerance,poseBudget,trialBodyBudget60,
      bodyCheck.strict,self.strictCrossings,armPrivateWitness85));
    bodyFacesCount+=bodyCheck.faces;
    bodyCompared+=bodyCheck.compared;
    bodyPairs+=bodyCheck.candidates;
    bodyNear+=bodyCheck.near;
    bodyStrict+=bodyCheck.strict;
    if(bodyCheck.complete)bodyComplete++;
    samples++;
   }finally{
    arm.quaternion.copy(original);
    root.updateMatrixWorld(true);
    mesh.skeleton.update();
   }
  }
 }finally{
  for(let i=0;i<mesh.skeleton.bones.length;i++)
   mesh.skeleton.bones[i].quaternion.copy(quaternions[i]);
  root.updateMatrixWorld(true);
  mesh.skeleton.update();
 }
 const restored=mesh.skeleton.bones.every((b,i)=>
  b.quaternion.equals(quaternions[i]));
 const neutralAgain=skinnedWorldBuffer58(mesh);
 const sourceIntact=signedPositions.every((v,i)=>
  mesh.geometry.getAttribute('position').array[i]===v);
 const worldRestored=neutralAgain.every((v,i)=>
  Math.abs(v-neutralWorld[i])<=1e-6);
 if(!restored||!worldRestored||!sourceIntact)
  fail('C58 cannot restore authenticated 163-bone photographic source');
 return Object.freeze({
  schema:'M2-licensed-original-163bone-articulated-contact-C58',
  sourceFaceCount:triangles,
  originalNeutralSelfBoxPairs:neutral.boundsOverlaps,
  originalNeutralSelfStrictCrossings:neutral.strictCrossings,
  originalNeutralBodyAuditComplete:neutralBody.complete,
  originalNeutralBodyMeshes:neutralBody.bodyMeshes,
  originalNeutralBodyInvalidFaces:neutralBody.invalid,
  originalNeutralBodyComparisons:neutralBody.compared,
  originalNeutralBodyTriangleCount:neutralBody.faces,
  originalNeutralBodyBoxPairs:neutralBody.candidates,
  originalNeutralBodyNearOrZeroUnresolved:neutralBody.near,
  originalNeutralBodyStrictCrossings:neutralBody.strict,
  poseSampleCount:samples,
  completeSelfPoseSweeps:selfComplete,
  completeBodyPoseSweeps:bodyComplete,
  actuallyDisplacedClothVerticesAcrossSamples:displacements,
  originalSelfBoxPairsAcrossSamples:selfBoxPairs,
  originalSelfGeometricZeroUnresolvedAcrossSamples:selfZeros,
  originalSelfPositiveGapAtSampledPoseAcrossSamples:selfSeparated,
  originalSelfStrictTransverseCrossingsAcrossSamples:selfStrict,
  originalSelfPairSampleBudgetExhausted:selfComplete!==samples,
  originalBodyTrianglesInspectedAcrossSamples:bodyFacesCount,
  originalBodyComparisonsAcrossSamples:bodyCompared,
  originalBodyBoxPairsAcrossSamples:bodyPairs,
  originalBodyNearOrZeroUnresolvedAcrossSamples:bodyNear,
  originalBodyStrictTransverseCrossingsAcrossSamples:bodyStrict,
  originalBodyPairSampleBudgetExhausted:bodyComplete!==samples,
  originalBodyIndependentClothFitCertified:false,
  ...(refineAlternative85?{
   disposableNeutralAlternativeClearance85:neutralAlternatives85,
   disposableArmAlternativeClearance85:alternativesPose85,
   sourceOriginalPhotoAlternativeSweepComplete85:
    neutralAlternatives85?.allFourSourceContactSweepsCompleted===true&&
    alternativesPose85.length===2&&
    alternativesPose85.every(x=>x.allFourSourceContactSweepsCompleted),
   allAlternativesRemainResearchOnly85:true,
   allWitnessLocalizedOriginalSourceSweepsCompleted85:
    neutralAlternatives85?.allSixteenWitnessLocalizedSweepsCompleted85===true&&
    alternativesPose85.length===2&&
    alternativesPose85.every(x=>x.allSixteenWitnessLocalizedSweepsCompleted85),
   originalBodyWitnessFaceIDsOnlyInMemory85:true
  }:{}),
  ...(refineUpperTorsoFitTrial60?{
   disposableNeutralUpperTorsoTrial60:neutralTrial60,
   disposableArticulatedUpperTorsoTrials60:trialPoseResults60,
   fullOriginalPhotoTrialAuditCompleted60:
    neutralTrial60?.completeOriginalBodyAndSelfAudit===true&&
    trialPoseResults60.length===2&&
    trialPoseResults60.every(r=>r.completeOriginalBodyAndSelfAudit),
   sampledTrialReducedEveryOriginalBodyWitness60:
    neutralTrial60?.allOriginalBodyCrossingsActuallyGone===true&&
    trialPoseResults60.length===2&&
    trialPoseResults60.every(r=>r.allOriginalBodyCrossingsActuallyGone),
   noTrialPreviewGeometryCommitted60:true,
   noPhotographedSourceOr163BoneRigEdited60:true,
   ...(refineSurfaceStrain61?{
    completeOriginalPhotographFaceStrainAudit61:
     neutralTrial60?.sourceOriginalPhotoSurfaceStrain61?.
      signedOriginalSourceFacesAnalyzed===triangles&&
     trialPoseResults60.length===2&&
     trialPoseResults60.every(t=>t.sourceOriginalPhotoSurfaceStrain61?.
      signedOriginalSourceFacesAnalyzed===triangles),
    researchDeformationNotActuallyRendered61:true,
    noPhotorealReleaseOrSourceSeamWaiver61:true
   }:{}),
  }:{}),
  ...(refineBodyHeightWitnessBands59?{
   originalNeutralBodyHeightBands59:neutralBody.sourceBodyHeightBandReceipt59??null,
   originalArticulatedBodyHeightBands59:sampledBodyHeightBands59,
   originalBodyHeightBandEvidenceComplete59:
    neutralBody.complete&&bodyComplete===samples&&samples===2&&
    sampledBodyHeightBands59.length===2&&
    sampledBodyHeightBands59.every(x=>x?.fullyAuditedAtThisOnePose===true),
   rawBodyClothCrossingFaceIDsAndXYZWithheld59:true,
   noAnatomicalCollisionReleaseWaiver59:true
  }:{}),
  allTemporaryBoneQuaternionsRestored:restored,
  exactNeutralWorldSkinnedDressRestored:worldRestored,
  sourceReadOnlySampleRefusedReason:null,
  allGeometricZerosStillUnresolved:true,
  sampledPoseIntersectionNotContinuousPhysics:true,
  noSkinOrOriginalPhotoOrOwnerFieldsExposed:true,
  noSourceGeometryEdited:true,
  sampledPoseContactNotReleaseApproval:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
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
 maxBoundaryVertexGroups56=20000,
 refineAnatomicalLoopLandmarks57=false,maxLoopVertices57=50000,
 maxPoseSamples57=2,
 refineArticulatedContacts58=false,
 refineBodyHeightWitnessBands59=false,
 refineUpperTorsoFitTrial60=false,
 refineSurfaceStrain61=false,refineAlternative85=false,
 maxPoseSamples58=2,
 maxComparisons58=800000,maxCandidatePairs58=100000,
 maxDistancePairs58=100000,maxBodyFaces58=160000,
 maxBodyComparisons58=10000000,maxBodyCandidatePairs58=160000
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
    maxBoundaryVertexGroups56<1||maxBoundaryVertexGroups56>200000||
    typeof refineAnatomicalLoopLandmarks57!=='boolean'||
    (refineAnatomicalLoopLandmarks57&&!refineBoundaryComponents56)||
    !Number.isSafeInteger(maxLoopVertices57)||
    maxLoopVertices57<1||maxLoopVertices57>100000||
    !Number.isSafeInteger(maxPoseSamples57)||
    maxPoseSamples57<1||maxPoseSamples57>2||
    typeof refineSurfaceStrain61!=='boolean'||
    (refineSurfaceStrain61&&!refineUpperTorsoFitTrial60)||
    typeof refineAlternative85!=='boolean'||
    (refineAlternative85&&!refineSurfaceStrain61)||
    typeof refineUpperTorsoFitTrial60!=='boolean'||
    (refineUpperTorsoFitTrial60&&
     (!refineBodyHeightWitnessBands59||!refineArticulatedContacts58))||
    typeof refineBodyHeightWitnessBands59!=='boolean'||
    (refineBodyHeightWitnessBands59&&!refineArticulatedContacts58)||
    typeof refineArticulatedContacts58!=='boolean'||
    (refineArticulatedContacts58&&!refineAnatomicalLoopLandmarks57)||
    !Number.isSafeInteger(maxPoseSamples58)||maxPoseSamples58<1||
    maxPoseSamples58>2||
    !Number.isSafeInteger(maxComparisons58)||maxComparisons58<1||
    maxComparisons58>3000000||
    !Number.isSafeInteger(maxCandidatePairs58)||maxCandidatePairs58<1||
    maxCandidatePairs58>500000||
    !Number.isSafeInteger(maxDistancePairs58)||maxDistancePairs58<1||
    maxDistancePairs58>500000||
    !Number.isSafeInteger(maxBodyFaces58)||maxBodyFaces58<1||
    maxBodyFaces58>300000||
    !Number.isSafeInteger(maxBodyComparisons58)||maxBodyComparisons58<1||
    maxBodyComparisons58>20000000||
    !Number.isSafeInteger(maxBodyCandidatePairs58)||
    maxBodyCandidatePairs58<1||maxBodyCandidatePairs58>500000)
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
 // Set the common ORIGINAL-to-POSE WORLD reference frame before measuring
 // any source-edge stretch. This is private, never part of public receipts.
 if(refineBoundaryComponents56)context.edgeGraph55.sourceWorldLinear56=
  new THREE.Matrix3().setFromMatrix4(mesh.matrixWorld);
 const boundary56=refineBoundaryComponents56?
  sourceBoundaryComponents56(context.edgeGraph55,{
   maxBoundaryEdges56,maxBoundaryVertexGroups56
  }):null;
 const anatomical57=refineAnatomicalLoopLandmarks57?
  anatomicalSourceLoops57(context.edgeGraph55,root,mesh,boundary56,{
   maxLoopVertices57,maxPoseSamples57
  }):null;
 const original=analyze52(source,indices,triangles,toleranceMeters,budget,context),
  posed=analyze52(skinned,indices,triangles,toleranceMeters,budget,context);
 const articulated58=refineArticulatedContacts58?
  articulatedContact58(root,mesh,source,indices,triangles,
   skinned,posed,anatomical57,toleranceMeters,{
    maxComparisons58,maxCandidatePairs58,maxDistancePairs58,
    maxBodyFaces58,maxBodyComparisons58,maxBodyCandidatePairs58,
    maxPoseSamples58,refineBodyHeightWitnessBands59,
    refineUpperTorsoFitTrial60,refineSurfaceStrain61,refineAlternative85
   }):null;
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
  ...(refineAnatomicalLoopLandmarks57?{
   originalAnatomicalLoopCandidates57:anatomical57,
   sourceAnatomicalLoopEvidenceComplete57:
    anatomical57.anatomicalCandidateMappingPossible&&
    anatomical57.poseRestorationVerified&&
    anatomical57.twoDistinct163BonePoseSamplesCompleted===2&&
    boundary56.boundaryComponentAuditComplete&&
    original.edge55.sourceEdgeAuditComplete&&
    posed.edge55.sourceEdgeAuditComplete,
   anatomicalSourceLoopNamesNotHumanVerified57:true,
   realSkinPoseSamplingNotCollisionApproval57:true
  }:{}),
  ...(refineAlternative85?{
   genuineOriginalPhotoAlternativesFullyAudited85:
    articulated58?.sourceOriginalPhotoAlternativeSweepComplete85===true,
   originalLicensedSourceNotDeformedOrDeployed85:true,
   noResearchAlternativeApprovedForWear85:true
  }:{}),
  ...(refineSurfaceStrain61?{
   genuineOriginalPhotoSurfaceStrainBudgetCompleted61:
    articulated58?.completeOriginalPhotographFaceStrainAudit61===true,
   sourceGeometryNotAlteredByStrainAudit61:true,
   noRealFabricVisualImprovementsCertified61:true
  }:{}),
  ...(refineUpperTorsoFitTrial60?{
   disposablePhotographedUpperTorsoFitWorldAudit60:
    articulated58?.fullOriginalPhotoTrialAuditCompleted60===true,
   originalPhotoAndAnatomicalBodyNeverAdjusted60:true,
   trialNotApprovedAsWearableGarment60:true
  }:{}),
  ...(refineBodyHeightWitnessBands59?{
   genuineSourceBodyCrossingHeightWitnesses59:
    articulated58?.originalBodyHeightBandEvidenceComplete59===true,
   noActualPiercingPointOrSeverityLocalizationCertified59:true,
   noSourceGeometryAdjustmentOrCollisionWaiver59:true
  }:{}),
  ...(refineArticulatedContacts58?{
   originalArticulatedContactReceipt58:articulated58,
   originalPhotoArticulatedPoseEvidenceComplete58:
    articulated58.poseSampleCount===2&&
    articulated58.originalNeutralBodyAuditComplete&&
    articulated58.completeSelfPoseSweeps===2&&
    articulated58.completeBodyPoseSweeps===2&&
    articulated58.allTemporaryBoneQuaternionsRestored&&
    articulated58.exactNeutralWorldSkinnedDressRestored,
   noGenuineArticulatedPhotoCollisionSafetyCertificate58:true,
   noOriginalPhotographedGarmentSewingOrBodyCollisionWaiver58:true
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

/**
 * P86 research-only: actually render the exactly C58/C61-approved
 * photographed Commons-0053 original skinned WORLD-pose cloth candidate.
 *
 * Source P61 shader uses original dressRest and uDressImage: attach a
 * parallel NEVER-SKINNED static-pose Mesh using the exact ORIGINAL material
 * instance, untouched photo crop/texture and cloned source attributes.
 * This is not a replacement SkinnedMesh, not motion/photoreal approval.
 * Never expose sampled RGB, UV arrays, vertex coordinates or face IDs
 * through the browser research bridge. Release/merge/ship always refused.
 */
export function installDisposableOriginalDressRenderPreview86({
 root,dress,sourceReceipt
}={}){
 const mesh=dress?.mesh,g=mesh?.geometry,parent=mesh?.parent;
 if(!root?.isObject3D||!mesh?.isSkinnedMesh||!parent?.isObject3D||
  !mesh.skeleton||mesh.skeleton.bones.length!==163||
  !g?.isBufferGeometry||!g.getAttribute('dressRest')||
  !g.getAttribute('skinIndex')||!g.getAttribute('skinWeight')||
  !mesh.material?.isMeshStandardMaterial||
  typeof mesh.material.onBeforeCompile!=='function'||
  dress.stats?.sourceId!==SOURCE_ID||
  dress.stats?.sourceSHA256!==SHA||
  dress.stats?.photographedDressDrape61!==true||
  dress.stats?.sourceTextureAndMaterialPreserved61!==true||
  sourceReceipt?.schema!=='M2-real-original-photo-surface-diagnostic-C52'||
  sourceReceipt?.authenticOriginalLicensedDress!==true||
  sourceReceipt?.originalSourcePhotoUVRestSkinAndIndicesUntouched!==true||
  sourceReceipt?.genuineOriginalPhotoAlternativesFullyAudited85!==true||
  sourceReceipt?.releaseAuthorized!==false)
  fail('P86 requires exact original licensed shader/photo, 163 bones and complete P85 source numerical audit');
 const poses=[sourceReceipt.originalArticulatedContactReceipt58?.
   disposableNeutralAlternativeClearance85,
  ...sourceReceipt.originalArticulatedContactReceipt58?.
   disposableArmAlternativeClearance85??[]];
 if(poses.length!==3||poses.some(p=>{
  const t=p?.witnessLocalizedCandidates85?.[14],q=t?.sourceFaceStrain61;
  return p.allSixteenWitnessLocalizedSweepsCompleted85!==true||
   t?.method!=='strict-witness-local-normal-restoration'||
   t?.normalRestorationStrength85!==.30||
   t?.bodyClearanceSampled!==true||
   t?.strictBodyCrossings!==0||t?.strictSelfCrossings!==0||
   q?.provisionalMeshDistortionGuardPassed!==true||
   t?.provisionalGeometryGuard!==true;
 }))fail('P86 no full three-pose original C52 C58 C61 numerical acceptance; no render permitted');
 if(globalThis.__M2P85Preview86)
  fail('P86 existing visual source preview must first be revoked');
 root.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 mesh.skeleton.update();
 const source=g.getAttribute('position'),indices=g.index?.array??null,
  originalWorld=skinnedWorldBuffer58(mesh),before=originalWorld.slice(),
  originalVisible=mesh.visible,
  poseWitnesses=new Set(),body=bodyFaces58(root,mesh,160000),
  bodyCheck=bodyClothContact58(body,originalWorld,indices,.00002,{
   maxBodyComparisons58:10000000,
   maxBodyCandidatePairs58:160000,
   captureStrictOriginalClothFaces85:poseWitnesses
  });
 if(!bodyCheck.complete||bodyCheck.strict!==
  poses[0].candidates[0].baselineBodyStrictCrossings||
  poseWitnesses.size!==
   poses[0].privateOriginalStrictClothWitnessFaceCount85)
  fail('P86 failed to reproduce unchanged original C58 contact witness set');
 const bone=name=>{
  const b=mesh.skeleton.bones.find(x=>x.name===name);
  if(!b?.isBone)fail('P86 exact neutral 163-bone landmark missing');
  return b.getWorldPosition(new THREE.Vector3()).toArray();
 };
 const alternatives=createDisposableWitnessLocalized85(originalWorld,indices,{
  neck:bone('neck01'),spine:bone('spine04'),
  strictClothFaceIndices:[...poseWitnesses].sort((a,b)=>a-b)
 });
 const chosen=alternatives[14],test=chosen.world;
 const b=bodyClothContact58(body,test,indices,.00002,{
   maxBodyComparisons58:10000000,maxBodyCandidatePairs58:160000
  });
 const triangles=(indices?.length??source.count)/3,
  c=analyze52(test,indices,triangles,.00002,{
   maxComparisons:800000,maxCandidatePairs:100000,
   maxStrictCrossings:1024,refineTriangleDistances53:true,
   maxDistanceCandidates53:100000,
   refineSourceTopology54:false,refineEdgeWinding55:false
  }),quality=measureDisposableSourceSurfaceStrain61(
   originalWorld,test,indices);
 if(!b.complete||b.strict!==0||b.near!==0||
  !c.complete||c.strictCrossings!==0||
  !c.distance53.distanceRefinementComplete||
  !quality.provisionalMeshDistortionGuardPassed||
  !originalWorld.every((x,i)=>x===before[i]))
  fail('P86 corrected real neutral pose failed unchanged original source numerical guards');
 const clone=g.clone(),positions=clone.getAttribute('position'),
  inv=mesh.matrixWorld.clone().invert(),v=new THREE.Vector3(),
  identity=mesh.matrixWorld;
 if(!positions||positions.count!==source.count)
  fail('P86 cloned source photo topology differs');
 let maxPositionRoundtripMeters=0;
 for(let i=0;i<positions.count;i++){
  v.fromArray(test,3*i).applyMatrix4(inv);
  positions.setXYZ(i,v.x,v.y,v.z);
  v.fromBufferAttribute(positions,i).applyMatrix4(identity);
  const dx=v.x-test[3*i],dy=v.y-test[3*i+1],dz=v.z-test[3*i+2];
  maxPositionRoundtripMeters=Math.max(maxPositionRoundtripMeters,
   Math.hypot(dx,dy,dz));
 }
 if(maxPositionRoundtripMeters>2e-6){
  clone.dispose();
  fail('P86 preview transform roundtrip disagrees with C58 source world positions');
 }
 // Original photographic texture sampling is based on untouched dressRest.
 // Cloned normals are recomputed for the candidate's genuine front/back
 // drape; candidate never overwrites any SkinnedMesh source attribute.
 clone.computeVertexNormals();
 const rest=g.getAttribute('dressRest').array,
  cloneRest=clone.getAttribute('dressRest').array;
 if(cloneRest.length!==rest.length||
    !rest.every((x,i)=>x===cloneRest[i])){
  clone.dispose();fail('P86 candidate copied wrong original photo projection');
 }
 const overlay=new THREE.Mesh(clone,mesh.material);
 overlay.name='P86-authentic-Commons-0053-static-pose-photo-HOLD';
 overlay.position.copy(mesh.position);
 overlay.quaternion.copy(mesh.quaternion);
 overlay.scale.copy(mesh.scale);
 overlay.frustumCulled=false;overlay.visible=false;
 overlay.userData.p86ResearchOnly=true;
 parent.add(overlay);
 const sourceSnapshot=Object.entries(g.attributes).map(([name,attr])=>
  [name,attr,attr.array.slice()]);
 const sourceIndex=g.index?.array.slice()??null;
 let disposed=false,mode='original',materialRebindings86=0;
 // Actual signed native preview may rebind the source's rendered material
 // AFTER constructing the dress. Refuse imitation/fallback shaders; only
 // the genuinely photographic dressRest/uDressImage projection is allowed.
 const syncPhotoMaterial86=()=>{
  const current=mesh.material,sourceShader=current?.onBeforeCompile?.toString();
  if(!current?.isMeshStandardMaterial||
   !sourceShader?.includes('uDressImage')||
   !sourceShader?.includes('dressRest'))
   fail('P86 actual source viewer material is not the original photographic projection shader');
  if(overlay.material!==current){
   overlay.material=current;materialRebindings86++;
  }
 };
 const state=()=>{
  if(!disposed)syncPhotoMaterial86();
  return Object.freeze({
  schema:'M2-P86-real-photo-shader-world-candidate-static-render-A-B',
  mode:disposed?'disposed':mode,
  original163BoneSkinnedSource:true,
  exactLicensedSourceId:SOURCE_ID,
  candidateTriangles:triangles,
  originalSourceClothWitnessFaces:poseWitnesses.size,
  candidateGeometryRenderedAsStaticSourceWorldPose:true,
  originalPhotographicMaterialInstanceShared:overlay.material===mesh.material,
  finalSourcePhotoShaderUsesOriginalDressRestAndImage86:!disposed,
  sourceViewerMaterialRebindingsHandled86:materialRebindings86,
  originalPhotoRestAttributesCopiedNotChanged:true,
  updatedCloneNormalsOnly:true,
  maxPreviewWorldRoundtripMeters:maxPositionRoundtripMeters,
  originalDressVisible:disposed?null:mesh.visible,
  disposableCandidateVisible:disposed?false:overlay.visible,
  sourceMeshAttributesUnchanged:true,
  noPrivateSourceArraysOrPhotoBytesExposed:true,
  candidateContinuousMotionTested:false,
  ownerPhotorealismApproved:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
  });
 };
 const checkSource=()=>{
  if(!sourceSnapshot.every(([name,attr,bytes])=>
   g.getAttribute(name)===attr&&bytes.length===attr.array.length&&
    bytes.every((x,i)=>x===attr.array[i]))||
   (sourceIndex!==null&&
    (sourceIndex.length!==g.index?.array.length||
     !sourceIndex.every((x,i)=>x===g.index.array[i]))))
   fail('P86 original photographed source changed during visual trial');
 };
 let api=null;
 const dispose=()=>{
  if(disposed)return;
  disposed=true;overlay.visible=false;overlay.removeFromParent();
  clone.dispose();
  if(mesh.parent===parent)mesh.visible=originalVisible;
  globalThis.removeEventListener?.('closet:alpha-session-changed',dispose);
  globalThis.removeEventListener?.('pagehide',dispose);
  if(globalThis.__M2P85Preview86===api)
   delete globalThis.__M2P85Preview86;
  checkSource();
 };
 const setMode=next=>{
  if(disposed||mesh.parent!==parent||!['original','candidate'].includes(next))
   fail('P86 stale or invalid owner scene; candidate must not persist');
  checkSource();
  syncPhotoMaterial86();
  mesh.visible=next==='original'?originalVisible:false;
  overlay.visible=next==='candidate';
  mode=next;
  root.updateMatrixWorld(true);
  if(overlay.material!==mesh.material||overlay.parent!==parent)
   fail('P86 detached or reskinned original photo shader');
  return state();
 };
 api=Object.freeze({state,setMode,dispose});
 globalThis.__M2P85Preview86=api;
 globalThis.addEventListener?.('closet:alpha-session-changed',dispose);
 globalThis.addEventListener?.('pagehide',dispose);
 return state();
}
