/** Standalone exact static BVH unsigned surface-distance research primitive.
 * Temporary already-posed BufferGeometry ONLY. This is never signed clearance,
 * proof of mesh enclosure, dynamic cloth, or photo-fidelity approval.
 */
import * as THREE from 'three';
import {MeshBVH} from '../../node_modules/three-mesh-bvh/build/index.module.js';
const validate=g=>{
 const p=g?.getAttribute?.('position'),idx=g?.index;
 if(!g?.isBufferGeometry||!p||p.itemSize!==3||
  p.count<3||p.count>450000||(idx&&idx.count%3!==0)||
  (idx?idx.count:p.count)<3||(!idx&&p.count%3!==0))
  throw Error('invalid-original-triangle-mesh');
 for(let i=0;i<p.count;i++)for(let j=0;j<3;j++)
  if(!Number.isFinite(p.getComponent(i,j)))throw Error('nonfinite-original-surface');
 if(idx)for(let i=0;i<idx.count;i++)
  if(!Number.isSafeInteger(idx.getX(i))||idx.getX(i)<0||idx.getX(i)>=p.count)
   throw Error('invalid-original-triangle-index');
 return (idx?.count??p.count)/3;
};
export function unsignedStaticSourceSurfaceGap89(left,right){
 const a=validate(left),b=validate(right);
 if(a<1||b<1||a+b>400000)throw Error('source-surface-budget-exceeded');
 const originalTree=right.boundsTree;
 try{
  right.boundsTree=new MeshBVH(right,{indirect:true});
  const probe=new MeshBVH(left,{indirect:true});
  const hit=probe.closestPointToGeometry(right,new THREE.Matrix4(),{},{});
  if(!hit||!Number.isFinite(hit.distance)||hit.distance<0)
   throw Error('original-source-distance-unavailable');
  return Object.freeze({
   sourceTriangleCounts:[a,b],
   unsignedMinimumSurfaceDistanceMeters:Math.round(hit.distance*1e6)/1e6,
   distanceMeasuredOnAllSourceTriangles:true,
   signedExteriorClearanceMeasured:false,bodyContainmentMeasured:false,
   continuousMovementMeasured:false
  });
 }finally{right.boundsTree=originalTree;}
}
