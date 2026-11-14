/**
 * P87: research-only, pose-linked, REAL SkinnedMesh original-photo preview.
 *
 * Reuses P86's strict SHA-locked 1.025 source-contact/strain gate. Inverts the
 * ORIGINAL vertex's exact 163-bone linear-blend skin transform at each selected
 * pose to place a bounded source-photographed candidate in a disposable clone.
 * This does not reconstruct hidden fabric, change owner/source data, authorize
 * 3D save, certify continuous collisions, or simulate cloth dynamics.
 */
import * as THREE from 'three';
import {createRadialPreview86} from '../mission2-p86/radial-preview.mjs';
import {auditPoseLinkedOriginalPhotoSkinnedFit88} from '../mission2-source-length/actual-photo-contact-52.mjs';
import {calculateSourceSkirtRelief91,deriveSourceSkirtBand91,SOURCE_SKIRT91} from '../mission2-p91/photographed-skirt-relief.mjs';

const SOURCE_HASH='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const SCALE=1.025;
const fail=reason=>{throw Error('M2 P87 actual photo skinned pose preview: '+reason);};
const isLocal=()=>['localhost','127.0.0.1'].includes(globalThis.location?.hostname);
const arraysEqual=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const sourceAttributes=mesh=>{
 const g=mesh.geometry;
 const attributes=[...Object.values(g.attributes),...(g.index?[g.index]:[])];
 return attributes.map(a=>({
  attribute:a,snapshot:new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength).slice()
 }));
};
const verifyAttributes=entries=>entries.every(({attribute,snapshot})=>
 arraysEqual(new Uint8Array(attribute.array.buffer,attribute.array.byteOffset,attribute.array.byteLength),snapshot));

function inPose(mesh,index,point){
 return mesh.applyBoneTransform(index,point.clone());
}
export function inverseSkinTransform87(mesh,index,desiredLocal){
 // Four bone-weighted basis samples recover the actual affine skinning for
 // this vertex, not an estimated bone or a fake one-bone rigid transform.
 const zero=inPose(mesh,index,new THREE.Vector3());
 const x=inPose(mesh,index,new THREE.Vector3(1,0,0)).sub(zero);
 const y=inPose(mesh,index,new THREE.Vector3(0,1,0)).sub(zero);
 const z=inPose(mesh,index,new THREE.Vector3(0,0,1)).sub(zero);
 const matrix=new THREE.Matrix4().set(
  x.x,y.x,z.x,zero.x,
  x.y,y.y,z.y,zero.y,
  x.z,y.z,z.z,zero.z,
  0,0,0,1
 );
 const det=matrix.determinant();
 if(!Number.isFinite(det)||Math.abs(det)<1e-10)fail('noninvertible authentic blended 163-bone vertex');
 const recovered=desiredLocal.clone().applyMatrix4(matrix.invert());
 if(![recovered.x,recovered.y,recovered.z].every(Number.isFinite))
  fail('nonfinite inverse-skinned source position');
 return recovered;
}
export function createSkinnedPosePreview87(root,dress){
 if(!isLocal())fail('localhost-only research');
 if(!root?.isObject3D||!dress?.mesh?.isSkinnedMesh||!Array.isArray(dress.meshes)||
  dress.meshes.length<1||dress.meshes.length>16||dress.stats?.sourceSHA256!==SOURCE_HASH)
  fail('verified original Commons-0053 source dress and anatomical scene required');
 if(!dress.meshes.every(m=>m?.isSkinnedMesh&&m.skeleton===dress.mesh.skeleton&&
  m.geometry?.getAttribute('position')&&m.geometry?.getAttribute('skinIndex')&&
  m.geometry?.getAttribute('skinWeight')&&m.parent&&m.material?.clone))
  fail('all original garment parts must retain one genuine skin and photo material');
 if(dress.mesh.skeleton?.bones?.length!==163)fail('source anatomical 163-bone rig required');
 // Re-run unrelaxed C52/C53/C58/C61 + principal strain P86 on source.
 const provisional=createRadialPreview86(root,dress);
 const evidence=provisional.receipt;
 try{
  if(evidence?.sampledPoseNumericalClearance!==true||evidence.scale!==SCALE||
   evidence.sourceSHA256!==SOURCE_HASH||evidence.releaseAuthorized!==false)
   fail('original source contact/strain gate unavailable');
 }finally{provisional.dispose();}
 const clothes=dress.meshes;
 const snapshots=clothes.map(m=>sourceAttributes(m));
 let closed=false,mode='original',updates=0,lastMaxResidual=0,lastChanged=0;
 let drape91Active=false,drape91Receipt=null;
 const clones=[];
 const teardown=()=>{
  if(closed)return;
  closed=true;mode='disposed';
  for(const {original,clone,geometry,material,wasVisible} of clones){
   original.visible=wasVisible;clone.removeFromParent();
   geometry.dispose();material.dispose(); // NOT the borrowed original texture
  }
 };
 const verify=()=>{
  if(closed)fail('already disposed');
  for(let i=0;i<clothes.length;i++)
   if(!verifyAttributes(snapshots[i])||clothes[i]!==clones[i]?.original||
      clones[i].original.geometry===clones[i].geometry||
      clones[i].original.skeleton!==clones[i].clone.skeleton||
      clones[i].original.parent!==clones[i].clone.parent)
    fail('source photo geometry/skeleton/parent changed');
 };
 try{
  for(const original of clothes){
   const geometry=original.geometry.clone();
   const material=original.material.clone();
   material.onBeforeCompile=original.material.onBeforeCompile;
   material.customProgramCacheKey=()=>original.material.customProgramCacheKey();
   const clone=original.clone(false);
   clone.userData.work56Garment=true; // never count an actual cloth clone as anatomy
   clone.geometry=geometry;clone.material=material;clone.name='P87-research-source-skinned-fit';
   clone.frustumCulled=false;clone.visible=false;
   original.parent.add(clone);
   clones.push({original,clone,geometry,material,wasVisible:original.visible});
  }
  verify();
 }catch(err){teardown();throw err;}
 const update=()=>{
  verify();root.updateMatrixWorld(true);dress.mesh.skeleton.update();
  const spine=dress.mesh.skeleton.bones.find(b=>b.name==='spine04');
  if(!spine)fail('authentic original spine04 absent');
  const worldCenter=spine.getWorldPosition(new THREE.Vector3());
  const world=new THREE.Vector3(),rest=new THREE.Vector3(),desired=new THREE.Vector3();
  let changed=0,maxResidual=0;
  try{
   for(const {original,clone,geometry} of clones){
    original.updateWorldMatrix(true,false);clone.updateWorldMatrix(true,false);
    const pos=original.geometry.getAttribute('position'),
     fit=geometry.getAttribute('position'),worldInverse=original.matrixWorld.clone().invert();
    if(pos.count!==fit.count)fail('source vertex count changed');
    for(let i=0;i<pos.count;i++){
     rest.fromBufferAttribute(pos,i);
     world.copy(inPose(original,i,rest)).applyMatrix4(original.matrixWorld);
     desired.set(worldCenter.x+(world.x-worldCenter.x)*SCALE,
      world.y,worldCenter.z+(world.z-worldCenter.z)*SCALE);
     desired.applyMatrix4(worldInverse);
     const fitted=inverseSkinTransform87(original,i,desired);
     fit.setXYZ(i,fitted.x,fitted.y,fitted.z);
     const predicted=inPose(clone,i,fitted).applyMatrix4(clone.matrixWorld);
     const correct=desired.clone().applyMatrix4(original.matrixWorld);
     const error=predicted.distanceTo(correct);
     if(!Number.isFinite(error)||error>.00005)fail('pose-linked skinned fit misses target');
     maxResidual=Math.max(maxResidual,error);changed++;
    }
    fit.needsUpdate=true;geometry.computeBoundingSphere();
   }
   verify();
   updates++;lastMaxResidual=maxResidual;lastChanged=changed;
   drape91Active=false;drape91Receipt=null;
   return summary();
  }catch(error){teardown();throw error;}
 };

 const drape91=()=>{
  // Reset owned trial geometry to actual P90 source-fitted baseline on each
  // request; never accumulate a made-up pleat from repeated interactions.
  verify();update();
  const piece=clones.find(x=>x.original===dress.mesh);
  if(!piece)fail('P91 original photographed main source mesh not found');
  const {clone,geometry}=piece,posed=geometry.getAttribute('position');
  if(!posed||posed.itemSize!==3||posed.count<3000)
   fail('P91 original licensed dress source triangle vertices absent');
  root.updateMatrixWorld(true);clone.updateWorldMatrix(true,false);
  clone.skeleton.update();
  const spin=dress.mesh.skeleton.bones.find(b=>b.name==='spine04');
  if(!spin)fail('P91 original 163-bone anatomical spine04 not present');
  const center=spin.getWorldPosition(new THREE.Vector3());
  const p=new THREE.Vector3(),world=new THREE.Vector3(),
   targetLocal=new THREE.Vector3(),predicted=new THREE.Vector3(),
   invWorld=clone.matrixWorld.clone().invert();
  // The height band is derived from the ACTUAL posed garment, never a
  // hypothetical ideal dress or an invented human-body measurement.
  let hemY=Infinity,topY=-Infinity;
  for(let i=0;i<posed.count;i++){
   p.fromBufferAttribute(posed,i);
   world.copy(inPose(clone,i,p)).applyMatrix4(clone.matrixWorld);
   hemY=Math.min(hemY,world.y);topY=Math.max(topY,world.y);
  }
  const band=deriveSourceSkirtBand91({hemY,topY});
  let moved=0,peak=0,maximumSkinResidual=0;
  try{
   for(let i=0;i<posed.count;i++){
    p.fromBufferAttribute(posed,i);
    world.copy(inPose(clone,i,p)).applyMatrix4(clone.matrixWorld);
    const offset=calculateSourceSkirtRelief91({
     x:world.x,y:world.y,z:world.z,
     centerX:center.x,centerZ:center.z,hemY:band.hemY,
     waistY:band.waistY
    });
    if(offset.magnitudeMeters<=1e-9)continue;
    const desiredWorld=world.clone().add(
     new THREE.Vector3(offset.dx,offset.dy,offset.dz));
    targetLocal.copy(desiredWorld).applyMatrix4(invWorld);
    const fitted=inverseSkinTransform87(clone,i,targetLocal);
    posed.setXYZ(i,fitted.x,fitted.y,fitted.z);
    predicted.copy(inPose(clone,i,fitted)).applyMatrix4(clone.matrixWorld);
    const residual=predicted.distanceTo(desiredWorld);
    if(!Number.isFinite(residual)||residual>.00005)
     fail('P91 true posed skinned cloth target not recovered');
    moved++;peak=Math.max(peak,offset.magnitudeMeters);
    maximumSkinResidual=Math.max(maximumSkinResidual,residual);
   }
   if(moved<100||peak<.001)
    fail('P91 genuine photographic hem-source drape shape was not realized');
   posed.needsUpdate=true;
   geometry.computeBoundingSphere();
   verify();
   drape91Active=true;
   drape91Receipt=Object.freeze({
    schema:'M2-P91-provisional-sourced-hem-fall-true-SkinnedMesh',
    actualGarmentGeometryBandMeasured:true,
    sourceHeightMeters:topY-hemY,
    experimentalWaistAtActualGarmentFraction:
     SOURCE_SKIRT91.waistAtFractionOfActualGarmentHeight,
    heuristicNotHumanDrapeAnnotation:true,
    drapeAmplitudeMeters:SOURCE_SKIRT91.amplitudeMeters,
    sourceSkirtHemWaveCount:SOURCE_SKIRT91.lobes,
    movedRealSkinnedPhotoVertices:moved,
    maximumSampledHemReliefMeters:peak,
    maximumPoseSkinInverseResidualMeters:maximumSkinResidual,
    sourceSHA256:SOURCE_HASH,
    originalSourceRestPhotoUVSkinAndPixelsUntouched:true,
    noClothPhysicsOrIndependentPhotoDrapeCertification:true,
    onlyOriginalPhotographedMainDressComponent:true,
    releaseAuthorized:false,familyAlpha:'HOLD'
   });
   mode='drape91';
   for(const c of clones){
    c.original.visible=false;c.clone.visible=true;
   }
   return summary();
  }catch(e){teardown();throw e;}
 };
 const audit88=()=>{
  verify();
  if(updates<1)fail('P88 sample requires an actual fully posed fitted clone');
  const piece=clones.find(x=>x.original===dress.mesh);
  if(!piece)fail('P88 real photographed source mesh not found');
  return auditPoseLinkedOriginalPhotoSkinnedFit88({
   root,dress,fitted:piece.clone
  });
 };
 const original=()=>{verify();mode='original';for(const c of clones){c.original.visible=c.wasVisible;c.clone.visible=false;}return summary();};
 const candidate=()=>{verify();if(updates===0||drape91Active)update();mode='candidate';for(const c of clones){c.original.visible=false;c.clone.visible=true;}return summary();};
 const summary=()=>Object.freeze({
  schema:'M2-P87-original-public-photographed-dress-posed-skinned-source-preview',
  originalSHA256:SOURCE_HASH,realSkinBoneCount:163,
  actualOriginalPhotoMaterialRetained:true,
  actualSkinnedMeshClone:clones.every(x=>x.clone.isSkinnedMesh),
  liveSkeletonShared:clones.every(x=>x.clone.skeleton===x.original.skeleton),
  originalGeometryAndPhotoUVUntouched:!closed&&clothes.every((m,i)=>verifyAttributes(snapshots[i])),
  shown:mode,sourceGarmentParts:clones.length,
  poseUpdates:updates,fittedVertices:lastChanged,
  maximumCPUWorldSkinInverseResidualMeters:lastMaxResidual,
  estimatedSizeRadialFactor:SCALE,
  sourceSkirtDrapeResearch91:drape91Receipt,
  staticOriginalP86SourceGatePassed:true,
  arbitraryOriginalOwnerPhotoReconstruction:false,
  continuousContactOrDrapeCertified:false,photographicProjectionIndependentlyReviewed:false,
  actualPhysicalPhonesTested:false,consumer3DAdmitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
 try{update();return Object.freeze({original,candidate,drape91,update,audit88,dispose:teardown,get receipt(){return summary();}});}
 catch(e){teardown();throw e;}
}
