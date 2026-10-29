/** 3D-36 (HOLD): source-derived rear-seat / connected crotch saddle drape.
 *
 * The 3D35 independent loft retains an anatomical cleft along the buttock
 * centerline. This stage fits that REAR saddle to the measured left/right
 * garment side panels. It never joins leg holes with artificial triangles or
 * paints fake seams, never modifies original photograph/UV/bone weights/body.
 *
 * This is a fabric-contour prototype, not sewn crotch topology, cloth physics,
 * or a watertight signed collision certification.
 */
import * as T from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=T.MathUtils.smoothstep;
const clamp=T.MathUtils.clamp;
const key=p=>p.toArray().map(v=>v.toFixed(5)).join(':');
function quantile(list,f){
 if(!list?.length)return null;
 const a=list.slice().sort((x,y)=>x-y);
 return a[Math.floor((a.length-1)*f)];
}
export function supportOriginalDenimCrotch(pants,root,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0],src=mesh?.geometry,pos=src?.getAttribute('position'),
  uv=src?.getAttribute('pantsSourceUV'),front=src?.getAttribute('pantsSourceFront'),
  rest=src?.getAttribute('pantsRest'),
  skin=src?.getAttribute('skinWeight'),index=src?.getAttribute('skinIndex');
 if(!mesh?.isSkinnedMesh||pants.meshes?.length!==1||!mesh.userData.work60Pants||
 !pants.stats?.independentPatternedShell||!pants.stats?.photoApplied||
 pants.stats?.sourceId!=='commons-public-domain-jeans-2005'||
 !pos||!uv||!front||!rest||!skin||!index||
 [uv.count,front.count,rest.count,skin.count,index.count].some(v=>v!==pos.count))
  throw Error('Original source-verified independent jeans shell required for crotch panel prototype');
 const legs=pants.stats.landmarks?.map(l=>({
  hip:new T.Vector3(...l.hip),knee:new T.Vector3(...l.knee),ankle:new T.Vector3(...l.ankle)}));
 if(legs?.length!==2||legs.some(l=>![l.hip,l.knee,l.ankle].every(v=>v.toArray().every(Number.isFinite))||
 l.hip.y<=l.knee.y+.18||l.knee.y<=l.ankle.y+.16))
  throw Error('Original lower-body anatomy missing');
 mesh.updateWorldMatrix(true,false);
 const inv=mesh.matrixWorld.clone().invert(),nodes=new Map(),hipY=(legs[0].hip.y+legs[1].hip.y)/2;
 for(let i=0;i<pos.count;i++){
  const p=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
  if(!p.toArray().every(Number.isFinite))throw Error('Nonfinite original garment geometry');
  let n=nodes.get(key(p));
  if(!n){n={p:p.clone(),ids:[],front:0};nodes.set(key(p),n);}
  n.ids.push(i);n.front=Math.max(n.front,front.getX(i));
 }
 const y0=hipY-.245,y1=hipY+.008,step=.018,
  rows=[];
 // Measured left- and right-rear cloth points provide TWO actual flank
 // envelope anchors per row, not guessed body measurements.
 const all=[...nodes.values()];
 for(let y=y0;y<y1+.00001;y+=step){
  const strip=all.filter(n=>Math.abs(n.p.y-y)<.027&&n.front<.18&&
   Math.abs(n.p.x)>.065&&Math.abs(n.p.x)<.175);
  const left=strip.filter(n=>n.p.x<0).map(n=>n.p.z),
        right=strip.filter(n=>n.p.x>0).map(n=>n.p.z);
  if(left.length<8||right.length<8)continue;
  // Robust original-cloth rear samples rather than one extreme seam spike.
  const l=quantile(left,.17),r=quantile(right,.17);
  if(!Number.isFinite(l)||!Number.isFinite(r))continue;
  rows.push({y,left:l,right:r,center:(l+r)*.5,imbalance:Math.abs(l-r),n:left.length+right.length});
 }
 if(rows.length<7)throw Error('Unable to fit actual left/right photographed crotch cloth panels');
 // Continuously fair each original-material pattern around the seat: three
 // short longitudinal passes, keeping actual left-right asymmetry.
 for(let k=0;k<3;k++){
  const old=rows.map(r=>r.center);
  for(let j=1;j<rows.length-1;j++)
   rows[j].center=old[j]*.64+(old[j-1]+old[j+1])*.18;
 }
 const sample=y=>{
  if(y<=rows[0].y)return rows[0];
  for(let i=1;i<rows.length;i++)if(y<=rows[i].y){
   const a=rows[i-1],b=rows[i],t=clamp((y-a.y)/(b.y-a.y),0,1);
   return {center:T.MathUtils.lerp(a.center,b.center,t),left:T.MathUtils.lerp(a.left,b.left,t),right:T.MathUtils.lerp(a.right,b.right,t)};
  }
  return rows.at(-1);
 };
 const nearest=bodySurface(root),pending=[];
 let moved=0,sumMove=0,maxMove=0,centerline=0,leftPanel=0,rightPanel=0,
  limited=0,rejected=0,minBefore=Infinity,minAfter=Infinity,
  negativeBefore=0,negativeAfter=0,maxProtectedFrontMotion=0,eligible=0;
 for(const n of all){
  const p=n.p,absx=Math.abs(p.x);
  if(p.y<y0||p.y>y1||absx>.125||n.front>=.38)continue;
  const row=sample(p.y);
  const vertical=smooth(p.y,y0,y0+.055)*(1-smooth(p.y,y1-.085,y1-.003));
  const radial=1-smooth(absx,.035,.125);
  // Apply only on original backside; preserve real photographed front.
  const rear=1-smooth(n.front,.06,.35);
  const influence=vertical*radial*rear;
  if(influence<.025)continue;
  eligible++;
  // Position a hanging rear seat saddle near independently measured rear
  // left/right panels. No attempt to connect two leg openings in midair.
  const target=row.center+.007;
  const deficit=p.z-target;
  // Only soften the concave inward notch. Never inflate an outer seat lobe.
  if(deficit<=.001)continue;
  const dz=-Math.min(.034,deficit*.77)*influence;
  if(dz>=-.00012)continue;
  const hit=nearest(p);
  if(!hit||![...hit.point.toArray(),...hit.normal.toArray()].every(Number.isFinite))
   throw Error('Original CC0 body-triangle probe unavailable for crotch contour');
  const before=p.clone().sub(hit.point).dot(hit.normal);
  if(!Number.isFinite(before))throw Error('Original body oriented sample invalid');
  // Refuse to deepen preexisting negative oriented male contact samples.
  let delta=new T.Vector3(0,0,dz);
  const predicted=before+delta.dot(hit.normal),floor=before-.0004;
  if(predicted<floor){
   delta.addScaledVector(hit.normal,floor-predicted);
   limited++;
  }
  if(delta.length()>.034)delta.setLength(.034);
  const q=p.clone().add(delta);
  const after=q.clone().sub(hit.point).dot(hit.normal);
  if(!Number.isFinite(after)||after<floor-.0001){rejected++;continue;}
  const d=q.distanceTo(p);
  if(d<.0001)continue;
  pending.push([n,q]);moved++;sumMove+=d;maxMove=Math.max(maxMove,d);
  minBefore=Math.min(minBefore,before);minAfter=Math.min(minAfter,after);
  if(before<0)negativeBefore++;if(after<0)negativeAfter++;
  if(absx<.035)centerline++;
  else if(p.x<0)leftPanel++;
  else rightPanel++;
  if(n.front>.6)maxProtectedFrontMotion=Math.max(maxProtectedFrontMotion,d);
 }
 if(moved<35||maxMove<.003||maxMove>.034001||sumMove/moved<.001){
  throw Error('Rear saddle panel cannot be verified as a meaningful, bounded change '+JSON.stringify({moved,maxMove,eligible,rows:rows.length}));
 }
 // Clone once *after* validation, then write only geometry positions on the
 // new research garment instance. The old source mesh and original photos
 // remain available to the controller until a successful commit.
 const geometry=src.clone(),output=geometry.getAttribute('position');
 for(const [n,q] of pending){
  const local=q.clone().applyMatrix4(inv);
  for(const i of n.ids)output.setXYZ(i,local.x,local.y,local.z);
 }
 output.needsUpdate=true;geometry.computeVertexNormals();smoothSurfaceNormals(geometry,output.count);
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 mesh.geometry=geometry;
 let disposed=false;
 return {meshes:pants.meshes,stats:{...pants.stats,
  originalCrotchSaddle:true,crotchPattern:'source-measured connected rear-seat side-panel fairing, original crotch topology retained',
  crotchPanelRows:rows.length,crotchEligibleVertices:eligible,
  crotchMovedUniqueVertices:moved,crotchMeanMovement:sumMove/moved,
  crotchMaxMovement:maxMove,crotchCenterVertices:centerline,
  crotchLeftVertices:leftPanel,crotchRightVertices:rightPanel,
  crotchContactLimited:limited,crotchContactRejected:rejected,
  crotchOrientedMinBefore:minBefore,crotchOrientedMinAfter:minAfter,
  crotchNegativeBefore:negativeBefore,crotchNegativeAfter:negativeAfter,
  crotchMaxProtectedFrontMotion:maxProtectedFrontMotion,
  crotchSourcePhotoUntouched:true,crotchOriginalUVUntouched:true,
  crotchSkinWeightsUnchanged:true,crotchOriginalBodyUntouched:true,
  crotchFullSignedCollision:false,fullCollisionValidated:false,
  humanVisualApproval:false,releaseAuthorized:false},
  dispose(){if(disposed)return;disposed=true;geometry.dispose();pants.dispose();}
 };
}
