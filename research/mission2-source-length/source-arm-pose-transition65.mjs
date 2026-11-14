/**
 * Closet Current M2-C65: Original licensed photo dress C64 local 3mm
 * fit trial across intermediate REAL 163-bone arm poses.
 * Browser-compatible and source-identifying-free: no Node imports,
 * original photo pixels, source face IDs, or world positions exported.
 *
 * Sampled phases prove ONLY the particular phase points, not continuous
 * swept-volume, true fabric physics, real phone performance or photorealism.
 */
export const ARM_INTERMEDIATE_FRACTIONS65=Object.freeze([.25,.50,.75]);
const deny=reason=>{throw Error('M2 C65 original source sampled arm transition: '+reason);};
export function summarizeSourceArmTransitions65(samples){
 if(!Array.isArray(samples)||samples.length!==6)
  deny('exact three intermediate source arm phases per arm required');
 const out=[];
 for(let armIndex=0;armIndex<2;armIndex++)
  for(let p=0;p<ARM_INTERMEDIATE_FRACTIONS65.length;p++){
   const s=samples[armIndex*3+p];
   if(!s||s.arm!==armIndex||s.phaseFraction!==
      ARM_INTERMEDIATE_FRACTIONS65[p]||
      !Number.isSafeInteger(s.originalBodyStrictPairWitnesses)||
      s.originalBodyStrictPairWitnesses<0||
      !Number.isSafeInteger(s.originalSelfStrictPairWitnesses)||
      s.originalSelfStrictPairWitnesses<0||
      !Number.isSafeInteger(s.fittedBodyStrictPairWitnesses)||
      s.fittedBodyStrictPairWitnesses<0||
      !Number.isSafeInteger(s.fittedSelfStrictPairWitnesses)||
      s.fittedSelfStrictPairWitnesses<0||
      !Number.isSafeInteger(s.originalSignedSourceGarmentFaces)||
      s.originalSignedSourceGarmentFaces<1||
      !Number.isSafeInteger(s.sourceContactFaceCountAfter2mm)||
      s.sourceContactFaceCountAfter2mm<0||
      !Number.isFinite(s.maximumTemporaryWorldDisplacementMeters)||
      s.maximumTemporaryWorldDisplacementMeters<0||
      s.maximumTemporaryWorldDisplacementMeters>.005002||
      typeof s.originalClothFaceShapeGuardPass!=='boolean'||
      s.originalPhotoAnd163BoneBodyContactBudgetsComplete!==true||
      s.noOriginalSourceMeshOrUVOrSkinChanged!==true||
      s.noSourceFaceIdsOrWorldCoordinatesExported!==true||
      s.releaseAuthorized!==false)
    deny('strict authentic source pose/contact/strain counter or no-release invariant invalid');
   out.push(Object.freeze({
    armIndex,phaseFraction:s.phaseFraction,
    originalStrictBodyPairWitnesses:s.originalBodyStrictPairWitnesses,
    sourceDressSelfStrictPairWitnesses:s.originalSelfStrictPairWitnesses,
    fittedSourceBodyStrictPairWitnesses:
     s.fittedBodyStrictPairWitnesses,
    fittedSourceSelfStrictPairWitnesses:
     s.fittedSelfStrictPairWitnesses,
    sourcePhotoClothFaceShapePass:s.originalClothFaceShapeGuardPass,
    sourcePhotoOriginalBodyAndSelfContactBudgetsComplete:
     s.originalPhotoAnd163BoneBodyContactBudgetsComplete,
    originalSignedSourceGarmentFaces:s.originalSignedSourceGarmentFaces,
    originalSourceClothContactFacesAfter2mm:
     s.sourceContactFaceCountAfter2mm,
    maximumTemporaryWorldDisplacementMeters:
     s.maximumTemporaryWorldDisplacementMeters,
    noSourceOriginalOr163BoneRigWritten:true,
    releaseAuthorized:false
   }));
  }
 const sourceFaces=out[0].originalSignedSourceGarmentFaces;
 if(out.some(x=>x.originalSignedSourceGarmentFaces!==sourceFaces))
  deny('source dress identity changed between original actual rig poses');
 const accepted=out.every(x=>
  x.sourcePhotoClothFaceShapePass&&
  x.fittedSourceBodyStrictPairWitnesses===0&&
  x.fittedSourceSelfStrictPairWitnesses===0);
 return Object.freeze({
  schema:'M2-C65-original-public-photo-discrete-intermediate-arm-poses',
  genuineSignedSource163BoneArmCount:2,
  intermediateOriginalSourcePoseSamples:6,
  sampledFractionsPerArm:[...ARM_INTERMEDIATE_FRACTIONS65],
  sourceGarmentOriginalFaceCount:sourceFaces,
  intermediateSamples:out,
  everySampledPoseOriginalPhotoFaceShapeAndStrictContactPass:accepted,
  remainingSourceBodyStrictPairWitnessesAcrossIntermediatePoses:
   out.reduce((sum,x)=>sum+x.fittedSourceBodyStrictPairWitnesses,0),
  anyIntermediatePhotoStrainThresholdFailed:
   out.some(x=>!x.sourcePhotoClothFaceShapePass),
  originalPhotographedGarmentAndSkeletonNeverChanged:true,
  sourcePhotoOriginalUVRestSkinAndJPEGUnchanged:true,
  noIntermediateClothVerticesOrFaceIDsExported:true,
  onlyDiscreteContactSamplesNotSweptContinuousMotion:true,
  neverApproveOwnerPhotoReconstructionOrPhotorealism:true,
  noPhysicalAndroidOrIPhoneDeviceVerified:true,
  noProductionStagingOrHostedSupabaseAccess:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
