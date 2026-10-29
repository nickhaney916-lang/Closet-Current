/** Reshape the existing collar, not a cover strip. Original photograph/UV/rig stay immutable. */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const stamp=p=>p.toArray().map(x=>x.toFixed(5)).join(',');
const world=(m,i)=>new T.Vector3().fromBufferAttribute(m.geometry.attributes.position,i).applyMatrix4(m.matrixWorld);
const MAX_MOVE=.065;
export function neckSection(root){
 let neck;const tris=[];root.updateMatrixWorld(true);
 root.traverse(o=>{if(o.isBone&&o.name==='neck01')neck=o.getWorldPosition(new T.Vector3());});
 if(!neck)throw Error('Original anatomical neck landmark required');
 root.traverse(m=>{if(!m.isSkinnedMesh||m.userData.work56Garment)return;const g=m.geometry;
  for(let i=0;i<(g.index?.count||g.attributes.position.count);i+=3){const p=[0,1,2].map(k=>world(m,g.index?g.index.getX(i+k):i+k));
   if(p.some(v=>Math.abs(v.x-neck.x)<.16&&v.y>neck.y-.12&&v.y<neck.y+.04))tris.push(new T.Triangle(...p));
  }
 });
 const cache=new Map();
 function sample(angle){
  const id=Math.round(angle*10000);if(cache.has(id))return cache.get(id).clone();
  const front=Math.max(0,Math.sin(angle));
  const y=neck.y-.020-.029*front,axis=new T.Vector3(neck.x,y,neck.z),dir=new T.Vector3(Math.cos(angle),0,Math.sin(angle));
  const ray=new T.Ray(axis,dir),hit=new T.Vector3();let distance=Infinity;
  for(const tri of tris)if(ray.intersectTriangle(tri.a,tri.b,tri.c,false,hit)){
   const d=hit.distanceTo(axis);if(d>.005&&d<.20)distance=Math.min(distance,d);
  }
  if(!Number.isFinite(distance))throw Error('No original neck surface at collar angle');
  const p=axis.addScaledVector(dir,distance+.007);cache.set(id,p);return p.clone();
 }
 return {neck,sample};
}
export function finishNecklineAndSeams(shirt,root){
 if(!shirt?.meshes?.length)throw Error('Reviewed separate shirt required');
 const {neck,sample}=neckSection(root),boundaries=new Map(),inner=new Map();
 for(const mesh of shirt.meshes){
  mesh.updateWorldMatrix(true,false);
  if(mesh.name!=='Work59-source-neutral-collar-band')continue;
  const p=mesh.geometry.attributes.position;
  // Work59 emits two triangles per existing edge: outer a,b / inner a,b.
  // Retain those triangles and skin weights; move shared outer positions with shell.
  for(let i=0;i<p.count;i++){
   const q=world(mesh,i),angle=Math.atan2(q.z-neck.z,q.x-neck.x),target=sample(angle);
   const isInner=[2,4,5].includes(i%6);
   if(!isInner){const dir=new T.Vector3(Math.cos(angle),0,Math.sin(angle));target.addScaledVector(dir,.012);target.y-=.005;}
   (isInner?inner:boundaries).set(stamp(q),{q,target});
  }
 }
 if(boundaries.size<20||inner.size<20)throw Error('Existing collar topology required');
 const rings=[...boundaries.values()];let moved=0,maxMovement=0;
 for(const mesh of shirt.meshes){
  const g=mesh.geometry,p=g.attributes.position,inv=mesh.matrixWorld.clone().invert();
  for(let i=0;i<p.count;i++){
   const q=world(mesh,i),before=q.clone(),id=stamp(q),direct=inner.get(id)||boundaries.get(id);
   if(direct)q.copy(direct.target);
   else if(q.y>neck.y-.19&&Math.abs(q.x)<.22){
    // A compact support around the existing sewn boundary blends the neck into
    // the shoulder surface. Sleeves, cuffs, chest print and hem are fixed.
    let nearest=null,d=Infinity;for(const ring of rings){const dist=q.distanceToSquared(ring.q);if(dist<d){d=dist;nearest=ring;}}
    const weight=1-T.MathUtils.smoothstep(Math.sqrt(d),0,.075);
    if(weight>0)q.addScaledVector(nearest.target.clone().sub(nearest.q),weight);
   }
   const delta=q.clone().sub(before);if(delta.length()>MAX_MOVE)q.copy(before).add(delta.setLength(MAX_MOVE));
   const amount=q.distanceTo(before);if(amount>1e-6)moved++;maxMovement=Math.max(maxMovement,amount);
   p.setXYZ(i,...q.applyMatrix4(inv).toArray());
  }
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);g.computeBoundingBox();g.computeBoundingSphere();
 }
 const materials=new Set(shirt.meshes.map(m=>m.material));for(const material of materials)blendPhotoSeams(material);
 return {...shirt,stats:{...shirt.stats,necklineSeams:true,necklineMovedVertices:moved,maxNecklineMovement:maxMovement,
  necklineReference:'original-body-radial-triangle-section',photoSeamMode:'source-alpha-feather-original-central-RGB',
  neutralBack:true,collisionValidated:false,releaseAuthorized:false}};
}
export function blendPhotoSeams(material){
 const compile=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,...rest){
  compile.call(this,shader,...rest);
  const old='photo.a*smoothstep(.95,1.,interiorAlpha)*front*chest*necklineInterior';
  if(!shader.fragmentShader.includes(old))throw Error('Original source material contract changed');
  // Feather only source-image/alpha boundaries. The central print retains
  // its original texture sample at weight 1; no new pattern/RGB is generated.
  shader.fragmentShader=shader.fragmentShader.replace(old,`photo.a*smoothstep(.95,1.,interiorAlpha)*front*(1.-smoothstep(.115,.195,abs(vPanel.x)))*necklineInterior*
    smoothstep(0.,.14,min(panel.x,1.-panel.x))*
    smoothstep(0.,.045,min(panel.y,1.-panel.y))`);
 };
 material.customProgramCacheKey=()=> '3D22-original-photo-edge-feather-v1';material.needsUpdate=true;
}
