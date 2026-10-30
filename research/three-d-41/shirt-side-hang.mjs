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
   const lower=T.MathUtils.smoothstep(q.y,1.125,1.18)*(1-T.MathUtils.smoothstep(q.y,1.32,1.43));
   const frontProtection=1-T.MathUtils.smoothstep(q.z-center,.035,.07),dx=Math.sign(q.x)*.014*side*lower*frontProtection;
   if(Math.abs(dx)<.00001)continue;q.x+=dx;q.applyMatrix4(inv);p.setXYZ(i,q.x,q.y,q.z);moved++;max=Math.max(max,Math.abs(dx));
  }
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);g.computeBoundingBox();g.computeBoundingSphere();
 }
 return {...shirt,stats:{...shirt.stats,patternSidePanelEase:true,sideEaseMovedVertices:moved,sideEaseMaxMeters:max,sourcePhotoTextureAndCoordinatesUnchanged:true,collisionCertified:false}};
}
