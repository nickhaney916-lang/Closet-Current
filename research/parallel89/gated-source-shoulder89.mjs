/**
 * Mission #89 -- active local-only P84 photographed shoulder trial A/B veto.
 * This file runs exclusively in a disposable immutable-P541 research clone.
 * The original shirt JPEG, source mask, UV, skin weights, topology, body and
 * original 163-bone avatar are never written. A zero transverse intersection
 * count does NOT authorize an unsafe reduction in photographed cloth gaps.
 */
import {trialSourceBoneShoulderYoke84} from '../parallel84-real-photo-layers/source-bone-yoke-trial84.mjs';
import {auditRealSourceGarmentArmPoses84} from '../parallel84-real-photo-layers/source-pose-sweep84.mjs';
import {auditActualOriginalSourcePoseSurfaceGaps89} from './source-static-gap89.mjs';
import {compareOriginalSourceShoulderGapAB89} from './source-gap-contrast89.mjs';
import {auditActualSourceQuarterStepSurfaceGaps89} from './source-quarter-step89.mjs';
import {compareOriginalSourceQuarterStepAB89} from './source-quarter-compare89.mjs';

function sourceSnapshot89(meshes){
 if(!Array.isArray(meshes)||meshes.length<1||meshes.length>12)
  throw Error('real-original-photographed-shirt-meshes-required');
 return meshes.map(m=>{
  const g=m?.geometry,p=g?.getAttribute('position'),n=g?.getAttribute('normal');
  if(!m?.isSkinnedMesh||m.skeleton?.bones?.length!==163||!p||!n||
   p.itemSize!==3||n.itemSize!==3||p.count!==n.count)
   throw Error('actual-licensed-163bone-source-required');
  return {m,g,p,n,index:g.index,material:m.material,
   originalPosition:p.array.slice(),originalNormals:n.array.slice(),
   originalProtected:Object.entries(g.attributes).filter(([name])=>
    name!=='position'&&name!=='normal').map(([name,attr])=>
     ({name,attr,data:attr.array.slice()}))};
 });
}
function protectedUnchanged89(records){
 return records.every(({m,g,p,n,index,material,originalProtected})=>
  m.geometry===g&&g.getAttribute('position')===p&&
  g.getAttribute('normal')===n&&g.index===index&&m.material===material&&
  originalProtected.every(({name,attr,data})=>
   g.getAttribute(name)===attr&&attr.array.length===data.length&&
   data.every((v,i)=>Object.is(v,attr.array[i]))));
}
function exactOriginalRestored89(records){
 return records.every(({p,n,originalPosition,originalNormals})=>
  p.array.length===originalPosition.length&&
  n.array.length===originalNormals.length&&
  originalPosition.every((v,i)=>Object.is(v,p.array[i]))&&
  originalNormals.every((v,i)=>Object.is(v,n.array[i])));
}
function restore89(records){
 for(const {g,p,n,originalPosition,originalNormals} of records){
  p.array.set(originalPosition);n.array.set(originalNormals);
  p.needsUpdate=true;n.needsUpdate=true;
  g.computeBoundingBox();g.computeBoundingSphere();
 }
 if(!exactOriginalRestored89(records)||!protectedUnchanged89(records))
  throw Error('original-source-research-rollback-incomplete');
}
const fixed=(result,reason,extras={})=>Object.freeze({
 schema:'parallel84-source-bone-shoulder-yoke/v1',
 sourcePhotoPreserved:true,sourceSkinUVPreserved:true,
 originalBodyUnchanged:true,sourceBackUnphotographed:true,
 continuousClothPhysicsValidated:false,humanVisualRealismApproved:false,
 ...result,status:'REFUSED_NEW_CONTACT',reason,
 trialApplied:false,sourceGeometryRestored:true,
 p89SourceGapGate:'REFUSED_AND_ORIGINAL_GEOMETRY_RESTORED',
 p89MeasuredGapCandidateNeverAuthorized:true,
 p89ResearchOnly:true,p89OriginalPhoto2DFallbackRequired:true,
 p89FullSignedClearanceCertified:false,
 p89ContinuousMotionCertified:false,
 p89Consumer3DAuthorized:false,releaseAuthorized:false,...extras
});
const baselineShape=Object.freeze({
 schema:'parallel84-source-bone-shoulder-yoke/v1',
 status:'BASELINE_UNMODIFIED',trialApplied:false,releaseAuthorized:false
});
/**
 * Synchronously reconstruct and independently measure 5 actual joint poses
 * before/after the existing P84 original-source source-yoke adjustment.
 * P89 is a SUPPLEMENTAL research veto, never a grant of real-life clothing fit.
 * NOTE: P84 caller already has genuine source JPEG SHA, original rig and
 * exact P541 source proofs; both routines repeat those checks.
 */
export function gateOriginalPhotoShoulderResearchTrial89({
 root,shirt,pants,avatar,applyPose,
 requestedDropMeters=.010,outwardClearanceMeters=.015
}={}){
 let originals;
 try{
  originals=sourceSnapshot89(shirt?.meshes);
  const originalPose=auditRealSourceGarmentArmPoses84({root,shirt,pants,avatar,applyPose});
  if(originalPose?.actualPoseAuditCompleted!==true)
   throw Error('original-source-pose-audit-refused');
  const baseline=auditActualOriginalSourcePoseSurfaceGaps89({
   root,shirt,pants,avatar,applyPose,poseContactReceipt:originalPose});
  if(baseline?.status!=='THREE_ACTUAL_SOURCE_POSE_UNSIGNED_GAPS_MEASURED_NOT_CLEARANCE')
   throw Error('original-source-gap-audit-refused');
  const baselineQuarter=auditActualSourceQuarterStepSurfaceGaps89({
   root,shirt,pants,avatar,applyPose});
  if(baselineQuarter.status!=='ACTUAL_PUBLIC_SOURCE_STATIC_QUARTERSTEP_MEASURED_NOT_SWEPT')
   throw Error('original-source-real-quarterstep-audit-refused');
  const trial=trialSourceBoneShoulderYoke84({
   root,shirt,pants,avatar,requestedDropMeters,outwardClearanceMeters});
  if(!protectedUnchanged89(originals))
   throw Error('protected-original-photo-attributes-changed');
  if(!trial?.trialApplied){
   restore89(originals);
   return Object.freeze({...trial,
    p89SourceGapGate:'ORIGINAL_P84_TRIAL_REFUSED',
    p89MeasuredGapCandidateNeverAuthorized:true,
    p89ResearchOnly:true,p89OriginalPhoto2DFallbackRequired:true,
    p89FiveStaticPoseGuardCompleted:false,
    p89Consumer3DAuthorized:false,releaseAuthorized:false});
  }
  const candidatePose=auditRealSourceGarmentArmPoses84({root,shirt,pants,avatar,applyPose});
  if(candidatePose?.actualPoseAuditCompleted!==true)
   throw Error('candidate-real-joint-pose-audit-refused');
  const candidate=auditActualOriginalSourcePoseSurfaceGaps89({
   root,shirt,pants,avatar,applyPose,poseContactReceipt:candidatePose});
  if(candidate?.status!=='THREE_ACTUAL_SOURCE_POSE_UNSIGNED_GAPS_MEASURED_NOT_CLEARANCE')
   throw Error('candidate-source-gap-audit-refused');
  const candidateQuarter=auditActualSourceQuarterStepSurfaceGaps89({
   root,shirt,pants,avatar,applyPose});
  if(candidateQuarter.status!=='ACTUAL_PUBLIC_SOURCE_STATIC_QUARTERSTEP_MEASURED_NOT_SWEPT')
   throw Error('candidate-source-real-quarterstep-audit-refused');
  const quarterComparison=compareOriginalSourceQuarterStepAB89({
   avatar,baseline:baselineQuarter,trial:candidateQuarter});
  if(!['QUARTER_STATIC_POSES_NO_NEW_WORSENING_NOT_SWEPT',
    'QUARTER_STATIC_POSE_SOURCE_WORSENING_WITNESSED'].includes(quarterComparison.status))
   throw Error('original-quarterstep-gap-compare-unverified');
  const comparison=compareOriginalSourceShoulderGapAB89({
   avatar,baseline,trial:candidate,baselineShoulder:baselineShape,
   trialShoulder:trial
  });
  if(comparison.status!=='ACTUAL_ORIGINAL_PHOTO_SHOULDER_AB_MEASURED_NOT_CLEARED')
   throw Error('source-shape-gap-evidence-invalid');
  // Stronger-than-P84 physical study constraint: refuse research preview
  // even if there is no strict transverse contact but some actual nearest
  // surface gap worsens over 50 microns at ANY pose/pair.
  if(!comparison.researchCandidateRetainedForStudy||
     !quarterComparison.trialRetainedForResearchOnly){
   restore89(originals);
   return fixed(trial,'P89_MEASURED_SOURCE_SURFACE_GAP_VETO',{
    p89GapVetoReason:comparison.researchSourceGapVetoReason||
     (quarterComparison.quarterPoseNewTriangleCrossings?
      'QUARTERSTEP_NEW_STRICT_TRIANGLE_CROSSING':
      'QUARTERSTEP_SOURCE_SURFACE_GAP_SHRINK_EXCEEDS_005MM'),
    p89FiveStaticPoseGuardCompleted:true,
    p89QuarterStepPoseAuditCompleted:true,
    p89QuarterPoseStrictCrossingWorsened:quarterComparison.quarterPoseNewTriangleCrossings,
    p89QuarterPoseSurfaceGapWorsened:quarterComparison.quarterPoseGapShrinkExceeded50Microns,
    p89BestResearchReference:'baseline'});
  }
  return Object.freeze({...trial,
   p89SourceGapGate:'ACTUAL_SOURCE_POSE_GAPS_NONWORSENING_RESEARCH_ONLY',
   p89MeasuredGapCandidateNeverAuthorized:true,
   p89BestResearchReference:'trial',
   p89StudyCandidateOnly:true,p89ResearchOnly:true,
   p89FiveStaticPoseGuardCompleted:true,
   p89QuarterStepPoseAuditCompleted:true,
   p89QuarterPoseStrictCrossingWorsened:false,
   p89QuarterPoseSurfaceGapWorsened:false,
   p89OriginalPhoto2DFallbackRequired:true,
   p89FullSignedClearanceCertified:false,
   p89ContinuousMotionCertified:false,p89Consumer3DAuthorized:false,
   releaseAuthorized:false
  });
 }catch{
  if(originals){
   // Failure should never leave the original photo-source garment geometry
   // in a partial research deformation state.
   try{restore89(originals);}catch{
    // Do not falsely claim an exact rollback; fail actual CI before use.
    return Object.freeze({...fixed({},'P89_ORIGINAL_SOURCE_ROLLBACK_UNVERIFIED'),
     status:'SOURCE_ROLLBACK_UNVERIFIED',sourceGeometryRestored:false,
     p89SourceGapGate:'SOURCE_ROLLBACK_UNVERIFIED'});
   }
  }
  return fixed({},'P89_SOURCE_SHOULDER_GAP_AUDIT_FAILED_CLOSED');
 }
}
