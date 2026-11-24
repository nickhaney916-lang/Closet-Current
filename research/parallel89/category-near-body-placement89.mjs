/** Conservative research-only camera-axis approach. This does not dress a
 * body: it reduces a floating proxy's gap without changing source shape.
 * A bound over ALL body faces overlapping the garment XY bounding rectangle
 * ensures a positive Z-axis separation throughout the attempted translation.
 */
import {auditCategoryStaticContact89} from './category-static-body-contact89.mjs';
const hold={physicalFitProved:false,consumer3DAdmitted:false,signedOutsideBodyProved:false,originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD',releaseAuthorized:false};
const deny=(reason,other={})=>({status:'NEAR_BODY_APPROACH_BLOCKED',reason,...other,...hold});
export function approachCategoryBody89(input){
 try{
  const {bodyPositions:b,bodyIndices:bi,sourcePositions:s,sourceIndices:si,scale,translation}=input;
  const baseline=auditCategoryStaticContact89(input);
  if(baseline.status!=='NO_DISCRETE_SURFACE_CONTACT_DETECTED')return deny('baseline-not-discrete-clear',{baseline:baseline.status});
  let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity,zmin=Infinity;
  for(let i=0;i<s.length;i+=3){const x=s[i]*scale+translation[0],y=s[i+1]*scale+translation[1],z=s[i+2]*scale+translation[2];xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);zmin=Math.min(zmin,z);}
  let bodyZ=-Infinity,overlappingBodyFaces=0;
  for(let i=0;i<bi.length;i+=3){
   const a=bi[i]*3,c=bi[i+1]*3,d=bi[i+2]*3;
   if(Math.max(b[a],b[c],b[d])<xmin||Math.min(b[a],b[c],b[d])>xmax||
      Math.max(b[a+1],b[c+1],b[d+1])<ymin||Math.min(b[a+1],b[c+1],b[d+1])>ymax)continue;
   overlappingBodyFaces++;bodyZ=Math.max(bodyZ,b[a+2],b[c+2],b[d+2]);
  }
  if(!overlappingBodyFaces)return deny('no-projected-body-overlap');
  let lo=Infinity,hi=-Infinity;for(let i=1;i<b.length;i+=3){lo=Math.min(lo,b[i]);hi=Math.max(hi,b[i]);}
  const margin=Math.max(1e-6,(hi-lo)*.005),before=zmin-bodyZ;
  if(!(before>margin+1e-6))return deny('no-conservatively-safe-inward-travel',{initialConservativeGap:before,margin,overlappingBodyFaces});
  const shift=before-margin,newTranslation=[translation[0],translation[1],translation[2]-shift];
  const corrected=auditCategoryStaticContact89({...input,translation:newTranslation});
  if(corrected.status!=='NO_DISCRETE_SURFACE_CONTACT_DETECTED')return deny('corrected-placement-not-discrete-clear',{baseline:baseline.status,corrected:corrected.status});
  const after=zmin-shift-bodyZ;
  if(!(after>0&&after<before))return deny('invalid-gap-improvement');
  return {status:'CONSERVATIVE_CAMERA_AXIS_APPROACH_RESEARCH_ONLY',translation:newTranslation,scale,
   initialConservativeGap:before,finalConservativeGap:after,shift,margin,overlappingBodyFaces,
   bodyFacesAudited:bi.length/3,garmentFacesAudited:si.length/3,baseline:baseline.status,corrected:corrected.status,
   positiveAxisSeparationForWholeTranslation:true,sourceGeometryUnmodified:true,
   gapIsConservativeXYRectangleBoundNotActualClothEase:true,...hold};
 }catch{return deny('invalid-or-incomplete-contact-input');}
}
