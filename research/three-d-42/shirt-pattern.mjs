/** Independent rear cut panel. Original front/source attributes are retained;
 * new unphotographed rear samples are explicitly source-neutral. No cloth physics. */
import * as T from 'three';
import {triangleLookup} from './pattern-trousers.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
export function constructShirtPanels(shirt){
 let replaced=0,inserted=0,panels=0,moved=0;
 const center=shirt.stats.envelope.center;
 for(const mesh of shirt.meshes){
  if(mesh.name!=='Work56-independent-shirt-shell')continue;
  mesh.updateWorldMatrix(true,false);const src=mesh.geometry,p=src.attributes.position,ix=src.index,inv=mesh.matrixWorld.clone().invert();
  const world=Array.from({length:p.count},(_,i)=>new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld));
  const key=i=>world[i].toArray().map(v=>v.toFixed(5)).join(':');
  const selected=new Set(),edges=new Map();
  for(let t=0;t<ix.count;t+=3){const ids=[0,1,2].map(k=>ix.getX(t+k));if(!ids.every(i=>{const q=world[i];return Math.abs(q.x)<.185&&q.y>1.18&&q.y<1.51&&q.z<center-.04&&src.attributes.panelNormal.getZ(i)<-.3;}))continue;
   selected.add(t);for(let k=0;k<3;k++){const a=ids[k],b=ids[(k+1)%3],ka=key(a),kb=key(b),id=[ka,kb].sort().join('|');if(edges.has(id))edges.get(id).n++;else edges.set(id,{a,b,ka,kb,n:1});}
  }
  if(selected.size<50)continue;
  const boundary=[...edges.values()].filter(e=>e.n===1),adj=new Map(),vertex=new Map();
  for(const e of boundary){vertex.set(e.ka,e.a);vertex.set(e.kb,e.b);for(const [a,b] of [[e.ka,e.kb],[e.kb,e.ka]]){if(!adj.has(a))adj.set(a,[]);adj.get(a).push(b);}}
  if([...adj.values()].some(a=>a.length!==2))continue;
  const loop=[],first=adj.keys().next().value;let at=first,previous=null;
  do{loop.push(vertex.get(at));const next=adj.get(at).find(n=>n!==previous);previous=at;at=next;if(loop.length>adj.size+1)throw Error('Rear pattern boundary invalid');}while(at!==first);
  if(loop.length!==adj.size)continue; // Do not silently cap separate openings.
  const outline=loop.map(i=>new T.Vector2(world[i].x,world[i].y)),tri=T.ShapeUtils.triangulateShape(outline,[]).map(a=>a.map(i=>loop[i]));
  const data=Object.fromEntries(Object.entries(src.attributes).filter(([n])=>n!=='normal').map(([n,a])=>[n,Array.from(a.array)]));
  const allWorld=world.slice(),lookup=triangleLookup(src),back=loop.map(i=>world[i].z).sort((a,b)=>a-b),z=back[Math.floor(back.length*.2)]-.006;
  const add=(q)=>{const local=q.clone().applyMatrix4(inv),h=lookup(local),id=data.position.length/3;
   for(const [n,a] of Object.entries(src.attributes)){if(n==='normal')continue;if(n==='position'){data[n].push(...local.toArray());continue;}if(n==='skinIndex'||n==='skinWeight')continue;for(let k=0;k<a.itemSize;k++)data[n].push(h.ids.reduce((s,i,j)=>s+a.array[i*a.itemSize+k]*h.bary[j],0));}
   const weights=new Map();h.ids.forEach((i,j)=>{for(let k=0;k<4;k++){const id=src.attributes.skinIndex.array[i*4+k],w=src.attributes.skinWeight.array[i*4+k]*h.bary[j];weights.set(id,(weights.get(id)||0)+w);}});const a=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4);while(a.length<4)a.push([0,0]);const sum=a.reduce((s,x)=>s+x[1],0);data.skinIndex.push(...a.map(x=>x[0]));data.skinWeight.push(...a.map(x=>x[1]/sum));
   // New rear is never represented as photographed front fabric.
   data.panelNormal[id*3+2]=-1;allWorld.push(q);return id;
  };
  for(let y=1.20;y<1.49;y+=.018)for(let x=-.165;x<.17;x+=.018){
   const q2=new T.Vector2(x,y);let hit=-1;
   for(let j=0;j<tri.length;j++){const a=tri[j].map(i=>new T.Vector3(allWorld[i].x,allWorld[i].y,0)),b=new T.Triangle(...a).getBarycoord(new T.Vector3(x,y,0),new T.Vector3());if(b&&Math.min(b.x,b.y,b.z)>.025){hit=j;break;}}
   if(hit<0)continue;const face=tri.splice(hit,1)[0],q=new T.Vector3(x,y,z+.006*((x/.18)**2)),id=add(q);tri.push([face[0],face[1],id],[face[1],face[2],id],[face[2],face[0],id]);inserted++;
  }
  // Lawson edge flips regularize the inserted cut grid; preserve the original
  // boundary exactly rather than leave an earcut fan of long skinny triangles.
  const area=(a,b,c)=>(allWorld[b].x-allWorld[a].x)*(allWorld[c].y-allWorld[a].y)-(allWorld[b].y-allWorld[a].y)*(allWorld[c].x-allWorld[a].x);
  const quality=a=>{const q=a.map(i=>allWorld[i]);const lengths=[q[0].distanceToSquared(q[1]),q[1].distanceToSquared(q[2]),q[2].distanceToSquared(q[0])];return Math.abs(area(...a))/(Math.max(...lengths)+1e-12);};
  for(let pass=0;pass<16;pass++){const edges=new Map();for(let j=0;j<tri.length;j++)for(let k=0;k<3;k++){const a=tri[j][k],b=tri[j][(k+1)%3],c=tri[j][(k+2)%3],key=[a,b].sort((a,b)=>a-b).join(':');if(!edges.has(key))edges.set(key,[]);edges.get(key).push({j,a,b,c});}const touched=new Set();let flips=0;
   for(const rows of edges.values()){if(rows.length!==2)continue;const [a,b]=rows;if(touched.has(a.j)||touched.has(b.j)||a.c===b.c)continue;if(area(a.a,a.b,a.c)*area(a.a,a.b,b.c)>=0||area(a.c,b.c,a.a)*area(a.c,b.c,a.b)>=0)continue;const next=[[a.c,b.c,a.a],[b.c,a.c,a.b]];if(Math.min(...next.map(quality))>Math.min(quality(tri[a.j]),quality(tri[b.j]))+1e-6){tri[a.j]=next[0];tri[b.j]=next[1];touched.add(a.j);touched.add(b.j);flips++;}}
   if(!flips)break;
  }
  const adjacency=new Map();for(const face of tri)for(let k=0;k<3;k++){const a=face[k],b=face[(k+1)%3];if(!adjacency.has(a))adjacency.set(a,new Set());if(!adjacency.has(b))adjacency.set(b,new Set());adjacency.get(a).add(b);adjacency.get(b).add(a);}
  // Harmonic boundary-to-panel depth removes an artificial rigid rim while
  // discarding anatomical interior muscle relief. Front photo fields untouched.
  for(let pass=0;pass<120;pass++){const next=new Map();for(const [id,near] of adjacency)if(id>=world.length){const value=[...near].reduce((s,j)=>s+allWorld[j].z,0)/near.size;next.set(id,value);}for(const [id,value] of next)allWorld[id].z=value;}
  for(let id=world.length;id<allWorld.length;id++){const q=allWorld[id].clone().applyMatrix4(inv);data.position[id*3]=q.x;data.position[id*3+1]=q.y;data.position[id*3+2]=q.z;}
  const indices=[];for(let t=0;t<ix.count;t+=3)if(!selected.has(t))indices.push(ix.getX(t),ix.getX(t+1),ix.getX(t+2));
  for(const a of tri){const face=new T.Triangle(...a.map(i=>allWorld[i]));if(face.getNormal(new T.Vector3()).z>0)[a[1],a[2]]=[a[2],a[1]];indices.push(...a);}
  const g=new T.BufferGeometry();for(const [n,a] of Object.entries(src.attributes)){if(n==='normal')continue;g.setAttribute(n,n==='skinIndex'?new T.Uint16BufferAttribute(data[n],a.itemSize):new T.Float32BufferAttribute(data[n],a.itemSize));}g.setIndex(indices);g.computeVertexNormals();smoothSurfaceNormals(g,g.attributes.position.count);g.computeBoundingBox();g.computeBoundingSphere();mesh.geometry=g;src.dispose();replaced+=selected.size;panels++;
 }
 if(!panels||inserted<80)throw Error('Independent neutral rear shirt panel construction unavailable');
 return {...shirt,stats:{...shirt.stats,independentRearShirtPattern:true,replacedRearTriangles:replaced,newRearPatternVertices:inserted,rearPanels:panels,frontSourceVerticesRetained:true,sourcePanelCoordinatesUnchanged:false,originalShirtSkinAndOriginalPantUVUnchanged:false,frontCoordinatePrefixPreserved:true,newRearFieldsResampled:true,triangles:shirt.meshes.reduce((s,m)=>s+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),newRearPhotograph:false,trueClothSimulation:false}};
}
