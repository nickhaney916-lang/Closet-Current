/**
 * DENIM-SEAM-FLOW-28 research-only anatomical side-seam rest shape.
 * This operates ONLY on existing authenticated ORIGINAL-source-neutral
 * independently sewn rear/side thigh rows. There is no new photograph,
 * shader/texture, user data, cloth simulation or inferred pocket detail.
 *
 * Phase 0=actual skinned knee, 1=actual skinned hip, using verified 163-bone
 * source anatomy. lateralMeters is an outward contour ease; rearReleaseMeters
 * pulls back an over-round MODELED posterior volume (toward the body).
 * The caller must retain a <=24 mm total local-fit displacement budget and
 * separately perform actual BVH body contact + full photographed front checks.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,v)=>{
 const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);
};
export const DENIM_SEAM_FLOW28=Object.freeze({
 maxLateralMeters:.0085,
 maxRearReleaseMeters:.0044,
 maxTotalLocalShiftMeters:.024,
 sourceRGBUnmodified:true,
 originalJPEGCutoutSHAUnmodified:true,
 photographFrontVerticesUnchanged:true,
 modelledSideRearNotPhotographed:true,
 physicalPhonesTested:false,humanPhotorealismApproved:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
export function sourceNeutralSideSeamFlow28(phase,side,lateralDistanceMeters){
 if(!Number.isFinite(phase)||phase<0||phase>1||
  !Number.isInteger(side)||(side!==0&&side!==1)||
  !Number.isFinite(lateralDistanceMeters)||lateralDistanceMeters<0||
  lateralDistanceMeters>.29)
  throw Error('P28 requires authentic 163-bone hip/knee phase, side and lateral distance');
 if(phase<=.12||phase>=.90)
  return Object.freeze({lateralMeters:0,rearReleaseMeters:0,modelledNotPhotographed:true});
 // A SINGLE broad fabric weight distribution, not repetitive fake folds.
 // The seam-side portion is eased outward more than inner rear cloth.
 const envelope=smooth(.12,.39,phase)*(1-smooth(.66,.90,phase));
 const sideWeight=.35+.65*smooth(.018,.115,lateralDistanceMeters);
 return Object.freeze({
  lateralMeters:DENIM_SEAM_FLOW28.maxLateralMeters*envelope*sideWeight,
  rearReleaseMeters:DENIM_SEAM_FLOW28.maxRearReleaseMeters*envelope*sideWeight,
  modelledNotPhotographed:true
 });
}
