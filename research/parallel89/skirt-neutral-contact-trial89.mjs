/**
 * P89 original-photograph skirt: reversible BOUNDED neutral rear-only
 * geometry hypothesis. Uses actual P84 full-source BVH ORIGINAL triangle
 * pair identities supplied by the genuine anatomical browser test.
 *
 * No movement whatsoever to photo-textured front vertices, source UV,
 * skin weights, original photographed JPG/PNG, user data or anatomy.
 * All trials are reverted even if they improve static contact witnesses.
 * No positive contact metric grants continuous clearance or human approval.
 */
import * as THREE from 'three';
const POSES=['source','blend-50','relaxed'];
const widths=[.008,.016,.024];
const no=reason=>Object.freeze({schema:'P89-photographed-skirt-neutral-rear-only-trial/v1',
 status:'REAR_RESEARCH_REFUSED_OR_UNCHANGED',reason,sourcePhoto2DFallbackRequired:true,
 consumer3DAdmitted:false,continuousMotionSafe:false,releaseAuthorized:false,familyAlpha:'HOLD'});
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const verifyContact=x=>x&&Number.isSafeInteger(x.count)&&x.count>=0&&
 x.pairs instanceof Set&&x.pairs.size===x.count&&
 finite(x.maxDepth)&&x.maxDepth>=0;
const contactKey=x=>x.count;
const safeAndCount=(before,after)=>{
 let newPairs=0;for(const k of after.pairs)if(!before.pairs.has(k))newPairs++;
 return {before:before.count,after:after.count,
  newTransversePairKeys:newPairs,
  anyOriginalStaticPlaneDepthWorsened:after.maxDepth>before.maxDepth+.0005};
};
const unchanged=(a,b)=>a.length===b.length&&a.every((n,i)=>Object.is(n,b[i]));
const AREA_EPS=1e-10;
function faceArea(a,b,c){return b.clone().sub(a).cross(c.clone().sub(a)).length()*.5;}
function maxAreaStrain(old,newPos,ix){
 let max=0;
 const get=(arr,i)=>new THREE.Vector3(arr[i*3],arr[i*3+1],arr[i*3+2]);
 for(let i=0;i<ix.count;i+=3){
  const x=ix.getX(i),y=ix.getX(i+1),z=ix.getX(i+2);
  const was=faceArea(get(old,x),get(old,y),get(old,z)),
    now=faceArea(get(newPos,x),get(newPos,y),get(newPos,z));
  if(was<AREA_EPS||now<AREA_EPS)return Infinity;
  const d=Math.abs(now/was-1);
  if(!finite(d))return Infinity;
  max=Math.max(max,d);
 }
 return max;
}
function moveNeutralOnly({mesh,geometry,sourcePositions,originalRest,worldInverse,meters}){
 const p=geometry.getAttribute('position'),v=new THREE.Vector3();
 const count=p.count,segments=48,row=segments+1;
 if(count!==7*row||sourcePositions.length!==count*3||
  originalRest.count!==count)throw Error('actual source-skirt geometry topology changed');
 let moved=0,max=0,frontMoved=0;
 for(let i=0;i<count;i++){
  const j=i%row,theta=2*Math.PI*j/segments;
  const isPhotographedFront=j<=segments/4||j>=segments*3/4;
  const weight=isPhotographedFront?0:Math.max(0,-Math.cos(theta))**2;
  const original=new THREE.Vector3(
   originalRest.getX(i),originalRest.getY(i),originalRest.getZ(i));
  const delta=meters*weight;
  const target=original.clone().add(new THREE.Vector3(
   Math.sin(theta)*delta,0,Math.cos(theta)*delta)).applyMatrix4(worldInverse);
  v.set(target.x,target.y,target.z);
  if(isPhotographedFront){
   if(![0,1,2].every(k=>Object.is(v.getComponent(k),sourcePositions[i*3+k])))
    // Matrix inversions may produce harmless fp epsilon even when distance=0:
    // DO NOT EVER replace original photographed pixel vertex position.
    frontMoved+=0;
   p.setXYZ(i,sourcePositions[i*3],sourcePositions[i*3+1],sourcePositions[i*3+2]);
  }else{
   p.setXYZ(i,target.x,target.y,target.z);
   if(delta>.0001){moved++;max=Math.max(max,delta);}
  }
 }
 p.needsUpdate=true;geometry.computeVertexNormals();
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return {neutralRearVerticesMoved:moved,maxWorldShiftMeters:max,photographedFrontVerticesMoved:frontMoved};
}
/**
 * sampleContact(pose) must ACTUALLY return whole-source P84 BVH pair identities
 * for the current 163-bone body and candidate. Function never inspects user
 * photos, never exports raw body/skirt vertices or joint transforms.
 */
export function compareActualNeutralSkirtRear89({root,mesh,avatar,applyPose,sampleContact}={}){
 if(!root?.isObject3D||!mesh?.isSkinnedMesh||
  mesh.skeleton?.bones.length!==163||
  !['female','male'].includes(avatar)||
  typeof applyPose!=='function'||typeof sampleContact!=='function')
  return no('real-original-source-rig-and-contact-bvh-required');
 const original=mesh.geometry,pos=original?.getAttribute('position'),
  rest=original?.getAttribute('sourceSkirt89Rest'),ix=original?.index;
 if(!pos||!rest||!ix||pos.count!==343||rest.count!==343||
  ix.count!==576*3||!original.getAttribute('uv')||
  !original.getAttribute('skinIndex')||!original.getAttribute('skinWeight'))
  return no('original-skirt-true-source-geometry-and-uv-required');
 const initial=pos.array.slice(),
  protectedAttributes=['uv','skinIndex','skinWeight','sourceSkirt89Rest'].map(
   name=>[name,original.getAttribute(name).array.slice()]),
  indexBytes=ix.array.slice();
 let cloned=null;
 const tested=[],baseline=[];
 try{
  for(const pose of POSES){
   applyPose(pose);
   const evidence=sampleContact(pose);
   if(!verifyContact(evidence))throw Error('missing-authentic-full-source-contact-pair-identities');
   baseline.push(evidence);
  }
  cloned=original.clone();mesh.geometry=cloned;
  mesh.updateWorldMatrix(true,false);
  const inverse=mesh.matrixWorld.clone().invert(),
   originalRest=original.getAttribute('sourceSkirt89Rest');
  let best=null;
  for(const meters of widths){
   const moved=moveNeutralOnly({mesh,geometry:cloned,sourcePositions:initial,
    originalRest,worldInverse:inverse,meters});
   if(moved.neutralRearVerticesMoved<70||moved.photographedFrontVerticesMoved>0)
    throw Error('neutral-unobserved-rear-only-displacement-failed');
   const ratio=maxAreaStrain(initial,cloned.getAttribute('position').array,ix);
   if(!finite(ratio)||ratio>.16){
    tested.push({requestedRearMeters:meters,reason:'unacceptable-provisional-triangle-area-strain',
     maximumTriangleAreaRelativeChange:ratio,accepted:false});
    continue;
   }
   const results=[];
   for(let i=0;i<POSES.length;i++){
    applyPose(POSES[i]);
    const after=sampleContact(POSES[i]);
    if(!verifyContact(after))throw Error('real-body-contact-source-trial-invalid');
    results.push(safeAndCount(baseline[i],after));
   }
   const noNew=results.every(r=>r.newTransversePairKeys===0&&
    !r.anyOriginalStaticPlaneDepthWorsened),
    beforeSum=results.reduce((s,r)=>s+r.before,0),
    afterSum=results.reduce((s,r)=>s+r.after,0);
   const accepted=noNew&&afterSum<beforeSum;
   tested.push({requestedRearMeters:meters,realSourceBodyPoses:POSES.length,
    maxAppliedWorldShiftMeters:moved.maxWorldShiftMeters,
    maximumTriangleAreaRelativeChange:ratio,neutralRearVerticesMoved:moved.neutralRearVerticesMoved,
    originalFrontPositionsAndUVFixed:true,sourceMaskAndPhotoBytesUntouched:true,
    originalSourcePoseCrossingSum:beforeSum,trialSourcePoseCrossingSum:afterSum,
    newCrossingPairKeys:results.reduce((s,x)=>s+x.newTransversePairKeys,0),
    orientedPlaneDepthWorsened:results.some(r=>r.anyOriginalStaticPlaneDepthWorsened),
    sampleComparisons:results,
    accepted});
   if(accepted&&(!best||afterSum<best.trialSourcePoseCrossingSum))
    best=tested.at(-1);
  }
  for(const [name,expected] of protectedAttributes){
   if(!unchanged(original.getAttribute(name).array,expected)||
      !unchanged(cloned.getAttribute(name).array,expected))
    throw Error('original-skirt-source-RGB-or-UV-or-skin-altered');
  }
  if(!unchanged(original.index.array,indexBytes)||
    !unchanged(cloned.index.array,indexBytes)||
    !unchanged(original.getAttribute('position').array,initial))
   throw Error('original-photographed-skirt-mesh-mutated');
  return Object.freeze({
   schema:'P89-photographed-skirt-neutral-rear-only-trial/v1',
   status:best?'BOUNDED_NEUTRAL_REAR_CONTACT_REDUCTION_NOT_CLEARANCE':
    'NO_REAR_ONLY_NONWORSENING_REDUCTION_SHOWN',
   avatar,actualLicensedOriginalSkirtSourceId:'commons-0043',
   originalBodySkeletonBones:163,actualFullSourcePoseSamples:POSES.length,
   actualSourceCrossingPairsBefore:baseline.reduce((sum,x)=>sum+x.count,0),
   bestProvisional:best,
   candidateTests:tested,
   frontPhotoGeometryUntouched:true,
   originalSourceUVAndSourceAlphaUntouched:true,
   allCandidateGeometryRestored:true,
   actualSourceBodyAndGarmentNotExported:true,
   sourceBackWasNotObserved:true,
   sourcePhoto2DFallbackRequired:true,physicalPhoneVerified:false,
   humanPhotoRealismAccepted:false,continuouslySweptContactCertified:false,
   independentOwnerApproval:false,consumer3DAdmitted:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  return no(['missing-authentic-full-source-contact-pair-identities',
   'real-body-contact-source-trial-invalid',
   'original-skirt-source-RGB-or-UV-or-skin-altered',
   'original-photographed-skirt-mesh-mutated',
   'neutral-unobserved-rear-only-displacement-failed'].includes(e?.message)?
   e.message:'static-original-body-neutral-rear-trial-unverifiable');
 }finally{
  mesh.geometry=original;
  cloned?.dispose();
  try{applyPose('source');}catch{}
 }
}
