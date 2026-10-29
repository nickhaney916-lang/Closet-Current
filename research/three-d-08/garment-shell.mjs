/** Work56: separate source-bound anatomical shell. No body shader shortcut.
 * Rest-pose body topology and skin weights are reused; originals never modified.
 * This is offset tailoring research, not cloth simulation or measurement fit.
 */
import * as T from 'three';
import {requireAnatomicalShirtPreview} from '../three-d-07/rig-shirt-transfer.mjs';
import {originalPhotoSpan,deriveTorsoEnvelope,roundedNeckBoundary,drapeTorso,smoothSurfaceNormals} from './garment-fit-profile.mjs';
export function buildGarmentShell(root,candidate,{acknowledged=false}={}){
 const source=requireAnatomicalShirtPreview(candidate,{acknowledged});
 root.updateMatrixWorld(true);
 const bone=name=>{let found;root.traverse(o=>{if(o.isBone&&o.name.replaceAll('.','')===name)found=o;});if(!found)throw Error('Missing anatomical landmark '+name);return found.getWorldPosition(new T.Vector3());};
 const neck=bone('neck01'),waist=bone('spine04');
 const envelope=deriveTorsoEnvelope(root),photoSpan=originalPhotoSpan(source.textureImage,source.cropRect);
 const wrists=['L','R'].map(s=>({p:bone('wrist'+s),n:bone('wrist'+s).sub(bone('lowerarm02'+s)).normalize()}));
 // Continuous open boundaries cut through existing anatomy, not cylinder parts.
 const planes=[p=>p.y-(waist.y-.025),p=>roundedNeckBoundary(p,neck.y,envelope.center),
  ...wrists.map(({p:w,n})=>p=>w.clone().sub(p).dot(n)-.013)];
 const texture=new T.Texture(source.textureImage);texture.colorSpace=T.SRGBColorSpace;
 texture.needsUpdate=true;
 const material=new T.MeshStandardMaterial({color:0xffffff,roughness:.94,side:T.DoubleSide});
 const base=new T.Color().setRGB(...source.baseColor,T.SRGBColorSpace);
 // Photo is sampled ONCE on the front chest panel. Side/rear/sleeve coverage
 // is neutral source-median cloth: never repeat logos or fabricate rear imagery.
 material.onBeforeCompile=s=>{
  Object.assign(s.uniforms,{uPhoto:{value:texture},uFabric:{value:base},uCrop:{value:new T.Vector4(...source.cropRect)},uPhotoSpan:{value:new T.Vector2(photoSpan.width,photoSpan.height)},uFrontDepth:{value:envelope.center},uNeck:{value:neck.y},uPhotoTexel:{value:new T.Vector2(1/photoSpan.imageWidth,1/photoSpan.imageHeight)}});
  s.vertexShader=s.vertexShader.replace('void main() {','attribute vec3 panelPosition;attribute vec3 panelNormal;\nvarying vec3 vPanel;\nvarying vec3 vPanelNormal;\nvoid main() {');
  s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvPanel=panelPosition;vPanelNormal=panelNormal;');
  s.fragmentShader=s.fragmentShader.replace('void main() {','varying vec3 vPanel;\nvarying vec3 vPanelNormal;\nuniform sampler2D uPhoto;uniform vec3 uFabric;uniform vec4 uCrop;uniform vec2 uPhotoSpan;uniform float uFrontDepth;uniform float uNeck;uniform vec2 uPhotoTexel;\nvoid main() {');
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   diffuseColor.rgb=uFabric;
   vec2 panel=vec2(.5+vPanel.x/uPhotoSpan.x,(vPanel.y-1.11)/uPhotoSpan.y);
   vec2 uv=vec2(uCrop.x+panel.x*uCrop.z,1.-uCrop.y-uCrop.w+panel.y*uCrop.w);
   if(panel.x>0.&&panel.x<1.&&panel.y>0.&&panel.y<1.){
    vec4 photo=texture2D(uPhoto,uv);
    // Conservative material-only sampling guard: source RGB/mask bytes stay
    // unchanged while unreviewed alpha-edge fringe falls back to neutral cloth.
    vec2 margin=uPhotoTexel*6.;
    float interiorAlpha=min(min(texture2D(uPhoto,uv+vec2(margin.x,0.)).a,texture2D(uPhoto,uv-vec2(margin.x,0.)).a),min(texture2D(uPhoto,uv+vec2(0.,margin.y)).a,texture2D(uPhoto,uv-vec2(0.,margin.y)).a));
    float front=smoothstep(.05,.25,vPanelNormal.z)*smoothstep(uFrontDepth-.015,uFrontDepth+.015,vPanel.z);
    float necklineInterior=1.-smoothstep(uNeck-.11,uNeck-.075,vPanel.y);
    float chest=1.-smoothstep(.22,.29,abs(vPanel.x));
    diffuseColor.rgb=mix(uFabric,photo.rgb,photo.a*smoothstep(.95,1.,interiorAlpha)*front*chest*necklineInterior);
   }
  `);
 };
 const meshes=[],stats={triangles:0,openBoundaryEdges:0,skinBones:0,minClearance:.018,sourceSHA256:source.sourceSHA256,photoSpan,envelope,releaseAuthorized:false};
 const body=[];root.traverse(o=>{if(o.isSkinnedMesh)body.push(o);});
 for(const original of body){
  const g=original.geometry,pos=g.attributes.position,norm=g.attributes.normal;
  if(!pos||!norm||!g.attributes.skinWeight)continue;
  const inverse=original.matrixWorld.clone().invert(),normalM=new T.Matrix3().getNormalMatrix(original.matrixWorld);
  const verts=[],indices=[],cache=new Map();
  function vertex(i){
   if(cache.has(i))return cache.get(i);
   const p=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(original.matrixWorld);
   const n=new T.Vector3().fromBufferAttribute(norm,i).applyMatrix3(normalM).normalize();
   // Loose chest/waist with continuous shoulder and arm clearance. Body topology
   // supplies actual deltoid/elbow/forearm shape and original 4-weight skeleton.
   const torso=1-T.MathUtils.smoothstep(Math.abs(p.x),.18,.32);
   const clearance=.018+.022*torso;
   const q=p.clone().addScaledVector(n,clearance);
   if(torso>.1){q.x+=Math.sign(p.x)*.012*torso;q.z+=Math.sign(p.z+.09)*.018*torso;}
   drapeTorso(q,p,n,envelope);
   const v={p:q,clip:p,n:n.clone(),skin:Array.from({length:4},(_,k)=>g.attributes.skinIndex.array[i*4+k]),weight:Array.from({length:4},(_,k)=>g.attributes.skinWeight.array[i*4+k])};
   cache.set(i,v);return v;
  }
  function lerp(a,b,t){
   const weights=new Map();for(const [v,f] of [[a,1-t],[b,t]])v.skin.forEach((id,k)=>weights.set(id,(weights.get(id)||0)+v.weight[k]*f));
   const w=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4);while(w.length<4)w.push([0,0]);const sum=w.reduce((s,v)=>s+v[1],0);
   return {p:a.p.clone().lerp(b.p,t),clip:a.clip.clone().lerp(b.clip,t),n:a.n.clone().lerp(b.n,t).normalize(),skin:w.map(x=>x[0]),weight:w.map(x=>x[1]/sum)};
  }
  const count=g.index?.count||pos.count;
  for(let j=0;j<count;j+=3){
   let poly=[0,1,2].map(k=>vertex(g.index?g.index.getX(j+k):j+k));
   for(const plane of planes){const out=[];for(let k=0;k<poly.length;k++){const a=poly[k],b=poly[(k+1)%poly.length],da=plane(a.clip),db=plane(b.clip);if(da>=0)out.push(a);if((da>=0)!==(db>=0))out.push(lerp(a,b,da/(da-db)));}poly=out;if(!poly.length)break;}
   for(let k=1;k+1<poly.length;k++){const start=verts.length;verts.push(poly[0],poly[k],poly[k+1]);indices.push(start,start+1,start+2);}
  }
  if(!verts.length)continue;
  // Add narrow thickness at open neckline/hem/cuffs. No caps across openings.
  const key=v=>v.p.toArray().map(n=>n.toFixed(5)).join(',');
  const surfaceVertices=verts.length;
  const edges=new Map();
  for(let i=0;i<verts.length;i+=3)for(let k=0;k<3;k++){
   const a=verts[i+k],b=verts[i+(k+1)%3],ka=key(a),kb=key(b),id=[ka,kb].sort().join('|');
   const edge=edges.get(id);if(edge)edge.count++;else edges.set(id,{a,b,count:1});
  }
  for(const {a,b,count} of edges.values())if(count===1){
   const inner=v=>({...v,p:v.p.clone().addScaledVector(v.n,-.004)});
   const start=verts.length;verts.push(a,inner(a),b,b,inner(a),inner(b));
   indices.push(...Array.from({length:6},(_,k)=>start+k));stats.openBoundaryEdges++;
  }
  const geometry=new T.BufferGeometry(),p=[],si=[],sw=[],panel=[],panelN=[];
  for(const v of verts){p.push(...v.p.clone().applyMatrix4(inverse).toArray());si.push(...v.skin);sw.push(...v.weight);panel.push(...v.p.toArray());panelN.push(...v.n.toArray());}
  geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));
  geometry.setAttribute('panelPosition',new T.Float32BufferAttribute(panel,3));geometry.setAttribute('panelNormal',new T.Float32BufferAttribute(panelN,3));
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));
  geometry.setIndex(indices);geometry.computeVertexNormals();smoothSurfaceNormals(geometry,surfaceVertices);
  const shell=new T.SkinnedMesh(geometry,material);shell.name='Work56-independent-shirt-shell';
  shell.position.copy(original.position);shell.quaternion.copy(original.quaternion);shell.scale.copy(original.scale);
  original.parent.add(shell);shell.bind(original.skeleton,original.bindMatrix);shell.frustumCulled=false;
  shell.userData.work56Garment=true;meshes.push(shell);stats.triangles+=indices.length/3;stats.skinBones=Math.max(stats.skinBones,original.skeleton.bones.length);
 }
 if(stats.triangles<1000){meshes.forEach(m=>{m.removeFromParent();m.geometry.dispose();});material.dispose();texture.dispose();throw Error('Insufficient anatomical garment topology');}
 return {meshes,stats,dispose(){for(const m of meshes){m.removeFromParent();m.geometry.dispose();}material.dispose();texture.dispose();}};
}
