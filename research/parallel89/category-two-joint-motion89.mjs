/** Two-joint deformation stress trial, not anatomical cloth weighting.
 * Source image-space height provides a provisional blend; no learned or
 * measured material properties, source landmarks or physical fit asserted.
 */
import {moveCategoryWithJoint89} from './category-rigid-joint-motion89.mjs';
import {auditCategoryStaticContact89} from './category-static-body-contact89.mjs';
const hold={consumer3DAdmitted:false,physicalFitProved:false,continuousMotionProved:false,clothDrapeProved:false,anatomicalWeightsVerified:false,originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD',releaseAuthorized:false};
const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
export function blendCategoryTwoJoint89(input){
 const {sourcePositions:p,sourceIndices:idx,lowerDelta,upperDelta}=input;
 const rest=moveCategoryWithJoint89({...input,jointDelta:identity}),a=moveCategoryWithJoint89({...input,jointDelta:lowerDelta}),b=moveCategoryWithJoint89({...input,jointDelta:upperDelta});
 if(!(idx instanceof Uint32Array)||idx.length<3||idx.length%3||idx.some(i=>i>=p.length/3))throw Error('invalid-source-index');
 let lo=Infinity,hi=-Infinity;
 for(let i=1;i<p.length;i+=3){lo=Math.min(lo,p[i]);hi=Math.max(hi,p[i]);}
 if(!(hi>lo))throw Error('zero-source-height');
 const weights=new Float64Array(p.length/3),posed=new Float64Array(p.length);
 let mixed=0;
 for(let i=0;i<p.length/3;i++){
  const t=Math.min(1,Math.max(0,(p[i*3+1]-lo)/(hi-lo))),w=t*t*(3-2*t);
  weights[i]=w;if(w>0&&w<1)mixed++;
  for(let k=0;k<3;k++)posed[i*3+k]=a[i*3+k]*(1-w)+b[i*3+k]*w;
 }
 if(!posed.every(Number.isFinite))throw Error('nonfinite-blended-source');
 let maxEdgeStrain=0,degenerateEdges=0,minAreaRatio=Infinity;
 const distance=(q,u,v)=>Math.hypot(q[3*u]-q[3*v],q[3*u+1]-q[3*v+1],q[3*u+2]-q[3*v+2]);
 const area=(q,u,v,w)=>{const x=[0,1,2].map(k=>q[3*v+k]-q[3*u+k]),y=[0,1,2].map(k=>q[3*w+k]-q[3*u+k]);return Math.hypot(x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]);};
 for(let i=0;i<idx.length;i+=3){
  const u=idx[i],v=idx[i+1],w=idx[i+2];
  for(const [j,k] of [[u,v],[v,w],[w,u]]){const d=distance(rest,j,k),e=distance(posed,j,k);if(d<=1e-12||e<=1e-12){degenerateEdges++;continue}maxEdgeStrain=Math.max(maxEdgeStrain,Math.abs(e/d-1));}
  const ra=area(rest,u,v,w),pa=area(posed,u,v,w);minAreaRatio=Math.min(minAreaRatio,ra>1e-18?pa/ra:0);
 }
 const strainVeto=degenerateEdges>0||maxEdgeStrain>.05||minAreaRatio<.5;
 return {rest,posed,weights,mixedVertices:mixed,maxEdgeStrain,degenerateEdges,minAreaRatio,strainVeto};
}
export function auditCategoryTwoJointPose89(input){
 const r=blendCategoryTwoJoint89(input);
 const contact=auditCategoryStaticContact89({...input,sourcePositions:r.posed,scale:1,translation:[0,0,0]});
 return {status:'TWO_JOINT_DEFORMATION_RESEARCH_ONLY',...r,contact,
  decision:r.strainVeto?'BLOCKED_DEFORMATION_STRAIN':contact.status==='NO_DISCRETE_SURFACE_CONTACT_DETECTED'?'DISCRETE_RESEARCH_TRIAL_ONLY':'BLOCKED_CONTACT_OR_INDETERMINATE',
  sourceGeometryUnmodified:true,weightMethod:'unverified normalized source-height smoothstep',...hold};
}
