/** 3D39 — residual source-pose CLOTH-TO-CLOTH waistband contact, RESEARCH HOLD.
 *
 * 3D38 fit the shirt to one averaged jeans waist ring. This module evaluates
 * the ACTUAL photographed denim surface at a given HEIGHT + ANGLE and shapes
 * the already photo-registered shirt hem where the two separate materials
 * overlap. All measurements are from the verified pants' skinned source mesh,
 * not the body or an invented rear photo. Immutable shirt source photo UV/RGB
 * mapping (panelPosition/panelNormal), pants source UV/rest/skin, original body.
 *
 * Radial surface-depth envelopes are NOT full signed triangle collision,
 * physics, fabric sewing, or real-body size fitting. Multi-pose tests report
 * original rest geometry and separate source/relaxed render checks.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
const smooth=T.MathUtils.smoothstep,clamp=T.MathUtils.clamp;
const key=p=>p.toArray().map(v=>v.toFixed(5)).join(',');
const AZ=32,STEP=.015;
const pct=(list,q)=>{const sorted=list.slice().sort((a,b)=>a-b);return sorted[Math.floor((sorted.length-1)*q)];};
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
export function fitPhotographedOutfitContact(shirt,pants,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.meshes?.length||shirt.stats?.originalPhotoShirtOverDenim!==true||
 !pants?.meshes?.[0]?.isSkinnedMesh||pants.meshes.length!==1||
 !pants.stats?.photoApplied||!isSourceVerifiedDenimId(pants.stats.sourceId)||
 !shirt.meshes.every(m=>m.isSkinnedMesh))
  throw Error('3D39 requires source-registered verified original photographic shirt over either jeans source');
 const waistY=pants.stats.waistY,pm=pants.meshes[0],g=pm.geometry,p=g.getAttribute('position');
 if(!Number.isFinite(waistY)||!p||!g.getAttribute('pantsSourceUV')||!g.getAttribute('pantsRest'))
  throw Error('Original photographed skinned pants source rest and UV required');
 pm.updateWorldMatrix(true,false);
 const low=waistY-.113,high=waistY+.028,COUNT=Math.ceil((high-low)/STEP);
 const verts=[];
 for(let i=0;i<p.count;i++){
  const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(pm.matrixWorld);
  if(q.y>=low-.032&&q.y<=high+.032&&Math.abs(q.x)<.38)verts.push(q);
 }
 if(verts.length<200)throw Error('Source denim torso contact surface missing');
 const sortedX=verts.map(q=>q.x).sort((a,b)=>a-b),sortedZ=verts.map(q=>q.z).sort((a,b)=>a-b);
 const cx=pct(sortedX,.50),cz=pct(sortedZ,.50);
 const table=Array.from({length:COUNT},()=>Array.from({length:AZ},()=>[]));
 const indexAngle=q=>clamp(Math.floor((Math.atan2(q.z-cz,q.x-cx)+Math.PI)/(2*Math.PI)*AZ),0,AZ-1);
 const radius=q=>Math.hypot(q.x-cx,q.z-cz);
 for(const q of verts){
  const yi=Math.floor((q.y-low)/STEP),xi=indexAngle(q);
  for(let j=Math.max(0,yi-2);j<=Math.min(COUNT-1,yi+2);j++)
   if(Math.abs(q.y-(low+(j+.5)*STEP))<.027)table[j][xi].push(radius(q));
 }
 // Robust original sampled envelope: use upper 85th percentile so a single
 // outlying duplicated triangle does not inflate the hem around the figure.
 const ring=table.map((row,y)=>row.map((v,a)=>{
  if(v.length>=6)return pct(v,.85);
  for(let d=1;d<6;d++){
   for(const n of [(a-d+AZ)%AZ,(a+d)%AZ])
    if(row[n].length>=6)return pct(row[n],.85);
  }
  // No trustworthy source at this angle and height: mark unsupported,
  // rather than falsely extrapolating an anatomical body or fixed cylinder.
  return null;
 }));
 const contact=q=>{
  const yf=clamp((q.y-low)/STEP-.5,0,COUNT-1),y0=Math.floor(yf),y1=Math.min(COUNT-1,y0+1),
   af=(Math.atan2(q.z-cz,q.x-cx)+Math.PI)/(2*Math.PI)*AZ,
   a0=clamp(Math.floor(af),0,AZ-1),a1=(a0+1)%AZ,at=af-Math.floor(af);
  const lo=ring[y0][a0],hi=ring[y0][a1],ulo=ring[y1][a0],uhi=ring[y1][a1];
  if([lo,hi,ulo,uhi].some(x=>!Number.isFinite(x)))return null;
  return T.MathUtils.lerp(T.MathUtils.lerp(lo,hi,at),T.MathUtils.lerp(ulo,uhi,at),yf-y0);
 };
 const changes=new Map(),sources=new Map(),all=[];
 let samples=0,invalid=0,insideBefore=0,insideAfter=0,maxBefore=0,maxAfter=0,
  sumDepthBefore=0,sumDepthAfter=0,shiftSum=0,maxShift=0,moved=0,bounded=0,
  minGapBefore=Infinity,minGapAfter=Infinity,front=0,rear=0,side=0;
 for(const m of shirt.meshes){
  if(m.name==='Work59-source-neutral-collar-band')continue;
  m.updateWorldMatrix(true,false);
  const mesh=m.geometry,position=mesh.getAttribute('position');
  const names=['panelPosition','panelNormal','skinIndex','skinWeight'];
  if(!position||names.some(id=>mesh.getAttribute(id)?.count!==position.count))
   throw Error('Original photographed shirt shell/source UV and skinned bones invalid');
  sources.set(m,Object.fromEntries(names.map(name=>[name,mesh.getAttribute(name).array.slice()])));
  const nodes=new Map();
  for(let i=0;i<position.count;i++){
   const q=new T.Vector3().fromBufferAttribute(position,i).applyMatrix4(m.matrixWorld),id=key(q);
   let n=nodes.get(id);
   if(!n){n={p:q.clone(),ids:[]};nodes.set(id,n);}n.ids.push(i);
  }
  const rows=[];
  for(const n of nodes.values()){
   const q=n.p,dX=q.x-cx,dZ=q.z-cz,r=Math.hypot(dX,dZ);
   if(q.y<low||q.y>high||r<.06||Math.abs(q.x)>.32)continue;
   const nearby=contact(q);
   if(nearby===null){invalid++;continue;}
   const gap=r-nearby,depth=Math.max(0,.006-gap);
   // The lower hem should be outside the actual denim surface, while the
   // portion rising above the waistband must naturally blend to torso fabric.
   const fade=(smooth(q.y,low,low+.023)*
     (1-smooth(q.y,waistY-.022,high))*
     (1-smooth(Math.abs(dX),.26,.32)));
   if(fade<.05)continue;
   samples++;
   const maxMove=.042;
   const shift=Math.min(maxMove,depth*fade);
   const after=gap+shift,penetration=Math.max(0,.006-gap),
    remaining=Math.max(0,.006-after);
   if(penetration>.0001){insideBefore++;sumDepthBefore+=penetration;maxBefore=Math.max(maxBefore,penetration);}
   if(remaining>.0001){insideAfter++;sumDepthAfter+=remaining;maxAfter=Math.max(maxAfter,remaining);}
   minGapBefore=Math.min(minGapBefore,gap);minGapAfter=Math.min(minGapAfter,after);
   if(shift<.00015)continue;
   if(depth*fade>maxMove)bounded++;
   const target=q.clone().add(new T.Vector3(dX/r,0,dZ/r).multiplyScalar(shift));
   rows.push({n,target});moved++;shiftSum+=shift;maxShift=Math.max(maxShift,shift);
   if(q.z>cz+.025)front++;else if(q.z<cz-.025)rear++;else side++;
  }
  changes.set(m,rows);
 }
 const alreadyNearlyClear=sumDepthBefore<.002&&insideBefore<=5;
 if(samples<70||maxShift>.04201||
 (!alreadyNearlyClear&&(moved<25||maxShift<.003||!(sumDepthAfter<sumDepthBefore))))
  throw Error('Original source cloth-to-cloth contact cannot be improved safely '+JSON.stringify({samples,moved,maxShift,insideBefore,insideAfter,sumDepthBefore,sumDepthAfter,invalid}));
 if(minGapAfter<minGapBefore-.00001||sumDepthAfter>sumDepthBefore+1e-8)
  throw Error('Cannot worsen measured original photographed waist penetration');
 for(const [m,rows] of changes){
  const geom=m.geometry,position=geom.getAttribute('position'),inverse=m.matrixWorld.clone().invert();
  for(const {n,target} of rows){
   const local=target.applyMatrix4(inverse);
   for(const i of n.ids)position.setXYZ(i,local.x,local.y,local.z);
  }
  position.needsUpdate=true;geom.computeVertexNormals();
  smoothSurfaceNormals(geom,position.count);geom.computeBoundingSphere();geom.computeBoundingBox();
 }
 for(const [m,attrs] of sources)
  for(const [name,arr] of Object.entries(attrs))
   if(!equal(arr,m.geometry.getAttribute(name).array))
    throw Error('Photographed shirt mapping/skin altered: '+name);
 return {...shirt,stats:{...shirt.stats,
  originalClothContactCorrection:true,
  contactSource:'actual independently photographed skinned jeans geometry with source-height x azimuth fabric envelope',
  contactPantsSourceId:pants.stats.sourceId,
  contactSurfaceVertexSamples:verts.length,contactHeightSections:COUNT,
  contactAngularSections:AZ,contactEvaluatedNodes:samples,
  contactUnsupportedOriginalMaterialNodes:invalid,
  contactBeforeCount:insideBefore,contactAfterCount:insideAfter,
  contactCorrectionNecessary:!alreadyNearlyClear,
  contactAlreadyNearlyClear:alreadyNearlyClear,
  contactBeforeTotalDepth:sumDepthBefore,contactAfterTotalDepth:sumDepthAfter,
  contactBeforeMaxDepth:maxBefore,contactAfterMaxDepth:maxAfter,
  contactMaxShift:maxShift,contactMeanShift:shiftSum/moved,
  contactMovedUniqueVertices:moved,contactBoundedVertices:bounded,
  contactFrontVertices:front,contactBackVertices:rear,contactSideVertices:side,
  contactMinRadialGapBefore:minGapBefore,contactMinRadialGapAfter:minGapAfter,
  preservedOriginalShirtSourcePixels:true,preservedOriginalShirtUV:true,
  preservedOriginalDenimUVAndPixels:true,preservedOriginalSkinAndAnatomy:true,
  certifiedFullCollisionFree:false,physicallySimulatedCloth:false,
  humanVisualApproval:false,releaseAuthorized:false
 }};
}
