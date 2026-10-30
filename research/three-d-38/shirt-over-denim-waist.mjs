/** 3D38 — physical shirt-over-photographed-jeans hem transition, research only.
 * Fit shirt lower-torso geometry against actual photographed-pants waist ring.
 * Uses existing male/female 163-bone original source-pose skinned garment meshes.
 * Never changes original photo JPEG/PNG, source-panel UV/RGB, clothes labels,
 * body positions, skeleton, or pictures of unphotographed backs.
 * Not a signed collision solver, real garment sizing, or sewn hem topology.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
const clamp=T.MathUtils.clamp;
const smooth=T.MathUtils.smoothstep;
const key=p=>p.toArray().map(n=>n.toFixed(5)).join(':');
const percentile=(values,p)=>{
 if(!values.length)throw Error('Missing photographed pants waist cloth ring');
 const sorted=values.slice().sort((a,b)=>a-b);return sorted[Math.floor((sorted.length-1)*p)];
};
const BAND_COUNT=32;
export function alignOriginalShirtOverJeans(shirt,pants,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.meshes?.length||!pants?.meshes?.length||pants?.stats?.photoApplied!==true||
 !isSourceVerifiedDenimId(pants.stats.sourceId)||!pants.stats.originalCrotchSaddle||
 !shirt.stats?.envelope||!shirt.meshes.every(m=>m.isSkinnedMesh)||
 pants.meshes.length!==1||!pants.meshes[0].isSkinnedMesh)
  throw Error('Source-reviewed original shirt and independently fitted original-photo jeans required');
 const waistY=pants.stats.waistY;
 if(!Number.isFinite(waistY)||waistY<.8||waistY>1.5)throw Error('Original photographed jeans waist landmark invalid');
 const pm=pants.meshes[0],pg=pm.geometry;
 if(!pg.getAttribute('pantsSourceUV')||!pg.getAttribute('pantsRest')||!pg.getAttribute('skinWeight'))
  throw Error('No authentic photographed pants geometry');
 pm.updateWorldMatrix(true,false);
 const points=[],selected=[];
 for(let i=0;i<pg.attributes.position.count;i++){
  const p=new T.Vector3().fromBufferAttribute(pg.attributes.position,i).applyMatrix4(pm.matrixWorld);
  if(Math.abs(p.y-waistY)<.075&&Math.abs(p.x)<.34)points.push(p);
 }
 if(points.length<80)throw Error('Insufficient real jeans waist cloth');
 const cx=percentile(points.map(p=>p.x),.5),cz=percentile(points.map(p=>p.z),.5);
 const radius=p=>Math.hypot(p.x-cx,p.z-cz);
 const bin=p=>{
  const theta=Math.atan2(p.z-cz,p.x-cx);
  return Math.min(BAND_COUNT-1,Math.floor(((theta+Math.PI)/(2*Math.PI))*BAND_COUNT));
 };
 const bins=Array.from({length:BAND_COUNT},()=>[]);
 for(const p of points)bins[bin(p)].push(radius(p));
 // Circular interpolation over REAL JEANS positions only; no avatar radius
 // guessed from a sex/body category or new clothing-source RGB.
 const support=bins.map((a,i)=>{
  if(a.length>=5)return percentile(a,.82);
  for(let j=1;j<9;j++){
   const before=bins[(i-j+BAND_COUNT)%BAND_COUNT],after=bins[(i+j)%BAND_COUNT];
   if(before.length>=5||after.length>=5)return percentile(before.length>=5?before:after,.82);
  }
  throw Error('Original pants ring has incomplete angular coverage');
 });
 for(let i=0;i<support.length;i++){
  const before=support[(i-1+support.length)%support.length],after=support[(i+1)%support.length];
  support[i]=.15*before+.7*support[i]+.15*after;
 }
 const contactByAngle=p=>{
  const theta=Math.atan2(p.z-cz,p.x-cx);
  const u=(theta+Math.PI)*BAND_COUNT/(2*Math.PI);
  const a=(Math.floor(u)+BAND_COUNT)%BAND_COUNT,b=(a+1)%BAND_COUNT;
  return T.MathUtils.lerp(support[a],support[b],u-Math.floor(u));
 };
 const originalAttributes=new Map(),movement=new Map();
 let unique=0,max=0,sum=0,frontMoved=0,rearMoved=0,sideMoved=0,
  contactRepaired=0,hemBand=0,minGapBefore=Infinity,minGapAfter=Infinity,
  clippedByBound=0;
 // Source-pose shirt geometry. Coincident triangles/weld nodes must be moved
 // uniformly to avoid accidentally splitting the original photographed shirt.
 for(const m of shirt.meshes){
  if(m.name==='Work59-source-neutral-collar-band')continue;
  m.updateWorldMatrix(true,false);
  const g=m.geometry,pos=g.attributes.position,photo=g.attributes.panelPosition,
   normal=g.attributes.panelNormal,weights=g.attributes.skinWeight,indices=g.attributes.skinIndex;
  if(!pos||!photo||!normal||!weights||!indices||
    [photo,normal,weights,indices].some(attr=>attr.count!==pos.count))
    throw Error('Original shirt source-panel coordinates and exact skin attributes required');
  originalAttributes.set(m,{photo:photo.array.slice(),normal:normal.array.slice(),
   weights:weights.array.slice(),indices:indices.array.slice()});
  const inv=m.matrixWorld.clone().invert(),nodes=new Map();
  for(let i=0;i<pos.count;i++){
   const p=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld),k=key(p);
   if(!nodes.has(k))nodes.set(k,{p:p.clone(),ids:[]});
   nodes.get(k).ids.push(i);
  }
  const rows=[];
  for(const n of nodes.values()){
   const p=n.p,dx=p.x-cx,dz=p.z-cz,r=Math.hypot(dx,dz);
   if(r<.06||Math.abs(dx)>.315||p.y<waistY-.11||p.y>waistY+.15)continue;
   const lower=smooth(p.y,waistY-.11,waistY-.050),
    upper=1-smooth(p.y,waistY+.015,waistY+.145),
    influence=lower*upper*(1-smooth(Math.abs(dx),.26,.315));
   if(influence<.02)continue;
   // The original shirt hem should lightly OVERLAP the actual denim
   // waistband with 9-17mm measured radial fabric clearance; a subtle
   // additional 7mm outward fabric flare supplies recognizable shirt drape.
   const jeans=contactByAngle(p),gap=r-jeans,
    ease=.010+.007*(1-smooth(p.y,waistY-.035,waistY+.065)),
    desired=Math.max(0,jeans+ease-r),
    flaring=.007*(1-smooth(p.y,waistY-.045,waistY+.095));
   // Leave already-loose shirt geometry alone except subtle hem-edge drape.
   const shift=Math.min(.028,Math.max(desired,flaring)*influence);
   if(shift<=.00012)continue;
   if(desired*influence>.028)clippedByBound++;
   const q=p.clone().add(new T.Vector3(dx/r,0,dz/r).multiplyScalar(shift));
   rows.push({n,q,gap,before:p.y,shift,afterGap:gap+shift});
  }
  movement.set(m,rows);
  for(const row of rows){
   unique++;sum+=row.shift;max=Math.max(max,row.shift);
   minGapBefore=Math.min(minGapBefore,row.gap);
   minGapAfter=Math.min(minGapAfter,row.afterGap);
   if(row.gap<.009&&row.afterGap>row.gap+.0001)contactRepaired++;
   if(row.before<waistY+.025)hemBand++;
   if(row.n.p.z>cz+.018)frontMoved++;
   else if(row.n.p.z<cz-.018)rearMoved++;
   else sideMoved++;
  }
 }
 if(unique<35||max<.003||max>.028001||!Number.isFinite(minGapAfter))
  throw Error('Full outfit lacks measurable, bounded source-waist-to-hem fit '+JSON.stringify({unique,max,waistY,points:points.length}));
 // Change only cloth positions in preexisting skinned shirt geometry. A
 // secondary garment geometry would require reattaching the shader; source
 // panel image coordinates are strictly IMMUTABLE in this operation.
 for(const [m,rows] of movement){
  const g=m.geometry,pos=g.attributes.position,inv=m.matrixWorld.clone().invert();
  for(const {n,q} of rows){const v=q.applyMatrix4(inv);for(const i of n.ids)pos.setXYZ(i,v.x,v.y,v.z);}
  pos.needsUpdate=true;g.computeVertexNormals();
  smoothSurfaceNormals(g,pos.count);g.computeBoundingBox();g.computeBoundingSphere();
 }
 const immutable=[...originalAttributes].every(([m,a])=>{
  const g=m.geometry,equals=(name,original)=>{
   const current=g.getAttribute(name).array;
   return current.length===original.length&&current.every((v,i)=>v===original[i]);
  };
  return equals('panelPosition',a.photo)&&equals('panelNormal',a.normal)&&
   equals('skinWeight',a.weights)&&equals('skinIndex',a.indices);
 });
 if(!immutable)throw Error('Original shirt photograph and skin attributes were modified');
 return {...shirt,stats:{...shirt.stats,
  originalPhotoShirtOverDenim:true,waistHemFitReference:'actual first/second source denim skinned waist ring, 32 angular sections',
  outfitPantSourceId:pants.stats.sourceId,garmentWaistY:waistY,
  garmentWaistSampleVertices:points.length,shirtHemUniqueMoved:unique,
  shirtHemMaxMove:max,shirtHemMeanMove:sum/unique,shirtHemFlaringVertices:hemBand,
  shirtWaistContactRepaired:contactRepaired,shirtHemFrontVertices:frontMoved,
  shirtHemSideVertices:sideMoved,shirtHemRearVertices:rearMoved,
  shirtHemBoundLimited:clippedByBound,shirtWaistOrientedRadialGapMinBefore:minGapBefore,
  shirtWaistOrientedRadialGapMinAfter:minGapAfter,
  sourcePanelPixelsUnchanged:true,sourcePanelCoordinatesUnchanged:true,
  originalShirtSkinAndOriginalPantUVUnchanged:true,bodyUnchanged:true,
  physicallySewnHem:false,signedCollisionValidated:false,
  humanVisualApproval:false,releaseAuthorized:false}};
}
