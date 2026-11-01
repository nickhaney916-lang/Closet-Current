/**
 * Closet Current 3D73 — actual SHA-vetted photographed denim, natural posterior
 * seat-to-thigh drape on the REAL independent skinned garment surface.
 *
 * Only source-neutral rear cloth moves. The source-verified photographic FRONT,
 * immutable decoded source pixels, UV transfer, original cutout provenance,
 * rest coordinates and skin weights are all retained. This is not a fabricated
 * back photo, simulated fabric dynamics, or physical-phone acceptance.
 * Research opt-in only; NEVER enabled for production or generic wardrobe.
 */
import * as THREE from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';

const clamp=THREE.MathUtils.clamp;
const smooth=THREE.MathUtils.smoothstep;
const lerp=THREE.MathUtils.lerp;
const sourceFields=['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
const stamp=p=>p.toArray().map(n=>n.toFixed(5)).join(':');
const percentile=(values,p)=>{const sorted=values.slice().sort((a,b)=>a-b);
 return sorted[Math.floor((sorted.length-1)*p)];};
function interpolate(rows,y){
 if(y<=rows[0].y)return rows[0].rear;
 for(let i=1;i<rows.length;i++)if(y<=rows[i].y)
  return lerp(rows[i-1].rear,rows[i].rear,
   clamp((y-rows[i-1].y)/(rows[i].y-rows[i-1].y),0,1));
 return rows.at(-1).rear;
}
export function easeSourcePhotographedDenimSeat73(pants,root,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0],original=mesh?.geometry,pos=original?.getAttribute('position');
 if(!mesh?.isSkinnedMesh||pants.meshes.length!==1||
   !pants.stats?.independentSewnPattern||!pants.stats?.photoApplied||
   !pants.stats?.originalPhotographedHangingLegPanels||
   !isSourceVerifiedDenimId(pants.stats.sourceId)||
   !/^[0-9a-f]{64}$/.test(pants.stats.sourceSHA256||'')||
   !root?.isObject3D||!pos||pos.count<400||
   sourceFields.some(n=>original.getAttribute(n)?.count!==pos.count))
  throw Error('3D73 requires SHA-vetted original photographic sewn skinned denim, not neutral or personal image');
 const lm=pants.stats.landmarks;
 if(!Array.isArray(lm)||lm.length!==2)throw Error('3D73 original anatomical legs missing');
 const legs=lm.map(l=>Object.fromEntries(['hip','knee','ankle'].map(k=>[k,new THREE.Vector3(...l[k])])));
 if(legs.some(l=>!['hip','knee','ankle'].every(k=>l[k].toArray().every(Number.isFinite))||
     l.hip.y-l.knee.y<.24||l.knee.y-l.ankle.y<.20))
  throw Error('3D73 original hip/knee/ankle source landmarks invalid');
 root.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const source=new Map(sourceFields.map(n=>[n,original.getAttribute(n).array.slice()]));
 const front=original.getAttribute('pantsSourceFront');
 const groups=new Map();
 for(let i=0;i<pos.count;i++){
  const q=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
  if(!q.toArray().every(Number.isFinite))throw Error('3D73 nonfinite real garment vertex');
  const key=stamp(q);
  if(!groups.has(key))groups.set(key,{q,ids:[],front:0});
  const g=groups.get(key);g.ids.push(i);g.front=Math.max(g.front,front.getX(i));
 }
 const nodes=[...groups.values()];
 const legSide=p=>p.x>=0?0:1;
 const profiles=legs.map((leg,side)=>{
  const start=leg.knee.y+.062,end=leg.hip.y-.062,stations=[];
  if(end-start<.24)throw Error('3D73 real source hip-knee span too short');
  for(let y=start;y<=end+.00001;y+=.025){
   const t=clamp((leg.hip.y-y)/(leg.hip.y-leg.knee.y),0,1);
   const x=lerp(leg.hip.x,leg.knee.x,t);
   const samples=nodes.filter(n=>legSide(n.q)===side&&n.front<.30&&
      Math.abs(n.q.y-y)<.034&&Math.abs(n.q.x-x)<.235);
   if(samples.length<10)continue;
   stations.push({y,rear:percentile(samples.map(n=>n.q.z),.08),samples:samples.length});
  }
  if(stations.length<9)throw Error('3D73 insufficient genuine source photographed-denim rear stations');
  for(let pass=0;pass<2;pass++){
   const prev=stations.map(r=>r.rear);
   for(let i=1;i<stations.length-1;i++)
    stations[i].rear=.23*prev[i-1]+.54*prev[i]+.23*prev[i+1];
  }
  const k=Math.max(3,Math.floor(stations.length*.16));
  const lower=percentile(stations.slice(0,k).map(r=>r.rear),.5);
  const upper=percentile(stations.slice(-k).map(r=>r.rear),.5);
  const ease=clamp(.010+.07*Math.abs(upper-lower),.010,.019);
  return {start,end,stations,lower,upper,ease,side};
 });
 const geometry=original.clone(),out=geometry.getAttribute('position');
 const inverse=mesh.matrixWorld.clone().invert(),nearest=bodySurface(root);
 let moved=0,movedNodes=0,frontProtected=0,maxMovement=0,contactLimited=0,
  unchangedPhotographicVertices=0,negativeBefore=0,negativeAfter=0;
 const eachLeg=[0,0],upperByLeg=[0,0],middleByLeg=[0,0];
 for(const n of nodes){
  if(n.front>=.30){frontProtected+=n.ids.length;continue;}
  const side=legSide(n.q),profile=profiles[side],y=n.q.y;
  if(y<profile.start||y>profile.end)continue;
  const fraction=clamp((y-profile.start)/(profile.end-profile.start),0,1);
  const fade=smooth(fraction,.02,.19)*(1-smooth(fraction,.78,.99));
  if(fade<=.025)continue;
  const measured=interpolate(profile.stations,y);
  const ideal=lerp(profile.lower,profile.upper,fraction)-
   profile.ease*Math.sin(Math.PI*fraction);
  const deficit=measured-ideal;
  if(deficit<.0005)continue;
  const behind=1-smooth(n.q.z-measured,.015,.120);
  const unphotographed=1-smooth(n.front,.01,.27);
  const influence=behind*unphotographed*fade;
  if(influence<=.04)continue;
  let dz=-Math.min(.021,deficit*.92)*influence;
  if(Math.abs(dz)<.00018)continue;
  const h=nearest(n.q);
  if(!h?.point||!h.normal||![...h.point.toArray(),...h.normal.toArray()].every(Number.isFinite))
    {geometry.dispose();throw Error('3D73 real body triangle nearest point unavailable');}
  const before=n.q.clone().sub(h.point).dot(h.normal);
  if(!Number.isFinite(before)){geometry.dispose();throw Error('3D73 nonfinite body contact');}
  // Never worsen original oriented contact. Existing negative contacts are
  // deliberately not represented as valid or fully signed containment.
  const floor=Math.min(before,.005);
  if(before+dz*h.normal.z<floor){
   if(h.normal.z>1e-8)dz=Math.max(dz,(floor-before)/h.normal.z);
   else dz=0;
   contactLimited++;
  }
  const after=before+dz*h.normal.z;
  if(after<floor-.0003){geometry.dispose();throw Error('3D73 body contact worsened');}
  if(Math.abs(dz)<.00018)continue;
  const q=n.q.clone();q.z+=dz;
  const local=q.applyMatrix4(inverse);
  for(const id of n.ids)out.setXYZ(id,local.x,local.y,local.z);
  moved+=n.ids.length;movedNodes++;eachLeg[side]+=n.ids.length;
  if(fraction>.50)upperByLeg[side]++;else middleByLeg[side]++;
  maxMovement=Math.max(maxMovement,Math.abs(dz));
  if(before<0)negativeBefore++;if(after<0)negativeAfter++;
 }
 if(moved<50||maxMovement<.002||maxMovement>.021001||
    eachLeg.some(n=>n<15)||upperByLeg.some(n=>n<5)||middleByLeg.some(n=>n<5)||
    frontProtected<80){
  geometry.dispose();
  throw Error('3D73 real photographed back-thigh drape not substantial and bounded '+
    JSON.stringify({moved,maxMovement,eachLeg,upperByLeg,middleByLeg,frontProtected,contactLimited}));
 }
 out.needsUpdate=true;geometry.computeVertexNormals();smoothSurfaceNormals(geometry,out.count);
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 for(const name of sourceFields){
  const was=source.get(name),now=geometry.getAttribute(name)?.array;
  if(!now||now.length!==was.length||!now.every((v,i)=>v===was[i])){
   geometry.dispose();throw Error('3D73 tampered original source photo mapping, rest or skin: '+name);
  }
  unchangedPhotographicVertices=pos.count;
 }
 mesh.geometry=geometry;
 let disposed=false;
 return {...pants,stats:{...pants.stats,
  sourcePhotographedDenimRearDrape73:true,
  denimRearSourceMeasuredStations:profiles.map(p=>p.stations.length),
  denimRearMovedVertices:moved,denimRearUniqueMovedNodes:movedNodes,
  denimRearMovedPerLeg:eachLeg,denimRearUpperThighPerLeg:upperByLeg,
  denimRearMiddleThighPerLeg:middleByLeg,denimRearMaximumWorldMove:maxMovement,
  denimRearFrontProtectedVertices:frontProtected,
  denimRearSourceRestUVFrontAndSkinIdentical:true,
  denimRearOriginalSourceImagePixelsUnchanged:true,
  denimRearSourceCoordinateFieldsCount:unchangedPhotographicVertices,
  denimRearContactLimited:contactLimited,
  denimRearNegativeOrientedBefore:negativeBefore,denimRearNegativeOrientedAfter:negativeAfter,
  denimRearNoInventedBackPhoto:true,
  fullSweptCollisionCertified:false,
  actualPhysicalPhoneTested:false,humanVisualApproval:false,releaseAuthorized:false},
  dispose(){if(disposed)return;disposed=true;mesh.geometry=original;geometry.dispose();pants.dispose();}
 };
}
