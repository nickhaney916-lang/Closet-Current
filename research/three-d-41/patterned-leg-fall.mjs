/** 3D41: source-measured independent rear/lower trouser-leg fall, DRAFT HOLD.
 * The original photographed front is immutable. The rear has NO photograph:
 * this is neutral source-informed fabric geometry, not sewn construction,
 * cloth dynamics, or signed collision certification.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
const clamp=T.MathUtils.clamp, smooth=T.MathUtils.smoothstep;
const quant=(array,f)=>{if(array.length<8)throw Error('Insufficient licensed source geometry');const a=array.slice().sort((x,y)=>x-y);return a[Math.floor((a.length-1)*f)];};
const key=p=>p.toArray().map(x=>x.toFixed(5)).join(':');
function at(rows,y,k){
 if(y<=rows[0].y)return rows[0][k];
 for(let j=1;j<rows.length;j++)if(y<=rows[j].y){
  const a=rows[j-1],b=rows[j],t=clamp((y-a.y)/(b.y-a.y),0,1);
  return T.MathUtils.lerp(a[k],b[k],t);
 }
 return rows[rows.length-1][k];
}
export function fallSourceMeasuredJeansLegPanels(pants,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0];
 if(!mesh?.isSkinnedMesh||pants.meshes.length!==1||
  !pants.stats?.originalPhotographedHangingLegPanels||
  !pants.stats?.independentPatternedShell||!pants.stats?.photoApplied||
  !isSourceVerifiedDenimId(pants.stats.sourceId))throw Error('3D41 requires originally verified 3D40 photographed trouser shell');
 mesh.updateWorldMatrix(true,false);
 const original=mesh.geometry,positions=original.getAttribute('position');
 const names=['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
 if(!positions||names.some(n=>original.getAttribute(n)?.count!==positions.count))throw Error('Original source and skeleton attributes absent');
 const hashes=Object.fromEntries(names.map(n=>[n,original.getAttribute(n).array.slice()]));
 const attr=original.getAttribute('pantsSourceFront'),nodes=new Map();
 for(let i=0;i<positions.count;i++){
  const p=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld),id=key(p);
  if(!nodes.has(id))nodes.set(id,{p,front:0,ids:[]});
  const entry=nodes.get(id);entry.ids.push(i);entry.front=Math.max(entry.front,attr.getX(i));
 }
 const landmarks=pants.stats.landmarks?.map(a=>({
  hip:new T.Vector3(...a.hip),knee:new T.Vector3(...a.knee),ankle:new T.Vector3(...a.ankle)}));
 if(landmarks?.length!==2||landmarks.some(l=>l.hip.y-l.knee.y<.18||l.knee.y-l.ankle.y<.18))
  throw Error('Original anatomical cloth limb landmarks missing');
 const entries=[...nodes.values()],profiles=landmarks.map(leg=>{
  const min=leg.ankle.y+.052,max=leg.hip.y-.072,rows=[];
  for(let y=min;y<max;y+=.032){
   const samples=entries.filter(n=>n.front<.30&&
    Math.sign(n.p.x)===Math.sign(leg.hip.x)&&Math.abs(n.p.y-y)<.037&&
    Math.abs(n.p.x-T.MathUtils.lerp(leg.hip.x,leg.knee.x,
      clamp((leg.hip.y-y)/(leg.hip.y-leg.knee.y),0,1)))<.205);
   if(samples.length<12)continue;
   const rear=quant(samples.map(n=>n.p.z),.065);
   const outside=quant(samples.map(n=>Math.abs(n.p.x)),.88);
   rows.push({y,rear,outside,samples:samples.length});
  }
  if(rows.length<14||!rows.some(r=>r.y<leg.knee.y-.08)||
   !rows.some(r=>r.y>leg.knee.y+.09))
   throw Error('Insufficient independently measured original source denim from ankle to hip');
  // Repeated, bounded longitudinal cloth-pattern fairing eliminates hard
  // body-contour notches without inventing separate reverse-photo pixels.
  for(let pass=0;pass<4;pass++){
   const snapshot=rows.map(r=>({...r}));
   for(let i=1;i<rows.length-1;i++)for(const k of ['rear','outside'])
    rows[i][k]=.22*snapshot[i-1][k]+.56*snapshot[i][k]+.22*snapshot[i+1][k];
  }
  return rows;
 });
 const geometry=original.clone(),out=geometry.getAttribute('position');
 const inv=mesh.matrixWorld.clone().invert(),changes=[];
 let moved=0,belowKnee=0,aboveKnee=0,sideMoved=0,maxMove=0,total=0,protectedFront=0;
 for(const n of entries){
  const p=n.p,leg=landmarks[p.x>=0?0:1],rows=profiles[p.x>=0?0:1];
  const low=rows[0].y,high=rows.at(-1).y;
  if(p.y<low||p.y>high)continue;
  if(n.front>=.36){protectedFront++;continue;}
  const span=(p.y-low)/(high-low),fade=smooth(span,0,.11)*(1-smooth(span,.86,1));
  if(fade<.03)continue;
  const sourceRear=at(rows,p.y,'rear');
  // A cloth panel hangs from the pelvis through knee to hem. Create an
  // independently continuous posterior leg envelope, instead of radial
  // inflation of the body's glute/quad/calf at each vertebral section.
  const verticalEase=.007+.016*Math.sin(Math.PI*span);
  const desiredRear=sourceRear-verticalEase;
  const rearWeight=(1-smooth(p.z-sourceRear,.025,.165))*(1-smooth(n.front,.06,.36));
  const missing=Math.max(0,p.z-desiredRear);
  const dz=-Math.min(.028,missing*.70)*rearWeight*fade;
  // Use the observed SOURCE CLOTH lateral width (not the skin's thigh
  // circumference); blend outward only at unphotographed side/rear.
  const observedOuter=at(rows,p.y,'outside');
  const sideWeight=smooth(Math.abs(p.x),Math.max(.015,observedOuter-.075),observedOuter+.008)*
   (1-smooth(n.front,.035,.28));
  const dx=Math.sign(p.x)*Math.min(.009,
   Math.max(0,observedOuter+.008-Math.abs(p.x))*.50)*sideWeight*fade;
  const distance=Math.hypot(dx,dz);
  if(distance<.00015)continue;
  const scale=Math.min(1,.0295/distance);
  changes.push({n,q:p.clone().add(new T.Vector3(dx*scale,0,dz*scale))});
  moved++;total+=distance*scale;maxMove=Math.max(maxMove,distance*scale);
  if(p.y<leg.knee.y)belowKnee++;else aboveKnee++;
  if(Math.abs(dx)>.0002)sideMoved++;
 }
 if(moved<230||belowKnee<40||aboveKnee<90||maxMove<.007||maxMove>.030||sideMoved<25)
  {geometry.dispose();throw Error('3D41 source-informed trouser fall not substantive/bounded '+JSON.stringify({moved,belowKnee,aboveKnee,maxMove,sideMoved}));}
 for(const {n,q} of changes){
  const local=q.applyMatrix4(inv);
  for(const i of n.ids)out.setXYZ(i,local.x,local.y,local.z);
 }
 out.needsUpdate=true;
 geometry.computeVertexNormals();smoothSurfaceNormals(geometry,out.count);
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 for(const name of names){
  const now=geometry.getAttribute(name).array,old=hashes[name];
  if(now.length!==old.length||!now.every((v,i)=>v===old[i]))
   {geometry.dispose();throw Error('Licensed original source photograph, UV or skinning mutated: '+name);}
 }
 mesh.geometry=geometry;
 let disposed=false;
 return {...pants,stats:{...pants.stats,
  sourceMeasuredLowerLegFall:true,
  legFallMeasuredStations:profiles.map(p=>p.length),
  legFallMethod:'separate source-measured left and right rear/side longitudinal cloth envelope, no fabricated photo',
  legFallMovedVertices:moved,legFallBelowKnee:belowKnee,
  legFallAboveKnee:aboveKnee,legFallSideVertices:sideMoved,
  legFallMaxMovement:maxMove,legFallMeanMovement:total/moved,
  legFallProtectedOriginalFrontVertices:protectedFront,
  originalDenimPixelsAndUVUnchanged:true,originalPantsSkinningAndRestUnchanged:true,
  realMultiangleSourceAvailable:false,trueSewnTopology:false,
  signedCollisionValidated:false,fullCollisionValidated:false,
  humanVisualApproval:false,releaseAuthorized:false},
  dispose(){if(disposed)return;disposed=true;geometry.dispose();pants.dispose();}};
}
