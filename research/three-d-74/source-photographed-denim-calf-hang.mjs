/**
 * Closet Current 3D74 — source-anatomical lower-leg denim hang, research HOLD.
 *
 * Actual public-license original photograph fitted as an independently sewn,
 * skinned 3D trouser, not a neutral mannequin pant. Only unphotographed BACK
 * and rear-side geometry changes. Front photograph RGB/cutout/source SHA and
 * mapped UV, exact original rest source and skin index/weights are untouched.
 *
 * A bounded source-hip/knee/ankle, real-cloth rear-section envelope supplies
 * subtle below-knee fullness and calf-to-hem fall, instead of body-shaped tubes.
 * This is neither measured fabric physics nor invented photographic back art.
 */
import * as T from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
const clamp=T.MathUtils.clamp,smooth=T.MathUtils.smoothstep,lerp=T.MathUtils.lerp;
const names=['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
const key=q=>q.toArray().map(v=>v.toFixed(5)).join(':');
const percentile=(data,f)=>{const a=data.slice().sort((a,b)=>a-b);return a[Math.floor((a.length-1)*f)];};
function sample(rows,y){
 if(y<=rows[0].y)return rows[0].z;
 for(let j=1;j<rows.length;j++)if(y<=rows[j].y)
  return lerp(rows[j-1].z,rows[j].z,clamp((y-rows[j-1].y)/(rows[j].y-rows[j-1].y),0,1));
 return rows.at(-1).z;
}
export function hangOriginalPhotographedDenimCalf74(pants,body,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0],old=mesh?.geometry,pos=old?.getAttribute('position');
 if(!mesh?.isSkinnedMesh||pants?.meshes?.length!==1||
    !pants.stats?.sourcePhotographedDenimRearDrape73||
    !pants.stats?.independentSewnPattern||pants.stats?.photoApplied!==true||
    !isSourceVerifiedDenimId(pants.stats?.sourceId)||
    !/^[a-f0-9]{64}$/.test(pants.stats?.sourceSHA256||'')||
    !body?.isObject3D||!pos||pos.count<400||
    names.some(n=>old.getAttribute(n)?.count!==pos.count))
  throw Error('3D74 requires exact SHA-vetted 3D73 photographed sewn skinned denim');
 const source=Object.fromEntries(names.map(n=>[n,old.getAttribute(n).array.slice()]));
 const legs=pants.stats.landmarks?.map(l=>Object.fromEntries(
  ['knee','ankle'].map(k=>[k,new T.Vector3(...l[k])])));
 if(legs?.length!==2||legs.some(l=>!['knee','ankle'].every(k=>l[k].toArray().every(Number.isFinite))||
    l.knee.y-l.ankle.y<.22))
  throw Error('3D74 requires authentic male/female knee-to-ankle source landmarks');
 body.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const front=old.getAttribute('pantsSourceFront');
 const nodes=new Map();
 for(let i=0;i<pos.count;i++){
  const q=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
  if(!q.toArray().every(Number.isFinite))throw Error('Nonfinite original photographed jeans mesh');
  const id=key(q);
  if(!nodes.has(id))nodes.set(id,{q,ids:[],front:0});
  const n=nodes.get(id);n.ids.push(i);n.front=Math.max(n.front,front.getX(i));
 }
 const cloth=[...nodes.values()],legSide=q=>q.x>=0?0:1;
 const profiles=legs.map((l,side)=>{
  const begin=l.ankle.y+.062,end=l.knee.y-.035,stations=[];
  if(end-begin<.18)throw Error('3D74 actual anatomical calf-fall region too short');
  for(let y=begin;y<=end+.00001;y+=.026){
   const f=clamp((y-l.ankle.y)/(l.knee.y-l.ankle.y),0,1);
   const cx=lerp(l.ankle.x,l.knee.x,f);
   const list=cloth.filter(n=>legSide(n.q)===side&&n.front<.28&&
    Math.abs(n.q.y-y)<.040&&Math.abs(n.q.x-cx)<.20);
   if(list.length<10)continue;
   stations.push({y,z:percentile(list.map(n=>n.q.z),.07),count:list.length});
  }
  if(stations.length<8)throw Error('3D74 actual photographic neutral-rear trouser profile insufficient');
  for(let pass=0;pass<2;pass++){
   const prev=stations.map(r=>r.z);
   for(let i=1;i<stations.length-1;i++)
    stations[i].z=.24*prev[i-1]+.52*prev[i]+.24*prev[i+1];
  }
  const k=Math.max(2,Math.floor(stations.length*.20));
  const ankleRear=percentile(stations.slice(0,k).map(v=>v.z),.5);
  const kneeRear=percentile(stations.slice(-k).map(v=>v.z),.5);
  // Ease is calibrated from measured genuine garment rear depth contrast.
  // Never infer a photographic rear, body shape, or made-up cloth decoration.
  const ease=clamp(.018+.10*Math.abs(kneeRear-ankleRear),.018,.030);
  return {begin,end,stations,ankleRear,kneeRear,ease};
 });
 const geometry=old.clone(),out=geometry.getAttribute('position'),
  inverse=mesh.matrixWorld.clone().invert(),nearest=bodySurface(body);
 let moved=0,frontProtected=0,contactGuarded=0,maxMove=0,negativeBefore=0,negativeAfter=0;
 const changedLeg=[0,0],low=[0,0],high=[0,0];
 for(const n of cloth){
  if(n.front>=.28){frontProtected+=n.ids.length;continue;}
  const side=legSide(n.q),r=profiles[side],y=n.q.y;
  if(y<r.begin||y>r.end)continue;
  const f=clamp((y-r.begin)/(r.end-r.begin),0,1);
  const envelopeFade=smooth(f,0,.16)*(1-smooth(f,.82,1));
  if(envelopeFade<.02)continue;
  const observed=sample(r.stations,y);
  const line=lerp(r.ankleRear,r.kneeRear,f);
  const hanging=line-r.ease*Math.sin(Math.PI*f);
  // Never pull the source into a new body-contour bulge. Use only the
  // source-verified unphotographed cloth's *posterior* depth measurements.
  const rearWeight=1-smooth(n.q.z-observed,.015,.13);
  const onlyUnphotographed=1-smooth(n.front,.015,.27);
  const influence=envelopeFade*rearWeight*onlyUnphotographed;
  if(influence<.04)continue;
  const missing=Math.max(0,observed-hanging);
  const shift=-Math.min(.029,Math.max(missing*.86,r.ease*.48*Math.sin(Math.PI*f)))*
   influence;
  if(Math.abs(shift)<.00020)continue;
  const hit=nearest(n.q);
  if(!hit?.point||!hit.normal||![...hit.point.toArray(),...hit.normal.toArray()].every(Number.isFinite))
   {geometry.dispose();throw Error('3D74 original anatomical nearest triangle unavailable');}
  const before=n.q.clone().sub(hit.point).dot(hit.normal);
  if(!Number.isFinite(before)){geometry.dispose();throw Error('3D74 invalid original-body clearance');}
  // Guard against worsening previous oriented contacts. This is explicitly
  // NOT a valid continuous signed-distance/swept 3D collision certificate.
  let safe=shift;
  const floor=Math.min(.005,before);
  if(before+safe*hit.normal.z<floor){
   if(hit.normal.z>1e-8)safe=Math.max(safe,(floor-before)/hit.normal.z);
   else safe=0;
   contactGuarded++;
  }
  if(before+safe*hit.normal.z<floor-.0003){
   geometry.dispose();throw Error('3D74 worsened original body contact');
  }
  if(Math.abs(safe)<.00020)continue;
  const q=n.q.clone();q.z+=safe;
  const local=q.applyMatrix4(inverse);
  for(const i of n.ids)out.setXYZ(i,local.x,local.y,local.z);
  moved+=n.ids.length;changedLeg[side]+=n.ids.length;
  if(f<.5)low[side]++;else high[side]++;
  maxMove=Math.max(maxMove,Math.abs(safe));
  if(before<0)negativeBefore++;if(before+safe*hit.normal.z<0)negativeAfter++;
 }
 if(moved<65||maxMove<.004||maxMove>.029001||
   changedLeg.some(n=>n<20)||low.some(n=>n<8)||high.some(n=>n<8)||
   frontProtected<100){
  geometry.dispose();throw Error('3D74 authentic calf/hem fabric relief not visible/bounded '+
   JSON.stringify({moved,maxMove,changedLeg,low,high,frontProtected,contactGuarded}));
 }
 out.needsUpdate=true;geometry.computeVertexNormals();
 smoothSurfaceNormals(geometry,out.count);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 for(const name of names){
  const after=geometry.getAttribute(name)?.array,before=source[name];
  if(!after||after.length!==before.length||!after.every((v,i)=>v===before[i])){
   geometry.dispose();throw Error('3D74 original photographic UV, front, rest or 163-joint skin attributes mutated: '+name);
  }
 }
 mesh.geometry=geometry;
 let disposed=false;
 return {...pants,stats:{...pants.stats,
   sourcePhotographedDenimCalfHang74:true,
   denimCalfSourceRearStations:profiles.map(r=>r.stations.length),
   denimCalfSourceMeasuredEase:profiles.map(r=>r.ease),
   denimCalfMovedVertices:moved,denimCalfMovedPerLeg:changedLeg,
   denimCalfLowerByLeg:low,denimCalfUpperByLeg:high,
   denimCalfMaxMovement:maxMove,denimCalfOriginalFrontProtected:frontProtected,
   denimCalfBodyContactGuarded:contactGuarded,
   denimCalfOriginalSourcePixelsUnchanged:true,
   denimCalfOriginalUVRestFrontSkinUnchanged:true,
   denimCalfNoFakePhotographicBack:true,
   actualHumanVisualAcceptance:false,physicalAndroidIphoneTested:false,
   sweptCollisionCertified:false,releaseAuthorized:false},
   dispose(){if(disposed)return;disposed=true;mesh.geometry=old;geometry.dispose();pants.dispose();}
 };
}
