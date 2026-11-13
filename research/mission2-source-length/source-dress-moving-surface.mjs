/**
 * M2 P2-C40 — conservative continuous BROADPHASE for LINEARLY interpolated
 * cloth faces and 163-bone body faces between two genuinely captured poses.
 *
 * Each face is contained in the axis-aligned union of its six end-point
 * vertices throughout linear vertex interpolation. If the two swept boxes
 * do not overlap, those faces cannot intersect in that interpolation.
 * An overlap is an UNRESOLVED POTENTIAL crossing and vetoes research motion.
 *
 * Not a solver or continuous collision certificate for nonlinear skinning,
 * actual intermediate bone rotations, contact depth, layer/self contact,
 * initial containment, photos, rear texture, or wearable realism. No owner
 * data / photos / world vertices are ever emitted from the public receipt.
 */
import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const captures=new WeakMap();
const fail=m=>{throw Error('M2 C40 source surface sweep '+m);};
const finite=a=>a.every(Number.isFinite);
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
function faces(mesh){
 const p=mesh.geometry?.getAttribute('position');
 if(!p?.isBufferAttribute||p.itemSize!==3||!p.count)fail('original triangular source positions required');
 const index=mesh.geometry.index?.array??null;
 const count=index?index.length:p.count;
 if(count%3||count<3)fail('complete triangle topology required');
 const indices=index?Uint32Array.from(index):null;
 if(indices&&!indices.every(i=>i<p.count))fail('source face index outside original vertices');
 return {p,indices,faceCount:count/3,geometry:mesh.geometry,
  indexField:mesh.geometry.index??null};
}
function positionCopy(source){return source.array.slice();}
function immutableSkinnedFields(mesh){
 const values=new Map();
 for(const [name,field] of Object.entries(mesh.geometry.attributes)){
  if(!field?.isBufferAttribute||field.isInterleavedBufferAttribute||
     !finite(field.array))fail('invalid source photo / skin buffer');
  values.set(name,{field,values:field.array.slice()});
 }
 return {values,material:mesh.material,
  bones:mesh.skeleton.bones.slice(),skeleton:mesh.skeleton};
}
function checkImmutableSkinnedFields(mesh,expected){
 if(mesh.material!==expected.material||mesh.skeleton!==expected.skeleton||
    mesh.skeleton.bones.length!==expected.bones.length||
    mesh.skeleton.bones.some((bone,i)=>bone!==expected.bones[i]))
  fail('signed original anatomy or garment material replaced');
 const attrs=mesh.geometry.attributes;
 if(Object.keys(attrs).length!==expected.values.size)
  fail('original source/photo/skin attribute schema changed');
 for(const [name,previous] of expected.values){
  const current=attrs[name];
  if(current!==previous.field||!same(current.array,previous.values))
   fail('original source/photo/skin data changed after snapshot: '+name);
 }
}
function sourcePose(mesh,positions){
 mesh.updateWorldMatrix(true,false);
 mesh.skeleton.update();
 const v=new THREE.Vector3(),out=new Float32Array(positions.length);
 for(let i=0;i<positions.length/3;i++){
  v.fromArray(positions,i*3);
  mesh.applyBoneTransform(i,v);
  v.applyMatrix4(mesh.matrixWorld);
  if(!finite(v.toArray()))fail('nonfinite posed source vertex');
  v.toArray(out,i*3);
 }
 return out;
}
function validateRootDress(root,dress){
 const mesh=dress?.mesh,position=mesh?.geometry?.getAttribute('position');
 if(!root?.isObject3D||!mesh?.isSkinnedMesh||
    mesh.skeleton?.bones?.length!==163||
    dress.stats?.sourceId!=='commons-0053'||
    dress.stats?.sourceSHA256!==SHA||
    dress.stats?.photographedDressDrape61!==true||
    dress.stats?.originalRestPhotoCoordinatesUnchanged61!==true||
    dress.stats?.sourceTextureAndMaterialPreserved61!==true||
    dress.stats?.skinIndicesAndWeightsPreserved61!==true||
    dress.stats?.collisionValidated!==false||
    dress.stats?.releaseAuthorized!==false||!position?.isBufferAttribute)
  fail('original unapproved SHA-pinned 163-bone photographed garment required');
 return mesh;
}
/**
 * Internal opaque capture: posed body AND cloth at the SAME instant. Caller
 * stores token only, not private arrays; immutable copies stay in WeakMap.
 * A second capture can use staged source cloth XYZ, without committing it.
 */
export function captureSourceDressBodyPose40({root,dress,stagedPositions=null,
 maxBodyMeshes=16,maxBodyVertices=300000,maxClothVertices=80000}={}){
 const mesh=validateRootDress(root,dress),geo=faces(mesh);
 if(!Number.isInteger(maxBodyMeshes)||maxBodyMeshes<1||maxBodyMeshes>128||
   !Number.isInteger(maxBodyVertices)||maxBodyVertices<3||maxBodyVertices>1000000||
   !Number.isInteger(maxClothVertices)||maxClothVertices<3||maxClothVertices>300000||
   geo.p.count>maxClothVertices)fail('bounded capture budgets required');
 const source=positionCopy(geo.p);
 if(!finite(source))fail('nonfinite original garment');
 if(stagedPositions!==null&&
    (!(stagedPositions instanceof Float32Array||stagedPositions instanceof Float64Array)||
      stagedPositions.length!==source.length||!finite(stagedPositions)))
  fail('finite complete staged source XYZ required');
 const clothSource=stagedPositions?.slice()??source.slice();
 root.updateMatrixWorld(true);
 const clothWorld=sourcePose(mesh,clothSource);
 const bodies=[];
 root.traverse(o=>{
  if(o!==mesh&&o.isSkinnedMesh&&!o.userData?.work56Garment&&
     o.skeleton?.bones?.length===163)bodies.push(o);
 });
 if(bodies.length<1||bodies.length>maxBodyMeshes)
  fail('bounded original 163-bone body meshes required');
 let sum=0;
 const capturesBody=[];
 for(const body of bodies){
  const b=faces(body);
  sum+=b.p.count;
  if(sum>maxBodyVertices)fail('body vertex capture budget exceeded');
  const sourceBody=positionCopy(b.p);
  if(!finite(sourceBody))fail('nonfinite original body mesh');
  capturesBody.push({mesh:body,...b,sourceBody,
    immutable:immutableSkinnedFields(body),
    world:sourcePose(body,sourceBody)});
 }
 const token=Object.freeze({});
 captures.set(token,{root,mesh,geo,source,clothSource,clothWorld,
  garmentImmutable:immutableSkinnedFields(mesh),
  bodies:capturesBody,clothIndex:geo.indices?.slice()??null});
 return token;
}
const checkTopology=(record)=>{
 const {mesh,geo,source,bodies}=record;
 checkImmutableSkinnedFields(mesh,record.garmentImmutable);
 const p=mesh.geometry?.getAttribute('position');
 if(mesh.geometry!==geo.geometry||p!==geo.p||
    !same(p.array,source)||mesh.geometry.index!==geo.indexField||
    (geo.indices&&!same(mesh.geometry.index.array,geo.indices))||
    (!geo.indices&&mesh.geometry.index))
  fail('stale or altered original photographed source surface');
 for(const b of bodies){
  checkImmutableSkinnedFields(b.mesh,b.immutable);
  const bp=b.mesh.geometry?.getAttribute('position');
  if(b.mesh.geometry!==b.geometry||bp!==b.p||
     !same(bp.array,b.sourceBody)||b.mesh.geometry.index!==b.indexField||
     (b.indices&&!same(b.mesh.geometry.index.array,b.indices))||
     (!b.indices&&b.mesh.geometry.index))
   fail('body source topology or photograph changed after capture');
 }
};
const at=(indices,face,corner)=>indices?indices[3*face+corner]:3*face+corner;
function addFaceBox(box,world,indices,face){
 for(let corner=0;corner<3;corner++){
  const p=3*at(indices,face,corner);
  box.expandByPoint(new THREE.Vector3(world[p],world[p+1],world[p+2]));
 }
}
const nearOverlap=(a,b,pad)=>(
 a.min.x<=b.max.x+pad&&a.max.x+pad>=b.min.x&&
 a.min.y<=b.max.y+pad&&a.max.y+pad>=b.min.y&&
 a.min.z<=b.max.z+pad&&a.max.z+pad>=b.min.z
);
/**
 * Audits every cloth triangle against the swept AABB of every reachable
 * original body triangle. The BVH is built on starting posed body triangles;
 * its branches expand by the maximum observed BODY vertex shift, which is a
 * conservative bound on all linearly interpolated body face trajectories.
 */
export function auditMovingSourceDressBodySurfaces40({
 root,dress,startPose,endPose,
 maxClothFaces=100000,maxBodyFaces=500000,
 maxTriangleCandidates=400000,maxPotentialPairs=20000,
 maxClothShiftMeters=.025,maxBodyShiftMeters=.15,
 paddingMeters=.00002
}={}){
 const mesh=validateRootDress(root,dress);
 const start=captures.get(startPose),end=captures.get(endPose);
 if(!start||!end||start.root!==root||end.root!==root||
   start.mesh!==mesh||end.mesh!==mesh||
   start.bodies.length!==end.bodies.length||
   ![maxClothFaces,maxBodyFaces,maxTriangleCandidates,maxPotentialPairs]
    .every(v=>Number.isSafeInteger(v)&&v>0&&v<=1000000)||
   ![maxClothShiftMeters,maxBodyShiftMeters,paddingMeters].every(Number.isFinite)||
   maxClothShiftMeters<=0||maxClothShiftMeters>.1||
   maxBodyShiftMeters<=0||maxBodyShiftMeters>1||
   paddingMeters<0||paddingMeters>.002)
  fail('matching original poses and bounded swept-fabric parameters required');
 checkTopology(start);
 checkTopology(end);
 // A late-added body or removed/reclassified original body is not part of
 // either capture and therefore MUST invalidate any 'full body faces' claim.
 const currentBodies=[];
 root.traverse(o=>{
  if(o!==mesh&&o.isSkinnedMesh&&!o.userData?.work56Garment&&
     o.skeleton?.bones?.length===163)currentBodies.push(o);
 });
 if(currentBodies.length!==start.bodies.length||
    currentBodies.some((body,i)=>body!==start.bodies[i].mesh))
  fail('body scene roster changed after bounded pose capture');
 if(!same(start.source,end.source)||
    !same(start.source,mesh.geometry.getAttribute('position').array)||
    !same(start.clothSource,start.source)||
    start.geo.faceCount!==end.geo.faceCount||
    !same(start.clothIndex??[],end.clothIndex??[]))
  fail('photographic source or original triangle IDs changed across poses');
 if(start.geo.faceCount>maxClothFaces)
  fail('cloth source triangle budget exceeded');
 let movedClothVertices=0,maximumClothShift=0;
 for(let j=0;j<start.clothWorld.length;j+=3){
  const d=Math.hypot(start.clothWorld[j]-end.clothWorld[j],
   start.clothWorld[j+1]-end.clothWorld[j+1],
   start.clothWorld[j+2]-end.clothWorld[j+2]);
  if(!Number.isFinite(d)||d>maxClothShiftMeters+1e-7)
   fail('source cloth inter-pose displacement budget exceeded');
  maximumClothShift=Math.max(d,maximumClothShift);
  if(d>1e-8)movedClothVertices++;
 }
 const scenes=[];
 let bodyFaces=0,maximumBodyShift=0,candidateTriangles=0,
  potentialPairs=0,checkedClothFaces=0;
 try{
  for(let i=0;i<start.bodies.length;i++){
   const b=start.bodies[i],e=end.bodies[i];
   if(b.mesh!==e.mesh||b.geometry!==e.geometry||
      b.faceCount!==e.faceCount||
      !same(b.indices??[],e.indices??[]))
    fail('moving body changed mesh order or source topology');
   bodyFaces+=b.faceCount;
   if(bodyFaces>maxBodyFaces)fail('body source triangle budget exceeded');
   let shift=0;
   for(let j=0;j<b.world.length;j+=3){
    const d=Math.hypot(b.world[j]-e.world[j],b.world[j+1]-e.world[j+1],
     b.world[j+2]-e.world[j+2]);
    if(!Number.isFinite(d)||d>maxBodyShiftMeters+1e-7)
     fail('moving body pose exceeds capped linear path');
    shift=Math.max(shift,d);
   }
   maximumBodyShift=Math.max(maximumBodyShift,shift);
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.BufferAttribute(b.world.slice(),3));
   if(b.indices)geometry.setIndex(new THREE.BufferAttribute(b.indices.slice(),1));
   try{
    scenes.push({b,e,geometry,tree:new MeshBVH(geometry,{indirect:true}),shift});
   }catch(error){geometry.dispose();throw error;}
  }
  for(let face=0;face<start.geo.faceCount;face++){
   checkedClothFaces++;
   const clothBox=new THREE.Box3().makeEmpty();
   addFaceBox(clothBox,start.clothWorld,start.geo.indices,face);
   addFaceBox(clothBox,end.clothWorld,end.geo.indices,face);
   for(const scene of scenes){
    let overflow=false;
    scene.tree.shapecast({
     intersectsBounds:box=>(
      clothBox.min.x<=box.max.x+scene.shift+paddingMeters&&
      clothBox.max.x+scene.shift+paddingMeters>=box.min.x&&
      clothBox.min.y<=box.max.y+scene.shift+paddingMeters&&
      clothBox.max.y+scene.shift+paddingMeters>=box.min.y&&
      clothBox.min.z<=box.max.z+scene.shift+paddingMeters&&
      clothBox.max.z+scene.shift+paddingMeters>=box.min.z
     ),
     intersectsTriangle:(_triangle,id)=>{
      candidateTriangles++;
      if(candidateTriangles>maxTriangleCandidates){overflow=true;return true;}
      const originalFace=scene.tree.resolveTriangleIndex(id);
      const bodyBox=new THREE.Box3().makeEmpty();
      addFaceBox(bodyBox,scene.b.world,scene.b.indices,originalFace);
      addFaceBox(bodyBox,scene.e.world,scene.e.indices,originalFace);
      if(!nearOverlap(clothBox,bodyBox,paddingMeters))return false;
      potentialPairs++;
      if(potentialPairs>=maxPotentialPairs){overflow=true;return true;}
      return false;
     }
    });
    // Never throw inside the BVH callback; v0.9.2 traversal guards must reset.
    if(overflow)fail('swept face/body candidate budget reached, cannot approve');
   }
  }
  return Object.freeze({
   schema:'M2-source-dress-moving-face-body-v1',
   completeConservativeLinearBroadphase:true,
   genuine163BonePosePair:true,originalPhotoSourceUnmodified:true,
   bodyMeshCount:scenes.length,bodyFaces,
   checkedClothFaces,movedClothVertices,candidateTriangles,potentialPairs,
   maximumClothShiftMeters:maximumClothShift,
   maximumBodyShiftMeters:maximumBodyShift,
   bodyPoseMotionObserved:maximumBodyShift>1e-8,
   wholeGarmentFacesExamined:true,fullBodyFacesExamined:true,
   unsweptCameraOrRearAssumed:false,
   linearVertexTrajectoriesOnly:true,
   exactContinuousNarrowphasePerformed:false,
   nonlinearBoneMotionCertified:false,selfLayerCollisionCertified:false,
   continuousCollisionCertified:false,realClothPhysics:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }finally{for(const scene of scenes)scene.geometry.dispose();}
}
/** A swept broadphase overlap is UNKNOWN, not proven penetration; veto it. */
export function assertMovingSourceDressBodySurfaces40(receipt){
 if(receipt?.schema!=='M2-source-dress-moving-face-body-v1'||
    receipt.completeConservativeLinearBroadphase!==true||
    receipt.genuine163BonePosePair!==true||
    receipt.wholeGarmentFacesExamined!==true||
    receipt.fullBodyFacesExamined!==true||
    !Number.isSafeInteger(receipt.bodyFaces)||receipt.bodyFaces<1||
    !Number.isSafeInteger(receipt.checkedClothFaces)||receipt.checkedClothFaces<1||
    !Number.isSafeInteger(receipt.potentialPairs)||receipt.potentialPairs<0||
    receipt.continuousCollisionCertified!==false||
    receipt.exactContinuousNarrowphasePerformed!==false||
    receipt.releaseAuthorized!==false||receipt.familyAlpha!=='HOLD')
  fail('missing or fabricated whole-surface broadphase evidence');
 if(receipt.potentialPairs>0)
  fail('unresolved potential fabric-face / moving-body overlap; reject research motion');
 return Object.freeze({researchOnly:true,linearBroadphaseClear:true,
  noCompleteClothCertification:true,releaseAuthorized:false,familyAlpha:'HOLD'});
}


/**
 * M2 P2-C41: conservative INTERVAL-SAT narrowphase refinement.
 *
 * For each candidate cloth/body face, a separation axis whose projected
 * vertex envelopes are disjoint on an entire temporal interval proves that
 * pair does not collide under LINEAR interpolation of *captured posed vertex
 * coordinates*. Adaptively subdivide [0,1] until every subinterval is proved
 * separate, or reject an unresolved interval. No interpolation of nonlinear
 * skeletal rotation and no claim of exact time-of-impact.
 *
 * All source geometry/captured posed vertices remain in the private WeakMap.
 * The returned privacy-safe receipt contains counts only.
 */
const axisAt=(v0,v1,t)=>new THREE.Vector3(
 v0[0]+(v1[0]-v0[0])*t,
 v0[1]+(v1[1]-v0[1])*t,
 v0[2]+(v1[2]-v0[2])*t
);
function triangleVertices(world,indices,face){
 const result=[];
 for(let c=0;c<3;c++){
  const j=3*at(indices,face,c);
  result.push([world[j],world[j+1],world[j+2]]);
 }
 return result;
}
function separatingAxisInterval41(a0,a1,b0,b1,lo,hi,padding){
 const mid=(lo+hi)*.5;
 const pa=a0.map((v,i)=>axisAt(v,a1[i],mid));
 const pb=b0.map((v,i)=>axisAt(v,b1[i],mid));
 const edge=(p,i)=>new THREE.Vector3().subVectors(p[(i+1)%3],p[i]);
 const ea=[0,1,2].map(i=>edge(pa,i));
 const eb=[0,1,2].map(i=>edge(pb,i));
 const na=new THREE.Vector3().crossVectors(ea[0],ea[1]);
 const nb=new THREE.Vector3().crossVectors(eb[0],eb[1]);
 const axes=[
  new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),
  new THREE.Vector3(0,0,1),na,nb
 ];
 for(const a of ea)for(const b of eb)
  axes.push(new THREE.Vector3().crossVectors(a,b));
 // In-plane normals for COPLANAR separated triangles; conventional
 // 3D edge-cross-edge axes alone cannot resolve disjoint coplanar faces.
 for(const a of ea)axes.push(new THREE.Vector3().crossVectors(a,na));
 for(const b of eb)axes.push(new THREE.Vector3().crossVectors(b,nb));
 const envelope=(start,end,axis)=>{
  let min=Infinity,max=-Infinity;
  for(let k=0;k<3;k++){
   const x=start[k],y=end[k];
   const startProjection=x[0]*axis.x+x[1]*axis.y+x[2]*axis.z;
   const deltaProjection=(y[0]-x[0])*axis.x+
    (y[1]-x[1])*axis.y+(y[2]-x[2])*axis.z;
   for(const t of [lo,hi]){
    const p=startProjection+t*deltaProjection;
    min=Math.min(min,p);max=Math.max(max,p);
   }
  }
  return {min,max};
 };
 for(const axis of axes){
  const norm=axis.length();
  if(!Number.isFinite(norm)||norm<1e-12)continue;
  axis.multiplyScalar(1/norm);
  const a=envelope(a0,a1,axis),b=envelope(b0,b1,axis);
  if(a.max+padding<b.min||b.max+padding<a.min)return true;
 }
 return false; // unresolved, NOT evidence of penetration
}
/**
 * Independent from the source photo and human data: exact source-face
 * positions are supplied by the authenticated opaque capture tokens.
 */
function separateLinearTriangleInterval41(a0,a1,b0,b1,{maxDepth,padding,remainingNodes}){
 let nodes=0;
 const queue=[{lo:0,hi:1,depth:0}];
 while(queue.length){
  if(++nodes>remainingNodes)return {status:'budget',nodes};
  const {lo,hi,depth}=queue.pop();
  if(separatingAxisInterval41(a0,a1,b0,b1,lo,hi,padding))continue;
  if(depth>=maxDepth)return {status:'unresolved',nodes};
  const mid=(lo+hi)*.5;
  queue.push({lo:mid,hi,depth:depth+1});
  queue.push({lo,hi:mid,depth:depth+1});
 }
 return {status:'separated',nodes};
}
/**
 * Source-verified conservative continuous *linearized* narrowphase.
 * P2-C40's complete broadphase runs first as provenance and physical
 * displacement gate. EVERY broadphase candidate must be separately proved
 * harmless by temporal projection envelopes, or remain a veto.
 *
 * No source mesh is committed. Computation budget exhaustion always throws.
 */
export function auditMovingSourceDressBodyIntervals41({
 root,dress,startPose,endPose,maxDepth=10,maxTemporalNodes=80000,
 maxBroadphaseCandidates=400000,maxBroadphasePairs=20000,
 maxClothShiftMeters=.025,maxBodyShiftMeters=.15,
 paddingMeters=.00002
}={}){
 if(!Number.isInteger(maxDepth)||maxDepth<0||maxDepth>15||
    !Number.isSafeInteger(maxTemporalNodes)||maxTemporalNodes<1||
    maxTemporalNodes>500000||
    !Number.isSafeInteger(maxBroadphaseCandidates)||
    maxBroadphaseCandidates<1||maxBroadphaseCandidates>1000000||
    !Number.isSafeInteger(maxBroadphasePairs)||
    maxBroadphasePairs<1||maxBroadphasePairs>50000)
  fail('C41 bounded temporal interval, candidate and depth limits required');
 // P2-C40 verifies original garment identity, body roster, source/photo/skin
 // buffers, original triangle IDs, completeness, physical-motion cap, etc.
 const baseline=auditMovingSourceDressBodySurfaces40({
  root,dress,startPose,endPose,
  maxTriangleCandidates:maxBroadphaseCandidates,
  maxPotentialPairs:maxBroadphasePairs,
  maxClothShiftMeters,maxBodyShiftMeters,paddingMeters
 });
 const start=captures.get(startPose),end=captures.get(endPose);
 let temporalNodes=0,provenSeparatedPairs=0,unresolvedPairs=0,
  repeatedCandidatePairs=0;
 const scenes=[];
 try{
  if(baseline.potentialPairs){
   for(let i=0;i<start.bodies.length;i++){
    const body=start.bodies[i],future=end.bodies[i];
    let maxShift=0;
    for(let k=0;k<body.world.length;k+=3)
     maxShift=Math.max(maxShift,Math.hypot(
      body.world[k]-future.world[k],
      body.world[k+1]-future.world[k+1],
      body.world[k+2]-future.world[k+2]));
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(body.world.slice(),3));
    if(body.indices)g.setIndex(new THREE.BufferAttribute(body.indices.slice(),1));
    try{scenes.push({body,future,g,
      tree:new MeshBVH(g,{indirect:true}),shift:maxShift});
    }catch(error){g.dispose();throw error;}
   }
   for(let face=0;face<start.geo.faceCount;face++){
    const box=new THREE.Box3().makeEmpty();
    addFaceBox(box,start.clothWorld,start.geo.indices,face);
    addFaceBox(box,end.clothWorld,end.geo.indices,face);
    const a0=triangleVertices(start.clothWorld,start.geo.indices,face);
    const a1=triangleVertices(end.clothWorld,end.geo.indices,face);
    for(const scene of scenes){
     let overflow=false;
     scene.tree.shapecast({
      intersectsBounds:bounds=>(
       box.min.x<=bounds.max.x+scene.shift+paddingMeters&&
       box.max.x+scene.shift+paddingMeters>=bounds.min.x&&
       box.min.y<=bounds.max.y+scene.shift+paddingMeters&&
       box.max.y+scene.shift+paddingMeters>=bounds.min.y&&
       box.min.z<=bounds.max.z+scene.shift+paddingMeters&&
       box.max.z+scene.shift+paddingMeters>=bounds.min.z
      ),
      intersectsTriangle:(_tri,id)=>{
       repeatedCandidatePairs++;
       if(repeatedCandidatePairs>maxBroadphaseCandidates){overflow=true;return true;}
       const originalFace=scene.tree.resolveTriangleIndex(id);
       const other=new THREE.Box3().makeEmpty();
       addFaceBox(other,scene.body.world,scene.body.indices,originalFace);
       addFaceBox(other,scene.future.world,scene.future.indices,originalFace);
       if(!nearOverlap(box,other,paddingMeters))return false;
       const b0=triangleVertices(scene.body.world,scene.body.indices,originalFace);
       const b1=triangleVertices(scene.future.world,scene.future.indices,originalFace);
       const checked=separateLinearTriangleInterval41(a0,a1,b0,b1,{
        maxDepth,padding:paddingMeters,
        remainingNodes:maxTemporalNodes-temporalNodes
       });
       temporalNodes+=checked.nodes;
       if(checked.status==='budget'){overflow=true;return true;}
       if(checked.status==='separated')provenSeparatedPairs++;
       else unresolvedPairs++;
       return false;
      }
     });
     // mesh-bvh v0.9.2 callback unwinding must finish before an exception.
     if(overflow)fail('C41 bounded source interval/candidate budget exhausted');
    }
   }
  }
  if(provenSeparatedPairs+unresolvedPairs!==baseline.potentialPairs)
   fail('C41 source-face candidate accounting disagrees with full C40 broadphase');
  return Object.freeze({
   schema:'M2-source-dress-linear-triangle-intervals-v1',
   completeBoundedTemporalIntervalAudit:true,
   originalSourceAndBodyProvenanceVerified:true,
   allBroadphasePairsExamined:true,
   bodyMeshCount:baseline.bodyMeshCount,
   bodyFaces:baseline.bodyFaces,clothFaces:baseline.checkedClothFaces,
   movingBodyObserved:baseline.bodyPoseMotionObserved,
   broadphasePotentialPairs:baseline.potentialPairs,
   provenSeparatedPairs,unresolvedPairs,temporalNodes,
   maximumClothShiftMeters:baseline.maximumClothShiftMeters,
   maximumBodyShiftMeters:baseline.maximumBodyShiftMeters,
   maxTemporalDepth:maxDepth,
   linearVertexTrajectoriesOnly:true,
   exactContinuousTimeOfImpactMeasured:false,
   nonlinearBoneMotionCertified:false,selfLayerCollisionCertified:false,
   continuousCollisionCertified:false,realClothPhysics:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }finally{for(const scene of scenes)scene.g.dispose();}
}
/** Only a COMPLETE, disjoint linear temporal interval proof passes the C41 veto. */
export function assertMovingSourceDressBodyIntervals41(receipt){
 if(receipt?.schema!=='M2-source-dress-linear-triangle-intervals-v1'||
    receipt.completeBoundedTemporalIntervalAudit!==true||
    receipt.originalSourceAndBodyProvenanceVerified!==true||
    receipt.allBroadphasePairsExamined!==true||
    !Number.isSafeInteger(receipt.bodyFaces)||receipt.bodyFaces<1||
    !Number.isSafeInteger(receipt.clothFaces)||receipt.clothFaces<1||
    !Number.isSafeInteger(receipt.provenSeparatedPairs)||
    !Number.isSafeInteger(receipt.unresolvedPairs)||
    !Number.isSafeInteger(receipt.broadphasePotentialPairs)||
    receipt.unresolvedPairs<0||receipt.provenSeparatedPairs<0||
    receipt.broadphasePotentialPairs!==
     receipt.provenSeparatedPairs+receipt.unresolvedPairs||
    receipt.exactContinuousTimeOfImpactMeasured!==false||
    receipt.nonlinearBoneMotionCertified!==false||
    receipt.continuousCollisionCertified!==false||
    receipt.releaseAuthorized!==false||receipt.familyAlpha!=='HOLD')
  fail('C41 fabricated, partial or unsupported interval clearance receipt');
 if(receipt.unresolvedPairs)
  fail('C41 unresolved moving cloth/body temporal surface overlap refused');
 return Object.freeze({researchOnly:true,linearTimeIntervalsSeparated:true,
  actualSkinnedAnimationCertified:false,fullClothPhysicsCertified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'});
}
