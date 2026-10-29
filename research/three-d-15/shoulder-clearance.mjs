/** A local source-pose safety correction, NOT general cloth collision or new shirt drape. */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
export function captureShoulderSurface(root){
 root.updateMatrixWorld(true);const surfaces=[],body=[];root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)body.push(o);});
 const mesh=body.sort((a,b)=>b.geometry.attributes.position.count-a.geometry.attributes.position.count)[0],g=mesh.geometry,nm=new T.Matrix3().getNormalMatrix(mesh.matrixWorld);
 const seen=new Set();for(let i=0;i<g.attributes.position.count;i++){const p=new T.Vector3().fromBufferAttribute(g.attributes.position,i).applyMatrix4(mesh.matrixWorld);if(p.y<1.49||p.y>1.78||Math.abs(p.x)>.38)continue;const key=p.toArray().map(x=>x.toFixed(5)).join(',');if(seen.has(key))continue;seen.add(key);surfaces.push({p,n:new T.Vector3().fromBufferAttribute(g.attributes.normal,i).applyMatrix3(nm).normalize()});}
 if(surfaces.length<100)throw Error('Original anatomical shoulder surface required');return surfaces;
}
export function protectShirtShoulders(shirt,surfaces){
 let corrected=0,maxCorrection=0;
 for(const mesh of shirt.meshes){mesh.updateWorldMatrix(true,false);const g=mesh.geometry,p=g.attributes.position,inverse=mesh.matrixWorld.clone().invert(),cache=new Map();
  for(let i=0;i<p.count;i++){
   const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);if(q.y<1.52||q.y>1.73||Math.abs(q.x)>.36)continue;
   const key=q.toArray().map(x=>x.toFixed(5)).join(',');let correctedPoint=cache.get(key);
   if(!correctedPoint){let nearest=null,distance=Infinity;for(const s of surfaces){const d=q.distanceToSquared(s.p);if(d<distance){distance=d;nearest=s;}}
    const gap=q.clone().sub(nearest.p).dot(nearest.n),move=T.MathUtils.clamp(.012-gap,0,.020);correctedPoint=q.clone().addScaledVector(nearest.n,move);cache.set(key,correctedPoint);if(move>.00001){corrected++;maxCorrection=Math.max(maxCorrection,move);}
   }
   p.setXYZ(i,...correctedPoint.clone().applyMatrix4(inverse).toArray());
  }
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
 }
 // Keep panelPosition/panelNormal and all source photo data byte-identical.
 return {...shirt,stats:{...shirt.stats,shoulderSafetyVertices:corrected,maxShoulderCorrection:maxCorrection,minClearance:null,collisionValidated:false}};
}
