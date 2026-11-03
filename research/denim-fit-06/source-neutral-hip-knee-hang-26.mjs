/**
 * DENIM-ANATOMICAL-HANG-26 — research-only, source-neutral hip-to-knee
 * cloth settling. This is a modelled rest fit on genuine 163-bone denim,
 * NOT an observed rear photograph, tailored pattern, or cloth simulation.
 *
 * P14/P15/P16/P20 already have source-authenticated hip/knee landmarks and
 * independent rear-sewn garment rows. This bounded, nonperiodic envelope
 * adds a slight anatomically plausible hanging rear/side contour there.
 * Caller MUST protect the photographed front and original JPEG, source UV,
 * rest coordinates, normals source, skinning, owner, and source SHA.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{
 const t=clamp((v-a)/(b-a),0,1);
 return t*t*(3-2*t);
};
export const DENIM_ANATOMICAL_HANG26=Object.freeze({
 maxRearMeters:.0042,maxSideMeters:.0012,maxVerticalMeters:.0022,
 maximumTotalLocalShiftMeters:.024,
 frontPhotographUnmodified:true,
 sourceSHA256Unmodified:true,
 modelledRearNotPhotographed:true,
 usesOriginal163BoneLandmarks:true,
 ownerPrivate:true,
 physicalPhonesApproved:false,
 humanPhotorealismApproved:false,
 releaseAuthorized:false,
 familyAlpha:'HOLD'
});

/**
 * Phase=0 is actual skinned knee, phase=1 is actual skinned hip. Smooth
 * zero-displacement boundaries retain both knee seam/hip waist anchor rows.
 * Rearward ease is outward (negative model z), never toward the body.
 * A small side component follows the native per-leg lateral outward sign.
 * Gravity component is downward, not a periodic wave/wrinkle texture.
 * Return only finite metre offsets, never a geometry or image.
 */
export function sourceNeutralHipKneeHang26(phase,side){
 if(!Number.isFinite(phase)||phase<0||phase>1||
    !Number.isInteger(side)||(side!==0&&side!==1))
  throw Error('P26 requires the actual 163-bone source verified hip/knee phase and leg side');
 if(phase<=.12||phase>=.89)
  return Object.freeze({rearMeters:0,sideMeters:0,dropMeters:0,modeledUnphotographed:true});
 const envelope=smooth(.12,.35,phase)*(1-smooth(.63,.89,phase));
 return Object.freeze({
  rearMeters:DENIM_ANATOMICAL_HANG26.maxRearMeters*envelope,
  sideMeters:DENIM_ANATOMICAL_HANG26.maxSideMeters*envelope*(side===0?1:.96),
  dropMeters:DENIM_ANATOMICAL_HANG26.maxVerticalMeters*envelope,
  modeledUnphotographed:true
 });
}
