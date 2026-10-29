/** Continuous garment relaxation against actual source-pose body triangles.
 * No photograph, UV, skin weight, skeleton or body vertex is rewritten.
 * Closest triangle samples constrain this pose only; not cloth simulation.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const key=p=>p.toArray().map(x=>x.toFixed(5)).join(',');
const point=(m,i)=>new T.Vector3().fromBufferAttribute(m.geometry.attributes.position,i).applyMatrix4(m.matrixWorld);
export function bodySurface(root){
 const triangles=[];root.updateMatrixWorld(true);
 root.traverse(m=>{
  if(!m.isSkinnedMesh||m.userData.work56Garment)return;
  const g=m.geometry,ps=g.attributes.position;
  for(let i=0;i<(g.index?.count||ps.count);i+=3){
   const tri=new T.Triangle(...[0,1,2].map(k=>point(m,g.index?g.index.getX(i+k):i+k)));
   const normal=tri.getNormal(new T.Vector3());if(normal.lengthSq()<.5)continue;
   const box=new T.Box3().setFromPoints([tri.a,tri.b,tri.c]);
   triangles.push({tri,normal,box,center:box.getCenter(new T.Vector3())});
  }
 });
 if(!triangles.length)throw Error('Actual anatomical triangles required');
 function build(rows){
  const box=new T.Box3();for(const row of rows)box.union(row.box);
  if(rows.length<=12)return {box,rows};
  const extent=box.getSize(new T.Vector3()),axis=extent.x>extent.y?(extent.x>extent.z?'x':'z'):(extent.y>extent.z?'y':'z');
  rows.sort((a,b)=>a.center[axis]-b.center[axis]);const mid=Math.floor(rows.length/2);
  return {box,left:build(rows.slice(0,mid)),right:build(rows.slice(mid))};
 }
 const tree=build(triangles),scratch=new T.Vector3();
 return p=>{
  let best=null,distance=Infinity;
  function visit(node){
   if(node.box.distanceToPoint(p)**2>distance)return;
   if(node.rows){for(const row of node.rows){
    const q=row.tri.closestPointToPoint(p,scratch),d=q.distanceToSquared(p);
    if(d<distance){distance=d;best={point:q.clone(),normal:row.normal,tri:row.tri,distance:Math.sqrt(d)};}
   }return;}
   const [first,second]=node.left.box.distanceToPoint(p)<node.right.box.distanceToPoint(p)?[node.left,node.right]:[node.right,node.left];
   visit(first);visit(second);
  }
  visit(tree);return best;
 };
}

export function fitContinuousShirt(shirt,root){
 if(!shirt?.meshes?.length)throw Error('Separate reviewed shirt required');
 const nearest=bodySurface(root),nodes=new Map(),meshNodes=new Map();
 // Weld geometry positions for relaxation, retaining each original skin/UV seam.
 for(const mesh of shirt.meshes){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,rows=[];
  for(let i=0;i<g.attributes.position.count;i++){
   const p=point(mesh,i),id=key(p);
   if(!nodes.has(id))nodes.set(id,{p,original:p.clone(),adj:new Set()});
   rows.push(nodes.get(id));
  }
  meshNodes.set(mesh,rows);
  for(let i=0;i<(g.index?.count||rows.length);i+=3){
   const ids=[0,1,2].map(k=>g.index?g.index.getX(i+k):i+k);
   for(let k=0;k<3;k++){const a=rows[ids[k]],b=rows[ids[(k+1)%3]];if(a!==b){a.adj.add(b);b.adj.add(a);}}
  }
 }
 for(const n of nodes.values())n.contact=nearest(n.original);
 // Relax body-derived muscle/offset discontinuities across shoulder and sleeve.
 // Bounded displacement retains the original hem and photo panel proportions.
 for(let step=0;step<5;step++){
  const next=new Map();
  for(const n of nodes.values()){
   const q=n.p.clone(),x=Math.abs(q.x);
   if(n.adj.size>2){
    const mean=new T.Vector3();for(const a of n.adj)mean.add(a.p);mean.multiplyScalar(1/n.adj.size);
    q.lerp(mean,x>.26?.38:.22);
   }
   const contact=n.contact;if(contact)contact.tri.closestPointToPoint(q,contact.point);
   if(contact){
    const gap=q.clone().sub(contact.point).dot(contact.normal);
    // Retain torso ease; shoulder and sleeve openings approach a sewn fit.
    const arm=T.MathUtils.smoothstep(x,.25,.36);
    const ease=T.MathUtils.lerp(.032,.009,arm);
    const correction=T.MathUtils.clamp(ease-gap,-.009,.009);
    q.addScaledVector(contact.normal,correction*.65);
   }
   // A single convex hanging torso surface bridges the breast/waist
   // contours inherited from the anatomical mesh. A rounded superellipse section keeps
   // the printed front broad while turning continuously into the side seams.
   const o=n.original,torso=(1-T.MathUtils.smoothstep(Math.abs(o.x),.245,.30))*T.MathUtils.smoothstep(o.y,1.10,1.17)*(1-T.MathUtils.smoothstep(o.y,1.38,1.62));
   if(torso>0){
    const {front,back,center}=shirt.stats.envelope;
    const width=.215+.018*T.MathUtils.smoothstep(o.y,1.23,1.46);
    const depth=o.z>=center?front+.015-center:center-back;
    const dx=o.x/width,dz=(o.z-center)/depth,r=(Math.abs(dx)**2.5+Math.abs(dz)**2.5)**.4;
    if(r>.001){const target=new T.Vector3(o.x/r,o.y,center+(o.z-center)/r);q.lerp(target,torso);}
   }
   // Neck opening must not be pulled down toward the chest by a nearest
   // surface query. Retain its existing source-bound collar topology.
   const collar=(1-T.MathUtils.smoothstep(Math.abs(o.x),.10,.14))*T.MathUtils.smoothstep(o.y,1.56,1.63);
   q.lerp(o,collar);
   const d=q.clone().sub(n.original);if(d.length()>.035)q.copy(n.original).add(d.setLength(.035));
   next.set(n,q);
  }
  for(const [n,q] of next)n.p.copy(q);
 }
 let moved=0,max=0;
 for(const mesh of shirt.meshes){
  const g=mesh.geometry,inv=mesh.matrixWorld.clone().invert();
  meshNodes.get(mesh).forEach((n,i)=>{
   const d=n.p.distanceTo(n.original);if(d>1e-5)moved++;max=Math.max(max,d);
   g.attributes.position.setXYZ(i,...n.p.clone().applyMatrix4(inv).toArray());
  });
  g.attributes.position.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,g.attributes.position.count);
  g.computeBoundingBox();g.computeBoundingSphere();
 }
 return {...shirt,stats:{...shirt.stats,continuousSurfaceFit:true,fitMovedVertices:moved,
  maxSurfaceMovement:max,fitReference:'closest-actual-body-triangles-source-pose',
  sourcePanelCoordinatesUnchanged:true,collisionValidated:false,releaseAuthorized:false}};
}
