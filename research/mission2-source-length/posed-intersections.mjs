/** Real posed triangle intersection diagnostic. Does not prove signed clearance or swept collision. */
import * as THREE from 'three';
import {MeshBVH} from '../../node_modules/three-mesh-bvh/build/index.module.js';
function posedGeometry(mesh,override){
 const p=mesh.geometry?.getAttribute('position');
 if(!p||p.count<3||!mesh.geometry.index&&p.count%3)throw Error('M2 indexed posed triangle surface required');
 const array=new Float32Array(p.count*3),v=new THREE.Vector3();
 mesh.updateWorldMatrix(true,false);mesh.skeleton?.update();
 for(let i=0;i<p.count;i++){
  override?v.fromArray(override,i*3):v.fromBufferAttribute(p,i);
  if(mesh.isSkinnedMesh)mesh.applyBoneTransform(i,v);
  v.applyMatrix4(mesh.matrixWorld);
  if(!v.toArray().every(Number.isFinite))throw Error('M2 nonfinite posed triangle');
  v.toArray(array,i*3);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(array,3));
 if(mesh.geometry.index)g.setIndex(mesh.geometry.index.clone());
 g.computeBoundingBox();return g;
}
export function createPosedBodyIntersectionAudit(root){
 const bodies=[];
 root.updateMatrixWorld(true);
 root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData?.work56Garment&&o.skeleton?.bones?.length===163){
  const geometry=posedGeometry(o);geometry.boundsTree=new MeshBVH(geometry);bodies.push(geometry);
 }});
 if(!bodies.length)throw Error('M2 actual 163-bone body triangles required');
 return {measure(meshes,overrides=new Map()){
  let testedPairs=0,intersectingPairs=0;
  for(const mesh of meshes){const g=posedGeometry(mesh,overrides.get(mesh));
   g.boundsTree=new MeshBVH(g);
   for(const body of bodies){testedPairs++;
    if(body.boundingBox.intersectsBox(g.boundingBox)&&body.boundsTree.intersectsGeometry(g,new THREE.Matrix4()))intersectingPairs++;
   }
   g.dispose();
  }
  return Object.freeze({testedPairs,intersectingPairs,posedTriangleAudit:true,
   signedClearanceVerified:false,continuousCollisionVerified:false});
 },dispose(){bodies.forEach(g=>g.dispose());}};
}


/**
 * P2-C1: count actual posed body/garment triangle contacts, not just binary
 * mesh pairs. Old mesh-pair witness can remain 3 -> 3 while dozens of NEW
 * triangle penetrations appear. All coordinates are staged, world-space copies.
 *
 * The caller must verify the source/owner and decide whether to veto NEW
 * contacts. This samples only the current pose; it does not prove interior
 * containment, swept motion, self/layer collision, contact normals, or physics.
 */
export function measurePosedTriangleContacts(root,meshes,overrides=new Map(),{maxContacts=40000}={}){
 if(!Number.isInteger(maxContacts)||maxContacts<1||maxContacts>100000||
    !Array.isArray(meshes)||!meshes.length||new Set(meshes).size!==meshes.length||
    !(overrides instanceof Map)||typeof root?.traverse!=='function')
  throw Error('M2 triangle audit bounded valid pose inputs required');
 root.updateMatrixWorld(true);
 const bodyMeshes=[];
 root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData?.work56Garment&&o.skeleton?.bones?.length===163)
  bodyMeshes.push(o);});
 if(!bodyMeshes.length)throw Error('M2 triangle audit 163-bone body required');
 const bodies=[],contactKeys=new Set(),identity=new THREE.Matrix4();
 let testedMeshPairs=0,intersectingMeshPairs=0,stop=false;
 try{
  for(const body of bodyMeshes){
   const geometry=posedGeometry(body);
   geometry.boundsTree=new MeshBVH(geometry,{indirect:true});
   bodies.push(geometry);
  }
  for(let garmentIndex=0;garmentIndex<meshes.length;garmentIndex++){
   const garment=meshes[garmentIndex];
   if(!garment?.isSkinnedMesh||garment.skeleton?.bones?.length!==163)
    throw Error('M2 triangle audit source garment must be 163-bone skinned');
   const override=overrides.get(garment),original=garment.geometry.getAttribute('position');
   if(override&&(!(override instanceof Float32Array||override instanceof Float64Array)||
       override.length!==original.count*3||!override.every(Number.isFinite)))
    throw Error('M2 triangle audit finite staged vertex buffer required');
   const g=posedGeometry(garment,override);
   try{
    g.boundsTree=new MeshBVH(g,{indirect:true});
    for(let bodyIndex=0;bodyIndex<bodies.length;bodyIndex++){
     const body=bodies[bodyIndex];
     testedMeshPairs++;
     if(!body.boundingBox.intersectsBox(g.boundingBox))continue;
     let hit=false;
     body.boundsTree.bvhcast(g.boundsTree,identity,{
      intersectsTriangles:(bodyTri,garmentTri,bodyId,garmentId)=>{
       if(!bodyTri.intersectsTriangle(garmentTri))return false;
       hit=true;
       // v0.9.2 bvhcast reports indirect TREE offsets, not source faces.
       // Resolve both sides so before/after identity survives BVH rebuilding.
       const garmentFace=g.boundsTree.resolveTriangleIndex(garmentId);
       const bodyFace=body.boundsTree.resolveTriangleIndex(bodyId);
       contactKeys.add(garmentIndex+':'+bodyIndex+':'+garmentFace+':'+bodyFace);
       if(contactKeys.size>=maxContacts){stop=true;return true;}
       return false; // enumerate ALL contacts, do not stop at the first one
      }
     });
     if(hit)intersectingMeshPairs++;
     if(stop)throw Error('M2 triangle audit exceeds bounded contact budget; cannot certify');
    }
   }finally{g.dispose();}
  }
  return Object.freeze({
   triangleContactKeys:Object.freeze([...contactKeys].sort()),
   triangleContactCount:contactKeys.size,testedMeshPairs,intersectingMeshPairs,
   currentPoseOnly:true,bodyRebuiltAtMeasurement:true,contactBudget:maxContacts,
   collisionCertified:false,fullSelfLayerCollision:false
  });
 }finally{for(const g of bodies)g.dispose();}
}
export function comparePosedTriangleContacts(before,after){
 if(!Array.isArray(before?.triangleContactKeys)||!Array.isArray(after?.triangleContactKeys))
  throw Error('M2 complete triangle-contact evidence required');
 const a=new Set(before.triangleContactKeys),b=new Set(after.triangleContactKeys);
 if(a.size!==before.triangleContactCount||b.size!==after.triangleContactCount)
  throw Error('M2 duplicate or mismatched triangle contacts cannot certify');
 let newlyIntersecting=0,removedIntersections=0;
 for(const k of b)if(!a.has(k))newlyIntersecting++;
 for(const k of a)if(!b.has(k))removedIntersections++;
 return Object.freeze({before:before.triangleContactCount,after:after.triangleContactCount,
  newlyIntersecting,removedIntersections,nonregression:newlyIntersecting===0,
  sampledPoseOnly:true,releaseAuthorized:false});
}


/**
 * M2-C3 research: actual posed triangle intersections BETWEEN distinct
 * skinned parts of the photographed garment (e.g. shoulder caps and torso).
 * Counts identity-stable contacts before/after staging; old sewn/seam contacts
 * are NOT proof of safety. Excludes within-one-mesh self-intersections, outer
 * clothing layers, interior containment, or swept poses.
 */
export function measurePosedGarmentPartContacts(root,meshes,overrides=new Map(),{maxContacts=40000}={}){
 if(!Number.isInteger(maxContacts)||maxContacts<1||maxContacts>100000||
    !Array.isArray(meshes)||meshes.length<1||new Set(meshes).size!==meshes.length||
    !(overrides instanceof Map)||typeof root?.updateMatrixWorld!=='function'||
    [...overrides.keys()].some(m=>!meshes.includes(m)))
  throw Error('M2 garment part audit bounded valid pose inputs required');
 root.updateMatrixWorld(true);
 const geometries=[],contactKeys=new Set(),identity=new THREE.Matrix4();
 let testedMeshPairs=0,intersectingMeshPairs=0;
 try{
  for(const mesh of meshes){
   if(!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163)
    throw Error('M2 garment part audit 163-bone source mesh required');
   const original=mesh.geometry?.getAttribute('position'),override=overrides.get(mesh);
   if(override&&(!(override instanceof Float32Array||override instanceof Float64Array)||
       override.length!==original?.count*3||!override.every(Number.isFinite)))
    throw Error('M2 garment part audit finite staged vertex buffer required');
   const g=posedGeometry(mesh,override);
   g.boundsTree=new MeshBVH(g,{indirect:true});
   geometries.push(g);
  }
  for(let left=0;left<geometries.length;left++)
   for(let right=left+1;right<geometries.length;right++){
    const a=geometries[left],c=geometries[right];
    testedMeshPairs++;
    if(!a.boundingBox.intersectsBox(c.boundingBox))continue;
    let hit=false,overflow=false;
    a.boundsTree.bvhcast(c.boundsTree,identity,{
     intersectsTriangles:(leftTri,rightTri,leftId,rightId)=>{
      if(!leftTri.intersectsTriangle(rightTri))return false;
      hit=true;
      const sourceLeft=a.boundsTree.resolveTriangleIndex(leftId);
      const sourceRight=c.boundsTree.resolveTriangleIndex(rightId);
      contactKeys.add(left+':'+right+':'+sourceLeft+':'+sourceRight);
      if(contactKeys.size>=maxContacts){overflow=true;return true;}
      return false;
     }
    });
    if(hit)intersectingMeshPairs++;
    if(overflow)throw Error('M2 garment part audit exceeds bounded contact budget; cannot certify');
   }
  return Object.freeze({
   triangleContactKeys:Object.freeze([...contactKeys].sort()),
   triangleContactCount:contactKeys.size,testedMeshPairs,intersectingMeshPairs,
   currentPoseOnly:true,bodyRebuiltAtMeasurement:false,contactBudget:maxContacts,
   distinctGarmentPartsOnly:true,collisionCertified:false,fullSelfLayerCollision:false
  });
 }finally{for(const geometry of geometries)geometry.dispose();}
}


/**
 * M2-C4: bounded one-pose intrapanel surface-intersection audit.
 * A mesh is checked against itself with the *actual* posed, 163-bone skinned
 * triangle coordinates. The same triangle and triangles sharing ORIGINAL
 * topology vertices are excluded: a sewn/shared edge is not a fold crossing.
 * Split-vertex seams can still contribute baseline contacts; baseline identity
 * comparison is deliberately stricter than a mere total-contact count.
 *
 * This is NOT cloth physics, signed clearance, motion-sweep coverage or
 * inter-layer acceptance. On incomplete enumeration we refuse certification.
 */
export function measurePosedGarmentSelfContacts(root,meshes,overrides=new Map(),
 {maxContacts=40000,maxCandidateTests=300000}={}){
 if(typeof root?.updateMatrixWorld!=='function'||!Array.isArray(meshes)||meshes.length<1||
    new Set(meshes).size!==meshes.length||!(overrides instanceof Map)||
    [...overrides.keys()].some(mesh=>!meshes.includes(mesh))||
    !Number.isInteger(maxContacts)||maxContacts<1||maxContacts>100000||
    !Number.isInteger(maxCandidateTests)||maxCandidateTests<1||maxCandidateTests>2000000)
  throw Error('M2 self-contact bounded valid pose inputs required');
 root.updateMatrixWorld(true);
 const identity=new THREE.Matrix4(),contactKeys=new Set();
 let candidateTests=0,triangleSurfaces=0,duplicateCandidateCallbacksSkipped=0;
 for(let meshIndex=0;meshIndex<meshes.length;meshIndex++){
  const mesh=meshes[meshIndex];
  if(!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163)
   throw Error('M2 self-contact actual 163-bone garment required');
  const position=mesh.geometry?.getAttribute('position'),override=overrides.get(mesh);
  if(override&&(!(override instanceof Float32Array||override instanceof Float64Array)||
      override.length!==position?.count*3||!override.every(Number.isFinite)))
   throw Error('M2 self-contact finite staged vertex buffer required');
  const g=posedGeometry(mesh,override);
  try{
   const index=g.index?.array;
   const faceCount=index?index.length/3:g.getAttribute('position').count/3;
   if(!Number.isInteger(faceCount)||faceCount<1||faceCount>3000000)
    throw Error('M2 self-contact triangular surface required');
   triangleSurfaces+=faceCount;
   // A full self-cast visits each unrelated pair in both orientations.
   // Unique source-face keys avoid twice the expensive triangle test and
   // count one prospective contact once. At most the bounded budget is kept.
   const seenCandidatePairs=new Set();
   const vertex=(face,corner)=>index?index[face*3+corner]:face*3+corner;
   const adjacent=(one,two)=>{
    for(let j=0;j<3;j++)for(let k=0;k<3;k++)
     if(vertex(one,j)===vertex(two,k))return true;
    return false;
   };
   // three-mesh-bvh rejects some indexed recursive self-casts; build
   // two independent immutable geometry/BVH views with identical face IDs.
   const other=g.clone();
   let overflowReason=null;
   try{
    g.boundsTree=new MeshBVH(g,{indirect:true});
    other.boundsTree=new MeshBVH(other,{indirect:true});
    g.boundsTree.bvhcast(other.boundsTree,identity,{
     intersectsTriangles:(a,c,aId,cId)=>{
     // Both BVHs sort faces independently; callback IDs are tree offsets.
     // Never infer topology or persistent contact identity from those IDs.
     const sourceA=g.boundsTree.resolveTriangleIndex(aId);
     const sourceC=other.boundsTree.resolveTriangleIndex(cId);
     if(sourceA===sourceC||adjacent(sourceA,sourceC))return false;
     const min=Math.min(sourceA,sourceC),max=Math.max(sourceA,sourceC);
     const pairKey=min*faceCount+max; // safe with faceCount <= 3 million
     if(seenCandidatePairs.has(pairKey)){duplicateCandidateCallbacksSkipped++;return false;}
     seenCandidatePairs.add(pairKey);
     candidateTests++;
     if(candidateTests>maxCandidateTests){overflowReason='triangle comparison';return true;}
     if(!a.intersectsTriangle(c))return false;
     contactKeys.add(meshIndex+':'+min+':'+max);
     if(contactKeys.size>=maxContacts){overflowReason='contact';return true;}
      return false;
     }
    });
    // Never throw INSIDE bvhcast: v0.9.2 does not reset its global
    // active-traversal guard when callbacks throw. Return true to stop,
    // then fail closed only after the library has released its guard.
    if(overflowReason)throw Error('M2 self-contact exceeds bounded '+overflowReason+' budget; cannot certify');
   }finally{other.dispose();}
  }finally{g.dispose();}
 }
 return Object.freeze({
  triangleContactKeys:Object.freeze([...contactKeys].sort()),
  triangleContactCount:contactKeys.size,
  candidateTests,triangleSurfaces,duplicateCandidateCallbacksSkipped,
  uniqueSourceTriangleCandidateBudget:true,
  currentPoseOnly:true,
  withinOneMeshOnly:true,
  excludedOriginalSharedVertexPairs:true,
  signedClearanceVerified:false,
  collisionCertified:false,fullSelfLayerCollision:false
 });
}


/**
 * P2-C5: privacy-safe *counts* from exact source-face body/garment contacts.
 * No owner IDs, garment photos, body vertex coordinates, source RGB or masks.
 * Body mesh order is only diagnostic within the same sampled donor scene.
 * A contact means surface triangles intersect/touch, NOT signed penetration.
 */
export function summarizePosedBodyContactDistribution(evidence,garmentMeshCount){
 if(!Number.isSafeInteger(garmentMeshCount)||garmentMeshCount<1||garmentMeshCount>128||
   !Array.isArray(evidence?.triangleContactKeys)||
   !Number.isSafeInteger(evidence?.triangleContactCount)||
   evidence.triangleContactCount<0||
   evidence.triangleContactKeys.length!==evidence.triangleContactCount||
   new Set(evidence.triangleContactKeys).size!==evidence.triangleContactCount)
  throw Error('M2 attribution complete bounded original-face evidence required');
 const garmentCounts=Array(garmentMeshCount).fill(0),bodyCounts=new Map();
 for(const key of evidence.triangleContactKeys){
  if(typeof key!=='string'||!/^(?:0|[1-9]\d*):(?:0|[1-9]\d*):(?:0|[1-9]\d*):(?:0|[1-9]\d*)$/.test(key))
   throw Error('M2 attribution canonical original-face contact keys required');
  const [g,b,garmentFace,bodyFace]=key.split(':').map(Number);
  if(![g,b,garmentFace,bodyFace].every(Number.isSafeInteger)||g>=garmentMeshCount||
     b>4095||garmentFace>10000000||bodyFace>10000000)
   throw Error('M2 attribution bounded source-face indices required');
  garmentCounts[g]++;
  bodyCounts.set(b,(bodyCounts.get(b)||0)+1);
 }
 if(garmentCounts.reduce((a,v)=>a+v,0)!==evidence.triangleContactCount)
  throw Error('M2 attribution incomplete contact tally');
 const byBodyMesh=[...bodyCounts].sort((a,b)=>b[1]-a[1]||a[0]-b[0])
  .map(([meshIndex,contacts])=>Object.freeze({meshIndex,contacts}));
 return Object.freeze({
  total:evidence.triangleContactCount,
  byGarmentMesh:Object.freeze(garmentCounts),
  byBodyMesh:Object.freeze(byBodyMesh),
  sourceFaceIdentity:true,originalPhotoUnchanged:true,
  sampledPoseOnly:true,signedPenetrationVerified:false,
  collisionCertified:false,releaseAuthorized:false
 });
}
