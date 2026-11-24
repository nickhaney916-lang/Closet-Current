/**
 * Mission 2: measured garment <-> wearer <-> real licensed 163-bone rig
 * research-only dimensional registration. NO consumer clothing admission.
 *
 * This does NOT replace continuous original mesh contact/drape, approved
 * front/rear silhouettes, camera calibration, garment material, original
 * licensed-rig source hashing or owner authorization. The caller MUST
 * authenticate the source/rule/owner independently, not with input claims.
 *
 * Two physically measured anatomical 3D landmark spans infer a bounded
 * rig-unit->millimetre interval; a THIRD separately measured span is a
 * falsification holdout, not an extra curve-fitting degree of freedom.
 * Directly measured, anatomically matching body & garment circumferences
 * then yield *only* dimensional ease intervals, never a 3D fitted mesh.
 */
const finite = v => typeof v === 'number' && Number.isFinite(v);
const positive = v => finite(v) && v>0;
const isSHA = v => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const isSafeText = v => typeof v === 'string' && v.length>0 && v.length<=100;
const vec3 = v => Array.isArray(v) && v.length===3 &&
  Array.from(v).every(x=>finite(x)&&Math.abs(x)<=10);
const triad = ["height","shoulder","torso"];
const sectionSets=Object.freeze({
 top:["chest","waist"],jacket:["chest","waist"],
 skirt:["waist","hip"],trousers:["waist","hip"],
 dress:["chest","waist","hip"]
});
const distance = (a,b)=>Math.hypot(
 a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const fail = (decision,other={}) => ({
 decision,...other,
 actualOwnerMeasuredPhysicalFitCertified:false,
 actualAvatarMetricScaleIndependentlyCertified:false,
 originalPhotoToBodyGeometryCertified:false,
 garmentToLicensedRigMeshFitted:false,
 garmentBodyContinuousCollisionCleared:false,
 photoAndWearerSideAndRearCertified:false,
 originalPhoto2DFallbackRequired:true,
 consumer3DAdmitted:false,familyAlpha:"HOLD"
});
function segmentShape(s) {
 return s && typeof s==="object" && !Array.isArray(s) &&
  Object.keys(s).sort().join(",")==="landmark,measuredMm,rigA,rigB,uncertaintyMm" &&
  triad.includes(s.landmark) && vec3(s.rigA) && vec3(s.rigB) &&
  positive(s.measuredMm) && s.measuredMm>=50 && s.measuredMm<=2500 &&
  positive(s.uncertaintyMm) &&
  s.uncertaintyMm>=.2 &&
  s.uncertaintyMm<=Math.min(50,s.measuredMm*.05) &&
  distance(s.rigA,s.rigB)>=.02 &&
  distance(s.rigA,s.rigB)<=5;
}
function interval(s){
 const u=distance(s.rigA,s.rigB);
 return [(s.measuredMm-s.uncertaintyMm)/u,
         (s.measuredMm+s.uncertaintyMm)/u];
}
function sectionValid(s){
 return s && typeof s==="object" && !Array.isArray(s) &&
  Object.keys(s).sort().join(",")==="bodyCircumferenceMm,bodyUncertaintyMm,garmentCircumferenceMm,garmentUncertaintyMm,landmark,measuredAsCompleteClosedCircumference" &&
  ["chest","waist","hip"].includes(s.landmark) &&
  s.measuredAsCompleteClosedCircumference === true &&
  positive(s.bodyCircumferenceMm)&&s.bodyCircumferenceMm>=200&&
  s.bodyCircumferenceMm<=2500 &&
  positive(s.garmentCircumferenceMm)&&s.garmentCircumferenceMm>=200&&
  s.garmentCircumferenceMm<=3000 &&
  finite(s.bodyUncertaintyMm)&&s.bodyUncertaintyMm>=.2&&
  s.bodyUncertaintyMm<=Math.min(40,s.bodyCircumferenceMm*.05)&&
  finite(s.garmentUncertaintyMm)&&s.garmentUncertaintyMm>=.2&&
  s.garmentUncertaintyMm<=Math.min(40,s.garmentCircumferenceMm*.05);
}
/**
 * Inputs are anonymous measurements in tests. No private measurements should
 * ever be sent to public GitHub issues/logs or bundled in the consumer app.
 * A boolean "independently verified" in JSON does not constitute authority.
 */
export function assessMetricGarmentToWearerFit({
 source,independentSourceWitness,
 licensedRig,independentRigWitness,
 measurements,measurementTrust
}={}){
 if(!source || !independentSourceWitness ||
   !isSHA(source.originalPhotoSHA256) ||
   !isSHA(independentSourceWitness.originalPhotoSHA256) ||
   source.originalPhotoSHA256!==independentSourceWitness.originalPhotoSHA256 ||
   source.imageId!==independentSourceWitness.imageId ||
   independentSourceWitness.originalBytesRehashedByNativeCaller!==true ||
   !Number.isSafeInteger(source.imageId) || source.imageId<=0)
  return fail("BLOCKED_ORIGINAL_GARMENT_SOURCE_IDENTITY_MISSING");
 if(!licensedRig||!independentRigWitness||
  !["female","male"].includes(licensedRig.kind) ||
  licensedRig.kind!==independentRigWitness.kind ||
  !isSHA(licensedRig.sha256) ||
  licensedRig.sha256!==independentRigWitness.sha256 ||
  licensedRig.actualOriginalBoneCount!==163 ||
  independentRigWitness.actualOriginalBoneCount!==163 ||
  independentRigWitness.originalSourceRigBytesVerifiedByNativeCaller!==true ||
  independentRigWitness.actualOriginalRigSourcePositionsVerified!==true)
  return fail("BLOCKED_GENUINE_LICENSED_RIG_PROVENANCE_MISSING");
 if(!measurements)
  return fail("BLOCKED_NO_REAL_GARMENT_OR_WEARER_MEASUREMENTS",{
   actualLicensed163BoneRigKind:licensedRig.kind,
   sourceImageId:source.imageId,
   licensedOriginalRigNotPhysicalWearerMeasurement:true
  });
 if(!measurementTrust ||
  !isSHA(measurements.sourcePhotoSHA256)||
  !isSHA(measurements.originalRigSHA256)||
  measurements.sourcePhotoSHA256!==source.originalPhotoSHA256 ||
  measurements.originalRigSHA256!==licensedRig.sha256 ||
  measurements.sourcePhotoSHA256!==measurementTrust.sourcePhotoSHA256 ||
  measurements.originalRigSHA256!==measurementTrust.originalRigSHA256 ||
  !isSafeText(measurements.sourceRevision) ||
  measurements.sourceRevision!==measurementTrust.sourceRevision ||
  measurementTrust.activeOwnerLeaseVerifiedByTrustedCaller!==true ||
  measurementTrust.independentlyAuthenticatedMeasurementSpecimens!==true)
  return fail("BLOCKED_OWNER_SOURCE_RIG_AND_MEASUREMENTS_NOT_AUTHENTICATED");
 const kind=measurements.garmentType;
 if(!Object.hasOwn(sectionSets,kind))
  return fail("BLOCKED_UNSUPPORTED_MEASURED_GARMENT_TYPE");
 const anchors=measurements.rigMetricAnchors;
 const holdout=measurements.rigMetricIndependentHoldout;
 if(!Array.isArray(anchors)||anchors.length!==2 ||
  !Array.from(anchors).every(segmentShape)||!segmentShape(holdout) ||
  new Set([...anchors.map(x=>x.landmark),holdout.landmark]).size!==3)
  return fail("BLOCKED_MISSING_DISTINCT_REAL_BODY_RIG_LANDMARKS");
 if(anchors.some(x=>JSON.stringify(x.rigA)===JSON.stringify(x.rigB)))
  return fail("BLOCKED_DEGENERATE_REAL_BODY_LANDMARK");
 // Different labels cannot make the same unordered geometric endpoints
 // independent observations. A shared single endpoint is allowed.
 const spanKey=s=>[JSON.stringify(s.rigA),JSON.stringify(s.rigB)].sort().join('|');
 if(new Set([...anchors,holdout].map(spanKey)).size!==3)
  return fail("BLOCKED_REUSED_RIG_LANDMARK_SPAN");
 const [a,b]=anchors.map(interval);
 const lower=Math.max(a[0],b[0]),upper=Math.min(a[1],b[1]);
 if(!finite(lower)||!finite(upper)||lower<=0||lower>upper||
  lower<20||upper>5000)
  return fail("BLOCKED_CONTRADICTORY_RIG_METRIC_ANCHORS",{
   anchorScaleIntervalsMmPerRigUnit:[a,b]
  });
 const holdoutInterval=interval(holdout);
 const compatible=holdoutInterval[0]<=upper&&
  holdoutInterval[1]>=lower;
 if(!compatible)
  return fail("BLOCKED_INDEPENDENT_WEARER_RIG_HOLDOUT_CONTRADICTION",{
   anchorIntersectionMmPerRigUnit:[lower,upper],
   holdoutScaleIntervalMmPerRigUnit:holdoutInterval
  });
 const sections=measurements.physicalCircumferenceSections;
 if(!Array.isArray(sections)||sections.length!==sectionSets[kind].length||
  !Array.from(sections).every(sectionValid)||
  sections.some((s,i)=>s.landmark!==sectionSets[kind][i]))
  return fail("BLOCKED_MISSING_DIRECT_MEASURED_MATCHED_BODY_GARMENT_SECTIONS",{
   expectedAnatomicalSections:sectionSets[kind]
  });
 const fit=sections.map(s=>{
  const lo=s.garmentCircumferenceMm-s.garmentUncertaintyMm-
   (s.bodyCircumferenceMm+s.bodyUncertaintyMm),
   hi=s.garmentCircumferenceMm+s.garmentUncertaintyMm-
   (s.bodyCircumferenceMm-s.bodyUncertaintyMm);
  return {landmark:s.landmark,
   minimumPossibleEaseMm:lo,
   maximumPossibleEaseMm:hi,
   classification:hi<0?"MEASURED_DIMENSIONAL_DEFICIT_REQUIRES_STRETCH_OR_CHANGE":
    lo<=0?"MEASURED_CLEARANCE_UNCERTAIN":
     "MEASURED_CIRCUMFERENCE_CLEARANCE_POSSIBLE_NOT_FIT",
   trueThreeDimensionalDrapeOrGarmentFitProved:false
  };
 });
 const deficits=fit.filter(x=>x.maximumPossibleEaseMm<0).map(x=>x.landmark);
 return fail(deficits.length?
  "BLOCKED_MEASURED_GARMENT_DIMENSIONAL_DEFICIT":
  "BLOCKED_REAL_WORLD_METRIC_FIT_REQUIRES_APPROVED_CONTACT_AND_DRAPE",{
  metricRigScaleIntervalMmPerRigUnit:[lower,upper],
  independentlyMeasuredThirdLandmarkScaleIntervalMmPerRigUnit:holdoutInterval,
  directCircumferenceMeasurementsOnly:true,
  conditionalMeasuredGarmentBodyEase:fit,
  anatomicalSectionsWithDefiniteMeasuredDeficit:deficits,
  measurementNumbersSelfReportedAndNotProofOfRealWorldIndependentMeasurement:true,
  actualMeasuredGarmentDepthAndPatternPanelGeometryUnknown:true,
  independentlyObservedSourcePhotoPlaneAndCameraStillRequired:true,
  noFabricElasticityOrLayerStackAssumed:true,
  fitted3DGeometry:null
 });
}
