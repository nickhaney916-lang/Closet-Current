/** Independent, connected trouser pattern grid. Research/HOLD.
 * Two 48-column legs join one 64-column pelvis through a shared crotch curve.
 * This is authored pattern geometry, NOT a photograph, cloth physics or scan.
 * Photographic coordinate fields are barycentrically transferred from PR446.
 */
import * as T from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
const clamp=T.MathUtils.clamp,lerp=T.MathUtils.lerp;
export function triangleLookup(geometry){
 const p=geometry.attributes.position,ix=geometry.index,rows=[];
 for(let i=0;i<(ix?.count??p.count);i+=3){
  const ids=[0,1,2].map(k=>ix?ix.getX(i+k):i+k),tri=new T.Triangle(...ids.map(j=>new T.Vector3().fromBufferAttribute(p,j)));
  if(tri.getArea()<1e-13)continue;
  const box=new T.Box3().setFromPoints([tri.a,tri.b,tri.c]);rows.push({tri,ids,box,c:box.getCenter(new T.Vector3())});
 }
 function build(a){const box=new T.Box3();a.forEach(r=>box.union(r.box));if(a.length<12)return {box,a};const s=box.getSize(new T.Vector3()),axis=s.x>s.y?(s.x>s.z?'x':'z'):(s.y>s.z?'y':'z');a.sort((x,y)=>x.c[axis]-y.c[axis]);const mid=a.length>>1;return {box,l:build(a.slice(0,mid)),r:build(a.slice(mid))};}
 const tree=build(rows),scratch=new T.Vector3();
 return q=>{let best=null,d=Infinity;function visit(n){if(n.box.distanceToPoint(q)**2>d)return;if(n.a){for(const row of n.a){const point=row.tri.closestPointToPoint(q,scratch),dd=point.distanceToSquared(q);if(dd<d){d=dd;best={...row,point:point.clone(),distance:Math.sqrt(dd)};}}return;}const [a,b]=n.l.box.distanceToPoint(q)<n.r.box.distanceToPoint(q)?[n.l,n.r]:[n.r,n.l];visit(a);visit(b);}visit(tree);if(!best)throw Error('Empty garment surface');best.bary=best.tri.getBarycoord(best.point,new T.Vector3()).toArray();return best;};
}
const quant=(v,q)=>{const s=v.slice().sort((a,b)=>a-b);return s[Math.floor((s.length-1)*q)];};
export function sewPatternTrousers(pants,root){
 const m=pants?.meshes?.[0],src=m?.geometry;
 if(!pants?.stats?.originalPhotographedHangingLegPanels||!src?.attributes.pantsSourceUV)throw Error('Verified PR446 photographic jeans required');
 m.updateWorldMatrix(true,false);const inv=m.matrixWorld.clone().invert(),p=src.attributes.position;
 const nodes=Array.from({length:p.count},(_,i)=>new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld));
 const {waistY,hemY,landmarks}=pants.stats,hipY=(landmarks[0].hip[1]+landmarks[1].hip[1])/2;
 // Fixed pattern crotch level from original rig landmarks, not copied skin edges.
 const crotchY=hipY-.105,half=32,bridge=16,N=half+bridge,points=[],faces=[];
 const add=v=>{points.push(v);return points.length-1;};
 function envelope(y,sign=0){
  const a=nodes.filter(q=>Math.abs(q.y-y)<.035&&(!sign||Math.sign(q.x)===sign));
  if(a.length<12)throw Error('Insufficient original cloth section');
  const xs=a.map(q=>q.x),zs=a.map(q=>q.z),minX=quant(xs,0),maxX=quant(xs,1),minZ=quant(zs,0),maxZ=quant(zs,1);
  return {cx:sign?(minX+maxX)/2:0,cz:(minZ+maxZ)/2,rx:Math.max(.045,(maxX-minX)/2)+.008,rz:Math.max(.04,(maxZ-minZ)/2)+.012};
 }
 const pelvis=[];for(let j=0;j<=12;j++){
  const y=lerp(crotchY,waistY,j/12),e=envelope(y),ring=[];
  for(let k=0;k<64;k++){const a=2*Math.PI*k/64;ring.push(add(new T.Vector3(e.rx*Math.sin(a),y,e.cz+e.rz*Math.cos(a))));}
  pelvis.push(ring);
 }
 const join=(a,b)=>{for(let k=0;k<a.length;k++){const n=(k+1)%a.length;faces.push(a[k],b[k],a[n],a[n],b[k],b[n]);}};
 for(let j=0;j<12;j++)join(pelvis[j],pelvis[j+1]);
 const bottom=pelvis[0],front=points[bottom[0]],back=points[bottom[32]],saddle=[];
 for(let k=1;k<bridge;k++){const t=k/bridge;saddle.push(add(new T.Vector3(0,crotchY-.024*Math.sin(Math.PI*t),lerp(back.z,front.z,t))));}
 // Right boundary front→outer→back→shared crotch→front. Left uses reversed saddle.
 const tops=[bottom.slice(0,33).concat(saddle),[bottom[0],...bottom.slice(33).reverse(),bottom[32],...saddle]];
 for(let side=0;side<2;side++){
  const sign=side===0?1:-1,top=tops[side],hip=landmarks[side].hip,knee=landmarks[side].knee;
  const rows=[];for(let j=0;j<31;j++){
   const t=j/31,y=lerp(hemY,crotchY,t),e=envelope(y,sign),ring=[];
   // Smooth pattern legs: fullness is a continuous cut, independent of muscles.
   const kneeE=envelope(knee[1],sign),upperE=envelope(crotchY-.07,sign),u=clamp((y-knee[1])/(crotchY-knee[1]),0,1);
   const rx=y>knee[1]?lerp(kneeE.rx,upperE.rx,u):e.rx,rz=y>knee[1]?lerp(kneeE.rz,upperE.rz,u):e.rz;
   for(let k=0;k<N;k++){
    const a=k<=32?Math.PI*k/32:Math.PI+Math.PI*(k-32)/16,v=new T.Vector3(e.cx+sign*rx*Math.sin(a),y,e.cz+rz*Math.cos(a));
    // Last rows blend into the sewn shared pattern boundary, no disconnected cap.
    const blend=T.MathUtils.smoothstep(t,.78,1);const q=points[top[k]];
    v.x=lerp(v.x,q.x,blend);v.z=lerp(v.z,q.z,blend);ring.push(add(v));
   }rows.push(ring);
  }
  for(let j=0;j<rows.length-1;j++)side===0?join(rows[j],rows[j+1]):join(rows[j+1],rows[j]);
  side===0?join(rows.at(-1),top):join(top,rows.at(-1));
 }
 const nearestBody=bodySurface(root);let contactAdjusted=0,contactMax=0;
 for(const q of points){for(let pass=0;pass<3;pass++){const h=nearestBody(q),gap=q.clone().sub(h.point).dot(h.normal);if(gap>=.005||h.distance>.085)break;const shift=Math.min(.035,.005-gap);q.addScaledVector(h.normal,shift);contactAdjusted++;contactMax=Math.max(contactMax,shift);}}
 const geometry=new T.BufferGeometry(),local=points.map(q=>q.clone().applyMatrix4(inv));
 geometry.setAttribute('position',new T.Float32BufferAttribute(local.flatMap(q=>q.toArray()),3));for(let i=0;i<faces.length;i+=3)[faces[i+1],faces[i+2]]=[faces[i+2],faces[i+1]];geometry.setIndex(faces);
 const nearest=triangleLookup(src),hits=local.map(nearest);let maxTransfer=0;
 for(const h of hits)maxTransfer=Math.max(maxTransfer,h.distance);
 for(const [name,attr] of Object.entries(src.attributes)){
  if(['position','normal','skinIndex','skinWeight'].includes(name))continue;
  const vals=[];for(const h of hits)for(let k=0;k<attr.itemSize;k++)vals.push(h.ids.reduce((s,id,j)=>s+attr.array[id*attr.itemSize+k]*h.bary[j],0));
  geometry.setAttribute(name,new T.Float32BufferAttribute(vals,attr.itemSize));
 }
 const indices=[],weights=[];
 for(const h of hits){const map=new Map();for(let j=0;j<3;j++)for(let k=0;k<4;k++){const i=src.attributes.skinIndex.array[h.ids[j]*4+k],w=src.attributes.skinWeight.array[h.ids[j]*4+k]*h.bary[j];map.set(i,(map.get(i)||0)+w);}const a=[...map].sort((x,y)=>y[1]-x[1]).slice(0,4),sum=a.reduce((s,x)=>s+x[1],0);while(a.length<4)a.push([0,0]);indices.push(...a.map(x=>x[0]));weights.push(...a.map(x=>x[1]/sum));}
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 m.geometry=geometry;let disposed=false;
 return {...pants,stats:{...pants.stats,independentSewnPattern:true,patternTopology:'connected authored pelvis and two leg grids sharing crotch curve; original body topology not reused',sourcePhotoUVUnchanged:false,originalSourcePhotoAndUVUnchanged:false,originalDenimSkinAndRestUnchanged:false,skinWeightsUnchanged:false,restBodyPhotoCoordinatesUnchanged:false,sourceCoordinateFieldsResampled:true,sourceImageBytesAndColorsUnchanged:true,patternBodyContactAdjusted:contactAdjusted,patternBodyContactMaxStep:contactMax,patternVertices:points.length,patternTriangles:faces.length/3,patternCrotchSharedVertices:bridge+1,sourceTransferMaxDistance:maxTransfer,sourceTransfer:'nearest original garment triangle barycentric coordinates; resampled fields, not byte-identical arrays',rearPhotoInvented:false,collisionCertified:false},dispose(){if(disposed)return;disposed=true;geometry.dispose();pants.dispose();}};
}
