/**
 * 3D-19: READ-ONLY 3D anatomical wrist / shirt opening diagnostic.
 *
 * This does NOT assert cloth-to-body collision clearance, photo realism or
 * user fit. It measures closest sampled SKIN VERTICES to actual skinned hem
 * points, plus axial positions relative to real CC0 wrist bones.
 * Distances are useful diagnostics, not point-to-triangle signed distances.
 */
import * as THREE from 'three';
import {wristAxes} from '../three-d-16/cuff-clearance.mjs';

const vec=(attr,i)=>new THREE.Vector3().fromBufferAttribute(attr,i);
const round=(value)=>Number(value.toFixed(5));
const quantile=(arr,p)=>{
 if(!arr.length)return null;
 const a=[...arr].sort((x,y)=>x-y),ix=Math.min(a.length-1,Math.floor(p*(a.length-1)));
 return round(a[ix]);
};
const stats=arr=>({
 count:arr.length,
 min:quantile(arr,0),p10:quantile(arr,.10),median:quantile(arr,.5),
 p90:quantile(arr,.90),max:quantile(arr,1)
});
export function worldSkinnedPosition(mesh,index){
 if(!mesh?.isSkinnedMesh||typeof mesh.applyBoneTransform!=='function'||
  !mesh.geometry?.getAttribute('position')||!Number.isSafeInteger(index)||
  index<0||index>=mesh.geometry.getAttribute('position').count)
  throw Error('Actual skinned indexed human mesh required');
 const attr=mesh.geometry.getAttribute('position');
 const p=vec(attr,index);
 mesh.applyBoneTransform(index,p);
 return mesh.localToWorld(p);
}
const role=(point,axes)=>{
 const arm=axes.find(a=>Math.sign(a.end.x)===Math.sign(point.x));
 if(!arm)return null;
 const relative=point.clone().sub(arm.elbow);
 const t=relative.dot(arm.axis)/arm.axisLengthSq;
 const radial=relative.clone().sub(arm.axis.clone().multiplyScalar(t)).length();
 return {side:arm.side,t,radial};
};
const collect=mesh=>{
 const position=mesh.geometry.getAttribute('position');
 if(!position||position.count>250000)throw Error('Unexpected private or oversized source mesh');
 const out=[];
 for(let i=0;i<position.count;i++){
  if(mesh.name==='3D18-neutral-wrist-hem-bridge'&&i%4<2)continue;
  if(mesh.name==='3D17-neutral-inner-cuff-facing'&&i%4<2)continue;
  out.push(worldSkinnedPosition(mesh,i));
 }
 return out;
};
function collectBody(root,axes,{step=4}={}){
 const points={L:[],R:[]};
 root.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||mesh.userData.work56Garment)return;
  const position=mesh.geometry.getAttribute('position');
  if(!position||position.count>250000)throw Error('Unexpected source anatomical mesh');
  const stride=Math.max(step,Math.ceil(position.count/12000));
  for(let i=0;i<position.count;i+=stride){
   const point=worldSkinnedPosition(mesh,i);
   const x=role(point,axes);
   // Actual human wrist neighborhood: sufficient length to capture the
   // exposed hand and sleeve transition in source/relaxed poses.
   if(x&&x.t>=.72&&x.t<=1.32&&x.radial<.18)
    points[x.side].push({point,t:x.t,r:x.radial});
  }
 });
 if(points.L.length<8||points.R.length<8)
  throw Error('Actual skinned wrist skin samples missing');
 return points;
}
export function auditAnatomicalWristHem(root,shirt,{sampleStep=4}={}){
 if(!root?.isObject3D||!shirt?.meshes?.length||
  !Number.isInteger(sampleStep)||sampleStep<1||sampleStep>20)
  throw Error('Verified actual rigged shirt and bounded anatomy sample required');
 const bridge=shirt.meshes.find(m=>m.name==='3D18-neutral-wrist-hem-bridge');
 const facing=shirt.meshes.find(m=>m.name==='3D17-neutral-inner-cuff-facing');
 const original=shirt.meshes.find(m=>m.name==='Work56-independent-shirt-shell');
 if(!bridge?.isSkinnedMesh||!facing?.isSkinnedMesh||!original?.isSkinnedMesh||
  bridge.skeleton!==facing.skeleton||bridge.skeleton!==original.skeleton||
  !bridge.geometry.getAttribute('panelPosition')||
  !bridge.geometry.getAttribute('skinWeight'))
  throw Error('Exact existing source-verified wrist hem/facing and real skeleton required');
 root.updateMatrixWorld(true);
 for(const mesh of [original,facing,bridge]){
  mesh.updateMatrixWorld(true,false);
  mesh.skeleton.update();
 }
 const axes=wristAxes(root),body=collectBody(root,axes);
 const perArm={L:[],R:[]},facingPerArm={L:[],R:[]};
 for(const [mesh,out]of [[bridge,perArm],[facing,facingPerArm]])
  for(const point of collect(mesh)){
   const a=role(point,axes);
   if(a&&a.t>.70&&a.t<1.35&&a.radial<.18)
    out[a.side].push({point,t:a.t,r:a.radial});
  }
 const sideMetrics={};
 for(const side of ['L','R']){
  const rim=perArm[side],base=facingPerArm[side],skin=body[side];
  if(rim.length<6||base.length<6||skin.length<8)
   throw Error('Actual left/right source cuff sample insufficient');
  const nearest=rim.map(({point})=>{
   let min=Infinity;
   for(const s of skin)min=Math.min(min,point.distanceToSquared(s.point));
   return Math.sqrt(min);
  });
  const axial=rim.map(x=>x.t);
  sideMetrics[side]={
   hemSamples:rim.length,originalFacingSamples:base.length,
   bodySamples:skin.length,
   hemToSampledSkinMeters:stats(nearest),
   hemAxisFraction:stats(axial),
   originalFacingAxisFraction:stats(base.map(x=>x.t)),
   bodyWristAxisFraction:stats(skin.map(x=>x.t)),
   radialHemMeters:stats(rim.map(x=>x.r)),
   radialSkinMeters:stats(skin.map(x=>x.r)),
   // Unsigned vertex distances DO NOT establish collision-free fit or
   // exposed-skin count. Explicitly enforce that distinction.
   signedClearance:null,bodyTriangleIntersectionValidated:false,
   visualWedgeCount:null
  };
 }
 return Object.freeze({
  anatomy:'real-CC0-skinned-wrist-bones',
  sourcePhotoChanged:false,bodyMeshChanged:false,photoUsedForHem:false,
  mannequinBodyMeasurements:false,
  stage:'3D-19-audit',sideMetrics,
  humanVisualApproval:false,collisionValidated:false,
  releaseAuthorized:false
 });
}
