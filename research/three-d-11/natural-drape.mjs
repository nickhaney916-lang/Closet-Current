/** Work59: post-fit geometry corrections; existing photo/material/skeleton reused. */
import * as T from 'three';
import {buildGarmentShell} from '../three-d-08/garment-shell.mjs';
export function refineGarment(shirt,root){
 const {front,back,center}=shirt.stats.envelope;
 const arms=[];for(const side of ['L','R']){let elbow,wrist;root.traverse(o=>{if(o.isBone&&o.name==='lowerarm01'+side)elbow=o.getWorldPosition(new T.Vector3());if(o.isBone&&o.name==='wrist'+side)wrist=o.getWorldPosition(new T.Vector3());});if(elbow&&wrist)arms.push({elbow,wrist});}
 let changed=0;
 for(const mesh of shirt.meshes){
  mesh.updateWorldMatrix(true,false);const g=mesh.geometry,p=g.attributes.position,rest=g.attributes.panelPosition,n=g.attributes.panelNormal,inverse=mesh.matrixWorld.clone().invert();
  for(let i=0;i<p.count;i++){
   const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),before=q.clone(),normal=new T.Vector3().fromBufferAttribute(n,i),x=Math.abs(q.x);
   // Ease off the inflated upper shoulder while retaining the original sleeve
   // and conservative baseline clearance. No skeleton or body changes.
   const shoulder=T.MathUtils.smoothstep(q.y,1.47,1.59)*(1-T.MathUtils.smoothstep(x,.18,.30));
   q.addScaledVector(normal,-.023*shoulder);q.y-=.006*shoulder;
   // A hanging convex cross-section bridges anatomical waist/bust concavity.
   // Fade near armholes so existing sleeve topology remains continuous.
   const torso=(1-T.MathUtils.smoothstep(x,.21,.28))*T.MathUtils.smoothstep(q.y,1.10,1.16)*(1-T.MathUtils.smoothstep(q.y,1.45,1.51));
   const width=.214+.009*T.MathUtils.smoothstep(q.y,1.29,1.45);
   const frontZ=front+.035-.008*(1-T.MathUtils.smoothstep(q.y,1.13,1.42));
   const backZ=back-.005;
   const dz=q.z-center,depth=dz>=0?frontZ-center:center-backZ;
   const r=Math.sqrt((q.x/width)**2+(dz/depth)**2);
   if(r>1e-6&&r<1){q.x=T.MathUtils.lerp(q.x,q.x/r,torso);q.z=T.MathUtils.lerp(q.z,center+dz/r,torso);}
   // Add radial ease around real forearm bones, rather than trusting a
   // source vertex normal at the compressed inner elbow/cuff transition.
   for(const {elbow,wrist} of arms)if(Math.sign(q.x)===Math.sign(wrist.x)&&Math.abs(q.x)>.30){const axis=wrist.clone().sub(elbow),t=T.MathUtils.clamp(q.clone().sub(elbow).dot(axis)/axis.lengthSq(),0,1),c=elbow.clone().addScaledVector(axis,t),radial=q.clone().sub(c);if(radial.lengthSq()>.00001){const ease=.006*T.MathUtils.smoothstep(t,0,.16);q.addScaledVector(radial.normalize(),ease);}}
   // Subtle hem fullness, strongest at side seams, without artificial waves.
   const hem=1-T.MathUtils.smoothstep(q.y,1.11,1.18);q.x+=Math.sign(q.x)*.004*hem*T.MathUtils.smoothstep(x,.13,.20);
   if(before.distanceToSquared(q)>1e-12)changed++;
   const local=q.clone().applyMatrix4(inverse);p.setXYZ(i,local.x,local.y,local.z);
   // Keep source photo scale on the updated rest geometry; bone pose changes
   // never touch this coordinate or duplicate print onto rear/sleeves.
   rest.setXYZ(i,q.x,q.y,q.z);
  }
  p.needsUpdate=true;rest.needsUpdate=true;g.computeVertexNormals();
  // Average coincident normals including existing boundary geometry. No added
  // polygons itself; the separate collar band is appended below. Existing
  // edge thickness remains Work56's 4 mm.
  const groups=new Map(),nn=g.attributes.normal;
  for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}
  for(const ids of groups.values()){const a=new T.Vector3();for(const i of ids)a.add(new T.Vector3().fromBufferAttribute(nn,i));if(a.lengthSq()<1e-10)continue;a.normalize();for(const i of ids)nn.setXYZ(i,a.x,a.y,a.z);}nn.needsUpdate=true;
  g.computeBoundingBox();g.computeBoundingSphere();
 }
 addCollarBand(shirt,root);
 shirt.stats={...shirt.stats,refinement:'Work59-convex-drape-shoulder-ease',baseOffsetMinimum:.018,minClearance:null,collisionValidated:false,correctedVertices:changed};return shirt;
}
export function buildNaturalShirt(root,candidate,options){return refineGarment(buildGarmentShell(root,candidate,options),root);}

function addCollarBand(shirt,root){
 let neck;root.traverse(o=>{if(o.isBone&&o.name==='neck01')neck=o.getWorldPosition(new T.Vector3());});if(!neck)throw Error('Neck landmark required');
 let added=0;
 for(const mesh of [...shirt.meshes]){
  const g=mesh.geometry,p=g.attributes.position,edges=new Map();
  const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');
  for(let j=0;j<g.index.count;j+=3)for(let k=0;k<3;k++){const a=g.index.getX(j+k),b=g.index.getX(j+(k+1)%3),id=[key(a),key(b)].sort().join('|');const e=edges.get(id);if(e)e.count++;else edges.set(id,{a,b,count:1});}
  const data={position:[],panelPosition:[],panelNormal:[],skinIndex:[],skinWeight:[]},inv=mesh.matrixWorld.clone().invert();
  const emit=(i,world)=>{data.position.push(...world.clone().applyMatrix4(inv).toArray());data.panelPosition.push(...world.toArray());data.panelNormal.push(0,1,0);for(const name of ['skinIndex','skinWeight'])for(let k=0;k<4;k++)data[name].push(g.attributes[name].array[i*4+k]);};
  const inner=q=>{const a=Math.atan2((q.z-neck.z)/.12,q.x/.09),f=Math.max(0,Math.sin(a));return new T.Vector3(Math.cos(a)*.071,neck.y-.036-.023*f,neck.z+Math.sin(a)*(Math.sin(a)>0?.13:.09));};
  for(const {a,b,count} of edges.values())if(count===1){
   const x=new T.Vector3().fromBufferAttribute(p,a).applyMatrix4(mesh.matrixWorld),y=new T.Vector3().fromBufferAttribute(p,b).applyMatrix4(mesh.matrixWorld);
   if(x.y<neck.y-.11||y.y<neck.y-.11||Math.abs(x.x)>.14||Math.abs(y.x)>.14)continue;
   const u=inner(x),v=inner(y);emit(a,x);emit(b,y);emit(a,u);emit(b,y);emit(b,v);emit(a,u);added+=2;
  }
  if(!data.position.length)continue;
  const band=new T.BufferGeometry();for(const name of ['position','panelPosition','panelNormal'])band.setAttribute(name,new T.Float32BufferAttribute(data[name],3));band.setAttribute('skinIndex',new T.Uint16BufferAttribute(data.skinIndex,4));band.setAttribute('skinWeight',new T.Float32BufferAttribute(data.skinWeight,4));band.computeVertexNormals();
  const collar=new T.SkinnedMesh(band,mesh.material);collar.position.copy(mesh.position);collar.quaternion.copy(mesh.quaternion);collar.scale.copy(mesh.scale);collar.name='Work59-source-neutral-collar-band';collar.userData.work56Garment=true;collar.frustumCulled=false;mesh.parent.add(collar);collar.bind(mesh.skeleton,mesh.bindMatrix);shirt.meshes.push(collar);
 }
 shirt.stats.triangles+=added;shirt.stats.collarTriangles=added;
}
