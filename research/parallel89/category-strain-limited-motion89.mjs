/** Research-only strain-limited interpolation. The requested body pose
 * never changes. Reduce differential joint influence only, not test limits.
 * No claim of material behavior or independently calibrated cloth weights.
 */
import {blendCategoryTwoJoint89} from './category-two-joint-motion89.mjs';
import {moveCategoryWithJoint89} from './category-rigid-joint-motion89.mjs';
import {auditCategoryStaticContact89} from './category-static-body-contact89.mjs';
const hold={consumer3DAdmitted:false,physicalFitProved:false,continuousMotionProved:false,clothDrapeProved:false,anatomicalWeightsVerified:false,originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD',releaseAuthorized:false};
function metrics(rest,posed,idx){
 let maxEdgeStrain=0,minAreaRatio=Infinity,degenerateEdges=0;
 const dist=(p,a,b)=>Math.hypot(p[a*3]-p[b*3],p[a*3+1]-p[b*3+1],p[a*3+2]-p[b*3+2]);
 const area=(p,a,b,c)=>{
  const x=p[b*3]-p[a*3],y=p[b*3+1]-p[a*3+1],z=p[b*3+2]-p[a*3+2],u=p[c*3]-p[a*3],v=p[c*3+1]-p[a*3+1],w=p[c*3+2]-p[a*3+2];
  return Math.hypot(y*w-z*v,z*u-x*w,x*v-y*u);
 };
 for(let i=0;i<idx.length;i+=3){
  const a=idx[i],b=idx[i+1],c=idx[i+2];
  for(const [u,v] of [[a,b],[b,c],[c,a]]){
   const d=dist(rest,u,v),e=dist(posed,u,v);
   if(d<=1e-12||e<=1e-12){degenerateEdges++;continue}
   maxEdgeStrain=Math.max(maxEdgeStrain,Math.abs(e/d-1));
  }
  const r=area(rest,a,b,c);minAreaRatio=Math.min(minAreaRatio,r>1e-18?area(posed,a,b,c)/r:0);
 }
 return {maxEdgeStrain,minAreaRatio,degenerateEdges,strainVeto:degenerateEdges>0||maxEdgeStrain>.05||minAreaRatio<.5};
}
export function limitCategoryJointStrain89(input){
 const b=blendCategoryTwoJoint89(input),rigid=moveCategoryWithJoint89({...input,jointDelta:input.upperDelta}),attempts=[];
 const base={baselineStrain:b.maxEdgeStrain,baselineStrainVeto:b.strainVeto,sourceGeometryUnmodified:true,...hold};
 for(const influence of [1,.75,.5,.25,.125]){
  const posed=new Float64Array(b.posed.length);
  for(let i=0;i<posed.length;i++)posed[i]=rigid[i]+influence*(b.posed[i]-rigid[i]);
  const m=metrics(b.rest,posed,input.sourceIndices);
  if(!posed.every(Number.isFinite)||!Number.isFinite(m.maxEdgeStrain)||!Number.isFinite(m.minAreaRatio))throw Error('invalid-strain-candidate');
  const attempt={influence,...m};attempts.push(attempt);
  if(m.strainVeto)continue;
  const contact=auditCategoryStaticContact89({...input,sourcePositions:posed,scale:1,translation:[0,0,0]});
  attempt.contactStatus=contact.status;
  if(contact.status!=='NO_DISCRETE_SURFACE_CONTACT_DETECTED')continue;
  // Weight of the lower joint stays positive wherever it had influence.
  // No zero-influence rigid fallback or relaxed strain threshold.
  let differentialDisplacement=0;
  for(let i=0;i<posed.length;i+=3)differentialDisplacement=Math.max(differentialDisplacement,Math.hypot(posed[i]-rigid[i],posed[i+1]-rigid[i+1],posed[i+2]-rigid[i+2]));
  return {status:'STRAIN_LIMITED_DISCRETE_RESEARCH_ONLY',...base,influence,posed,...m,contact,attempts,differentialDisplacement};
 }
 return {status:'BLOCKED_NO_STRAIN_AND_CONTACT_CLEAR_CANDIDATE',...base,attempts};
}
