/**
 * Closet Current Mission 2 P2-C39 — bounded, source-verified research audit:
 * straight trajectories of changed original garment vertices vs TRIANGLES
 * of the actual 163-bone body at ONE fixed sampled skeleton pose.
 *
 * Unlike end-pose intersection testing, this catches vertex tunneling through
 * a static posed body triangle between two phase samples. It does NOT test
 * swept garment faces/edges, a moving body, between-frame changing skeleton
 * transforms, existing containment, self/layer contact or physical cloth.
 * It cannot certify a garment, a user, release, or 10/10 photo fidelity.
 * No positions, owner IDs, source pixels, UV or private photo data are returned.
 */
import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const fail=message=>{throw Error('M2 C39 swept source-body '+message);};
const finite=v=>Number.isFinite(v);
function worldPosedMeshGeometry(mesh){
 const source=mesh.geometry?.getAttribute('position');
 if(!source?.isBufferAttribute||source.itemSize!==3||source.count<3)
  fail('body posed triangles require complete source positions');
 const id=mesh.geometry.index,faces=id?id.count/3:source.count/3;
 if(!Number.isSafeInteger(faces)||faces<1)fail('body posed indexed faces invalid');
 const coords=new Float32Array(source.count*3),v=new THREE.Vector3();
 mesh.updateWorldMatrix(true,false);
 mesh.skeleton.update();
 for(let i=0;i<source.count;i++){
  v.fromBufferAttribute(source,i);
  mesh.applyBoneTransform(i,v);
  v.applyMatrix4(mesh.matrixWorld);
  if(!v.toArray().every(finite))fail('body posed vertex nonfinite');
  v.toArray(coords,i*3);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(coords,3));
 if(id)g.setIndex(id.clone());
 g.computeBoundingBox();
 return {geometry:g,faces};
}
export function auditSourceDressSweptBody39({
 root,dress,startPositions,endPositions,
 maxMovedVertices=80000,maxBodyTriangles=500000,
 maxTriangleCandidates=400000,maxCrossedSegments=20000,
 maxSegmentMeters=.025
}={}){
 const mesh=dress?.mesh,p=mesh?.geometry?.getAttribute('position');
 if(!root?.isObject3D||!mesh?.isSkinnedMesh||!p?.isBufferAttribute||
    p.itemSize!==3||mesh.skeleton?.bones?.length!==163||
    dress.stats?.sourceId!=='commons-0053'||
    dress.stats?.sourceSHA256!==SHA||
    dress.stats?.photographedDressDrape61!==true||
    dress.stats?.releaseAuthorized!==false||
    dress.stats?.collisionValidated!==false||
    !(startPositions instanceof Float32Array||startPositions instanceof Float64Array)||
    !(endPositions instanceof Float32Array||endPositions instanceof Float64Array)||
    startPositions.length!==p.count*3||endPositions.length!==p.count*3||
    !startPositions.every(finite)||!endPositions.every(finite)||
    !Number.isSafeInteger(maxMovedVertices)||maxMovedVertices<1||maxMovedVertices>200000||
    !Number.isSafeInteger(maxBodyTriangles)||maxBodyTriangles<1||maxBodyTriangles>1000000||
    !Number.isSafeInteger(maxTriangleCandidates)||maxTriangleCandidates<1||maxTriangleCandidates>2000000||
    !Number.isSafeInteger(maxCrossedSegments)||maxCrossedSegments<1||maxCrossedSegments>50000||
    !finite(maxSegmentMeters)||maxSegmentMeters<=0||maxSegmentMeters>.05)
  fail('signed, bounded, complete original 163-bone source and segment inputs required');
 // Do not admit a stale/foreign start buffer: it must be the current REAL
 // source surface, not arbitrary coordinates supplied in a successful receipt.
 for(let j=0;j<startPositions.length;j++)
  if(startPositions[j]!==p.array[j])fail('stale or foreign source start positions');
 root.updateMatrixWorld(true);
 mesh.updateWorldMatrix(true,false);
 mesh.skeleton.update();
 if(!mesh.matrixWorld.elements.every(finite)||
    !finite(mesh.matrixWorld.determinant())||
    mesh.matrixWorld.determinant()<=1e-10)
  fail('invalid original source world transform');
 const bodies=[];
 root.traverse(object=>{
  if(object!==mesh&&object.isSkinnedMesh&&
     !object.userData?.work56Garment&&object.skeleton?.bones?.length===163)
   bodies.push(object);
 });
 if(!bodies.length)fail('no genuine 163-bone static posed body triangles');
 const scenes=[];
 let bodyTriangles=0,movedVertices=0,candidateTriangles=0,
  crossedSegments=0,maxObservedSegmentMeters=0;
 const a=new THREE.Vector3(),b=new THREE.Vector3(),delta=new THREE.Vector3(),
  ray=new THREE.Ray(),hit=new THREE.Vector3(),segmentBox=new THREE.Box3();
 try{
  for(const body of bodies){
   const {geometry,faces}=worldPosedMeshGeometry(body);
   bodyTriangles+=faces;
   if(bodyTriangles>maxBodyTriangles){
    geometry.dispose();
    fail('body face verification budget exceeded');
   }
   try{
    scenes.push({geometry,tree:new MeshBVH(geometry,{indirect:true})});
   }catch(error){geometry.dispose();throw error;}
  }
  for(let i=0;i<p.count;i++){
   const j=i*3;
   if(startPositions[j]===endPositions[j]&&
      startPositions[j+1]===endPositions[j+1]&&
      startPositions[j+2]===endPositions[j+2])continue;
   movedVertices++;
   if(movedVertices>maxMovedVertices)fail('changed source vertex budget exceeded');
   a.fromArray(startPositions,j);
   b.fromArray(endPositions,j);
   // Transform both using the exact same CURRENT skeletal pose. This
   // intentionally does not pretend to interpolate a changing body skeleton.
   mesh.applyBoneTransform(i,a);
   mesh.applyBoneTransform(i,b);
   a.applyMatrix4(mesh.matrixWorld);b.applyMatrix4(mesh.matrixWorld);
   if(!a.toArray().every(finite)||!b.toArray().every(finite))
    fail('nonfinite skinned source trajectory');
   delta.subVectors(b,a);
   const length=delta.length();
   if(!finite(length)||length>maxSegmentMeters+1e-7)
    fail('physical source trajectory exceeds bounded single-step limit');
   maxObservedSegmentMeters=Math.max(maxObservedSegmentMeters,length);
   if(length<1e-9)continue;
   ray.origin.copy(a);ray.direction.copy(delta).multiplyScalar(1/length);
   segmentBox.makeEmpty().expandByPoint(a).expandByPoint(b);
   let crossed=false,overflow=false;
   for(const {tree} of scenes){
    if(crossed||overflow)break;
    tree.shapecast({
     intersectsBounds:box=>box.intersectsBox(segmentBox),
     intersectsTriangle:tri=>{
      candidateTriangles++;
      if(candidateTriangles>maxTriangleCandidates){overflow=true;return true;}
      if(!ray.intersectTriangle(tri.a,tri.b,tri.c,false,hit))return false;
      const distance=hit.distanceTo(a);
      if(distance<=length+1e-7){crossed=true;return true;}
      return false;
     }
    });
   }
   if(overflow)fail('triangle candidate budget exceeded; cannot certify');
   if(crossed){
    crossedSegments++;
    if(crossedSegments>=maxCrossedSegments)
     fail('crossing count budget reached; cannot certify');
   }
  }
  return Object.freeze({
   schema:'M2-source-dress-swept-vertex-body-v1',
   sourceVerified:true,
   completeBoundedSweep:true,
   bodyMeshCount:scenes.length,bodyTriangles,
   movedVertices,candidateTriangles,crossedSegments,
   maxObservedSegmentMeters,
   staticBodyPoseOnly:true,changedSourceVertexSegmentsOnly:true,
   sourcePhotoAndSkinUnmodified:true,
   movingBodyTested:false,sweptFabricTrianglesTested:false,
   selfLayerCollisionTested:false,initialContainmentCertified:false,
   continuousCollisionCertified:false,realClothPhysics:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }finally{
  for(const scene of scenes)scene.geometry.dispose();
 }
}
/**
 * Reject an unsafe P39 research-phase sample before any source buffer commit.
 * Even a zero-crossing result never authorizes 3D release or full safety.
 */
export function assertSourceDressSweptBody39(receipt){
 if(receipt?.schema!=='M2-source-dress-swept-vertex-body-v1'||
    receipt.sourceVerified!==true||receipt.completeBoundedSweep!==true||
    receipt.bodyMeshCount<1||receipt.bodyTriangles<1||
    !Number.isSafeInteger(receipt.crossedSegments)||
    receipt.crossedSegments<0||
    receipt.continuousCollisionCertified!==false||
    receipt.releaseAuthorized!==false||
    receipt.familyAlpha!=='HOLD')
  fail('unverified or incomplete collision evidence cannot admit research motion');
 if(receipt.crossedSegments!==0)fail('sampled source trajectory crosses body surface');
 return Object.freeze({researchSampleOnly:true,crossingVetoPassed:true,
  wholeClothSafe:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
