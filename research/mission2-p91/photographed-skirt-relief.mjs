/**
 * Mission 2 P91 — isolated HYPOTHESIS for better original-photo skirt fall.
 * Does not infer source depth, physical folds or hidden back from one image.
 * Geometry is measured from the actual posed, licensed dress skirt boundary,
 * then a sub-5 mm smooth five-lobe hem relief is proposed only on its bottom
 * portion. Original photograph, UV/projection, bone weights, and body NEVER
 * change here. P88/P89/P90 strict contact+source strain gates must recheck
 * the actual 163-bone SkinnedMesh after use; no consumer integration.
 */
export const SOURCE_SKIRT91=Object.freeze({
 schema:'M2-P91-original-source-skirt-hem-fall-experimental-hypothesis',
 amplitudeMeters:.0035,
 maxAllowedAmplitudeMeters:.0045,
 lobes:5,
 phaseRadians:.65,
 waistAtFractionOfActualGarmentHeight:.48,
 hemVerticalComponentFraction:.22,
 releaseAuthorized:false,
 familyAlpha:'HOLD'
});
const invalid=x=>typeof x!=='number'||!Number.isFinite(x);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const clamp01=t=>Math.min(1,Math.max(0,t));
export function calculateSourceSkirtRelief91({
 x,y,z,centerX,centerZ,hemY,waistY,
 amplitudeMeters=SOURCE_SKIRT91.amplitudeMeters,
 lobes=SOURCE_SKIRT91.lobes,
 phaseRadians=SOURCE_SKIRT91.phaseRadians
}={}){
 if([x,y,z,centerX,centerZ,hemY,waistY,amplitudeMeters,lobes,phaseRadians].some(invalid)||
    amplitudeMeters<0||amplitudeMeters>SOURCE_SKIRT91.maxAllowedAmplitudeMeters||
    !Number.isInteger(lobes)||lobes<3||lobes>7||
    waistY-hemY<.12||waistY-hemY>1.4||
    Math.abs(phaseRadians)>Math.PI*2)
  throw Error('P91 source measured skirt band/amplitude/bone-landmark invalid');
 const t=clamp01((waistY-y)/(waistY-hemY));
 // C1 continuous at the anchored waist and hem, never touches the bodice.
 const fall=t*t*(3-2*t);
 const vx=x-centerX,vz=z-centerZ;
 const radius=Math.hypot(vx,vz);
 if(radius<.035||!finite(radius))return Object.freeze({
  dx:0,dy:0,dz:0,fall:0,magnitudeMeters:0
 });
 const angle=Math.atan2(vz,vx);
 const phase=lobes*angle+phaseRadians;
 const radialDelta=amplitudeMeters*fall*Math.sin(phase);
 const verticalDelta=amplitudeMeters*SOURCE_SKIRT91.hemVerticalComponentFraction*
  fall*Math.cos(phase);
 const dx=radialDelta*vx/radius;
 const dz=radialDelta*vz/radius;
 const magnitudeMeters=Math.hypot(dx,verticalDelta,dz);
 if(!finite(magnitudeMeters)||
    magnitudeMeters>amplitudeMeters*1.025+1e-12)
  throw Error('P91 source skirt envelope bound exceeded');
 return Object.freeze({dx,dy:verticalDelta,dz,fall,magnitudeMeters});
}
export function deriveSourceSkirtBand91({hemY,topY}={}){
 if(!finite(hemY)||!finite(topY)||topY-hemY<.35||
    topY-hemY>2)
  throw Error('P91 authenticated actual photographed vertical garment dimensions invalid');
 return Object.freeze({
  hemY,
  waistY:hemY+(topY-hemY)*SOURCE_SKIRT91.waistAtFractionOfActualGarmentHeight,
  sourceBandMeasured:true,
  originalSourcePhotoDrapeCertified:false,
  hiddenSourceDepthKnown:false,
  originalPhotoAndAnatomicalSkeletonUnaffected:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
