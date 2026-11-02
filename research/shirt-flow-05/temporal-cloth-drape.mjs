/**
 * SHIRT-FLOW-05: Bounded opt-in source-photo cloth inertia research.
 *
 * The real photographed, anatomically skinned shirt is first reconstructed
 * from its immutable source geometry and pose-conditioned F04 folds. A
 * damped spring then applies a small out-of-plane *geometric* response to
 * its sewn shirt torso. Real garment/body triangle BVH correction runs after
 * this step. Neither original JPEG, alpha, UV/panel-coordinate attributes,
 * source hash, or rig/skin weights are rewritten.
 *
 * NOT continuous physical cloth simulation, unrestricted pose collision
 * certification, or verified phone GPU performance.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=T.MathUtils.smoothstep;
const band=(x,a,b,c,d)=>smooth(x,a,b)*(1-smooth(x,c,d));
const stamp=q=>q.toArray().map(x=>x.toFixed(5)).join(':');
const clamp=(v,max)=>Math.max(-max,Math.min(max,v));
function inverseSkin(m,i){
 const g=m.geometry,combined=new T.Matrix4();combined.elements.fill(0);
 for(let k=0;k<4;k++){
  const id=g.attributes.skinIndex.getComponent(i,k),w=g.attributes.skinWeight.getComponent(i,k);
  const boneMatrix=new T.Matrix4().multiplyMatrices(m.skeleton.bones[id].matrixWorld,m.skeleton.boneInverses[id]);
  for(let j=0;j<16;j++)combined.elements[j]+=boneMatrix.elements[j]*w;
 }
 return combined.premultiply(m.bindMatrixInverse).multiply(m.bindMatrix).invert();
}
/** One deterministic 60Hz spring step per explicitly requested pose/frame.
 * Solver state is isolated to a research outfit controller, never persisted.
 */
export function createSourcePhotoTemporalDrape(root,shirt){
 if(!shirt?.stats?.sourceMeasuredNaturalSleeveHang||!shirt?.stats?.naturalSourceShoulderSleeveTransition)
  throw Error('Temporal response requires independently sewn original-photo 3D55 shirt');
 const shells=shirt.meshes.filter(m=>m.isSkinnedMesh&&m.name==='Work56-independent-shirt-shell');
 if(!shells.length)throw Error('Actual photographed independent 3D shirt shell required');
 const bones=[];root.traverse(o=>{if(o.isBone)bones.push(o);});
 if(bones.length!==163)throw Error('Exact original anatomical 163-bone model required');
 let lastPose=null,velocity=0,displacement=0,steps=0;
 const reset=()=>{lastPose=null;velocity=0;displacement=0;steps=0;};
 const step=pose=>{
  if(pose==='source'||pose==='relaxed'||pose===0){reset();if(pose===0)lastPose=0;return {active:false,reset:true,shifted:0,steps:0,millimeters:0,photoAndSkinPreserved:true,releaseAuthorized:false};}
  if(typeof pose!=='number'||!Number.isFinite(pose)||pose<0||pose>1||Math.abs(pose*16-Math.round(pose*16))>1e-9)
   throw Error('Only verified 17 original skeletal phase samples supported');
  root.updateMatrixWorld(true);
  const left=bones.find(o=>o.name==='upperarm01L'),right=bones.find(o=>o.name==='upperarm01R');
  if(!left||!right)throw Error('Original photographed shoulder landmarks missing');
  const a=left.getWorldPosition(new T.Vector3()),b=right.getWorldPosition(new T.Vector3());
  const shoulderY=(a.y+b.y)/2,centerX=(a.x+b.x)/2,shoulderZ=(a.z+b.z)/2;
  const difference=lastPose===null?0:pose-lastPose;
  // Inertial lag comes from *actual requested anatomical phase change*.
  // A damped spring makes unchanged bone poses continue settling visibly.
  const impulse=-difference*.013;
  velocity=clamp(.70*velocity-.24*displacement+impulse,.006);
  displacement=clamp(displacement+velocity,.008);
  lastPose=pose;steps++;
  const amplitude=Math.abs(displacement);
  const side={L:{yoke:0,chest:0,waist:0},R:{yoke:0,chest:0,waist:0}};
  let shifted=0,maxMeters=0,protectedBoundary=0;
  for(const mesh of shells){
   mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
   const geo=mesh.geometry,attr=geo.getAttribute('position'),index=geo.index;
   if(!attr||!index||!geo.getAttribute('panelPosition')||!geo.getAttribute('skinIndex')||!geo.getAttribute('skinWeight'))
    throw Error('Original skinned photographed source attributes missing');
   const group=new Map();
   for(const i of new Set(index.array)){
    const q=mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(attr,i)).applyMatrix4(mesh.matrixWorld);
    if(![q.x,q.y,q.z].every(Number.isFinite))throw Error('Nonfinite original photograph cloth body');
    const k=stamp(q);
    if(!group.has(k))group.set(k,{q,ids:[]});
    group.get(k).ids.push(i);
   }
   const inv=mesh.matrixWorld.clone().invert();
   for(const {q,ids} of group.values()){
    const x=Math.abs(q.x-centerX),dy=q.y-shoulderY;
    // Neck, centreprint, separately sewn caps, side seams and hem must stay
    // anchored. The mask lies strictly on the real photographic torso shell.
    const lateral=band(x,.012,.048,.245,.31);
    const vertical=band(dy,-.94,-.79,-.20,-.115);
    const influence=lateral*vertical;
    if(influence<.06||amplitude<.000025){protectedBoundary+=ids.length;continue;}
    const yoke=band(dy,-.49,-.35,-.24,-.14);
    const chest=band(dy,-.73,-.55,-.38,-.26);
    const waist=band(dy,-.90,-.78,-.58,-.44);
    const frontBack=Math.sign(q.z-shoulderZ)||1;
    const phaseBias=1+.15*Math.sin(x*25+dy*8);
    // Displace photographed triangles, not fabricated texture shadows.
    // Bone-pose response and spring history provide temporal inertia.
    const delta=new T.Vector3(
      Math.sign(q.x-centerX)*displacement*.20*influence,
      -displacement*.31*influence,
      frontBack*displacement*.80*influence*phaseBias
    );
    delta.clampLength(0,.0085);
    if(delta.length()<.000025)continue;
    for(const i of ids){
     const n=q.clone().add(delta).applyMatrix4(inv).applyMatrix4(inverseSkin(mesh,i));
     if(!Number.isFinite(n.x+n.y+n.z))throw Error('Nonfinite source skinned cloth impulse');
     attr.setXYZ(i,n.x,n.y,n.z);
     const v=side[Math.sign(q.x-centerX)===Math.sign(a.x-centerX)?'L':'R'];
     v[yoke>=chest&&yoke>=waist?'yoke':chest>=waist?'chest':'waist']++;
     shifted++;
    }
    maxMeters=Math.max(maxMeters,delta.length());
   }
   attr.needsUpdate=true;geo.computeVertexNormals();smoothSurfaceNormals(geo,attr.count);geo.computeBoundingBox();geo.computeBoundingSphere();
  }
  if(maxMeters>.00851)throw Error('Unbounded original-photo temporal garment displacement');
  return {active:shifted>0,reset:false,steps,pose,poseDelta:difference,
   shifted,millimeters:Math.round(maxMeters*1e6)/1000,
   springOffsetMeters:displacement,velocityMetersPerStep:velocity,
   yokeChestWaist:side,protectedBoundary,
   originalBoneCount:163,photoAndSkinPreserved:true,
   fixedStepSeconds:1/60,fullDynamicPhysicsCertified:false,
   continuousSweptCollisionCertified:false,physicalPhoneTested:false,
   humanPhotorealismApproved:false,releaseAuthorized:false};
 };
 return {step,reset,getState:()=>({lastPose,velocity,displacement,steps})};
}
