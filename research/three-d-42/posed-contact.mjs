/** Actual posed triangle crossings and local outward correction.
 * Intersection locations are exact triangle segments; reported plane depths
 * are local oriented face distances, NOT signed watertight volume depths. */
import * as T from 'three';
import {MeshBVH} from '../../node_modules/three-mesh-bvh/build/index.module.js';
import {setFashionPose} from '../three-d-09/pose-source.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
export function posedGeometry(meshes){const pos=[],idx=[],map=[];
 for(const m of meshes){m.updateWorldMatrix(true,false);m.skeleton.update();const off=pos.length/3,p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){pos.push(...m.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(m.matrixWorld).toArray());map.push([m,i]);}const ix=m.geometry.index;for(let i=0;i<(ix?.count??p.count);i++)idx.push(off+(ix?ix.getX(i):i));}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);return {g,map};
}
export function triangleContacts(a,b,{collect=false}={}){
 const ba=new MeshBVH(a),bb=new MeshBVH(b),line=new T.Line3(),bounds=new T.Box3(),pairs=[],left=new Set(),right=new Set();let count=0,maxPlaneDepth=0;
 ba.bvhcast(bb,new T.Matrix4(),{intersectsTriangles:(ta,tb,i,j)=>{if(ta.intersectsTriangle(tb,line)&&line.distance()>1e-5){count++;left.add(i);right.add(j);bounds.expandByPoint(line.start);bounds.expandByPoint(line.end);const normal=tb.getNormal(new T.Vector3());const depth=Math.max(0,...[ta.a,ta.b,ta.c].map(q=>-q.clone().sub(tb.a).dot(normal)));maxPlaneDepth=Math.max(maxPlaneDepth,depth);if(collect)pairs.push({i,j,normal:normal.clone(),point:tb.a.clone(),segment:[line.start.toArray(),line.end.toArray()],localPlaneDepth:depth});}return false;}});
 return {count,distinctTriangles:[left.size,right.size],bounds:count?{min:bounds.min.toArray(),max:bounds.max.toArray()}:null,maximumLocalOrientedFaceDepth:maxPlaneDepth,depthIsWatertightSigned:false,fullCollisionValidated:false,pairs};
}
function inverseSkin(m,i){const g=m.geometry,skin=new T.Matrix4();skin.elements.fill(0);for(let k=0;k<4;k++){const id=g.attributes.skinIndex.array[i*4+k],w=g.attributes.skinWeight.array[i*4+k],mat=new T.Matrix4().multiplyMatrices(m.skeleton.bones[id].matrixWorld,m.skeleton.boneInverses[id]);for(let j=0;j<16;j++)skin.elements[j]+=mat.elements[j]*w;}return skin.premultiply(m.bindMatrixInverse).multiply(m.bindMatrix).invert();}
export function createPoseContact(root,shirt,pants){
 const bodies=[];root.traverse(m=>{if(m.isSkinnedMesh&&!m.userData.work56Garment)bodies.push(m);});
 const meshes=shirt?.meshes||[],base=new Map(meshes.map(m=>[m,m.geometry.attributes.position.array.slice()])),cache=new Map();
 function restore(data,normals=null){for(const m of meshes){m.geometry.attributes.position.array.set(data.get(m));m.geometry.attributes.position.needsUpdate=true;if(normals){m.geometry.attributes.normal.array.set(normals.get(m));m.geometry.attributes.normal.needsUpdate=true;}else{m.geometry.computeVertexNormals();smoothSurfaceNormals(m.geometry,m.geometry.attributes.position.count);}m.geometry.computeBoundingSphere();}}
 function fit(pose){if(!meshes.length)return;setFashionPose(root,pose);if(cache.has(pose)){restore(cache.get(pose).positions,cache.get(pose).normals);shirt.stats.poseTriangleContact=cache.get(pose).stats;return;}
  const began=performance.now();restore(base);const body=posedGeometry(bodies),groups=new Map(),membership=new Map();
  for(const m of meshes){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){const k=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(':');if(!groups.has(k))groups.set(k,[]);groups.get(k).push([m,i]);membership.set(m.uuid+':'+i,k);}}
  let before,after,steps=0,totalMoved=0;const records=[];
  for(let pass=0;pass<12;pass++){
   const current=posedGeometry(meshes),c=triangleContacts(current.g,body.g,{collect:true});if(pass===0)before={...c,pairs:c.pairs.slice(0,30)};after={...c,pairs:c.pairs.slice(0,30)};if(!c.count){current.g.dispose();break;}
   records.push({pass,crossings:c.count,maximumLocalOrientedFaceDepth:c.maximumLocalOrientedFaceDepth});const moves=new Map(),p=current.g.attributes.position,ix=current.g.index;
   for(const pair of c.pairs){for(let k=0;k<3;k++){const id=ix.getX(pair.i*3+k),q=new T.Vector3().fromBufferAttribute(p,id),distance=q.clone().sub(pair.point).dot(pair.normal);if(distance>.003||distance<-.07)continue;const delta=pair.normal.clone().multiplyScalar(Math.min(.012,.004-distance));const [m,i]=current.map[id],key=membership.get(m.uuid+':'+i);if(!moves.has(key)||moves.get(key).lengthSq()<delta.lengthSq())moves.set(key,delta);}}
   current.g.dispose();if(!moves.size)break;
   for(const [key,delta] of moves)for(const [m,i] of groups.get(key)){const p=m.geometry.attributes.position,q=m.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(m.matrixWorld).add(delta).applyMatrix4(m.matrixWorld.clone().invert()).applyMatrix4(inverseSkin(m,i));p.setXYZ(i,q.x,q.y,q.z);totalMoved++;}
   steps++;
  }
  const current=posedGeometry(meshes);after=triangleContacts(current.g,body.g,{collect:true});after.pairs=after.pairs.slice(0,30);current.g.dispose();body.g.dispose();
  const positions=new Map(meshes.map(m=>[m,m.geometry.attributes.position.array.slice()])),stats={pose,before,after,steps,totalMoved,solveMilliseconds:performance.now()-began,method:'actual posed garment/body triangle intersections; outward local body-face corrections, original photo fields frozen',fullCollisionValidated:false};restore(positions);const normals=new Map(meshes.map(m=>[m,m.geometry.attributes.normal.array.slice()]));cache.set(pose,{positions,normals,stats});shirt.stats.poseTriangleContact=stats;
 }
 return {fit,dispose(){cache.clear();base.clear();}};
}
