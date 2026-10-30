/** 3D42: source/relaxed-pose upper-back and shoulder garment clearance.
 * Research ONLY. Actual posed body triangles, no body/UV/RGB/rig mutations.
 * The moving surface is the existing photographic shirt's 3D position
 * attribute, never the original source image or source-panel coordinates.
 * Point-to-triangle oriented clearance does NOT prove triangle separation.
 */
import * as T from 'three';
import {triangleLookup} from '../three-d-41/pattern-trousers.mjs';
import {setFashionPose} from '../three-d-09/pose-source.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=T.MathUtils.smoothstep;
const finite=v=>v.toArray().every(Number.isFinite);
function posedBodyLookup(root){
 const vertices=[],faces=[];
 root.updateMatrixWorld(true);
 root.traverse(m=>{
  if(!m.isSkinnedMesh||m.userData.work56Garment)return;
  m.updateWorldMatrix(true,false);m.skeleton.update();
  const g=m.geometry,p=g.getAttribute('position'),offset=vertices.length;
  for(let i=0;i<p.count;i++){
   const v=m.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(m.matrixWorld);
   if(!finite(v))throw Error('3D42 non-finite posed original body geometry');
   vertices.push(v);
  }
  const ix=g.index;
  for(let i=0;i<(ix?.count??p.count);i++)faces.push(offset+(ix?ix.getX(i):i));
 });
 if(vertices.length<1000||faces.length<3000)throw Error('3D42 requires real posed anatomical triangles');
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(vertices.flatMap(v=>v.toArray()),3));
 geo.setIndex(faces);
 const lookup=triangleLookup(geo);
 return {lookup,dispose:()=>geo.dispose(),triangles:faces.length/3};
}
function localRestDisplacement(mesh,i,worldDelta){
 const a=mesh.geometry.getAttribute('skinIndex'),b=mesh.geometry.getAttribute('skinWeight'),
  weighted=new T.Matrix4(),elements=weighted.elements;
 elements.fill(0);
 for(let j=0;j<4;j++){
  const w=b.getComponent(i,j);if(w<1e-8)continue;
  const id=a.getComponent(i,j),bone=mesh.skeleton.bones[id],inv=mesh.skeleton.boneInverses[id];
  if(!bone||!inv)throw Error('3D42 missing original weighted arm or torso bone');
  const matrix=new T.Matrix4().multiplyMatrices(bone.matrixWorld,inv);
  for(let k=0;k<16;k++)elements[k]+=w*matrix.elements[k];
 }
 const skin=new T.Matrix4().multiplyMatrices(mesh.matrixWorld,mesh.bindMatrixInverse);
 skin.multiply(weighted).multiply(mesh.bindMatrix).invert();
 const v=worldDelta.clone().applyMatrix3(new T.Matrix3().setFromMatrix4(skin));
 if(!finite(v)||v.length()>.075)throw Error('3D42 invalid inverse original skinned shirt displacement');
 return v;
}
export function clearShirtAgainstPosedShoulders(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.meshes?.length||!shirt.stats?.necklineSeams||!shirt.stats?.envelope||
  !shirt.stats?.patternSidePanelEase)throw Error('3D42 requires reviewed original photographed patterned shirt');
 const meshes=shirt.meshes.filter(m=>m.name!=='Work59-source-neutral-collar-band');
 const images=['panelPosition','panelNormal','skinIndex','skinWeight'];
 const original=meshes.map(mesh=>{
  const p=mesh.geometry.getAttribute('position');
  if(!mesh.isSkinnedMesh||!p||images.some(n=>mesh.geometry.getAttribute(n)?.count!==p.count))
   throw Error('3D42 original photographed shell/skin attributes missing');
  const attributes=Object.fromEntries(images.map(n=>[n,mesh.geometry.getAttribute(n).array.slice()]));
  return {mesh,p,initial:p.array.slice(),attributes,base:new Array(p.count).fill(null)};
 });
 const center=shirt.stats.envelope.center;
 let posedTriangles=0,probes=0,corrections=0,total=0,max=0,protectedPhotoFront=0;
 let sourceHits=0,relaxedHits=0;
 const posedBodyCaches={};
 // Two source-derived poses are sampled against the ORIGINAL skinned body;
 // each correction is mapped back through the original garment skin weights.
 try{
  // Original rig/body triangle poses are unchanged by cloth edits: compute
  // each real posed body geometry once, not six times per original photo.
  for(const pose of ['source','relaxed']){
   setFashionPose(root,pose);posedBodyCaches[pose]=posedBodyLookup(root);
  }
  for(let pass=0;pass<3;pass++){
   const sum=original.map(({p})=>Array.from({length:p.count},()=>new T.Vector3()));
   const votes=original.map(({p})=>new Uint8Array(p.count));
   for(const pose of ['source','relaxed']){
    setFashionPose(root,pose);
    const body=posedBodyCaches[pose];posedTriangles=Math.max(posedTriangles,body.triangles);
    {
     for(let j=0;j<original.length;j++){
      const {mesh,p}=original[j];mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
      for(let i=0;i<p.count;i++){
       const q=mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(mesh.matrixWorld);
       const x=Math.abs(q.x),y=q.y;
       if(y<1.33||y>1.79||x>.66)continue;
       const collar=(1-smooth(y,1.60,1.72)*(1-smooth(x,.105,.21)));
       const band=smooth(y,1.33,1.43)*(1-smooth(y,1.74,1.79));
       const rear=1-smooth(q.z-center,.015,.085);
       const arm=smooth(x,.18,.31)*(1-smooth(x,.52,.66));
       const influence=Math.max(rear,arm*.75)*collar*band;
       if(q.z>center+.085){protectedPhotoFront++;continue;}
       if(influence<.065)continue;
       probes++;
       const hit=body.lookup(q);
       if(hit.distance>.075)continue;
       const normal=hit.tri.getNormal(new T.Vector3());
       // Orient the source body triangle normal away from the torso/arm
       // centerline; do not use nearest-point distance as a penetration depth.
       const radial=hit.point.clone().sub(new T.Vector3(0,y,center));
       if(normal.dot(radial)<0)normal.negate();
       const gap=q.clone().sub(hit.point).dot(normal),targetGap=.011;
       if(gap>=targetGap)continue;
       const step=Math.min(.015,Math.max(0,targetGap-gap))*influence;
       if(step<.00012)continue;
       const rest=localRestDisplacement(mesh,i,normal.multiplyScalar(step));
       sum[j][i].add(rest);
       votes[j][i]++;
       if(pose==='source')sourceHits++;else relaxedHits++;
      }
     }
    }
   }
   for(let j=0;j<original.length;j++){
    const {p,initial}=original[j];
    // Coincident photo-panel vertices receive one common averaged rest-space
    // displacement, preventing a seam opening across the source image panels.
    const groups=new Map();
    for(let i=0;i<p.count;i++){
     const v=new T.Vector3().fromBufferAttribute(p,i),key=v.toArray().map(n=>n.toFixed(5)).join(':');
     if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);
    }
    for(const ids of groups.values()){
     const delta=new T.Vector3(),n=ids.reduce((a,i)=>a+votes[j][i],0);
     if(n===0)continue;
     for(const i of ids)delta.add(sum[j][i]);
     delta.multiplyScalar(1/ids.length);
     const amount=delta.length();
     if(amount>.015)delta.setLength(.015);
     for(const i of ids){
      const base=new T.Vector3(initial[i*3],initial[i*3+1],initial[i*3+2]);
      const q=new T.Vector3().fromBufferAttribute(p,i).add(delta);
      const cumulative=q.clone().sub(base);
      if(cumulative.length()>.039)q.copy(base).add(cumulative.setLength(.039));
      const d=q.distanceTo(base);
      if(d>.0001){corrections++;total+=delta.length();max=Math.max(max,d);}
      p.setXYZ(i,q.x,q.y,q.z);
     }
    }
    p.needsUpdate=true;
   }
  }
 }finally{Object.values(posedBodyCaches).forEach(body=>body.dispose());setFashionPose(root,'source');}
 if(corrections<10||max<.001||max>.039001||sourceHits+relaxedHits<10)
  throw Error('3D42 pose-aware original-shirt contact did not produce bounded meaningful geometry '+JSON.stringify({corrections,max,sourceHits,relaxedHits}));
 for(const {mesh,p,attributes} of original){
  for(const name of images){
   const current=mesh.geometry.getAttribute(name).array,prior=attributes[name];
   if(current.length!==prior.length||!current.every((v,i)=>v===prior[i]))
    throw Error('3D42 photographed garment source/skin attribute was changed: '+name);
  }
  mesh.geometry.computeVertexNormals();smoothSurfaceNormals(mesh.geometry,p.count);
  mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
 }
 return {...shirt,stats:{...shirt.stats,
  poseAwareShoulderClearance:true,shoulderClearanceSourcePoseHits:sourceHits,
  shoulderClearanceRelaxedPoseHits:relaxedHits,
  shoulderClearancePosedBodyTriangles:posedTriangles,
  shoulderClearanceProbeCount:probes,shoulderClearanceEditedVertexEvents:corrections,
  shoulderClearanceMaximumRestMove:max,shoulderClearanceMeanStep:total/Math.max(1,corrections),
  shoulderClearanceOriginalPhotoFrontProtected:protectedPhotoFront,
  originalShirtSourcePixelsAndUVUnchanged:true,originalShirtSkinWeightsUnchanged:true,
  shoulderMethod:'source/relaxed closest actual skinned original-body triangles, bounded rest inverse-skin normal clearance',
  shoulderCollisionCertified:false,signedPenetrationDepthMeasured:false,
  completeSweptPoseCollisionTested:false,humanVisualApproval:false,releaseAuthorized:false}};
}
