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
import {MeshBVH,ExtendedTriangle} from 'three-mesh-bvh';
import {registerSourceDressTemporalReceipt46,
 isAuthenticSourceDressTemporalReceipt46} from './source-dress-receipt-lock.mjs';
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const captures=new WeakMap();
// Keep source face IDs and staged XYZ private: no public repair geometry / photo.
const firstContactPairs50=new WeakMap(), stagedProposals50=new WeakMap();
// Actual C46 audit results are private, one-shot motion leases, not user-supplied flags.
// Receipts live in the dependency-free source-dress-receipt-lock.mjs.
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
 poseFraction=null,maxBodyMeshes=16,maxBodyVertices=300000,maxClothVertices=80000}={}){
 if(poseFraction!==null&&(!Number.isFinite(poseFraction)||
    poseFraction<0||poseFraction>1))
  fail('C42 finite capture phase in [0,1] required');
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
 const rotation=new THREE.Quaternion();
 for(const body of bodies){
  const b=faces(body);
  sum+=b.p.count;
  if(sum>maxBodyVertices)fail('body vertex capture budget exceeded');
  const sourceBody=positionCopy(b.p);
  if(!finite(sourceBody))fail('nonfinite original body mesh');
  const boneRotations=[];
  for(const bone of body.skeleton.bones){
   bone.getWorldQuaternion(rotation);
   const q=[rotation.x,rotation.y,rotation.z,rotation.w];
   if(!finite(q))fail('C42 nonfinite original 163-bone rotation');
   boneRotations.push(q);
  }
  capturesBody.push({mesh:body,...b,sourceBody,
    immutable:immutableSkinnedFields(body),
    world:sourcePose(body,sourceBody),boneRotations});
 }
 const token=Object.freeze({});
 captures.set(token,{root,mesh,geo,source,clothSource,clothWorld,poseFraction,
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

/**
 * M2 P2-C42 — independently captured real bone poses at bounded phase steps.
 * Audit every successive pair using the complete original-photo C41 temporal
 * separating-axis gate, rather than trusting a straight endpoint chord.
 *
 * A hidden intermediate rotation can create a collision with two IDENTICAL
 * endpoint poses. This check catches observed samples, but cannot certify
 * unsampled nonlinear joint motion, high-frequency animations or cloth physics.
 * No posed vertices, owner IDs or bone quaternions leave the private WeakMap.
 */
export function auditSourceDressArticulatedPoseSamples42({
 root,dress,poseTokens,startPositions,endPositions,
 maxPoseSamples=17,maxTimeGap=.25,
 maxDepth=10,maxTemporalNodesPerInterval=80000,
 maxClothShiftMeters=.1,maxBodyShiftMeters=.25
}={}){
 validateRootDress(root,dress);
 if(!Array.isArray(poseTokens)||poseTokens.length<5||
    new Set(poseTokens).size!==poseTokens.length||
    !Number.isSafeInteger(maxPoseSamples)||maxPoseSamples<5||
    maxPoseSamples>33||poseTokens.length>maxPoseSamples||
    !Number.isFinite(maxTimeGap)||maxTimeGap<=0||maxTimeGap>.25||
    !Number.isSafeInteger(maxDepth)||maxDepth<0||maxDepth>15||
    !Number.isSafeInteger(maxTemporalNodesPerInterval)||
    maxTemporalNodesPerInterval<1||maxTemporalNodesPerInterval>500000||
    !Number.isFinite(maxClothShiftMeters)||maxClothShiftMeters<=0||
    maxClothShiftMeters>.1||
    !Number.isFinite(maxBodyShiftMeters)||maxBodyShiftMeters<=0||
    maxBodyShiftMeters>.25||
    !(startPositions instanceof Float32Array||
      startPositions instanceof Float64Array)||
    !(endPositions instanceof Float32Array||
      endPositions instanceof Float64Array)||
    !finite(startPositions)||!finite(endPositions))
  fail('C42 bounded original independent articulated pose sequence required');
 const first=captures.get(poseTokens[0]),last=captures.get(poseTokens.at(-1));
 if(!first||!last||first.poseFraction!==0||last.poseFraction!==1||
    !same(first.clothSource,startPositions)||!same(last.clothSource,endPositions))
  fail('C42 original authenticated garment source phase endpoints required');
 let rotatedBodyJointIntervals=0,rotatedBodyJoints=0,
  sampledIntervals=0,potentialPairs=0,provenSeparatedPairs=0,
  unresolvedPairs=0,temporalNodes=0,maximumObservedGap=0;
 for(let i=0;i<poseTokens.length-1;i++){
  const a=captures.get(poseTokens[i]),b=captures.get(poseTokens[i+1]);
  if(!a||!b||a.root!==root||b.root!==root||
     !Number.isFinite(a.poseFraction)||!Number.isFinite(b.poseFraction)||
     b.poseFraction<=a.poseFraction)
   fail('C42 missing, unordered or mismatched anatomical pose samples');
  const gap=b.poseFraction-a.poseFraction;
  if(gap>maxTimeGap+1e-10)
   fail('C42 unsampled intermediate bone rotation time gap');
  maximumObservedGap=Math.max(maximumObservedGap,gap);
  if(a.bodies.length!==b.bodies.length)
   fail('C42 original anatomical body roster changed');
  let joints=0;
  for(let k=0;k<a.bodies.length;k++){
   if(a.bodies[k].mesh!==b.bodies[k].mesh||
      a.bodies[k].boneRotations.length!==b.bodies[k].boneRotations.length)
    fail('C42 original skeleton identities changed');
   for(let j=0;j<a.bodies[k].boneRotations.length;j++){
    const q=a.bodies[k].boneRotations[j],
     r=b.bodies[k].boneRotations[j];
    const dot=Math.abs(q[0]*r[0]+q[1]*r[1]+q[2]*r[2]+q[3]*r[3]);
    if(!Number.isFinite(dot)||dot>1.00001)
     fail('C42 genuine sampled body quaternion invalid');
    if(dot<.999999)joints++;
   }
  }
  if(joints){rotatedBodyJointIntervals++;rotatedBodyJoints+=joints;}
  const result=auditMovingSourceDressBodyIntervals41({
   root,dress,startPose:poseTokens[i],endPose:poseTokens[i+1],
   maxDepth,maxTemporalNodes:maxTemporalNodesPerInterval,
   maxClothShiftMeters,maxBodyShiftMeters
  });
  sampledIntervals++;
  potentialPairs+=result.broadphasePotentialPairs;
  provenSeparatedPairs+=result.provenSeparatedPairs;
  unresolvedPairs+=result.unresolvedPairs;
  temporalNodes+=result.temporalNodes;
 }
 if(!rotatedBodyJointIntervals||!rotatedBodyJoints||
    !Number.isFinite(potentialPairs)||sampledIntervals!==poseTokens.length-1)
  fail('C42 real articulated body rotation not evidenced');
 return Object.freeze({
  schema:'M2-source-dress-articulated-pose-samples-v1',
  genuineIntermediateBodyRotationsObserved:true,
  fullProvidedPoseSequenceChecked:true,
  matchedOriginalPhotoSourceStartEnd:true,
  poseSamples:poseTokens.length,sampledIntervals,
  maximumObservedPoseFractionGap:maximumObservedGap,
  rotatedBodyJointIntervals,rotatedBodyJoints,
  broadphasePotentialPairs:potentialPairs,
  provenSeparatedPairs,unresolvedPairs,temporalNodes,
  allSampledPairsAccounted:potentialPairs===provenSeparatedPairs+unresolvedPairs,
  originalPhotoAndSkinUnchanged:true,
  actualIntermediateBodyPosePositionsSampled:true,
  actualNonlinearMotionBetweenSamplesCertified:false,
  collisionFreeContinuousRotationCertified:false,
  realClothPhysics:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
export function assertSourceDressArticulatedPoseSamples42(receipt){
 if(receipt?.schema!=='M2-source-dress-articulated-pose-samples-v1'||
    receipt.fullProvidedPoseSequenceChecked!==true||
    receipt.genuineIntermediateBodyRotationsObserved!==true||
    receipt.matchedOriginalPhotoSourceStartEnd!==true||
    receipt.allSampledPairsAccounted!==true||
    !Number.isSafeInteger(receipt.poseSamples)||receipt.poseSamples<5||
    !Number.isSafeInteger(receipt.sampledIntervals)||
    receipt.sampledIntervals!==receipt.poseSamples-1||
    !Number.isSafeInteger(receipt.unresolvedPairs)||receipt.unresolvedPairs<0||
    !Number.isSafeInteger(receipt.provenSeparatedPairs)||receipt.provenSeparatedPairs<0||
    receipt.broadphasePotentialPairs!==receipt.unresolvedPairs+receipt.provenSeparatedPairs||
    receipt.actualNonlinearMotionBetweenSamplesCertified!==false||
    receipt.collisionFreeContinuousRotationCertified!==false||
    receipt.releaseAuthorized!==false||receipt.familyAlpha!=='HOLD')
  fail('C42 invalid or partial sampled articulated pose evidence');
 if(receipt.unresolvedPairs)
  fail('C42 genuine intermediate 163-bone pose may cross original dress');
 return Object.freeze({researchSampleOnly:true,allSampledIntervalsSeparated:true,
  unsampledNonlinearMotionNotCertified:true,releaseAuthorized:false,familyAlpha:'HOLD'});
}

/**
 * P2-C43 — higher-cadence real-joint sampling with physical-motion limits.
 *
 * C42 can legitimately pass five widely spaced poses even when an observed
 * excursion at phase 1/16 intersects the source dress. C43 REQUIRES a
 * complete 17- or 33-pose uniform grid of actual posed 163-bone vertices
 * and quaternions, checks MAXIMUM joint angle and per-vertex movement in
 * EVERY adjacent interval, and then runs C42's complete source-verified
 * triangle-interval check over all those adjacent poses.
 *
 * No certificate of arbitrary nonlinear behavior BETWEEN sampled frames,
 * live devices, cloth drape, self/layer contact, realism or release.
 * A forged or incomplete timeline must never become a "safe" receipt.
 */
export function auditSourceDressHighCadencePose43({
 root,dress,poseTokens,startPositions,endPositions,
 maxJointStepDegrees=12,maxBodyVertexStepMeters=.06,
 maxDepth=10,maxTemporalNodesPerInterval=80000
}={}){
 validateRootDress(root,dress);
 const n=poseTokens?.length;
 if(!Array.isArray(poseTokens)||(n!==17&&n!==33)||
    new Set(poseTokens).size!==n||
    !Number.isFinite(maxJointStepDegrees)||
    maxJointStepDegrees<=0||maxJointStepDegrees>12||
    !Number.isFinite(maxBodyVertexStepMeters)||
    maxBodyVertexStepMeters<=0||maxBodyVertexStepMeters>.08||
    !Number.isSafeInteger(maxDepth)||maxDepth<0||maxDepth>15||
    !Number.isSafeInteger(maxTemporalNodesPerInterval)||
    maxTemporalNodesPerInterval<1||maxTemporalNodesPerInterval>500000)
  fail('C43 complete 17/33 sampled phase grid and bounded motion budgets required');
 const captured=poseTokens.map(t=>captures.get(t));
 const phaseStep=1/(n-1);
 for(let i=0;i<n;i++){
  const shot=captured[i];
  if(!shot||shot.root!==root||shot.mesh!==dress.mesh||
     !Number.isFinite(shot.poseFraction)||
     Math.abs(shot.poseFraction-i*phaseStep)>1e-10)
   fail('C43 missing or nonuniform authentic intermediate joint pose');
 }
 let maxObservedJointStepDegrees=0,maxObservedBodyStepMeters=0,
  rotatedIntervals=0,movingBodyVertices=0,verifiedBodyBoneComparisons=0;
 for(let i=0;i<n-1;i++){
  const a=captured[i],b=captured[i+1];
  if(!a.bodies.length||a.bodies.length!==b.bodies.length)
   fail('C43 missing independent 163-bone anatomy');
  let rotated=false;
  for(let k=0;k<a.bodies.length;k++){
   const x=a.bodies[k],y=b.bodies[k];
   if(x.mesh!==y.mesh||x.boneRotations.length!==163||
      y.boneRotations.length!==163||x.world.length!==y.world.length)
    fail('C43 source body rig/topology/pose identity changed');
   for(let j=0;j<163;j++){
    const q=x.boneRotations[j],r=y.boneRotations[j];
    const dot=Math.abs(q[0]*r[0]+q[1]*r[1]+q[2]*r[2]+q[3]*r[3]);
    if(!Number.isFinite(dot)||dot>1.00001)
     fail('C43 invalid real joint world orientation');
    const angle=2*Math.acos(Math.min(1,dot))*180/Math.PI;
    maxObservedJointStepDegrees=Math.max(maxObservedJointStepDegrees,angle);
    verifiedBodyBoneComparisons++;
    if(angle>maxJointStepDegrees+1e-6)
     fail('C43 undersampled excessive real bone rotation step');
    if(angle>1e-3)rotated=true;
   }
   for(let j=0;j<x.world.length;j+=3){
    const d=Math.hypot(y.world[j]-x.world[j],
     y.world[j+1]-x.world[j+1],y.world[j+2]-x.world[j+2]);
    if(!Number.isFinite(d)||d>maxBodyVertexStepMeters+1e-6)
     fail('C43 undersampled excessive skinned body surface displacement');
    maxObservedBodyStepMeters=Math.max(maxObservedBodyStepMeters,d);
    if(d>1e-6)movingBodyVertices++;
   }
  }
  if(rotated)rotatedIntervals++;
 }
 if(!rotatedIntervals||!movingBodyVertices)
  fail('C43 no genuinely moving skinned body surface observed');
 // C42 recomputes the P41 time-interval pair analysis for EVERY subframe.
 // All source/photo/skin and body-roster custody validations are repeated.
 const evidence=auditSourceDressArticulatedPoseSamples42({
  root,dress,poseTokens,startPositions,endPositions,maxPoseSamples:n,
  maxTimeGap:phaseStep,maxDepth,maxTemporalNodesPerInterval,
  maxBodyShiftMeters:maxBodyVertexStepMeters
 });
 if(evidence.poseSamples!==n||evidence.sampledIntervals!==n-1||
    evidence.maximumObservedPoseFractionGap>phaseStep+1e-10||
    !evidence.fullProvidedPoseSequenceChecked||
    !evidence.allSampledPairsAccounted)
  fail('C43 incomplete original source high-cadence body-contact accounting');
 return Object.freeze({
  schema:'M2-source-dress-high-cadence-joint-guard-v1',
  originalSourceAndSkinVerified:true,
  completeUniformPoseGrid:true,
  independentlyCaptured163BoneBody:true,
  fullProvidedPoseSequenceChecked:true,
  poseSamples:n,sampledIntervals:n-1,
  maxObservedPhaseGap:evidence.maximumObservedPoseFractionGap,
  maxAllowedPhaseGap:phaseStep,
  maxObservedJointStepDegrees,maxAllowedJointStepDegrees:maxJointStepDegrees,
  maxObservedBodyStepMeters,maxAllowedBodyStepMeters:maxBodyVertexStepMeters,
  rotatedIntervals,movingBodyVertices,verifiedBodyBoneComparisons,
  broadphasePotentialPairs:evidence.broadphasePotentialPairs,
  provenSeparatedPairs:evidence.provenSeparatedPairs,
  unresolvedPairs:evidence.unresolvedPairs,
  allSampledPairsAccounted:evidence.allSampledPairsAccounted,
  actualMotionBetweenSamplesCertified:false,
  continuousNonlinearBoneRotationCertified:false,
  selfLayerCollisionCertified:false,realClothPhysics:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
/** Clear sampled research evidence is NOT physically continuous clearance. */
export function assertSourceDressHighCadencePose43(receipt){
 if(receipt?.schema!=='M2-source-dress-high-cadence-joint-guard-v1'||
    receipt.originalSourceAndSkinVerified!==true||
    receipt.completeUniformPoseGrid!==true||
    receipt.independentlyCaptured163BoneBody!==true||
    receipt.fullProvidedPoseSequenceChecked!==true||
    (receipt.poseSamples!==17&&receipt.poseSamples!==33)||
    receipt.sampledIntervals!==receipt.poseSamples-1||
    !Number.isSafeInteger(receipt.verifiedBodyBoneComparisons)||
    receipt.verifiedBodyBoneComparisons<receipt.sampledIntervals*163||
    !Number.isSafeInteger(receipt.rotatedIntervals)||receipt.rotatedIntervals<1||
    !Number.isSafeInteger(receipt.movingBodyVertices)||receipt.movingBodyVertices<1||
    !Number.isFinite(receipt.maxObservedJointStepDegrees)||
    !Number.isFinite(receipt.maxAllowedJointStepDegrees)||
    receipt.maxObservedJointStepDegrees>receipt.maxAllowedJointStepDegrees+1e-6||
    !Number.isFinite(receipt.maxObservedBodyStepMeters)||
    !Number.isFinite(receipt.maxAllowedBodyStepMeters)||
    receipt.maxObservedBodyStepMeters>receipt.maxAllowedBodyStepMeters+1e-6||
    !Number.isSafeInteger(receipt.unresolvedPairs)||receipt.unresolvedPairs<0||
    !Number.isSafeInteger(receipt.provenSeparatedPairs)||receipt.provenSeparatedPairs<0||
    receipt.broadphasePotentialPairs!==receipt.unresolvedPairs+receipt.provenSeparatedPairs||
    receipt.allSampledPairsAccounted!==true||
    receipt.actualMotionBetweenSamplesCertified!==false||
    receipt.continuousNonlinearBoneRotationCertified!==false||
    receipt.releaseAuthorized!==false||receipt.familyAlpha!=='HOLD')
  fail('C43 incomplete, fabricated or unsupported motion research receipt');
 if(receipt.unresolvedPairs>0)
  fail('C43 unresolved genuinely sampled body/garment intersection refused');
 return Object.freeze({
  researchSampleOnly:true,allCapturedSubframeIntervalsSeparated:true,
  unobservedHighFrequencyMotionNotCertified:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}



/**
 * P2-C49: bounded ORIGINAL-source vs ACTUAL skinned-pose first contact
 * classification. This runs only AFTER C45's BVH has verified that one
 * non-adjacent, source-identical triangle pair is already unresolved.
 *
 * A strict interior segment-triangle crossing is strong evidence of a face
 * piercing another face. Grazing, shared seams, coplanar overlap, short
 * distances and borderline barycentric results are UNRESOLVED instead.
 * No geometry change, fake garment seam welding or release authorization.
 *
 * Every input is the private source-verified C40 capture; public receipts
 * contain only small categories/counts, never vertex IDs, XYZ or owner data.
 */
function firstSourceTriangleCrossing49(shot,first,second,toleranceMeters){
 const SOURCE_EPS=1e-7,BARYCENTRIC_MARGIN=1e-5;
 const tri=(array,ids)=>ids.map(i=>
  new THREE.Vector3().fromArray(array,i*3));
 const signedPlane=(p,triangle)=>{
  const [a,b,c]=triangle;
  const n=new THREE.Vector3().crossVectors(
   new THREE.Vector3().subVectors(b,a),
   new THREE.Vector3().subVectors(c,a));
  const length=n.length();
  if(!Number.isFinite(length)||length<1e-12)
   fail('C49 degenerate original source or actually posed cloth face');
  n.divideScalar(length);
  return n.dot(new THREE.Vector3().subVectors(p,a));
 };
 const segmentFace=(start,end,face)=>{
  const [a,b,c]=face;
  const d0=signedPlane(start,face),d1=signedPlane(end,face);
  // Require two STRICT opposite signs; a touch along an edge or plane
  // counts as uncertain rather than falsely certifying penetration.
  if(!((d0>SOURCE_EPS&&d1< -SOURCE_EPS)||
       (d0< -SOURCE_EPS&&d1>SOURCE_EPS)))return false;
  const t=d0/(d0-d1);
  if(!(t>SOURCE_EPS&&t<1-SOURCE_EPS))return false;
  const hit=start.clone().lerp(end,t);
  const v0=b.clone().sub(a),v1=c.clone().sub(a),v2=hit.sub(a);
  const d00=v0.dot(v0),d01=v0.dot(v1),d11=v1.dot(v1);
  const d20=v2.dot(v0),d21=v2.dot(v1);
  const denom=d00*d11-d01*d01;
  if(!(denom>1e-20))fail('C49 ill-conditioned original cloth triangle');
  const u=(d11*d20-d01*d21)/denom;
  const v=(d00*d21-d01*d20)/denom;
  return u>BARYCENTRIC_MARGIN&&v>BARYCENTRIC_MARGIN&&
   u+v<1-BARYCENTRIC_MARGIN;
 };
 const read=(array)=>{
  const a=tri(array,first),b=tri(array,second);
  let transverseEdgeFaceCrossings=0;
  const segments=[[0,1],[1,2],[2,0]];
  for(const [i,j] of segments){
   if(segmentFace(a[i],a[j],b))transverseEdgeFaceCrossings++;
   if(segmentFace(b[i],b[j],a))transverseEdgeFaceCrossings++;
  }
  const normal=(t)=>new THREE.Vector3().crossVectors(
   t[1].clone().sub(t[0]),t[2].clone().sub(t[0])).normalize();
  const parallel=Math.abs(normal(a).dot(normal(b)))>.9999;
  const signed=b.map(p=>Math.abs(signedPlane(p,a)));
  const allNear=signed.every(d=>d<=toleranceMeters+1e-9);
  const effectivelyCoplanar=signed.every(d=>d<=SOURCE_EPS);
  const proximity=parallel&&allNear?
   (effectivelyCoplanar?'parallel-coplanar-possible-overlap':
    'parallel-near-contact'):
   'oblique-or-uncertain-proximity';
  return {
   strictInteriorEdgeFaceCrossings:transverseEdgeFaceCrossings,
   contactClass:transverseEdgeFaceCrossings>0?
    'strict-interior-transverse-face-crossing':proximity,
   parallelNormals:parallel
  };
 };
 const original=read(shot.source),posed=read(shot.clothWorld);
 // A zero STRICT-intersection count alone is NOT evidence that the original
 // source triangles were separate: they may already touch or overlap
 // coplanarly. Measure actual original-source triangle distance independently.
 const origA=tri(shot.source,first),origB=tri(shot.source,second);
 const ta=new ExtendedTriangle(origA[0],origA[1],origA[2]);
 const tb=new ExtendedTriangle(origB[0],origB[1],origB[2]);
 ta.needsUpdate=true;tb.needsUpdate=true;
 const sourceDistance=ta.distanceToTriangle(tb);
 if(!Number.isFinite(sourceDistance)||sourceDistance<0)
  fail('C49 original-source triangle separation could not be verified');
 const originalWasSeparated=sourceDistance>toleranceMeters+1e-9;
 const inducedByPose=originalWasSeparated&&
  original.strictInteriorEdgeFaceCrossings===0&&
  posed.strictInteriorEdgeFaceCrossings>0;
 return Object.freeze({
  schema:'M2-first-source-contact-geometry-C49',
  originalSourcePhotoShaContractChecked:true,
  originalSourceFaceCount:2,
  genuineSkinnedSourcePose:true,
  originalSourceContactClass:original.contactClass,
  posedContactClass:posed.contactClass,
  originalStrictInteriorCrossings:original.strictInteriorEdgeFaceCrossings,
  posedStrictInteriorCrossings:posed.strictInteriorEdgeFaceCrossings,
  originalTrianglesSeparatedBeyondTolerance:originalWasSeparated,
  originalSourceGapCategory:originalWasSeparated?
   'original-source-separated':'original-source-touching-or-close',
  crossingAppearsOnlyInSkinnedPose:inducedByPose,
  sourceNormalsParallel:original.parallelNormals,
  posedNormalsParallel:posed.parallelNormals,
  borderlineContactStillUnresolved:true,
  repairCandidateStatus:'not-proposed-without-independent-source-review',
  originalGeometryMutation:false,
  firstContactRemainsHardVeto:true,
  unsampledContinuousClothCertified:false,
  humanSeamVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}

/**
 * P2-C48: inspect the FIRST genuine source-verified self-contact and return
 * ONLY small, non-identifying topology diagnostics. Matching original XYZ
 * does not prove sewn seams: both UV split edges and self-overlapping fabric
 * can have identical vertices. No coordinates, vertex IDs or original photo
 * mapping are exported, and NO outcome can waive the C45/C46 veto.
 */
function firstSourceBoundaryWitness48(shot,first,second,toleranceMeters){
 const source=shot.source,world=shot.clothWorld;
 const geom=shot.mesh.geometry;
 const sk=geom.getAttribute('skinIndex'),sw=geom.getAttribute('skinWeight');
 const rest=geom.getAttribute('dressRest');
 const photo=geom.getAttribute('dressCustomPhotoProjection');
 const restPresent=!!rest&&rest.itemSize>=3;
 const photoMappingPresent=!!photo;
 const distance=(data,i,j)=>Math.hypot(
  data[3*i]-data[3*j],data[3*i+1]-data[3*j+1],
  data[3*i+2]-data[3*j+2]);
 const attrSame=(attr,i,j,eps,components)=>{
  for(let k=0;k<components;k++)
   if(Math.abs(attr.getComponent(i,k)-attr.getComponent(j,k))>eps)
    return false;
  return true;
 };
 const sourcePairs=[];
 const taken=new Set();
 for(const ai of first){
  for(const bj of second){
   if(taken.has(bj)||distance(source,ai,bj)>0.000002)continue;
   sourcePairs.push([ai,bj]);taken.add(bj);break;
  }
 }
 let compatiblePairs=0;
 const compatible=[];
 for(const [ai,bj] of sourcePairs){
  const sameSk=sk&&sw&&sk.itemSize===4&&sw.itemSize===4&&
   attrSame(sk,ai,bj,0,4)&&attrSame(sw,ai,bj,0.00001,4);
  const sameRest=!restPresent||[0,1,2].every(k=>
   Math.abs(rest.getComponent(ai,k)-rest.getComponent(bj,k))<=0.000002);
  const samePose=distance(world,ai,bj)<=
   Math.max(toleranceMeters+0.0000005,0.000002);
  if(sameSk&&sameRest&&samePose){
   compatiblePairs++;compatible.push([ai,bj]);
  }
 }
 // More than two matching vertices means potentially overlapping triangles,
 // NOT a single split boundary edge. An edge must have distinct nonzero
 // original length, regardless of a possibly collapsed skinned pose.
 const edgeLength=compatible.length===2?
  Math.hypot(...[0,1,2].map(k=>
   source[compatible[0][0]*3+k]-source[compatible[1][0]*3+k])):0;
 const edgeCandidate=sourcePairs.length===2&&compatiblePairs===2&&
  restPresent&&edgeLength>0.000002;
 const classification=edgeCandidate?'source-duplicate-boundary-candidate':
  sourcePairs.length===3?'source-duplicate-face-unresolved':
  sourcePairs.length===2?'unverified-source-edge-contact':
  'source-unmatched-or-crossing-contact';
 return Object.freeze({
  schema:'M2-first-source-contact-topology-C48',
  classification,
  sourceMatchedVertexPairs:sourcePairs.length,
  sourceSkinAndPoseCompatiblePairs:compatiblePairs,
  originalDressRestPresent:restPresent,
  sourcePhotoProjectionPresent:photoMappingPresent,
  originalIndicesRemainDisconnected:true,
  sourceDuplicateBoundaryCandidate:edgeCandidate,
  independentSewnSeamIdentityVerified:false,
  allowedToExcludeFromCollision:false,
  actualContinuousClothSelfContactCertified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}

/**
 * P2-C44: original photographed garment SELF-contact at one genuinely
 * captured, skinned 163-bone pose. Compare all nonadjacent original
 * cloth triangles, not only garment-vs-body. Topological neighbors sharing
 * an original vertex are intentional mesh joins and are excluded, but
 * disconnected geometry touching within source-meter tolerance remains
 * UNRESOLVED and vetoes motion (no fabricated seam labels).
 *
 * This detects one sampled-pose concern; not a continuous cloth, layered
 * garment, joint-motion or time-of-impact certificate. No actual photos,
 * original vertices, UV or owner details leave the internal WeakMap receipt.
 */
export function auditSourceDressSelfContact44({
 root,dress,poseToken,
 maxSourceFaces=100000,maxTriangleCandidates=300000,
 maxUnresolvedPairs=20000,toleranceMeters=.00002,
 stopAtFirstUnresolvedContact45=false
}={}){
 const mesh=validateRootDress(root,dress),shot=captures.get(poseToken);
 if(!shot||shot.root!==root||shot.mesh!==mesh||
    !Number.isSafeInteger(maxSourceFaces)||maxSourceFaces<1||
    maxSourceFaces>200000||
    !Number.isSafeInteger(maxTriangleCandidates)||maxTriangleCandidates<1||
    maxTriangleCandidates>2000000||
    !Number.isSafeInteger(maxUnresolvedPairs)||maxUnresolvedPairs<1||
    maxUnresolvedPairs>50000||
    !Number.isFinite(toleranceMeters)||toleranceMeters<0||
    toleranceMeters>.002||typeof stopAtFirstUnresolvedContact45!=='boolean')
  fail('C44 complete source-verified, bounded self-contact audit required');
 checkTopology(shot);
 const bodies=[];
 root.traverse(o=>{
  if(o!==mesh&&o.isSkinnedMesh&&!o.userData?.work56Garment&&
     o.skeleton?.bones?.length===163)bodies.push(o);
 });
 if(bodies.length!==shot.bodies.length||
    bodies.some((b,i)=>b!==shot.bodies[i].mesh))
  fail('C44 original anatomical body roster altered after capture');
 const faceCount=shot.geo.faceCount;
 if(!Number.isSafeInteger(faceCount)||faceCount<1||
    faceCount>maxSourceFaces)
  fail('C44 source garment triangle audit budget exceeded');
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(shot.clothWorld.slice(),3));
 if(shot.geo.indices)g.setIndex(
  new THREE.BufferAttribute(shot.geo.indices.slice(),1));
 let checkedOriginalFaces=0,adjacentPairsExcluded=0,
  candidateTriangles=0,unresolvedPairs=0,minDistanceMeters=null;
 let firstUnresolvedContactKind45=null,firstSourceBoundary48=null,
  firstSourceCrossing49=null,firstContactPair50=null,earlyBlock45=false;
 try{
  const bvh=new MeshBVH(g,{indirect:true});
  const start=new ExtendedTriangle(),box=new THREE.Box3();
  for(let i=0;i<faceCount;i++){
   checkedOriginalFaces++;
   const indices=Array.from({length:3},(_,c)=>at(shot.geo.indices,i,c));
   const xyz=indices.map(idx=>new THREE.Vector3().fromArray(shot.clothWorld,idx*3));
   start.a.copy(xyz[0]);start.b.copy(xyz[1]);start.c.copy(xyz[2]);
   start.needsUpdate=true;
   if(start.getArea()<1e-12)
    fail('C44 nonfinite or degenerate source fabric face');
   box.makeEmpty();
   for(const v of xyz)box.expandByPoint(v);
   box.expandByScalar(toleranceMeters);
   let overflow=false;
   bvh.shapecast({
    intersectsBounds:bounds=>box.intersectsBox(bounds),
    intersectsTriangle:(tri,idx)=>{
     const j=bvh.resolveTriangleIndex(idx);
     if(j<=i)return false;
     candidateTriangles++;
     if(candidateTriangles>maxTriangleCandidates){
      overflow=true;return true;
     }
     const other=Array.from({length:3},(_,c)=>at(shot.geo.indices,j,c));
     if(other.some(v=>indices.includes(v))){
      adjacentPairsExcluded++;
      return false;
     }
     tri.needsUpdate=true;
     // Closest distance catches both crossing triangles and coincident
     // disconnected seam faces (including coplanar contacts). A zero
     // distance is NOT assumed to be a physically penetrative event.
     const distance=start.distanceToTriangle(tri);
     if(!Number.isFinite(distance)||distance<0){
      overflow=true;return true;
     }
     if(distance<=toleranceMeters+1e-9){
      unresolvedPairs++;
      minDistanceMeters=minDistanceMeters===null?distance:
       Math.min(minDistanceMeters,distance);
      if(stopAtFirstUnresolvedContact45){
       firstContactPair50=Object.freeze([i,j]);
       firstSourceBoundary48=firstSourceBoundaryWitness48(
        shot,indices,other,toleranceMeters);
       firstSourceCrossing49=firstSourceTriangleCrossing49(
        shot,indices,other,toleranceMeters);
       // Coplanar seam candidates are still unresolved, NEVER safe.
       // Cross-plane surface proximity is equally fail-closed. A contact
       // is a VETO, not a proof of geometrical penetration.
       const n1=new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(start.b,start.a),
        new THREE.Vector3().subVectors(start.c,start.a));
       const n2=new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(tri.b,tri.a),
        new THREE.Vector3().subVectors(tri.c,tri.a));
       if(n1.lengthSq()<1e-24||n2.lengthSq()<1e-24){
        overflow=true;return true;
       }
       n1.normalize();n2.normalize();
       const coplanar=Math.abs(n1.dot(n2))>.9999&&
        [tri.a,tri.b,tri.c].every(v=>
         Math.abs(n1.dot(new THREE.Vector3().subVectors(v,start.a)))
           <=toleranceMeters+1e-8);
       firstUnresolvedContactKind45=coplanar?
        'unresolved-coplanar-or-disconnected-seam':
        'unresolved-spatial-triangle-contact';
       earlyBlock45=true;
       return true;
      }
      if(unresolvedPairs>=maxUnresolvedPairs){
       overflow=true;return true;
      }
     }
     return false;
    }
   });
   if(overflow)
    fail('C44 self-contact evidence incomplete; candidate or geometric budget exceeded');
   // Contact is already a sufficient negative admission witness; do not
   // consume the entire owner's original photo mesh merely to say BLOCK.
   if(earlyBlock45)break;
  }
  const receipt=Object.freeze({
   schema:'M2-source-dress-self-contact-v1',
   originalSourceAndSkinVerified:true,
   actual163BoneSkinnedPose:true,
   completeNonadjacentFaceAudit:!earlyBlock45,
   stoppedAtFirstUnresolvedContact45:earlyBlock45,
   firstUnresolvedContactKind45,firstSourceBoundary48,firstSourceCrossing49,
   originalFaceCount:faceCount,checkedOriginalFaces,
   candidateTriangles,adjacentPairsExcluded,
   unresolvedPairs,minDistanceMeters,
   topologicalNeighborsExcluded:true,
   disconnectedSeamCollisionsUnresolved:true,
   actualContinuousSelfContactCertified:false,
   garmentLayerCollisionCertified:false,
   selfContactPhysicsCertified:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
  if(firstContactPair50)firstContactPairs50.set(receipt,{
   root,mesh,shot,faces:firstContactPair50
  });
  return receipt;
 }finally{g.dispose();}
}
export function assertSourceDressSelfContact44(receipt){
 if(receipt?.schema!=='M2-source-dress-self-contact-v1'||
    receipt.originalSourceAndSkinVerified!==true||
    receipt.actual163BoneSkinnedPose!==true||
    receipt.completeNonadjacentFaceAudit!==true||
    !Number.isSafeInteger(receipt.originalFaceCount)||
    receipt.originalFaceCount<1||
    receipt.checkedOriginalFaces!==receipt.originalFaceCount||
    !Number.isSafeInteger(receipt.candidateTriangles)||
    receipt.candidateTriangles<0||
    !Number.isSafeInteger(receipt.unresolvedPairs)||
    receipt.unresolvedPairs<0||
    receipt.topologicalNeighborsExcluded!==true||
    receipt.disconnectedSeamCollisionsUnresolved!==true||
    receipt.actualContinuousSelfContactCertified!==false||
    receipt.selfContactPhysicsCertified!==false||
    receipt.releaseAuthorized!==false||receipt.familyAlpha!=='HOLD')
  fail('C44 incomplete or forged photographed garment self-contact receipt');
 if(receipt.unresolvedPairs>0)
  fail('C44 potentially self-intersecting original source garment refused');
 return Object.freeze({
  sampledSourceSelfContactVetoPassed:true,
  completeClothContactNotCertified:true,
  researchOnly:true,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}

/**
 * P2-C45: bounded early VETO for original-photo full-dress UV-split geometry.
 *
 * C44 attempts exhaustive contact counting and can exceed the safe contact
 * budget on the genuine photographed dress because UV splits generate very
 * many unresolved touches. A SINGLE source-confirmed, nonadjacent unresolved
 * contact is sufficient to block release. Stopping early is legitimate only
 * if the receipt is EXPLICITLY INCOMPLETE and can NEVER imply a full scan.
 * For an actually clear mesh all original source faces must be examined.
 */
export function auditSourceDressFastSelfContact45({
 root,dress,poseToken,
 maxSourceFaces=100000,maxTriangleCandidates=300000,
 toleranceMeters=.00002
}={}){
 const result=auditSourceDressSelfContact44({
  root,dress,poseToken,maxSourceFaces,maxTriangleCandidates,
  toleranceMeters,stopAtFirstUnresolvedContact45:true
 });
 const blocked=result.unresolvedPairs>0;
 if(result.unresolvedPairs>1||
    (blocked&&!result.stoppedAtFirstUnresolvedContact45)||
    (!blocked&&(result.stoppedAtFirstUnresolvedContact45||
       !result.completeNonadjacentFaceAudit||
       result.checkedOriginalFaces!==result.originalFaceCount))||
    (blocked&&result.completeNonadjacentFaceAudit)||
    (blocked&&(!result.firstUnresolvedContactKind45||
       result.firstSourceBoundary48?.schema!=='M2-first-source-contact-topology-C48'||
       result.firstSourceCrossing49?.schema!=='M2-first-source-contact-geometry-C49'||
       result.firstSourceCrossing49.firstContactRemainsHardVeto!==true))||
    (!blocked&&(result.firstSourceBoundary48!==null||
       result.firstSourceCrossing49!==null)))
  fail('C45 contradictory partial self-contact audit');
 const receipt=Object.freeze({
  schema:'M2-source-dress-first-contact-veto-v1',
  originalSourceAndSkinVerified:result.originalSourceAndSkinVerified,
  actual163BoneSkinnedPose:result.actual163BoneSkinnedPose,
  originalFaceCount:result.originalFaceCount,
  checkedOriginalFaces:result.checkedOriginalFaces,
  candidateTriangles:result.candidateTriangles,
  topologicalNeighborsExcluded:result.topologicalNeighborsExcluded,
  disconnectedSeamsRemainUnresolved:true,
  firstUnresolvedContactKind:result.firstUnresolvedContactKind45,
  firstSourceBoundary48:result.firstSourceBoundary48,
  firstSourceCrossing49:result.firstSourceCrossing49,
  unresolvedPairs:result.unresolvedPairs,
  stoppedEarlyToRefuse:blocked,
  completeSourceSelfContactAudit:!blocked,
  originalPhotoAndSkinPreserved:true,
  actualContinuousSelfContactCertified:false,
  sewnSeamsHumanVerified:false,
  clothPhysicsCertified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
 if(blocked){
  const pair=firstContactPairs50.get(result);
  if(!pair||pair.root!==root||pair.mesh!==dress.mesh)
   fail('C50 real source first-contact face provenance not present');
  firstContactPairs50.set(receipt,pair);
 }
 return receipt;
}
export function assertSourceDressFastSelfContact45(receipt){
 if(receipt?.schema!=='M2-source-dress-first-contact-veto-v1'||
    receipt.originalSourceAndSkinVerified!==true||
    receipt.actual163BoneSkinnedPose!==true||
    receipt.topologicalNeighborsExcluded!==true||
    receipt.disconnectedSeamsRemainUnresolved!==true||
    receipt.originalPhotoAndSkinPreserved!==true||
    !Number.isSafeInteger(receipt.originalFaceCount)||
    receipt.originalFaceCount<1||
    !Number.isSafeInteger(receipt.checkedOriginalFaces)||
    receipt.checkedOriginalFaces<1||
    receipt.checkedOriginalFaces>receipt.originalFaceCount||
    !Number.isSafeInteger(receipt.candidateTriangles)||
    receipt.candidateTriangles<0||
    !Number.isSafeInteger(receipt.unresolvedPairs)||
    receipt.unresolvedPairs<0||receipt.unresolvedPairs>1||
    receipt.actualContinuousSelfContactCertified!==false||
    receipt.sewnSeamsHumanVerified!==false||
    receipt.clothPhysicsCertified!==false||
    receipt.releaseAuthorized!==false||receipt.familyAlpha!=='HOLD')
  fail('C45 incomplete or forged owner-source self-contact result');
 if(receipt.unresolvedPairs){
  if(receipt.stoppedEarlyToRefuse!==true||
     receipt.firstSourceBoundary48?.schema!=='M2-first-source-contact-topology-C48'||
     receipt.firstSourceCrossing49?.schema!=='M2-first-source-contact-geometry-C49'||
     receipt.firstSourceCrossing49?.firstContactRemainsHardVeto!==true||
     receipt.firstSourceCrossing49?.originalGeometryMutation!==false||
     receipt.firstSourceBoundary48?.allowedToExcludeFromCollision!==false||
     receipt.firstSourceBoundary48?.independentSewnSeamIdentityVerified!==false||
     receipt.completeSourceSelfContactAudit!==false||
     !['unresolved-coplanar-or-disconnected-seam',
       'unresolved-spatial-triangle-contact']
       .includes(receipt.firstUnresolvedContactKind))
   fail('C45 inconsistent source contact classification');
  fail('C45 source dress has unresolved contact; no garment admission');
 }
 if(receipt.stoppedEarlyToRefuse!==false||
    receipt.firstSourceBoundary48!==null||
    receipt.firstSourceCrossing49!==null||
    receipt.completeSourceSelfContactAudit!==true||
    receipt.checkedOriginalFaces!==receipt.originalFaceCount||
    receipt.firstUnresolvedContactKind!==null)
  fail('C45 missing full clear original source face scan');
 return Object.freeze({
  researchOnly:true,completeSourceSelfAuditClear:true,
  noContinuousClothCertification:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}




/**
 * P2-C51: find all duplicated original source coordinates before permitting
 * any source-only motion. Disconnected UV vertices are NOT necessarily sewn
 * seams. If a proposed edit would move a duplicate in isolation, do not
 * silently crack a visible photo seam. World/source/IDs stay private.
 */
const SOURCE_TWIN_EPS51=.000002;
function sourceTwinVertices51(shot,vertex){
 const src=shot.source,i3=vertex*3,out=[];
 for(let j=0;j<src.length/3;j++){
  if(j===vertex)continue;
  const k=3*j;
  if(Math.abs(src[k]-src[i3])<=SOURCE_TWIN_EPS51&&
     Math.abs(src[k+1]-src[i3+1])<=SOURCE_TWIN_EPS51&&
     Math.abs(src[k+2]-src[i3+2])<=SOURCE_TWIN_EPS51&&
     Math.hypot(src[k]-src[i3],src[k+1]-src[i3+1],
      src[k+2]-src[i3+2])<=SOURCE_TWIN_EPS51)out.push(j);
 }
 return out;
}
function sourceTwinsHaveSameSkinAndRest51(shot,i,j){
 const geom=shot.mesh.geometry,rest=geom.getAttribute('dressRest');
 const si=geom.getAttribute('skinIndex'),sw=geom.getAttribute('skinWeight');
 if(!rest||rest.itemSize<3||!si||!sw||
    si.itemSize!==4||sw.itemSize!==4)return false;
 for(let k=0;k<3;k++){
  if(Math.abs(rest.getComponent(i,k)-rest.getComponent(j,k))>SOURCE_TWIN_EPS51)
   return false;
 }
 for(let k=0;k<4;k++)
  if(si.getComponent(i,k)!==si.getComponent(j,k)||
     Math.abs(sw.getComponent(i,k)-sw.getComponent(j,k))>1e-6)
   return false;
 return Math.hypot(...[0,1,2].map(k=>
  shot.clothWorld[3*i+k]-shot.clothWorld[3*j+k]))<=SOURCE_TWIN_EPS51;
}

/**
 * Mission 2 P2-C50 — reversible, staged-only, full-surface repair EXPLORATION.
 *
 * The first genuine 163-bone source garment transverse intersection can be
 * probed with small +/- normal offsets of a wholly source-disconnected
 * triangle. Connected/UV-shared vertices may never be moved independently:
 * this would tear the original photographed surface. If a candidate is
 * generated, run the COMPLETE original-source cloth face self-contact audit
 * AND swept whole-garment-vs-body broadphase BEFORE returning a preview.
 *
 * This is not cloth physics, a mesh repair, a garment approval or a seam ID.
 * A preview is a one-time opaque C40 pose token, never raw staged source XYZ;
 * production geometry, original photo, UV, skin and material are unchanged.
 */
export function proposeSourceDressStagedRepair50({
 root,dress,poseToken,maxShiftMeters=.002,toleranceMeters=.00002,
 maxSourceFaces=100000,maxTriangleCandidates=300000,
 maxBodyFaces=500000
}={}){
 const mesh=validateRootDress(root,dress),shot=captures.get(poseToken);
 if(!shot||shot.root!==root||shot.mesh!==mesh||
    !Number.isFinite(maxShiftMeters)||maxShiftMeters<.00005||
    maxShiftMeters>.002||
    !Number.isFinite(toleranceMeters)||toleranceMeters<0||
    toleranceMeters>.002||
    !Number.isSafeInteger(maxSourceFaces)||maxSourceFaces<1||
    maxSourceFaces>200000||
    !Number.isSafeInteger(maxTriangleCandidates)||maxTriangleCandidates<1||
    maxTriangleCandidates>2000000||
    !Number.isSafeInteger(maxBodyFaces)||maxBodyFaces<1||
    maxBodyFaces>500000)
  fail('C50 genuine source capture and bounded research parameters required');
 checkTopology(shot);
 // C40 captures after root.updateMatrixWorld(true). C50 must refresh the
 // ENTIRE skeleton, not merely the mesh world matrix, or moved sibling
 // bones can retain stale bone.matrixWorld and defeat the pose lease.
 root.updateMatrixWorld(true);
 if(!same(shot.clothSource,shot.source))
  fail('C50 repair proposal must start with captured untouched source cloth');
 const onPose=sourcePose(mesh,shot.source);
 if(!same(onPose,shot.clothWorld)||
    shot.bodies.some(b=>!same(sourcePose(b.mesh,b.sourceBody),b.world)))
  fail('C50 source or anatomical pose changed since original capture');
 const first=auditSourceDressFastSelfContact45({
  root,dress,poseToken,maxSourceFaces,maxTriangleCandidates,
  toleranceMeters
 });
 const refusal=(status,attemptedCandidates=0)=>Object.freeze({
  schema:'M2-source-dress-reversible-repair-C50',
  status,attemptedCandidates,proposalToken:null,
  firstSourceContactVerified:first.unresolvedPairs===1,
  fullOriginalGeometryImmutable:true,
  wholeGarmentSelfContactClearanceClaim:false,
  wholeBodySweptClearanceClaim:false,
  independentSourcePhotoReview:false,
  realFabricPhysics:false,
  previewOnly:true,repairCommitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
 if(first.unresolvedPairs===0)return refusal('no-contact-no-repair-required');
 const saved=firstContactPairs50.get(first);
 if(!saved||saved.root!==root||saved.mesh!==mesh||saved.shot!==shot||
    !Array.isArray(saved.faces)||saved.faces.length!==2)
  fail('C50 original source first contact not independently traceable');
 if(first.firstSourceCrossing49?.posedContactClass!==
    'strict-interior-transverse-face-crossing')
  return refusal('unverified-contact-no-geometry-correction');
 const [faceA,faceB]=saved.faces,geom=shot.geo;
 const ids=[0,1,2].map(k=>at(geom.indices,faceB,k));
 if(new Set(ids).size!==3)
  return refusal('nontriangular-or-repeated-source-topology');
 // No candidate may split a shared edge, a manifold garment surface, or a
 // genuine UV seam. Compute original index references for the ENTIRE mesh.
 const counts=new Uint32Array(geom.p.count);
 for(let face=0;face<geom.faceCount;face++)
  for(let corner=0;corner<3;corner++)
   counts[at(geom.indices,face,corner)]++;
 if(ids.some(v=>counts[v]!==1))
  return refusal('source-connected-fabric-cannot-move-single-triangle');
 // C50 previously assumed separate index IDs were separate physical cloth.
 // A duplicate original source XYZ can be a UV split: a single-face nudge
 // would invisibly open a photo seam. C51 fails closed instead.
 if(ids.some(v=>sourceTwinVertices51(shot,v).length))
  return refusal('coincident-source-uv-vertices-cannot-move-alone');
 const tri=ids.map(i=>new THREE.Vector3().fromArray(shot.source,3*i));
 const normal=new THREE.Vector3().subVectors(tri[1],tri[0])
  .cross(new THREE.Vector3().subVectors(tri[2],tri[0]));
 if(!Number.isFinite(normal.length())||normal.length()<1e-10)
  fail('C50 degenerate original source garment cannot be corrected');
 normal.normalize();
 let attempted=0;
 for(const offset of [.00005,.0001,.00025,.0005,.001,.002]){
  if(offset>maxShiftMeters+1e-12)continue;
  for(const direction of [1,-1]){
   attempted++;
   const staged=shot.source.slice();
   for(const v of ids){
    staged[v*3]+=normal.x*offset*direction;
    staged[v*3+1]+=normal.y*offset*direction;
    staged[v*3+2]+=normal.z*offset*direction;
   }
   const trial=captureSourceDressBodyPose40({root,dress,stagedPositions:staged});
   const trialShot=captures.get(trial);
   let maximumPosedShift=0;
   for(let i=0;i<trialShot.clothWorld.length;i+=3)
    maximumPosedShift=Math.max(maximumPosedShift,Math.hypot(
     trialShot.clothWorld[i]-shot.clothWorld[i],
     trialShot.clothWorld[i+1]-shot.clothWorld[i+1],
     trialShot.clothWorld[i+2]-shot.clothWorld[i+2]));
   // Even a tiny source-space change may become a large skinned displacement
   // under a scaled/rotating mesh. Refuse unless true posed shift is bounded.
   if(!Number.isFinite(maximumPosedShift)||
      maximumPosedShift>maxShiftMeters+1e-7)continue;
   let cloth,body;
   try{
    cloth=auditSourceDressSelfContact44({
     root,dress,poseToken:trial,maxSourceFaces,
     maxTriangleCandidates,toleranceMeters
    });
    if(!cloth.completeNonadjacentFaceAudit||
       cloth.checkedOriginalFaces!==cloth.originalFaceCount||
       cloth.unresolvedPairs!==0)continue;
    body=auditMovingSourceDressBodySurfaces40({
     root,dress,startPose:poseToken,endPose:trial,
     maxClothFaces:maxSourceFaces,
     maxBodyFaces,maxTriangleCandidates,
     maxClothShiftMeters:.025,paddingMeters:toleranceMeters
    });
    if(!body.wholeGarmentFacesExamined||!body.fullBodyFacesExamined||
       body.potentialPairs!==0)continue;
   }catch{
    // Budget exceed, mesh race, incomplete pose or uncertain body crossing:
    // evidence may NEVER become a successful staged proposal.
    continue;
   }
   checkTopology(shot);
   if(!same(sourcePose(mesh,shot.source),shot.clothWorld))
    fail('C50 original source pose changed during staged candidate evaluation');
   const proposalToken=Object.freeze({});
   stagedProposals50.set(proposalToken,{
    root,mesh,shot,staged,used:false
   });
   return Object.freeze({
    schema:'M2-source-dress-reversible-repair-C50',
    status:'staged-full-surface-clear-preview-only',
    attemptedCandidates:attempted,
    proposalToken,firstSourceContactVerified:true,
    sourceIndependentTriangleOnly:true,
    movedSourceVertexCount:3,
    maximumSourceShiftMeters:offset,
    maximumPosedShiftMeters:maximumPosedShift,
    originalSourceFacesChecked:cloth.checkedOriginalFaces,
    completeSourceContactAudited:true,
    unresolvedSourceContactPairs:0,
    bodyFacesAudited:body.bodyFaces,
    sweptWholeGarmentBodyPotentialPairs:body.potentialPairs,
    fullOriginalGeometryImmutable:true,
    wholeGarmentSelfContactClearanceClaim:true,
    wholeBodySweptClearanceClaim:true,
    continuousClothMotionApproved:false,
    independentSourcePhotoReview:false,
    realFabricPhysics:false,
    previewOnly:true,repairCommitted:false,
    releaseAuthorized:false,familyAlpha:'HOLD'
   });
  }
 }
 return refusal('bounded-candidates-cannot-clear-whole-surfaces',attempted);
}

/** Research-only one-shot opaque preview; NEVER exposes raw XYZ or commits. */
export function captureSourceDressRepairPreview50({root,dress,proposalToken}={}){
 const lease=stagedProposals50.get(proposalToken);
 const mesh=validateRootDress(root,dress);
 if(!lease||lease.used||lease.root!==root||lease.mesh!==mesh)
  fail('C50 source-bound one-time staged repair proposal missing or reused');
 checkTopology(lease.shot);
 root.updateMatrixWorld(true);
 if(!same(sourcePose(mesh,lease.shot.source),lease.shot.clothWorld)||
   lease.shot.bodies.some(b=>!same(sourcePose(b.mesh,b.sourceBody),b.world)))
  fail('C50 staged repair preview source body or cloth pose changed');
 lease.used=true; // consume before invoking capture; failure must not replay
 return captureSourceDressBodyPose40({root,dress,
  stagedPositions:lease.staged.slice()});
}


/**
 * Mission 2 P2-C51 — connected cloth patch, staged ONLY.
 *
 * The first real C49 transverse crossing may be investigated on a connected
 * 1-ring source mesh: move all three target-face vertices together and let
 * indexed neighbor triangles follow those shared vertex identities (the
 * target face remains welded, unlike isolated-face mutation). No UV twin may
 * move alone: any duplicate source XYZ must have matching rest/skin/pose and
 * receive the exact SAME local displacement.
 *
 * A full face-wise check vetoes flipped/overstretched triangles. C44 then
 * checks ALL original source cloth faces; C40 checks the full swept cloth
 * against ALL original 163-bone body faces. These are strict necessary
 * gates, NOT a physics or continuous self-contact certificate.
 * No original geometry, normals, skin, UV, photo pixels or JPEG ever changes.
 */
export function proposeSourceDressConnectedPatch51({
 root,dress,poseToken,maxShiftMeters=.002,
 maxPatchVertices=48,maxPatchFaces=160,
 maxEdgeStretchRatio=.05,maxNormalTurnDegrees=12,
 toleranceMeters=.00002,maxSourceFaces=100000,
 maxTriangleCandidates=300000,maxBodyFaces=500000
}={}){
 const mesh=validateRootDress(root,dress),shot=captures.get(poseToken);
 if(!shot||shot.root!==root||shot.mesh!==mesh||
    !Number.isFinite(maxShiftMeters)||maxShiftMeters<.00005||
    maxShiftMeters>.002||
    !Number.isSafeInteger(maxPatchVertices)||maxPatchVertices<3||
    maxPatchVertices>256||
    !Number.isSafeInteger(maxPatchFaces)||maxPatchFaces<2||
    maxPatchFaces>1000||
    !Number.isFinite(maxEdgeStretchRatio)||maxEdgeStretchRatio<=0||
    maxEdgeStretchRatio>.08||
    !Number.isFinite(maxNormalTurnDegrees)||maxNormalTurnDegrees<=0||
    maxNormalTurnDegrees>15||
    !Number.isFinite(toleranceMeters)||toleranceMeters<0||
    toleranceMeters>.002||
    !Number.isSafeInteger(maxSourceFaces)||maxSourceFaces<1||
    maxSourceFaces>200000||
    !Number.isSafeInteger(maxTriangleCandidates)||maxTriangleCandidates<1||
    maxTriangleCandidates>2000000||
    !Number.isSafeInteger(maxBodyFaces)||maxBodyFaces<1||
    maxBodyFaces>500000)
  fail('C51 genuine connected source capture and bounded patch audit required');
 checkTopology(shot);
 root.updateMatrixWorld(true);
 if(!same(shot.clothSource,shot.source)||
    !same(sourcePose(mesh,shot.source),shot.clothWorld)||
    shot.bodies.some(b=>!same(sourcePose(b.mesh,b.sourceBody),b.world)))
  fail('C51 original photo, skin or true skeletal pose changed');
 const contact=auditSourceDressFastSelfContact45({
  root,dress,poseToken,maxSourceFaces,maxTriangleCandidates,
  toleranceMeters
 });
 const refuse=(status,attempted=0)=>Object.freeze({
  schema:'M2-source-dress-connected-patch-C51',status,
  attemptedCandidates:attempted,proposalToken:null,
  patchVertexCount:0,affectedSourceFaces:0,
  realOriginalSourceAndSkinChecked:true,
  completeClothAndBodyClearance:false,
  photoUVRestSkeletonPreserved:true,
  repairCommitted:false,independentSourceSeamReviewed:false,
  actualContinuousClothCertified:false,
  previewOnly:true,releaseAuthorized:false,familyAlpha:'HOLD'
 });
 if(!contact.unresolvedPairs)return refuse('no-contact-no-patch-required');
 const saved=firstContactPairs50.get(contact);
 if(!saved||saved.shot!==shot||saved.root!==root||saved.mesh!==mesh)
  fail('C51 first original face source provenance absent');
 if(contact.firstSourceCrossing49?.posedContactClass!==
    'strict-interior-transverse-face-crossing')
  return refuse('unverified-contact-no-connected-patch');
 const indices=shot.geo.indices,faceCount=shot.geo.faceCount,
  count=shot.geo.p.count;
 const seedFace=saved.faces[1];
 const seed=[0,1,2].map(c=>at(indices,seedFace,c));
 if(new Set(seed).size!==3)
  return refuse('source-face-degenerate-or-not-triangular');
 // Determine indexed 1-ring and all faces whose geometry would change,
 // INCLUDING faces attached by duplicated rest/skin-coincident source XYZ.
 const usedBy=Array.from({length:count},()=>[]);
 for(let face=0;face<faceCount;face++)
  for(let c=0;c<3;c++)usedBy[at(indices,face,c)].push(face);
 if(seed.every(v=>usedBy[v].length===1))
  return refuse('isolated-face-use-source-only-C50');
 const moved=new Set(seed);
 for(const v of seed){
  const twins=sourceTwinVertices51(shot,v);
  if(twins.length>maxPatchVertices)
   return refuse('source-uv-twin-evidence-exceeds-budget');
  for(const j of twins){
   if(!sourceTwinsHaveSameSkinAndRest51(shot,v,j))
    return refuse('source-uv-twins-disagree-on-rest-or-skin');
   moved.add(j);
  }
 }
 if(moved.size>maxPatchVertices)
  return refuse('connected-patch-exceeds-vertex-budget');
 const facesToCheck=new Set();
 for(const v of moved)for(const face of usedBy[v])facesToCheck.add(face);
 if(facesToCheck.size>maxPatchFaces)
  return refuse('connected-patch-exceeds-face-budget');
 // If a twin moved because a seed matched, and itself has a further
 // source-coincident vertex, require transitive closure; NEVER leave a
 // duplicate boundary behind (even with non-transitive floating tolerances).
 for(const v of moved)for(const twin of sourceTwinVertices51(shot,v))
  if(!moved.has(twin))
   return refuse('nonclosed-source-uv-twin-group');
 const baseline=seed.map(v=>new THREE.Vector3().fromArray(shot.source,3*v));
 const normal=new THREE.Vector3().subVectors(baseline[1],baseline[0])
  .cross(new THREE.Vector3().subVectors(baseline[2],baseline[0]));
 if(!Number.isFinite(normal.length())||normal.length()<1e-10)
  fail('C51 degenerate source patch normal');
 normal.normalize();
 const original=shot.source;
 const getTri=(face,coords)=>[0,1,2].map(k=>
  new THREE.Vector3().fromArray(coords,3*at(indices,face,k)));
 const quality=(coords)=>{
  let maximumEdgeStretch=0,maximumNormalTurn=0,maximumAreaChange=0;
  for(const face of facesToCheck){
   const b=getTri(face,original),a=getTri(face,coords);
   const cross=t=>new THREE.Vector3().subVectors(t[1],t[0])
    .cross(new THREE.Vector3().subVectors(t[2],t[0]));
   const n0=cross(b),n1=cross(a);
   const originalArea=n0.length(),changedArea=n1.length();
   if(!Number.isFinite(changedArea)||originalArea<1e-10||
      changedArea<1e-10)return null;
   const turn=n0.angleTo(n1)*180/Math.PI;
   const areaChange=Math.abs(changedArea/originalArea-1);
   if(!Number.isFinite(turn)||!Number.isFinite(areaChange)||
      areaChange>maxEdgeStretchRatio)return null;
   maximumNormalTurn=Math.max(maximumNormalTurn,turn);
   maximumAreaChange=Math.max(maximumAreaChange,areaChange);
   for(const [i,j] of [[0,1],[1,2],[2,0]]){
    const orig=b[i].distanceTo(b[j]),next=a[i].distanceTo(a[j]);
    if(orig<1e-10||!Number.isFinite(next))return null;
    const ratio=Math.abs(next/orig-1);
    maximumEdgeStretch=Math.max(maximumEdgeStretch,ratio);
    if(ratio>maxEdgeStretchRatio)return null;
   }
  }
  if(maximumNormalTurn>maxNormalTurnDegrees)return null;
  return {maximumNormalTurn,maximumEdgeStretch,maximumAreaChange};
 };
 let attempted=0;
 for(const offset of [.00005,.0001,.00025,.0005,.001,.002]){
  if(offset>maxShiftMeters+1e-12)continue;
  for(const direction of [1,-1]){
   attempted++;
   const staged=original.slice();
   for(const v of moved){
    staged[3*v]+=normal.x*offset*direction;
    staged[3*v+1]+=normal.y*offset*direction;
    staged[3*v+2]+=normal.z*offset*direction;
   }
   const metrics=quality(staged);
   if(!metrics)continue;
   // Require exact twin coherence in BOTH source-local and actual skinned
   // world pose, not merely a pair of similar original photos.
   const trial=captureSourceDressBodyPose40({
    root,dress,stagedPositions:staged
   }),candidate=captures.get(trial);
   if(!candidate)fail('C51 missing staged source-verified capture');
   let maximumWorldShift=0;
   for(let j=0;j<candidate.clothWorld.length;j+=3)
    maximumWorldShift=Math.max(maximumWorldShift,Math.hypot(
     candidate.clothWorld[j]-shot.clothWorld[j],
     candidate.clothWorld[j+1]-shot.clothWorld[j+1],
     candidate.clothWorld[j+2]-shot.clothWorld[j+2]));
   if(!Number.isFinite(maximumWorldShift)||
      maximumWorldShift>maxShiftMeters+1e-7)continue;
   let twinsPreserved=true;
   for(const v of moved){
    for(const twin of sourceTwinVertices51(shot,v)){
     const ia=3*v,ib=3*twin;
     if(Math.hypot(staged[ia]-staged[ib],
      staged[ia+1]-staged[ib+1],
      staged[ia+2]-staged[ib+2])>SOURCE_TWIN_EPS51||
      Math.hypot(candidate.clothWorld[ia]-candidate.clothWorld[ib],
       candidate.clothWorld[ia+1]-candidate.clothWorld[ib+1],
       candidate.clothWorld[ia+2]-candidate.clothWorld[ib+2])
       >SOURCE_TWIN_EPS51)twinsPreserved=false;
    }
   }
   if(!twinsPreserved)continue;
   let self,body;
   try{
    self=auditSourceDressSelfContact44({root,dress,poseToken:trial,
     maxSourceFaces,maxTriangleCandidates,toleranceMeters});
    if(!self.completeNonadjacentFaceAudit||
       self.checkedOriginalFaces!==self.originalFaceCount||
       self.unresolvedPairs!==0)continue;
    body=auditMovingSourceDressBodySurfaces40({
     root,dress,startPose:poseToken,endPose:trial,
     maxClothFaces:maxSourceFaces,maxBodyFaces,
     maxTriangleCandidates,maxClothShiftMeters:.025,
     paddingMeters:toleranceMeters
    });
    if(!body.wholeGarmentFacesExamined||
       !body.fullBodyFacesExamined||body.potentialPairs!==0)continue;
   }catch{
    continue; // a resource, geometric, or pose failure is always a veto
   }
   checkTopology(shot);
   root.updateMatrixWorld(true);
   if(!same(sourcePose(mesh,shot.source),shot.clothWorld))
    fail('C51 original source pose changed during connected patch audit');
   const proposalToken=Object.freeze({});
   stagedProposals50.set(proposalToken,{root,mesh,shot,staged,used:false});
   return Object.freeze({
    schema:'M2-source-dress-connected-patch-C51',
    status:'staged-connected-patch-preview-only',
    attemptedCandidates:attempted,proposalToken,
    patchVertexCount:moved.size,affectedSourceFaces:facesToCheck.size,
    sourceFaceCountAudited:self.checkedOriginalFaces,
    bodyFaceCountAudited:body.bodyFaces,
    originalSourcePhotoMappingAndSkinImmutable:true,
    realOriginalSourceAndSkinChecked:true,
    maximumSourceShiftMeters:offset,
    maximumWorldShiftMeters:maximumWorldShift,
    maximumAffectedFaceNormalTurnDegrees:metrics.maximumNormalTurn,
    maximumAffectedEdgeStretchRatio:metrics.maximumEdgeStretch,
    maximumAffectedFaceAreaChangeRatio:metrics.maximumAreaChange,
    maxAllowedEdgeStretchRatio:maxEdgeStretchRatio,
    maxAllowedNormalTurnDegrees:maxNormalTurnDegrees,
    allOriginalPhotoSourceTrianglesAudited:true,
    allOriginal163BoneBodyFacesBroadphaseChecked:true,
    remainingSelfContactPairs:0,bodySweptPotentialPairs:0,
    coincidentSourceUVVerticesMovedTogether:true,
    completeClothAndBodyClearance:true,
    photoUVRestSkeletonPreserved:true,
    repairCommitted:false,independentSourceSeamReviewed:false,
    actualContinuousClothCertified:false,
    previewOnly:true,releaseAuthorized:false,familyAlpha:'HOLD'
   });
  }
 }
 return refuse('bounded-connected-patch-not-cleared',attempted);
}

/** Shares the same one-shot private source-bound capture as P2-C50. */
export function captureSourceDressConnectedPatchPreview51(args={}){
 return captureSourceDressRepairPreview50(args);
}

/**
 * Mission 2 P2-C46 — self-contact during REAL original-skinned cloth motion.
 *
 * C45 checks a single actual source garment pose; two safe endpoints do not
 * rule out cloth-fold collisions at an intermediate garment-bone pose. This
 * 17/33 grid independently audits each source-verified original garment pose
 * and bounds observed garment WORLD vertex motion per sampled interval.
 *
 * A first ambiguous seam/crossing is sufficient for a NEGATIVE early veto:
 * reported incomplete evidence is NEVER promoted to full acceptance. A
 * positive research-only result requires every pose to have a COMPLETE C45
 * scan, with no contact, with original source/photo/skin unchanged. No sampled
 * sequence can certify unsampled nonlinear cloth dynamics or human seam IDs.
 */
export function auditSourceDressTemporalSelfContact46({
 root,dress,poseTokens,startPositions,endPositions,
 maxPoseSamples=33,maxVertexStepMeters=.08,
 maxSourceFaces=100000,maxTriangleCandidatesPerPose=300000,
 toleranceMeters=.00002
}={}){
 const mesh=validateRootDress(root,dress);
 if(!Array.isArray(poseTokens)||(poseTokens.length!==17&&poseTokens.length!==33)||
   !Number.isSafeInteger(maxPoseSamples)||maxPoseSamples<17||
   maxPoseSamples>33||poseTokens.length>maxPoseSamples||
   new Set(poseTokens).size!==poseTokens.length||
   !Number.isFinite(maxVertexStepMeters)||
   maxVertexStepMeters<=0||maxVertexStepMeters>.1||
   !Number.isSafeInteger(maxSourceFaces)||maxSourceFaces<1||
   maxSourceFaces>200000||
   !Number.isSafeInteger(maxTriangleCandidatesPerPose)||
   maxTriangleCandidatesPerPose<1||
   maxTriangleCandidatesPerPose>2000000||
   !Number.isFinite(toleranceMeters)||toleranceMeters<0||
   toleranceMeters>.002||
   !(startPositions instanceof Float32Array||startPositions instanceof Float64Array)||
   !(endPositions instanceof Float32Array||endPositions instanceof Float64Array)||
   !finite(startPositions)||!finite(endPositions))
  fail('C46 complete 17/33 authentic garment poses and bounded contact checks required');
 const frames=poseTokens.map(t=>captures.get(t));
 const n=frames.length,step=1/(n-1);
 const first=frames[0],last=frames.at(-1);
 if(!first||!last||first.root!==root||last.root!==root||
    !same(first.clothSource,startPositions)||
    !same(last.clothSource,endPositions))
  fail('C46 original photographed source XYZ endpoints not matched');
 let sampledClothMoveIntervals=0,maxObservedVertexStepMeters=0;
 for(let i=0;i<n;i++){
  const current=frames[i];
  if(!current||current.root!==root||current.mesh!==mesh||
     !Number.isFinite(current.poseFraction)||
     Math.abs(current.poseFraction-i*step)>1e-10||
     !same(current.source,first.source)||
     !same(current.clothIndex??[],first.clothIndex??[])||
     current.clothWorld.length!==first.clothWorld.length||
     current.bodies.length!==first.bodies.length||
     current.bodies.some((b,j)=>b.mesh!==first.bodies[j].mesh))
   fail('C46 missing uniform independent photo/skin/source cloth pose');
  if(i){
   let moved=false;
   const before=frames[i-1].clothWorld,after=current.clothWorld;
   for(let j=0;j<before.length;j+=3){
    const shift=Math.hypot(after[j]-before[j],after[j+1]-before[j+1],
     after[j+2]-before[j+2]);
    if(!Number.isFinite(shift)||shift>maxVertexStepMeters+1e-7)
     fail('C46 excessive undersampled actual fabric vertex displacement');
    maxObservedVertexStepMeters=Math.max(maxObservedVertexStepMeters,shift);
    if(shift>1e-6)moved=true;
   }
   if(moved)sampledClothMoveIntervals++;
  }
 }
 if(!sampledClothMoveIntervals)
  fail('C46 genuine physically posed source garment motion required');
 let posesChecked=0,checkedOriginalFaces=0,
  candidateTriangles=0,firstUnresolvedSampleIndex=null,
  unresolvedKind=null,firstUnresolvedBoundary48=null,
  firstUnresolvedCrossing49=null,completeSequence=true;
 for(let i=0;i<n;i++){
  const r=auditSourceDressFastSelfContact45({
   root,dress,poseToken:poseTokens[i],
   maxSourceFaces,maxTriangleCandidates:maxTriangleCandidatesPerPose,
   toleranceMeters
  });
  posesChecked++;
  checkedOriginalFaces+=r.checkedOriginalFaces;
  candidateTriangles+=r.candidateTriangles;
  if(r.unresolvedPairs){
   if(r.unresolvedPairs!==1||!r.stoppedEarlyToRefuse||
      r.completeSourceSelfContactAudit||
      !r.firstUnresolvedContactKind)
    fail('C46 first observed seam/fold contact cannot be reported as clearance');
   firstUnresolvedSampleIndex=i;
   unresolvedKind=r.firstUnresolvedContactKind;
   firstUnresolvedBoundary48=r.firstSourceBoundary48;
   firstUnresolvedCrossing49=r.firstSourceCrossing49;
   completeSequence=false;
   break;
  }
  if(!r.completeSourceSelfContactAudit||
     r.checkedOriginalFaces!==r.originalFaceCount||
     r.unresolvedPairs!==0)
   fail('C46 incomplete original garment self-contact phase');
 }
 if(completeSequence&&posesChecked!==n)
  fail('C46 missing original garment motion frame');
 const receipt=Object.freeze({
  schema:'M2-source-dress-temporal-self-contact-v1',
  originalSourceAndSkinVerified:true,
  independentSkinnedClothPoseGrid:true,
  completeUniformPoseGrid:true,
  poseSamples:n,posesChecked,
  fullSequenceAudited:completeSequence,
  stoppedAtFirstUnresolvedContact:!completeSequence,
  firstUnresolvedSampleIndex,unresolvedKind,firstUnresolvedBoundary48,
  firstUnresolvedCrossing49,unresolvedContacts:completeSequence?0:1,
  sampledClothMoveIntervals,
  maxObservedVertexStepMeters,
  maxAllowedVertexStepMeters:maxVertexStepMeters,
  originalSourceFaces:first.geo.faceCount,
  checkedOriginalFaces,candidateTriangles,
  disconnectedSeamsRemainUnresolved:true,
  noOriginalPhotographOrSkinChanges:true,
  actualContinuousSelfContactCertified:false,
  inferredRearHumanVerified:false,
  realClothPhysics:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
 registerSourceDressTemporalReceipt46({receipt,root,mesh,
  startPositions,endPositions});
 return receipt;
}
export function assertSourceDressTemporalSelfContact46(receipt){
 if(!isAuthenticSourceDressTemporalReceipt46(receipt))
  fail('C46 cloned or invented garment contact evidence is not authentic');
 if(receipt?.schema!=='M2-source-dress-temporal-self-contact-v1'||
    receipt.originalSourceAndSkinVerified!==true||
    receipt.independentSkinnedClothPoseGrid!==true||
    receipt.completeUniformPoseGrid!==true||
    (receipt.poseSamples!==17&&receipt.poseSamples!==33)||
    !Number.isSafeInteger(receipt.posesChecked)||
    receipt.posesChecked<1||receipt.posesChecked>receipt.poseSamples||
    !Number.isSafeInteger(receipt.sampledClothMoveIntervals)||
    receipt.sampledClothMoveIntervals<1||
    receipt.sampledClothMoveIntervals>=receipt.poseSamples||
    !Number.isFinite(receipt.maxObservedVertexStepMeters)||
    !Number.isFinite(receipt.maxAllowedVertexStepMeters)||
    receipt.maxObservedVertexStepMeters<0||
    receipt.maxObservedVertexStepMeters>receipt.maxAllowedVertexStepMeters+1e-7||
    !Number.isSafeInteger(receipt.originalSourceFaces)||
    receipt.originalSourceFaces<1||
    !Number.isSafeInteger(receipt.checkedOriginalFaces)||
    receipt.checkedOriginalFaces<1||
    !Number.isSafeInteger(receipt.candidateTriangles)||
    receipt.candidateTriangles<0||
    receipt.disconnectedSeamsRemainUnresolved!==true||
    receipt.noOriginalPhotographOrSkinChanges!==true||
    receipt.actualContinuousSelfContactCertified!==false||
    receipt.inferredRearHumanVerified!==false||
    receipt.realClothPhysics!==false||
    receipt.releaseAuthorized!==false||receipt.familyAlpha!=='HOLD')
  fail('C46 invalid, partial or fabricated source cloth motion audit');
 if(receipt.unresolvedContacts){
  if(receipt.unresolvedContacts!==1||
     receipt.fullSequenceAudited!==false||
     receipt.stoppedAtFirstUnresolvedContact!==true||
     !Number.isSafeInteger(receipt.firstUnresolvedSampleIndex)||
     receipt.firstUnresolvedSampleIndex<0||
     receipt.posesChecked!==receipt.firstUnresolvedSampleIndex+1||
     receipt.firstUnresolvedBoundary48?.schema!=='M2-first-source-contact-topology-C48'||
     receipt.firstUnresolvedCrossing49?.schema!=='M2-first-source-contact-geometry-C49'||
     receipt.firstUnresolvedCrossing49?.firstContactRemainsHardVeto!==true||
     receipt.firstUnresolvedBoundary48?.allowedToExcludeFromCollision!==false||
     !['unresolved-coplanar-or-disconnected-seam',
       'unresolved-spatial-triangle-contact'].includes(receipt.unresolvedKind))
   fail('C46 inconsistent original seam/fold refusal witness');
  fail('C46 real intermediate cloth fold or unverified seam refused');
 }
 if(receipt.unresolvedContacts!==0||
    receipt.fullSequenceAudited!==true||
    receipt.stoppedAtFirstUnresolvedContact!==false||
    receipt.posesChecked!==receipt.poseSamples||
    receipt.checkedOriginalFaces!==
      receipt.poseSamples*receipt.originalSourceFaces||
    receipt.firstUnresolvedSampleIndex!==null||
    receipt.firstUnresolvedBoundary48!==null||
    receipt.firstUnresolvedCrossing49!==null||
    receipt.unresolvedKind!==null)
  fail('C46 missing independently inspected original garment poses');
 return Object.freeze({
  researchOnly:true,
  everySampledSourceGarmentPoseClear:true,
  noContinuousClothPhysicsCertificate:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}

