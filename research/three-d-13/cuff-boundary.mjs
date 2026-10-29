/**
 * 3D-13 — local cuff-gap correction on Work59's EXISTING real-photo shirt shell.
 * Small tapered extension along the source-pose forearm axis only. It adds no
 * fake surface, no UV copies, no bones, no textures and no source-photo edits.
 * No cloth/contact/visual acceptance claim.
 */
import * as T from 'three';
const NEAR=-.11, FULL=-.018, END=.031;
export function repairCuffBoundary(shirt,root,{reach=.016}={}){
 if(!shirt?.meshes?.length||!root?.traverse||typeof root.updateMatrixWorld!=='function'||
  !Number.isFinite(reach)||reach<.004||reach>.024)
  throw Error('Source-fitted garment and bounded cuff reach required');
 root.updateMatrixWorld(true);
 const arms=[];
 for(const side of ['L','R']){
  let wrist,elbow;
  root.traverse(o=>{
   if(!o.isBone)return;
   const name=o.name.replaceAll('.','');
   if(name==='wrist'+side)wrist=o.getWorldPosition(new T.Vector3());
   if(name==='lowerarm02'+side)elbow=o.getWorldPosition(new T.Vector3());
  });
  if(!wrist||!elbow)throw Error('Verified forearm/wrist bones required');
  const a=wrist.clone().sub(elbow);
  if(a.lengthSq()<1e-5)throw Error('Invalid forearm skeleton axis');
  arms.push({side,sign:Math.sign(wrist.x)|| (side==='L'?-1:1),
   wrist,axis:a.normalize(),changed:0,peak:0,proximityBefore:Infinity,proximityAfter:Infinity});
 }
 let vertices=0;
 for(const mesh of shirt.meshes){
  // Skip separately constructed collar; change original shirt topology only.
  if(mesh.name.includes('collar')||!mesh.geometry?.attributes?.panelPosition)continue;
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,pos=g.attributes.position,rest=g.attributes.panelPosition;
  const inv=mesh.matrixWorld.clone().invert();
  if(!pos||pos.count!==rest.count||!g.attributes.skinWeight||!g.attributes.skinIndex)
   throw Error('Original source-skinned shirt attributes required');
  let changed=0;
  for(let i=0;i<pos.count;i++){
   const q=new T.Vector3().fromBufferAttribute(rest,i);
   let best=null,bestScore=0,bestAxial=0;
   for(const arm of arms){
    if(Math.sign(q.x)!==arm.sign||Math.abs(q.x)<.29)continue;
    const offset=q.clone().sub(arm.wrist);
    const axial=offset.dot(arm.axis);
    const radial=offset.addScaledVector(arm.axis,-axial).length();
    if(axial<NEAR||axial>END||radial<.025||radial>.17)continue;
    const near=T.MathUtils.smoothstep(axial,NEAR,FULL);
    const tail=1-T.MathUtils.smoothstep(axial,.004,END);
    const ring=T.MathUtils.smoothstep(radial,.025,.055)*
     (1-T.MathUtils.smoothstep(radial,.135,.17));
    const score=near*tail*ring;
    if(score>bestScore){bestScore=score;best=arm;bestAxial=axial;}
   }
   if(!best||bestScore<.001)continue;
   const distance=reach*bestScore;
   const amended=q.clone().addScaledVector(best.axis,distance);
   const local=amended.clone().applyMatrix4(inv);
   pos.setXYZ(i,local.x,local.y,local.z);
   rest.setXYZ(i,amended.x,amended.y,amended.z);
   best.changed++;best.peak=Math.max(best.peak,distance);
   // Negative values mean the fabric tip lies before the bone wrist.
   best.proximityBefore=Math.min(best.proximityBefore,Math.abs(bestAxial));
   best.proximityAfter=Math.min(best.proximityAfter,Math.abs(bestAxial+distance));
   changed++;vertices++;
  }
  if(changed){pos.needsUpdate=true;rest.needsUpdate=true;g.computeVertexNormals();
   g.computeBoundingBox();g.computeBoundingSphere();}
 }
 const result={
  mechanism:'source-rig-cuff-tapered-axial-reach',
  repairedVertices:vertices,
  reachMax:reach,
  byArm:arms.map(a=>({side:a.side,vertices:a.changed,peak:a.peak,
   nearestBefore:Number.isFinite(a.proximityBefore)?a.proximityBefore:null,
   nearestAfter:Number.isFinite(a.proximityAfter)?a.proximityAfter:null})),
  originalPixelsUnchanged:true,skinWeightsUnchanged:true,
  noNewGeometry:true,collisionsValidated:false,humanVisualApproval:false,
  releaseAuthorized:false
 };
 if(!result.byArm.every(a=>a.vertices>8))
  throw Error('Refused unverified cuff geometry: insufficient nearby vertices');
 return Object.freeze(result);
}
