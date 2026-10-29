/** Original-body barycentric attachment, no garment enlargement or source/body edits. */
import * as T from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
import {anatomicalSections} from '../three-d-24/anatomical-dress.mjs';
const key=p=>p.toArray().map(x=>Math.round(x*1e8)).join(',');
export function bindDressContact(dress,root){
 if(!dress?.mesh?.isSkinnedMesh||!dress.stats.anatomicalDress||dress.stats.sourceId!=='commons-0053')throw Error('Reviewed anatomical dress required');
 root.updateMatrixWorld(true);const samples=new Map();let shoulder,neck;
 root.traverse(m=>{if(m.isBone&&m.name==='upperarm01L')shoulder=m.getWorldPosition(new T.Vector3()).y;if(m.isBone&&m.name==='neck01')neck=m.getWorldPosition(new T.Vector3()).y;});
 if(!Number.isFinite(shoulder)||!Number.isFinite(neck))throw Error('Original shoulder/neck landmarks required');
 // Query only the original upper-body triangles used by this attachment.
 // This ephemeral reference is never rendered or attached to the scene.
 const reference=new T.Group();
 root.traverse(m=>{
  if(!m.isSkinnedMesh||m.userData.work56Garment)return;
  const g=m.geometry,points=[];for(let i=0;i<g.attributes.position.count;i++)points.push(new T.Vector3().fromBufferAttribute(g.attributes.position,i).applyMatrix4(m.matrixWorld));
  const positions=[];
  for(let t=0;t<(g.index?.count||points.length);t+=3){const ids=[0,1,2].map(k=>g.index?g.index.getX(t+k):t+k),ps=ids.map(i=>points[i]);if(Math.max(...ps.map(p=>p.y))<shoulder-.16||Math.min(...ps.map(p=>p.y))>neck+.06)continue;
   for(const i of ids){const p=points[i].clone();p.set(Math.fround(p.x),Math.fround(p.y),Math.fround(p.z));positions.push(...p.toArray());const map=new Map();for(let k=0;k<4;k++){const id=g.attributes.skinIndex.array[i*4+k];map.set(id,(map.get(id)||0)+g.attributes.skinWeight.array[i*4+k]);}samples.set(key(p),map);}
  }
  if(positions.length){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));reference.add(new T.SkinnedMesh(geometry));}
 });
 const nearest=bodySurface(reference);reference.traverse(m=>{if(m.isMesh)m.geometry.dispose();});
 const m=dress.mesh,g=m.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
 const nextIndex=si.array.slice(),nextWeight=sw.array.slice();let changed=0;
 for(let i=0;i<g.attributes.position.count;i++){
  const p=new T.Vector3().fromBufferAttribute(g.attributes.position,i).applyMatrix4(m.matrixWorld),blend=T.MathUtils.smoothstep(p.y,shoulder-.12,shoulder-.02);if(blend===0)continue;
  const hit=nearest(p),bary=hit.tri.getBarycoord(hit.point,new T.Vector3()),weights=new Map();
  if(!bary||hit.distance>.12)throw Error('Missing local original-body contact triangle');
  for(let k=0;k<4;k++){const id=si.array[i*4+k];weights.set(id,(weights.get(id)||0)+sw.array[i*4+k]*(1-blend));}
  for(const [v,amount]of [[hit.tri.a,bary.x],[hit.tri.b,bary.y],[hit.tri.c,bary.z]]){
   const source=samples.get(key(v));if(!source)throw Error('Original triangle skin provenance unavailable');
   for(const [id,w]of source)weights.set(id,(weights.get(id)||0)+w*Math.max(0,amount)*blend);
  }
  const top=[...weights].filter(([,w])=>w>1e-8).sort((a,b)=>b[1]-a[1]).slice(0,4);while(top.length<4)top.push([0,0]);const sum=top.reduce((n,[,w])=>n+w,0);
  for(let k=0;k<4;k++){nextIndex[i*4+k]=top[k][0];nextWeight[i*4+k]=top[k][1]/sum;}changed++;
 }
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(nextIndex,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(nextWeight,4));
 dress.stats={...dress.stats,bodyTriangleAttachment:true,attachmentVertices:changed,attachmentReference:'original-body-triangle-barycentric-skin-weights',sourcePositionsUnchangedByAttachment:true,collisionValidated:false};
 return dress;
}
/** Skin-only presentation on original shoulder-influenced vertices when a dress is active.
 * Protected central torso/pelvis remains covered; all bare/shirt modes retain old coverage.
 */
export function installOpeningSkinAttribute(root){
 const section=anatomicalSections(root),shoulder=section.shoulders.map(p=>p.y),levels=[];
 const low=Math.min(...shoulder)-.20,high=Math.max(...shoulder)+.07;
 for(let i=0;i<=10;i++){const y=T.MathUtils.lerp(low,high,i/10);levels.push(section.radius(y,0).origin.z);}
 let count=0;
 root.traverse(m=>{
  if(!m.isSkinnedMesh||m.userData.work56Garment)return;
  const g=m.geometry,a=new Float32Array(g.attributes.position.count),bones=m.skeleton.bones;
  for(let i=0;i<a.length;i++){
   let influence=0;
   for(let k=0;k<4;k++)if(/^(?:clavicle|upperarm|lowerarm)/.test(bones[g.attributes.skinIndex.array[i*4+k]]?.name||''))influence+=g.attributes.skinWeight.array[i*4+k];
   const p=new T.Vector3().fromBufferAttribute(g.attributes.position,i).applyMatrix4(m.matrixWorld),side=p.x>=section.waist.x?0:1;
   const top=shoulder[side]+.065,bottom=shoulder[side]-.19,mid=(top+bottom)/2,height=(top-bottom)/2;
   let opening=0;
   if(p.y>=bottom-.01&&p.y<=top+.01){
    const t=T.MathUtils.clamp((p.y-low)/(high-low)*10,0,10),j=Math.min(9,Math.floor(t)),center=T.MathUtils.lerp(levels[j],levels[j+1],t-j),dx=p.x-section.waist.x,dz=p.z-center;
    const cos=dz/Math.max(1e-6,Math.hypot(dx,dz)),ellipse=(cos/.66)**2+((p.y-mid)/height)**2;
    opening=1-T.MathUtils.smoothstep(ellipse,.95,1.30);
   }
   a[i]=Math.max(T.MathUtils.smoothstep(influence,.02,.18),opening);if(a[i]>.5)count++;
  }
  g.setAttribute('dressOpeningSkin',new T.Float32BufferAttribute(a,1));
 });return count;
}
