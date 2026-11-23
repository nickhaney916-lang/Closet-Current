/**
 * Mission 2 research: five-measurement planar photo reference consistency.
 *
 * A true measured flat rectangular fiducial can define a projective
 * image-pixel -> mm mapping on THAT reference plane. Four corners determine
 * a homography; a fifth independently measured point can falsify it.
 *
 * Does NOT measure cloth surface depth, contact, source body shape, camera
 * intrinsics/extrinsics, or how an actual garment has been fitted to a rig.
 * A JSON caller's self-attested source digest/provenance is NEVER independent
 * source or measurement authentication. Do not deploy into consumer app.
 */
const isNumber=v=>typeof v==='number'&&Number.isFinite(v);
const isPos=v=>isNumber(v)&&v>0;
const exact=(value,keys)=>value&&typeof value==='object'&&
 !Array.isArray(value)&&Object.keys(value).length===keys.length&&
 keys.every(k=>Object.hasOwn(value,k));
const sha=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const point=v=>Array.isArray(v)&&v.length===2&&v.every(isNumber);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-
 (b[1]-a[1])*(c[0]-a[0]);
const blocked=(reason,details={})=>({
 status:'NOT_PHYSICALLY_CALIBRATED',
 reason,...details,
 originalGarmentPhysicalPixelScaleMmPerPixel:null,
 photographedGarmentToAvatarRigUnitsPerMillimeter:null,
 measuredWearerBodyGeometryAvailable:false,
 approvedSourcePhotoGarmentMaskAvailable:false,
 photographedGarmentOriginalReverseObserved:false,
 independentMeasuredRealWorldSourceGeometryCertified:false,
 consumer3DAdmitted:false,
 originalPhoto2DFallbackRequired:true,
 familyAlpha:'HOLD'
});
function solveLinear(A,b){
 // Scaled normalized pixel and physical dimensions keep realistic inputs
 // O(1), unlike a raw 8x8 homography with huge pixel-mm cross terms.
 const n=b.length,mat=A.map((r,i)=>[...r,b[i]]);
 for(let j=0;j<n;j++){
  let pivot=j;
  for(let k=j+1;k<n;k++)
   if(Math.abs(mat[k][j])>Math.abs(mat[pivot][j]))pivot=k;
  if(!isNumber(mat[pivot][j])||Math.abs(mat[pivot][j])<1e-11)
   return null;
  if(pivot!==j)[mat[j],mat[pivot]]=[mat[pivot],mat[j]];
  const p=mat[j][j];
  for(let k=j;k<=n;k++)mat[j][k]/=p;
  for(let i=0;i<n;i++)if(i!==j){
   const scale=mat[i][j];
   for(let k=j;k<=n;k++)mat[i][k]-=scale*mat[j][k];
  }
 }
 const x=mat.map(r=>r[n]);
 return x.every(isNumber)&&x.every(v=>Math.abs(v)<1e7)?x:null;
}
function mapping(corners,photo,reference){
 const width=photo.width,height=photo.height,
  physical=[[0,0],[1,0],[1,1],[0,1]],
  A=[],rhs=[];
 for(let i=0;i<4;i++){
  const [u,v]=[corners[i][0]/width,corners[i][1]/height],
   [x,y]=physical[i];
  A.push([u,v,1,0,0,0,-x*u,-x*v]);
  A.push([0,0,0,u,v,1,-y*u,-y*v]);
  rhs.push(x,y);
 }
 const h=solveLinear(A,rhs);
 if(!h)return null;
 const project=(p)=>{
  const u=p[0]/width,v=p[1]/height,
   den=h[6]*u+h[7]*v+1;
  if(!isNumber(den)||Math.abs(den)<1e-8)return null;
  const x=(h[0]*u+h[1]*v+h[2])/den,
   y=(h[3]*u+h[4]*v+h[5])/den;
  const m=[x*reference.widthMm,y*reference.heightMm];
  return m.every(isNumber)?m:null;
 };
 return {h,project};
}
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function withinQuad(p,q){
 const s=Math.sign(cross(q[0],q[1],q[2]));
 if(s===0)return false;
 return q.every((v,i)=>s*cross(v,q[(i+1)%4],p)>1e-7);
}
export function evaluateFivePointPlanarReference({
 photo,trustedOriginal,reference,review,measurementClass='unverified'
}={}){
 // Caller MUST supply freshly rehashed JPEG metadata, not imported JSON.
 // This consistency check does not independently rehash or authenticate it.
 const fields=['sha256','width','height','orientation'];
 if(!exact(photo,fields)||!exact(trustedOriginal,[...fields,'originalBytesRehashedByIndependentCaller'])||
  !sha(photo.sha256)||!sha(trustedOriginal.sha256)||
  photo.sha256!==trustedOriginal.sha256||
  !Number.isSafeInteger(photo.width)||!Number.isSafeInteger(photo.height)||
  photo.width<160||photo.width>12000||photo.height<160||photo.height>12000||
  photo.width*photo.height>48e6||
  fields.some(k=>photo[k]!==trustedOriginal[k])||
  trustedOriginal.originalBytesRehashedByIndependentCaller!==true)
  return blocked('BLOCKED_ORIGINAL_PHOTO_SOURCE_IDENTITY_NOT_ATTESTED');
 if(photo.orientation!==1)
  return blocked('BLOCKED_UNMAPPED_EXIF_IMAGE_COORDINATES');
 if(!exact(review,['oneGarment','flatReferenceAndGarment',
   'allEdgesVisible','referenceCoplanarWithGarment'])||
  !Object.values(review).every(v=>typeof v==='boolean'))
  return blocked('BLOCKED_MISSING_PHOTO_AND_PLANE_REVIEW');
 if(Object.values(review).some(v=>v!==true))
  return blocked('BLOCKED_PHYSICAL_PLANE_OR_GARMENT_REVIEW_INCOMPLETE');
 if(!exact(reference,['widthMm','heightMm','widthUncertaintyMm',
   'heightUncertaintyMm','cornersPx','holdout'])||
  !isPos(reference.widthMm)||!isPos(reference.heightMm)||
  reference.widthMm<50||reference.widthMm>1000||
  reference.heightMm<50||reference.heightMm>1000||
  reference.widthMm/reference.heightMm>4||
  reference.heightMm/reference.widthMm>4||
  !isPos(reference.widthUncertaintyMm)||!isPos(reference.heightUncertaintyMm)||
  reference.widthUncertaintyMm>Math.min(10,reference.widthMm*.05)||
  reference.heightUncertaintyMm>Math.min(10,reference.heightMm*.05)||
  !Array.isArray(reference.cornersPx)||reference.cornersPx.length!==4||
  !reference.cornersPx.every(point)||
  !exact(reference.holdout,['pixel','positionMm','positionUncertaintyMm','pixelUncertaintyPx'])||
  !point(reference.holdout.pixel)||!point(reference.holdout.positionMm)||
  !isPos(reference.holdout.positionUncertaintyMm)||
  reference.holdout.positionUncertaintyMm>5||
  !isPos(reference.holdout.pixelUncertaintyPx)||
  reference.holdout.pixelUncertaintyPx>3)
  return blocked('BLOCKED_MISSING_OR_INVALID_INDEPENDENT_FIDUCIAL');
 const imageBounds=p=>p[0]>=2&&p[0]<=photo.width-3&&
  p[1]>=2&&p[1]<=photo.height-3;
 if(!reference.cornersPx.every(imageBounds)||!imageBounds(reference.holdout.pixel))
  return blocked('BLOCKED_TRUNCATED_OR_OUT_OF_FRAME_FIDUCIAL');
 const q=reference.cornersPx,h=reference.holdout;
 const area=q.reduce((a,p,i)=>a+p[0]*q[(i+1)%4][1]-
  p[1]*q[(i+1)%4][0],0)*.5;
 const signs=q.map((p,i)=>cross(p,q[(i+1)%4],q[(i+2)%4]));
 if(Math.abs(area)<1200||signs.some(v=>Math.abs(v)<100)||
  !signs.every(v=>Math.sign(v)===Math.sign(area))||
  !withinQuad(h.pixel,q))
  return blocked('BLOCKED_FOLDED_SELF_INTERSECTING_OR_TOO_SMALL_REFERENCE');
 if(h.positionMm[0]<=1||h.positionMm[0]>=reference.widthMm-1||
  h.positionMm[1]<=1||h.positionMm[1]>=reference.heightMm-1)
  return blocked('BLOCKED_INDEPENDENT_HOLDOUT_OUTSIDE_PHYSICAL_REFERENCE');
 if(q.some(p=>distance(p,h.pixel)<5))
  return blocked('BLOCKED_NOT_INDEPENDENT_FIFTH_FIDUCIAL');
 const map=mapping(q,photo,reference);
 if(!map)return blocked('BLOCKED_UNSTABLE_OR_SINGULAR_PROJECTIVE_SOLVE');
 const expected=[[0,0],[reference.widthMm,0],
  [reference.widthMm,reference.heightMm],[0,reference.heightMm]];
 let maxCornerError=0;
 for(let i=0;i<4;i++){
  const out=map.project(q[i]);
  if(!out)return blocked('BLOCKED_PROJECTIVE_REFERENCE_POLE_OR_NONFINITE');
  maxCornerError=Math.max(maxCornerError,distance(out,expected[i]));
 }
 if(maxCornerError>1e-5)
  return blocked('BLOCKED_PROJECTIVE_CORNER_REPROJECTION_MISMATCH');
 const estimate=map.project(h.pixel);
 if(!estimate)return blocked('BLOCKED_INDEPENDENT_PROJECTIVE_HOLDOUT_NONFINITE');
 // Pixel uncertainty propagated by actual finite-difference projective
 // mapping around independent fifth landmark, instead of a guessed scale.
 let largestShift=0;
 const d=h.pixelUncertaintyPx;
 for(const delta of [[d,0],[-d,0],[0,d],[0,-d],
  [d,d],[d,-d],[-d,d],[-d,-d]]){
  const shift=map.project([h.pixel[0]+delta[0],h.pixel[1]+delta[1]]);
  if(!shift)return blocked('BLOCKED_PROJECTIVE_POLE_NEAR_HOLDOUT');
  largestShift=Math.max(largestShift,distance(shift,estimate));
 }
 const residual=distance(estimate,h.positionMm),
  referenceUncertainty=Math.hypot(reference.widthUncertaintyMm,
   reference.heightUncertaintyMm),
  errorBudget=h.positionUncertaintyMm+largestShift+referenceUncertainty;
 if(![residual,errorBudget].every(isNumber)||errorBudget>25)
  return blocked('BLOCKED_UNBOUNDED_REFERENCE_MEASUREMENT_UNCERTAINTY');
 if(residual>errorBudget)
  return blocked('BLOCKED_INDEPENDENT_FIFTH_POINT_DISAGREES',{
   independentFifthResidualMm:residual,
   independentlyDeclaredErrorBudgetMm:errorBudget
  });
 // Reference-only local magnification is NOT a global garment mm/pixel value.
 // Check local finite differences near 5 measured points, to reject near poles
 // and excessive distortion even if one check point happened to match.
 const scales=[];
 for(const p of [...q,h.pixel]){
  const m=map.project(p),dx=map.project([p[0]+1,p[1]]),
   dy=map.project([p[0],p[1]+1]);
  if(!m||!dx||!dy)return blocked('BLOCKED_PROJECTIVE_REFERENCE_POLE');
  scales.push(distance(dx,m),distance(dy,m));
 }
 const minScale=Math.min(...scales),maxScale=Math.max(...scales);
 if(!isPos(minScale)||!isPos(maxScale)||maxScale/minScale>4)
  return blocked('BLOCKED_STRONGLY_UNSTABLE_PERSPECTIVE_REFERENCE');
 const evidence={
  referenceOnlyNormalizedHomography:[...map.h],
  independentMeasuredFifthLandmarkExpectedMm:[...h.positionMm],
  independentFifthReprojectedMm:estimate,
  independentFifthResidualMm:residual,
  independentlyDeclaredErrorBudgetMm:errorBudget,
  maximumReferenceCornerReprojectionErrorMm:maxCornerError,
  referencePlaneLocalScaleMmPerPixelMin:minScale,
  referencePlaneLocalScaleMmPerPixelMax:maxScale,
  physicalReferenceWidthMm:reference.widthMm,
  physicalReferenceHeightMm:reference.heightMm,
  reportedPhotoSHA256:photo.sha256,
  originalMetadataIsSelfReportedWithoutIndependentCodeAuthentication:true,
  opticalModel:'planar-homography-on-claimed-coplanar-reference-only',
  userClaimsNotIndependentInstrumentAttestation:true
 };
 // No caller can set this function to GREEN for physical consumer clothing.
 if(measurementClass==='synthetic')
  return blocked('RESEARCH_ONLY_SYNTHETIC_FIVE_POINT_REFERENCE_MATH_PASSED',{
   referenceMath:EVIDENCE_COPY(evidence)
  });
 return blocked('BLOCKED_REAL_CALIBRATION_INDEPENDENT_ATTESTATION_AND_BODY_REGISTRATION_PENDING',{
  referenceMath:EVIDENCE_COPY(evidence)
 });
}
function EVIDENCE_COPY(o){return Object.freeze({...o});}
