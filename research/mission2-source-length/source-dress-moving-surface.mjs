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
    world:sourcePose(body,sourceBody)});
 }
 const token=Object.freeze({});
 captures.set(token,{root,mesh,geo,source,clothSource,clothWorld,
  bodies:capturesBody,clothIndex:geo.indices?.slice()??null});
 return token;
}
const checkTopology=(record)=>{
 const {mesh,geo,source,bodies}=record;
 const p=mesh.geometry?.getAttribute('position');
 if(mesh.geometry!==geo.geometry||p!==geo.p||
    !same(p.array,source)||mesh.geometry.index!==geo.indexField||
    (geo.indices&&!same(mesh.geometry.index.array,geo.indices))||
    (!geo.indices&&mesh.geometry.index))
  fail('stale or altered original photographed source surface');
 for(const b of bodies){
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
