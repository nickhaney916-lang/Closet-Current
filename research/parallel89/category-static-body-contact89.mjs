/** Static complete-index scope contact trial for source-derived volumes.
 * A negative surface test does not establish outside-body containment or fit.
 * Positive contact is a veto, not a numerical fitting correction.
 */
import {evaluateFullIndexedContact,classifyExactTriangleContact} from './full-indexed-contact-calibration89.mjs';
const hold={consumer3DAdmitted:false,physicalFitProved:false,signedOutsideBodyProved:false,continuousMotionProved:false,originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD',releaseAuthorized:false};
const tri=(positions,indices,scale=1,offset=[0,0,0])=>{
 if(!(positions instanceof Float32Array||positions instanceof Float64Array)||!(indices instanceof Uint32Array)||positions.length%3||indices.length%3||!positions.length||!indices.length||indices.length/3>150000||positions.length/3>300000||!positions.every(Number.isFinite)||!Number.isFinite(scale)||scale<=0||!Array.isArray(offset)||offset.length!==3||!offset.every(Number.isFinite))throw Error('invalid-complete-index-scope');
 const n=positions.length/3,faces=[];
 for(let i=0;i<indices.length;i+=3){
  const t=[];for(let j=0;j<3;j++){const k=indices[i+j];if(k>=n)throw Error('invalid-face-index');t.push(offset.map((x,c)=>positions[k*3+c]*scale+x));}faces.push(t);
 }
 return faces;
};
export function auditCategoryStaticContact89({bodyPositions,bodyIndices,sourcePositions,sourceIndices,scale,translation,sourcePlaneIndexCount,maxPairs=8000000,maxExactAABBPairs=2000000}={}){
 const body=tri(bodyPositions,bodyIndices),garment=tri(sourcePositions,sourceIndices,scale,translation);
 if(!Number.isSafeInteger(sourcePlaneIndexCount)||sourcePlaneIndexCount<3||sourcePlaneIndexCount%3||sourcePlaneIndexCount>=sourceIndices.length)throw Error('complete-source-and-inferred-faces-required');
 const result=evaluateFullIndexedContact(body,garment,{maxPairs,maxExactAABBPairs,stopAtFirstVerifiedContact:true,reportResourceBlockerInsteadOfThrow:true});
 const first=result.firstObservedContactFaceIndices;
 const region=first?(first.frontFace<sourcePlaneIndexCount/3?'SOURCE_VIEW_PLANE':'INFERRED_NEUTRAL_SURFACE'):null;
 return {status:result.definitiveCollisionRejection?'STATIC_CONTACT_VETO':result.fullOriginalIndexedScopeEvaluated&&result.contactDecision==='NO_CONTACT_DETECTED_IN_COMPLETE_DISCRETE_FACE_AUDIT'?'NO_DISCRETE_SURFACE_CONTACT_DETECTED':'STATIC_CONTACT_INDETERMINATE',
  bodyFacesSubmitted:body.length,garmentFacesSubmitted:garment.length,sourcePlaneFaces:sourcePlaneIndexCount/3,inferredFaces:garment.length-sourcePlaneIndexCount/3,
  firstObservedCandidateRegion:region,contact:result,...hold};
}
/** Find an exact positive contact control on genuine source/body triangles.
 * Translation is intentionally adversarial in all axes, not a fit result.
 */
export function realTriangleContactControl89({bodyPositions,bodyIndices,sourcePositions,sourceIndices,scale,translation,sourcePlaneIndexCount}){
 const body=tri(bodyPositions,bodyIndices),garment=tri(sourcePositions,sourceIndices,scale,translation);
 const centroid=t=>[0,1,2].map(k=>(t[0][k]+t[1][k]+t[2][k])/3);
 const sourceCount=sourcePlaneIndexCount/3;
 for(let i=0;i<Math.min(sourceCount,16);i++){
  const fi=Math.floor((i+.5)*sourceCount/Math.min(sourceCount,16)),f=garment[fi],a=centroid(f);
  for(let j=0;j<128;j++){
   const bi=Math.floor((j+.5)*body.length/128),b=body[bi],bc=centroid(b),delta=bc.map((v,k)=>v-a[k]);
   const moved=f.map(p=>p.map((v,k)=>v+delta[k])),c=classifyExactTriangleContact(moved,b);
   if(c==='CROSSING'||c==='COPLANAR_OVERLAP'){
    const shifted=translation.map((v,k)=>v+delta[k]);
    return {sourceFace:fi,bodyFace:bi,classification:c,translation:shifted,deliberatelyAdversarialNotFit:true};
   }
  }
 }
 return null;
}
