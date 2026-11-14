/** Whole-source radial scale screening. Temporary world buffers only.
 * Tests a different hypothesis from the height-feathered C60 displacement:
 * constant scale avoids the large gradient at the torso feather boundary.
 * This is size estimation, NOT source-measured garment size or a render fit.
 */
import {measureDisposableSourceSurfaceStrain61} from '../mission2-source-length/upper-torso-surface-quality61.mjs';
import {measurePrincipalStretch86} from './surface-metric.mjs';
export const RADIAL_SCALES86=Object.freeze([1.015,1.025,1.035,1.045]);
export function screenRadialFit86({original,indices=null,spine,evaluate}={}){
 if(!(original instanceof Float32Array)||original.length<9||original.length%3||!original.every(Number.isFinite)||
  !Array.isArray(spine)||spine.length!==3||!spine.every(Number.isFinite)||typeof evaluate!=='function')throw Error('complete source and anatomy required');
 const saved=original.slice(),faces=indices??Uint32Array.from({length:original.length/3},(_,i)=>i),rows=[];
 for(const scale of RADIAL_SCALES86){
  const candidate=original.slice();let maxMeters=0;
  for(let i=0;i<candidate.length;i+=3){
   candidate[i]=spine[0]+(original[i]-spine[0])*scale;
   candidate[i+2]=spine[2]+(original[i+2]-spine[2])*scale;
   maxMeters=Math.max(maxMeters,Math.hypot(candidate[i]-original[i],candidate[i+2]-original[i+2]));
  }
  const shape=measureDisposableSourceSurfaceStrain61(original,candidate,indices);
  const principal=measurePrincipalStretch86({original,candidate,indices:faces});
  const quality=shape.provisionalMeshDistortionGuardPassed&&principal.degenerateTriangles===0&&principal.trianglesOver5PercentPrincipalStrain===0;
  const measured=quality?evaluate(candidate):null;
  if(measured&&(!['bodyComplete','selfComplete'].every(k=>typeof measured[k]==='boolean')||
   !['bodyStrict','selfStrict'].every(k=>Number.isSafeInteger(measured[k])&&measured[k]>=0)))throw Error('complete body/self result required');
  if(!original.every((v,i)=>v===saved[i]))throw Error('original source changed');
  rows.push({scale,maxDisplacementMeters:maxMeters,shape,principal,sourceShapeGuardPassed:quality,
   contactMeasured:measured!==null,contact:measured,
   sampledNumericalClearance:quality&&measured?.bodyComplete===true&&measured?.selfComplete===true&&measured.bodyStrict===0&&measured.selfStrict===0,
   estimatedGarmentSizeNotPhotographMeasured:true,candidateRendered:false,releaseAuthorized:false});
 }
 return {schema:'M2-P86-global-radial-source-scale-screen',rows,
  anySampledNumericalClearance:rows.some(r=>r.sampledNumericalClearance),originalSourceUnchanged:true,
  textureProjectionVerified:false,continuousMotionVerified:false,consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'};
}
