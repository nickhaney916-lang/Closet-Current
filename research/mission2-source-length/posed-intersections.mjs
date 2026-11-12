/** Real posed triangle intersection diagnostic. Does not prove signed clearance or swept collision. */
import * as THREE from 'three';
import {MeshBVH} from '../../node_modules/three-mesh-bvh/build/index.module.js';
import {preparePhotoUVSplitEdgeWitness} from './split-edge-continuity.mjs';
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


/**
 * P2-C7: complete *NEW* self-contact check scoped to SOURCE FACES whose
 * rest-position vertices actually changed. Every candidate including at least
 * one moved source face is checked against the full posed final mesh; pairs of
 * unchanged source faces cannot acquire a new contact in the identical pose.
 *
 * For every intersecting final pair, retest those SAME original face IDs in
 * the baseline posed mesh. Only a contact that did not exist before is new.
 * Thus very large preexisting/unchanged garment self-contact sets are never
 * enumerated or misrepresented as complete zero-contact clearance.
 *
 * A bounded failure means no safe-fit approval. No source mesh is mutated.
 * Not a swept-pose, volumetric containment, fabric or signed-penetration test.
 */
export function measureChangedFaceSelfContactDelta(root,meshes,overrides=new Map(),
 {maxCandidateTests=300000,maxNewContacts=40000,maxMovedFaces=80000}={}){
 if(typeof root?.updateMatrixWorld!=='function'||!Array.isArray(meshes)||meshes.length<1||
    new Set(meshes).size!==meshes.length||!(overrides instanceof Map)||
    [...overrides.keys()].some(mesh=>!meshes.includes(mesh))||
    !Number.isInteger(maxCandidateTests)||maxCandidateTests<1||maxCandidateTests>2000000||
    !Number.isInteger(maxNewContacts)||maxNewContacts<1||maxNewContacts>100000||
    !Number.isInteger(maxMovedFaces)||maxMovedFaces<1||maxMovedFaces>200000)
  throw Error('M2 changed-face bounded valid pose inputs required');
 root.updateMatrixWorld(true);
 const identity=new THREE.Matrix4(),newContacts=new Set();
 let candidateTests=0,changedFaces=0,sourceFaces=0,retainedExistingContacts=0;
 let duplicateCandidatesSkipped=0,unchangedMeshesSkipped=0;
 for(let meshIndex=0;meshIndex<meshes.length;meshIndex++){
  const mesh=meshes[meshIndex];
  if(!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163)
   throw Error('M2 changed-face genuine 163-bone source mesh required');
  const position=mesh.geometry?.getAttribute('position'),override=overrides.get(mesh);
  if(!position?.count||!mesh.geometry?.getAttribute('skinIndex')||
     !mesh.geometry?.getAttribute('skinWeight'))
   throw Error('M2 changed-face skinned triangle positions required');
  if(override&&(!(override instanceof Float32Array||override instanceof Float64Array)||
      override.length!==position.count*3||!override.every(Number.isFinite)))
   throw Error('M2 changed-face finite complete staged vertex buffer required');
  const index=mesh.geometry.index?.array,faceCount=index?index.length/3:position.count/3;
  if(!Number.isSafeInteger(faceCount)||faceCount<1||faceCount>3000000)
   throw Error('M2 changed-face bounded triangular surface required');
  sourceFaces+=faceCount;
  if(!override){unchangedMeshesSkipped++;continue;}
  const vertex=(face,corner)=>index?index[face*3+corner]:face*3+corner;
  const original=position.array,changedVertices=new Uint8Array(position.count);
  let anyChange=false;
  for(let i=0;i<original.length;i++)if(original[i]!==override[i]){
   changedVertices[Math.floor(i/3)]=1;anyChange=true;
  }
  if(!anyChange){unchangedMeshesSkipped++;continue;}
  const moved=[];
  for(let face=0;face<faceCount;face++){
   if(changedVertices[vertex(face,0)]||changedVertices[vertex(face,1)]||
      changedVertices[vertex(face,2)]){
    moved.push(face);
    if(moved.length>maxMovedFaces)
     throw Error('M2 changed-face exceeds bounded moved-face budget; cannot certify');
   }
  }
  changedFaces+=moved.length;
  const before=posedGeometry(mesh),after=posedGeometry(mesh,override);
  let subset=null;
  try{
   const afterPositions=after.getAttribute('position').array;
   const sourcePositions=before.getAttribute('position').array;
   const coords=new Float32Array(moved.length*9);
   for(let j=0;j<moved.length;j++){
    const sourceFace=moved[j];
    for(let k=0;k<3;k++){
     const i=vertex(sourceFace,k)*3;
     coords.set(afterPositions.subarray(i,i+3),j*9+k*3);
    }
   }
   subset=new THREE.BufferGeometry();
   subset.setAttribute('position',new THREE.BufferAttribute(coords,3));
   subset.computeBoundingBox();
   subset.boundsTree=new MeshBVH(subset,{indirect:true});
   after.boundsTree=new MeshBVH(after,{indirect:true});
   // bvhcast supplies ExtendedTriangle with intersectsTriangle(), unlike
   // THREE.Triangle. Use the exact pinned callback constructor for baseline.
   const seen=new Set();let originalA=null,originalB=null;
   const loadOriginal=(face,t)=>{
    for(const [k,v] of [t.a,t.b,t.c].entries()){
     const off=vertex(face,k)*3;
     v.set(sourcePositions[off],sourcePositions[off+1],sourcePositions[off+2]);
    }
    // ExtendedTriangle retains SAT planes and edges; invalidate its caches
    // each time the two original source faces are reused for a different pair.
    t.needsUpdate=true;
   };
   const adjacent=(a,c)=>{
    for(let k=0;k<3;k++)for(let j=0;j<3;j++)
     if(vertex(a,k)===vertex(c,j))return true;
    return false;
   };
   let overflowReason=null;
   subset.boundsTree.bvhcast(after.boundsTree,identity,{
    intersectsTriangles:(changedTri,fullTri,leftId,rightId)=>{
     const changedIndex=subset.boundsTree.resolveTriangleIndex(leftId);
     const a=moved[changedIndex],c=after.boundsTree.resolveTriangleIndex(rightId);
     if(a===c||adjacent(a,c))return false;
     const min=Math.min(a,c),max=Math.max(a,c);
     const pairKey=min*faceCount+max;
     if(seen.has(pairKey)){duplicateCandidatesSkipped++;return false;}
     seen.add(pairKey);
     candidateTests++;
     if(candidateTests>maxCandidateTests){overflowReason='comparison';return true;}
     if(!changedTri.intersectsTriangle(fullTri))return false;
     if(!originalA){originalA=new changedTri.constructor();originalB=new fullTri.constructor();}
     loadOriginal(a,originalA);loadOriginal(c,originalB);
     if(originalA.intersectsTriangle(originalB)){retainedExistingContacts++;return false;}
     newContacts.add(meshIndex+':'+min+':'+max);
     if(newContacts.size>=maxNewContacts){overflowReason='new-contact';return true;}
     return false;
    }
   });
   // Never throw from inside three-mesh-bvh callbacks; its traversal guard
   // would otherwise remain engaged and corrupt subsequent independent audits.
   if(overflowReason)throw Error('M2 changed-face exceeds bounded '+overflowReason+' budget; cannot certify');
  }finally{before.dispose();after.dispose();subset?.dispose();}
 }
 return Object.freeze({
  newlyIntersecting:newContacts.size,
  newlyIntersectingSourceKeys:Object.freeze([...newContacts].sort()),
  candidateTests,changedFaces,sourceFaces,retainedExistingContacts,
  duplicateCandidatesSkipped,unchangedMeshesSkipped,
  completedUniqueAffectedPairComparison:true,
  fullPreexistingContactEnumeration:false,
  originalSourceFaceIdentity:true,
  noNewSelfContacts:newContacts.size===0,
  sampledPoseOnly:true,signedClearanceVerified:false,
  collisionCertified:false,releaseAuthorized:false
 });
}


/**
 * P2-C8: count ONLY newly crossing original garment/body source-face pairs,
 * grouped by original garment mesh and coarse posed-height quartile.
 * Counts contain no photographic pixels, geometry coordinates, owner IDs,
 * texture hashes, URLs, or identities. Not a penetration depth measurement.
 */
export function summarizeNewPosedBodyContactRegions(root,meshes,before,after){
 if(typeof root?.updateMatrixWorld!=='function'||!Array.isArray(meshes)||
    meshes.length<1||meshes.length>128||new Set(meshes).size!==meshes.length||
    !Array.isArray(before?.triangleContactKeys)||!Array.isArray(after?.triangleContactKeys)||
    !Number.isSafeInteger(before.triangleContactCount)||!Number.isSafeInteger(after.triangleContactCount)||
    before.triangleContactCount<0||after.triangleContactCount<0||
    before.triangleContactKeys.length!==before.triangleContactCount||
    after.triangleContactKeys.length!==after.triangleContactCount||
    new Set(before.triangleContactKeys).size!==before.triangleContactCount||
    new Set(after.triangleContactKeys).size!==after.triangleContactCount)
  throw Error('M2 body locality complete original-face contact witnesses required');
 root.updateMatrixWorld(true);
 const geometry=[];
 try{
  let minY=Infinity,maxY=-Infinity;
  for(const mesh of meshes){
   if(!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163)
    throw Error('M2 body locality original 163-bone source garment required');
   const g=posedGeometry(mesh);
   geometry.push(g);
   const a=g.getAttribute('position').array;
   for(let i=1;i<a.length;i+=3){minY=Math.min(minY,a[i]);maxY=Math.max(maxY,a[i]);}
  }
  if(!Number.isFinite(minY)||!Number.isFinite(maxY)||maxY-minY<1e-5)
   throw Error('M2 body locality complete posed garment height required');
  const baseline=new Set(before.triangleContactKeys),byGarmentMesh=meshes.map(()=>0);
  const byHeightQuartile=[0,0,0,0],byGarmentAndHeight=meshes.map(()=>[0,0,0,0]);
  const bodyCounts=new Map();
  let total=0;
  for(const key of after.triangleContactKeys){
   if(baseline.has(key))continue;
   if(typeof key!=='string'||!/^(?:0|[1-9]\d*):(?:0|[1-9]\d*):(?:0|[1-9]\d*):(?:0|[1-9]\d*)$/.test(key))
    throw Error('M2 body locality canonical original source face required');
   const [g,b,sourceFace,bodyFace]=key.split(':').map(Number);
   if(![g,b,sourceFace,bodyFace].every(Number.isSafeInteger)||g>=geometry.length||
      b>4095||bodyFace>10000000)
    throw Error('M2 body locality bounded original source face required');
   const posed=geometry[g],index=posed.index?.array,a=posed.getAttribute('position').array;
   const faceCount=index?index.length/3:a.length/9;
   if(sourceFace>=faceCount)throw Error('M2 body locality source face outside original posed garment');
   const vertex=k=>index?index[sourceFace*3+k]:sourceFace*3+k;
   const centroidY=(a[vertex(0)*3+1]+a[vertex(1)*3+1]+a[vertex(2)*3+1])/3;
   const band=Math.min(3,Math.max(0,Math.floor(4*(centroidY-minY)/(maxY-minY))));
   byGarmentMesh[g]++;byHeightQuartile[band]++;byGarmentAndHeight[g][band]++;
   bodyCounts.set(b,(bodyCounts.get(b)||0)+1);total++;
  }
  const byBodyMesh=[...bodyCounts].sort((a,b)=>b[1]-a[1]||a[0]-b[0])
   .map(([meshIndex,contacts])=>Object.freeze({meshIndex,contacts}));
  if(total!==after.triangleContactCount-
      after.triangleContactKeys.filter(k=>baseline.has(k)).length||
     byHeightQuartile.reduce((a,n)=>a+n,0)!==total||
     byGarmentMesh.reduce((a,n)=>a+n,0)!==total||
     byBodyMesh.reduce((a,n)=>a+n.contacts,0)!==total)
   throw Error('M2 body locality incoherent new contact totals');
  return Object.freeze({
   newContactCount:total,
   byGarmentMesh:Object.freeze(byGarmentMesh),
   byHeightQuartile:Object.freeze(byHeightQuartile),
   byGarmentAndHeight:Object.freeze(byGarmentAndHeight.map(a=>Object.freeze(a))),
   byBodyMesh:Object.freeze(byBodyMesh),
   bandsFromBottom:true,originalFaceIdentity:true,
   sourcePoseOnly:true,noPhotoOrOwnerFields:true,
   signedDepthVerified:false,collisionCertified:false,releaseAuthorized:false
  });
 }finally{geometry.forEach(g=>g.dispose());}
}


/**
 * P2-C11: locate exact NEW within-one-skinned-mesh triangle contacts without
 * publishing garment vertices, source face IDs, JPEG hashes or owner identity.
 * Staged geometry and source-face identities are already audited and immutable.
 *
 * Ten bins represent unordered pairs of low-to-high garment height quartiles:
 * 0:00, 1:01, 2:02, 3:03, 4:11, 5:12, 6:13, 7:22, 8:23, 9:33.
 * A contact is a posed triangle intersection, NOT signed penetration/depth,
 * sewn topology, cloth thickness, or physical visual acceptance.
 */
export function summarizeChangedFaceSelfContactRegions(root,meshes,overrides,selfDelta){
 if(typeof root?.updateMatrixWorld!=='function'||!Array.isArray(meshes)||
    meshes.length<1||meshes.length>128||new Set(meshes).size!==meshes.length||
    !(overrides instanceof Map)||[...overrides.keys()].some(mesh=>!meshes.includes(mesh))||
    selfDelta?.completedUniqueAffectedPairComparison!==true||
    selfDelta?.originalSourceFaceIdentity!==true||
    selfDelta?.sampledPoseOnly!==true||
    !Number.isSafeInteger(selfDelta?.newlyIntersecting)||
    selfDelta.newlyIntersecting<0||selfDelta.newlyIntersecting>40000||
    !Array.isArray(selfDelta.newlyIntersectingSourceKeys)||
    selfDelta.newlyIntersectingSourceKeys.length!==selfDelta.newlyIntersecting||
    new Set(selfDelta.newlyIntersectingSourceKeys).size!==selfDelta.newlyIntersecting)
  throw Error('M2 fold locality complete bounded original-face delta required');
 root.updateMatrixWorld(true);
 const geometry=[];
 try{
  let minY=Infinity,maxY=-Infinity;
  for(const mesh of meshes){
   if(!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163)
    throw Error('M2 fold locality real 163-bone garment mesh required');
   const original=mesh.geometry?.getAttribute('position'),override=overrides.get(mesh);
   if(!original||override&&(
      !(override instanceof Float32Array||override instanceof Float64Array)||
      override.length!==original.count*3||!override.every(Number.isFinite)))
    throw Error('M2 fold locality finite staged garment vertices required');
   const g=posedGeometry(mesh,override);
   const a=g.getAttribute('position').array;
   const faces=(g.index?.count??a.length/3)/3;
   if(!Number.isSafeInteger(faces)||faces<1||faces>3000000)
    throw Error('M2 fold locality complete triangular source required');
   geometry.push({g,faces});
   for(let i=1;i<a.length;i+=3){minY=Math.min(minY,a[i]);maxY=Math.max(maxY,a[i]);}
  }
  if(!Number.isFinite(minY)||!Number.isFinite(maxY)||maxY-minY<1e-5)
   throw Error('M2 fold locality finite posed vertical source required');
  const byGarmentMesh=meshes.map(()=>0),byHeightBandPair=Array(10).fill(0),
   byHeightSeparation=Array(4).fill(0);
  const pairIndex=(a,b)=>{
   // 0-0,0-1,0-2,0-3,1-1,1-2,1-3,2-2,2-3,3-3
   return a===0?b:a===1?4+b-1:a===2?7+b-2:9;
  };
  const centroidY=(meshIndex,face)=>{
   const {g}=geometry[meshIndex],a=g.getAttribute('position').array,index=g.index?.array;
   let sum=0;
   for(let k=0;k<3;k++){
    const vertex=index?index[face*3+k]:face*3+k;
    sum+=a[vertex*3+1];
   }
   return sum/3;
  };
  const quartile=(y)=>Math.max(0,Math.min(3,Math.floor(4*(y-minY)/(maxY-minY))));
  for(const key of selfDelta.newlyIntersectingSourceKeys){
   if(typeof key!=='string'||!/^(?:0|[1-9]\d*):(?:0|[1-9]\d*):(?:0|[1-9]\d*)$/.test(key))
    throw Error('M2 fold locality canonical original-face self contact required');
   const [meshIndex,first,second]=key.split(':').map(Number);
   if(![meshIndex,first,second].every(Number.isSafeInteger)||
      meshIndex>=geometry.length||first>=second||second>=geometry[meshIndex].faces)
    throw Error('M2 fold locality original-face source bounds required');
   const a=quartile(centroidY(meshIndex,first)),
    c=quartile(centroidY(meshIndex,second)),
    low=Math.min(a,c),high=Math.max(a,c);
   byGarmentMesh[meshIndex]++;
   byHeightBandPair[pairIndex(low,high)]++;
   byHeightSeparation[high-low]++;
  }
  const total=selfDelta.newlyIntersecting;
  if(byGarmentMesh.reduce((a,n)=>a+n,0)!==total||
     byHeightBandPair.reduce((a,n)=>a+n,0)!==total||
     byHeightSeparation.reduce((a,n)=>a+n,0)!==total)
   throw Error('M2 fold locality source triangle evidence totals mismatch');
  return Object.freeze({
   newSelfContactCount:total,
   byGarmentMesh:Object.freeze(byGarmentMesh),
   byHeightBandPair:Object.freeze(byHeightBandPair),
   byHeightSeparation:Object.freeze(byHeightSeparation),
   heightPairOrder:'00,01,02,03,11,12,13,22,23,33',
   originalSourceFaceIdentity:true,
   completeChangedFaceComparison:true,
   sourcePoseOnly:true,noPhotoOrOwnerFields:true,
   signedPenetrationDepthVerified:false,
   selfCollisionCertified:false,releaseAuthorized:false
  });
 }finally{for(const item of geometry)item.g.dispose();}
}


/**
 * P2-C13 — classify, but NEVER waive, complete NEW self-contact evidence.
 *
 * A source-pair that intersects after fitting may be a genuine triangle-plane
 * crossing, a nearly coplanar overlap or a boundary touch. Some disconnected
 * photo/UV panels have geometrically coincident source edges, even though
 * their vertex indices differ. That coincidence does NOT prove a safe seam.
 *
 * Compare the original and proposed posed 163-bone triangles by unchanged
 * canonical ORIGINAL face keys. Only non-sensitive aggregate counts are
 * returned. Neither class nor geometric seam evidence changes admission:
 * EVERY new triangle intersection is still rejected by the source fitter.
 */

/** P2-C20. Count-only donor-local trace of short edges actually implicated
 * in NEW exact source-face self contacts; never serialize inputs or face keys.
 * Source snapshots must be captured before P62, after P62 and after P190.
 * Identical UVs are NOT certified source seams, equal skin weights do NOT
 * certify anatomical fit and no tiny/short face is automatically repaired.
 */
function traceContactLinkedNearEdges(meshes,contactFaceKeys,sourceAreaStages){
 if(sourceAreaStages!==null&&(!Array.isArray(sourceAreaStages)||
    sourceAreaStages.length!==3||sourceAreaStages.some(s=>
     s?.transientPrivateSourceFaceIds!==true||s.neverSerialize!==true||
     !Array.isArray(s.witnesses)||s.witnesses.length!==meshes.length)))
  throw Error('M2 C20 complete private original three-stage witnesses required');
 const stageNames=['anatomical','afterPhoto62','afterOwner190'],
  shapes=['regularNotTiny','pointMicro','nearCoincidentEdge','thinSliver','smallButWellShaped'];
 const stages=sourceAreaStages?stageNames.map(stage=>({stage,
  counts:Object.fromEntries(shapes.map(name=>[name,0]))})):null;
 const origins={anatomical:0,photoFit:0,ownerFit:0};
 const uvStatus={unavailable:0,nearSameUV:0,differentUV:0};
 const skinStatus={same:0,different:0};
 const shapeAt=(idx,xyz)=>{
  const sq=(i,j)=>{
   const x=xyz[i*3]-xyz[j*3],y=xyz[i*3+1]-xyz[j*3+1],
    z=xyz[i*3+2]-xyz[j*3+2];return x*x+y*y+z*z;
  };
  const pairs=[[idx[0],idx[1]],[idx[1],idx[2]],[idx[2],idx[0]]],
   edges=pairs.map(([a,b])=>sq(a,b)),edgeSum=edges.reduce((a,b)=>a+b,0),
   [a,b,c]=idx;
  const ux=xyz[b*3]-xyz[a*3],uy=xyz[b*3+1]-xyz[a*3+1],uz=xyz[b*3+2]-xyz[a*3+2],
   vx=xyz[c*3]-xyz[a*3],vy=xyz[c*3+1]-xyz[a*3+1],vz=xyz[c*3+2]-xyz[a*3+2],
   cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=ux*vy-uy*vx,
   crossSq=cx*cx+cy*cy+cz*cz,
   min=Math.min(...edges),max=Math.max(...edges),
   ratio=edgeSum?2*Math.sqrt(3)*Math.sqrt(crossSq)/edgeSum:0;
  if(![...edges,crossSq].every(Number.isFinite))
   throw Error('M2 C20 nonfinite private original source face');
  return {shape:crossSq>=1e-10?'regularNotTiny':
   max<1e-8?'pointMicro':min<1e-8?'nearCoincidentEdge':
   ratio<.05?'thinSliver':'smallButWellShaped',
   shortPair:pairs[edges.indexOf(min)]};
 };
 const influences=(g,v)=>{
  const weights=g.getAttribute('skinWeight'),bones=g.getAttribute('skinIndex');
  if(!weights||!bones||weights.itemSize!==4||bones.itemSize!==4||
     weights.count!==g.getAttribute('position').count||
     bones.count!==g.getAttribute('position').count)
   throw Error('M2 C20 source 163-bone influence attributes required');
  let total=0;const vec=new Float64Array(163);
  for(let k=0;k<4;k++){
   const idx=bones.getComponent(v,k),w=weights.getComponent(v,k);
   if(!Number.isSafeInteger(idx)||idx<0||idx>=163||!Number.isFinite(w)||w<0||w>1)
    throw Error('M2 C20 invalid actual source skin influence');
   vec[idx]+=w;total+=w;
  }
  if(!Number.isFinite(total)||total<.00001)
   throw Error('M2 C20 missing source skin normalization');
  return vec.map(value=>value/total);
 };
 let shortCount=0;
 for(const sourceKey of contactFaceKeys){
  const [m,f]=sourceKey.split(':').map(Number),g=meshes[m]?.geometry,
   p=g?.getAttribute('position'),ix=g?.index?.array,
   count=ix?ix.length/3:p?.count/3;
  if(!p?.isBufferAttribute||p.itemSize!==3||p.isInterleavedBufferAttribute||
     !Number.isSafeInteger(count)||!Number.isSafeInteger(f)||f<0||f>=count||
     !p.array.every(Number.isFinite))
   throw Error('M2 C20 canonical source face must be bounded and finite');
  const idx=[0,1,2].map(k=>ix?ix[f*3+k]:f*3+k);
  if(idx.some(v=>!Number.isSafeInteger(v)||v<0||v>=p.count))
   throw Error('M2 C20 original source face index out of range');
  const current=shapeAt(idx,p.array);
  if(current.shape!=='nearCoincidentEdge')continue;
  shortCount++;
  if(stages){
   const traced=sourceAreaStages.map((snap,stage)=>{
    const w=snap.witnesses[m];
    if(w?.mesh!==meshes[m]||w.faceCount!==count||
       !(w.indices instanceof Uint32Array)||w.indices.length!==3*count||
       !(w.localXYZ instanceof Float32Array)||w.localXYZ.length!==p.array.length||
       !w.localXYZ.every(Number.isFinite)||
       idx.some((v,k)=>w.indices[f*3+k]!==v))
     throw Error('M2 C20 original three-stage face identity mismatch');
    const evidence=shapeAt(idx,w.localXYZ);
    stages[stage].counts[evidence.shape]++;
    return evidence.shape;
   });
   if(traced[2]!==current.shape||idx.some(v=>[0,1,2].some(axis=>
     p.array[v*3+axis]!==sourceAreaStages[2].witnesses[m].localXYZ[v*3+axis])))
    throw Error('M2 C20 original owner stage changed before depth trial');
   origins[traced[0]==='nearCoincidentEdge'?'anatomical':
    traced[1]==='nearCoincidentEdge'?'photoFit':'ownerFit']++;
  }
  const [u,v]=current.shortPair,uv=g.getAttribute('uv');
  if(!uv)uvStatus.unavailable++;
  else {
   if(!uv.isBufferAttribute||uv.isInterleavedBufferAttribute||uv.itemSize<2||
      uv.count!==p.count||
      ![uv.getX(u),uv.getY(u),uv.getX(v),uv.getY(v)].every(Number.isFinite))
    throw Error('M2 C20 actual UV source evidence invalid');
   const du=uv.getX(u)-uv.getX(v),dv=uv.getY(u)-uv.getY(v);
   if(du*du+dv*dv<1e-10)uvStatus.nearSameUV++;
   else uvStatus.differentUV++;
  }
  const x=influences(g,u),y=influences(g,v);
  const disagreement=x.reduce((n,w,k)=>n+Math.abs(w-y[k]),0);
  if(disagreement>.02)skinStatus.different++;
  else skinStatus.same++;
 }
 const total=v=>Object.values(v).reduce((a,n)=>a+n,0);
 if(total(uvStatus)!==shortCount||total(skinStatus)!==shortCount||
    (stages&&(total(origins)!==shortCount||
      stages.some(s=>total(s.counts)!==shortCount))))
  throw Error('M2 C20 contact-linked short-edge lineage totals incomplete');
 return Object.freeze({
  nearCoincidentAffectedFaces:shortCount,
  stageSourceEvidenceComplete:stages!==null,
  shortEdgeShapeBySourceStage:stages?Object.freeze(stages.map(s=>
   Object.freeze({stage:s.stage,counts:Object.freeze({...s.counts})}))):null,
  nearEdgeFirstObservedStage:stages?Object.freeze(origins):null,
  shortEdgeUVEndpointEvidence:Object.freeze(uvStatus),
  shortEdge163BoneInfluenceEvidence:Object.freeze(skinStatus),
  uvSamenessIsNotProofOfSewnSeams:true,
  skinDisagreementIsNotProofOfRigDefect:true,
  onlyOneSourcePoseAndOneLicensedBlouse:true,
  sourcePositionsUVsFaceKeysAndBonesPrivate:true,
  noGeometryEdited:true,noContactWaived:true,releaseAuthorized:false
 });
}


/**
 * P2-C21: NOT A FIT OR REPAIR. A bounded depth-only, disposable counterfactual
 * tests whether allowing a few contact-linked short-edge vertices to retain
 * some original Z would change the exact NEW 163-bone collision results.
 * Source X/Y (photo silhouette), UV, skin weights and all garment bytes remain
 * unchanged. A caller MUST independently re-audit body, panel AND self pairs.
 *
 * The returned Map holds private source vertex positions. Never serialize or
 * attach it to an owner wardrobe, mobile console or persistent diagnostics.
 */
export function buildContactLinkedShortEdgeDepthCounterfactual(
 meshes,overrides,selfDelta,{maxDepthChange=.012,maxFaces=128}={}){
 if(!Array.isArray(meshes)||meshes.length<1||meshes.length>32||
    new Set(meshes).size!==meshes.length||
    !(overrides instanceof Map)||overrides.size!==meshes.length||
    !Number.isFinite(maxDepthChange)||maxDepthChange<=0||maxDepthChange>.024||
    !Number.isSafeInteger(maxFaces)||maxFaces<1||maxFaces>4096||
    selfDelta?.completedUniqueAffectedPairComparison!==true||
    selfDelta?.originalSourceFaceIdentity!==true||
    selfDelta?.sampledPoseOnly!==true||
    !Array.isArray(selfDelta.newlyIntersectingSourceKeys)||
    selfDelta.newlyIntersectingSourceKeys.length!==selfDelta.newlyIntersecting||
    !Number.isSafeInteger(selfDelta.newlyIntersecting)||
    selfDelta.newlyIntersecting<0||selfDelta.newlyIntersecting>maxFaces||
    new Set(selfDelta.newlyIntersectingSourceKeys).size!==selfDelta.newlyIntersecting)
  throw Error('M2 C21 bounded complete private original self contact delta required');
 const affected=meshes.map(()=>new Set()),sourceFaces=meshes.map(()=>new Set());
 const inRange=(id,count)=>Number.isSafeInteger(id)&&id>=0&&id<count;
 for(let m=0;m<meshes.length;m++){
  const mesh=meshes[m],p=mesh?.geometry?.getAttribute('position'),
   staged=overrides.get(mesh);
  if(!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163||
     !p?.isBufferAttribute||p.itemSize!==3||
     p.isInterleavedBufferAttribute||!p.array?.every(Number.isFinite)||
     !(staged instanceof Float32Array||staged instanceof Float64Array)||
     staged.length!==p.count*3||!staged.every(Number.isFinite))
   throw Error('M2 C21 actual finite 163-bone original and disposable staged garment required');
 }
 for(const key of selfDelta.newlyIntersectingSourceKeys){
  if(typeof key!=='string'||!/^(?:0|[1-9]\d*):(?:0|[1-9]\d*):(?:0|[1-9]\d*)$/.test(key))
   throw Error('M2 C21 canonical source face pair identity required');
  const [m,a,b]=key.split(':').map(Number);
  if(![m,a,b].every(Number.isSafeInteger)||m>=meshes.length||a>=b)
   throw Error('M2 C21 invalid contact source pair identity');
  const mesh=meshes[m],g=mesh.geometry,p=g.getAttribute('position'),
   idx=g.index?.array,n=idx?idx.length/3:p.count/3;
  if(!Number.isSafeInteger(n)||n<1||n>600000||!inRange(b,n))
   throw Error('M2 C21 contact source face outside bounded original geometry');
  for(const face of [a,b]){
   if(sourceFaces[m].has(face))continue;
   sourceFaces[m].add(face);
   const ids=[0,1,2].map(k=>idx?idx[face*3+k]:face*3+k);
   if(ids.some(v=>!inRange(v,p.count)))
    throw Error('M2 C21 noncanonical source face vertex');
   const arr=p.array;
   const lenSq=(u,v)=>{
    const x=arr[3*u]-arr[3*v],y=arr[3*u+1]-arr[3*v+1],z=arr[3*u+2]-arr[3*v+2];
    return x*x+y*y+z*z;
   };
   const pairs=[[ids[0],ids[1]],[ids[1],ids[2]],[ids[2],ids[0]]],
    squared=pairs.map(([u,v])=>lenSq(u,v)),
    minimum=Math.min(...squared),maximum=Math.max(...squared);
   const [i,j,k]=ids;
   const ux=arr[3*j]-arr[3*i],uy=arr[3*j+1]-arr[3*i+1],uz=arr[3*j+2]-arr[3*i+2],
    vx=arr[3*k]-arr[3*i],vy=arr[3*k+1]-arr[3*i+1],vz=arr[3*k+2]-arr[3*i+2],
    nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,
    crossSq=nx*nx+ny*ny+nz*nz;
   if(![...squared,crossSq].every(Number.isFinite))
    throw Error('M2 C21 nonfinite original local source triangle');
   if(crossSq<1e-10&&minimum<1e-8&&maximum>=1e-8){
    for(const vertex of pairs[squared.indexOf(minimum)])affected[m].add(vertex);
   }
  }
 }
 const counterfactual=new Map();
 let affectedVertices=0,changedVertices=0,changedZMaximum=0;
 for(let m=0;m<meshes.length;m++){
  const mesh=meshes[m],original=mesh.geometry.getAttribute('position').array,
   next=overrides.get(mesh),copy=next.slice();
  affectedVertices+=affected[m].size;
  for(const vertex of affected[m]){
   const offset=vertex*3+2,delta=Math.max(-maxDepthChange,
    Math.min(maxDepthChange,original[offset]-next[offset]));
   if(!Number.isFinite(delta))throw Error('M2 C21 counterfactual nonfinite bounded source depth');
   if(Math.abs(delta)>1e-12){
    copy[offset]+=delta;changedVertices++;
    changedZMaximum=Math.max(changedZMaximum,Math.abs(delta));
   }
  }
  if(!copy.every(Number.isFinite)||
     Array.from({length:copy.length/3},(_,i)=>i).some(i=>
      copy[3*i]!==next[3*i]||copy[3*i+1]!==next[3*i+1]))
   throw Error('M2 C21 photographed X/Y must remain byte-identical');
  counterfactual.set(mesh,copy);
 }
 if(affectedVertices>maxFaces*4||changedZMaximum>maxDepthChange+1e-9)
  throw Error('M2 C21 private source counterfactual trial out of safety bounds');
 return Object.freeze({
  privateOverrides:counterfactual,
  countOnly:Object.freeze({
   originallyNewSelfContactPairs:selfDelta.newlyIntersecting,
   implicatedNearEdgeVertices:affectedVertices,
   actuallyChangedDepthVertices:changedVertices,
   maximumDepthAdjustmentMeters:changedZMaximum,
   testedDepthAdjustmentCapMeters:maxDepthChange,
   originalSourcePhotoXYBitIdentical:true,
   originalSourceAndStagedArraysUnchanged:true,
   seamAndBoneWeightsUnchanged:true,
   originalPhotoShapeAndClothNotCertified:true,
   requiresFullBodyPanelSelfContactReaudit:true,
   notAdmissibleFor3DOrRelease:true,
   noContactWaived:true,releaseAuthorized:false
  })
 });
}


/**
 * P2-C22 — one-ring indexed incidence feather for P2-C21's exact-source
 * short-edge depth hold. Produces a *different, disposable* physical trial.
 *
 * Topological adjacency is only within ORIGINAL indexed triangle faces. If a
 * source panel uses nonindexed split vertices, DO NOT stitch geometrically
 * coincident points: they may be real fabric/UV seams. No UV continuity or
 * sewn garment truth can be inferred. This never authorizes 3D admission.
 */
export function buildOneRingShortEdgeDepthFeather(
 meshes,proposedOverrides,shortEdgeHold,
 {neighborWeight=.5,maxNeighborVertices=512}={}){
 if(!Array.isArray(meshes)||meshes.length<1||meshes.length>32||
    new Set(meshes).size!==meshes.length||
    !(proposedOverrides instanceof Map)||proposedOverrides.size!==meshes.length||
    !(shortEdgeHold?.privateOverrides instanceof Map)||
    shortEdgeHold.privateOverrides.size!==meshes.length||
    shortEdgeHold?.countOnly?.originalSourcePhotoXYBitIdentical!==true||
    shortEdgeHold.countOnly.notAdmissibleFor3DOrRelease!==true||
    shortEdgeHold.countOnly.releaseAuthorized!==false||
    !Number.isFinite(neighborWeight)||neighborWeight<=0||neighborWeight>.75||
    !Number.isSafeInteger(maxNeighborVertices)||
    maxNeighborVertices<1||maxNeighborVertices>4096)
  throw Error('M2 C22 complete private immutable original short-edge trial required');
 const feathered=new Map();
 let anchored=0,featheredNeighbors=0,maxActual=0,indexedFacesExamined=0;
 for(const mesh of meshes){
  const g=mesh?.geometry,p=g?.getAttribute('position'),
   before=proposedOverrides.get(mesh),held=shortEdgeHold.privateOverrides.get(mesh);
  if(!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163||
     !p?.isBufferAttribute||p.itemSize!==3||p.isInterleavedBufferAttribute||
     !p.array?.every(Number.isFinite)||
     !(before instanceof Float32Array||before instanceof Float64Array)||
     !(held instanceof Float32Array||held instanceof Float64Array)||
     before.length!==p.count*3||held.length!==before.length||
     !before.every(Number.isFinite)||!held.every(Number.isFinite))
   throw Error('M2 C22 finite original, staged and short-edge-held 163-bone geometry required');
  const anchor=new Map(),neighborSum=new Map(),neighborCount=new Map();
  for(let v=0;v<p.count;v++){
   if(before[v*3]!==held[v*3]||before[v*3+1]!==held[v*3+1])
    throw Error('M2 C22 original photographed X/Y was modified by short-edge parent');
   const d=held[v*3+2]-before[v*3+2];
   if(Math.abs(d)>1e-12){
    if(Math.abs(d)>.01200001)
     throw Error('M2 C22 original short-edge depth exceeds 12mm bound');
    anchor.set(v,d);anchored++;
   }
  }
  const index=g.index?.array,faces=index?index.length/3:p.count/3;
  if(!Number.isSafeInteger(faces)||faces<1||faces>600000||
     (index&&index.length%3!==0)||(!index&&p.count%3!==0))
   throw Error('M2 C22 bounded original indexed face incidence required');
  for(let face=0;face<faces;face++){
   const ids=[0,1,2].map(i=>index?index[face*3+i]:face*3+i);
   if(ids.some(v=>!Number.isSafeInteger(v)||v<0||v>=p.count))
    throw Error('M2 C22 original indexed source triangle has invalid corner');
   const contributions=ids.filter(v=>anchor.has(v)).map(v=>anchor.get(v));
   if(!contributions.length)continue;
   indexedFacesExamined++;
   const mean=contributions.reduce((a,b)=>a+b,0)/contributions.length;
   for(const v of ids){
    if(anchor.has(v))continue;
    neighborSum.set(v,(neighborSum.get(v)||0)+mean);
    neighborCount.set(v,(neighborCount.get(v)||0)+1);
   }
  }
  if(featheredNeighbors+neighborCount.size>maxNeighborVertices)
   throw Error('M2 C22 indexed one-ring neighbor budget exhausted; cannot certify');
  const out=held.slice();
  for(const [v,sum] of neighborSum){
   const adjustment=sum/neighborCount.get(v)*neighborWeight;
   if(!Number.isFinite(adjustment)||Math.abs(adjustment)>.00900001)
    throw Error('M2 C22 feathered depth outside bounded source face incidence');
   if(Math.abs(adjustment)>1e-12){
    out[v*3+2]+=adjustment;
    featheredNeighbors++;
    maxActual=Math.max(maxActual,Math.abs(adjustment));
   }
  }
  for(let v=0;v<p.count;v++){
   if(out[v*3]!==before[v*3]||out[v*3+1]!==before[v*3+1]||
      !Number.isFinite(out[v*3+2])||
      (!anchor.has(v)&&!neighborCount.has(v)&&out[v*3+2]!==before[v*3+2]))
    throw Error('M2 C22 photo XY or unconnected source original vertex changed');
  }
  feathered.set(mesh,out);
 }
 if(anchored!==shortEdgeHold.countOnly.actuallyChangedDepthVertices||
    featheredNeighbors>maxNeighborVertices)
  throw Error('M2 C22 exact parent short-edge source anchor tally mismatch');
 return Object.freeze({
  privateOverrides:feathered,
  countOnly:Object.freeze({
   originalShortEdgeAnchors:anchored,
   adjacentOriginalSourceFacesExamined:indexedFacesExamined,
   oneRingVerticesMoved:featheredNeighbors,
   maximumOneRingDepthMeters:maxActual,
   oneRingPropagationWeight:neighborWeight,
   maximumOneRingVertices:maxNeighborVertices,
   photoXYSilhouetteBitIdentical:true,
   sourceMeshAndShortEdgeProposalUnchanged:true,
   originalSourceIndexedAdjacencyOnly:true,
   nonIndexedVerticesNeverReconnected:true,
   noCrossSeamInference:true,
   noUVSkinWeightOrOriginalPhotoMutation:true,
   noAutomaticallyAcceptedSourceGeometry:true,
   requiresIndependentBodyPanelSelfAudits:true,
   onePoseOnly:true,
   notAdmissibleFor3DOrRelease:true,
   noContactWaived:true,releaseAuthorized:false
  })
 });
}


/**
 * P2-C24. A *new*, reversible local fold direction hypothesis linked only to
 * exact residual original source-face pairs after the P2-C23 one-ring trial.
 * Not photo depth, sewn seam truth, a collision exemption, or accepted 3D.
 *
 * For each nonadjacent original triangle pair, take the relative LOCAL-Z face
 * centroid ordering at the still-unsafe staged proposal and give the two
 * faces equal/opposite bounded Z votes. Both the "separate" and "reverse"
 * signs must be tested: owner images do not reveal physical depth ordering.
 * Only temporary cloned arrays leave this helper; they must never be logged,
 * saved, or included in the signed browser evidence.
 */
export function buildResidualSourcePairZDirectionTrial(
 meshes,stagedOverrides,residualSelfDelta,
 {direction='separate',maxDepthMeters=.003,maxPairs=128,maxVertices=256}={}){
 if(!Array.isArray(meshes)||meshes.length<1||meshes.length>32||
    new Set(meshes).size!==meshes.length||
    !(stagedOverrides instanceof Map)||stagedOverrides.size!==meshes.length||
    !['separate','reverse'].includes(direction)||
    !Number.isFinite(maxDepthMeters)||maxDepthMeters<=0||maxDepthMeters>.006||
    !Number.isSafeInteger(maxPairs)||maxPairs<1||maxPairs>2048||
    !Number.isSafeInteger(maxVertices)||maxVertices<1||maxVertices>4096||
    residualSelfDelta?.originalSourceFaceIdentity!==true||
    residualSelfDelta?.completedUniqueAffectedPairComparison!==true||
    residualSelfDelta?.sampledPoseOnly!==true||
    !Number.isSafeInteger(residualSelfDelta.newlyIntersecting)||
    residualSelfDelta.newlyIntersecting<1||
    residualSelfDelta.newlyIntersecting>maxPairs||
    !Array.isArray(residualSelfDelta.newlyIntersectingSourceKeys)||
    residualSelfDelta.newlyIntersectingSourceKeys.length!==
      residualSelfDelta.newlyIntersecting||
    new Set(residualSelfDelta.newlyIntersectingSourceKeys).size!==
      residualSelfDelta.newlyIntersecting)
  throw Error('M2 C24 complete bounded exact residual original-face pair evidence required');
 const votes=meshes.map(()=>new Map()),distinctFaces=meshes.map(()=>new Set());
 let nearlySameStagedLocalZPairs=0,distinctStagedLocalZPairs=0,
  exactDuplicateCornerPositionPairs=0;
 const configs=meshes.map((mesh,m)=>{
  const g=mesh?.geometry,p=g?.getAttribute('position'),
   staged=stagedOverrides.get(mesh),index=g?.index?.array,
   faceCount=index?index.length/3:p?.count/3;
  if(!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163||
     !p?.isBufferAttribute||p.itemSize!==3||p.isInterleavedBufferAttribute||
     !(staged instanceof Float32Array||staged instanceof Float64Array)||
     staged.length!==p.count*3||!p.array.every(Number.isFinite)||
     !staged.every(Number.isFinite)||
     !Number.isSafeInteger(faceCount)||faceCount<1||faceCount>600000||
     (index&&index.length!==3*faceCount))
   throw Error('M2 C24 full finite 163-bone original source and staged geometry required');
  return {m,p,index,faceCount,staged};
 });
 for(const key of residualSelfDelta.newlyIntersectingSourceKeys){
  if(typeof key!=='string'||
     !/^(?:0|[1-9]\d*):(?:0|[1-9]\d*):(?:0|[1-9]\d*)$/.test(key))
   throw Error('M2 C24 canonical original residual source pair required');
  const [m,a,b]=key.split(':').map(Number),cfg=configs[m];
  if(!cfg||![m,a,b].every(Number.isSafeInteger)||a>=b||a<0||b>=cfg.faceCount)
   throw Error('M2 C24 original residual source face pair out of bounds');
  const corners=face=>[0,1,2].map(k=>
   cfg.index?cfg.index[face*3+k]:face*3+k);
  const ai=corners(a),bi=corners(b);
  if([...ai,...bi].some(i=>!Number.isSafeInteger(i)||i<0||i>=cfg.p.count)||
     ai.some(i=>bi.includes(i)))
   throw Error('M2 C24 only complete, nonadjacent indexed original source faces supported');
  distinctFaces[m].add(a);distinctFaces[m].add(b);
  const depth=ids=>ids.reduce((sum,i)=>sum+cfg.staged[i*3+2],0)/3,
   za=depth(ai),zb=depth(bi);
  if(!Number.isFinite(za)||!Number.isFinite(zb))
   throw Error('M2 C24 finite contact-linked staged local depth required');
  if(Math.abs(za-zb)<.001)nearlySameStagedLocalZPairs++;
  else distinctStagedLocalZPairs++;
  let coincident=false;
  for(const i of ai)for(const j of bi){
   if(cfg.staged[i*3]===cfg.staged[j*3]&&
      cfg.staged[i*3+1]===cfg.staged[j*3+1]&&
      cfg.staged[i*3+2]===cfg.staged[j*3+2])coincident=true;
  }
  if(coincident)exactDuplicateCornerPositionPairs++;
  // A ties by canonical face index, but does NOT claim real seam or layering
  // order; both opposite signs are independently examined and rejected.
  const sign=(za>=zb?1:-1)*(direction==='separate'?1:-1);
  const add=(indices,weight)=>{
   for(const vertex of indices){
    const prev=votes[m].get(vertex)||{sum:0,count:0};
    prev.sum+=weight;prev.count++;
    votes[m].set(vertex,prev);
   }
  };
  add(ai,sign);add(bi,-sign);
 }
 const out=new Map();
 let votedOriginalSourceVertices=0,movedOriginalSourceVertices=0,maximumTrialLocalZMeters=0;
 for(const cfg of configs){
  const copy=cfg.staged.slice();
  votedOriginalSourceVertices+=votes[cfg.m].size;
  if(votedOriginalSourceVertices>maxVertices)
   throw Error('M2 C24 narrow original source vertex budget exceeded');
  for(const [vertex,vote] of votes[cfg.m]){
   const delta=maxDepthMeters*vote.sum/vote.count;
   if(!Number.isFinite(delta)||Math.abs(delta)>maxDepthMeters+1e-12)
    throw Error('M2 C24 bounded opposite local Z vote invalid');
   if(Math.abs(delta)>1e-12){
    copy[vertex*3+2]+=delta;
    movedOriginalSourceVertices++;
    maximumTrialLocalZMeters=Math.max(maximumTrialLocalZMeters,Math.abs(delta));
   }
  }
  for(let k=0;k<copy.length;k++){
   if(!Number.isFinite(copy[k])||
      (k%3!==2&&copy[k]!==cfg.staged[k])||
      (k%3===2&&!votes[cfg.m].has(Math.floor(k/3))&&copy[k]!==cfg.staged[k]))
    throw Error('M2 C24 source photo XY or non-participating vertex modified');
  }
  out.set(meshes[cfg.m],copy);
 }
 const distinctSourceFacesByMesh=distinctFaces.map(faces=>faces.size);
 const total=distinctSourceFacesByMesh.reduce((a,b)=>a+b,0);
 if(total<2||total>2*residualSelfDelta.newlyIntersecting||
    nearlySameStagedLocalZPairs+distinctStagedLocalZPairs!==
      residualSelfDelta.newlyIntersecting||
    exactDuplicateCornerPositionPairs>residualSelfDelta.newlyIntersecting)
  throw Error('M2 C24 exact residual contact local topology tallies incomplete');
 return Object.freeze({
  privateOverrides:out,
  countOnly:Object.freeze({
   residualOriginalSelfContactPairs:residualSelfDelta.newlyIntersecting,
   distinctOriginalSourceFacesByMesh:Object.freeze(distinctSourceFacesByMesh),
   distinctOriginalSourceFaces:total,
   nearEqualLocalDepthResidualPairs:nearlySameStagedLocalZPairs,
   differentLocalDepthResidualPairs:distinctStagedLocalZPairs,
   exactCoincidentOriginalSourceCornerPairs:exactDuplicateCornerPositionPairs,
   directionHypothesis:direction,
   maximumDepthMeters:maxDepthMeters,
   votedOriginalSourceVertices,
   movedOriginalSourceVertices,
   maximumAppliedLocalZMeters:maximumTrialLocalZMeters,
   bothOppositeSignHypothesesRequired:true,
   noPhysicalSewingOrDepthClaim:true,
   sourceOriginalAndStagedArraysUnchanged:true,
   sourcePhotoXYBitIdentical:true,
   noUVSkinWeightOrSourcePhotoMutation:true,
   residualOriginalFaceKeysNeverExported:true,
   noGeometryApplied:true,
   independentFullBodyPanelSelfAuditMandatory:true,
   noContactWaived:true,
   notAdmissibleFor3DOrRelease:true,
   releaseAuthorized:false
  })
 });
}



/**
 * P2-C27 research-only original-photo UV and 3D surface continuity evidence.
 * Compare the SAME source faces in neutral, articulated baseline, and a
 * disposable candidate at an actual posed 163-bone rig. Never emit UVs,
 * coordinates, source identities, textures, or per-face correspondence.
 *
 * Missing UVs, degenerate photographic mappings, inverted posed faces and
 * stretched surfaces remain visible as COUNTS; they are never waived.
 * Face area is not fabric strain, actual sewn-seam integrity, photographic
 * texture quality, continuous cloth movement, or signed penetration.
 */
export function auditSourcePhotoUVSurfaceAtPose(root,meshes,neutralWorld,posedBaselineWorld,
 overrides=new Map(),{maxFaces=300000,collapseArea=1e-12}={}){
 if(!root?.isObject3D||!Array.isArray(meshes)||meshes.length<1||
    meshes.length>8||new Set(meshes).size!==meshes.length||
    !Array.isArray(neutralWorld)||neutralWorld.length!==meshes.length||
    !Array.isArray(posedBaselineWorld)||posedBaselineWorld.length!==meshes.length||
    !(overrides instanceof Map)||[...overrides.keys()].some(m=>!meshes.includes(m))||
    !Number.isSafeInteger(maxFaces)||maxFaces<1||maxFaces>3000000||
    !Number.isFinite(collapseArea)||collapseArea<=0||collapseArea>1e-6)
  throw Error('M2 C27 bounded original-photo UV and posed source-face evidence required');
 let triangleCount=0,uvMappedFaces=0,meshesWithoutUV=0,uvDegenerateFaces=0;
 let uvMirroredFaces=0,poseAreaOverTwofoldFaces=0,newCollapsedCandidateFaces=0;
 let candidateAreaOver25PercentFaces=0,newCandidateInvertedNormals=0;
 const faceCross=(a,i,j,k)=>{
  const ux=a[j*3]-a[i*3],uy=a[j*3+1]-a[i*3+1],uz=a[j*3+2]-a[i*3+2];
  const vx=a[k*3]-a[i*3],vy=a[k*3+1]-a[i*3+1],vz=a[k*3+2]-a[i*3+2];
  return [uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];
 };
 const norm=v=>Math.hypot(v[0],v[1],v[2]);
 root.updateMatrixWorld(true);
 for(let meshIndex=0;meshIndex<meshes.length;meshIndex++){
  const mesh=meshes[meshIndex];
  if(!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163)
   throw Error('M2 C27 actual original 163-bone skinned garment required');
  const geometry=mesh.geometry,p=geometry?.getAttribute('position'),uv=geometry?.getAttribute('uv');
  const neutral=neutralWorld[meshIndex],baseline=posedBaselineWorld[meshIndex];
  const n=p?.count*3;
  if(!p?.isBufferAttribute||p.itemSize!==3||
     !(neutral instanceof Float32Array||neutral instanceof Float64Array)||
     !(baseline instanceof Float32Array||baseline instanceof Float64Array)||
     neutral.length!==n||baseline.length!==n||
     !neutral.every(Number.isFinite)||!baseline.every(Number.isFinite))
   throw Error('M2 C27 complete finite neutral and actual posed vertex evidence required');
  const override=overrides.get(mesh);
  if(override&&(!(override instanceof Float32Array||override instanceof Float64Array)||
       override.length!==n||!override.every(Number.isFinite)))
   throw Error('M2 C27 finite disposable source candidate required');
  if(uv&&(!uv.isBufferAttribute||uv.itemSize!==2||uv.count!==p.count||
          uv.isInterleavedBufferAttribute||!uv.array?.every(Number.isFinite)))
   throw Error('M2 C27 malformed or nonfinite original source photo UV required');
  if(!uv)meshesWithoutUV++;
  const index=geometry.index?.array;
  const faces=index?index.length/3:p.count/3;
  if(!Number.isSafeInteger(faces)||faces<1||faces>maxFaces||
     triangleCount+faces>maxFaces)
   throw Error('M2 C27 bounded complete triangular source faces required');
  triangleCount+=faces;
  const staged=posedGeometry(mesh,override);
  try{
   const after=staged.getAttribute('position').array;
   for(let face=0;face<faces;face++){
    const i=index?index[face*3]:face*3,
      j=index?index[face*3+1]:face*3+1,
      k=index?index[face*3+2]:face*3+2;
    if(i>=p.count||j>=p.count||k>=p.count)
     throw Error('M2 C27 original source triangle index outside positions');
    if(uv){
     uvMappedFaces++;
     const u=uv.array,ux=u[j*2]-u[i*2],uy=u[j*2+1]-u[i*2+1],
       vx=u[k*2]-u[i*2],vy=u[k*2+1]-u[i*2+1],
       signed=ux*vy-uy*vx;
     if(Math.abs(signed)<=1e-12)uvDegenerateFaces++;
     if(signed< -1e-12)uvMirroredFaces++;
    }
    const neutralCross=faceCross(neutral,i,j,k),
      baselineCross=faceCross(baseline,i,j,k),afterCross=faceCross(after,i,j,k);
    const neutralArea=norm(neutralCross),baselineArea=norm(baselineCross),
      afterArea=norm(afterCross);
    if(neutralArea>collapseArea&&baselineArea>collapseArea&&
       (baselineArea>neutralArea*2||baselineArea*2<neutralArea))
     poseAreaOverTwofoldFaces++;
    if(baselineArea>collapseArea&&afterArea<=collapseArea)
     newCollapsedCandidateFaces++;
    if(baselineArea>collapseArea&&afterArea>collapseArea&&
       (afterArea>baselineArea*1.25||afterArea*1.25<baselineArea))
     candidateAreaOver25PercentFaces++;
    if(baselineArea>collapseArea&&afterArea>collapseArea&&
       baselineCross[0]*afterCross[0]+baselineCross[1]*afterCross[1]+
       baselineCross[2]*afterCross[2]<0)
     newCandidateInvertedNormals++;
   }
  }finally{staged.dispose();}
 }
 return Object.freeze({
  triangleCount,uvMappedFaces,meshesWithoutUV,uvDegenerateFaces,uvMirroredFaces,
  poseAreaOverTwofoldFaces,newCollapsedCandidateFaces,
  candidateAreaOver25PercentFaces,newCandidateInvertedNormals,
  originalSourceFaceIdentity:true,currentPoseOnly:true,
  missingUVIsNotPhotoValidation:true,mirroredUVNotAutomaticallyRejected:true,
  seamContinuityNotVerified:true,texturePixelsNotInspected:true,
  continuousMotionNotVerified:true,clothDrapeNotCertified:true,
  sourcePhotoHumanReviewed:false,releaseAuthorized:false
 });
}

/**
 * P2-C26. Measure disposable, still-unapproved photographic-source garment
 * candidates on real DIFFERENT 163-bone articulated source shoulder/torso poses.
 * Only named bones from the loaded original skeleton may be moved. Every bone
 * quaternion and all original garment arrays are restored in finally.
 *
 * Comparing NEW source face pairs against baseline at EACH new pose does NOT
 * prove swept collisions, pre-existing pair clearance or cloth dynamics.
 * Body, separate garment panel and within-panel self audits are independent.
 */
export function auditSourcePhotoMicroMultiPose(root,meshes,trials,
 {maxTrials=3,maxNewContacts=40000}={}){
 if(!root?.isObject3D||typeof root.traverse!=='function'||
    !Array.isArray(meshes)||meshes.length<1||meshes.length>8||
    new Set(meshes).size!==meshes.length||
    !Array.isArray(trials)||trials.length<1||trials.length>maxTrials||
    !Number.isSafeInteger(maxTrials)||maxTrials<1||maxTrials>6||
    !Number.isSafeInteger(maxNewContacts)||maxNewContacts<1||maxNewContacts>100000)
  throw Error('M2 C26 bounded actual original 163-bone source pose and candidates required');
 const skeleton=meshes[0]?.skeleton,bones=skeleton?.bones;
 if(!Array.isArray(bones)||bones.length!==163||
    meshes.some(m=>!m?.isSkinnedMesh||m.skeleton?.bones?.length!==163||
      m.skeleton.bones.some((b,i)=>b!==bones[i])))
  throw Error('M2 C26 exactly one shared original anatomical 163-bone donor rig required');
 const norm=name=>String(name||'').replaceAll('.','').toLowerCase();
 const get=name=>bones.filter(b=>norm(b.name)===name);
 const left=get('upperarm01l'),right=get('upperarm01r');
 const torso=bones.filter(b=>/^(spine0?[123]|chest|torso|abdomen)$/.test(norm(b.name)));
 if(left.length!==1||right.length!==1||torso.length<1)
  throw Error('M2 C26 missing unambiguous original source shoulder and torso landmarks; do not claim multipose');
 const backbone=torso[0];
 if(new Set([left[0],right[0],backbone]).size!==3)
  throw Error('M2 C26 source anatomical joint landmarks overlap');
 const actual=new Set();
 root.traverse(o=>{if(o.isBone)actual.add(o);});
 if([left[0],right[0],backbone].some(b=>!actual.has(b)))
  throw Error('M2 C26 source original pose bones must be attached to measured figure');
 const original=new Map(bones.map(b=>[b,b.quaternion.clone()]));
 const originalBuffers=new Map(meshes.map(m=>{
  const p=m.geometry?.getAttribute('position');
  if(!p?.isBufferAttribute||p.itemSize!==3||p.isInterleavedBufferAttribute||
     !p.array?.every(Number.isFinite))
   throw Error('M2 C26 complete finite original mesh positions required');
  return [m,p.array.slice()];
 }));
 const originalUVBuffers=new Map(meshes.map(m=>[m,
  m.geometry.getAttribute('uv')?.array?.slice()??null]));
 const names=new Set(),checks=[];
 for(const trial of trials){
  if(typeof trial?.name!=='string'||!/^(half-mm-separate|half-mm-reverse|one-mm-reverse)$/.test(trial.name)||
     names.has(trial.name)||!(trial.overrides instanceof Map)||
     trial.overrides.size!==meshes.length)
   throw Error('M2 C26 predeclared unique private 0.5/1mm zero-new-contact candidates required');
  names.add(trial.name);
  for(const mesh of meshes){
   const xy=trial.overrides.get(mesh),p=mesh.geometry.getAttribute('position');
   if(!(xy instanceof Float32Array||xy instanceof Float64Array)||
      xy.length!==p.count*3||!xy.every(Number.isFinite))
    throw Error('M2 C26 finite original-photograph staged source vertices required');
  }
 }
 // Each candidate starts from an independently assessed no-NEW-contact
 // hypothesis; no winner, fit approval, original source JPEG or owner write.
 const poseCases=[
  {name:'bilateral-shoulder-8-torso-3',
   shoulderLeftZ:8,shoulderRightZ:-8,torsoY:3},
  {name:'asymmetric-shoulder-12-torso-5',
   shoulderLeftZ:-12,shoulderRightZ:6,torsoY:-5}
 ];
 const restore=()=>{
  for(const [b,q] of original)b.quaternion.copy(q);
  root.updateMatrixWorld(true);
  root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton?.update();});
 };
 const reference=meshes.map(mesh=>{
  const g=posedGeometry(mesh);
  try{return g.getAttribute('position').array.slice();}
  finally{g.dispose();}
 });
 // P2-C28 source UV split-edge identity is captured ONCE in the real
 // original neutral garment. Never export correspondence or weld panels.
 const photoSplitEdgeWitness=preparePhotoUVSplitEdgeWitness(meshes,reference);
 try{
  for(const pose of poseCases){
   restore();
   for(const [bone,axis,degrees] of [
    [left[0],new THREE.Vector3(0,0,1),pose.shoulderLeftZ],
    [right[0],new THREE.Vector3(0,0,1),pose.shoulderRightZ],
    [backbone,new THREE.Vector3(0,1,0),pose.torsoY]]){
    bone.quaternion.multiply(new THREE.Quaternion()
     .setFromAxisAngle(axis,THREE.MathUtils.degToRad(degrees)));
   }
   root.updateMatrixWorld(true);
   root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton?.update();});
   const posedBaselines=meshes.map(m=>{
    const g=posedGeometry(m);
    try{return g.getAttribute('position').array.slice();}
    finally{g.dispose();}
   });
   const poseMoved=posedBaselines.reduce((acc,a,i)=>{
    const b=reference[i];
    if(a.length!==b.length)throw Error('M2 C26 actual source skinned pose vertices changed identity');
    for(let j=0;j<a.length;j+=3){
     const dx=a[j]-b[j],dy=a[j+1]-b[j+1],dz=a[j+2]-b[j+2];
     if(dx*dx+dy*dy+dz*dz>1e-8)acc++;
    }
    return acc;
   },0);
   if(poseMoved<1)
    throw Error('M2 C26 named original shoulder/torso bones failed to move actual photographed garment');
   const sourceUVSurfaceBaseline=auditSourcePhotoUVSurfaceAtPose(
    root,meshes,reference,posedBaselines);
   const sourceUVSplitEdgeBaseline=photoSplitEdgeWitness.measure(root,posedBaselines);
   const baselineBody=measurePosedTriangleContacts(root,meshes,new Map(),{maxContacts:maxNewContacts});
   const baselinePanel=measurePosedGarmentPartContacts(root,meshes,new Map(),{maxContacts:maxNewContacts});
   const sourceSelf=measureChangedFaceSelfContactDelta(root,meshes,new Map());
   if(sourceSelf.newlyIntersecting!==0||sourceSelf.collisionCertified!==false||
      sourceSelf.originalSourceFaceIdentity!==true)
    throw Error('M2 C26 original 163-bone source-pose self-contact witness incomplete');
   const poseOut=[];
   for(const trial of trials){
    const body=comparePosedTriangleContacts(baselineBody,
     measurePosedTriangleContacts(root,meshes,trial.overrides,{maxContacts:maxNewContacts}));
    const panels=comparePosedTriangleContacts(baselinePanel,
     measurePosedGarmentPartContacts(root,meshes,trial.overrides,{maxContacts:maxNewContacts}));
    const self=measureChangedFaceSelfContactDelta(root,meshes,trial.overrides);
    if(self.originalSourceFaceIdentity!==true||
       self.completedUniqueAffectedPairComparison!==true||
       self.sampledPoseOnly!==true||
       self.collisionCertified!==false||self.releaseAuthorized!==false||
       !Array.isArray(self.newlyIntersectingSourceKeys)||
       self.newlyIntersectingSourceKeys.length!==self.newlyIntersecting)
     throw Error('M2 C26 exact new skinned pose source-face delta missing');
    const uvSurface=auditSourcePhotoUVSurfaceAtPose(
     root,meshes,reference,posedBaselines,trial.overrides);
    if(uvSurface.triangleCount!==sourceUVSurfaceBaseline.triangleCount||
       uvSurface.uvMappedFaces!==sourceUVSurfaceBaseline.uvMappedFaces||
       uvSurface.uvDegenerateFaces!==sourceUVSurfaceBaseline.uvDegenerateFaces)
     throw Error('M2 C27 source UV/face identity diverged during candidate pose');
    const split=photoSplitEdgeWitness.measure(root,posedBaselines,trial.overrides);
    if(split.sourcePhotoSplitUVEdgePairs!==sourceUVSplitEdgeBaseline.sourcePhotoSplitUVEdgePairs||
       split.originalAlreadyOpenPairs!==sourceUVSplitEdgeBaseline.originalAlreadyOpenPairs||
       split.releaseAuthorized!==false||split.noOriginalSourceMutation!==true)
     throw Error('M2 C28 source split UV edge identity or source pose baseline changed');
    poseOut.push(Object.freeze({
     candidate:trial.name,
     sourcePhotoUVSurfaceAudit:uvSurface,
     sourcePhotoSplitEdgeAudit:split,
     newBody:body.newlyIntersecting,newSeparatePanel:panels.newlyIntersecting,
     newSelf:self.newlyIntersecting,
     originalPoseBodyContactCount:baselineBody.triangleContactCount,
     originalPoseSeparatePanelContactCount:baselinePanel.triangleContactCount,
     poseOriginalSelfDelta:sourceSelf.newlyIntersecting,
     originalOriginalSourceFacesPreserved:true,
     originalPhotoXYAndSourceSkinPreserved:true,
     noAutomaticAdmission:true,noContactWaived:true,
     existingContactsNotCertifiedAsClear:true,
     continuousCollisionUnverified:true,releaseAuthorized:false
    }));
   }
   checks.push(Object.freeze({
    pose:pose.name,
    shoulderLeftDegrees:pose.shoulderLeftZ,
    shoulderRightDegrees:pose.shoulderRightZ,
    torsoDegrees:pose.torsoY,
    actualSkinnedGarmentVerticesMoved:poseMoved,
    sourcePhotoUVSurfaceBaseline:sourceUVSurfaceBaseline,
    sourcePhotoSplitEdgeBaseline,
    sourcePhotoSplitEdgeSourceSummary:photoSplitEdgeWitness.sourceSummary,
    trials:Object.freeze(poseOut),
    original163BoneSourcePose:true,
    sampledPoseOnly:true,
    notHumanFashionDrapeApproved:true,releaseAuthorized:false
   }));
  }
 }finally{
  restore();
  for(const [mesh,saved] of originalBuffers){
   const a=mesh.geometry.getAttribute('position').array;
   if(a.length!==saved.length||a.some((v,i)=>v!==saved[i]))
    throw Error('M2 C26 original source mesh silently mutated during pose trial');
   const originalUV=originalUVBuffers.get(mesh),
    currentUV=mesh.geometry.getAttribute('uv')?.array??null;
   if((originalUV===null)!==(currentUV===null)||
      (originalUV!==null&&(originalUV.length!==currentUV.length||
       originalUV.some((v,i)=>v!==currentUV[i]))))
    throw Error('M2 C27 original photograph UV data changed during private pose trial');
  }
 }
 // Original source GLB quaternions are not guaranteed mathematically unit
 // length to 1e-9 angle tolerance. Exact float components copied in finally
 // are the stronger, actual byte-preserving restoration proof.
 if([...original].some(([b,q])=>
    b.quaternion.x!==q.x||b.quaternion.y!==q.y||
    b.quaternion.z!==q.z||b.quaternion.w!==q.w))
  throw Error('M2 C26 body/garment source skeleton bone quaternions not restored');
 return Object.freeze({
  poses:Object.freeze(checks),
  onlyTwoPredeclaredArticulatedPoseSamples:true,
  originalBoneRotationsAndGarmentPositionsRestored:true,
  originalPhotoUVOwnerSourceUntouched:true,
  noClothDynamicsSweptOrHumanVisualAcceptance:true,
  noAbsoluteZeroContactCertificate:true,
  distinctBilateralShoulderAndTorsoMotion:true,
  allThreeIndependentCollisionTypesMeasured:true,
  noExperimentAppliedOrSaved:true,
  noCollisionWaived:true,
  noAutomatic3DAdmission:true,
  releaseAuthorized:false
 });
}

export function classifyNewSourceSelfContactTypes(root,meshes,overrides,selfDelta,
 {maxPairs=4096,sourceAreaStages=null}={}){
 if(!root||typeof root.updateMatrixWorld!=='function'||
    !Array.isArray(meshes)||meshes.length<1||meshes.length>128||
    new Set(meshes).size!==meshes.length||
    !(overrides instanceof Map)||[...overrides.keys()].some(m=>!meshes.includes(m))||
    !Number.isSafeInteger(maxPairs)||maxPairs<1||maxPairs>40000||
    selfDelta?.completedUniqueAffectedPairComparison!==true||
    selfDelta?.originalSourceFaceIdentity!==true||
    selfDelta?.sampledPoseOnly!==true||
    !Number.isSafeInteger(selfDelta?.newlyIntersecting)||
    selfDelta.newlyIntersecting<0||
    !Array.isArray(selfDelta.newlyIntersectingSourceKeys)||
    selfDelta.newlyIntersectingSourceKeys.length!==selfDelta.newlyIntersecting||
    new Set(selfDelta.newlyIntersectingSourceKeys).size!==selfDelta.newlyIntersecting)
  throw Error('M2 seam typing complete bounded original-source self delta required');
 if(selfDelta.newlyIntersecting>maxPairs)
  throw Error('M2 seam typing exceeds bounded original-face pair budget; cannot certify');
 root.updateMatrixWorld(true);
 const epsilon=0.00001,areaEpsilon=1e-10;
 const originals=[],staged=[];
 const byContactGeometry={twoSidedPlaneStraddle:0,nearCoplanarOverlap:0,
  boundaryOrNearPlaneContact:0,degenerate:0};
 // 0=no matching corners, 1=one matching corner, 2=matched edge,
 // 3=all three corners coincident. All comparisons use one fixed metric.
 const byOriginalCoincidentCorners=[0,0,0,0],byStagedCoincidentCorners=[0,0,0,0];
 const byGarmentMesh=meshes.map(()=>0);
 const byPairAreaProvenance={bothRegular:0,preexistingSmall:0,newlySmall:0,recoveredSmall:0};
 const byUniqueFaceAreaProvenance={bothRegular:0,preexistingSmall:0,newlySmall:0,recoveredSmall:0};
 const uniqueAffectedSourceFaces=new Set();
 // P2-C19: relate each fully evidenced NEW self-contact ORIGINAL source face
 // to its photo/owner-contour-fitted (pre-length) LOCAL triangle morphology.
 // Never infer the untouched anatomical source shape from these coordinates.
 // All original face IDs and vertex values stay ephemeral inside this donor.
 const bySourceLocalShape={regularNotTiny:0,pointMicro:0,
  nearCoincidentEdge:0,thinSliver:0,smallButWellShaped:0};
 const byUniqueAffectedGarmentMesh=meshes.map(()=>0);
 let indexedBoundaryAffectedFaces=0,indexedInteriorAffectedFaces=0,
  indexedNonManifoldAffectedFaces=0;
 const sourceTopologyCache=new Map();
 const localSourceFace=(meshIndex,face)=>{
  const mesh=meshes[meshIndex],geo=mesh.geometry;
  const attr=geo?.getAttribute('position'),index=geo?.index?.array;
  if(!attr?.isBufferAttribute||attr.itemSize!==3||
     attr.isInterleavedBufferAttribute||!attr.array?.every(Number.isFinite))
   throw Error('M2 linked local-source contact finite packed source XYZ required');
  const faceCount=index?index.length/3:attr.count/3;
  if(!Number.isSafeInteger(faceCount)||faceCount<1||faceCount>600000||
     !Number.isSafeInteger(face)||face<0||face>=faceCount)
   throw Error('M2 linked local-source face outside original bounded mesh');
  if(!sourceTopologyCache.has(meshIndex)){
   const owners=new Map(),bound=new Uint8Array(faceCount),nonman=new Uint8Array(faceCount);
   const vertex=(f,k)=>index?index[f*3+k]:f*3+k;
   for(let f=0;f<faceCount;f++){
    const ids=[vertex(f,0),vertex(f,1),vertex(f,2)];
    if(ids.some(id=>!Number.isSafeInteger(id)||id<0||id>=attr.count))
     throw Error('M2 linked local-source original face index invalid');
    for(const [i,j] of [[ids[0],ids[1]],[ids[1],ids[2]],[ids[2],ids[0]]]){
     if(i===j)continue;
     const key=i<j?i+':'+j:j+':'+i;
     if(!owners.has(key))owners.set(key,[]);
     const used=owners.get(key);if(!used.includes(f))used.push(f);
    }
   }
   for(const faces of owners.values())for(const f of faces){
    if(faces.length===1)bound[f]=1;
    if(faces.length>2)nonman[f]=1;
   }
   sourceTopologyCache.set(meshIndex,{bound,nonman});
  }
  const vertex=k=>index?index[face*3+k]:face*3+k;
  const ids=[vertex(0),vertex(1),vertex(2)];
  if(ids.some(id=>!Number.isSafeInteger(id)||id<0||id>=attr.count))
   throw Error('M2 linked local-source face index invalid');
  const a=attr.array;
  const squared=(i,j)=>{
   const x=a[i*3]-a[j*3],y=a[i*3+1]-a[j*3+1],z=a[i*3+2]-a[j*3+2];
   return x*x+y*y+z*z;
  };
  const e0=squared(ids[0],ids[1]),e1=squared(ids[1],ids[2]),
   e2=squared(ids[2],ids[0]);
  const [i,j,k]=ids;
  const ux=a[j*3]-a[i*3],uy=a[j*3+1]-a[i*3+1],uz=a[j*3+2]-a[i*3+2];
  const wx=a[k*3]-a[i*3],wy=a[k*3+1]-a[i*3+1],wz=a[k*3+2]-a[i*3+2];
  const cx=uy*wz-uz*wy,cy=uz*wx-ux*wz,cz=ux*wy-uy*wx;
  const crossSquared=cx*cx+cy*cy+cz*cz,edgeSum=e0+e1+e2;
  if(![e0,e1,e2,crossSquared,edgeSum].every(Number.isFinite))
   throw Error('M2 linked local-source nonfinite triangle shape');
  let shape='regularNotTiny';
  if(crossSquared<1e-10){
   const maxEdge=Math.max(e0,e1,e2),minEdge=Math.min(e0,e1,e2);
   const ratio=edgeSum?2*Math.sqrt(3)*Math.sqrt(crossSquared)/edgeSum:0;
   shape=maxEdge<1e-8?'pointMicro':minEdge<1e-8?'nearCoincidentEdge':
    ratio<.05?'thinSliver':'smallButWellShaped';
  }
  const flags=sourceTopologyCache.get(meshIndex);
  return {shape,boundary:flags.bound[face]===1,nonManifold:flags.nonman[face]===1};
 };
 const t=new THREE.Vector3(),u=new THREE.Vector3(),v=new THREE.Vector3();
 const getFace=(g,face)=>{
  const a=g.getAttribute('position').array,idx=g.index?.array;
  return Array.from({length:3},(_,k)=>{
   const vertex=idx?idx[face*3+k]:face*3+k,offset=vertex*3;
   return new THREE.Vector3(a[offset],a[offset+1],a[offset+2]);
  });
 };
 const matchedCorners=(a,b)=>{
  const used=new Set();let matches=0;
  for(const v of a){
   for(let i=0;i<3;i++){
    if(used.has(i)||v.distanceToSquared(b[i])>epsilon*epsilon)continue;
    used.add(i);matches++;break;
   }
  }
  return matches;
 };
 const normal=(f)=>{
  t.subVectors(f[1],f[0]);u.subVectors(f[2],f[0]);
  return new THREE.Vector3().crossVectors(t,u);
 };
 const planeDist=(f,n,opposite)=>opposite.map(p=>n.dot(v.subVectors(p,f[0])));
 const sourceAreaStatus=(beforeSmall,afterSmall)=>
  beforeSmall?(afterSmall?'preexistingSmall':'recoveredSmall'):
   (afterSmall?'newlySmall':'bothRegular');
 const small=(f)=>normal(f).lengthSq()<areaEpsilon;
 const mode=(a,b)=>{
  const na=normal(a),nb=normal(b);
  if(na.lengthSq()<areaEpsilon||nb.lengthSq()<areaEpsilon)return 'degenerate';
  na.normalize();nb.normalize();
  const ab=planeDist(a,na,b),ba=planeDist(b,nb,a);
  const straddle=dist=>Math.min(...dist)<-epsilon&&Math.max(...dist)>epsilon;
  if(straddle(ab)&&straddle(ba))return 'twoSidedPlaneStraddle';
  const close=dist=>dist.every(d=>Math.abs(d)<=epsilon);
  if(close(ab)&&close(ba))return 'nearCoplanarOverlap';
  return 'boundaryOrNearPlaneContact';
 };
 try{
  for(const mesh of meshes){
   const p=mesh?.geometry?.getAttribute('position'),override=overrides.get(mesh);
   if(!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163||!p?.count||
      override&&(!(override instanceof Float32Array||override instanceof Float64Array)||
       override.length!==p.count*3||!override.every(Number.isFinite)))
    throw Error('M2 seam typing actual finite 163-bone staged garment required');
   originals.push(posedGeometry(mesh));
   staged.push(posedGeometry(mesh,override));
  }
  for(const key of selfDelta.newlyIntersectingSourceKeys){
   if(typeof key!=='string'||!/^(?:0|[1-9]\d*):(?:0|[1-9]\d*):(?:0|[1-9]\d*)$/.test(key))
    throw Error('M2 seam typing canonical source face pair required');
   const [m,first,second]=key.split(':').map(Number);
   if(![m,first,second].every(Number.isSafeInteger)||m>=meshes.length||first>=second)
    throw Error('M2 seam typing source mesh and face bounds required');
   const g=staged[m],faceCount=g.index?g.index.count/3:g.getAttribute('position').count/3;
   if(!Number.isSafeInteger(faceCount)||faceCount<1||second>=faceCount)
    throw Error('M2 seam typing source triangle outside complete posed garment');
   const beforeA=getFace(originals[m],first),beforeB=getFace(originals[m],second);
   const afterA=getFace(g,first),afterB=getFace(g,second);
   const c=mode(afterA,afterB);
   byContactGeometry[c]++;
   const beforeSmallA=small(beforeA),beforeSmallB=small(beforeB),
    afterSmallA=small(afterA),afterSmallB=small(afterB);
   byPairAreaProvenance[sourceAreaStatus(beforeSmallA||beforeSmallB,afterSmallA||afterSmallB)]++;
   for(const [face,beforeWasSmall,nowSmall] of [
    [first,beforeSmallA,afterSmallA],[second,beforeSmallB,afterSmallB]]){
    const keyFace=m+':'+face;
    if(uniqueAffectedSourceFaces.has(keyFace))continue;
    uniqueAffectedSourceFaces.add(keyFace);
    byUniqueFaceAreaProvenance[sourceAreaStatus(beforeWasSmall,nowSmall)]++;
    const quality=localSourceFace(m,face);
    bySourceLocalShape[quality.shape]++;
    byUniqueAffectedGarmentMesh[m]++;
    if(quality.boundary)indexedBoundaryAffectedFaces++;
    else indexedInteriorAffectedFaces++;
    if(quality.nonManifold)indexedNonManifoldAffectedFaces++;
   }
   byOriginalCoincidentCorners[matchedCorners(beforeA,beforeB)]++;
   byStagedCoincidentCorners[matchedCorners(afterA,afterB)]++;
   byGarmentMesh[m]++;
  }
  const count=selfDelta.newlyIntersecting;
  for(const total of [Object.values(byContactGeometry).reduce((a,b)=>a+b,0),
   byOriginalCoincidentCorners.reduce((a,b)=>a+b,0),
   byStagedCoincidentCorners.reduce((a,b)=>a+b,0),
   byGarmentMesh.reduce((a,b)=>a+b,0),
   Object.values(byPairAreaProvenance).reduce((a,b)=>a+b,0)])
   if(total!==count)throw Error('M2 seam typing source pair tally mismatch');
  if(Object.values(byUniqueFaceAreaProvenance).reduce((a,b)=>a+b,0)!==
    uniqueAffectedSourceFaces.size)
   throw Error('M2 face area provenance unique source face counts mismatch');
  const shortEvidence=traceContactLinkedNearEdges(meshes,uniqueAffectedSourceFaces,sourceAreaStages);
  if(shortEvidence.nearCoincidentAffectedFaces!==bySourceLocalShape.nearCoincidentEdge)
   throw Error('M2 C20 implicated short-edge count differs from original-source area classification');
  if(Object.values(bySourceLocalShape).reduce((a,b)=>a+b,0)!==
      uniqueAffectedSourceFaces.size||
     byUniqueAffectedGarmentMesh.reduce((a,b)=>a+b,0)!==
      uniqueAffectedSourceFaces.size||
     indexedBoundaryAffectedFaces+indexedInteriorAffectedFaces!==
      uniqueAffectedSourceFaces.size||
     indexedNonManifoldAffectedFaces>uniqueAffectedSourceFaces.size)
   throw Error('M2 linked source shape and indexed topology counts incomplete');
  return Object.freeze({
   newSelfContactCount:count,
   uniqueAffectedSourceFaceCount:uniqueAffectedSourceFaces.size,
   byPairAreaProvenance:Object.freeze({...byPairAreaProvenance}),
   byUniqueFaceAreaProvenance:Object.freeze({...byUniqueFaceAreaProvenance}),
   byPhotoOwnerFittedSourceLocalShape:Object.freeze({...bySourceLocalShape}),
   contactLinkedShortEdgeStageUVSkinEvidence:shortEvidence,
   uniqueAffectedByGarmentMesh:Object.freeze([...byUniqueAffectedGarmentMesh]),
   affectedIndexedBoundaryFaces:indexedBoundaryAffectedFaces,
   affectedIndexedInteriorFaces:indexedInteriorAffectedFaces,
   affectedIndexedNonManifoldFaces:indexedNonManifoldAffectedFaces,
   sourceLocalMorphologyAtOwnerFitNotUntouchedAnatomy:true,
   indexedBoundaryDoesNotProveSewnSeam:true,
   noSourcePositionsOrFaceKeysExported:true,
   sourceAreaCrossSquaredThreshold:areaEpsilon,
   noSmallAreaWaiver:true,
   byContactGeometry:Object.freeze({...byContactGeometry}),
   byOriginalCoincidentCorners:Object.freeze(byOriginalCoincidentCorners),
   byStagedCoincidentCorners:Object.freeze(byStagedCoincidentCorners),
   byGarmentMesh:Object.freeze(byGarmentMesh),
   cornerOrder:'none,one,edge,all-three',
   originalSourceFaceIdentity:true,
   topologyGapIsNotASafetyExemption:true,
   completeChangedFaceComparison:true,
   noContactWaived:true,
   sourcePoseOnly:true,
   geometryClassificationToleranceMeters:epsilon,
   noPhotoOrOwnerFields:true,
   signedPenetrationDepthVerified:false,
   releaseAuthorized:false
  });
 }finally{
  for(const g of originals)g.dispose();
  for(const g of staged)g.dispose();
 }
}


/**
 * P2-C15: private, transient source-face area witness at three existing
 * 163-bone stages: before P62, after P62/P185, after P190/P195.
 *
 * The witness holds exact source-face indices and flags IN MEMORY ONLY.
 * Never serialize a witness or send it to a browser log or saved wardrobe.
 * comparePhotoConstructionAreaStages returns COUNTS ONLY, not face IDs,
 * coordinates, images, SHA values, wearer data, or collision exemptions.
 * Threshold is the same cross-product squared area as P2-C14.
 */
export function capturePhotoConstructionFaceAreas(root,shirt){
 if(typeof root?.updateMatrixWorld!=='function'||!Array.isArray(shirt?.meshes))
  throw Error('M2 photo stages require actual existing owner garment');
 const meshes=shirt.meshes.filter(m=>m?.name==='Work56-independent-shirt-shell'||
  ['L','R'].includes(m?.userData?.work45IndependentShoulderCap));
 if(meshes.length<3||meshes.length>32||new Set(meshes).size!==meshes.length||
    meshes.filter(m=>m.name==='Work56-independent-shirt-shell').length<1||
    !['L','R'].every(side=>meshes.some(m=>m.userData?.work45IndependentShoulderCap===side)))
  throw Error('M2 photo stages require canonical original torso shell and verified left/right sewn cap source pieces');
 root.updateMatrixWorld(true);
 const witnesses=[];
 let smallTotal=0,faceTotal=0;
 for(const mesh of meshes){
  if(!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163||
     !mesh.geometry?.getAttribute('skinIndex')||
     !mesh.geometry?.getAttribute('skinWeight'))
   throw Error('M2 photo stages genuine 163-bone original garment mesh required');
  const original=mesh.geometry,index=original.index?.array;
  const pos=original.getAttribute('position');
  if(!pos?.isBufferAttribute||pos.isInterleavedBufferAttribute||
     pos.itemSize!==3||!pos.array?.every(Number.isFinite))
   throw Error('M2 photo stages finite packed anatomical source XYZ required');
  const count=index?index.length/3:pos?.count/3;
  if(!Number.isSafeInteger(count)||count<1||count>3000000||
     !pos?.count||index&&index.length%3)
   throw Error('M2 photo stages bounded original source face identity required');
  const faceVertex=(face,corner)=>index?index[face*3+corner]:face*3+corner;
  const indices=new Uint32Array(count*3),flags=new Uint8Array(count);
  // P2-C17: preserve SOURCE-LOCAL versus actual skinned WORLD-POSE
  // area flags independently. These remain ephemeral donor-only fields.
  const localFlags=new Uint8Array(count),repeatIndexFlags=new Uint8Array(count);
  const coincidentCornerFlags=new Uint8Array(count);
  const posed=posedGeometry(mesh);
  try{
   const a=posed.getAttribute('position').array;
   let tiny=0,localTiny=0,repeated=0,coincident=0;
   for(let face=0;face<count;face++){
    const i=faceVertex(face,0),j=faceVertex(face,1),k=faceVertex(face,2);
    if(![i,j,k].every(v=>Number.isSafeInteger(v)&&v>=0&&v<pos.count))
     throw Error('M2 photo stages out-of-range canonical source face');
    indices.set([i,j,k],face*3);
    const i3=i*3,j3=j*3,k3=k*3;
    const ab=new THREE.Vector3(a[j3]-a[i3],a[j3+1]-a[i3+1],a[j3+2]-a[i3+2]);
    const ac=new THREE.Vector3(a[k3]-a[i3],a[k3+1]-a[i3+1],a[k3+2]-a[i3+2]);
    const crossSq=ab.cross(ac).lengthSq();
    if(!Number.isFinite(crossSq))throw Error('M2 photo stages nonfinite posed source triangle area');
    if(crossSq<1e-10){flags[face]=1;tiny++;}
    // Compare the exact same canonical face in the original mesh attribute.
    // World-pose changes include skinning AND mesh/world transforms. Do not
    // falsely attribute a discrepancy solely to bone weighting.
    const q=pos.array;
    const abx=q[j3]-q[i3],aby=q[j3+1]-q[i3+1],abz=q[j3+2]-q[i3+2];
    const acx=q[k3]-q[i3],acy=q[k3+1]-q[i3+1],acz=q[k3+2]-q[i3+2];
    const nx=aby*acz-abz*acy,ny=abz*acx-abx*acz,nz=abx*acy-aby*acx;
    const localCrossSq=nx*nx+ny*ny+nz*nz;
    if(!Number.isFinite(localCrossSq))throw Error('M2 photo stages nonfinite original local source triangle area');
    if(localCrossSq<1e-10){localFlags[face]=1;localTiny++;}
    if(i===j||j===k||i===k){repeatIndexFlags[face]=1;repeated++;}
    // Exact equal XYZ on distinct source indices can be a UV/sewn seam,
    // so report it as diagnostic only, NEVER as safe or as a weld request.
    const same=(u,v)=>q[u*3]===q[v*3]&&q[u*3+1]===q[v*3+1]&&q[u*3+2]===q[v*3+2];
    if(same(i,j)||same(j,k)||same(i,k)){coincidentCornerFlags[face]=1;coincident++;}
    if((repeatIndexFlags[face]||coincidentCornerFlags[face])&&!localFlags[face])
     throw Error('M2 photo stages identical source corners have inconsistent face area');
   }
   // All source IDs, local flags and vertex coordinates remain private
   // transient runtime state. Only reconciled aggregate counts are exported.
   witnesses.push({mesh,indices,flags,localFlags,repeatIndexFlags,
    coincidentCornerFlags,faceCount:count,tinyCount:tiny,localTinyCount:localTiny,
    repeatedIndexCount:repeated,coincidentCornerCount:coincident,
    posedXYZ:new Float32Array(a),localXYZ:new Float32Array(pos.array)});
   smallTotal+=tiny;faceTotal+=count;
  }finally{posed.dispose();}
 }
 return {witnesses,smallTotal,faceTotal,
  transientPrivateSourceFaceIds:true,neverSerialize:true};
}

export function comparePhotoConstructionAreaStages(beforePhoto,afterPhoto,afterOwner){
 const stages=[beforePhoto,afterPhoto,afterOwner];
 if(stages.some(stage=>!stage?.transientPrivateSourceFaceIds||
    stage.neverSerialize!==true||
    !Array.isArray(stage.witnesses)||stage.witnesses.length<3||stage.witnesses.length>32||
    !Number.isSafeInteger(stage.smallTotal)||!Number.isSafeInteger(stage.faceTotal)))
  throw Error('M2 photo stage complete ephemeral original-face witnesses required');
 const areas=stages.map(s=>s.witnesses.map(w=>w.tinyCount));
 // Never run unbounded source topology trials or export posed coordinates.
 if(stages[0].faceTotal>600000)
  throw Error('M2 stage blend feasibility exceeds bounded original source face budget');
 const totalFaces=stages[0].faceTotal;
 if(stages.some(s=>s.witnesses.length!==stages[0].witnesses.length))
  throw Error('M2 photo stage original source panel count changed');
 let newP62=0,recoveredP62=0,newP190=0,recoveredP190=0,persistentlySmall=0,smallAtBaseline=0;
 const byMesh=[];
 for(let meshIndex=0;meshIndex<stages[0].witnesses.length;meshIndex++){
  const w=stages.map(s=>s.witnesses[meshIndex]),base=w[0];
  if(w.some(x=>x.mesh!==base.mesh||x.faceCount!==base.faceCount||
     x.indices?.length!==base.indices?.length||x.flags?.length!==base.flags?.length||
     !(x.localFlags instanceof Uint8Array)||x.localFlags.length!==base.faceCount||
     !(x.repeatIndexFlags instanceof Uint8Array)||x.repeatIndexFlags.length!==base.faceCount||
     !(x.coincidentCornerFlags instanceof Uint8Array)||x.coincidentCornerFlags.length!==base.faceCount||
     ![x.localTinyCount,x.repeatedIndexCount,x.coincidentCornerCount].every(n=>
      Number.isSafeInteger(n)&&n>=0&&n<=base.faceCount)||
     !(x.localXYZ instanceof Float32Array)||x.localXYZ.length<9||
     x.localXYZ.length%3||!x.localXYZ.every(Number.isFinite)||
     x.indices.some(vertex=>vertex*3+2>=x.localXYZ.length)||
     !(x.posedXYZ instanceof Float32Array)||x.posedXYZ.length<3||
     x.posedXYZ.length%3||!x.posedXYZ.every(Number.isFinite)||
     x.indices.some(vertex=>vertex*3+2>=x.posedXYZ.length)))
   throw Error('M2 photo stage canonical original garment identity changed');
  for(const x of w)for(let k=0;k<x.indices.length;k++)
   if(x.indices[k]!==base.indices[k])
    throw Error('M2 photo stage original source triangle identity changed');
  let n62=0,r62=0,n190=0,r190=0,persistent=0,old=0;
  let localOnly=0,posedOnly=0,bothSmall=0,localSmall=0,repeat=0,coincident=0;
  for(let k=0;k<base.faceCount;k++){
   const a=base.flags[k],b=w[1].flags[k],c=w[2].flags[k];
   if(a>1||b>1||c>1)
    throw Error('M2 photo stage canonical area flags invalid');
   if(a)old++;
   const local=base.localFlags[k],repeated=base.repeatIndexFlags[k],
    sameCorner=base.coincidentCornerFlags[k];
   if(local>1||repeated>1||sameCorner>1||
      (repeated&&!local)||(sameCorner&&!local))
    throw Error('M2 source-local canonical original face flags invalid');
   if(local)localSmall++;
   if(local&&!a)localOnly++;
   if(!local&&a)posedOnly++;
   if(local&&a)bothSmall++;
   if(repeated)repeat++;
   if(sameCorner)coincident++;
   if(!a&&b)n62++;
   if(a&&!b)r62++;
   if(!b&&c)n190++;
   if(b&&!c)r190++;
   if(a&&b&&c)persistent++;
  }
  if(old!==base.tinyCount||n62-r62+old!==w[1].tinyCount||
     n190-r190+w[1].tinyCount!==w[2].tinyCount||
     localSmall!==base.localTinyCount||localOnly+bothSmall!==localSmall||
     posedOnly+bothSmall!==old||
     repeat!==base.repeatedIndexCount||coincident!==base.coincidentCornerCount)
   throw Error('M2 photo stage collapsed source-face tally mismatch');
  for(const item of w){
   let observedLocal=0,observedRepeated=0,observedCoincident=0;
   for(let face=0;face<item.faceCount;face++){
    const l=item.localFlags[face],r=item.repeatIndexFlags[face],
     same=item.coincidentCornerFlags[face];
    if(l>1||r>1||same>1||(r&&!l)||(same&&!l))
     throw Error('M2 original local source face flags invalid');
    observedLocal+=l;observedRepeated+=r;observedCoincident+=same;
   }
   if(observedLocal!==item.localTinyCount||
      observedRepeated!==item.repeatedIndexCount||
      observedCoincident!==item.coincidentCornerCount)
    throw Error('M2 original local source face aggregate mismatch');
  }
  byMesh.push(Object.freeze({
   meshIndex,sourceFaceCount:base.faceCount,
   originalSmall:old,afterPhotoSmall:w[1].tinyCount,afterOwnerSmall:w[2].tinyCount,
   photoFitNewSmall:n62,photoFitRecoveredSmall:r62,
   ownerFitNewSmall:n190,ownerFitRecoveredSmall:r190,
   smallAtEveryStage:persistent,
   originalLocalSmall:localSmall,originalWorldPosedSmall:old,
   localSmallOnlyBeforePose:localOnly,
   worldPosedSmallOnlyAfterTransform:posedOnly,
   smallInBothLocalAndWorldPose:bothSmall,
   repeatedSourceVertexIndexFaces:repeat,
   exactCoincidentLocalCornerFaces:coincident,
   localSmallAfterPhotoFit:w[1].localTinyCount,
   localSmallAfterOwnerFit:w[2].localTinyCount
  }));
  newP62+=n62;recoveredP62+=r62;newP190+=n190;recoveredP190+=r190;
  persistentlySmall+=persistent;smallAtBaseline+=old;
 }
 // P2-C16: bounded interpolation diagnostic, NOT a proposed mesh or
 // approved deformation. At each original face, interpolate the fixed-pose
 // BEFORE and AFTER world coordinates, preserving original face indexing.
 // This cannot establish photo silhouette fidelity, sewing or all-pose fit.
 const fractions=Object.freeze([0,.25,.5,.75,1]);
 const scan=(first,second)=>{
  const samples=[];
  for(const fraction of fractions){
   let small=0,introduced=0,recovered=0;
   for(let mi=0;mi<first.witnesses.length;mi++){
    const a=first.witnesses[mi],b=second.witnesses[mi],from=a.posedXYZ,to=b.posedXYZ;
    const point=(vertex,axis)=>fraction===0?from[vertex*3+axis]:
      fraction===1?to[vertex*3+axis]:
      from[vertex*3+axis]+(to[vertex*3+axis]-from[vertex*3+axis])*fraction;
    for(let face=0;face<a.faceCount;face++){
     const j=face*3,i0=a.indices[j],i1=a.indices[j+1],i2=a.indices[j+2];
     const abx=point(i1,0)-point(i0,0),aby=point(i1,1)-point(i0,1),abz=point(i1,2)-point(i0,2);
     const acx=point(i2,0)-point(i0,0),acy=point(i2,1)-point(i0,1),acz=point(i2,2)-point(i0,2);
     const nx=aby*acz-abz*acy,ny=abz*acx-abx*acz,nz=abx*acy-aby*acx;
     const squared=nx*nx+ny*ny+nz*nz;
     if(!Number.isFinite(squared))
      throw Error('M2 stage blend nonfinite original source face area');
     const tiny=squared<1e-10;
     if(tiny)small++;
     if(tiny&&!a.flags[face])introduced++;
     if(!tiny&&a.flags[face])recovered++;
    }
   }
   if(small!==first.smallTotal+introduced-recovered)
    throw Error('M2 stage blend source face counts do not reconcile');
   samples.push(Object.freeze({fraction,smallSourceFaces:small,
    newlySmallSourceFaces:introduced,recoveredSourceFaces:recovered}));
  }
  if(samples[0].smallSourceFaces!==first.smallTotal||
     samples[0].newlySmallSourceFaces!==0||samples[0].recoveredSourceFaces!==0||
     samples.at(-1).smallSourceFaces!==second.smallTotal)
   throw Error('M2 stage blend endpoints mismatch genuine fitted source faces');
  return Object.freeze(samples);
 };
 const photoBlend=scan(stages[0],stages[1]);
 const ownerBlend=scan(stages[1],stages[2]);
 const sourceTopologyQuality=summarizeCanonicalSourceFaceQuality(stages[0]);
 if(sourceTopologyQuality.totalSourceFaces!==totalFaces||
    sourceTopologyQuality.originalLocalTinyFaces!==sumByOriginalLocalSmall(byMesh))
  throw Error('M2 original source quality does not reconcile with immutable anatomy');
 const sum=(name)=>byMesh.reduce((a,m)=>a+m[name],0);
 if(stages.some(s=>s.faceTotal!==totalFaces)||
    smallAtBaseline!==stages[0].smallTotal||
    sum('afterPhotoSmall')!==stages[1].smallTotal||
    sum('afterOwnerSmall')!==stages[2].smallTotal)
  throw Error('M2 photo stage complete aggregate witness mismatch');
 return Object.freeze({
  stages:Object.freeze(['anatomicalBeforePhoto','afterP62P185Photo','afterP190P195Owner']),
  totalOriginalSourceFaces:totalFaces,
  sourcePieceCount:byMesh.length,
  smallAtAnatomicalConstruction:stages[0].smallTotal,
  smallAfterPhotoFit:stages[1].smallTotal,
  smallAfterOwnerMaskFit:stages[2].smallTotal,
  newlySmallDuringPhotoFit:newP62,
  recoveredDuringPhotoFit:recoveredP62,
  newlySmallDuringOwnerMaskFit:newP190,
  recoveredDuringOwnerMaskFit:recoveredP190,
  persistentlySmallFromAnatomicalStage:persistentlySmall,
  byGarmentMesh:Object.freeze(byMesh),
  sourceTopologyQuality,
  sourceQualityIsDiagnosticOnly:true,
  noMeshRepairApplied:true,
  sourceLocalSmallAtAnatomicalConstruction:sum('originalLocalSmall'),
  sourceWorldPosedSmallAtAnatomicalConstruction:sum('originalWorldPosedSmall'),
  sourceLocalSmallOnlyBeforePose:sum('localSmallOnlyBeforePose'),
  sourceWorldPosedSmallOnlyAfterTransform:sum('worldPosedSmallOnlyAfterTransform'),
  sourceSmallInBothLocalAndWorldPose:sum('smallInBothLocalAndWorldPose'),
  sourceRepeatedIndexFacesAtAnatomicalConstruction:sum('repeatedSourceVertexIndexFaces'),
  sourceExactCoincidentCornerFacesAtAnatomicalConstruction:sum('exactCoincidentLocalCornerFaces'),
  sourceLocalSmallAfterPhotoFit:sum('localSmallAfterPhotoFit'),
  sourceLocalSmallAfterOwnerFit:sum('localSmallAfterOwnerFit'),
  worldPoseIncludesSkinAndMeshTransforms:true,
  sourceLocalVsWorldAreaThresholdIsDiagnosticOnly:true,
  localSourceFaceNonregressionOnly:true,
  photoStageBlendFeasibility:photoBlend,
  ownerStageBlendFeasibility:ownerBlend,
  partialBlendNotApplied:true,sourcePhotoShapeUnverifiedForBlend:true,
  onlyOneRealSampledPose:true,
  sourceAreaCrossSquaredThreshold:1e-10,
  sourceTriangleIdentityUnchanged:true,
  noSourceFaceIdsCoordinatesOrOwnerFields:true,
  baselineStageIsSkinnedNotSourceJPEG:true,
  noCollisionWaived:true,physicalClearanceVerified:false,releaseAuthorized:false
 });
}


/**
 * P2-C18 — Research-only canonical source-local triangle triage.
 *
 * Faces and vertex coordinates are transient and private inside the donor.
 * The returned value contains only count aggregates: never identifiers,
 * coordinates, normals, owner JPEGs, skin weights, source SHA, or UV seams.
 *
 * Area is NOT a visual defect classifier. Exact indexed boundaries can be UV
 * splits or intended sewn panels. No indices/positions/normals are rewritten;
 * this receipt does not permit any new 3D collision/photorealism acceptance.
 */
function sumByOriginalLocalSmall(meshes){
 return meshes.reduce((total,mesh)=>total+mesh.originalLocalSmall,0);
}

export function summarizeCanonicalSourceFaceQuality(stage){
 if(!stage||stage.neverSerialize!==true||
    stage.transientPrivateSourceFaceIds!==true||
    !Array.isArray(stage.witnesses)||stage.witnesses.length<3||
    stage.witnesses.length>32||!Number.isSafeInteger(stage.faceTotal)||
    stage.faceTotal<3||stage.faceTotal>600000)
  throw Error('M2 original local topology needs bounded private canonical source witness');
 const qualityNames=Object.freeze(['pointMicro','nearCoincidentEdge','thinSliver','smallButWellShaped']);
 const shapeTotal=Object.fromEntries(qualityNames.map(k=>[k,0]));
 const byMesh=[];
 let totalFaces=0,tinyFaces=0;
 for(let meshIndex=0;meshIndex<stage.witnesses.length;meshIndex++){
  const w=stage.witnesses[meshIndex];
  const N=w?.faceCount,idx=w?.indices,v=w?.localXYZ;
  if(!Number.isSafeInteger(N)||N<1||N>600000||
     !(idx instanceof Uint32Array)||idx.length!==3*N||
     !(v instanceof Float32Array)||v.length<9||v.length%3||
     !v.every(Number.isFinite)||idx.some(i=>i*3+2>=v.length)||
     !(w.localFlags instanceof Uint8Array)||w.localFlags.length!==N||
     !(w.repeatIndexFlags instanceof Uint8Array)||w.repeatIndexFlags.length!==N||
     !(w.coincidentCornerFlags instanceof Uint8Array)||w.coincidentCornerFlags.length!==N||
     ![w.localTinyCount,w.repeatedIndexCount,w.coincidentCornerCount].every(n=>
      Number.isSafeInteger(n)&&n>=0&&n<=N))
   throw Error('M2 canonical original local source identity and finite coordinates required');
  const edges=new Map(),triangles=new Set();
  const edgeCounts=new Uint8Array(N),nonManifoldCounts=new Uint8Array(N),
   duplicateFaceFlags=new Uint8Array(N);
  const shapeCounts=Object.fromEntries(qualityNames.map(k=>[k,0]));
  let small=0, repeated=0, coincident=0, duplicateFaces=0;
  const xyz=(id,axis)=>v[id*3+axis];
  const edgeKey=(i,j)=>i<j?i+':'+j:j+':'+i;
  for(let f=0;f<N;f++){
   const a=idx[f*3],b=idx[f*3+1],d=idx[f*3+2];
   const repeatedFace=a===b||b===d||a===d;
   const equalPoint=(i,j)=>xyz(i,0)===xyz(j,0)&&
    xyz(i,1)===xyz(j,1)&&xyz(i,2)===xyz(j,2);
   const coincidence=equalPoint(a,b)||equalPoint(b,d)||equalPoint(a,d);
   const squared=(i,j)=>{
    const x=xyz(i,0)-xyz(j,0),y=xyz(i,1)-xyz(j,1),z=xyz(i,2)-xyz(j,2);
    return x*x+y*y+z*z;
   };
   const ab=squared(a,b),bd=squared(b,d),da=squared(d,a);
   const ux=xyz(b,0)-xyz(a,0),uy=xyz(b,1)-xyz(a,1),uz=xyz(b,2)-xyz(a,2);
   const wx=xyz(d,0)-xyz(a,0),wy=xyz(d,1)-xyz(a,1),wz=xyz(d,2)-xyz(a,2);
   const nx=uy*wz-uz*wy,ny=uz*wx-ux*wz,nz=ux*wy-uy*wx;
   const normSq=nx*nx+ny*ny+nz*nz;
   if(![ab,bd,da,normSq].every(Number.isFinite))
    throw Error('M2 nonfinite actual source local triangle quality');
   const tiny=normSq<1e-10;
   if(w.localFlags[f]!==Number(tiny)||
      w.repeatIndexFlags[f]!==Number(repeatedFace)||
      w.coincidentCornerFlags[f]!==Number(coincidence)||
      ((repeatedFace||coincidence)&&!tiny))
    throw Error('M2 source face quality differs from canonical original flags');
   if(repeatedFace)repeated++;
   if(coincidence)coincident++;
   if(tiny){
    small++;
    const max=Math.max(ab,bd,da),min=Math.min(ab,bd,da);
    const ratio=ab+bd+da?2*Math.sqrt(3)*Math.sqrt(normSq)/(ab+bd+da):0;
    const name=max<1e-8?'pointMicro':
      min<1e-8?'nearCoincidentEdge':
      ratio<.05?'thinSliver':'smallButWellShaped';
    shapeCounts[name]++;
    shapeTotal[name]++;
   }
   // Each distinct canonical triangular face ID is considered at most once;
   // duplicates across different face IDs are diagnostic, not auto-welded.
   const tri=[a,b,d].sort((x,y)=>x-y).join(':');
   if(triangles.has(tri)){duplicateFaceFlags[f]=1;duplicateFaces++;}
   else triangles.add(tri);
   for(const [i,j] of [[a,b],[b,d],[d,a]]){
    if(i===j)continue;
    const key=edgeKey(i,j);
    if(!edges.has(key))edges.set(key,[]);
    const faces=edges.get(key);
    if(!faces.includes(f))faces.push(f);
   }
  }
  if(small!==w.localTinyCount||repeated!==w.repeatedIndexCount||
     coincident!==w.coincidentCornerCount)
   throw Error('M2 source quality source flag totals mismatch');
  for(const faces of edges.values()){
   for(const f of faces) {
    if(faces.length===1)edgeCounts[f]++;
    if(faces.length>2)nonManifoldCounts[f]++;
   }
  }
  let smallBoundary=0,smallInterior=0,smallNonManifold=0,
   smallDuplicate=0,boundary=0,nonManifold=0;
  for(let face=0;face<N;face++){
   const onBoundary=edgeCounts[face]>0,nonManifoldFace=nonManifoldCounts[face]>0;
   if(onBoundary)boundary++;
   if(nonManifoldFace)nonManifold++;
   if(w.localFlags[face]){
    if(onBoundary)smallBoundary++;
    if(!onBoundary&&!nonManifoldFace)smallInterior++;
    if(nonManifoldFace)smallNonManifold++;
    if(duplicateFaceFlags[face])smallDuplicate++;
   }
  }
  const shapeSum=Object.values(shapeCounts).reduce((a,b)=>a+b,0);
  if(shapeSum!==small||smallBoundary+smallInterior>small||
     smallNonManifold>small||smallDuplicate>small)
   throw Error('M2 source local quality classification does not reconcile');
  byMesh.push(Object.freeze({meshIndex,sourceFaceCount:N,localSmallFaces:small,
   tinyShape: Object.freeze(shapeCounts),sourceBoundaryFaceCount:boundary,
   sourceNonManifoldFaceCount:nonManifold,
   localTinyBoundaryFaces:smallBoundary,localTinyInteriorFaces:smallInterior,
   localTinyNonManifoldFaces:smallNonManifold,
   duplicateCanonicalIndexFaces:duplicateFaces,
   localTinyDuplicateCanonicalIndexFaces:smallDuplicate}));
  totalFaces+=N;tinyFaces+=small;
 }
 if(totalFaces!==stage.faceTotal||
    byMesh.length!==stage.witnesses.length||
    Object.values(shapeTotal).reduce((a,b)=>a+b,0)!==tinyFaces)
  throw Error('M2 source local topology totals incomplete');
 const sum=k=>byMesh.reduce((a,m)=>a+m[k],0);
 return Object.freeze({
  totalSourceFaces:totalFaces,originalLocalTinyFaces:tinyFaces,
  byMesh:Object.freeze(byMesh),
  tinyShape:Object.freeze(shapeTotal),
  sourceBoundaryFaceCount:sum('sourceBoundaryFaceCount'),
  sourceNonManifoldFaceCount:sum('sourceNonManifoldFaceCount'),
  localTinyBoundaryFaces:sum('localTinyBoundaryFaces'),
  localTinyInteriorFaces:sum('localTinyInteriorFaces'),
  localTinyNonManifoldFaces:sum('localTinyNonManifoldFaces'),
  duplicateCanonicalIndexFaces:sum('duplicateCanonicalIndexFaces'),
  localTinyDuplicateCanonicalIndexFaces:sum('localTinyDuplicateCanonicalIndexFaces'),
  sourceQualityCrossSquaredThreshold:1e-10,
  microEdgeSquaredThreshold:1e-8,
  thinSliverRatioThreshold:.05,
  exactIndexedAdjacencyNotPhysicalSewing:true,
  normalsAndUVSeamsUnverified:true,
  sampledSourceMeshOnly:true,
  noSourceCoordinatesOrFaceKeys:true,
  noGeometryChanged:true,
  noCollisionWaived:true,
  releaseAuthorized:false
 });
}
