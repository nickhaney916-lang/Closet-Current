/** Separate source-measured sleeve envelopes along the actual rig, not body normals. */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
export function hangSleevePanels(shirt,root){
 const arms=['L','R'].map(side=>{const find=n=>{let b;root.traverse(o=>{if(o.isBone&&o.name===n+side)b=o;});if(!b)throw Error('Original arm landmark missing');return b.getWorldPosition(new T.Vector3());};return {shoulder:find('upperarm01'),elbow:find('lowerarm01'),wrist:find('wrist')};});
 let moved=0,max=0;
 for(const mesh of shirt.meshes){if(mesh.name!=='Work56-independent-shirt-shell')continue;mesh.updateWorldMatrix(true,false);const g=mesh.geometry,p=g.attributes.position,inv=mesh.matrixWorld.clone().invert();
  for(const arm of arms){
   const nodes=[];for(let i=0;i<p.count;i++){const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);if(Math.sign(q.x)!==Math.sign(arm.wrist.x)||Math.abs(q.x)<.215)continue;
    const segments=[[arm.shoulder,arm.elbow],[arm.elbow,arm.wrist]].map(([a,b],segment)=>{const axis=b.clone().sub(a),t=T.MathUtils.clamp(q.clone().sub(a).dot(axis)/axis.lengthSq(),0,1),c=a.clone().addScaledVector(axis,t);return {t:(segment+t)/2,c,r:q.distanceTo(c)};});const h=segments.sort((a,b)=>a.r-b.r)[0];if(h.t<.08||h.t>.96||h.r>.16||h.r<.02)continue;nodes.push({i,q,...h});}
   const rows=Array.from({length:16},(_,j)=>{const t=(j+.5)/16,rs=nodes.filter(n=>Math.abs(n.t-t)<.08).map(n=>n.r).sort((a,b)=>a-b);return rs.length?rs[Math.floor((rs.length-1)*.75)]:.055;});
   for(let pass=0;pass<5;pass++){const a=rows.slice();for(let j=1;j<15;j++)rows[j]=.25*a[j-1]+.5*a[j]+.25*a[j+1];}
   for(const n of nodes){const u=T.MathUtils.clamp(n.t*16-.5,0,15),a=Math.floor(u),radius=T.MathUtils.lerp(rows[a],rows[Math.min(15,a+1)],u-a)+.003,fade=T.MathUtils.smoothstep(n.t,.08,.2)*(1-T.MathUtils.smoothstep(n.t,.86,.96));const delta=n.q.clone().sub(n.c).normalize().multiplyScalar(T.MathUtils.clamp(radius-n.r,-.035,.035)*fade);if(delta.length()<.0001)continue;max=Math.max(max,delta.length());const q=n.q.clone().add(delta).applyMatrix4(inv);p.setXYZ(n.i,q.x,q.y,q.z);moved++;}
  }
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);g.computeBoundingBox();g.computeBoundingSphere();
 }
 return {...shirt,stats:{...shirt.stats,independentSleeveLoft:true,sleeveLoftMovedVertices:moved,sleeveLoftMaximumShift:max,originalCuffCoordinatesRetained:true}};
}
