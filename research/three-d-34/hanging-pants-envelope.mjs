/** 3D34 — continuous seat-to-knee trouser envelope, research only.
 * The original Work60 pants are body-derived: an anatomical buttock projection
 * survives small (3D32/33) smoothing. Here each leg's BACK outer envelope is
 * hung between actual measured seat and knee depths. We fill inward hollows
 * with at most 42mm outward drape rather than shrink the buttocks into skin.
 * NEVER rewrite source pixels, UVs, pantsRest, weights, body, or fake a back.
 * Nearest triangles are an oriented source-pose probe, NOT signed collision.
 */
import * as T from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const finite=v=>Number.isFinite(v);
const smooth=(x,a,b)=>T.MathUtils.smoothstep(x,a,b);
const clamp=(x,a,b)=>T.MathUtils.clamp(x,a,b);
const key=p=>p.toArray().map(x=>x.toFixed(5)).join(':');
const median=a=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor(b.length/2)];};

export function hangOriginalDenimEnvelope(pants,root,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0],g=mesh?.geometry,pos=g?.getAttribute('position'),
  rest=g?.getAttribute('pantsRest'),uv=g?.getAttribute('pantsSourceUV'),
  front=g?.getAttribute('pantsSourceFront');
 if(!mesh?.isSkinnedMesh||pants.meshes.length!==1||
 !mesh.userData.work60Pants||!pants.stats?.naturalJeansDrape||
 !pants.stats?.posteriorFabricFairing||!pants.stats?.photoApplied||
 pants.stats?.sourceId!=='commons-public-domain-jeans-2005'||
 !pos||!rest||!uv||!front||
 [rest.count,uv.count,front.count].some(c=>c!==pos.count))
  throw Error('3D34 requires exact reviewed original-source jeans after natural fit and posterior fairing');
 const landmarks=pants.stats.landmarks;
 if(landmarks?.length!==2)throw Error('Actual CC0 hip knee ankle points required');
 const legs=landmarks.map(l=>({hip:new T.Vector3(...l.hip),knee:new T.Vector3(...l.knee),ankle:new T.Vector3(...l.ankle)}));
 if(legs.some(l=>![l.hip,l.knee,l.ankle].every(p=>p.toArray().every(finite))||
 !(l.hip.y-l.knee.y>.18&&l.knee.y-l.ankle.y>.17)))throw Error('Invalid original anatomy');
 mesh.updateWorldMatrix(true,false);
 const inv=mesh.matrixWorld.clone().invert(),nodes=new Map();
 for(let i=0;i<pos.count;i++){
  const p=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
  if(!p.toArray().every(finite))throw Error('Nonfinite original photographed pants position');
  const k=key(p);if(!nodes.has(k))nodes.set(k,{p,front:0,ids:[]});
  const n=nodes.get(k);n.ids.push(i);n.front=Math.max(n.front,front.getX(i));
 }
 // Rear envelope is built separately for each original leg. Use existing
 // photographed pants geometry, not manually guessed clothing dimensions.
 const rows=[[],[]],dy=.022;
 for(const n of nodes.values()){
  if(n.front>.40)continue;
  const p=n.p,side=p.x>=0?0:1,leg=legs[side];
  const t=clamp((leg.hip.y-p.y)/(leg.hip.y-leg.knee.y),0,1);
  const cx=T.MathUtils.lerp(leg.hip.x,leg.knee.x,t);
  if(Math.abs(p.x-cx)>.205||p.y<leg.knee.y-.02||p.y>leg.hip.y+.02)continue;
  rows[side].push(n);
 }
 const profiles=rows.map((list,side)=>{
  const l=legs[side],start=l.knee.y+.035,end=l.hip.y-.065;
  if(end-start<.24||list.length<350)throw Error('Original leg posterior profile unavailable');
  const slices=[];
  for(let y=start;y<=end+.00001;y+=dy){
   const z=list.filter(n=>Math.abs(n.p.y-y)<.035).map(n=>n.p.z).sort((a,b)=>a-b);
   if(z.length<5)continue;
   // A robust rear extremum (5th percentile) avoids an unrelated seam spike.
   slices.push({y,z:z[Math.floor(z.length*.05)],samples:z.length});
  }
  if(slices.length<10)throw Error('Continuous rear pants profile is required');
  const lower=slices.filter(s=>s.y<start+.075).map(s=>s.z);
  const upper=slices.filter(s=>s.y>end-.085).map(s=>s.z);
  if(lower.length<2||upper.length<2)throw Error('Seat and knee rear depth anchors required');
  const kneeZ=median(lower),seatZ=median(upper);
  const sliceAt=y=>slices.reduce((best,s)=>Math.abs(s.y-y)<Math.abs(best.y-y)?s:best,slices[0]);
  return {start,end,kneeZ,seatZ,slices,sliceAt,
   targetAt:y=>{
    const t=clamp((y-start)/(end-start),0,1);
    // Line of hanging cloth rather than a buttock-shaped radial envelope.
    // Source-derived seat/knee endpoints; 4mm intentional middle ease.
    return T.MathUtils.lerp(kneeZ,seatZ,t)-.004*Math.sin(Math.PI*t);
   }};
 });
 const nearest=bodySurface(root);
 let moved=0,maxMove=0,sumMove=0,changedSeat=0,changedThigh=0,
  changedLower=0,protectedFront=0,limited=0,rejected=0,negativeBefore=0,negativeAfter=0,
  minBefore=Infinity,minAfter=Infinity,sumDeficit=0,sumRecovered=0;
 for(const n of nodes.values()){
  if(n.front>.34){protectedFront++;continue;}
  const o=n.p,side=o.x>=0?0:1,profile=profiles[side],leg=legs[side];
  if(o.y<profile.start||o.y>profile.end)continue;
  const t=clamp((o.y-profile.start)/(profile.end-profile.start),0,1);
  const fade=smooth(t,0,.16)*(1-smooth(t,.80,1));
  if(fade<.01)continue;
  const rear=profile.sliceAt(o.y).z,goal=profile.targetAt(o.y);
  const deficit=rear-goal;
  if(deficit<=.001)continue;
  // Only back and posterior-side points follow new pants hanging plane.
  // The frontal photographed texture and front-to-side seam stay fixed.
  const behind=1-smooth(o.z-rear,.018,.165);
  const behindUV=1-smooth(n.front,.08,.34);
  const influence=fade*behind*behindUV;
  if(influence<.02)continue;
  const dz=-Math.min(.042,deficit*.86)*influence;
  if(Math.abs(dz)<.0001)continue;
  const hit=nearest(o);
  if(!hit||![...hit.point.toArray(),...hit.normal.toArray()].every(finite))throw Error('Original body triangle unavailable');
  const gap=o.clone().sub(hit.point).dot(hit.normal);
  const afterGap=gap+dz*hit.normal.z;
  if(!finite(gap)||!finite(afterGap))throw Error('Invalid original body contact');
  let safeDz=dz;
  // Preserve existing negative male closest-body oriented samples: never
  // deepen them or manufacture a signed contact PASS.
  const allowed=Math.min(gap,.006)-.0004;
  if(afterGap<allowed&&hit.normal.z>0){
   safeDz=clamp((allowed-gap)/hit.normal.z,dz,0);limited++;
  }else if(afterGap<allowed){limited++;safeDz=0;}
  if(safeDz===0){rejected++;continue;}
  const q=o.clone();q.z+=safeDz;
  const checked=q.clone().sub(hit.point).dot(hit.normal);
  if(!finite(checked)||checked<gap-.0005){rejected++;continue;}
  const movement=q.distanceTo(o);
  if(!finite(movement)||movement>.0420001)throw Error('Garment movement not bounded');
  if(movement<.0001)continue;
  n.next=q;
  moved++;sumMove+=movement;maxMove=Math.max(maxMove,movement);
  minBefore=Math.min(minBefore,gap);minAfter=Math.min(minAfter,checked);
  if(gap<0)negativeBefore++;if(checked<0)negativeAfter++;
  sumDeficit+=deficit;sumRecovered+=movement;
  if(t>.64)changedSeat++;else if(t>.31)changedThigh++;else changedLower++;
 }
 if(moved<240||maxMove<.009||maxMove>.0420001)
  throw Error('Anatomical hanging envelope is not material / bounded '+JSON.stringify({moved,maxMove,profiles:profiles.map(p=>({seat:p.seatZ,knee:p.kneeZ}))}));
 for(const n of nodes.values())if(n.next){
  const p=n.next.clone().applyMatrix4(inv);
  for(const i of n.ids)pos.setXYZ(i,p.x,p.y,p.z);
 }
 pos.needsUpdate=true;g.computeVertexNormals();
 smoothSurfaceNormals(g,pos.count);
 g.computeBoundingBox();g.computeBoundingSphere();
 return {...pants,stats:{...pants.stats,structuralJeansEnvelope:true,
  structuralMovedUniqueVertices:moved,structuralMaxMovement:maxMove,
  structuralMeanMovement:sumMove/moved,structuralSeatVertices:changedSeat,
  structuralThighVertices:changedThigh,structuralLowerThighVertices:changedLower,
  structuralContactLimited:limited,structuralContactRejected:rejected,
  structuralProbeMinBefore:minBefore,structuralProbeMinAfter:minAfter,
  structuralNegativeBefore:negativeBefore,structuralNegativeAfter:negativeAfter,
  structuralSourceDeficit:sumDeficit/moved,structuralSourceRecovered:sumRecovered/moved,
  structuralProfiles:profiles.map(p=>({kneeY:p.start,seatY:p.end,
   originalKneeBackZ:p.kneeZ,originalSeatBackZ:p.seatZ,originalMeasuredSlices:p.slices.length})),
  originalSourceRGBUnchanged:true,originalSourceUVUnchanged:true,
  originalPantsRestUnchanged:true,originalBodyUntouched:true,
  rearSource:'none — source-derived neutral',fullCollisionValidated:false,
  humanVisualApproval:false,releaseAuthorized:false,
  structuralMethod:'measured seat-to-knee rear envelope, body-normal-bounded outward hanging 42mm max'}}; 
}
