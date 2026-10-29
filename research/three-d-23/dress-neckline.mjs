/**
 * 3D-23: source-independent actual skinned dress neckline shape.
 * The prior dress uses a level circular top mesh ring even when the original
 * photographed front neckline visibly descends toward the center.
 *
 * Only the EXISTING garment position buffer changes. Source JPEG/PNG,
 * dressRest image-space coordinates, UV photo material, skeleton, skin
 * indices/weights, indices, actual body geometry and neutral rear remain
 * unchanged. No false promise of a sewn collar or cloth simulation.
 */
import * as T from 'three';

export const NECKLINE=Object.freeze({
 maxDropMeters:.028,
 minRingGapMeters:.016,
 frontExponent:5,
 maxAffectedRings:1,
 releaseAuthorized:false,
 humanVisualApproval:false
});

export function neckDropForAngle(theta,{maxDropMeters=NECKLINE.maxDropMeters}={}){
 if(!Number.isFinite(theta)||!Number.isFinite(maxDropMeters)||
  maxDropMeters<0||maxDropMeters>.035)throw Error('Unbounded dress neck shape');
 // 0/2π = photo-facing front. π = unobserved back, never redesigned.
 const front=Math.max(0,Math.cos(theta));
 return maxDropMeters*front**NECKLINE.frontExponent;
}

export function shapePhysicalDressNeckline(dress,{enabled=true,maxDropMeters=NECKLINE.maxDropMeters}={}){
 if(enabled===false)return dress;
 if(enabled!==true||!dress?.mesh?.isSkinnedMesh||!dress.mesh.geometry||
  dress.stats?.sourceId!=='commons-0053'||dress.stats.releaseAuthorized!==false||
  !Number.isSafeInteger(dress.stats.ringCount)||dress.stats.ringCount<8||
  !Number.isFinite(maxDropMeters)||maxDropMeters<=0||maxDropMeters>.035)
  throw Error('Original unapproved verified dress geometry required');

 const mesh=dress.mesh,g=mesh.geometry,p=g.getAttribute('position'),
  rest=g.getAttribute('dressRest'),bone=g.getAttribute('skinWeight'),
  indices=g.getAttribute('skinIndex'),length=g.index?.count||0;
 if(!rest||!bone||!indices||p.count!==rest.count||bone.count!==p.count||
  indices.count!==p.count||length<1000)throw Error('Invalid shared-skeleton photographed dress');

 const rows=dress.stats.ringCount,stride=p.count/rows,segments=stride-1;
 if(!Number.isSafeInteger(stride)||segments<24||segments>96||
  !mesh.skeleton||mesh.skeleton.bones.length<25)throw Error('Unexpected dress skinned topology');

 // Record source identity as *values*, compare bytes before & after in tests;
 // do not clone/replace original source attributes.
 const first=(rows-1)*stride,prior=(rows-2)*stride;
 mesh.updateWorldMatrix(true,false);
 const inverse=mesh.matrixWorld.clone().invert(),top=new T.Vector3(),below=new T.Vector3();
 const edits=[];let largest=0,frontCenter=0,backs=0;
 for(let j=0;j<=segments;j++){
  const idx=first+j,prev=prior+j,theta=2*Math.PI*j/segments;
  top.fromBufferAttribute(p,idx).applyMatrix4(mesh.matrixWorld);
  below.fromBufferAttribute(p,prev).applyMatrix4(mesh.matrixWorld);
  const drop=neckDropForAngle(theta,{maxDropMeters});
  // Never fold an anatomical collar ring through the preceding shoulder ring.
  const available=Math.max(0,top.y-below.y-NECKLINE.minRingGapMeters);
  const bounded=Math.min(drop,available);
  if(j===0||j===segments)frontCenter=Math.max(frontCenter,bounded);
  if(Math.cos(theta)<-.9)backs=Math.max(backs,bounded);
  if(bounded<1e-7)continue;
  const q=top.clone();q.y-=bounded;q.applyMatrix4(inverse);
  edits.push({idx,local:q});
  largest=Math.max(largest,bounded);
 }
 if(largest<.005||frontCenter<.005||backs>1e-8)
  throw Error('Could not preserve source-front-only V-neck opening');

 for(const {idx,local} of edits)p.setXYZ(idx,local.x,local.y,local.z);
 p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 mesh.userData.researchDressNeckline=true;
 return {...dress,stats:{...dress.stats,
  physicalFrontNeckline:true,maxActualFrontNeckDrop:largest,
  frontCenterNeckDrop:frontCenter,unverifiedRearNecklineUnchanged:true,
  originalPhotoCoordinatesUnchanged:true,skinWeightsUnchanged:true,
  actualSkinnedGarment:true,collisionValidated:false,
  humanVisualApproval:false,releaseAuthorized:false}};
}
