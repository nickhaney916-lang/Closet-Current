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
 * P2-C55 read-only, original-photo half-edge incidence and winding audit.
 * Source coordinate coincidence DOES NOT identify a sewn fabric seam.
 * Distinct UV/index vertices are grouped for candidate topology ONLY
 * after a bounded three-axis spatial match; incompatible original rest,
 * skin, or 163-bone pose is always an unsafe candidate.
 *
 * Return aggregate counts exclusively. No XYZ, raw face IDs, photo
 * coordinates, per-owner identifiers, or repaired geometry escape.
 */
function originalSourceHalfEdges55(source,skinned,rest,skinIndex,skinWeight,indices,faces){
 const eps=SOURCE_TWIN_EPS54, vertexCount=source.length/3;
 const nodes=[],cells=new Map(),canonical=new Int32Array(vertexCount);
 let ambiguousSourceMatches=0,incompatibleSourceTwins=0;
 const cell=(x,y,z)=>x+','+y+','+z;
 const matchingSourceBinding=(a,b)=>{
  for(let k=0;k<3;k++){
   if(Math.abs(skinned[3*a+k]-skinned[3*b+k])>eps||
      Math.abs(rest.getComponent(a,k)-rest.getComponent(b,k))>eps)
    return false;
  }
  for(let k=0;k<4;k++){
   if(skinIndex.getComponent(a,k)!==skinIndex.getComponent(b,k)||
      Math.abs(skinWeight.getComponent(a,k)-
       skinWeight.getComponent(b,k))>1e-6)return false;
  }
  return true;
 };
 for(let i=0;i<vertexCount;i++){
  const x=source[3*i],y=source[3*i+1],z=source[3*i+2];
  if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z))
   fail('C55 nonfinite genuine source vertex');
  const bx=Math.floor(x/eps),by=Math.floor(y/eps),bz=Math.floor(z/eps);
  const matches=new Set();
  for(let dx=-1;dx<=1;dx++)
   for(let dy=-1;dy<=1;dy++)
    for(let dz=-1;dz<=1;dz++){
     const nearby=cells.get(cell(bx+dx,by+dy,bz+dz))||[];
     for(const id of nearby){
      const n=nodes[id],j=n.first;
      if(Math.hypot(x-source[3*j],y-source[3*j+1],
       z-source[3*j+2])<=eps)matches.add(id);
     }
    }
  let id;
  if(matches.size===1){
   id=[...matches][0];
   if(!matchingSourceBinding(nodes[id].first,i)){
    nodes[id].unsafe=true;incompatibleSourceTwins++;
   }
  }else{
   if(matches.size>1){
    ambiguousSourceMatches++;
    for(const j of matches)nodes[j].unsafe=true;
   }
   id=nodes.length;
   nodes.push({first:i,unsafe:matches.size>1});
   const key=cell(bx,by,bz);
   if(!cells.has(key))cells.set(key,[]);
   cells.get(key).push(id);
  }
  canonical[i]=id;
 }
 const edges=new Map();let collapsedFaceEdges=0;
 for(let f=0;f<faces;f++){
  const ids=[0,1,2].map(j=>indices?indices[3*f+j]:3*f+j);
  for(let e=0;e<3;e++){
   const a=canonical[ids[e]],b=canonical[ids[(e+1)%3]];
   if(a===b){collapsedFaceEdges++;continue;}
   const key=a<b?a+':'+b:b+':'+a;
   if(!edges.has(key))edges.set(key,[]);
   edges.get(key).push({
    a,b,ia:ids[e],ib:ids[(e+1)%3],face:f,
    unsafe:nodes[a].unsafe||nodes[b].unsafe
   });
  }
 }
 const count={
  boundarySourceEdges:0,pairedOppositeWindingEdges:0,
  pairedSameWindingEdges:0,pairedUnsafeRestSkinOrPoseEdges:0,
  nonmanifoldSourceEdges:0,
  indexedConnectedOppositeWindingEdges:0,
  splitIndexOppositeWindingEdgeCandidates:0
 };
 for(const records of edges.values()){
  if(records.length===1)count.boundarySourceEdges++;
  else if(records.length>2)count.nonmanifoldSourceEdges++;
  else{
   const [a,b]=records;
   if(a.unsafe||b.unsafe||a.face===b.face)
    count.pairedUnsafeRestSkinOrPoseEdges++;
   else if(a.a!==b.b||a.b!==b.a)
    count.pairedSameWindingEdges++;
   else{
    count.pairedOppositeWindingEdges++;
    if(a.ia===b.ib&&a.ib===b.ia)
     count.indexedConnectedOppositeWindingEdges++;
    else count.splitIndexOppositeWindingEdgeCandidates++;
   }
  }
 }
 const categorized=count.boundarySourceEdges+
  count.pairedOppositeWindingEdges+count.pairedSameWindingEdges+
  count.pairedUnsafeRestSkinOrPoseEdges+count.nonmanifoldSourceEdges;
 if(categorized!==edges.size||
    count.pairedOppositeWindingEdges!==
     count.indexedConnectedOppositeWindingEdges+
      count.splitIndexOppositeWindingEdgeCandidates)
  fail('C55 original source half-edge accounting mismatch');
 return Object.freeze({
  schema:'M2-original-licensed-source-half-edge-winding-C55',
  originalSourceFacesExamined:faces,
  originalSourceVerticesExamined:vertexCount,
  sourceCoordinateGroups:nodes.length,
  sourceHalfEdgesExamined:faces*3,
  distinctSourceCoordinateEdges:edges.size,
  ...count,collapsedFaceEdges,
  ambiguousSourceMatches,incompatibleSourceTwins,
  everyNoncollapsedHalfEdgeAccountedFor:
   faces*3-collapsedFaceEdges===
    [...edges.values()].reduce((n,e)=>n+e.length,0),
  aggregateOnlyNoRawCoordinatesOrFaceIndices:true,
  physicallySewnSeamsCertified:false,
  noAutomaticUVJoiningOrIndexWelding:true,
  poseContinuousCollisionSafetyCertified:false,
  originalPhotoAndGarmentMutated:false,
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
  list.push({ids,tri,minX:box.min.x,maxX:box.max.x,
   minY:box.min.y,maxY:box.max.y,minZ:box.min.z,maxZ:box.max.z});
 }
 list.sort((a,b)=>a.minX-b.minX);
 let boundsOverlaps=0,strictCrossings=0,compared=0,
  sharedIndexExcluded=0,firstStrict=false,firstUncertain=false;
 const distance53={distancePairsMeasured:0,
  geometricZeroOrOverlapUnresolved:0,
  positiveGapWithinToleranceUnresolved:0,
  positiveGapBeyondToleranceAtThisPose:0};
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
   topologyReceipt54(topology54,complete,sharedIndexExcluded):null};
}
export function auditActualPhotographedDressSurfaces52({
 root,dress,toleranceMeters=.00002,
 maxSourceFaces=100000,maxComparisons=800000,
 maxCandidatePairs=100000,maxStrictCrossings=64,
 refineTriangleDistances53=false,maxDistanceCandidates53=100000,
 refineSourceTopology54=false,maxZeroDistanceTopologyPairs54=100000,
 auditOriginalHalfEdges55=false
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
    typeof auditOriginalHalfEdges55!=='boolean'||
    (auditOriginalHalfEdges55&&!refineSourceTopology54))
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
  refineSourceTopology54,maxZeroDistanceTopologyPairs54};
 const context=refineSourceTopology54?{
  source,skinned,rest,skinIndex:si,skinWeight:sw
 }:null;
 const halfEdge55=auditOriginalHalfEdges55?
  originalSourceHalfEdges55(source,skinned,rest,si,sw,indices,triangles):null;
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
  ...(auditOriginalHalfEdges55?{
   originalSourceHalfEdge55:halfEdge55,
   actualSourceHalfEdgesCertifiedAsSewing55:false,
   noSourceStitchingOrCollisionWaiver55:true
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
