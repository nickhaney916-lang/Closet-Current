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
