/** Work60: anatomical lower-body shell. Neutral research cloth, NOT photo pants.
 * Fit only in the original normalized rest pose; keep original four bone weights.
 * No cylinders, body edits, new cutouts, textures, accounts or shirt corrections.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
export function buildResearchPants(root){
 root.updateMatrixWorld(true);
 const bone=name=>{let b;root.traverse(o=>{if(o.isBone&&o.name.replaceAll('.','')===name)b=o;});if(!b)throw Error('Missing pants landmark '+name);return b.getWorldPosition(new T.Vector3());};
 const waist=bone('spine04').y+.006,legs=['L','R'].map(s=>({hip:bone('upperleg01'+s),knee:bone('lowerleg01'+s),ankle:bone('foot'+s)}));
 const hem=Math.max(...legs.map(l=>l.ankle.y))+.038;
 // Only the continuous primary body topology, never auxiliary anatomy/eyes.
 const bodies=[];root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment&&!o.userData.work60Pants)bodies.push(o);});
 const original=bodies.sort((a,b)=>b.geometry.attributes.position.count-a.geometry.attributes.position.count)[0];
 if(!original||original.geometry.attributes.position.count<10000)throw Error('Continuous anatomical body required');
 const g=original.geometry,world=[],nm=new T.Matrix3().getNormalMatrix(original.matrixWorld),inverse=original.matrixWorld.clone().invert();
 const samples=[];
 const lowerBones=new Set(original.skeleton.bones.flatMap((b,i)=>/^(pelvis|upperleg|lowerleg|foot|spine0[345])/.test(b.name)?[i]:[]));
 const lowerWeight=i=>Array.from({length:4},(_,k)=>lowerBones.has(g.attributes.skinIndex.array[i*4+k])?g.attributes.skinWeight.array[i*4+k]:0).reduce((a,b)=>a+b,0);
 const belongs=i=>lowerWeight(i)>.5;
 for(let i=0;i<g.attributes.position.count;i++){const p=new T.Vector3().fromBufferAttribute(g.attributes.position,i).applyMatrix4(original.matrixWorld);world.push(p);if(belongs(i)&&p.y>=hem-.035&&p.y<=waist+.03)samples.push(p);}
 const centerAt=(leg,y)=>{const a=y>leg.knee.y?leg.hip:leg.knee,b=y>leg.knee.y?leg.knee:leg.ankle;return a.clone().lerp(b,T.MathUtils.clamp((a.y-y)/(a.y-b.y),0,1));};
 // Slice envelopes follow actual hip/leg measurements; interpolated between
 // 15mm samples so muscle relief does not become painted-on trousers.
 const ringCache=new Map();
 const ring=(y,side)=>{
  const id=Math.round(y/.015)+':'+side;if(ringCache.has(id))return ringCache.get(id);
  const yy=Math.round(y/.015)*.015,leg=legs[side],c=centerAt(leg,yy),pelvis=yy>.925;
  const pts=samples.filter(p=>Math.abs(p.y-yy)<.025&&(pelvis||Math.sign(p.x)===Math.sign(leg.hip.x)));
  let cx=pelvis?0:c.x,cz=pelvis?(legs[0].hip.z+legs[1].hip.z)/2:c.z;
  let rx=pelvis?.19:.055,rz=pelvis?.13:.06;
  for(const p of pts){rx=Math.max(rx,Math.abs(p.x-cx));rz=Math.max(rz,Math.abs(p.z-cz));}
  // Narrow waist stays beneath the original shirt hem; fuller lower legs.
  const ease=yy>1.10?.012:(yy>.90?.018:.026);
  const value={cx,cz,rx:rx+ease,rz:rz+ease,pelvis};ringCache.set(id,value);return value;
 };
 const verts=[],cache=new Map();
 const vertex=i=>{
  if(cache.has(i))return cache.get(i);
  const p=world[i],n=new T.Vector3().fromBufferAttribute(g.attributes.normal,i).applyMatrix3(nm).normalize(),side=p.x>=0?0:1;
  const q=p.clone().addScaledVector(n,.018);
  if(p.y>=hem-.04&&p.y<=waist+.04){
   const lo=Math.floor(p.y/.015)*.015,t=(p.y-lo)/.015,a=ring(lo,side),b=ring(lo+.015,side),r={};for(const k of ['cx','cz','rx','rz'])r[k]=T.MathUtils.lerp(a[k],b[k],t);
   const dx=q.x-r.cx,dz=q.z-r.cz,rad=Math.hypot(dx/r.rx,dz/r.rz);
   // Keep the connected anatomical crotch; blend leg shaping below it rather
   // than pushing midline crotch vertices out onto independent tube surfaces.
   const influence=p.y>.925?T.MathUtils.smoothstep(p.y,.925,1.025)*(1-T.MathUtils.smoothstep(p.y,waist-.045,waist-.008)):1-T.MathUtils.smoothstep(p.y,.82,.925);
   if(rad>1e-5&&rad<1){q.x=T.MathUtils.lerp(q.x,r.cx+dx/rad,influence);q.z=T.MathUtils.lerp(q.z,r.cz+dz/rad,influence);}
  }
  const v={p:q,clip:q.clone(),n,skin:Array.from({length:4},(_,k)=>g.attributes.skinIndex.array[i*4+k]),weight:Array.from({length:4},(_,k)=>g.attributes.skinWeight.array[i*4+k])};cache.set(i,v);return v;
 };
 const lerp=(a,b,t)=>{const w=new Map();for(const [v,f] of [[a,1-t],[b,t]])v.skin.forEach((id,k)=>w.set(id,(w.get(id)||0)+v.weight[k]*f));const sorted=[...w].sort((a,b)=>b[1]-a[1]).slice(0,4);while(sorted.length<4)sorted.push([0,0]);const sum=sorted.reduce((s,v)=>s+v[1],0);return {p:a.p.clone().lerp(b.p,t),clip:a.clip.clone().lerp(b.clip,t),n:a.n.clone().lerp(b.n,t).normalize(),skin:sorted.map(x=>x[0]),weight:sorted.map(x=>x[1]/sum)};};
 for(let j=0;j<(g.index?.count||g.attributes.position.count);j+=3){
  const sourceIds=[0,1,2].map(k=>g.index?g.index.getX(j+k):j+k);if(!sourceIds.every(belongs))continue;
  let poly=sourceIds.map(vertex);
  for(const plane of [p=>waist-p.y,p=>p.y-hem]){const out=[];for(let k=0;k<poly.length;k++){const a=poly[k],b=poly[(k+1)%poly.length],da=plane(a.clip),db=plane(b.clip);if(da>=0)out.push(a);if((da>=0)!==(db>=0))out.push(lerp(a,b,da/(da-db)));}poly=out;if(!poly.length)break;}
  for(let k=1;k+1<poly.length;k++)verts.push(poly[0],poly[k],poly[k+1]);
 }
 const surfaceVertices=verts.length,edges=new Map(),key=v=>v.p.toArray().map(n=>n.toFixed(5)).join(',');
 for(let i=0;i<surfaceVertices;i+=3)for(let k=0;k<3;k++){const a=verts[i+k],b=verts[i+(k+1)%3],id=[key(a),key(b)].sort().join('|'),e=edges.get(id);if(e)e.count++;else edges.set(id,{a,b,count:1});}
 let openingEdges=0;for(const {a,b,count} of edges.values())if(count===1&&((a.clip.y>waist-.001&&b.clip.y>waist-.001)||(a.clip.y<hem+.001&&b.clip.y<hem+.001))){const inner=v=>({...v,p:v.p.clone().addScaledVector(v.n.clone().setY(0).normalize(),-.003)});verts.push(a,inner(a),b,b,inner(a),inner(b));openingEdges++;}
 const geometry=new T.BufferGeometry(),positions=[],indices=[],weights=[],rest=[];
 for(const v of verts){positions.push(...v.p.clone().applyMatrix4(inverse).toArray());rest.push(...v.p.toArray());indices.push(...v.skin);weights.push(...v.weight);}
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('pantsRest',new T.Float32BufferAttribute(rest,3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometry.computeVertexNormals();smoothSurfaceNormals(geometry,surfaceVertices);
 const material=new T.MeshStandardMaterial({color:0x596776,roughness:.96,metalness:0,side:T.DoubleSide});
 // Deliberately solid neutral cloth. No fake pockets, logos, seams or back print.
 const mesh=new T.SkinnedMesh(geometry,material);mesh.name='Work60-neutral-research-pants-NOT-PHOTO';mesh.userData.work60Pants=true;mesh.userData.work56Garment=true;
 mesh.position.copy(original.position);mesh.quaternion.copy(original.quaternion);mesh.scale.copy(original.scale);original.parent.add(mesh);mesh.bind(original.skeleton,original.bindMatrix);mesh.frustumCulled=false;
 const otherEdges=[...edges.values()].filter(e=>e.count===1&&!((e.a.clip.y>waist-.001&&e.b.clip.y>waist-.001)||(e.a.clip.y<hem+.001&&e.b.clip.y<hem+.001)));
 const stats={unsealedEdges:otherEdges.length,triangles:verts.length/3,openingEdges,waistY:waist,hemY:hem,landmarks:legs.map(l=>Object.fromEntries(Object.entries(l).map(([k,v])=>[k,v.toArray()]))),sharedSkeleton:true,photoApplied:false,sourceSHA256:null,materialMode:'neutral-research-no-valid-cutout',collisionValidated:false,releaseAuthorized:false};
 if(stats.triangles<5000){mesh.removeFromParent();geometry.dispose();material.dispose();throw Error('Insufficient lower body geometry');}
 return {meshes:[mesh],stats,dispose(){mesh.removeFromParent();geometry.dispose();material.dispose();}};
}
