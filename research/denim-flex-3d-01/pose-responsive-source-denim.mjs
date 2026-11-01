/**
 * DENIM-FLEX-3D-01 — independent source-photographed 163-bone jeans:
 * small, genuine 3D pose-responsive rear/side cloth relief around original
 * anatomical knee landmarks. Original photographed front + source JPEG, UV,
 * rest positions, and skin indices/weights must NEVER change.
 *
 * This is bounded static pose-conditioned geometry, NOT cloth physics,
 * fabricated reverse photography or swept collision certification.
 */
import * as T from 'three';
import {auditTrueSkinnedPhotographedDenimContact77} from '../three-d-77/true-skinned-denim-body-intersections.mjs';
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';

const PROTECTED=Object.freeze(['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight']);
const ANGLES=Object.freeze({'source':[0,0],'left-12':[12,0],'right-12':[0,12],'both-16':[16,16]});
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const gaussian=(d,width)=>Math.exp(-.5*(d/width)**2);
const clamp=T.MathUtils.clamp;
/** Pure, continuous envelope; zero bend MUST restore exact source geometry. */
export function sourceNeutralKneeFoldField79({heightOffset,sideOffset,angle,frontWeight,backDepth}){
 if(![heightOffset,sideOffset,angle,frontWeight,backDepth].every(finite)||
   angle<0||angle>16||frontWeight<0||frontWeight>1)
  throw Error('DENIM-FLEX original lower-leg pose and source-neutral coordinates required');
 if(frontWeight>=.08||angle===0||backDepth<0)return {dy:0,dz:0};
 const flex=angle/16;
 const across=clamp(Math.abs(sideOffset)/.26,0,1);
 const rear=clamp(backDepth/.055,0,1);
 const guard=1-T.MathUtils.smoothstep(frontWeight,.012,.08);
 const shoulder=1-T.MathUtils.smoothstep(across,.76,1);
 const upper=gaussian(heightOffset-.040,.049);
 const middle=gaussian(heightOffset+.022,.037);
 const lower=gaussian(heightOffset+.095,.050);
 const diagonal=sideOffset*.23;
 const raised=gaussian(heightOffset+diagonal-.025,.030);
 // Two physically shaped, eased ridges, not a photograph/alpha deformation.
 // One knee-compression ridge is deliberately counterbalanced by a soft
 // lower-leg release. Rear z is moved OUT from body to avoid new intersections.
 const dz=-(.0095*upper+.0068*lower+.0038*raised)*flex*rear*guard*shoulder;
 const dy=(.0032*middle-.0016*lower)*flex*rear*guard*shoulder;
 return {dy,dz};
}
function snapshot(g){
 return new Map(PROTECTED.map(name=>[name,g.getAttribute(name).array.slice()]));
}
function unchanged(g,old){
 for(const [name,bytes] of old){
  const now=g.getAttribute(name)?.array;
  if(!now||now.length!==bytes.length||
   !now.every((x,i)=>x===bytes[i]))
   throw Error('DENIM-FLEX protected source photograph/UV/rest/front/163-bone skin changed: '+name);
 }
}
function assertSource(pants,root,pose){
 const mesh=pants?.meshes?.[0],g=mesh?.geometry,p=g?.getAttribute('position');
 if(!Object.hasOwn(ANGLES,pose)||!mesh?.isSkinnedMesh||pants?.meshes?.length!==1||
  mesh.skeleton?.bones?.length!==163||!root?.isObject3D||
  !pants.stats?.realKneeArticulationAudited78||
  pants.stats.originalRigKneePose78?.pose!==pose||
  !pants.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77||
  !pants.stats?.originalPhotoUVRestFrontSkinPositionsBytePreserved77||
  pants.stats?.sourcePhotoDenimSeamContinuity76!==true||
  pants.stats?.photoApplied!==true||
  !isSourceVerifiedDenimId(pants.stats.sourceId)||
  !/^[0-9a-f]{64}$/.test(pants.stats.sourceSHA256||'')||
  !p||p.count<400||PROTECTED.some(name=>g.getAttribute(name)?.count!==p.count))
  throw Error('DENIM-FLEX requires true reviewed source-photographed 3D78 independently skinned denim, not fake geometry');
 const knees=pants.stats.landmarks?.map(v=>v.knee);
 if(knees?.length!==2||knees.some(v=>v.length!==3||!v.every(finite)))
  throw Error('DENIM-FLEX original anatomical knee landmarks missing');
 const actual=pants.stats.originalRigKneePose78.kneeJointDegrees;
 if(!Array.isArray(actual)||actual.some((v,i)=>v!==ANGLES[pose][i]))
  throw Error('DENIM-FLEX actual 163-bone knee articulation does not match expected degrees');
 return {mesh,g,p,knees,angles:actual};
}
/**
 * Alters ONLY source-neutral rear/side vertices of existing independent sewn
 * denim, after REAL 3D78 pose. Original licensed photo front untouched.
 * Do not pretend the entire object is collision free: require exact per-pose
 * 3D77 triangle audit and strictly reject NEW intersections.
 */
export function bendSourceTrueDenim79(pants,root,{pose='source',enabled=true}={}){
 if(!enabled)return pants;
 const {mesh,g,p,knees,angles}=assertSource(pants,root,pose);
 const protect=snapshot(g);
 const front=g.getAttribute('pantsSourceFront');
 const originalPosition=p.array.slice();
 if(pose==='source'){
  return {...pants,stats:{...pants.stats,denimFlexPose79:'source',
   denimFlexApplied79:false,denimFlexChangedVertices79:0,
   denimFlexRestored79:true,originalPhotoSourcePreserved79:true,
   mobilePhysicalVerified79:false,humanVisualApproved79:false,releaseAuthorized:false}};
 }
 // Verts are grouped by original sewn seam-coincident mesh positions. This
 // keeps duplicated true garment vertices together; no seam ripping.
 mesh.updateWorldMatrix(true,false);
 const world=new T.Vector3(),groups=new Map(),inv=mesh.matrixWorld.clone().invert();
 for(let i=0;i<p.count;i++){
  world.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
  const key=world.toArray().map(v=>v.toFixed(5)).join(':');
  let group=groups.get(key);
  if(!group){group={ids:[],point:world.clone(),front:0};groups.set(key,group);}
  group.ids.push(i);group.front=Math.max(group.front,front.getX(i));
 }
 // All photo-sensitive, ambiguous or unphotographed-front nodes remain
 // byte-identical in rest/render coordinates.
 const moves=[];const perLeg=[0,0];let maxShift=0,photoProtected=0;
 for(const group of groups.values()){
  if(group.front>=.08){photoProtected+=group.ids.length;continue;}
  const q=group.point,leg=q.x>=0?0:1,angle=angles[leg];
  if(!angle)continue;
  const knee=knees[leg],offset=q.y-knee[1];
  if(Math.abs(offset)>.205||Math.abs(q.x-knee[0])>.27)continue;
  const depth=knee[2]-q.z; // genuine unphotographed rear, never original source front
  const move=sourceNeutralKneeFoldField79({
   heightOffset:offset,sideOffset:q.x-knee[0],angle,
   frontWeight:group.front,backDepth:depth
  });
  if(Math.hypot(move.dy,move.dz)<.00022)continue;
  moves.push({ids:group.ids,q,move,leg});
  perLeg[leg]+=group.ids.length;
  maxShift=Math.max(maxShift,Math.hypot(move.dy,move.dz));
 }
 if(moves.length<15||maxShift<.0015||maxShift>.022||
    perLeg.some((n,i)=>angles[i]>0&&n<15))
  throw Error('DENIM-FLEX safe genuinely rear-only knee cloth region missing: '+
   JSON.stringify({nodes:moves.length,perLeg,maxShift,photoProtected}));
 // Every candidate is an authentic THREE.BufferGeometry clone, not an image.
 const geometry=g.clone(),out=geometry.getAttribute('position');
 const baseline=pants.stats.actualSkinnedDenimBodyCrossingSegments77;
 let scale=1,audit=null,final=null,changed=0,attempts=0,frontIdentical=true;
 try{
  for(attempts=1;attempts<=7;attempts++){
   out.array.set(originalPosition);
   for(const {ids,q,move} of moves){
    const next=q.clone().add(new T.Vector3(0,scale*move.dy,scale*move.dz)).applyMatrix4(inv);
    for(const i of ids)out.setXYZ(i,next.x,next.y,next.z);
   }
   out.needsUpdate=true;
   geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.computeBoundingBox();
   mesh.geometry=geometry;
   audit=auditTrueSkinnedPhotographedDenimContact77(pants,root,{pose});
   if(audit.stats.actualSkinnedDenimBodyCrossingSegments77<=baseline){final=audit;break;}
   scale*=.5;
  }
  if(!final)throw Error('DENIM-FLEX real triangle intersections increased after bounded backtracking: '+JSON.stringify({
   baseline,last:audit?.stats.actualSkinnedDenimBodyCrossingSegments77,attempts}));
  unchanged(geometry,protect);
  for(let i=0;i<out.count;i++){
   const delta=Math.hypot(out.getX(i)-originalPosition[3*i],
    out.getY(i)-originalPosition[3*i+1],out.getZ(i)-originalPosition[3*i+2]);
   if(front.getX(i)>=.08&&delta>1e-7)frontIdentical=false;
   if(delta>1e-5)changed++;
  }
  if(!frontIdentical||changed<30||maxShift*scale<.0010)
   throw Error('DENIM-FLEX genuinely moving source-neutral geometry and unchanged source front required');
  const result={...final,stats:{...final.stats,
   denimFlexPose79:pose,denimFlexApplied79:true,
   denimFlexChangedVertices79:changed,denimFlexMovedPerLeg79:perLeg,
   denimFlexMaxProposedWorldShift79:maxShift,
   denimFlexActualBoundedShift79:maxShift*scale,
   denimFlexBacktrackingAttempts79:attempts,
   denimFlexOriginalCrossings79:baseline,
   denimFlexFinalCrossings79:final.stats.actualSkinnedDenimBodyCrossingSegments77,
   denimFlexNoNewTriangleCrossings79:true,
   denimFlexFrontSourceVerticesByteIdentical79:true,
   originalPhotoSourcePreserved79:true,unphotographedReverseRemainsNeutral79:true,
   dynamicSimulationCertified79:false,sweptCollisionCertified79:false,
   mobilePhysicalVerified79:false,humanVisualApproved79:false,releaseAuthorized:false}};
  let disposed=false,restored=false;
  const restoreGeometry79=()=>{
   if(!restored){restored=true;mesh.geometry=g;geometry.dispose();}
   return pants; // original independent skinned parent remains alive for next pose
  };
  return {...result,restoreGeometry79,dispose(){if(disposed)return;disposed=true;
   restoreGeometry79();pants.dispose();}};
 }catch(e){
  mesh.geometry=g;geometry.dispose();
  throw e;
 }
}
