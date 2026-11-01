/** 3D-70 — anatomical measurement-driven NEUTRAL trouser silhouette fairing.
 * The 3D-67 showroom has a real 163-bone body but the experimental neutral
 * pants retain horizontal muscular ring/bulge artifacts. This operates ONLY
 * on synthetic neutral research cloth after Work60 fit, never on genuine
 * photographed denim (3D69) or the human, skeleton, source photo or skin.
 *
 * Locally measured cloth cross sections are low-pass fairings, not fabricated
 * branded imagery, cut-outs or arbitrary new avatar body measurements.
 * Inward movements are guarded by the true source-body triangle surface.
 * This is optical geometry polishing, not certified sewn fabric dynamics.
 */
import * as THREE from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=THREE.MathUtils.smoothstep,clamp=THREE.MathUtils.clamp;
const key=p=>p.toArray().map(n=>n.toFixed(5)).join(':');
const quant=(a,f)=>{const x=a.slice().sort((u,v)=>u-v);return x[Math.min(x.length-1,Math.floor(x.length*f))];};
const close=(a,b)=>Math.abs(a-b)<1e-9;
function checkOriginal(geometry,copy,names){
 for(const n of names){
  const after=geometry.getAttribute(n)?.array,before=copy.get(n);
  if(!after||after.length!==before.length||!after.every((v,i)=>v===before[i]))
   throw Error('3D70 original neutral cloth skin/rest mutated: '+n);
 }
}
function interpolated(rows,y){
 if(y<=rows[0].y)return rows[0];
 for(let i=1;i<rows.length;i++)if(y<=rows[i].y){
  const u=clamp((y-rows[i-1].y)/(rows[i].y-rows[i-1].y),0,1);
  return {rx:THREE.MathUtils.lerp(rows[i-1].rx,rows[i].rx,u),
   rz:THREE.MathUtils.lerp(rows[i-1].rz,rows[i].rz,u)};
 }
 return rows.at(-1);
}
export function fairNeutralAnatomicalLegSilhouette(pants,root,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0],original=mesh?.geometry,position=original?.getAttribute('position');
 const landmarks=pants?.stats?.landmarks;
 if(!mesh?.isSkinnedMesh||pants.meshes.length!==1||!mesh.userData.work60Pants||
    pants.stats?.photoApplied!==false||pants.stats?.sourceSHA256!==null||
    !position||!Array.isArray(landmarks)||landmarks.length!==2)
  throw Error('3D70 requires an original neutral-only skinned lower-body research pants shell');
 const attributes=['pantsRest','skinIndex','skinWeight'];
 if(attributes.some(n=>original.getAttribute(n)?.count!==position.count))
  throw Error('3D70 original skin/rest source missing');
 if(!root?.isObject3D)throw Error('3D70 original anatomical source body absent');
 root.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const legs=landmarks.map(landmark=>Object.fromEntries(['hip','knee','ankle'].map(n=>[n,new THREE.Vector3(...landmark[n])])));
 if(legs.some(l=>l.hip.y-l.knee.y<.18||l.knee.y-l.ankle.y<.17))
  throw Error('3D70 original anatomical hip/knee/ankle landmarks invalid');
 const geometry=original.clone(),pos=geometry.getAttribute('position'),
  source=new Map(attributes.map(n=>[n,original.getAttribute(n).array.slice()])),
  inverse=mesh.matrixWorld.clone().invert(),nodes=new Map();
 for(let i=0;i<pos.count;i++){
  const world=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
  if(!world.toArray().every(Number.isFinite))throw Error('3D70 nonfinite original neutral source geometry');
  const id=key(world);if(!nodes.has(id))nodes.set(id,{world,indices:[]});
  nodes.get(id).indices.push(i);
 }
 const all=[...nodes.values()],sideOf=p=>p.x>=0?0:1;
 const center=(leg,y)=>{
  const upper=y>=leg.knee.y,a=upper?leg.hip:leg.knee,b=upper?leg.knee:leg.ankle;
  const t=clamp((a.y-y)/(a.y-b.y),0,1);return a.clone().lerp(b,t);
 };
 const rows=legs.map((leg,side)=>{
  const min=leg.ankle.y+.070,max=leg.hip.y-.090,stations=[];
  for(let y=min;y<max;y+=.023){
   const c=center(leg,y),slice=all.filter(n=>sideOf(n.world)===side&&
    Math.abs(n.world.y-y)<.029&&Math.abs(n.world.x-c.x)<.25);
   if(slice.length<18)continue;
   const rx=quant(slice.map(n=>Math.abs(n.world.x-c.x)),.87);
   const rz=quant(slice.map(n=>Math.abs(n.world.z-c.z)),.87);
   stations.push({y,rx,rz,count:slice.length});
  }
  if(stations.length<17)throw Error('3D70 original cloth stations cannot resolve entire upper/lower leg');
  // A 7-station convolution across actual measured original cloth;
  // 23mm per station: removes the horizontal quadriceps/knee/calf bands.
  // Preserve original median widths; do not remodel bones or anatomy.
  const weights=[1,2,3,4,3,2,1];
  const smoothed=stations.map((r,i)=>{
   let sum=0,x=0,z=0;
   for(let k=-3;k<=3;k++){
    const ix=clamp(i+k,0,stations.length-1),w=weights[k+3];
    x+=stations[ix].rx*w;z+=stations[ix].rz*w;sum+=w;
   }
   return {...r,rx:x/sum,rz:z/sum};
  });
  return {original:stations,soft:smoothed,min,max};
 });
 const nearest=bodySurface(root);
 let moved=0,bodyLimited=0,protectedHems=0,outer=0,inner=0,
  maxMove=0,topMove=0,bottomMove=0,minContactBefore=Infinity,minContactAfter=Infinity;
 for(const n of all){
  const p=n.world,side=sideOf(p),leg=legs[side],rings=rows[side];
  if(p.y<=rings.min||p.y>=rings.max){protectedHems++;continue;}
  const fade=smooth(p.y,rings.min,rings.min+.115)*
    (1-smooth(p.y,rings.max-.13,rings.max));
  if(fade<.05)continue;
  const c=center(leg,p.y),old=interpolated(rings.original,p.y),
   target=interpolated(rings.soft,p.y);
  const dx=p.x-c.x,dz=p.z-c.z,rx=Math.abs(dx),rz=Math.abs(dz);
  const sideWeight=smooth(rx,old.rx*.43,old.rx*.89),
   depthWeight=smooth(rz,old.rz*.42,old.rz*.9);
  if(Math.max(sideWeight,depthWeight)<.08)continue;
  // Radius corrections follow actual original cross-section continuity.
  // Clamp to 13mm movement; avoid adding new wrinkles or flattening skin.
  let shift=new THREE.Vector3(
   Math.sign(dx)*(target.rx-old.rx)*sideWeight*fade*.92,
   0,
   Math.sign(dz)*(target.rz-old.rz)*depthWeight*fade*.92);
  if(shift.length()>.013)shift.setLength(.013);
  if(shift.length()<.00011)continue;
  const hit=nearest(p);
  if(!hit?.point||!hit?.normal)throw Error('3D70 actual anatomical body surface unavailable');
  const before=p.clone().sub(hit.point).dot(hit.normal);
  if(!Number.isFinite(before))throw Error('3D70 invalid body/cloth oriented clearance');
  const wanted=before+shift.dot(hit.normal);
  // Never reduce already uncertain/negative body gap. Maintain at least
  // 5mm signed-oriented outward clearance wherever originally available.
  const required=before>=.005?Math.min(before,.005):before;
  if(wanted<required){
   const inward=shift.dot(hit.normal);
   if(inward<-.00001){
    shift.multiplyScalar(clamp((before-required)/-inward,0,1));bodyLimited++;
   }
  }
  const after=before+shift.dot(hit.normal);
  if(after<required-.00015)throw Error('3D70 original body clearance became less safe');
  const length=shift.length();
  if(length<.00010)continue;
  const q=p.clone().add(shift).applyMatrix4(inverse);
  for(const i of n.indices)pos.setXYZ(i,q.x,q.y,q.z);
  moved+=n.indices.length;maxMove=Math.max(maxMove,length);
  if(p.y>leg.knee.y)topMove+=n.indices.length;else bottomMove+=n.indices.length;
  if(shift.dot(hit.normal)>=0)outer++;else inner++;
  minContactBefore=Math.min(minContactBefore,before);
  minContactAfter=Math.min(minContactAfter,after);
 }
 if(moved<80||topMove<30||bottomMove<30||maxMove<.0003||maxMove>.01301){
  geometry.dispose();throw Error('3D70 neutral leg silhouette improvement not materially measured '+JSON.stringify({moved,topMove,bottomMove,maxMove,bodyLimited}));
 }
 pos.needsUpdate=true;geometry.computeVertexNormals();smoothSurfaceNormals(geometry,pos.count);
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 checkOriginal(geometry,source,attributes);
 mesh.geometry=geometry;
 let disposed=false;
 return {...pants,stats:{...pants.stats,
  naturalNeutralSilhouette70:true,measuredNeutralLegRings:rows.map(r=>r.original.length),
  neutralContourMovedVertices:moved,neutralContourUpperLegVertices:topMove,
  neutralContourLowerLegVertices:bottomMove,
  neutralContourMaxMotion:maxMove,neutralContourBodyLimited:bodyLimited,
  neutralContourHemsProtected:protectedHems,
  neutralContourOriginalSkinAndRestUnchanged:true,
  neutralContourHumanAestheticApproved:false,
  neutralContourPhotographedGarmentApplied:false,
  neutralContourMethod:'real source-pose anatomical two-leg measured cloth rings, seven-station low-pass, source-body clearance guarded',
  fullSweptCollisionCertified:false,physicalPhoneTested:false,releaseAuthorized:false},
  dispose(){if(disposed)return;disposed=true;mesh.geometry=original;geometry.dispose();pants.dispose();}
 };
}
