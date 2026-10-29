/** Source-registered physical opening. Original pixels/UV shader and body are untouched.
 * Source landmarks are normalized original-image coordinates, measured on commons-0053.
 * This changes dressRest registration explicitly; it does not claim unchanged UV values.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
export const V_SOURCE=Object.freeze({left:[.390,.145],tip:[.505,.244],right:[.650,.151],trimTip:[.499,.269]});
export function sourceNeckY(u){
 if(!Number.isFinite(u))throw Error('Finite source coordinate required');
 const [a,b]=u<=V_SOURCE.tip[0]?[V_SOURCE.left,V_SOURCE.tip]:[V_SOURCE.tip,V_SOURCE.right];
 return T.MathUtils.lerp(a[1],b[1],T.MathUtils.clamp((u-a[0])/(b[0]-a[0]),0,1));
}
export function registerDressNeckline(dress,source){
 if(!dress?.mesh?.isSkinnedMesh||dress.stats?.sourceId!=='commons-0053'||dress.stats.ringCount!==9||!dress.stats.physicalFrontNeckline||source?.id!=='commons-0053')throw Error('Original reviewed nine-ring dress required');
 const m=dress.mesh,g=m.geometry,p=g.attributes.position,r=g.attributes.dressRest,rows=9,stride=p.count/rows,segments=stride-1;
 if(!Number.isInteger(stride)||segments<24||segments>96)throw Error('Unexpected source dress topology');
 const [cx,cy,cw,ch]=source.cropRect,top=Math.max(...Array.from({length:r.count},(_,i)=>r.getY(i))),hem=Math.min(...Array.from({length:r.count},(_,i)=>r.getY(i))),center=(r.getX(0)+r.getX(segments))/2;
 const width=Math.max(...Array.from({length:r.count},(_,i)=>Math.abs(r.getX(i)-center)));
 m.updateWorldMatrix(true,false);const inv=m.matrixWorld.clone().invert();let maxDrop=0,maxRegistration=0;
 // Redistribute the upper 25 cm, preventing the deeper V from folding through a
 // preceding ring. Front-side fade retains the unphotographed rear opening.
 for(let j=0;j<=segments;j++){
  const angle=2*Math.PI*j/segments,front=T.MathUtils.smoothstep(Math.cos(angle),0,.65),ti=8*stride+j;
  const ratio=Math.sin(angle),u=V_SOURCE.tip[0]+ratio*(ratio>=0?V_SOURCE.right[0]-V_SOURCE.tip[0]:V_SOURCE.tip[0]-V_SOURCE.left[0]);
  const imageY=sourceNeckY(u),sourceDrop=T.MathUtils.clamp((imageY-cy)/ch*(top-hem),0,.24)*front;
  const drop=.10*(1-Math.abs(ratio))*front;
  const registeredX=center+((u-cx)/cw-.5)*2*width;
  for(let row=0;row<rows;row++){
   const i=row*stride+j,q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld),originalY=r.getY(i),blend=T.MathUtils.clamp((originalY-(top-.25))/.25,0,1);
   // Undo the prior small geometric-only drop before applying the shared profile.
   if(blend===0)continue;
   const oldDrop=row===8?.028*Math.max(0,Math.cos(angle))**5:0;
   q.y+=oldDrop-drop*blend;p.setXYZ(i,...q.applyMatrix4(inv).toArray());
   r.setY(i,originalY-sourceDrop*blend);r.setX(i,T.MathUtils.lerp(r.getX(i),registeredX,blend**3*front));maxDrop=Math.max(maxDrop,drop*blend);maxRegistration=Math.max(maxRegistration,sourceDrop*blend);
  }
 }
 p.needsUpdate=true;r.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 dress.stats={...dress.stats,sourceRegisteredNeckline:true,sourceNecklineLandmarks:V_SOURCE,maxRegisteredNeckDrop:maxDrop,maxSourceRegistrationShift:maxRegistration,registration:'original-image piecewise-linear inner V; upper-panel redistribution',originalPhotoCoordinatesUnchanged:false,originalPhotoMappingPreserved:true,collisionValidated:false};
 return dress;
}

/** Resolve source-pose upper triangle interiors against original anatomical triangles.
 * Bounded garment-only displacement, not a full posed collision solver.
 */
export function clearNeckTriangleInteriors(dress,root){
 const m=dress.mesh,g=m.geometry,p=g.attributes.position,nearest=bodySurface(root);
 let neck;root.traverse(o=>{if(o.isBone&&o.name==='neck01')neck=o.getWorldPosition(new T.Vector3()).y;});
 if(!Number.isFinite(neck))throw Error('Original neck landmark required');
 m.updateWorldMatrix(true,false);const inverse=m.matrixWorld.clone().invert(),nodes=new Map(),rows=[];
 for(let i=0;i<p.count;i++){const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld),key=q.toArray().map(v=>v.toFixed(7)).join(',');if(!nodes.has(key))nodes.set(key,{q,original:q.clone(),ids:[]});const n=nodes.get(key);n.ids.push(i);rows.push(n);}
 let largest=0;
 for(let step=0;step<4;step++){
  const shifts=new Map();
  for(let t=0;t<g.index.count;t+=3){const ns=[0,1,2].map(k=>rows[g.index.getX(t+k)]),center=ns.reduce((q,n)=>q.add(n.q),new T.Vector3()).multiplyScalar(1/3);
   if(center.y<neck-.11)continue;
   const hit=nearest(center),gap=center.clone().sub(hit.point).dot(hit.normal),needed=.005-gap;
   if(needed<=0||needed>.025)continue;
   for(const n of ns){const delta=hit.normal.clone().multiplyScalar(Math.min(.004,needed));const old=shifts.get(n);if(!old||old.lengthSq()<delta.lengthSq())shifts.set(n,delta);}
  }
  for(const [n,delta]of shifts){n.q.add(delta);const d=n.q.clone().sub(n.original);if(d.length()>.008)n.q.copy(n.original).add(d.setLength(.008));largest=Math.max(largest,n.q.distanceTo(n.original));}
 }
 for(const n of nodes.values()){if(n.q.equals(n.original))continue;const local=n.q.clone().applyMatrix4(inverse);for(const i of n.ids)p.setXYZ(i,...local.toArray());}
 p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);g.computeBoundingBox();g.computeBoundingSphere();
 dress.stats={...dress.stats,neckTriangleClearance:true,maxNeckClearanceMovement:largest,clearanceReference:'original body triangle interiors in source pose',collisionValidated:false};return dress;
}
