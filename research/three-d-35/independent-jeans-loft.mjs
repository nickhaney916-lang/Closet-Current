/** 3D35 — a separate patterned trouser surface, NOT another skin-offset brush.
 *
 * Sample the already source-verified skinned garment in its original source
 * pose, construct independently smoothed cross-sectional cloth pattern rings
 * for seat and each leg, then fit a NEW BufferGeometry onto that pattern.
 * The source garment's connected triangle topology and original 4 bone
 * influences are reused to preserve real skinning and crotch continuity.
 * Source photo JPEG, alpha, RGB, UV, pantsRest and original body untouched.
 * This is an experimental patterned cloth shell, NOT a sewing simulator,
 * independently meshed crotch, reverse photograph or full collision solver.
 */
import * as T from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';

const clamp=T.MathUtils.clamp;
const smooth=T.MathUtils.smoothstep;
const key=v=>v.toArray().map(n=>n.toFixed(5)).join(':');
const quantile=(data,q)=>{
 if(data.length<6)throw Error('No measured original clothing pattern');
 const s=data.slice().sort((a,b)=>a-b);
 return s[Math.min(s.length-1,Math.floor((s.length-1)*q))];
};
const lerp=T.MathUtils.lerp;
function stations(nodes,lower,upper,step,centerFn,name){
 const rows=[];
 for(let y=lower;y<=upper+.0001;y+=step){
  const pts=nodes.filter(n=>Math.abs(n.p.y-y)<step*1.5);
  if(pts.length<12)continue;
  const xs=pts.map(n=>n.p.x),zs=pts.map(n=>n.p.z),
   minX=quantile(xs,.045),maxX=quantile(xs,.955),
   minZ=quantile(zs,.045),maxZ=quantile(zs,.955);
  const c=centerFn(y);
  // Source-garment envelopes, not anatomical skin radius and not guessed photo.
  const cx=lerp((minX+maxX)/2,c.x,.26),
   cz=lerp((minZ+maxZ)/2,c.z,.10);
  const rx=Math.max(.050,Math.max(Math.abs(maxX-cx),Math.abs(minX-cx))),
   rz=Math.max(.045,Math.max(Math.abs(maxZ-cz),Math.abs(minZ-cz)));
  rows.push({y,cx,cz,rx,rz,sourcePixels:pts.length});
 }
 if(rows.length<8)throw Error('Insufficient original-pattern '+name+' ring samples');
 // A longitudinal cut-pattern smooths anatomy-specific glute/quad lumps
 // without flattening the complete leg into a cylinder.
 for(let it=0;it<3;it++){
  const snapshot=rows.map(r=>({...r}));
  for(let i=1;i<rows.length-1;i++){
   for(const k of ['cx','cz','rx','rz'])
    rows[i][k]=.24*snapshot[i-1][k]+.52*snapshot[i][k]+.24*snapshot[i+1][k];
  }
 }
 return rows;
}
function interpolate(rows,y){
 if(y<=rows[0].y)return rows[0];
 for(let i=1;i<rows.length;i++)if(y<=rows[i].y){
  const t=clamp((y-rows[i-1].y)/(rows[i].y-rows[i-1].y),0,1);
  return Object.fromEntries(['cx','cz','rx','rz'].map(k=>[k,lerp(rows[i-1][k],rows[i][k],t)]));
 }
 return rows.at(-1);
}
export function fitIndependentDenimLoft(pants,root,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0],src=mesh?.geometry,pos=src?.getAttribute('position'),
  rest=src?.getAttribute('pantsRest'),uv=src?.getAttribute('pantsSourceUV'),
  front=src?.getAttribute('pantsSourceFront');
 if(!mesh?.isSkinnedMesh||pants.meshes.length!==1||!mesh.userData.work60Pants||
 pants.stats?.sourceId!=='commons-public-domain-jeans-2005'||
 !pants.stats?.structuralJeansEnvelope||!pants.stats?.photoApplied||
 !pos||!rest||!uv||!front||[rest.count,uv.count,front.count].some(n=>n!==pos.count)||
 !src.getAttribute('skinIndex')||!src.getAttribute('skinWeight'))
  throw Error('Only exact verified source-photographed PR440 3D pants can use independent loft');
 const legs=pants.stats.landmarks?.map(l=>({
  hip:new T.Vector3(...l.hip),knee:new T.Vector3(...l.knee),
  ankle:new T.Vector3(...l.ankle)}));
 if(legs?.length!==2||legs.some(l=>![l.hip,l.knee,l.ankle].every(v=>v.toArray().every(Number.isFinite))||
 l.hip.y-l.knee.y<.18||l.knee.y-l.ankle.y<.18))throw Error('Exact anatomical lower-body bone landmarks required');
 mesh.updateWorldMatrix(true,false);
 const inv=mesh.matrixWorld.clone().invert(),nodes=new Map();
 for(let i=0;i<pos.count;i++){
  const p=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
  if(!p.toArray().every(Number.isFinite))throw Error('Nonfinite original source garment');
  const k=key(p);let n=nodes.get(k);
  if(!n){n={p:p.clone(),front:0,ids:[]};nodes.set(k,n);}
  n.ids.push(i);n.front=Math.max(n.front,front.getX(i));
 }
 // Separate smooth hip and left/right leg cloth-pattern envelopes. The
 // connected source topology supplies crotch join and authentic skin weights.
 const hipY=(legs[0].hip.y+legs[1].hip.y)/2,hipZ=(legs[0].hip.z+legs[1].hip.z)/2,
  {waistY,hemY}=pants.stats;
 if(!Number.isFinite(waistY)||!Number.isFinite(hemY)||waistY-hemY<.6)throw Error('Invalid pants waist/hem');
 const pelvisLow=hipY-.11,pelvisHigh=Math.min(waistY-.018,hipY+.18);
 const pelvisNodes=[...nodes.values()].filter(n=>n.p.y>=pelvisLow-.04&&n.p.y<=pelvisHigh+.04);
 const pelvis=stations(pelvisNodes,pelvisLow,pelvisHigh,.025,
  y=>new T.Vector3(0,y,hipZ),'pelvis');
 const rings=legs.map((leg,side)=>{
  const low=leg.ankle.y+.065,high=leg.hip.y-.075;
  const samples=[...nodes.values()].filter(n=>{
   const p=n.p;if(p.y<low-.035||p.y>high+.035)return false;
   const t=clamp((leg.hip.y-p.y)/(leg.hip.y-leg.knee.y),0,1);
   const center=leg.hip.clone().lerp(leg.knee,t);
   return Math.sign(p.x)===Math.sign(leg.hip.x)&&Math.abs(p.x-center.x)<.22;
  });
  return stations(samples,low,high,.025,y=>{
   const t=clamp((leg.hip.y-y)/(leg.hip.y-leg.knee.y),0,1);
   return leg.hip.clone().lerp(leg.knee,t);
  },'original leg '+side);
 });
 // This is a NEW garment geometry instance, not an in-place edit of source
 // anatomical triangles; retains source topology and all bone weights.
 const geometry=src.clone(),output=geometry.getAttribute('position');
 const nearest=bodySurface(root),pending=[];
 let proposed=0,moved=0,maxMove=0,sumMove=0,protectedFront=0,
  contactLimited=0,contactRejected=0,pelvisMoved=0,legMoved=0,
  minBefore=Infinity,minAfter=Infinity,negativeBefore=0,negativeAfter=0,
  maxFrontMotion=0;
 for(const node of nodes.values()){
  const p=node.p,y=p.y,side=p.x>=0?0:1,leg=legs[side];
  const legRing=rings[side];
  const legInfluence=smooth(y,leg.ankle.y+.075,leg.ankle.y+.165)*
   (1-smooth(y,leg.hip.y-.15,leg.hip.y-.045));
  const pelvisInfluence=smooth(y,pelvisLow+.005,pelvisLow+.085)*
   (1-smooth(y,pelvisHigh-.08,pelvisHigh+.008));
  if(Math.max(legInfluence,pelvisInfluence)<.03)continue;
  const legProfile=interpolate(legRing,y),pelProfile=interpolate(pelvis,y);
  const w=pelvisInfluence/(pelvisInfluence+legInfluence+1e-8),
   e=Object.fromEntries(['cx','cz','rx','rz'].map(k=>[k,lerp(legProfile[k],pelProfile[k],w)]));
  const u=(p.x-e.cx)/e.rx,v=(p.z-e.cz)/e.rz,r=Math.hypot(u,v);
  if(r<.35||!Number.isFinite(r))continue;
  const target=new T.Vector3(e.cx+(p.x-e.cx)/r,y,e.cz+(p.z-e.cz)/r);
  // Source-photographed front remains untouched. The largest modification
  // is toward the photographed jean's UNPHOTOGRAPHED posterior profile.
  const back=1-smooth(node.front,.015,.53);
  const intensity=back*Math.max(legInfluence,pelvisInfluence)*.94;
  if(intensity<.025){protectedFront++;continue;}
  let delta=target.sub(p).multiplyScalar(intensity);
  const length=delta.length();
  if(length<.00015)continue;
  proposed++;
  if(length>.055)delta.setLength(.055);
  const hit=nearest(p);
  if(!hit||![...hit.point.toArray(),...hit.normal.toArray()].every(Number.isFinite))
   throw Error('Original anatomical nearest-triangle unavailable');
  const before=p.clone().sub(hit.point).dot(hit.normal);
  if(!Number.isFinite(before))throw Error('Original cloth/source-body gap invalid');
  // Preserve the *same* original surface-oriented gap. A negative legacy
  // male sample must not become more negative because of this research.
  const afterPredicted=before+delta.dot(hit.normal),floor=before-.0004;
  if(afterPredicted<floor){
   delta.addScaledVector(hit.normal,floor-afterPredicted);
   contactLimited++;
  }
  if(delta.length()>.055)delta.setLength(.055);
  const q=p.clone().add(delta),after=q.clone().sub(hit.point).dot(hit.normal);
  if(!Number.isFinite(after)||after<floor-.0001){contactRejected++;continue;}
  const shift=q.distanceTo(p);
  if(shift<.00015)continue;
  pending.push([node,q]);
  moved++;maxMove=Math.max(maxMove,shift);sumMove+=shift;
  minBefore=Math.min(minBefore,before);minAfter=Math.min(minAfter,after);
  if(before<0)negativeBefore++;if(after<0)negativeAfter++;
  if(pelvisInfluence>legInfluence)pelvisMoved++;else legMoved++;
  if(node.front>.65)maxFrontMotion=Math.max(maxFrontMotion,shift);
 }
 if(moved<450||maxMove<.012||maxMove>.0550001||sumMove/moved<.002)
  {geometry.dispose();throw Error('Patterned shell did not materially separate from anatomical skin '+JSON.stringify({moved,maxMove,mean:sumMove/(moved||1),proposed}));}
 for(const [n,q] of pending){
  const local=q.clone().applyMatrix4(inv);
  for(const i of n.ids)output.setXYZ(i,local.x,local.y,local.z);
 }
 output.needsUpdate=true;
 geometry.computeVertexNormals();smoothSurfaceNormals(geometry,output.count);
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 // Commit only after original arrays and independently measured new geometry
 // succeed. On rollback the previous wrapper disposes source geometry exactly.
 mesh.geometry=geometry;
 let disposed=false;
 return {meshes:pants.meshes,stats:{...pants.stats,
  independentPatternedShell:true,patternTopology:'preserved connected original crotch, independent analytic cross-section positions',
  patternSource:'licensed original photographed jeans original geometry bounds',
  patternPelvisStations:pelvis.length,patternLegStations:rings.map(a=>a.length),
  patternMovedUniqueVertices:moved,patternProposedVertices:proposed,
  patternMaxMovement:maxMove,patternMeanMovement:sumMove/moved,
  patternPelvisMoved:pelvisMoved,patternLegMoved:legMoved,
  patternContactLimited:contactLimited,patternContactRejected:contactRejected,
  patternOrientedMinBefore:minBefore,patternOrientedMinAfter:minAfter,
  patternNegativeBefore:negativeBefore,patternNegativeAfter:negativeAfter,
  patternProtectedFront:protectedFront,patternMaxFrontMotion:maxFrontMotion,
  sourcePhotoPixelsUntouched:true,sourcePhotoUVUnchanged:true,
  restBodyPhotoCoordinatesUnchanged:true,skinWeightsUnchanged:true,
  originalBodyUntouched:true,neutralPantsUntouched:true,backPhotographAvailable:false,
  signedCollisionValidated:false,fullCollisionValidated:false,
  humanVisualApproval:false,releaseAuthorized:false},
  dispose(){if(disposed)return;disposed=true;geometry.dispose();pants.dispose();}
 };
}
