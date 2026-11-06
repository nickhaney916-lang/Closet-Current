/**
 * PHOTO106 actual 163-bone skinned photograph-to-denim calf drape.
 *
 * Extends genuine PHOTO103 knee angles, PHOTO104 pose-responsive knee folds,
 * PHOTO105 source-neutral shading, and P77 real skinned anatomy contact.
 * NO new original photograph: licensed source FRONT remains byte-identical;
 * unphotographed backside is neutral mesh only. NO mass/gravity simulation.
 */
import * as T from 'three';
import {auditTrueSkinnedPhotographedDenimContact77}
 from '../three-d-77/true-skinned-denim-body-intersections.mjs';
import {posteriorCalfDrapeDelta106} from './calf-drape-policy.mjs';
const protectedAttrs=['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
const SHA=Object.freeze([
 'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
]);
const fail=m=>{throw Error('PHOTO106 '+m);};
const round=v=>v.toFixed(5);
const clamp=T.MathUtils.clamp;
export function auditPhotographedDenimCalfDrape106(pants,root){
 const mesh=pants?.meshes?.[0],g=mesh?.geometry,pos=g?.getAttribute('position'),
  front=g?.getAttribute('pantsSourceFront'),normal=g?.getAttribute('normal');
 const angles=pants?.stats?.real163BoneSampledKnee103;
 if(!root?.isObject3D||!mesh?.isSkinnedMesh||pants.meshes.length!==1||
  mesh.skeleton?.bones?.length!==163||!pos||!front||!normal||pos.count<400||
  normal.count!==pos.count||
  !SHA.includes(pants.stats?.sourceSHA256)||
  !pants.stats?.poseResponsiveDenim104||
  !pants.stats?.originalPhotographedDenimNormalContinuity105||
  !pants.stats?.originalSourcePhotoUVRestSkinAndFrontNormalsUnchanged105||
  !pants.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77||
  !pants.stats?.originalPhotoUVRestFrontSkinPositionsBytePreserved77||
  protectedAttrs.some(n=>g.getAttribute(n)?.count!==pos.count)||
  !angles||![angles.leftDegrees,angles.rightDegrees].every(v=>
   typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=16))
  fail('exact real photographed P105 original source and valid P103 anatomical rig required');
 const limbs=pants.stats.landmarks?.map(l=>({
  knee:new T.Vector3(...l.knee),ankle:new T.Vector3(...l.ankle)
 }));
 if(limbs?.length!==2||limbs.some(l=>
  !l.knee.toArray().every(Number.isFinite)||
  !l.ankle.toArray().every(Number.isFinite)||
  l.knee.y-l.ankle.y<.22))
  fail('actual photographed male/female 163-bone source knee and ankle landmark measurements required');
 const protectedData=new Map(protectedAttrs.map(n=>
  [n,g.getAttribute(n).array.slice()]));
 const originalPosition=pos.array.slice(),originalNormals=normal.array.slice();
 const before=pants.stats.actualSkinnedDenimBodyCrossingSegments77;
 if(!Number.isSafeInteger(before)||before<0)
  fail('actual skinned body and jeans triangle contact baseline missing');
 if(angles.leftDegrees===0&&angles.rightDegrees===0){
  return {...pants,stats:{...pants.stats,
   photographedDenimCalfDrapeGeometry106:true,
   sourceNeutralRearCalfDrape106:{moved:0,maxShift:0,
    factor:0,sourcePhotoFrontProtectedVertices:pos.count,
    contactBefore:before,contactAfter:before},
   originalSourcePhotographAndUVRestSkinProtected106:true,
   noInventedReversePhotograph106:true,
   physicallySimulatedCloth106:false,
   fullContinuousSweptBodyContactProof106:false,
   independentHumanPhotorealismApproved106:false,
   physicalPhonesTested106:false,releaseAuthorized:false,familyAlpha:'HOLD'
  }};
 }
 mesh.updateWorldMatrix(true,false);
 const matrix=mesh.matrixWorld.clone(),inverse=matrix.clone().invert();
 const nodes=new Map();
 for(let i=0;i<pos.count;i++){
  const q=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(matrix);
  if(!q.toArray().every(Number.isFinite))fail('nonfinite original source denim skinned vertex');
  const key=q.toArray().map(round).join(':');
  if(!nodes.has(key))nodes.set(key,{q,indices:[],maxFront:0});
  const v=nodes.get(key);v.indices.push(i);
  v.maxFront=Math.max(v.maxFront,front.getX(i));
 }
 const snapshot=()=>{
  for(const [name,old] of protectedData){
   const current=g.getAttribute(name)?.array;
   if(!current||current.length!==old.length||
      !current.every((v,i)=>v===old[i]))
    fail('source JPEG mapped UV/rest/front/skin changed: '+name);
  }
  if(!normal.array.every((v,i)=>v===originalNormals[i]))
   fail('PHOTO105 original source-front and rear normal field unexpectedly altered');
 };
 let accepted=null;
 try{
  for(const factor of [1,.6,.3]){
   pos.array.set(originalPosition);pos.needsUpdate=true;
   let moved=0,maxShift=0,frontProtected=0,
    rightLegMoved=0,leftLegMoved=0,calfRegionVertices=0;
   for(const node of nodes.values()){
    if(node.maxFront>=.16){frontProtected+=node.indices.length;continue;}
    const q=node.q,side=q.x>=0?0:1,leg=limbs[side],
      angle=side===0?angles.leftDegrees:angles.rightDegrees;
    const f=clamp((q.y-leg.ankle.y)/(leg.knee.y-leg.ankle.y),0,1);
    const cx=T.MathUtils.lerp(leg.ankle.x,leg.knee.x,f);
    const cz=T.MathUtils.lerp(leg.ankle.z,leg.knee.z,f);
    const across=q.x-cx;
    if(!angle||Math.abs(across)>.24||q.z>cz+.075)continue;
    const rear=clamp((cz+.075-q.z)/.17,0,1);
    calfRegionVertices+=node.indices.length;
    const dz=factor*posteriorCalfDrapeDelta106({
     degrees:angle,kneeY:leg.knee.y,ankleY:leg.ankle.y,
     y:q.y,across,rear,sourceFront:node.maxFront
    });
    if(Math.abs(dz)<.00012)continue;
    if(dz>0||dz<-.0120001)fail('source neutral calf exceeded 12 mm');
    const local=q.clone();local.z+=dz;local.applyMatrix4(inverse);
    for(const idx of node.indices)pos.setXYZ(idx,local.x,local.y,local.z);
    moved+=node.indices.length;
    if(side===0)rightLegMoved+=node.indices.length;
    else leftLegMoved+=node.indices.length;
    maxShift=Math.max(maxShift,Math.abs(dz));
   }
   if(moved<8||maxShift<.0004||frontProtected<70)
    fail('no genuine source-neutral photographed jeans calf shape change: '+
     JSON.stringify({moved,maxShift,calfRegionVertices,frontProtected,factor}));
   pos.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();
   snapshot();
   const checked=auditTrueSkinnedPhotographedDenimContact77(pants,root,{
    pose:'photo106-actual-source-calf-'+angles.leftDegrees+'-'+angles.rightDegrees+'-'+factor
   });
   const after=checked.stats?.actualSkinnedDenimBodyCrossingSegments77;
   if(!Number.isSafeInteger(after)||after<0)
    fail('actual posed garment and anatomical body contact audit invalid');
   if(after<=before){
    accepted={checked,moved,maxShift,frontProtected,
     rightLegMoved,leftLegMoved,calfRegionVertices,
     factor,contactBefore:before,contactAfter:after};
    break;
   }
  }
  if(!accepted)fail('all source-neutral calf drape trial amplitudes worsen real body-to-jeans triangle contacts');
  snapshot();
  return {...accepted.checked,stats:{...accepted.checked.stats,
   photographedDenimCalfDrapeGeometry106:true,
   sourceNeutralRearCalfDrape106:{
    moved:accepted.moved,maxShift:accepted.maxShift,
    factor:accepted.factor,
    rightLegMoved:accepted.rightLegMoved,leftLegMoved:accepted.leftLegMoved,
    calfRegionVertices:accepted.calfRegionVertices,
    sourcePhotoFrontProtectedVertices:accepted.frontProtected,
    contactBefore:accepted.contactBefore,contactAfter:accepted.contactAfter
   },
   originalSourcePhotographAndUVRestSkinProtected106:true,
   photoFrontPositionsAndNormalsUnmodified106:true,
   originalSourceRearStillNeutral106:true,
   sourceRelativeNonAccumulatingCalfDrape106:true,
   trueSkinnedAnatomicalContactNeverIncreased106:true,
   noInventedReversePhotograph106:true,
   physicallySimulatedCloth106:false,
   fullContinuousSweptBodyContactProof106:false,
   independentHumanPhotorealismApproved106:false,
   physicalPhonesTested106:false,realCloudMultiAccountRLSVerified106:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  }};
 }catch(e){
  pos.array.set(originalPosition);pos.needsUpdate=true;
  normal.array.set(originalNormals);normal.needsUpdate=true;
  g.computeBoundingBox();g.computeBoundingSphere();
  throw e;
 }
}
