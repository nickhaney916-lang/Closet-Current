/** 3D-71 — original anatomical seat-to-thigh neutral fabric fall.
 * The current verified 3D-70 neutral trouser shell shows a hard glute-to-quad
 * shelf at 90° and rear 180°. Construct a gentle hanging rear cloth line
 * from source-measured hip and knee envelopes in the ORIGINAL 163-joint pose.
 * This is a separate skinned 3D garment edit, NOT a new humanoid/skin/body,
 * fictitious garment photo, fake denim pocket or contact PASS.
 *
 * Opt-in research neutral pants ONLY, after the green 3D-70 geometric fairing.
 * Original pelvis/waist, knee, ankle, openings and original body stay unchanged.
 */
import * as THREE from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const clamp=THREE.MathUtils.clamp,smooth=THREE.MathUtils.smoothstep,lerp=THREE.MathUtils.lerp;
const median=a=>{const x=a.slice().sort((a,b)=>a-b);return x[Math.floor(x.length/2)];};
const key=p=>p.toArray().map(v=>v.toFixed(5)).join(':');
function sample(rows,y){
 if(y<=rows[0].y)return rows[0].rear;
 for(let i=1;i<rows.length;i++)if(y<=rows[i].y)
  return lerp(rows[i-1].rear,rows[i].rear,
   clamp((y-rows[i-1].y)/(rows[i].y-rows[i-1].y),0,1));
 return rows.at(-1).rear;
}
export function hangNeutralSeatToThighFabric71(pants,root,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0],original=mesh?.geometry,
  position=original?.getAttribute('position'),landmarks=pants?.stats?.landmarks;
 if(!mesh?.isSkinnedMesh||pants.meshes.length!==1||
    !mesh.userData.work60Pants||!pants.stats?.naturalNeutralSilhouette70||
    pants.stats?.photoApplied!==false||pants.stats?.sourceSHA256!==null||
    !Array.isArray(landmarks)||landmarks.length!==2)
  throw Error('3D71 requires genuine measured 3D70 neutral skinned garment on original body');
 const names=['pantsRest','skinIndex','skinWeight'];
 if(names.some(n=>original.getAttribute(n)?.count!==position?.count))
  throw Error('3D71 original neutral skin/rest/source attribute unavailable');
 if(!root?.isObject3D)throw Error('3D71 original anatomical skinned human required');
 root.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const legs=landmarks.map(l=>Object.fromEntries(['hip','knee','ankle'].map(k=>[k,new THREE.Vector3(...l[k])])));
 if(legs.some(l=>!['hip','knee','ankle'].every(k=>l[k].toArray().every(Number.isFinite))||
    l.hip.y-l.knee.y<.24||l.knee.y-l.ankle.y<.19))
  throw Error('3D71 real hip/knee/ankle source bone positions invalid');
 const source=new Map(names.map(n=>[n,original.getAttribute(n).array.slice()])),
  geometry=original.clone(),pos=geometry.getAttribute('position'),
  inverse=mesh.matrixWorld.clone().invert(),nodes=new Map();
 for(let i=0;i<pos.count;i++){
  const p=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
  if(!p.toArray().every(Number.isFinite)){geometry.dispose();throw Error('3D71 original skinned neutral fabric vertices invalid');}
  const k=key(p);
  if(!nodes.has(k))nodes.set(k,{p,ids:[]});
  nodes.get(k).ids.push(i);
 }
 const points=[...nodes.values()],sideOf=p=>p.x>=0?0:1;
 const rows=legs.map((leg,side)=>{
  // A knee-to-hip continuous measured rear cloth profile, no hand-drawn
  // avatar proportions. Target anchors are genuine original geometry.
  const start=leg.knee.y+.075,end=leg.hip.y-.052,stations=[];
  if(end-start<.30){geometry.dispose();throw Error('3D71 hip-knee rear cloth extent too short');}
  for(let y=start;y<=end+.0001;y+=.024){
   const f=clamp((leg.hip.y-y)/(leg.hip.y-leg.knee.y),0,1);
   const c=leg.hip.clone().lerp(leg.knee,f);
   const slice=points.filter(n=>sideOf(n.p)===side&&Math.abs(n.p.y-y)<.034&&
     Math.abs(n.p.x-c.x)<.235);
   if(slice.length<16)continue;
   const rear=slice.map(n=>n.p.z).sort((a,b)=>a-b);
   // 6th percentile ignores detached duplicate extrema/pattern spikes.
   stations.push({y,rear:rear[Math.floor((rear.length-1)*.06)],count:rear.length});
  }
  if(stations.length<12){geometry.dispose();throw Error('3D71 original measured posterior cloth cross-sections insufficient');}
  // Longitudinal robust smoothing prevents a single knee/glute band from
  // being mistaken for the real source seat fabric envelope.
  for(let pass=0;pass<2;pass++){
   const previous=stations.map(v=>v.rear);
   for(let i=1;i<stations.length-1;i++)
    stations[i].rear=.23*previous[i-1]+.54*previous[i]+.23*previous[i+1];
  }
  const lower=stations.slice(0,Math.max(3,Math.floor(stations.length*.17))).map(v=>v.rear);
  const upper=stations.slice(-Math.max(3,Math.floor(stations.length*.17))).map(v=>v.rear);
  const kneeRear=median(lower),hipRear=median(upper);
  const ease=clamp(.014+.09*Math.abs(hipRear-kneeRear),.014,.026);
  return {stations,start,end,hipRear,kneeRear,ease,side};
 });
 const closest=bodySurface(root);
 let changed=0,upperThigh=0,lowerThigh=0,bodyGuarded=0,
   originalFrontUntouched=0,rearCandidates=0,maxMotion=0,meanMotion=0,
   recoveredDepth=0,contactNeverWorsened=true;
 for(const node of points){
  const p=node.p,side=sideOf(p),leg=legs[side],row=rows[side];
  const y=p.y;
  if(y<row.start||y>row.end)continue;
  const span=clamp((y-row.start)/(row.end-row.start),0,1);
  const fade=smooth(span,.015,.19)*(1-smooth(span,.76,.99));
  if(fade<.025)continue;
  const measured=sample(row.stations,y);
  const ideal=lerp(row.kneeRear,row.hipRear,span)-
    row.ease*Math.sin(Math.PI*span);
  const deficit=measured-ideal;
  if(deficit<.0008)continue;
  // The visible photographed FRONT cannot be mistaken for rear. This
  // independent neutral cloth has no photo; only rear-facing geometry moves.
  const behind=1-smooth(p.z-measured,.018,.105);
  if(behind<=.015){originalFrontUntouched+=node.ids.length;continue;}
  rearCandidates+=node.ids.length;
  let shift=-Math.min(.032,deficit*.95)*behind*fade;
  if(Math.abs(shift)<.0002)continue;
  const hit=closest(p);
  if(!hit?.point||!hit.normal||!hit.normal.toArray().every(Number.isFinite)){
   geometry.dispose();throw Error('3D71 cannot verify source-body triangle contact');}
  const before=p.clone().sub(hit.point).dot(hit.normal);
  if(!Number.isFinite(before)){geometry.dispose();throw Error('3D71 invalid source-body clearance');}
  const projected=shift*hit.normal.z;
  const required=before>=.005?.005:before;
  if(before+projected<required){
   if(projected<-.000001){
    shift*=clamp((before-required)/-projected,0,1);
    bodyGuarded++;
   }else{geometry.dispose();throw Error('3D71 source-body gap guard failed');}
  }
  const after=before+shift*hit.normal.z;
  if(after<required-.0002){geometry.dispose();throw Error('3D71 cannot worsen original body contact');}
  if(Math.abs(shift)<.0002)continue;
  const q=p.clone();q.z+=shift;
  const local=q.applyMatrix4(inverse);
  for(const id of node.ids)pos.setXYZ(id,local.x,local.y,local.z);
  changed+=node.ids.length;meanMotion+=Math.abs(shift)*node.ids.length;
  maxMotion=Math.max(maxMotion,Math.abs(shift));recoveredDepth+=Math.abs(shift);
  if(span>.50)upperThigh+=node.ids.length;else lowerThigh+=node.ids.length;
 }
 if(changed<100||upperThigh<60||lowerThigh<20||maxMotion<.002||maxMotion>.032001){
  geometry.dispose();
  throw Error('3D71 independent anatomical seat-to-thigh fabric fall not substantive and bounded '+JSON.stringify({
   changed,upperThigh,lowerThigh,maxMotion,bodyGuarded,profiles:rows.map(r=>({hip:r.hipRear,knee:r.kneeRear,ease:r.ease}))}));
 }
 pos.needsUpdate=true;geometry.computeVertexNormals();smoothSurfaceNormals(geometry,pos.count);
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 for(const name of names){
  const before=source.get(name),after=geometry.getAttribute(name).array;
  if(after.length!==before.length||!after.every((v,i)=>v===before[i])){
   geometry.dispose();throw Error('3D71 immutable original source/rest/skin weights changed: '+name);
  }
 }
 mesh.geometry=geometry;
 let disposed=false;
 return {...pants,stats:{...pants.stats,
  originalNeutralSeatThighFall71:true,
  sourceMeasuredSeatThighProfiles:rows.map(r=>r.stations.length),
  seatThighMovedVertices:changed,
  seatThighUpperVertices:upperThigh,seatThighLowerVertices:lowerThigh,
  seatThighMaxMovement:maxMotion,seatThighMeanMovement:meanMotion/changed,
  seatThighBodyGuarded:bodyGuarded,
  seatThighOriginalRestAndSkinUnchanged:true,
  seatThighOriginalAnatomyUntouched:true,
  seatThighPhotoDenimUnchanged:true,
  seatThighNoManufacturedReversePhoto:true,
  seatThighReal3DCloth:true,
  verifiedHumanPhotorealism:false,
  actualPhoneAcceptance:false,sweptContactCertified:false,
  familyAlphaRelease:false,releaseAuthorized:false},
  dispose(){if(disposed)return;disposed=true;mesh.geometry=original;geometry.dispose();pants.dispose();}
 };
}
