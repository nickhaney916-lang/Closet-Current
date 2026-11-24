/** Rigid named-joint attachment trial. No multi-bone cloth skinning or drape.
 * The source volume, photograph and indices remain immutable.
 */
import {auditCategoryStaticContact89} from './category-static-body-contact89.mjs';
const hold={consumer3DAdmitted:false,physicalFitProved:false,continuousMotionProved:false,clothDrapeProved:false,originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD',releaseAuthorized:false};
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export function moveCategoryWithJoint89({sourcePositions,scale,translation,jointDelta}={}){
 if(!(sourcePositions instanceof Float32Array||sourcePositions instanceof Float64Array)||!sourcePositions.length||sourcePositions.length%3||!sourcePositions.every(Number.isFinite)||!Number.isFinite(scale)||scale<=0||!Array.isArray(translation)||translation.length!==3||!translation.every(Number.isFinite)||!Array.isArray(jointDelta)||jointDelta.length!==16||!jointDelta.every(Number.isFinite))throw Error('invalid-source-or-joint-transform');
 const m=jointDelta,tol=1e-5;
 if([m[3],m[7],m[11],m[15]-1].some(v=>Math.abs(v)>tol))throw Error('not-affine-joint-transform');
 const axes=[[m[0],m[1],m[2]],[m[4],m[5],m[6]],[m[8],m[9],m[10]]];
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(Math.abs(dot(axes[i],axes[j])-(i===j?1:0))>tol)throw Error('joint-transform-not-rigid');
 const [a,b,c]=axes,det=a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);
 if(Math.abs(det-1)>tol)throw Error('joint-transform-reflection');
 const posed=new Float64Array(sourcePositions.length);
 for(let i=0;i<sourcePositions.length;i+=3){
  const x=sourcePositions[i]*scale+translation[0],y=sourcePositions[i+1]*scale+translation[1],z=sourcePositions[i+2]*scale+translation[2];
  posed[i]=m[0]*x+m[4]*y+m[8]*z+m[12];
  posed[i+1]=m[1]*x+m[5]*y+m[9]*z+m[13];
  posed[i+2]=m[2]*x+m[6]*y+m[10]*z+m[14];
 }
 if(!posed.every(Number.isFinite))throw Error('nonfinite-posed-source');
 return posed;
}
export function auditCategoryJointPose89(input){
 const posed=moveCategoryWithJoint89(input);
 const contact=auditCategoryStaticContact89({...input,sourcePositions:posed,scale:1,translation:[0,0,0]});
 return {status:'RIGID_SINGLE_JOINT_POSE_RESEARCH_ONLY',posed,contact,sourceGeometryUnmodified:true,rigidAttachmentOnly:true,...hold};
}
