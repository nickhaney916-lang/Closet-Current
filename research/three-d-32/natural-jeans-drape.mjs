import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
/** 3D-32: bounded original-body-aware jeans drape on separate skinned pants.
 * Shape source-pose mesh only. Never touch photographed RGB, original source UV,
 * original body rig, pantsRest mapping, skin weights or original image SHA.
 * Neutral pants and photographic dress remain byte-identical.
 */
import * as T from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';

const S=(v,a,b)=>T.MathUtils.smoothstep(v,a,b);
const bump=(v,a,b,c,d)=>S(v,a,b)*(1-S(v,c,d));
const key=v=>v.toArray().map(x=>x.toFixed(6)).join(',');
const v3=a=>new T.Vector3(...a);

export function drapeSourceJeans(pants,root,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0],g=mesh?.geometry,pos=g?.getAttribute('position'),rest=g?.getAttribute('pantsRest');
 if(!mesh?.isSkinnedMesh||pants.meshes.length!==1||!mesh.userData.work60Pants||
 !isSourceVerifiedDenimId(pants.stats?.sourceId)||pants.stats.photoApplied!==true||
 !rest||rest.count!==pos?.count||!g.getAttribute('pantsSourceUV')||
 !g.getAttribute('pantsSourceFront')||!root?.traverse)
  throw Error('Only reviewed real source-jeans on original anatomical pants may drape');
 const legs=pants.stats.landmarks?.map(x=>({hip:v3(x.hip),knee:v3(x.knee),ankle:v3(x.ankle)}));
 if(legs?.length!==2||legs.some(x=>![x.hip,x.knee,x.ankle].every(v=>v.toArray().every(Number.isFinite))||
 !(x.hip.y>x.knee.y+.18&&x.knee.y>x.ankle.y+.17)))throw Error('Original hip-knee-ankle measurements required');
 mesh.updateWorldMatrix(true,false);
 const inverse=mesh.matrixWorld.clone().invert(),nearest=bodySurface(root),nodes=new Map(),points=[];
 for(let i=0;i<pos.count;i++){
  const q=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
  const id=key(q);
  if(!nodes.has(id))nodes.set(id,{q:q.clone(),original:q.clone(),ids:[]});
  nodes.get(id).ids.push(i);
 }
 let changed=0,maxShift=0,hipMoved=0,thighMoved=0,kneeMoved=0,ankleMoved=0,
  contactLimited=0,minBefore=Infinity,minAfter=Infinity,invalidBase=0,invalidContact=0;
 // A continuous easing function follows measured leg segment landmarks. It
 // removes only excess radial bulk, rather than replacing anatomy with cylinders.
 for(const n of nodes.values()){
  const o=n.original;
  if(!o.toArray().every(Number.isFinite)){invalidBase++;continue;}
  const side=o.x>=0?0:1,leg=legs[side];
  const center=o.y>leg.knee.y?
   leg.hip.clone().lerp(leg.knee,T.MathUtils.clamp((leg.hip.y-o.y)/(leg.hip.y-leg.knee.y),0,1)):
   leg.knee.clone().lerp(leg.ankle,T.MathUtils.clamp((leg.knee.y-o.y)/(leg.knee.y-leg.ankle.y),0,1));
  const dx=o.x-center.x,dz=o.z-center.z,rad=Math.hypot(dx,dz);
  if(rad<.025)continue;
  const waistFade=1-S(o.y,leg.hip.y-.07,leg.hip.y+.05),
    ankleFade=S(o.y,leg.ankle.y+.018,leg.ankle.y+.105);
  const thigh=bump(o.y,leg.knee.y+.04,leg.knee.y+.16,leg.hip.y-.09,leg.hip.y+.02),
    seat=bump(o.y,leg.hip.y-.19,leg.hip.y-.13,leg.hip.y-.03,leg.hip.y+.035),
    knee=bump(o.y,leg.knee.y-.095,leg.knee.y-.018,leg.knee.y+.055,leg.knee.y+.14),
    calf=bump(o.y,leg.ankle.y+.085,leg.ankle.y+.16,leg.knee.y-.16,leg.knee.y-.07),
    hem=bump(o.y,leg.ankle.y+.016,leg.ankle.y+.027,leg.ankle.y+.055,leg.ankle.y+.10);
  // Outer thighs are fuller than a naturally falling trouser side seam. Take
  // up bounded ease there. Keep inner crotch/seat connected and front readable.
  const outward=S(dx*Math.sign(leg.hip.x||1),.005,.095);
  const back=S(-dz,.008,.13);
  const outerShrink=(.009*thigh+.006*seat+.004*knee+.008*calf)*outward;
  const depthShrink=(.005*thigh+.008*seat*back+.0035*knee+.006*calf);
  const hemRelease=.004*hem;
  const delta=new T.Vector3(
    (-Math.sign(dx)*outerShrink+Math.sign(dx)*hemRelease)*ankleFade*waistFade,
    0,
    (-Math.sign(dz)*depthShrink+Math.sign(dz)*hemRelease)*ankleFade*waistFade
  );
  if(delta.lengthSq()<1e-11)continue;
  if(delta.length()>.015)delta.setLength(.015);
  // Never allow inward ease to defeat measured original skin clearance.
  // This is source-pose nearest-triangle sampling, not signed cloth collision.
  const hit=nearest(o);
  if(!hit)throw Error('Original anatomical triangle missing');
  if(![...hit.point.toArray(),...hit.normal.toArray()].every(Number.isFinite)){
   invalidContact++;continue;
  }
  const gap=o.clone().sub(hit.point).dot(hit.normal);
  if(!Number.isFinite(gap)){invalidContact++;continue;}
  let q=o.clone().add(delta);
  const gapAfter=q.clone().sub(hit.point).dot(hit.normal);
  if(gapAfter<.007){
   const corrective=.007-gapAfter;
   q.addScaledVector(hit.normal,corrective);
   const length=q.distanceTo(o);
   if(length>.015){const corrected=q.clone();q.copy(o).lerp(corrected,.015/length);}
   contactLimited++;
  }
  minBefore=Math.min(minBefore,gap);minAfter=Math.min(minAfter,q.clone().sub(hit.point).dot(hit.normal));
  const move=q.distanceTo(o);
  if(!Number.isFinite(move)){
   throw Error('Nonfinite pants drape movement at source original coordinate '+JSON.stringify(o.toArray())+' gap '+gap+' delta '+JSON.stringify(delta.toArray()));
  }
  if(move<.00001)continue;
  n.q.copy(q);maxShift=Math.max(maxShift,move);changed++;
  if(seat>.1)hipMoved++;
  if(thigh>.1)thighMoved++;
  if(knee>.1)kneeMoved++;
  if(calf>.1||hem>.1)ankleMoved++;
 }
 if(invalidBase||invalidContact)throw Error('Preexisting original pants/body nonfinite samples '+JSON.stringify({invalidBase,invalidContact,changed,maxShift}));
 if(changed<150||maxShift<.002||maxShift>.0150001)throw Error('Anatomical drape failed measured geometry bound: '+JSON.stringify({changed,maxShift}));
 for(const n of nodes.values()){
  if(n.q.equals(n.original))continue;
  const local=n.q.clone().applyMatrix4(inverse);
  for(const i of n.ids)pos.setXYZ(i,local.x,local.y,local.z);
 }
 pos.needsUpdate=true;
 g.computeVertexNormals();smoothSurfaceNormals(g,pos.count);
 g.computeBoundingBox();g.computeBoundingSphere();
 return {...pants,stats:{...pants.stats,naturalJeansDrape:true,
  drapeMovedUniqueVertices:changed,maxDrapeMovement:maxShift,seatVertices:hipMoved,
  thighVertices:thighMoved,kneeVertices:kneeMoved,ankleVertices:ankleMoved,
  sourcePoseContactLimited:contactLimited,sourcePoseSampledMinBefore:minBefore,sourcePoseSampledMinAfter:minAfter,
  originalPhotoCoordinatesUnchanged:true,originalSourceUVUnchanged:true,originalSkinWeightsUnchanged:true,
  originalBodyUnchanged:true,sourcePoseTriangleSamplesOnly:true,fullCollisionValidated:false,
  drapeMethod:'measured hip-knee-ankle radial ease, 15mm max, original-body closest-triangle contact',
  humanVisualApproval:false,releaseAuthorized:false}};
}
