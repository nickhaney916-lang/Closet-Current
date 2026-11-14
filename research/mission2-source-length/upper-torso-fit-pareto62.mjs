/**
 * P2-C62: read-only source-authentic world-space fit amplitude screening.
 * This code executes in Chromium or Node, with no Node-only runtime modules.
 * It NEVER writes the photographed garment, bone rig, owner data, source UV
 * or texture. A numerically passing candidate remains NOT release-ready.
 */
import {createDisposableUpperTorsoWorldTrial60}
 from './upper-torso-clearance-trial60.mjs';
import {measureDisposableSourceSurfaceStrain61}
 from './upper-torso-surface-quality61.mjs';
export const FIT_AMPLITUDES62=Object.freeze([.001,.002,.003,.004,.005,.006]);
const deny=(s)=>{throw Error('M2 C62 original public-photo source candidate refused: '+s);};
const sourceIntact=(before,after)=>
 before.length===after.length&&before.every((v,i)=>v===after[i]);
export function screenDisposableSourceFitAmplitudes62({
 originalWorld,indices=null,neck,spine,baselineBodyStrict,
 baselineSelfStrict,evaluateCandidate
}={}){
 if(!(originalWorld instanceof Float32Array)||
    !Number.isSafeInteger(baselineBodyStrict)||baselineBodyStrict<0||
    !Number.isSafeInteger(baselineSelfStrict)||baselineSelfStrict<0||
    typeof evaluateCandidate!=='function')
  deny('complete authentic original source body/self witness and evaluator required');
 const preserved=originalWorld.slice();
 const rows=[];let scans=0;
 for(const outwardMeters of FIT_AMPLITUDES62){
  const trial=createDisposableUpperTorsoWorldTrial60(originalWorld,{
   neck,spine,outwardMeters
  });
  const strain=measureDisposableSourceSurfaceStrain61(
   originalWorld,trial.world,indices);
  if(strain.signedOriginalSourceFacesAnalyzed<1||
     trial.originalPhotographedSourceMeshChanged!==false||
     trial.originalPhotoOrShaderTextureChanged!==false)
   deny('source photo and face provenance check incomplete');
  let verdict=null;
  if(strain.provisionalMeshDistortionGuardPassed){
   const v=evaluateCandidate(trial.world,outwardMeters);
   scans++;
   if(!v||typeof v!=='object'||typeof v.bodyComplete!=='boolean'||
      typeof v.selfComplete!=='boolean'||
      !Number.isSafeInteger(v.bodyStrict)||v.bodyStrict<0||
      !Number.isSafeInteger(v.selfStrict)||v.selfStrict<0)
    deny('full original-body and fabric-self contact evaluator must report authentic counts');
   verdict={
    sourceBodyAndSelfFullyMeasured:v.bodyComplete&&v.selfComplete,
    bodyStrictWitnesses:v.bodyStrict,
    selfStrictWitnesses:v.selfStrict,
    sampledBodyStrictChange:v.bodyComplete?
     v.bodyStrict-baselineBodyStrict:null,
    sampledSelfStrictChange:v.selfComplete?
     v.selfStrict-baselineSelfStrict:null,
    originalBodyAndSelfCrossingsFullyGone:
     v.bodyComplete&&v.selfComplete&&v.bodyStrict===0&&v.selfStrict===0
   };
  }
  rows.push({
   outwardMeters,
   originalSourceFaces:strain.signedOriginalSourceFacesAnalyzed,
   actualSourceVerticesMoved:trial.movedVertices,
   greatestTemporaryDisplacementMeters:trial.maxAppliedMeters,
   maxSourceEdgeStrain:strain.maxOriginalPhotoWorldEdgeRelativeStrain,
   maxSourceFaceAreaDrift:strain.maxOriginalPhotoFaceAreaRelativeChange,
   maximumOriginalFaceNormalTurnDegrees:strain.maxOriginalPhotoFaceNormalTurnDegrees,
   sourceFacesWithOver5PercentEdgeStrain:strain.facesWithMaxEdgeStrainAbove5Percent,
   sourceFacesWithOver10PercentAreaDrift:strain.facesWithAreaChangeAbove10Percent,
   sourceFaceNormalsFlipped:strain.facesWithReversedOrientation,
   sourceFacesCollapsedOrDegenerate:strain.sourceFacesDegenerateOrCollapsed,
   preliminarySourceShapeGuardPassed:strain.provisionalMeshDistortionGuardPassed,
   actualBodyContactTestPerformed:verdict!==null,
   ...(verdict||{}),
   excludedFromBodyContactIfDistorting:
    !strain.provisionalMeshDistortionGuardPassed,
   originalPhotographedSourceVertexPositionEdited:false,
   humanPhotorealisticWearabilityCertified:false,
   releaseAuthorized:false
  });
  if(!sourceIntact(originalWorld,preserved))
   deny('genuine original source mutated during disposable amplitude sweep');
 }
 const originalAuditedFaces=rows[0].originalSourceFaces;
 if(rows.some(r=>r.originalSourceFaces!==originalAuditedFaces))
  deny('source photographic geometry changed across screened amplitudes');
 const candidates=rows.filter(r=>
  r.preliminarySourceShapeGuardPassed&&
  r.sourceBodyAndSelfFullyMeasured===true&&
  r.originalBodyAndSelfCrossingsFullyGone===true);
 // First valid = SMALLEST world displacement due to ascending amplitude
 // order. Even a found candidate has no permission to change any garment.
 const lowest=candidates[0]||null;
 return Object.freeze({
  schema:'M2-C62-original-licensed-source-body-clearance-vs-strain-amplitude-sweep',
  actualOriginalSourceFaces:originalAuditedFaces,
  testedConservativeTorsoOutwardAmplitudesMeters:[...FIT_AMPLITUDES62],
  sourceGeometryShapeQualityPrechecks:rows.length,
  completeBodyAndSelfContactAnalysesPerformed:scans,
  perCandidate:rows,
  anySampledPoseStrictBodyAndSelfClearanceCandidate:
   !!lowest,
  smallestSampledClearanceCandidateMeters:lowest?.outwardMeters??null,
  originalSourcePhotoWorldBufferUntouched:
   sourceIntact(originalWorld,preserved),
  originalPhotoShaderUVSkinBoneAndMaterialsUnmodified:true,
  noOriginalPhotoBytesOrSourceVertexCoordinatesExported:true,
  sourceCandidateNotRenderedAndNotWearabilityCertified:true,
  shapeThresholdsNotHumanMaterialValidation:true,
  noContinuousClothCollisionApproval:true,
  noProductionStagingSupabaseOrOwnerWardrobeWrite:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
