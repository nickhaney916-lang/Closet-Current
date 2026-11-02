/**
 * SHIRT-FIT-10: source-faithful gravity equilibrium for a STATIC photographed
 * garment. The damped rest solver is deliberately small and deterministic:
 * it finds a non-zero equilibrium displacement instead of decaying to zero
 * and merely freezing the old fitted pose.
 *
 * The 3D projection uses original true 163-bone-skinned vertices, not a new
 * garment photo, invented back or stylized fabric normal map. New position
 * must pass a full posed BVH garment/body check before the caller freezes it.
 * Research only, no default app integration.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
export const GRAVITY_REST10=Object.freeze({
  targetMeters:.0075,maxMeters:.0100,
  fixedStepSeconds:1/60,maxSteps:90,
  velocityTolerance:.000012,positionTolerance:.000025,
  stableFrames:6,releaseAuthorized:false,physicalPhoneApproved:false
});
export function settleGravityTarget10({targetMeters=GRAVITY_REST10.targetMeters}={}){
 if(!Number.isFinite(targetMeters)||targetMeters<.002||targetMeters>GRAVITY_REST10.maxMeters)
  throw Error('Original photo gravity fit must have bounded nonzero target');
 let position=0,velocity=0,steady=0,count=0,peak=0;
 for(let i=0;i<GRAVITY_REST10.maxSteps;i++){
  const force=(targetMeters-position)*.18;
  velocity=.70*velocity+force;
  position=Math.max(-GRAVITY_REST10.maxMeters,Math.min(GRAVITY_REST10.maxMeters,position+velocity));
  peak=Math.max(peak,Math.abs(position));count++;
  if(Math.abs(position-targetMeters)<=GRAVITY_REST10.positionTolerance&&
     Math.abs(velocity)<=GRAVITY_REST10.velocityTolerance)steady++;
  else steady=0;
  if(steady>=GRAVITY_REST10.stableFrames)break;
 }
 if(steady<GRAVITY_REST10.stableFrames)throw Error('Gravity drape failed to reach bounded nonzero equilibrium');
 return Object.freeze({worldEquilibriumMeters:position,targetMeters,iterations:count,
  maxTransientMeters:peak,steadyFrames:steady,
  fixedStepSeconds:GRAVITY_REST10.fixedStepSeconds,
  nonzeroGravityEquilibrium:true,
  originalPhotoPreserved:true,releaseAuthorized:false});
}
const sourceKeys=['panelPosition','panelNormal','uv','skinIndex','skinWeight'];
function inverseSkin(mesh,i){
 const matrix=new T.Matrix4();matrix.elements.fill(0);
 const a=mesh.geometry;
 for(let k=0;k<4;k++){
  const bone=a.attributes.skinIndex.getComponent(i,k),
   weight=a.attributes.skinWeight.getComponent(i,k);
  const b=new T.Matrix4().multiplyMatrices(mesh.skeleton.bones[bone].matrixWorld,
   mesh.skeleton.boneInverses[bone]);
  for(let j=0;j<16;j++)matrix.elements[j]+=b.elements[j]*weight;
 }
 return matrix.premultiply(mesh.bindMatrixInverse).multiply(mesh.bindMatrix).invert();
}
function audit(mesh,snapshot){
 for(const [key,old] of snapshot){
  const next=mesh.geometry.getAttribute(key)?.array;
  if(!old){if(next)throw Error('Original garment invented optional source field '+key);}
  else if(!next||next.length!==old.length||old.some((x,i)=>x!==next[i]))
   throw Error('Original source photograph/panel and 163-bone skin changed: '+key);
 }
}
export function applyPhotographedGravityRest10(root,shirt,{equilibrium=settleGravityTarget10()}={}){
 if(!equilibrium.nonzeroGravityEquilibrium||
    !shirt?.stats?.sourceHemSwing08?.realOriginalSourcePhotographedHemSwing)
  throw Error('Requires original genuine source-photographed F08 shirt fitting');
 const bones=[],shells=shirt.meshes.filter(m=>m.isSkinnedMesh&&m.name==='Work56-independent-shirt-shell');
 root.traverse(o=>{if(o.isBone)bones.push(o);});
 if(bones.length!==163||shells.length<2)throw Error('Real 163-bone independent source shirt required');
 root.updateMatrixWorld(true);
 const bone=name=>bones.find(b=>b.name===name)?.getWorldPosition(new T.Vector3());
 const left=bone('upperarm01L'),right=bone('upperarm01R');
 if(!left||!right)throw Error('Anatomical shoulder anchors unavailable');
 const center=(left.x+right.x)/2,shoulderY=(left.y+right.y)/2,back=(left.z+right.z)/2;
 const hem=shirt.stats.sourceWeightedFolds07?.observedSourceHemDy?.[0];
 if(!Number.isFinite(hem)||hem>=-.26||hem<-.98)
  throw Error('Source photographed measured hem unavailable');
 const smooth=T.MathUtils.smoothstep;
 const offset=equilibrium.worldEquilibriumMeters;
 let verticesMoved=0,hemVertices=0,maxWorldOffset=0,frontSourceFieldsIntact=true;
 const sides={L:0,R:0},components=[];
 for(const mesh of shells){
  const geo=mesh.geometry,p=geo.getAttribute('position');
  if(!p||!geo.index||!geo.getAttribute('panelPosition')||!geo.getAttribute('panelNormal'))
   throw Error('Original source photographed skinned garment coordinates missing');
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
  const original=new Map(sourceKeys.map(key=>[key,geo.getAttribute(key)?.array.slice()]));
  const unique=new Map(),worldMatrix=mesh.matrixWorld,invWorld=worldMatrix.clone().invert();
  for(const i of new Set(geo.index.array)){
   const q=mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(worldMatrix);
   if(!Number.isFinite(q.x+q.y+q.z))throw Error('Nonfinite real world garment vertex');
   const key=q.toArray().map(x=>x.toFixed(5)).join(':');
   if(!unique.has(key))unique.set(key,{q,ids:[]});
   unique.get(key).ids.push(i);
  }
  let moved=0;
  for(const {q,ids} of unique.values()){
   const yFromShoulder=q.y-shoulderY,t=(yFromShoulder-hem)/.34;
   const bottom=1-smooth(t,.12,.82);
   const radius=Math.abs(q.x-center);
   const sideMask=smooth(radius,.07,.17)*(1-smooth(radius,.35,.42));
   const collarProtect=bottom*sideMask;
   if(collarProtect<.06)continue;
   const sign=q.x>=center?1:-1;
   const frontSign=q.z>=back?1:-1;
   const delta=new T.Vector3(sign*.25*offset*collarProtect,
     -offset*collarProtect,frontSign*.12*offset*collarProtect);
   const actual=delta.length();
   if(actual<.00001)continue;
   if(actual>GRAVITY_REST10.maxMeters*1.1)throw Error('Unsafe original-source cloth displacement');
   maxWorldOffset=Math.max(maxWorldOffset,actual);
   const target=q.clone().add(delta).applyMatrix4(invWorld);
   for(const i of ids){
    const final=target.clone().applyMatrix4(inverseSkin(mesh,i));
    if(!Number.isFinite(final.x+final.y+final.z))throw Error('Nonfinite inverse-skinned source fit');
    p.setXYZ(i,final.x,final.y,final.z);verticesMoved++;moved++;
    if(t<.35)hemVertices++;
    sides[sign===1?'R':'L']++;
   }
  }
  p.needsUpdate=true;geo.computeVertexNormals();smoothSurfaceNormals(geo,p.count);
  geo.computeBoundingBox();geo.computeBoundingSphere();
  audit(mesh,original);components.push({mesh:mesh.name,verticesMoved:moved});
 }
 if(verticesMoved<120||hemVertices<35||sides.L<25||sides.R<25||maxWorldOffset<.0025)
  throw Error('Physically meaningful photographed garment rest-shape absent '+JSON.stringify({
   verticesMoved,hemVertices,sides,maxWorldOffset}));
 return Object.freeze({
  actualPhotographedSource3DEquilibrium:true,rigBones:163,
  worldEquilibriumMeters:offset,verticesMoved,hemVertices,sides,
  maxWorldOffsetMeters:maxWorldOffset,components,
  originalPhotoAttributesUnchanged:frontSourceFieldsIntact,
  originalPhotoPixelsUnchanged:true,originalSkinWeightsUnchanged:true,
  bodyCollisionVerifiedByCaller:false,visualAcceptanceApproved:false,
  fullClothPhysicsCertified:false,releaseAuthorized:false
 });
}
