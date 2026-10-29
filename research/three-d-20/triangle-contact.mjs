/**
 * Closet Current 3D-20: actual SKINNED body TRIANGLE contact sampling at
 * the source-bound 3D18 cuff. No geometry edits; no false intersection PASS.
 *
 * Compared to 3D19 sampled vertex distances, this finds closest point on
 * true deformed body triangles and measures visible wrist direction via
 * inward/outward body-surface ray hits.
 *
 * Point-to-triangle distances + rays DO NOT prove complete triangle-to-
 * triangle cloth collision, watertight topology or visual gap closure.
 */
import * as THREE from 'three';
import {wristAxes} from '../three-d-16/cuff-clearance.mjs';
import {worldSkinnedPosition} from '../three-d-19/wrist-anatomy-audit.mjs';
const q=(xs,p)=>{
 if(!xs.length)return null;
 const a=[...xs].sort((x,y)=>x-y),i=Math.min(a.length-1,Math.floor(p*(a.length-1)));
 return Number(a[i].toFixed(6));
};
const stats=xs=>({n:xs.length,min:q(xs,0),p10:q(xs,.1),median:q(xs,.5),
 p90:q(xs,.9),max:q(xs,1)});
const limits=Object.freeze({maxBodyVertices:250000,maxSkinTriangles:300000,maxHemSamples:4000});
const valid=(x)=>typeof x==='number'&&Number.isFinite(x);
const sideRole=(p,axes)=>{
 const a=axes.find(a=>Math.sign(a.end.x)===Math.sign(p.x));
 if(!a)return null;
 const d=p.clone().sub(a.elbow),t=d.dot(a.axis)/a.axisLengthSq;
 const center=a.elbow.clone().addScaledVector(a.axis,t);
 return {side:a.side,t,radial:p.distanceTo(center),center,axis:a};
};
function selectSkinTriangles(root,axes){
 const selected={L:[],R:[]};
 let seenTris=0,sourceMeshCount=0;
 root.updateMatrixWorld(true);
 root.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||mesh.userData?.work56Garment||
   mesh.name?.startsWith('3D17-')||mesh.name?.startsWith('3D18-'))return;
  if(!mesh.skeleton||!mesh.geometry?.getAttribute('position'))return;
  const pos=mesh.geometry.getAttribute('position'),index=mesh.geometry.index;
  if(pos.count>limits.maxBodyVertices)throw Error('Oversized/unexpected actual anatomical skin');
  const triCount=index?index.count/3:pos.count/3;
  if(!Number.isSafeInteger(triCount)||triCount<1||seenTris+triCount>limits.maxSkinTriangles)
   throw Error('Unexpected body skin triangle topology');
  seenTris+=triCount;sourceMeshCount++;
  mesh.updateMatrixWorld(true,false);mesh.skeleton.update();
  // Cache each bone-skinned body vertex ONCE per mesh in the current pose.
  const points=new Array(pos.count);
  for(let i=0;i<pos.count;i++)points[i]=worldSkinnedPosition(mesh,i);
  for(let k=0;k<triCount;k++){
   const ids=index?[index.getX(k*3),index.getX(k*3+1),index.getX(k*3+2)]
    :[k*3,k*3+1,k*3+2];
   const [a,b,c]=ids.map(i=>points[i]);
   if(!a||!b||!c||a.distanceToSquared(b)<1e-14||
    a.clone().sub(b).cross(c.clone().sub(b)).lengthSq()<1e-14)continue;
   const centroid=a.clone().add(b).add(c).multiplyScalar(1/3);
   // Keep triangles that actually lie in the forearm/wrist neighborhood.
   // Retain edge-straddling triangles even when their centroid is outside.
   const roles=[a,b,c,centroid].map(x=>sideRole(x,axes));
   for(const side of ['L','R']){
    if(roles.some(role=>role?.side===side&&
     role.t>=.64&&role.t<=1.40&&role.radial<.21))
     selected[side].push(new THREE.Triangle(a,b,c));
   }
  }
 });
 for(const side of ['L','R'])
  if(selected[side].length<20)throw Error('Real body wrist triangles unavailable: '+side);
 return {selected,sourceMeshCount,sourceTriangleCount:seenTris};
}
export function pointAgainstActualSkinTriangles(point,axisCenter,triangles){
 if(!(point instanceof THREE.Vector3)||!(axisCenter instanceof THREE.Vector3)||
  !Array.isArray(triangles)||!triangles.length||triangles.length>limits.maxSkinTriangles||
  !(triangles[0] instanceof THREE.Triangle)||
  ![point.x,point.y,point.z,axisCenter.x,axisCenter.y,axisCenter.z].every(valid))
  throw Error('Finite cuff point, real wrist axis and body triangles required');
 const inward=axisCenter.clone().sub(point);
 if(inward.lengthSq()<1e-10)throw Error('Degenerate forearm radial direction');
 inward.normalize();
 const inwardRay=new THREE.Ray(point,inward),outwardRay=new THREE.Ray(point,inward.clone().negate());
 const near=new THREE.Vector3(),hit=new THREE.Vector3();
 let squared=Infinity,nearest=null,inHit=Infinity,outHit=Infinity;
 for(const triangle of triangles){
  triangle.closestPointToPoint(point,near);
  const d=point.distanceToSquared(near);
  if(d<squared){squared=d;nearest=near.clone();}
  if(inwardRay.intersectTriangle(triangle.a,triangle.b,triangle.c,false,hit)){
   const d=point.distanceTo(hit);if(d>1e-6&&d<inHit)inHit=d;
  }
  if(outwardRay.intersectTriangle(triangle.a,triangle.b,triangle.c,false,hit)){
   const d=point.distanceTo(hit);if(d>1e-6&&d<outHit)outHit=d;
  }
 }
 if(!nearest||!Number.isFinite(squared))throw Error('No nearby real skin triangle surface');
 return Object.freeze({
  nearestDistance:Math.sqrt(squared),
  inwardSurfaceHit:inHit<.2?inHit:null,
  outwardSurfaceHit:outHit<.2?outHit:null
 });
}
function sampleRealHem(shirt,axes,{step=2}={}){
 const bridge=shirt.meshes.find(m=>m.name==='3D18-neutral-wrist-hem-bridge');
 const facing=shirt.meshes.find(m=>m.name==='3D17-neutral-inner-cuff-facing');
 const original=shirt.meshes.find(m=>m.name==='Work56-independent-shirt-shell');
 if(!bridge?.isSkinnedMesh||!facing?.isSkinnedMesh||!original?.isSkinnedMesh||
  bridge.skeleton!==original.skeleton||facing.skeleton!==bridge.skeleton||
  !bridge.geometry?.getAttribute('panelPosition')||
  !bridge.geometry?.getAttribute('skinIndex'))
  throw Error('Exact source-bound anatomical shirt and cuff hem required');
 const pos=bridge.geometry.getAttribute('position');
 if(pos.count<24||pos.count>limits.maxHemSamples*4||pos.count%4)
  throw Error('Unexpected source cuff bridge sample topology');
 const points={L:[],R:[]};
 bridge.updateMatrixWorld(true,false);bridge.skeleton.update();
 for(let i=2;i<pos.count;i+=4*step){
  const p=worldSkinnedPosition(bridge,i),r=sideRole(p,axes);
  if(r?.t>=.70&&r.t<=1.35&&r.radial<.18)
   points[r.side].push({p,...r});
 }
 for(const s of ['L','R'])if(points[s].length<6)
  throw Error('No verified source cuff edges on '+s);
 return points;
}
export function measureCuffBodyTriangleContact(root,shirt,{hemStep=2}={}){
 if(!root?.isObject3D||!shirt?.meshes?.length||!Number.isInteger(hemStep)||
  hemStep<1||hemStep>8)throw Error('Actual rig and source shirt required');
 root.updateMatrixWorld(true);
 const axes=wristAxes(root),hem=sampleRealHem(shirt,axes,{step:hemStep});
 const skin=selectSkinTriangles(root,axes),sideMetrics={};
 for(const side of ['L','R']){
  const distances=[],radialInward=[],radialOutward=[],axial=[];
  const triangles=skin.selected[side],samples=hem[side];
  for(const {p,center,t} of samples){
   axial.push(t);
   const hit=pointAgainstActualSkinTriangles(p,center,triangles);
   distances.push(hit.nearestDistance);
   if(hit.inwardSurfaceHit!==null)radialInward.push(hit.inwardSurfaceHit);
   if(hit.outwardSurfaceHit!==null)radialOutward.push(hit.outwardSurfaceHit);
  }
  sideMetrics[side]={
   realSourceHemSamples:samples.length,
   realBodyWristTriangles:triangles.length,
   hemPointToBodyTriangleMeters:stats(distances),
   inwardRadialSkinSurfaceMeters:stats(radialInward),
   outwardRadialSkinSurfaceMeters:stats(radialOutward),
   hemBoneAxisFraction:stats(axial),
   inwardSkinHitFraction:Number((radialInward.length/samples.length).toFixed(4)),
   signedClearance:null,
   garmentTriangleToBodyTriangleIntersectionValidated:false,
   watertightBodyValidated:false,
   palePixelWedgeCount:null,
   humanVisualApproval:false
  };
 }
 return Object.freeze({
  stage:'3D-20-triangle-contact-diagnostic',
  source:'real-skinned-CC0-body-surface-triangles',
  realBodyMeshCount:skin.sourceMeshCount,
  inspectedBodyTriangles:skin.sourceTriangleCount,
  sides:sideMetrics,
  sourcePhotoOrMaskModified:false,bodyMeshModified:false,
  newGarmentMeshAdded:false,
  pointToTriangleMeasured:true,
  fullTriangleCollisionValidated:false,
  signedClearance:null,visualGapClosureProven:false,
  humanVisualApproval:false,releaseAuthorized:false
 });
}
