/** 3D40 independent photographed-clothing silhouette shaping — DRAFT HOLD.
 *
 * Original shirt pixels/UV and independently licensed first/second jeans RGB,
 * cutout SHA, UV, rest pose and bone weights are immutable. This stage shapes
 * ONLY side/rear silhouette of the existing 3D garments, not fake rear photos.
 * Anatomical CC0 rig is unchanged; not physics, a garment size measurement,
 * or a signed fully swept collision solver.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
const smooth=T.MathUtils.smoothstep,clamp=T.MathUtils.clamp;
const stamp=q=>q.toArray().map(n=>n.toFixed(5)).join(':');
const pct=(a,f)=>{const s=a.slice().sort((x,y)=>x-y);return s[Math.floor((s.length-1)*f)];};
function strictGeometry(mesh,names){
 const g=mesh.geometry,p=g.getAttribute('position');
 if(!mesh.isSkinnedMesh||!p||names.some(n=>g.getAttribute(n)?.count!==p.count))
  throw Error('Original skinned source-only garment attributes missing');
 return {g,p,source:Object.fromEntries(names.map(n=>[n,g.getAttribute(n).array.slice()]))};
}
function originalAttributesUnchanged(mesh,record){
 for(const [name,original] of Object.entries(record.source)){
  const current=mesh.geometry.getAttribute(name).array;
  if(current.length!==original.length||!current.every((value,i)=>value===original[i]))
   throw Error('3D40 would change original source clothing photo/rig attribute '+name);
 }
}
export function drapeOriginalPhotographedShirtTorso(shirt,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.meshes?.length||!shirt.stats?.envelope||
 !shirt.stats.necklineSeams)throw Error('Only original verified reviewed photographic fitted shirt');
 const mid=shirt.stats.envelope.center;
 if(!Number.isFinite(mid))throw Error('Missing source torso envelope center');
 let unique=0,max=0,total=0,back=0,side=0,front=0,maxOriginalFront=0;
 const records=[],targets=[];
 for(const m of shirt.meshes){
  if(m.name==='Work59-source-neutral-collar-band')continue;
  m.updateWorldMatrix(true,false);
  const rec=strictGeometry(m,['panelPosition','panelNormal','skinIndex','skinWeight']);
  records.push([m,rec]);
  const inverse=m.matrixWorld.clone().invert(),nodes=new Map();
  for(let i=0;i<rec.p.count;i++){
   const p=new T.Vector3().fromBufferAttribute(rec.p,i).applyMatrix4(m.matrixWorld),k=stamp(p);
   if(!nodes.has(k))nodes.set(k,{p:p.clone(),ids:[]});
   nodes.get(k).ids.push(i);
  }
  for(const node of nodes.values()){
   const p=node.p,y=p.y;
   // Anatomically rooted but with an independent downward hanging panel:
   // widest outward material fullness through mid-back, taper toward
   // untouched shirt waist/collar and photographed front chest.
   const h=smooth(y,1.135,1.185)*(1-smooth(y,1.355,1.475));
   if(h<.02||Math.abs(p.x)>.31)continue;
   const backWeight=1-smooth(p.z-mid,-.005,.055);
   const sideWeight=smooth(Math.abs(p.x),.115,.185)*(1-smooth(Math.abs(p.x),.24,.315))*(1-smooth(p.z-mid,.005,.060));
   const blend=clamp(Math.max(backWeight*.92,sideWeight*.72),0,1);
   if(blend<.03)continue;
   // Structure is an actual hanging rear and side panel, not a body-normal
   // inflation. Back plane shifts away from the original torso 12–28mm;
   // side width gains at most 19mm, then tapers back to body at shoulders.
   const dz=-(.011+.019*smooth(y,1.22,1.38))*backWeight*h;
   const dx=Math.sign(p.x)*(.008+.011*(1-smooth(y,1.20,1.38)))*sideWeight*h;
   const magnitude=Math.hypot(dx,dz);
   if(magnitude<.00015)continue;
   const scale=Math.min(1,.032/magnitude);
   const q=p.clone().add(new T.Vector3(dx*scale,0,dz*scale));
   targets.push({m,ids:node.ids,q,inv:inverse});
   unique++;max=Math.max(max,q.distanceTo(p));total+=q.distanceTo(p);
   if(backWeight>.75)back++;else if(sideWeight>.5)side++;else front++;
   if(p.z>mid+.060)maxOriginalFront=Math.max(maxOriginalFront,q.distanceTo(p));
  }
 }
 if(unique<120||max<.009||max>.032001||back<40||side<20||maxOriginalFront>.003)
  throw Error('Source-true shirt hanging panel is not a material bounded side/rear silhouette change '+JSON.stringify({unique,max,back,side,maxOriginalFront}));
 for(const {m,ids,q,inv} of targets){
  const local=q.applyMatrix4(inv),out=m.geometry.getAttribute('position');
  for(const i of ids)out.setXYZ(i,local.x,local.y,local.z);
 }
 for(const [m,rec] of records){
  const out=m.geometry.getAttribute('position');out.needsUpdate=true;
  m.geometry.computeVertexNormals();smoothSurfaceNormals(m.geometry,out.count);
  m.geometry.computeBoundingBox();m.geometry.computeBoundingSphere();
  originalAttributesUnchanged(m,rec);
 }
 return {...shirt,stats:{...shirt.stats,
  originalPhotographedTorsoDrape:true,
  drapeConstruction:'independent downward rear torso and side cloth-panel silhouette, no fabricated photographed reverse',
  torsoMovedUniqueVertices:unique,torsoDrapeMaxShift:max,torsoDrapeMeanShift:total/unique,
  torsoBackPanelVertices:back,torsoSidePanelVertices:side,
  torsoProtectedSourceFrontMaxShift:maxOriginalFront,torsoNeutralRear:true,
  sourcePhotoTextureAndCoordinatesUnchanged:true,originalRigAndWeightsUnchanged:true,
  trueClothSimulation:false,collisionCertified:false,humanVisualApproval:false,releaseAuthorized:false}};
}
export function hangOriginalPhotographedDenimPanels(pants,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0];
 if(!mesh?.isSkinnedMesh||pants.meshes.length!==1||
 !pants.stats?.originalCrotchSaddle||!pants.stats?.independentPatternedShell||
 !pants.stats?.photoApplied||!isSourceVerifiedDenimId(pants.stats.sourceId))
  throw Error('Only original-source licensed independently patterned photographed jeans');
 mesh.updateWorldMatrix(true,false);
 const record=strictGeometry(mesh,['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight']);
 const {g,p}=record,uv=g.getAttribute('pantsSourceFront'),landmarks=pants.stats.landmarks;
 if(landmarks?.length!==2)throw Error('Original measured CC0 lower-leg landmarks required');
 const legs=landmarks.map(a=>({hip:new T.Vector3(...a.hip),knee:new T.Vector3(...a.knee),ankle:new T.Vector3(...a.ankle)}));
 if(legs.some(l=>l.hip.y-l.knee.y<.18))throw Error('Invalid source jeans hip-to-knee lengths');
 const nodes=new Map();
 for(let i=0;i<p.count;i++){
  const point=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),id=stamp(point);
  if(!nodes.has(id))nodes.set(id,{p:point.clone(),front:0,ids:[]});
  const n=nodes.get(id);n.ids.push(i);n.front=Math.max(n.front,uv.getX(i));
 }
 const arr=[...nodes.values()],profiles=[];
 // Rear is not photographed: sample ORIGINAL SOURCE-FITTED denim, not skin.
 for(const leg of legs){
  const slice=[];
  for(let t=.09;t<=.89;t+=.04){
   const y=T.MathUtils.lerp(leg.knee.y,leg.hip.y,t);
   const back=arr.filter(n=>n.front<.27&&Math.abs(n.p.y-y)<.032&&
      Math.sign(n.p.x)===Math.sign(leg.hip.x)&&Math.abs(n.p.x-leg.hip.x)<.20)
    .map(n=>n.p.z);
   if(back.length<15)continue;
   slice.push({y,z:pct(back,.08),count:back.length});
  }
  if(slice.length<12)throw Error('Original photographed posterior leg sections unavailable');
  // Fair the actual measured source-cloth depth longitudinally before moving
  // triangles; otherwise noisy slice maxima form unnatural horizontal bulges.
  for(let pass=0;pass<5;pass++){
   const old=slice.map(a=>a.z);
   for(let i=1;i<slice.length-1;i++)slice[i].z=.24*old[i-1]+.52*old[i]+.24*old[i+1];
  }
  const interp=y=>{
   if(y<=slice[0].y)return slice[0].z;
   for(let i=1;i<slice.length;i++)if(y<=slice[i].y){
    const a=slice[i-1],b=slice[i],q=clamp((y-a.y)/(b.y-a.y),0,1);
    return T.MathUtils.lerp(a.z,b.z,q);
   }
   return slice.at(-1).z;
  };
  profiles.push({slice,interp});
 }
 const inverse=mesh.matrixWorld.clone().invert(),geometry=g.clone(),out=geometry.getAttribute('position');
 let moved=0,back=0,side=0,max=0,total=0,frontProtected=0;
 const changes=[];
 for(const n of arr){
  const q=n.p,which=q.x>=0?0:1,leg=legs[which],profile=profiles[which];
  const t=(q.y-leg.knee.y)/(leg.hip.y-leg.knee.y);
  if(t<.09||t>.95)continue;
  const fade=smooth(t,.10,.29)*(1-smooth(t,.76,.96));
  const photoWeight=1-smooth(n.front,.04,.28);
  if(fade*photoWeight<.022){if(n.front>.4)frontProtected++;continue;}
  const rearPlane=profile.interp(q.y);
  // A genuine hanging textile panel falls behind the original measured rear:
  // remove muscular thigh notches without painting imaginary seam/pocket.
  const rear=1-smooth(q.z-rearPlane,.005,.180);
  const lateral=smooth(Math.abs(q.x),Math.abs(leg.hip.x)+.02,Math.abs(leg.hip.x)+.125);
  const shape=.008+.012*Math.sin(Math.PI*clamp(t,0,1));
  const dz=-shape*rear*fade*photoWeight;
  const dx=Math.sign(q.x)*.006*lateral*fade*photoWeight;
  const dist=Math.hypot(dx,dz);
  if(dist<.00015)continue;
  const scale=Math.min(1,.040/dist);
  const target=q.clone().add(new T.Vector3(dx*scale,0,dz*scale));
  changes.push({n,target});moved++;total+=q.distanceTo(target);max=Math.max(max,q.distanceTo(target));
  if(rear>.5)back++;else side++;
 }
 if(moved<250||max<.007||max>.025001||back<140)
  {geometry.dispose();throw Error('Original photographed jeans rear hanging cloth panel not substantive '+JSON.stringify({moved,max,back,side}));}
 for(const {n,target} of changes){
  const local=target.applyMatrix4(inverse);
  for(const i of n.ids)out.setXYZ(i,local.x,local.y,local.z);
 }
 out.needsUpdate=true;geometry.computeVertexNormals();smoothSurfaceNormals(geometry,out.count);
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 originalAttributesUnchanged(mesh,record);
 mesh.geometry=geometry;
 let disposed=false;
 return {...pants,stats:{...pants.stats,
  originalPhotographedHangingLegPanels:true,
  rearPanelMeasuredLegRows:profiles.map(p=>p.slice.length),
  rearPanelMovedUniqueVertices:moved,rearPanelMaxShift:max,
  rearPanelMeanShift:total/moved,rearPanelBackVertices:back,
  rearPanelSideVertices:side,originalPhotoSourceFrontProtected:frontProtected,
  originalSourcePhotoAndUVUnchanged:true,originalDenimSkinAndRestUnchanged:true,
  rearPhotoInvented:false,trueClothSimulation:false,
  originalBodyUnchanged:true,collisionCertified:false,
  humanVisualApproval:false,releaseAuthorized:false},
  dispose(){if(disposed)return;disposed=true;geometry.dispose();pants.dispose();}};
}
