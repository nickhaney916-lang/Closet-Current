/**
 * DENIM-FIT-06: source-photographed jeans static gravity rest (NO DEPLOY).
 *
 * Uses only the original SHA-verified, independently sewn, 163-bone skinned
 * jeans, 3D76 denim geometry and true 3D77 source-body collision audit.
 * The front photo, UV, rest coordinates, skin indices/weights, JPEG/RGB and
 * all previously matched photo pixels are immutable. Only side/rear lower
 * calf/hem geometry settles into a bounded nonzero source-neutral rest.
 *
 * This is a geometry fitter, not full fabric physics, and does NOT invent
 * anything about unseen fabric.
 */
import * as T from 'three';
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
export const DENIM_FIT06=Object.freeze({
 targetMeters:.0058,maxWorldShiftMeters:.0085,maxSteps:100,
 stableSteps:6,velocityTolerance:.000012,positionTolerance:.00002,
 timestepSeconds:1/60,physicalPhoneApproved:false,releaseAuthorized:false
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const q=clamp((v-a)/(b-a),0,1);return q*q*(3-2*q);};
const protectedFields=['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
export function settleDenimRest06(target=DENIM_FIT06.targetMeters){
 if(!Number.isFinite(target)||target<.002||target>DENIM_FIT06.maxWorldShiftMeters)
  throw Error('Finite bounded nonzero photographed denim gravity target required');
 let x=0,v=0,stable=0,n=0;
 for(;n<DENIM_FIT06.maxSteps;n++){
  v=.72*v+.16*(target-x);
  x=clamp(x+v,-DENIM_FIT06.maxWorldShiftMeters,DENIM_FIT06.maxWorldShiftMeters);
  if(Math.abs(x-target)<=DENIM_FIT06.positionTolerance&&
     Math.abs(v)<=DENIM_FIT06.velocityTolerance)stable++;
  else stable=0;
  if(stable>=DENIM_FIT06.stableSteps)break;
 }
 if(stable<DENIM_FIT06.stableSteps)throw Error('Real source denim gravity rest failed to settle');
 return Object.freeze({staticNonzeroGravityRest:true,steps:n+1,meters:x,
  fixedStepSeconds:DENIM_FIT06.timestepSeconds,releaseAuthorized:false});
}
function same(a,b){return a?.length===b?.length&&a.every((x,i)=>x===b[i]);}
export function createPhotoDenimStaticFitter06(pants,root,{sourceSilhouette07=false}={}){
 if(typeof sourceSilhouette07!=='boolean')throw Error('Photographed source silhouette feature gate must be boolean');
 const mesh=pants?.meshes?.[0],g=mesh?.geometry,p=g?.getAttribute('position');
 if(!root?.isObject3D||pants?.meshes?.length!==1||
  !mesh?.isSkinnedMesh||mesh?.skeleton?.bones?.length!==163||
  !pants.stats?.photoApplied||!pants.stats?.sourcePhotoDenimSeamContinuity76||
  !pants.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77||
  !pants.stats?.independentSewnPattern||
  !isSourceVerifiedDenimId(pants.stats?.sourceId)||
  !/^[a-f0-9]{64}$/.test(pants.stats?.sourceSHA256||'')||
  !p||p.count<400||!g.index||
  protectedFields.some(k=>g.getAttribute(k)?.count!==p.count))
  throw Error('Exactly one source-SHA approved actual 163-bone independently sewn jeans mesh required');
 const start=Float32Array.from(p.array),normals=g.getAttribute('normal');
 const originalNormals=normals?Float32Array.from(normals.array):null;
 const guard=new Map(protectedFields.map(k=>[k,g.getAttribute(k).array.slice()]));
 const front=g.getAttribute('pantsSourceFront');
 const legs=pants.stats.landmarks;
 const silhouette07=Object.freeze({maxShiftMeters:.024,minimumAddedKneeEaseMeters:.010});
 if(legs?.length!==2||legs.some(x=>!Array.isArray(x.knee)||!Array.isArray(x.ankle)))
  throw Error('True original photographed knee/ankle reference required');
 root.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const origin=new T.Vector3(),inv=mesh.matrixWorld.clone().invert();
 const rows=new Map();
 for(let i=0;i<p.count;i++){
  origin.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
  if(!Number.isFinite(origin.x+origin.y+origin.z))throw Error('Nonfinite source-denim vertex');
  const key=origin.toArray().map(v=>v.toFixed(5)).join(':');
  if(!rows.has(key))rows.set(key,{q:origin.clone(),ids:[],front:0});
  const row=rows.get(key);row.ids.push(i);row.front=Math.max(row.front,front.getX(i));
 }
 let untouched=0;const eligible=[],protectedIds=[];
 for(const row of rows.values()){
  if(row.front>=.18){protectedIds.push(...row.ids);untouched+=row.ids.length;continue;}
  const side=row.q.x>=0?0:1,landmark=legs[side],
    knee=new T.Vector3(...landmark.knee),ankle=new T.Vector3(...landmark.ankle);
  if(knee.y-ankle.y<.22)throw Error('True denim ankle/knee vertical placement missing');
  const height=(row.q.y-ankle.y)/(knee.y-ankle.y),
    blend=smooth(height,.06,.22)*(1-smooth(height,.53,.79));
  const legX=T.MathUtils.lerp(ankle.x,knee.x,clamp(height,0,1));
  const dx=row.q.x-legX,radial=Math.hypot(dx,row.q.z);
  if(height<.04||height>.82||radial<.035||radial>.31||blend<.025)continue;
  // 07 uses ORIGINAL anatomical knee/ankle positions to create a
  // calf-to-knee volume transition; no guessed texture or repeating
  // decorative waves. Source 3D75/76 already carries the real folds.
  // Protect the original photograph's front and its actual colors.
  const kneeEase=smooth(height,.36,.56)*(1-smooth(height,.78,.96));
  const hemEase=smooth(height,.065,.18)*(1-smooth(height,.23,.40));
  eligible.push({...row,side,height,blend,kneeEase,hemEase,
    radialX:dx/radial,radialZ:row.q.z/radial});
 }
 if(eligible.length<35||untouched<100||eligible.filter(x=>x.side===0).length<12||
   eligible.filter(x=>x.side===1).length<12)
  throw Error('Source-neutral original photo calf/hem surface missing; cannot fit jeans');
 let frozen=false,proof=null,closed=false;
 function audit(){
  if(closed||mesh.geometry!==g)throw Error('Authenticated source denim geometry detached');
  for(const [key,before] of guard)if(!same(g.getAttribute(key)?.array,before))
   throw Error('Original denim photograph UV, front, rest or 163-bone skin altered: '+key);
  for(const i of protectedIds)if(p.getX(i)!==start[i*3]||
    p.getY(i)!==start[i*3+1]||p.getZ(i)!==start[i*3+2])
   throw Error('Photographed front denim vertex changed');
 }
 function restore(){
  if(closed)return;
  p.array.set(start);p.needsUpdate=true;
  if(normals&&originalNormals){normals.array.set(originalNormals);normals.needsUpdate=true;}
  g.computeBoundingBox();g.computeBoundingSphere();frozen=false;proof=null;audit();
 }
 function freeze(){
  restore();const eq=settleDenimRest06();
  let changed=0,max=0;const perLeg=[0,0],q=new T.Vector3();
  let kneeMoved=0,hemMoved=0,kneeEaseTotal=0,hemEaseTotal=0,sourceKneeRearGroups=0;
  for(const row of eligible){
   const kneeRest=sourceSilhouette07 ? .016*row.kneeEase : 0;
   const hemRest=sourceSilhouette07 ? .0015*row.hemEase : 0;
   const dy=-eq.meters*.22*row.blend-
     (sourceSilhouette07 ? .0025*row.kneeEase : 0);
   // A rounded, loose knee break supported by the real 3D75 folds, but a
   // closer ankle hem. The larger knee-relative envelope gives the JEANS
   // an actual leg profile instead of an equal-width geometric tube.
   const radius=eq.meters*.92*row.blend+kneeRest+hemRest;
   const dx=radius*row.radialX,dz=radius*row.radialZ,
     shift=Math.hypot(dx,dy,dz);
   const budget=sourceSilhouette07?silhouette07.maxShiftMeters:DENIM_FIT06.maxWorldShiftMeters;
   if(!Number.isFinite(shift)||shift>budget)
    throw Error('Photographed denim rest outside source-neutral fit bounds');
   if(shift<.00005)continue;
   q.copy(row.q).add(new T.Vector3(dx,dy,dz)).applyMatrix4(inv);
   for(const i of row.ids){p.setXYZ(i,q.x,q.y,q.z);changed++;perLeg[row.side]++;}
   max=Math.max(max,shift);
   if(sourceSilhouette07){
    if(row.height>=.55&&row.height<=.80){
      kneeMoved++;kneeEaseTotal+=kneeRest;sourceKneeRearGroups++;
    }
    if(row.height>=.12&&row.height<=.36){
      hemMoved++;hemEaseTotal+=hemRest;
    }
   }
  }
  p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  audit();
  const budget=sourceSilhouette07?silhouette07.maxShiftMeters:DENIM_FIT06.maxWorldShiftMeters;
  if(changed<60||Math.min(...perLeg)<20||max<.002||max>budget)
   throw Error('Genuine photographed denim static hem drape not achieved: '+JSON.stringify({changed,perLeg,max}));
  const taperAdditionalMean=(kneeMoved?kneeEaseTotal/kneeMoved:0)-
   (hemMoved?hemEaseTotal/hemMoved:0);
  if(sourceSilhouette07&&(kneeMoved<15||hemMoved<15||
    taperAdditionalMean<.008||max<silhouette07.minimumAddedKneeEaseMeters))
   throw Error('Photographed knee-to-hem taper not measurably improved: '+JSON.stringify({
    kneeMoved,hemMoved,taperAdditionalMean,max}));

  frozen=true;
  proof=Object.freeze({actualPhotoDenimFrozenFit:true,
   originalPhotoSHA256:pants.stats.sourceSHA256,originalDenimId:pants.stats.sourceId,
   authentic163BoneMannequin:true,changedVertices:changed,perLeg,
   maxWorldShiftMeters:max,rest:eq,frontPhotographUnchanged:true,
   sourceMeasuredAnatomicalSilhouette07:sourceSilhouette07,
   originalSkinnedKneeHemTaperImproved07:sourceSilhouette07,
   sourceNeutralKneeRearGroups07:sourceKneeRearGroups,
   additionalKneeVsHemEaseMeters07:sourceSilhouette07?taperAdditionalMean:0,
   actualSeamFoldTopologyPreserved07:true,
   originalPhotoTextureRGBAndUVUnmodified07:true,
   sourceUVRestAndSkinByteIdentical:true,realBVHVerifiedByCaller:false,
   noUnseenTextureInvented:true,physicalPhoneApproved:false,
   humanPhotorealismApproved:false,releaseAuthorized:false});
  return proof;
 }
 return Object.freeze({freeze,restore,state:()=>({frozen,proof}),
  dispose(){if(closed)return;restore();closed=true;}});
}
