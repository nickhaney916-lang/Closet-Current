/** Bounded side-panel ease; immutable source-panel photograph coordinates. */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
export function relaxShirtSidePanels(shirt){
 const center=shirt.stats.envelope.center;let moved=0,max=0;
 for(const mesh of shirt.meshes){if(mesh.name==='Work59-source-neutral-collar-band')continue;
  mesh.updateWorldMatrix(true,false);const inv=mesh.matrixWorld.clone().invert(),g=mesh.geometry,p=g.attributes.position;
  for(let i=0;i<p.count;i++){
   const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),side=T.MathUtils.smoothstep(Math.abs(q.x),.11,.19)*(1-T.MathUtils.smoothstep(Math.abs(q.x),.24,.29));
   // Hang from the rib cage toward the hem, rather than pinch to the waist.
   const lower=T.MathUtils.smoothstep(q.y,1.125,1.18)*(1-T.MathUtils.smoothstep(q.y,1.26,1.33));
   const frontProtection=1-T.MathUtils.smoothstep(q.z-center,.035,.07),dx=Math.sign(q.x)*.014*side*lower*frontProtection;
   if(Math.abs(dx)<.00001)continue;q.x+=dx;q.applyMatrix4(inv);p.setXYZ(i,q.x,q.y,q.z);moved++;max=Math.max(max,Math.abs(dx));
  }
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);g.computeBoundingBox();g.computeBoundingSphere();
 }
 return {...shirt,stats:{...shirt.stats,patternSidePanelEase:true,sideEaseMovedVertices:moved,sideEaseMaxMeters:max,sourcePhotoTextureAndCoordinatesUnchanged:true,collisionCertified:false}};
}
/** Radial triangle ray clearance at new waistband, not an all-pose proof. */
export function clearShirtPatternWaist(shirt,pants){
 const m=pants.meshes[0],g=m.geometry,p=g.attributes.position,ix=g.index,triangles=[];
 m.updateWorldMatrix(true,false);m.skeleton.update();
 for(let i=0;i<ix.count;i+=3){const vs=[0,1,2].map(k=>m.applyBoneTransform(ix.getX(i+k),new T.Vector3().fromBufferAttribute(p,ix.getX(i+k))).applyMatrix4(m.matrixWorld));if(Math.max(...vs.map(v=>v.y))<pants.stats.waistY-.11)continue;triangles.push(new T.Triangle(...vs));}
 const cz=shirt.stats.envelope.center,waist=pants.stats.waistY,scratch=new T.Vector3();let moved=0,max=0;
 for(const mesh of shirt.meshes){if(mesh.name==='Work59-source-neutral-collar-band')continue;mesh.updateWorldMatrix(true,false);const inv=mesh.matrixWorld.clone().invert(),g=mesh.geometry,p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const q=mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(mesh.matrixWorld);if(q.y<waist-.105||q.y>waist+.055)continue;
  const origin=new T.Vector3(0,Math.min(q.y,waist-.001),cz),dir=new T.Vector3(q.x,0,q.z-cz),r=dir.length();if(r<.05)continue;dir.normalize();const ray=new T.Ray(origin,dir);let outer=0;
  for(const tri of triangles)if(ray.intersectTriangle(tri.a,tri.b,tri.c,false,scratch))outer=Math.max(outer,scratch.distanceTo(origin));
  if(!outer)continue;const shift=Math.min(.045,Math.max(0,outer+.009-r));if(shift<1e-6)continue;q.addScaledVector(dir,shift).applyMatrix4(inv);
  const skin=new T.Matrix4();skin.elements.fill(0);for(let k=0;k<4;k++){const id=g.attributes.skinIndex.array[i*4+k],w=g.attributes.skinWeight.array[i*4+k],mat=new T.Matrix4().multiplyMatrices(mesh.skeleton.bones[id].matrixWorld,mesh.skeleton.boneInverses[id]);for(let j=0;j<16;j++)skin.elements[j]+=mat.elements[j]*w;}skin.premultiply(mesh.bindMatrixInverse).multiply(mesh.bindMatrix).invert();q.applyMatrix4(skin);p.setXYZ(i,q.x,q.y,q.z);max=Math.max(max,shift);moved++;
 }
 p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);g.computeBoundingBox();g.computeBoundingSphere();}
 return {...shirt,stats:{...shirt.stats,patternWaistTriangleRayClearance:true,originalShirtSkinAndOriginalPantUVUnchanged:false,preservedOriginalDenimUVAndPixels:false,patternJeansMappingResampled:true,legacyContactStatisticsReference:'PR446 prefit before pattern remesh; final contacts require triangle audit',patternWaistMovedVertices:moved,patternWaistMaximumShift:max,fullCollisionValidated:false}};
}
