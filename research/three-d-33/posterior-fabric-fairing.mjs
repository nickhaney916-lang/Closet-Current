/** 3D-33: source-preserving posterior fabric fairing for original photographed jeans.
 * This is deliberately only a small, testable surface-geometry operation,
 * NOT an invented photographed rear, full signed collision, or cloth simulation.
 * All source UV, original texture/RGB, pantsRest, skin and body are immutable.
 */
import * as T from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';

const smooth=(v,a,b)=>T.MathUtils.smoothstep(v,a,b);
const clamp=(v,a,b)=>T.MathUtils.clamp(v,a,b);
const POS_KEY=p=>[p.x,p.y,p.z].map(v=>v.toFixed(5)).join(':');
const cell=(x,y)=>Math.floor(x/.026)+':'+Math.floor(y/.026);

export function fairPhotographedJeansSeat(pants,root,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0],g=mesh?.geometry;
 const pos=g?.getAttribute('position'),rest=g?.getAttribute('pantsRest'),
  front=g?.getAttribute('pantsSourceFront');
 if(!mesh?.isSkinnedMesh||pants.meshes.length!==1||!mesh.userData.work60Pants||
 !pants.stats?.naturalJeansDrape||!pants.stats?.photoApplied||
 pants.stats?.sourceId!=='commons-public-domain-jeans-2005'||
 !rest||rest.count!==pos?.count||!front||front.count!==pos.count||
 !g.getAttribute('pantsSourceUV')||!root?.traverse)
  throw Error('3D33 requires source-verified original-jeans 3D32 garment only');
 const {waistY,hemY,landmarks}=pants.stats;
 if(!(Number.isFinite(waistY)&&Number.isFinite(hemY)&&waistY-hemY>.60)||
 !Array.isArray(landmarks)||landmarks.length!==2)throw Error('Original lower-body anatomical landmarks required');
 mesh.updateWorldMatrix(true,false);
 const inv=mesh.matrixWorld.clone().invert(),nodes=new Map();
 for(let i=0;i<pos.count;i++){
  const q=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
  if(!q.toArray().every(Number.isFinite))throw Error('Nonfinite source-pose 3D32 pants vertices');
  const id=POS_KEY(q);
  let node=nodes.get(id);
  if(!node){node={original:q.clone(),ids:[],front:0};nodes.set(id,node);}
  node.ids.push(i);node.front=Math.max(node.front,front.getX(i));
 }
 // Posterior silhouette grid: smooth out mesh-rig ribbing, but do not touch
 // original front photograph. Use only ORIGINAL 3D geometry as measurements.
 const grid=new Map(), posterior=[];
 for(const n of nodes.values()){
  if(n.front>.35)continue;
  const p=n.original,k=cell(p.x,p.y);
  let c=grid.get(k);if(!c){c={x:0,y:0,z:0,n:0};grid.set(k,c);}
  c.x+=p.x;c.y+=p.y;c.z+=p.z;c.n++;
  posterior.push(n);
 }
 if(posterior.length<500)throw Error('A continuous original-body posterior pant surface is required');
 for(const c of grid.values()){c.x/=c.n;c.y/=c.n;c.z/=c.n;}
 const nearest=bodySurface(root);
 let moved=0,maxMovement=0,seatMoved=0,thighMoved=0,calfMoved=0,
  limited=0,minBefore=Infinity,minAfter=Infinity,negativeBefore=0,negativeAfter=0;
 for(const n of posterior){
  const o=n.original,y=o.y;
  const upper=1-smooth(y,waistY-.083,waistY-.012),
   lower=smooth(y,hemY+.035,hemY+.14);
  const region=upper*lower*(1-smooth(n.front,.09,.35));
  if(region<.01)continue;
  const xb=Math.floor(o.x/.026),yb=Math.floor(y/.026);
  let total=0,za=0;
  // Average a modest longitudinal + lateral window; never invent structure
  // across front/side or across a detached leg.
  for(let dx=-1;dx<=1;dx++)for(let dy=-3;dy<=3;dy++){
   const c=grid.get((xb+dx)+':'+(yb+dy));if(!c||c.n<2)continue;
   if(Math.abs(c.x-o.x)>.047||Math.abs(c.y-y)>.095)continue;
   const w=1/(1+Math.abs(dx)*1.2+Math.abs(dy)*.65);
   total+=w;za+=c.z*w;
  }
  if(total<=0)continue;
  const smoothZ=za/total;
  // 7mm posterior relief fairing: relax stepped seat/calf ridges while
  // preserving actual source-image front and original 3D limb location.
  const kneeY=(landmarks[0].knee[1]+landmarks[1].knee[1])/2;
  const seatBand=smooth(y,kneeY+.17,kneeY+.32)*(1-smooth(y,waistY-.08,waistY-.01));
  const calfBand=smooth(y,hemY+.08,hemY+.18)*(1-smooth(y,kneeY-.15,kneeY+.10));
  const band=Math.max(seatBand,calfBand*.85);
  const dz=clamp((smoothZ-o.z)*.54,-.010,.010)*region*band;
  if(Math.abs(dz)<.000008)continue;
  let q=o.clone();q.z+=dz;
  const hit=nearest(o);
  if(!hit||![...hit.point.toArray(),...hit.normal.toArray()].every(Number.isFinite))throw Error('Original body surface unavailable for posterior clearance');
  const before=o.clone().sub(hit.point).dot(hit.normal);
  if(!Number.isFinite(before))throw Error('Original contact estimate nonfinite');
  const after=q.clone().sub(hit.point).dot(hit.normal);
  const floor=Math.min(before,.006);
  if(after<floor){
   // Do NOT make pre-existing negative male oriented contact samples worse.
   q.addScaledVector(hit.normal,floor-after);limited++;
  }
  let displacement=q.clone().sub(o);
  if(displacement.length()>.012)q.copy(o).add(displacement.setLength(.012));
  const checked=q.clone().sub(hit.point).dot(hit.normal);
  if(!Number.isFinite(checked)||checked<before-.0005||
    before>=.006&&checked<.0055){limited++;continue;}
  const move=q.distanceTo(o);
  if(!Number.isFinite(move))throw Error('Invalid posterior clothing displacement');
  if(move<.00001)continue;
  n.next=q;
  moved++;maxMovement=Math.max(maxMovement,move);
  minBefore=Math.min(minBefore,before);minAfter=Math.min(minAfter,checked);
  if(before<0)negativeBefore++;if(checked<0)negativeAfter++;
  if(seatBand>.4)seatMoved++;
  else if(y>kneeY)thighMoved++;
  else calfMoved++;
 }
 if(moved<180||maxMovement<.001||maxMovement>.0120001)
  throw Error('Posterior source garment fairing not measurable or not bounded '+JSON.stringify({moved,maxMovement}));
 for(const n of posterior){
  if(!n.next)continue;
  const local=n.next.clone().applyMatrix4(inv);
  for(const i of n.ids)pos.setXYZ(i,local.x,local.y,local.z);
 }
 pos.needsUpdate=true;
 g.computeVertexNormals();smoothSurfaceNormals(g,pos.count);
 g.computeBoundingBox();g.computeBoundingSphere();
 return {...pants,stats:{...pants.stats,posteriorFabricFairing:true,
  posteriorMovedUniqueVertices:moved,posteriorMaxMovement:maxMovement,
  posteriorSeatMoved:seatMoved,posteriorThighMoved:thighMoved,
  posteriorCalfMoved:calfMoved,posteriorContactLimited:limited,
  posteriorProbeMinBefore:minBefore,posteriorProbeMinAfter:minAfter,
  posteriorNegativeBefore:negativeBefore,posteriorNegativeAfter:negativeAfter,
  posteriorSourceUVUnchanged:true,posteriorRestUnchanged:true,
  posteriorOriginalRGBUnchanged:true,posteriorSkeletonUnchanged:true,
  posteriorMethod:'bounded source-geometry 26mm grid fairing, posterior only, 12mm limit',
  fullCollisionValidated:false,humanVisualApproval:false,releaseAuthorized:false}};
}
